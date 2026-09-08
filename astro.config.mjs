import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://shoppa.au',
  output: 'static',
  trailingSlash: 'always',
  build: {
    // Inline all CSS into each page. The bundled stylesheet is ~7 KiB, and GitHub
    // Pages caps every response at Cache-Control: max-age=600, so an external
    // stylesheet costs a render-blocking round trip on most visits while its
    // cache repays almost nothing. Keep this 'always' when assetsInlineLimit is
    // 0: Astro also uses that limit for stylesheet inlining, so 'auto' would
    // push CSS out to a render-blocking file.
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Emit the landing module as `/_astro/*.js` so CSP can stay
      // `script-src 'self'` without hashes (D-10). Coupled with
      // `build.inlineStylesheets: 'always'` above.
      assetsInlineLimit: 0,
    },
  },
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
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Courier Prime',
      cssVariable: '--font-mono',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Courier New', 'monospace'],
    },
  ],
});
