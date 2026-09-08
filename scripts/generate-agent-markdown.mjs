import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { parseFragment } from 'parse5';

import {
  INTERNAL_MARKDOWN_PREFIX,
  routeToInternalMarkdownPath,
} from '../src/lib/agent-readable-http/internal-path.ts';
import { markdownNotFound } from '../src/lib/agent-readable-http/document-response.ts';

async function walkHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files.sort();
}

function decodeEntities(value) {
  // Decode every named, decimal, and hexadecimal reference with the same HTML parser
  // used for body content so metadata cannot publish raw browser serialisation tokens.
  return textContent(parseFragment(value));
}

function attribute(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

function hasAttribute(node, name) {
  return node.attrs?.some((entry) => entry.name === name) ?? false;
}

function childElements(node, tagName) {
  return (node.childNodes ?? []).filter((child) => child.tagName === tagName);
}

function descendants(node, tagName) {
  const matches = [];
  for (const child of node.childNodes ?? []) {
    if (child.tagName === tagName) matches.push(child);
    matches.push(...descendants(child, tagName));
  }
  return matches;
}

/** Apply explicit agent boundaries before filtering browser-only hidden content. */
function isExcludedNode(node) {
  if (['script', 'style', 'template', 'noscript', 'nav', 'header', 'footer', 'aside'].includes(node.tagName)) {
    return true;
  }
  if (hasAttribute(node, 'data-agent-ignore')) return true;
  if (hasAttribute(node, 'data-agent-include')) return false;

  const style = attribute(node, 'style') ?? '';
  return hasAttribute(node, 'hidden')
    || attribute(node, 'aria-hidden') === 'true'
    || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style);
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(textContent).join('');
}

function renderInlineNode(node) {
  if (node.nodeName === '#text') return node.value;
  if (isExcludedNode(node)) return '';

  const ariaLabel = attribute(node, 'aria-label');
  // Use the accessible label as the stable value for animated text whose visual glyphs are hidden.
  if (ariaLabel && attribute(node, 'role') === 'text') return `${ariaLabel} `;
  // Convert semantic SVG labels into cell text while discarding decorative vector paths.
  if (ariaLabel && node.tagName === 'svg') return ariaLabel;
  if (node.tagName === 'svg') return '';
  if (node.tagName === 'img') {
    const alt = attribute(node, 'alt') ?? '';
    const src = attribute(node, 'src') ?? '';
    return src ? `![${alt}](${src})` : alt;
  }
  if (node.tagName === 'br') return ' ';

  const content = (node.childNodes ?? []).map(renderInlineNode).join('');
  if (node.tagName === 'a') {
    const href = attribute(node, 'href');
    return href ? `[${normaliseInline(content)}](${href})` : content;
  }
  if (node.tagName === 'code') return `\`${textContent(node)}\``;
  return content;
}

