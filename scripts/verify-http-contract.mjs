#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import './host-override.mjs'

const HELP = `Usage:
  node verify-http-contract.mjs --manifest <contract.json> [--base-url <url>]
  node verify-http-contract.mjs <contract.json> [--base-url <url>]

Manifest:
  {
    "baseUrl": "http://127.0.0.1:8787",
    "timeoutMs": 10000,
    "sensitiveHeaders": ["authorization", "set-cookie"],
    "cases": [
      {
        "name": "home",
        "path": "/",
        "method": "GET",
        "headers": {},
        "body": null,
        "redirect": "manual",
        "expect": {
          "status": 200,
          "headers": {
            "content-type": { "includes": ["text/html", "charset=utf-8"] },
            "x-internal": { "absent": true }
          },
          "utf8": true,
          "bodyIncludes": ["Expected text"],
          "bodyExcludes": ["Known bad text"],
          "bodyEqualsFile": "dist/index.html"
        }
      }
    ]
  }

Status may be one number or an array of allowed numbers. Header rules support a
string equality check or the keys equals, includes, excludes, matches, present,
and absent. File paths are resolved relative to the manifest. The runner makes
no Cloudflare account changes and exits on the first failed case.`;

function parseArgs(argv) {
  const args = { manifest: null, baseUrl: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      process.stdout.write(`${HELP}\n`);
      process.exit(0);
    }
    if (value === "--manifest") {
      args.manifest = argv[++index];
      continue;
    }
    if (value === "--base-url") {
      args.baseUrl = argv[++index];
      continue;
    }
    if (!value.startsWith("-") && !args.manifest) {
      args.manifest = value;
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${value}`);
  }
  if (!args.manifest) throw new Error("A manifest path is required.");
  return args;
}

function list(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function makeSensitiveSet(manifest, test) {
  return new Set(
    [...list(manifest.sensitiveHeaders), ...list(test.sensitiveHeaders)].map((name) =>
      String(name).toLowerCase(),
    ),
  );
}

function redactHeader(name, value, sensitive) {
  return sensitive.has(name.toLowerCase()) ? "<redacted>" : value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertHeader(name, actual, rule, sensitive) {
  const shown = redactHeader(name, actual ?? "<absent>", sensitive);
  if (typeof rule === "string") {
    assert(actual === rule, `${name}: expected ${JSON.stringify(rule)}, received ${JSON.stringify(shown)}`);
    return;
  }
  assert(rule && typeof rule === "object", `${name}: header rule must be a string or object`);
  if (rule.present === true) assert(actual !== null, `${name}: expected header to be present`);
  if (rule.absent === true) assert(actual === null, `${name}: expected header to be absent, received ${JSON.stringify(shown)}`);
  if (rule.equals !== undefined) {
    assert(actual === String(rule.equals), `${name}: expected ${JSON.stringify(rule.equals)}, received ${JSON.stringify(shown)}`);
  }
  for (const marker of list(rule.includes)) {
    assert(actual?.includes(String(marker)), `${name}: expected ${JSON.stringify(shown)} to include ${JSON.stringify(marker)}`);
  }
  for (const marker of list(rule.excludes)) {
    assert(!actual?.includes(String(marker)), `${name}: expected ${JSON.stringify(shown)} to exclude ${JSON.stringify(marker)}`);
  }
  for (const pattern of list(rule.matches)) {
    const expression = typeof pattern === "string" ? new RegExp(pattern) : new RegExp(pattern.pattern, pattern.flags);
    assert(expression.test(actual ?? ""), `${name}: expected ${JSON.stringify(shown)} to match ${expression}`);
  }
}

async function readManifest(path) {
  const absolutePath = resolve(path);
  const raw = await readFile(absolutePath, "utf8");
  const manifest = JSON.parse(raw);
  assert(manifest && typeof manifest === "object", "Manifest must be a JSON object.");
  assert(Array.isArray(manifest.cases) && manifest.cases.length > 0, "Manifest cases must be a non-empty array.");
  return { absolutePath, directory: dirname(absolutePath), manifest };
}

function resolveUrl(baseUrl, path) {
  assert(baseUrl, "A baseUrl is required in the manifest or --base-url.");
  assert(typeof path === "string", "Each case requires a string path.");
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

async function runCase(test, context) {
  assert(test && typeof test === "object", "Each case must be an object.");
  assert(typeof test.name === "string" && test.name.length > 0, "Each case requires a name.");
  assert(test.expect && typeof test.expect === "object", `${test.name}: expect must be an object`);

  const url = resolveUrl(context.baseUrl, test.path);
  const method = String(test.method ?? "GET").toUpperCase();
  const redirect = test.redirect ?? "manual";
  assert(["manual", "follow", "error"].includes(redirect), `${test.name}: redirect must be manual, follow, or error`);
  const timeoutMs = Number(test.timeoutMs ?? context.timeoutMs ?? 10_000);
  assert(Number.isFinite(timeoutMs) && timeoutMs > 0, `${test.name}: timeoutMs must be a positive number`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: test.headers,
      body: test.body === null || test.body === undefined ? undefined : String(test.body),
      redirect,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const expectedStatuses = list(test.expect.status).map(Number);
  assert(expectedStatuses.length > 0, `${test.name}: expect.status is required`);
  assert(
    expectedStatuses.includes(response.status),
    `${test.name}: expected status ${expectedStatuses.join(" or ")}, received ${response.status}`,
  );

  const sensitive = makeSensitiveSet(context.manifest, test);
  for (const [name, rule] of Object.entries(test.expect.headers ?? {})) {
    assertHeader(name, response.headers.get(name), rule, sensitive);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  let bodyText;
  const needsText =
    test.expect.utf8 === true ||
    list(test.expect.bodyIncludes).length > 0 ||
    list(test.expect.bodyExcludes).length > 0;
  if (needsText) {
    try {
      bodyText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error(`${test.name}: response body is not valid UTF-8`);
    }
  }

  for (const marker of list(test.expect.bodyIncludes)) {
    assert(bodyText.includes(String(marker)), `${test.name}: response body does not include ${JSON.stringify(marker)}`);
  }
  for (const marker of list(test.expect.bodyExcludes)) {
    assert(!bodyText.includes(String(marker)), `${test.name}: response body includes forbidden marker ${JSON.stringify(marker)}`);
  }

  if (test.expect.bodyEqualsFile !== undefined) {
    const artifactPath = resolve(context.manifestDirectory, String(test.expect.bodyEqualsFile));
    const artifact = new Uint8Array(await readFile(artifactPath));
    assert(
      bytes.length === artifact.length && bytes.every((byte, index) => byte === artifact[index]),
      `${test.name}: response bytes differ from ${artifactPath}`,
    );
  }

  return { durationMs: Math.round(performance.now() - started), status: response.status, url: url.href };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const loaded = await readManifest(args.manifest);
  const baseUrl = args.baseUrl ?? loaded.manifest.baseUrl;
  const context = {
    baseUrl,
    manifest: loaded.manifest,
    manifestDirectory: loaded.directory,
    timeoutMs: loaded.manifest.timeoutMs,
  };

  for (const test of loaded.manifest.cases) {
    try {
      const result = await runCase(test, context);
      process.stdout.write(`PASS  ${test.name}  ${result.status}  ${result.durationMs}ms  ${result.url}\n`);
    } catch (error) {
      process.stderr.write(`FAIL  ${test?.name ?? "unnamed case"}  ${error.message}\n`);
      process.exitCode = 1;
      return;
    }
  }

  process.stdout.write(`PASS  ${loaded.manifest.cases.length} HTTP contract case(s)\n`);
}

main().catch((error) => {
  process.stderr.write(`FAIL  ${error.message}\n`);
  process.exitCode = 1;
});
