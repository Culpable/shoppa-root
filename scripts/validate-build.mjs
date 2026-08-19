import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const read = (path) => readFile(resolve(dist, path), 'utf8');
const readBuffer = (path) => readFile(resolve(dist, path));

const identityFiles = ['favicon.ico', 'icon.svg', 'apple-icon.png'];
const requiredFiles = ['index.html', 'about/index.html', 'process/index.html', 'contact/index.html', 'thank-you/index.html', '404.html', 'CNAME', 'robots.txt', 'llms.txt', 'sitemap-index.xml', 'sitemap-0.xml', ...identityFiles];
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

for (const file of identityFiles) {
  const [source, built] = await Promise.all([readFile(resolve(root, 'public', file)), readBuffer(file)]);
  if (!source.equals(built)) throw new Error(`Built identity asset differs from public/${file}.`);
}

const favicon = await readBuffer('favicon.ico');
if (favicon.readUInt16LE(0) !== 0 || favicon.readUInt16LE(2) !== 1) throw new Error('favicon.ico has an invalid ICO header.');

const frameCount = favicon.readUInt16LE(4);
const frames = Array.from({ length: frameCount }, (_, index) => {
  const entryOffset = 6 + index * 16;
  const width = favicon[entryOffset] || 256;
  const height = favicon[entryOffset + 1] || 256;
  const bitDepth = favicon.readUInt16LE(entryOffset + 6);
  const imageOffset = favicon.readUInt32LE(entryOffset + 12);
  if (bitDepth !== 32) throw new Error(`favicon.ico ${width}x${height} frame must use 32-bit colour.`);

  const headerSize = favicon.readUInt32LE(imageOffset);
  const bitmapWidth = favicon.readInt32LE(imageOffset + 4);
  const bitmapHeight = Math.abs(favicon.readInt32LE(imageOffset + 8)) / 2;
  const compression = favicon.readUInt32LE(imageOffset + 16);
  if (headerSize !== 40 || bitmapWidth !== width || bitmapHeight !== height || compression !== 0) throw new Error(`favicon.ico ${width}x${height} frame has an unsupported bitmap layout.`);

  const pixelOffset = imageOffset + headerSize;
  const rowStride = width * 4;
  const alphaAt = (x, y) => favicon[pixelOffset + y * rowStride + x * 4 + 3];
  const cornerAlphas = [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)];
  if (cornerAlphas.some((alpha) => alpha === 255)) throw new Error(`favicon.ico ${width}x${height} frame has an opaque corner.`);
  return { width, height };
});

const frameSizes = frames.map(({ width, height }) => `${width}x${height}`).sort();
const expectedFrameSizes = ['16x16', '32x32', '48x48'];
if (JSON.stringify(frameSizes) !== JSON.stringify(expectedFrameSizes)) throw new Error(`favicon.ico has unexpected frame sizes: ${frameSizes.join(', ')}.`);
if (!html.includes('<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">')) throw new Error('Pages must declare the ICO favicon with its exact raster sizes.');
if (!html.includes('<link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any">')) throw new Error('Pages must declare the scalable SVG favicon for any size.');

console.log(`Validated ${requiredFiles.length} build artefacts and ${htmlFiles.length} HTML routes.`);
