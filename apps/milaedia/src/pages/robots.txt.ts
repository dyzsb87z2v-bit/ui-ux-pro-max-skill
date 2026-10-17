import type { APIRoute } from 'astro';

/**
 * robots.txt is generated, not a static file in public/.
 *
 * The Sitemap directive must be an ABSOLUTE url -- the spec requires it and
 * Google ignores a relative one, so the sitemap was never being read. A file
 * in public/ is copied verbatim and cannot know the deployed domain, so this
 * builds it from `site` (SITE_URL) exactly as sitemap.xml.ts does.
 */
export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() ?? 'https://example.invalid').replace(/\/$/, '');
  const body = [
    'User-agent: *',
    'Allow: /',
    // Private or transactional surfaces. Keeping them out of the index is a
    // crawling hint, not a security control -- /admin still needs real auth.
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /checkout',
    'Disallow: /order',
    'Disallow: /bag',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
