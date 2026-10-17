# MiLAEDiA

A luxury Persian rug house and art gallery. Astro, static output, no runtime
server required.

The design system in `src/styles/tokens.css` is **measured**, not chosen —
every colour, spacing step and type size was extracted from the supplied
visual references. Treat those values as data. `tests/invariants.spec.ts`
fails the build if a change drifts away from them.

---

## Requirements

- Node 22 (see `.nvmrc`; 20 also works)
- npm 10+

`sharp` is a dependency — it compiles image variants at build time and needs
a platform binary, which npm fetches automatically.

## Run it

```bash
npm install
npm run build      # -> dist/   (36 static pages)
npm run preview    # serve dist/ locally
npm run dev        # dev server with HMR
```

Other scripts:

```bash
npm run check      # astro check (TypeScript + template diagnostics)
npm test           # Playwright: the 7 visual invariants, desktop + mobile
```

The test run builds and previews the site itself, so it needs no server
already running. Install its browser once with:

```bash
npx playwright install chromium
```

If your machine or CI image already has a Chromium build, point at it instead
and skip the download:

```bash
CHROMIUM_PATH=/path/to/chrome npm test
```

## Deploying

`npm run build` writes a plain static `dist/`. There is no adapter and no
server runtime, so any static host serves it:

| Host | What to set |
|---|---|
| Cloudflare Workers | nothing -- `wrangler.jsonc` declares `./dist` as static assets |
| Cloudflare Pages | build `npm run build`, output directory `dist` |
| Netlify | same |
| GitHub Pages | publish `dist/` |
| nginx / Apache | serve `dist/` as the document root |

Cloudflare is folding Pages into Workers, and the dashboard's "Create" flow
now lands on Workers by default. `wrangler.jsonc` covers that case: a Worker
with no `main` entry and an `assets` directory runs no server code -- the edge
just serves the files in `dist/`.

Vercel works too, but note its Hobby tier prohibits commercial use — a shop
needs a paid plan there.

**Before the first deploy, set your domain.** Add an environment variable in
your host's dashboard -- no code change needed:

```
SITE_URL = https://your-domain.com
```

That value is not decoration. Canonical URLs, `sitemap.xml` and the
schema.org product data are all built from it, so search engines will index
`example.invalid` if you leave it unset. Locally: `SITE_URL=https://your-domain.com npm run build`.

## Where things live

| What you want to change | File |
|---|---|
| Products, prices, availability, dimensions | `src/data/catalogue.ts` |
| Collections, navigation, cities | `src/data/site.ts` |
| Product and scene imagery | `src/assets/`, wired in `src/lib/images.ts` |
| Atelier video and poster | `public/media/` |
| Colours, spacing, type scale | `src/styles/tokens.css` |
| Payment integration | `src/lib/payment.ts` |
| Legal text | `src/pages/legal/` |

`/admin` is a read-only reference page listing the same locations. It has no
write path and **no authentication** — put edge auth in front of it before
deploying anywhere public, or delete `src/pages/admin/`.

### Adding a product

Append to the `products` array in `src/data/catalogue.ts`. Routes, sitemap
entries, search index and structured data all derive from it — nothing else
to register. Three inventory modes are supported:

- `one_of_one` — a single piece; quantity is capped at 1
- `stocked` — a counted run, with a low-stock threshold
- `made_to_order` — commissioned, with a lead time in days

Availability is **derived**, never stored (`src/lib/inventory.ts`), so a
piece cannot be sold and in stock at the same time.

### Adding a 3D model

Set `model` on the product record and drop the `.glb` in `public/models/`.
`RugViewer` mounts `<model-viewer>` in the same frame. With no model it falls
back to a perspective inspector over the photograph — tilt, magnify,
keyboard, fullscreen — and says so in the caption. It never pretends to be
3D geometry that does not exist.

## What is not finished

`PLACEHOLDERS.md` is the authoritative list. The short version:

- **Payment.** No provider is connected. `src/lib/payment.ts` is the single
  integration point; `createPaymentSession` throws `PaymentNotConfigured`,
  and checkout falls back to recording a draft order reference. Nothing
  anywhere claims a payment succeeded.
- **Legal pages.** German Impressum, Datenschutz, AGB, Widerruf and shipping
  terms are marked `PLACEHOLDER` with no invented company details. They must
  be completed by someone qualified before launch.
- **Product photography.** The five collection images are 260×360 crops from
  the visual references — the only rug imagery supplied. Cards and the viewer
  mat them near 1:1 so they stay sharp, and `focal()` in `src/lib/images.ts`
  pans each piece to a different region so sibling cards are not identical
  tiles. Replace with real per-product photography and remove both.
- **Catalogue.** The 12 products are demonstration data, marked as such at
  the top of `src/data/catalogue.ts`.
- **Locales.** Ships single-locale English. The i18n routing shape is already
  reserved in `astro.config.mjs`, and the CSS uses logical properties
  throughout, so adding German and Persian (RTL) does not restructure the UI.

## Repository layout

```
src/
  assets/       source imagery, processed at build time
  components/   composed UI; primitives/ holds the smallest pieces
  data/         catalogue + site structure
  layouts/      Base.astro — head, canonical, fonts
  lib/          bag, inventory, payment, seo, images, depth engine
  pages/        routes (file-based)
  styles/       tokens.css (measured) + base.css
public/         copied verbatim: media, robots.txt
tests/          visual invariants
scripts/        packages dist/ into a single-file preview; not part of the build
```

`scripts/` is a convenience for sharing a preview as one HTML file. Deleting
it changes nothing about the site.
