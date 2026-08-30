import type { APIRoute } from 'astro';
import { products } from '../data/catalogue';
import { collections } from '../data/site';

/** Sold pieces stay in the sitemap — the archive is an asset for a gallery. */
const staticRoutes = [
  '/', '/home', '/collections', '/gallery', '/workshop', '/about', '/contact',
  '/custom', '/search',
  '/legal/impressum', '/legal/datenschutz', '/legal/agb',
  '/legal/widerruf', '/legal/shipping',
];

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://example.invalid').replace(/\/$/, '');
  const urls = [
    ...staticRoutes,
    ...collections.map((c) => `/collections/${c.slug}`),
    ...products.map((p) => `/collections/${p.collection}/${p.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
