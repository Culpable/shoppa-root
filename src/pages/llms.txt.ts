import type { APIRoute } from 'astro';
import { llmsDocument } from '../data/site';

export const prerender = true;

// Render a compact v2 llms.txt document from the same canonical route data as the site.
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Set Astro site to the canonical production origin.');
  const lines = [`# ${llmsDocument.name}`, '', `> ${llmsDocument.summary}`, '', ...llmsDocument.details];
  for (const section of llmsDocument.sections) {
    lines.push('', `## ${section.heading}`, '');
    for (const link of section.links) {
      lines.push(`- [${link.label}](${new URL(link.href, site).href}): ${link.description}`);
    }
  }
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
