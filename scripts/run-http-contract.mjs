import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASTRO_ASSET_TOKEN = '{{ASTRO_ASSET_PATH}}';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, '..');
const manifestPath = resolve(projectDirectory, 'test/http-contract.json');
const astroAssetsDirectory = resolve(projectDirectory, 'dist/_astro');

/**
 * Run the shared HTTP verifier and preserve its terminal output and exit code.
 */
function runVerifier(runtimeManifestPath, baseUrl) {
  const argumentsList = [
    resolve(scriptDirectory, 'verify-http-contract.mjs'),
    '--manifest',
    runtimeManifestPath,
  ];
  if (baseUrl) argumentsList.push('--base-url', baseUrl);

  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, argumentsList, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) reject(new Error(`HTTP verifier ended after signal ${signal}.`));
      else resolveResult(code ?? 1);
    });
  });
}

const assetNames = (await readdir(astroAssetsDirectory))
  .filter((name) => /\.[a-z0-9_-]{6,}\.(?:css|js|woff2?)$/i.test(name))
  .sort();
const assetName = assetNames[0];
if (!assetName) {
  throw new Error(`No fingerprinted CSS, JavaScript, or font asset exists in ${astroAssetsDirectory}.`);
}

const source = await readFile(manifestPath, 'utf8');
const tokenMatches = source.match(/\{\{ASTRO_ASSET_PATH\}\}/g) ?? [];
if (tokenMatches.length !== 1) {
  throw new Error(`Expected exactly one ${ASTRO_ASSET_TOKEN} token in ${manifestPath}.`);
}

const manifest = JSON.parse(source.replace(ASTRO_ASSET_TOKEN, `/_astro/${assetName}`));
for (const testCase of manifest.cases) {
  if (testCase.expect?.bodyEqualsFile) {
    testCase.expect.bodyEqualsFile = resolve(dirname(manifestPath), testCase.expect.bodyEqualsFile);
  }
}

const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'shoppa-http-contract-'));
const runtimeManifestPath = resolve(temporaryDirectory, 'http-contract.json');

try {
  await writeFile(runtimeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  // Accept the base URL positionally or as `--base-url <url>`, the flag the
  // verifier itself takes, so the hosted checks cannot silently run against the
  // literal string `--base-url` and report an unrelated failure.
  const runnerArguments = process.argv.slice(2);
  const flagIndex = runnerArguments.indexOf('--base-url');
  const baseUrl = flagIndex === -1 ? runnerArguments[0] : runnerArguments[flagIndex + 1];
  const exitCode = await runVerifier(runtimeManifestPath, baseUrl);
  process.exitCode = exitCode;
} finally {
  await unlink(runtimeManifestPath).catch(() => undefined);
  await rmdir(temporaryDirectory).catch(() => undefined);
}
