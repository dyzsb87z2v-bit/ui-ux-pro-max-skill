// @ts-check
import { defineConfig } from 'astro/config';

// A1 was not answered before START IMPLEMENTATION. Proceeding on the
// specification's recommendation (Astro + Cloudflare). The host choice is
// confined to this file and the adapter import — swapping it is config,
// not a rewrite.
export default defineConfig({
  // Set SITE_URL in your host's environment variables (Cloudflare Pages,
  // Netlify, ...) rather than editing this file. Canonical URLs, sitemap.xml
  // and the schema.org product data are all built from it, so leaving the
  // placeholder gets the placeholder indexed.
  site: process.env.SITE_URL ?? 'https://example.invalid',
  // i18n routing shape reserved now so adding a locale later breaks no URL.
  // Ships single-locale, unprefixed. (§09b rule 2)
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
