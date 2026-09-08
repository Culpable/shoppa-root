export type DocumentRepresentation = 'html' | 'markdown';

interface MediaRange {
  type: string;
  subtype: string;
  parameters: Map<string, string>;
  quality: number;
  order: number;
}

const OFFERS: Record<DocumentRepresentation, { type: string; subtype: string; parameters: Map<string, string> }> = {
  html: { type: 'text', subtype: 'html', parameters: new Map([['charset', 'utf-8']]) },
  markdown: { type: 'text', subtype: 'markdown', parameters: new Map([['charset', 'utf-8']]) },
};

function splitHeader(value: string, separator: ',' | ';'): string[] {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) escaped = false;
    else if (character === '\\' && quoted) escaped = true;
    else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function parseQuality(value: string | undefined): number {
  if (value === undefined) return 1;
  if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value)) return 0;
  return Number(value);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\(["\\])/g, '$1');
  }
  return trimmed;
}

function parseAccept(value: string): MediaRange[] {
  return splitHeader(value, ',').flatMap((entry, order) => {
    const segments = splitHeader(entry, ';').map((part) => part.trim());
    const media = segments.shift()?.toLowerCase();
    const match = media?.match(/^([a-z0-9!#$&^_.+*-]+)\/([a-z0-9!#$&^_.+*-]+)$/i);
    if (!match) return [];
    const parameters = new Map<string, string>();
    let quality: string | undefined;
    let afterQuality = false;
    for (const segment of segments) {
      const separator = segment.indexOf('=');
      if (separator < 1) continue;
      const name = segment.slice(0, separator).trim().toLowerCase();
      const parameterValue = unquote(segment.slice(separator + 1));
      if (name === 'q' && !afterQuality) {
        quality = parameterValue;
        afterQuality = true;
      } else if (!afterQuality) {
        parameters.set(name, parameterValue.toLowerCase());
      }
    }
    return [{
      type: match[1].toLowerCase(),
      subtype: match[2].toLowerCase(),
      parameters,
      quality: parseQuality(quality),
      order,
    }];
  });
}

function matchSpecificity(range: MediaRange, representation: DocumentRepresentation): number | null {
  const offer = OFFERS[representation];
  if (range.type !== '*' && range.type !== offer.type) return null;
  if (range.subtype !== '*' && range.subtype !== offer.subtype) return null;
  for (const [name, value] of range.parameters) {
    if (offer.parameters.get(name)?.toLowerCase() !== value) return null;
  }
  return (range.type === '*' ? 0 : 100) + (range.subtype === '*' ? 0 : 10) + range.parameters.size;
}

function preferenceFor(ranges: MediaRange[], representation: DocumentRepresentation) {
  const matches = ranges
    .map((range) => ({ range, specificity: matchSpecificity(range, representation) }))
    .filter((item): item is { range: MediaRange; specificity: number } => item.specificity !== null)
    .sort((left, right) => right.specificity - left.specificity || left.range.order - right.range.order);
  const best = matches[0];
  return best ? { quality: best.range.quality, specificity: best.specificity, order: best.range.order } : null;
}

/**
 * Select HTML or Markdown. Equal explicit choices follow client order as the
 * documented deterministic server policy; wildcard-only ties stay HTML-first.
 */
export function selectDocumentRepresentation(accept: string | null): DocumentRepresentation | null {
  if (accept === null) return 'html';
  const ranges = parseAccept(accept);
  if (ranges.length === 0) return null;
  const html = preferenceFor(ranges, 'html');
  const markdown = preferenceFor(ranges, 'markdown');
  if ((!html || html.quality === 0) && (!markdown || markdown.quality === 0)) return null;
  if (!html || html.quality === 0) return 'markdown';
  if (!markdown || markdown.quality === 0) return 'html';
  if (html.quality !== markdown.quality) return html.quality > markdown.quality ? 'html' : 'markdown';
  const bothWildcardOnly = html.specificity < 110 && markdown.specificity < 110;
  if (bothWildcardOnly) return 'html';
  return markdown.order < html.order ? 'markdown' : 'html';
}
