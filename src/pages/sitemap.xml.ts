import type { APIRoute } from "astro";
import { sitemapPlan } from "../data/sitemap";
import { createXmlResponse, renderPrimarySitemap } from "../lib/sitemap";

export const prerender = true;

/** Emits a direct URL set until the sitemap plan requires child files. */
export const GET = (() => {
  return createXmlResponse(renderPrimarySitemap(sitemapPlan));
}) satisfies APIRoute;
