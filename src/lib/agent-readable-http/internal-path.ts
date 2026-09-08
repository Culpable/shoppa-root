export const INTERNAL_MARKDOWN_PREFIX = '/_agent-markdown/';

export function assertSafeDocumentPath(pathname: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    throw new Error('Document path contains invalid percent encoding.');
  }
  if (!decoded.startsWith('/') || decoded.includes('\\') || decoded.split('/').includes('..')) {
    throw new Error(`Unsafe document path: ${pathname}`);
  }
  return decoded;
}

export function routeToInternalMarkdownPath(pathname: string): string {
  const safe = assertSafeDocumentPath(pathname);
  const route = safe.endsWith('/') ? safe : `${safe}/`;
  return `${INTERNAL_MARKDOWN_PREFIX}${route.slice(1)}index.md`;
}
