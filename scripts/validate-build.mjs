import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const read = (path) => readFile(resolve(dist, path), 'utf8');

const requiredFiles = ['index.html', 'about/index.html', 'process/index.html', 'contact/index.html', 'thank-you/index.html', '404.html', 'CNAME', 'robots.txt', 'llms.txt', 'sitemap-index.xml', 'sitemap-0.xml'];
for (const file of requiredFiles) await stat(resolve(dist, file));

if ((await read('CNAME')).trim() !== 'shoppa.au') throw new Error('dist/CNAME must contain exactly shoppa.au.');

const htmlFiles = ['index.html', 'about/index.html', 'process/index.html', 'contact/index.html', 'thank-you/index.html', '404.html'];
const html = (await Promise.all(htmlFiles.map(read))).join('\n');
for (const forbidden of ['Algolia', 'Coveo', 'Elasticsearch', 'self-service', 'analytics', 'Embeddings', 'Convex', 'mock mode', '/shoppa-root/']) {
  if (html.includes(forbidden)) throw new Error(`Built output contains forbidden text: ${forbidden}`);
}
for (const required of ['The shopping agent that’s', 'One conversation from ‘I’m looking for…’ to ‘it’s on its way’', 'Your catalogue is your agent’s brain.']) {
  if (!(await read('index.html')).includes(required)) throw new Error(`Home page is missing required copy: ${required}`);
}

for (const page of await Promise.all(htmlFiles.map(read))) {
  if (!/<title>[^<]+<\/title>/.test(page) || !/<meta name="description" content="[^"]+">/.test(page)) throw new Error('Every page requires title and description metadata.');
  for (const match of page.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href) || /\.[a-z\d]+(?:\?.*)?$/i.test(href)) continue;
    if (!href.endsWith('/') && !href.includes('/#')) throw new Error(`Internal link must end in / or target an anchor: ${href}`);
  }
}

const sitemap = `${await read('sitemap-index.xml')}\n${await read('sitemap-0.xml')}`;
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/shoppa\.au\/[^<]*)<\/loc>/g)].map((match) => match[1]).filter((url) => !url.includes('sitemap-'));
const expectedUrls = ['https://shoppa.au/', 'https://shoppa.au/about/', 'https://shoppa.au/contact/', 'https://shoppa.au/process/'];
if (JSON.stringify(sitemapUrls.sort()) !== JSON.stringify(expectedUrls.sort())) throw new Error(`Unexpected sitemap membership: ${sitemapUrls.join(', ')}`);

const robots = await read('robots.txt');
if (!robots.includes('Allow: /') || !robots.includes('Sitemap: https://shoppa.au/sitemap-index.xml')) throw new Error('robots.txt has an invalid production policy.');
const llms = await read('llms.txt');
if (!llms.startsWith('# Shoppa\n\n> ') || !llms.includes('## Primary')) throw new Error('llms.txt does not follow the required v2 structure.');

console.log(`Validated ${requiredFiles.length} build artefacts and ${htmlFiles.length} HTML routes.`);
