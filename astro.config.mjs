import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

const indexablePaths = new Set(['/', '/about/', '/process/', '/contact/']);

export default defineConfig({
  site: 'https://shoppa.au',
  output: 'static',
  trailingSlash: 'always',
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-display',
      weights: [700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Figtree',
      cssVariable: '--font-body',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Courier Prime',
      cssVariable: '--font-mono',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Courier New', 'monospace'],
    },
  ],
  integrations: [
    sitemap({
      filter: (page) => indexablePaths.has(new URL(page).pathname),
    }),
  ],
});
