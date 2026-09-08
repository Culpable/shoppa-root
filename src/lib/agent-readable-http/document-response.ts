import { selectDocumentRepresentation } from './accept.ts';
import { negotiatedHeaders } from './headers.ts';

export const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';
export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

function bodyForMethod(request: Request, body: BodyInit | null): BodyInit | null {
  return request.method.toUpperCase() === 'HEAD' ? null : body;
}

export function htmlDocumentResponse(request: Request, source: Response): Response {
  const headers = negotiatedHeaders(source.headers);

  // Normalise Cloudflare's asset content type because its hosted runtime omits
  // the UTF-8 charset that the local emulator includes.
  headers.set('content-type', HTML_CONTENT_TYPE);

  return new Response(bodyForMethod(request, source.body), {
    status: source.status,
    statusText: source.statusText,
    headers,
  });
}

export function markdownDocumentResponse(
  request: Request,
  body: string,
  status: number,
  sourceHeaders = new Headers(),
): Response {
  const headers = negotiatedHeaders(sourceHeaders, MARKDOWN_CONTENT_TYPE, body);
  return new Response(bodyForMethod(request, body), { status, headers });
}

export function notAcceptableResponse(request: Request): Response {
  const body = 'Not acceptable. This document is available as text/html or text/markdown.\n';
  const headers = negotiatedHeaders(new Headers(), 'text/plain; charset=utf-8', body);
  return new Response(bodyForMethod(request, body), { status: 406, headers });
}

export function markdownNotFound(origin: string): string {
  const url = new URL(origin);
  const absolute = (path: string) => new URL(path, url).toString();
  return [
    '---',
    'title: "Page not found"',
    `canonical: "${absolute('/')}"`,
    '---',
    '',
    '# Page not found',
    '',
    'The requested document does not exist. Continue with:',
    '',
    `- [Home](${absolute('/')})`,
    `- [Sitemap](${absolute('/sitemap.xml')})`,
    `- [Agent guidance](${absolute('/llms.txt')})`,
    `- [Contact](${absolute('/contact/')})`,
    '',
  ].join('\n');
}

export function selectForRequest(request: Request) {
  return selectDocumentRepresentation(request.headers.get('accept'));
}
