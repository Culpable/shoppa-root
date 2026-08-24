import type { APIRoute } from 'astro';
import {
  agentMarkdownDocuments,
  type AgentMarkdownDocument,
} from '../data/agentContent.ts';

interface Props {
  document: AgentMarkdownDocument;
}

export const prerender = true;

export function getStaticPaths() {
  return agentMarkdownDocuments.map((document) => ({
    params: { document: document.outputPath },
    props: { document },
  }));
}

export const GET = (({ props }) => {
  const { document } = props as Props;
  return new Response(document.content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}) satisfies APIRoute;
