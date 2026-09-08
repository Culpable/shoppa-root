import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './host-override.mjs';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:8787').origin;
const outputPath = process.argv[3];
const results = [];

const documents = [
  ['/', 'index'],
  ['/about/', 'about/index'],
  ['/process/', 'process/index'],
  ['/contact/', 'contact/index'],
  ['/privacy/', 'privacy/index'],
  ['/thank-you/', 'thank-you/index'],
];

for (const [route, asset] of documents) {
  const response = await fetch(`${origin}${route}`, { headers: { Accept: 'text/markdown' } });
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('content-type') ?? '', /text\/markdown/);
  const body = await response.text();
  assert.equal(body, readFileSync(resolve(import.meta.dirname, `../dist/_agent-markdown/${asset}.md`), 'utf8'), route);
  results.push({ route, markdownMatchesBuild: true });
}

const html = await fetch(`${origin}/about/`, { headers: { Accept: 'text/html' } });
assert.equal(html.status, 200);
const etag = html.headers.get('etag');
assert.ok(etag, 'HTML response must expose an ETag for conditional verification');
const conditionalMarkdown = await fetch(`${origin}/about/`, { headers: { Accept: 'text/markdown', 'If-None-Match': etag } });
assert.equal(conditionalMarkdown.status, 200);
assert.equal(await conditionalMarkdown.text(), readFileSync(resolve(import.meta.dirname, '../dist/_agent-markdown/about/index.md'), 'utf8'));
const conditionalHtml = await fetch(`${origin}/about/`, { headers: { Accept: 'text/html', 'If-None-Match': etag } });
assert.equal(conditionalHtml.status, 304);
assert.equal(await conditionalHtml.text(), '');
const redirect = await fetch(`${origin}/about`, { redirect: 'manual', headers: { Accept: 'text/markdown' } });
assert.equal(redirect.status, 307);
assert.equal(await redirect.text(), '');
const head = await fetch(`${origin}/about/`, { method: 'HEAD', headers: { Accept: 'text/markdown', 'If-None-Match': etag } });
assert.equal(head.status, 200);
assert.equal(await head.text(), '');
results.push({ conditionalMarkdown: 200, conditionalHtml: 304, markdownRedirect: 307, headBodyEmpty: true });

const home = await fetch(`${origin}/`, { headers: { Accept: 'text/markdown' } });
const homeMarkdown = await home.text();
for (const marker of ['# The shopping agent that’s actually yours', 'Shoppa drops into your site with two lines of code.']) {
  assert.ok(homeMarkdown.includes(marker), `home Markdown is missing ${marker}`);
}
const llms = await fetch(`${origin}/llms.txt`);
assert.equal(llms.status, 200);
assert.match(await llms.text(), /retailer’s own site/);
const evidence = { origin, checkedAt: new Date().toISOString(), results };
if (outputPath) writeFileSync(resolve(outputPath), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('PASS deployed Markdown matches the built documents; conditional HTML/Markdown, redirects, HEAD, and homepage markers');
