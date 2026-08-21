import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { composeDocumentTitle, resolveCanonicalURL, resolvePageMetadata } from '../src/lib/metadata.ts';
import { createSitemapPlan, renderPrimarySitemap, renderSitemapChunk } from '../src/lib/sitemap.ts';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const read = (path) => readFile(resolve(dist, path), 'utf8');
const readBuffer = (path) => readFile(resolve(dist, path));

const contactMetadata = {
  title: 'Contact Us',
  description: 'Contact us to put your own AI shopping agent on your site.',
};
const resolvedContactMetadata = resolvePageMetadata(contactMetadata);
assert.equal(resolvedContactMetadata.pageTitle, 'Contact Us');
assert.equal(resolvedContactMetadata.documentTitle, 'Contact Us / Shoppa');
assert.equal(composeDocumentTitle('Shoppa: The AI Shopping Agent Australian Retailers Own', 'absolute'), 'Shoppa: The AI Shopping Agent Australian Retailers Own');

const alternateTitleConfig = { name: 'Example Site', titleSeparator: ' | ' };
assert.equal(resolvePageMetadata(contactMetadata, alternateTitleConfig).documentTitle, 'Contact Us | Example Site');
assert.equal(composeDocumentTitle('Campaign title', 'absolute', alternateTitleConfig), 'Campaign title');
assert.throws(() => composeDocumentTitle(''), /Page title must not be empty/);
assert.throws(() => resolvePageMetadata({ title: 'Contact Us', description: '' }), /Page description must not be empty/);
assert.throws(() => composeDocumentTitle('Contact Us', 'composed', { name: '', titleSeparator: ' / ' }), /Site name must not be empty/);
assert.throws(() => composeDocumentTitle('Contact Us', 'composed', { name: 'Shoppa', titleSeparator: '' }), /Title separator must not be empty/);
assert.throws(() => composeDocumentTitle('Contact Us / Shoppa'), /Pass an uncomposed page title/);
assert.throws(() => composeDocumentTitle('Contact Us', 'invalid'), /Unsupported title mode/);

const productionSite = new URL('https://shoppa.au/');
assert.equal(resolveCanonicalURL({ currentPath: '/contact/', siteURL: productionSite }).href, 'https://shoppa.au/contact/');
assert.equal(resolveCanonicalURL({ canonicalPath: '/404.html', currentPath: '/404/', siteURL: productionSite }).href, 'https://shoppa.au/404.html');
assert.throws(() => resolveCanonicalURL({ canonicalPath: '', currentPath: '/contact/', siteURL: productionSite }), /Canonical path must not be empty/);
assert.throws(() => resolveCanonicalURL({ canonicalPath: 'https://user:pass@shoppa.au/contact/', currentPath: '/contact/', siteURL: productionSite }), /must not contain credentials/);
assert.throws(() => resolveCanonicalURL({ canonicalPath: 'http://localhost:4321/contact/', currentPath: '/contact/', siteURL: productionSite }), /configured production origin/);
assert.throws(() => resolveCanonicalURL({ canonicalPath: '/contact/?preview=true', currentPath: '/contact/', siteURL: productionSite }), /query string or fragment/);

const identityFiles = ['favicon.ico', 'icon.svg', 'apple-icon.png'];
const requiredFiles = ['index.html', 'about/index.html', 'process/index.html', 'contact/index.html', 'thank-you/index.html', '404.html', 'CNAME', 'robots.txt', 'llms.txt', 'sitemap.xml', ...identityFiles];
for (const file of requiredFiles) await stat(resolve(dist, file));
const sitemapFiles = (await readdir(dist, { recursive: true })).filter((file) => file.endsWith('.xml') && file.includes('sitemap')).sort();
assert.deepEqual(sitemapFiles, ['sitemap.xml']);

const directPlan = createSitemapPlan({ siteRoot: 'https://shoppa.au/', entries: [{ path: '/' }, { path: '/about/' }] });
assert.equal(directPlan.indexed, false);
assert.match(renderPrimarySitemap(directPlan), /<urlset[^>]*>[\s\S]*https:\/\/shoppa\.au\/about\/[\s\S]*<\/urlset>/);

const indexedPlan = createSitemapPlan({ siteRoot: 'https://shoppa.au/', entries: [{ path: '/' }, { path: '/about/' }, { path: '/contact/' }], maxUrlsPerFile: 2 });
assert.equal(indexedPlan.indexed, true);
assert.match(renderPrimarySitemap(indexedPlan), /<sitemapindex[^>]*>[\s\S]*https:\/\/shoppa\.au\/sitemap-2\.xml[\s\S]*<\/sitemapindex>/);
assert.doesNotMatch(renderSitemapChunk(indexedPlan, 0), /<sitemapindex/);
assert.throws(() => createSitemapPlan({ siteRoot: 'https://shoppa.au/', entries: [{ path: '/' }, { path: '/' }] }), /Duplicate sitemap URL/);
assert.throws(() => createSitemapPlan({ siteRoot: 'https://shoppa.au/', entries: [{ path: `/${'x'.repeat(2_100)}/` }] }), /shorter than 2,048 characters/);
assert.throws(() => createSitemapPlan({ siteRoot: `https://shoppa.au/${'x'.repeat(2_016)}/`, entries: [{ path: '/' }, { path: '/a/' }], maxUrlsPerFile: 1 }), /shorter than 2,048 characters/);