function normaliseInline(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function text(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function inlineNodes(nodes) {
  return normaliseInline(nodes.map(renderInlineNode).join(''));
}

function tableNodeToMarkdown(tableNode) {
  const rows = descendants(tableNode, 'tr')
    .map((row) => (row.childNodes ?? [])
      .filter((cell) => cell.tagName === 'th' || cell.tagName === 'td')
      .map((cell) => inlineNodes(cell.childNodes ?? []).replace(/(^|[^\\])\|/g, '$1\\|')))
    .filter((row) => row.length > 0);
  if (rows.length === 0) return null;

  const columnCount = Math.max(...rows.map((row) => row.length));
  const renderRow = (row) => `| ${Array.from({ length: columnCount }, (_, index) => row[index] ?? '').join(' | ')} |`;
  const caption = descendants(tableNode, 'caption')[0];
  const markdown = [
    renderRow(rows[0]),
    renderRow(Array.from({ length: columnCount }, () => '---')),
    ...rows.slice(1).map(renderRow),
  ].join('\n');
  return caption ? `${inlineNodes(caption.childNodes ?? [])}\n\n${markdown}` : markdown;
}

function listNodeToMarkdown(node) {
  let nextNumber = Number(attribute(node, 'start') ?? 1);
  const items = childElements(node, 'li').map((item) => {
    if (node.tagName === 'ul') return `- ${inlineNodes(item.childNodes ?? [])}`;
    const explicitValue = attribute(item, 'value');
    if (explicitValue !== undefined) nextNumber = Number(explicitValue);
    const rendered = `${nextNumber}. ${inlineNodes(item.childNodes ?? [])}`;
    nextNumber += 1;
    return rendered;
  });
  return items.length > 0 ? `\n${items.join('\n')}\n` : '';
}

function renderBlockNode(node, codeBlocks, tableBlocks) {
  if (node.nodeName === '#text') return node.value;
  if (isExcludedNode(node)) return '';

  if (node.tagName === 'pre') {
    const code = descendants(node, 'code')[0];
    if (!code) return (node.childNodes ?? []).map((child) => renderBlockNode(child, codeBlocks, tableBlocks)).join('');
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
    const decoded = textContent(code).replace(/^\n|\n$/g, '');
    const marker = codeFenceFor(decoded);
    codeBlocks.push(`${marker}\n${decoded}\n${marker}`);
    return `\n\n${token}\n\n`;
  }

  if (node.tagName === 'table') {
    const markdown = tableNodeToMarkdown(node);
    if (markdown === null) return '';
    const token = `@@TABLE_BLOCK_${tableBlocks.length}@@`;
    tableBlocks.push(markdown);
    return `\n\n${token}\n\n`;
  }

  if (/^h[1-6]$/.test(node.tagName)) {
    return `\n\n${'#'.repeat(Number(node.tagName[1]))} ${inlineNodes(node.childNodes ?? [])}\n\n`;
  }
  if (node.tagName === 'ol' || node.tagName === 'ul') return listNodeToMarkdown(node);
  if (node.tagName === 'li') return `\n- ${inlineNodes(node.childNodes ?? [])}`;
  if (['p', 'blockquote', 'figcaption', 'dt', 'dd'].includes(node.tagName)) {
    const prefix = node.tagName === 'blockquote' ? '> ' : '';
    return `\n\n${prefix}${inlineNodes(node.childNodes ?? [])}\n\n`;
  }
  if (node.tagName === 'br') return '\n';
  if (node.tagName === 'a' || node.tagName === 'img' || node.tagName === 'code' || node.tagName === 'svg' || attribute(node, 'role') === 'text') {
    return renderInlineNode(node);
  }
  return (node.childNodes ?? []).map((child) => renderBlockNode(child, codeBlocks, tableBlocks)).join('');
}

function singleMatch(html, pattern, label) {
  const matches = [...html.matchAll(pattern)].map((match) => match[1]);
  if (matches.length !== 1 || !matches[0]?.trim()) throw new Error(`Expected exactly one ${label}.`);
  return matches[0].trim();
}

function codeFenceFor(code) {
  const marker = code.includes('```') ? '~' : '`';
  let longestRun = 0;
  let currentRun = 0;
  for (const character of code) {
    currentRun = character === marker ? currentRun + 1 : 0;
    longestRun = Math.max(longestRun, currentRun);
  }
  const minimumLength = marker === '~' ? 4 : 3;
  return marker.repeat(Math.max(minimumLength, longestRun + 1));
}

export function assertBalancedMarkdownFences(source) {
  let open = null;
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    const marker = match[1][0];
    const length = match[1].length;
    if (open === null) {
      open = { marker, length, line: index + 1 };
      continue;
    }
    if (marker === open.marker && length >= open.length && match[2].trim() === '') open = null;
  }
  if (open) throw new Error(`Unclosed ${open.marker.repeat(open.length)} fence from line ${open.line}.`);
}

export function mainHtmlToMarkdown(mainHtml) {
  // Parse nested markup before filtering so accessible labels and complete disclosure content survive conversion.
  const codeBlocks = [];
  const tableBlocks = [];
  const fragment = parseFragment(mainHtml);
  let value = (fragment.childNodes ?? []).map((node) => renderBlockNode(node, codeBlocks, tableBlocks)).join('');
  value = value.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  tableBlocks.forEach((table, index) => { value = value.replace(`@@TABLE_BLOCK_${index}@@`, table); });
  codeBlocks.forEach((block, index) => { value = value.replace(`@@CODE_BLOCK_${index}@@`, block); });
  return value;
}

function routeFromFile(file, outputDirectory) {
  const path = relative(outputDirectory, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  if (path === '404.html') return null;
  return `/${path}`;
}

function metadataForHtml(html, expectedOrigin) {
  const title = text(singleMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/gi, 'document title'));
  const descriptionTag = singleMatch(html, /(<meta\b[^>]*name=["']description["'][^>]*>)/gi, 'description meta');
  const encodedDescription = descriptionTag.match(/content=["']([^"']+)["']/i)?.[1];
  const description = encodedDescription ? text(encodedDescription) : '';
  if (!description) throw new Error('Description meta must have content.');
  const canonicalTag = singleMatch(html, /(<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>)/gi, 'canonical');
  const canonical = canonicalTag.match(/href=["']([^"']+)["']/i)?.[1];
  if (!canonical) throw new Error('Canonical link must have href.');
  const url = new URL(canonical);
  if (url.origin !== expectedOrigin) throw new Error(`Canonical ${url} is outside ${expectedOrigin}.`);
  const main = singleMatch(html, /<main\b[^>]*>([\s\S]*?)<\/main>/gi, 'main region');
  return { title, description, canonical: url.toString(), main };
}

function frontmatter({ title, description, canonical }) {
  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\ncanonical: ${JSON.stringify(canonical)}\n---\n`;
}

function renderVercelRoutesModule(documents) {
  const routes = documents.map(({ route }) => route).sort();
  return [
    '// Generated by generate-agent-markdown.mjs. Do not edit by hand.',
    'export const GENERATED_MARKDOWN_ROUTES: ReadonlySet<string> = new Set([',
    ...routes.map((route) => `  ${JSON.stringify(route)},`),
    ']);',
    '',
  ].join('\n');
}

export async function generateAgentMarkdown({ outputDirectory, origin, vercelRoutesModule }) {
  const absoluteOutput = resolve(outputDirectory);
  const expectedOrigin = new URL(origin).origin;
  const documents = [];
  const canonicalOwners = new Map();
  for (const file of await walkHtml(absoluteOutput)) {
    if (file.includes(`${sep}${INTERNAL_MARKDOWN_PREFIX.slice(1).replaceAll('/', sep)}`)) continue;
    const route = routeFromFile(file, absoluteOutput);
    if (route === null) continue;
    const html = await readFile(file, 'utf8');
    // Keep noindex documents such as `/thank-you/`. They are public URLs and
    // must still negotiate Markdown; skipping them would 404 the Markdown
    // representation of a live HTML page.
    const metadata = metadataForHtml(html, expectedOrigin);
    if (canonicalOwners.has(metadata.canonical)) {
      throw new Error(`Duplicate canonical ${metadata.canonical} in ${file} and ${canonicalOwners.get(metadata.canonical)}.`);
    }
    canonicalOwners.set(metadata.canonical, file);
    const markdown = mainHtmlToMarkdown(metadata.main);
    if (!markdown) throw new Error(`Generated Markdown is empty for ${route}.`);
    const internalPath = routeToInternalMarkdownPath(route);
    const destination = resolve(absoluteOutput, `.${internalPath}`);
    if (!destination.startsWith(resolve(absoluteOutput, `.${INTERNAL_MARKDOWN_PREFIX}`))) {
      throw new Error(`Generated path escaped the internal prefix: ${destination}`);
    }
    const document = `${frontmatter(metadata)}\n${markdown}\n`;
    assertBalancedMarkdownFences(document);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, document, 'utf8');
    documents.push({ route, canonical: metadata.canonical, destination });
  }
  if (documents.length === 0) throw new Error('No indexable HTML documents were converted.');
  const recoveryPath = resolve(absoluteOutput, `.${INTERNAL_MARKDOWN_PREFIX}`, '404.md');
  const recoveryDocument = markdownNotFound(expectedOrigin);
  assertBalancedMarkdownFences(recoveryDocument);
  await mkdir(dirname(recoveryPath), { recursive: true });
  await writeFile(recoveryPath, recoveryDocument, 'utf8');
  const sortedDocuments = documents.sort((left, right) => left.route.localeCompare(right.route));
  if (vercelRoutesModule) {
    const absoluteModule = resolve(vercelRoutesModule);
    await mkdir(dirname(absoluteModule), { recursive: true });
    await writeFile(absoluteModule, renderVercelRoutesModule(sortedDocuments), 'utf8');
  }
  return sortedDocuments;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDirectory = process.argv[2];
  const origin = process.argv[3];
  if (!outputDirectory || !origin) {
    throw new Error('Usage: node --experimental-strip-types generate-agent-markdown.mjs <dist> <origin>');
  }
  await generateAgentMarkdown({
    outputDirectory,
    origin,
    vercelRoutesModule: undefined,
  });
}
