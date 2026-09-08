const STALE_BODY_HEADERS = [
  'content-encoding',
  'content-length',
  'etag',
  'last-modified',
] as const;

export function mergeVary(current: string | null, field: string): string {
  if (current?.trim() === '*') return '*';
  const values = (current ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!values.some((value) => value.toLowerCase() === field.toLowerCase())) values.push(field);
  return values.join(', ');
}

export function negotiatedHeaders(source: Headers, contentType?: string, body?: string): Headers {
  const headers = new Headers(source);
  headers.set('vary', mergeVary(headers.get('vary'), 'Accept'));
  if (contentType) {
    for (const name of STALE_BODY_HEADERS) headers.delete(name);
    headers.set('content-type', contentType);
    if (body !== undefined) headers.set('content-length', String(new TextEncoder().encode(body).byteLength));
  }
  return headers;
}
