import type { APIRoute } from "astro";
import { sitemapPlan } from "../data/sitemap";
import { createXmlResponse, renderSitemapChunk } from "../lib/sitemap";

export const prerender = true;

/** Root-level child files can validly list every canonical route on the site. */
export function getStaticPaths() {
  if (!sitemapPlan.indexed) return [];

  return sitemapPlan.chunks.map((_, index) => ({
    params: { page: String(index + 1) },
  }));
}

export const GET = (({ params }) => {
  const match = /^(\d+)$/.exec(params.page ?? "");
  if (!match) throw new Error(`Invalid sitemap chunk route: ${params.page}`);

  const chunkIndex = Number(match[1]) - 1;
  return createXmlResponse(renderSitemapChunk(sitemapPlan, chunkIndex));
}) satisfies APIRoute;
