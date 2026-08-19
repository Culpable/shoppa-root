import { createSitemapPlan, type SitemapSourceEntry } from "../lib/sitemap";
import { pages } from "./site";

const sitemapEntries = Object.values(pages)
  .filter((page) => page.indexable)
  .map((page) => ({ path: page.path })) satisfies SitemapSourceEntry[];

if (!import.meta.env.SITE) {
  throw new Error("Set Astro site to the canonical production origin.");
}

const basePath = import.meta.env.BASE_URL.replace(/^\/+/, "");
const siteRoot = new URL(basePath, import.meta.env.SITE).href;

export const sitemapPlan = createSitemapPlan({
  siteRoot,
  entries: sitemapEntries,
});
