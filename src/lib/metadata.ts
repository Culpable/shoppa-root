import { site } from '../config/site.ts';

export type TitleMode = 'composed' | 'absolute';

export interface SiteTitleConfig {
  readonly name: string;
  readonly titleSeparator: string;
}

export interface SocialImageMetadata {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  type?: string;
}

export type JsonLdDocument = Readonly<Record<string, unknown>>;

export interface PageMetadataInput {
  title: string;
  description: string;
  titleMode?: TitleMode;
  canonicalPath?: string;
  robots?: string;
  contentType?: 'website' | 'article';
  socialImage?: SocialImageMetadata;
  structuredData?: JsonLdDocument;
}

export interface ResolvedPageMetadata extends PageMetadataInput {
  pageTitle: string;
  documentTitle: string;
  description: string;
  titleMode: TitleMode;
  contentType: 'website' | 'article';
}

export interface CanonicalURLInput {
  canonicalPath?: string;
  currentPath: string;
  siteURL: URL;
}

function requireNonEmpty(value: string, field: string): string {
  const normalised = value.trim();
  if (!normalised) throw new Error(`${field} must not be empty.`);
  return normalised;
}

function validateSiteTitleConfig(config: SiteTitleConfig): SiteTitleConfig {
  requireNonEmpty(config.name, 'Site name');
  requireNonEmpty(config.titleSeparator, 'Title separator');
  return config;
}

function validateTitleMode(titleMode: string): asserts titleMode is TitleMode {
  if (titleMode !== 'composed' && titleMode !== 'absolute') {
    throw new Error(`Unsupported title mode: ${titleMode}`);
  }
}

export function composeDocumentTitle(
  title: string,
  titleMode: TitleMode = 'composed',
  config: SiteTitleConfig = site,
): string {
  const pageTitle = requireNonEmpty(title, 'Page title');
  validateSiteTitleConfig(config);
  validateTitleMode(titleMode);

  if (titleMode === 'absolute') return pageTitle;

  const suffix = `${config.titleSeparator}${config.name}`;
  if (pageTitle.endsWith(suffix)) {
    throw new Error('Pass an uncomposed page title; the metadata resolver adds the site suffix.');
  }

  return `${pageTitle}${suffix}`;
}

export function resolveCanonicalURL({
  canonicalPath,
  currentPath,
  siteURL,
}: CanonicalURLInput): URL {
  const canonicalSource = canonicalPath ?? currentPath;
  if (!canonicalSource.trim()) {
    throw new Error('Canonical path must not be empty.');
  }

  const canonicalURL = new URL(canonicalSource, siteURL);
  if (canonicalURL.origin !== siteURL.origin) {
    throw new Error('Canonical URLs must use the configured production origin.');
  }
  if (canonicalURL.username || canonicalURL.password) {
    throw new Error('Canonical URLs must not contain credentials.');
  }
  if (canonicalURL.search || canonicalURL.hash) {
    throw new Error('Canonical URLs must not contain a query string or fragment.');
  }

  return canonicalURL;
}

export function resolvePageMetadata(
  input: PageMetadataInput,
  config: SiteTitleConfig = site,
): ResolvedPageMetadata {
  const titleMode = input.titleMode ?? 'composed';
  const pageTitle = requireNonEmpty(input.title, 'Page title');
  const description = requireNonEmpty(input.description, 'Page description');
  const socialImage = input.socialImage
    ? {
        ...input.socialImage,
        src: requireNonEmpty(input.socialImage.src, 'Social image source'),
        alt: requireNonEmpty(input.socialImage.alt, 'Social image alternative text'),
      }
    : undefined;

  return {
    ...input,
    pageTitle,
    documentTitle: composeDocumentTitle(pageTitle, titleMode, config),
    description,
    titleMode,
    contentType: input.contentType ?? 'website',
    socialImage,
  };
}