if ((await read('CNAME')).trim() !== 'shoppa.au') throw new Error('dist/CNAME must contain exactly shoppa.au.');

const htmlRoutes = [
  { file: 'index.html', title: 'Shoppa: The AI Shopping Agent Australian Retailers Own', canonical: 'https://shoppa.au/', indexable: true },
  { file: 'about/index.html', title: 'About Us / Shoppa', canonical: 'https://shoppa.au/about/', indexable: true },
  { file: 'process/index.html', title: 'From Catalogue to Live Agent / Shoppa', canonical: 'https://shoppa.au/process/', indexable: true },
  { file: 'contact/index.html', title: 'Contact Us / Shoppa', canonical: 'https://shoppa.au/contact/', indexable: true },
  { file: 'thank-you/index.html', title: 'Thank You / Shoppa', canonical: 'https://shoppa.au/thank-you/', indexable: false },
  { file: '404.html', title: 'Page Not Found / Shoppa', canonical: 'https://shoppa.au/404.html', indexable: false },
];
const htmlFiles = htmlRoutes.map(({ file }) => file);
const html = (await Promise.all(htmlFiles.map(read))).join('\n');
for (const forbidden of ['Algolia', 'Coveo', 'Elasticsearch', 'self-service', 'analytics', 'Embeddings', 'Convex', 'mock mode', '/shoppa-root/']) {
  if (html.includes(forbidden)) throw new Error(`Built output contains forbidden text: ${forbidden}`);
}
for (const required of ['The shopping agent that’s', 'One conversation from ‘I’m looking for…’ to ‘it’s on its way’', 'Your catalogue is your agent’s brain.']) {
  if (!(await read('index.html')).includes(required)) throw new Error(`Home page is missing required copy: ${required}`);
}

const readSingleMetadataValue = (page, pattern, label, file) => {
  const values = [...page.matchAll(pattern)].map((match) => match[1]);
  assert.equal(values.length, 1, `${file} requires exactly one ${label}.`);
  assert.notEqual(values[0].trim(), '', `${file} requires a non-empty ${label}.`);
  return values[0];
};

const descriptions = [];
for (const route of htmlRoutes) {
  const page = await read(route.file);
  const title = readSingleMetadataValue(page, /<title>([^<]+)<\/title>/g, 'title', route.file);
  const description = readSingleMetadataValue(page, /<meta name="description" content="([^"]+)">/g, 'description', route.file);
  const canonical = readSingleMetadataValue(page, /<link rel="canonical" href="([^"]+)">/g, 'canonical', route.file);
  const openGraphTitle = readSingleMetadataValue(page, /<meta property="og:title" content="([^"]+)">/g, 'Open Graph title', route.file);
  const openGraphDescription = readSingleMetadataValue(page, /<meta property="og:description" content="([^"]+)">/g, 'Open Graph description', route.file);
  const openGraphUrl = readSingleMetadataValue(page, /<meta property="og:url" content="([^"]+)">/g, 'Open Graph URL', route.file);
  const twitterTitle = readSingleMetadataValue(page, /<meta name="twitter:title" content="([^"]+)">/g, 'Twitter title', route.file);
  const twitterDescription = readSingleMetadataValue(page, /<meta name="twitter:description" content="([^"]+)">/g, 'Twitter description', route.file);

  assert.equal(title, route.title, `${route.file} has an unexpected document title.`);
  assert.equal(canonical, route.canonical, `${route.file} has an unexpected canonical URL.`);
  assert.equal(openGraphTitle, title, `${route.file} must reuse its document title for Open Graph.`);
  assert.equal(twitterTitle, title, `${route.file} must reuse its document title for Twitter.`);
  assert.equal(openGraphDescription, description, `${route.file} must reuse its description for Open Graph.`);
  assert.equal(twitterDescription, description, `${route.file} must reuse its description for Twitter.`);
  assert.equal(openGraphUrl, canonical, `${route.file} must reuse its canonical URL for Open Graph.`);

  const robotsValues = [...page.matchAll(/<meta name="robots" content="([^"]+)">/g)].map((match) => match[1]);
  assert.deepEqual(robotsValues, route.indexable ? [] : ['noindex'], `${route.file} has an unexpected robots policy.`);
  descriptions.push(description);

  for (const match of page.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href) || /\.[a-z\d]+(?:\?.*)?$/i.test(href)) continue;
    if (!href.endsWith('/') && !href.includes('/#')) throw new Error(`Internal link must end in / or target an anchor: ${href}`);
  }
}
assert.equal(new Set(descriptions).size, descriptions.length, 'Every route requires a unique description.');

