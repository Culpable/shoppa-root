import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { generateAgentMarkdown, mainHtmlToMarkdown } from '../scripts/generate-agent-markdown.mjs';

const testDirectory = mkdtempSync(join(tmpdir(), 'shoppa-agent-markdown-test-'));

after(() => {
  const result = spawnSync('trash', [testDirectory], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('agent Markdown keeps headings and paragraphs and drops ignored nodes', () => {
  const markdown = mainHtmlToMarkdown(`
    <section>
      <h1>The shopping agent that’s actually yours</h1>
      <p>Shoppa drops into your site with two lines of code.</p>
      <div data-agent-ignore>
        <p>Decorative duplicate</p>
      </div>
    </section>
  `);

  assert.match(markdown, /# The shopping agent that’s actually yours/);
  assert.match(markdown, /Shoppa drops into your site with two lines of code\./);
  assert.doesNotMatch(markdown, /Decorative duplicate/);
});

test('agent Markdown decodes named, decimal, and hexadecimal entities in metadata and body text', async () => {
  writeFileSync(join(testDirectory, 'index.html'), `
    <!doctype html>
    <html>
      <head>
        <title>Shoppa&#x27;s agent</title>
        <meta name="description" content="We&#x27;re ready &amp; you&#39;d agree.">
        <link rel="canonical" href="https://shoppa.au/">
      </head>
      <body>
        <main><p>We&#x27;re ready, you&#39;d agree, and the retailer&#8217;s catalogue stays theirs.</p></main>
      </body>
    </html>
  `);

  await generateAgentMarkdown({
    outputDirectory: testDirectory,
    origin: 'https://shoppa.au',
    vercelRoutesModule: undefined,
  });

  const generated = readFileSync(join(testDirectory, '_agent-markdown/index.md'), 'utf8');
  assert.match(generated, /title: "Shoppa's agent"/);
  assert.match(generated, /description: "We're ready & you'd agree\."/);
  assert.match(generated, /We're ready, you'd agree, and the retailer’s catalogue stays theirs\./);
  assert.doesNotMatch(generated, /&(?:amp|#(?:\d+|x[\da-f]+));/i);
});

test('noindex documents still receive a Markdown representation at the live URL', async () => {
  const thankYouDir = join(testDirectory, 'thank-you');
  mkdirSync(thankYouDir, { recursive: true });
  writeFileSync(join(thankYouDir, 'index.html'), `
    <!doctype html>
    <html>
      <head>
        <title>Thank you</title>
        <meta name="description" content="Thanks for getting in touch.">
        <meta name="robots" content="noindex">
        <link rel="canonical" href="https://shoppa.au/thank-you/">
      </head>
      <body>
        <main>
          <h1>Thanks for writing</h1>
          <p>We’ll reply from hello@shoppa.au.</p>
        </main>
      </body>
    </html>
  `);

  await generateAgentMarkdown({
    outputDirectory: testDirectory,
    origin: 'https://shoppa.au',
    vercelRoutesModule: undefined,
  });

  const generated = readFileSync(join(testDirectory, '_agent-markdown/thank-you/index.md'), 'utf8');
  assert.match(generated, /canonical: "https:\/\/shoppa.au\/thank-you\/"/);
  assert.match(generated, /# Thanks for writing/);
  assert.match(generated, /We’ll reply from hello@shoppa.au\./);
});
