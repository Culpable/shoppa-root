import assert from 'node:assert/strict';
import test from 'node:test';

import { selectDocumentRepresentation } from '../src/lib/agent-readable-http/accept.ts';
import { routeToInternalMarkdownPath } from '../src/lib/agent-readable-http/internal-path.ts';
import { handleNegotiatedDocument } from '../src/lib/agent-readable-http/shared.ts';


test('Markdown negotiation does not apply an HTML validator to the selected representation', async () => {
  const request = new Request('https://example.com/', {
    headers: {
      accept: 'text/markdown',
      'if-none-match': '"html-validator"',
    },
  });
  let publicAssetRequest: Request | undefined;

  const response = await handleNegotiatedDocument({
    request,
    fetchPublicAsset: async (assetRequest) => {
      publicAssetRequest = assetRequest;
      if (assetRequest.headers.get('if-none-match') === '"html-validator"') {
        return new Response(null, { status: 304, headers: { etag: '"html-validator"' } });
      }
      return new Response('<!doctype html><title>Home</title>', { status: 200 });
    },
    fetchInternalAsset: async () => new Response('# Home\n', { status: 200 }),
  });

  assert.equal(publicAssetRequest?.headers.get('if-none-match'), null);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(await response.text(), '# Home\n');
});


test('HTML negotiation preserves conditional request handling for the HTML representation', async () => {
  const request = new Request('https://example.com/', {
    headers: {
      accept: 'text/html',
      'if-none-match': '"html-validator"',
    },
  });

  const response = await handleNegotiatedDocument({
    request,
    fetchPublicAsset: async (assetRequest) => {
      assert.equal(assetRequest.headers.get('if-none-match'), '"html-validator"');
      return new Response(null, { status: 304, headers: { etag: '"html-validator"' } });
    },
    fetchInternalAsset: async () => {
      assert.fail('HTML negotiation must not fetch the internal Markdown asset.');
    },
  });

  assert.equal(response.status, 304);
  assert.equal(response.headers.get('etag'), '"html-validator"');
  assert.equal(await response.text(), '');
});


test('Markdown negotiation preserves an empty public redirect without fetching Markdown', async () => {
  const request = new Request('https://example.com/about', {
    headers: { accept: 'text/markdown' },
  });
  let internalFetchCount = 0;

  const response = await handleNegotiatedDocument({
    request,
    fetchPublicAsset: async () => new Response(null, {
      status: 307,
      headers: { location: '/about/' },
    }),
    fetchInternalAsset: async () => {
      internalFetchCount += 1;
      return new Response('# About\n', { status: 200 });
    },
  });

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), '/about/');
  assert.equal(await response.text(), '');
  assert.equal(internalFetchCount, 0);
});

test('Accept selection prefers HTML for a missing or wildcard header and Markdown when it wins', () => {
  assert.equal(selectDocumentRepresentation(null), 'html');
  assert.equal(selectDocumentRepresentation('*/*'), 'html');
  assert.equal(selectDocumentRepresentation('text/markdown'), 'markdown');
  assert.equal(selectDocumentRepresentation('text/html;q=0.8, text/markdown'), 'markdown');
  assert.equal(selectDocumentRepresentation('image/png'), null);
});

test('document paths map onto the internal Markdown prefix', () => {
  assert.equal(routeToInternalMarkdownPath('/'), '/_agent-markdown/index.md');
  assert.equal(routeToInternalMarkdownPath('/about/'), '/_agent-markdown/about/index.md');
  assert.equal(routeToInternalMarkdownPath('/thank-you'), '/_agent-markdown/thank-you/index.md');
});
