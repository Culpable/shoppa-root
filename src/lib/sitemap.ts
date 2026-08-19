const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

/** Operational limits keep generated files well below the protocol ceilings. */
export const DEFAULT_MAX_URLS_PER_SITEMAP = 10_000;
export const DEFAULT_MAX_BYTES_PER_SITEMAP = 45 * 1024 * 1024;

const PROTOCOL_MAX_URLS_PER_SITEMAP = 50_000;
const PROTOCOL_MAX_BYTES_PER_SITEMAP = 50 * 1024 * 1024;
const PROTOCOL_MAX_SITEMAPS_PER_INDEX = 50_000;
const URLSET_OPEN = `${XML_DECLARATION}\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n`;
const URLSET_CLOSE = "</urlset>\n";
const textEncoder = new TextEncoder();

export interface SitemapSourceEntry {
  /** Canonical route relative to the configured Astro base, starting with `/`. */
  path: string;
  /** Last significant content change. Omit when no authoritative value exists. */
  lastmod?: Date | string;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export interface SitemapPlan {
  siteRoot: string;
  chunks: readonly (readonly SitemapEntry[])[];
  indexed: boolean;
}

export interface CreateSitemapPlanOptions {
  siteRoot: string;
  entries: readonly SitemapSourceEntry[];
  maxUrlsPerFile?: number;
  maxBytesPerFile?: number;
}

function byteLength(value: string): number {
  return textEncoder.encode(value).byteLength;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normaliseSiteRoot(value: string): URL {
  const root = new URL(value);

  if (
    !["http:", "https:"].includes(root.protocol) ||
    root.username ||
    root.password ||
    root.search ||
    root.hash
  ) {
    throw new Error(`Invalid sitemap site root: ${value}`);
  }

  if (!root.pathname.endsWith("/")) root.pathname += "/";
  return root;
}

function normaliseLastmod(value: Date | string | undefined): string | undefined {
  if (value === undefined) return undefined;

  const normalised = value instanceof Date ? value.toISOString() : value;
  const w3cDateTime = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;
  const datePart = normalised.slice(0, 10);
  const parsedDatePart = new Date(`${datePart}T00:00:00Z`);

  if (
    !w3cDateTime.test(normalised) ||
    Number.isNaN(Date.parse(normalised)) ||
    Number.isNaN(parsedDatePart.valueOf()) ||
    parsedDatePart.toISOString().slice(0, 10) !== datePart
  ) {
    throw new Error(`Invalid sitemap lastmod value: ${normalised}`);
  }

  return normalised;
}

function renderEntry(entry: SitemapEntry): string {
  const lastmod = entry.lastmod
    ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`
    : "";

  return [
    "  <url>",
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    `${lastmod}  </url>`,
    "",
  ].join("\n");
}

function renderUrlset(entries: readonly SitemapEntry[]): string {
  return `${URLSET_OPEN}${entries.map(renderEntry).join("")}${URLSET_CLOSE}`;
}

function renderSitemapIndex(siteRoot: string, childCount: number): string {
  const root = normaliseSiteRoot(siteRoot);
  const children = Array.from({ length: childCount }, (_, index) => {
    const loc = new URL(`sitemap-${index + 1}.xml`, root).href;
    if (loc.length >= 2_048) {
      throw new Error(`Sitemap URL must be shorter than 2,048 characters: ${loc}`);
    }
    return [
      "  <sitemap>",
      `    <loc>${escapeXml(loc)}</loc>`,
      "  </sitemap>",
      "",
    ].join("\n");
  }).join("");

  return `${XML_DECLARATION}\n<sitemapindex xmlns="${SITEMAP_NAMESPACE}">\n${children}</sitemapindex>\n`;
}

function validateLimits(maxUrlsPerFile: number, maxBytesPerFile: number): void {
  if (
    !Number.isInteger(maxUrlsPerFile) ||
    maxUrlsPerFile < 1 ||
    maxUrlsPerFile > PROTOCOL_MAX_URLS_PER_SITEMAP
  ) {
    throw new Error("The sitemap URL limit must be an integer from 1 to 50,000.");
  }

  if (
    !Number.isInteger(maxBytesPerFile) ||
    maxBytesPerFile < byteLength(URLSET_OPEN + URLSET_CLOSE) ||
    maxBytesPerFile > PROTOCOL_MAX_BYTES_PER_SITEMAP
  ) {
    throw new Error("The sitemap byte limit must be a valid integer no greater than 50 MiB.");
  }
}

function normaliseEntries(
  siteRoot: URL,
  entries: readonly SitemapSourceEntry[],
): SitemapEntry[] {
  const seen = new Set<string>();
  const normalised = entries.map((entry) => {
    if (!entry.path.startsWith("/") || entry.path.includes("\\") || entry.path.includes("#")) {
      throw new Error(`Invalid sitemap path: ${entry.path}`);
    }

    // Removing the leading slash keeps the configured Astro base in the URL.
    const loc = new URL(entry.path.slice(1), siteRoot);
    if (loc.origin !== siteRoot.origin || !loc.pathname.startsWith(siteRoot.pathname)) {
      throw new Error(`Sitemap path leaves the configured site root: ${entry.path}`);
    }
    if (loc.href.length >= 2_048) {
      throw new Error(`Sitemap URL must be shorter than 2,048 characters: ${loc.href}`);
    }

    if (seen.has(loc.href)) throw new Error(`Duplicate sitemap URL: ${loc.href}`);
    seen.add(loc.href);

    return {
      loc: loc.href,
      lastmod: normaliseLastmod(entry.lastmod),
    };
  });

  if (normalised.length === 0) {
    throw new Error("A sitemap must contain at least one canonical URL.");
  }

  return normalised.sort((left, right) => left.loc.localeCompare(right.loc));
}

function createChunks(
  entries: readonly SitemapEntry[],
  maxUrlsPerFile: number,
  maxBytesPerFile: number,
): SitemapEntry[][] {
  const envelopeBytes = byteLength(URLSET_OPEN + URLSET_CLOSE);
  const chunks: SitemapEntry[][] = [];
  let chunk: SitemapEntry[] = [];
  let chunkBytes = envelopeBytes;

  for (const entry of entries) {
    const entryBytes = byteLength(renderEntry(entry));
    if (envelopeBytes + entryBytes > maxBytesPerFile) {
      throw new Error(`One sitemap entry exceeds the configured byte limit: ${entry.loc}`);
    }

    const exceedsLimit =
      chunk.length > 0 &&
      (chunk.length >= maxUrlsPerFile || chunkBytes + entryBytes > maxBytesPerFile);

    if (exceedsLimit) {
      chunks.push(chunk);
      chunk = [];
      chunkBytes = envelopeBytes;
    }

    chunk.push(entry);
    chunkBytes += entryBytes;
  }

  chunks.push(chunk);
  return chunks;
}

export function createSitemapPlan({
  siteRoot,
  entries,
  maxUrlsPerFile = DEFAULT_MAX_URLS_PER_SITEMAP,
  maxBytesPerFile = DEFAULT_MAX_BYTES_PER_SITEMAP,
}: CreateSitemapPlanOptions): SitemapPlan {
  validateLimits(maxUrlsPerFile, maxBytesPerFile);

  const root = normaliseSiteRoot(siteRoot);
  const normalisedEntries = normaliseEntries(root, entries);
  const chunks = createChunks(normalisedEntries, maxUrlsPerFile, maxBytesPerFile);

  if (chunks.length > PROTOCOL_MAX_SITEMAPS_PER_INDEX) {
    throw new Error("The sitemap index would exceed 50,000 child sitemaps.");
  }

  const indexed = chunks.length > 1;
  const primaryXml = indexed
    ? renderSitemapIndex(root.href, chunks.length)
    : renderUrlset(chunks[0]);

  if (byteLength(primaryXml) > maxBytesPerFile) {
    throw new Error("The primary sitemap exceeds the configured byte limit.");
  }

  return {
    siteRoot: root.href,
    chunks,
    indexed,
  };
}

export function renderPrimarySitemap(plan: SitemapPlan): string {
  return plan.indexed
    ? renderSitemapIndex(plan.siteRoot, plan.chunks.length)
    : renderUrlset(plan.chunks[0]);
}

export function renderSitemapChunk(plan: SitemapPlan, index: number): string {
  const chunk = plan.chunks[index];
  if (!chunk) throw new Error(`Unknown sitemap chunk index: ${index}`);
  return renderUrlset(chunk);
}

export function createXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
