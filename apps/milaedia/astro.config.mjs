// @ts-check
import { defineConfig } from 'astro/config';

// A1 was not answered before START IMPLEMENTATION. Proceeding on the
// specification's recommendation (Astro + Cloudflare). The host choice is
// confined to this file and the adapter import — swapping it is config,
// not a rewrite.
export default defineConfig({
  site: 'https://example.invalid', // PLACEHOLDER — domain is a launch input (§22, class C)
  // i18n routing shape reserved now so adding a locale later breaks no URL.
  // Ships single-locale, unprefixed. (§09b rule 2)
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