const sitemap = await read('sitemap.xml');
if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error('sitemap.xml must be a direct XML URL set.');
if (sitemap.includes('<sitemapindex') || sitemap.includes('localhost') || sitemap.includes('github.io')) throw new Error('sitemap.xml contains an invalid topology or origin.');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = ['https://shoppa.au/', 'https://shoppa.au/about/', 'https://shoppa.au/contact/', 'https://shoppa.au/process/'];
if (JSON.stringify(sitemapUrls.sort()) !== JSON.stringify(expectedUrls.sort())) throw new Error(`Unexpected sitemap membership: ${sitemapUrls.join(', ')}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) throw new Error('sitemap.xml contains duplicate URLs.');
if (Buffer.byteLength(sitemap, 'utf8') > 45 * 1024 * 1024) throw new Error('sitemap.xml exceeds the 45 MiB operational limit.');

const robots = await read('robots.txt');
if (!robots.includes('Allow: /') || !robots.includes('Sitemap: https://shoppa.au/sitemap.xml')) throw new Error('robots.txt has an invalid production policy.');
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

// The palette is declared three times: an sRGB hex fallback, the same colours in
// oklch, and a chroma-only widening for Display P3. Nothing stops those blocks
// drifting apart by hand, so the oklch values are converted back to sRGB here and
// checked against the fallback, and the P3 block is held to lightness and hue
// that match its sRGB twin. That last rule is what lets the P3 layer inherit
// every contrast result measured on the sRGB one.
const stylesheet = await readFile(resolve(root, 'src/styles/global.css'), 'utf8');
const declarationsAfter = (marker, label) => {
  const start = stylesheet.indexOf(marker);
  assert.notEqual(start, -1, `global.css is missing the ${label} block.`);
  let depth = 0;
  let end = start;
  for (; end < stylesheet.length; end += 1) {
    if (stylesheet[end] === '{') depth += 1;
    if (stylesheet[end] === '}' && (depth -= 1) === 0) break;
  }
  const body = stylesheet.slice(start, end);
  return new Map([...body.matchAll(/--(colour-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
};

const srgbChannel = (value) => Math.round(255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055));
const oklchToChannels = ([lightness, chroma, hue, alpha]) => {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const linear = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.7076147010 * short,
  ];
  return [...linear.map((channel) => Math.min(255, Math.max(0, srgbChannel(channel)))), alpha];
};

const readOklch = (value, token) => {
  const parts = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
  assert.ok(parts, `${token} must be a plain oklch() value, found ${value}.`);
  return [Number(parts[1]), Number(parts[2]), Number(parts[3]), parts[4] === undefined ? 1 : Number(parts[4])];
};
const readFallback = (value, token) => {
  const hex = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16), 1];
  const rgba = value.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);
  assert.ok(rgba, `${token} fallback must be a hex or rgba() value, found ${value}.`);
  return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
};

const fallbackTokens = declarationsAfter(':root {', 'sRGB fallback');
const oklchTokens = declarationsAfter('@supports (color: oklch(0 0 0)) {', 'oklch');
const wideGamutTokens = declarationsAfter('@media (color-gamut: p3) {', 'Display P3');
assert.ok(fallbackTokens.size >= 30, 'The sRGB fallback block lost its colour tokens.');
assert.deepEqual([...oklchTokens.keys()].sort(), [...fallbackTokens.keys()].sort(), 'The oklch block must restate exactly the sRGB fallback tokens.');

for (const [token, value] of oklchTokens) {
  const converted = oklchToChannels(readOklch(value, token));
  const declared = readFallback(fallbackTokens.get(token), token);
  assert.deepEqual(converted, declared, `--${token}: ${value} converts to rgba(${converted.join(', ')}), but the sRGB fallback declares ${fallbackTokens.get(token)}.`);
}

for (const [token, value] of wideGamutTokens) {
  const wide = readOklch(value, token);
  const narrow = readOklch(oklchTokens.get(token) ?? '', token);
  assert.equal(wide[0], narrow[0], `--${token} must keep its sRGB lightness on Display P3.`);
  assert.equal(wide[2], narrow[2], `--${token} must keep its sRGB hue on Display P3.`);
  assert.equal(wide[3], narrow[3], `--${token} must keep its sRGB alpha on Display P3.`);
  assert.ok(wide[1] > narrow[1], `--${token} is in the Display P3 block without widening its chroma.`);
}

console.log(`Validated ${requiredFiles.length} build artefacts, ${htmlFiles.length} HTML routes, and ${fallbackTokens.size} colour tokens across three gamut layers.`);
