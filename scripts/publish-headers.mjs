import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Publish `src/headers/_headers` into `dist/` and enforce Cloudflare's limits.
 *
 * The file stays out of `public/` so `pnpm build` for GitHub Pages never ships
 * `_headers`. `pnpm build:worker` copies it after Markdown generation.
 * `script-src 'self'` is a literal because `vite.build.assetsInlineLimit: 0`
 * emits the landing module as `/_astro/*.js`.
 */
const outputDirectory = resolve('dist');
const templatePath = resolve('src/headers/_headers');
const outputPath = resolve(outputDirectory, '_headers');


/** Count Cloudflare header rules by their unindented path or URL selectors. */
function countRules(source) {
  return source.split(/\r?\n/).filter((line) => line.length > 0 && !/^\s/.test(line)).length;
}

const template = await readFile(templatePath, 'utf8');
if (/\{\{[A-Z_]+\}\}/.test(template)) {
  throw new Error(`${templatePath} still contains a build-time token; the published policy must be literal.`);
}

const rendered = template.replace(/[ \t]+$/gm, '');
const longestLine = Math.max(...rendered.split(/\r?\n/).map((line) => line.length));
if (longestLine >= 2_000) {
  throw new Error(`Published _headers line is ${longestLine} characters; every line must remain under 2,000.`);
}

const ruleCount = countRules(rendered);
if (ruleCount > 100) {
  throw new Error(`Published _headers contains ${ruleCount} rules; Cloudflare permits at most 100.`);
}

await writeFile(outputPath, rendered.endsWith('\n') ? rendered : `${rendered}\n`, 'utf8');
