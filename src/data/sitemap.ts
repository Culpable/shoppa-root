import { createSitemapPlan, type SitemapSourceEntry } from "../lib/sitemap";

const sitemapEntries = [
  { path: "/" },
  { path: "/about/" },
  { path: "/contact/" },
  { path: "/privacy/" },
  { path: "/process/" },
] satisfies SitemapSourceEntry[];

if (!import.meta.env.SITE) {
  throw new Error("Set Astro site to the canonical production origin.");
}

const basePath = import.meta.env.BASE_URL.replace(/^\/+/, "");
const siteRoot = new URL(basePath, import.meta.env.SITE).href;

export const sitemapPlan = createSitemapPlan({
  siteRoot,
  entries: sitemapEntries,
});
