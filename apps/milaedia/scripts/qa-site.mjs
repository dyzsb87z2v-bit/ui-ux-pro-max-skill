/**
 * Site-wide QA sweep — every route, three widths.
 *
 * Checks the things that break when a shared component changes: horizontal
 * overflow, elements escaping an unclipped parent, broken images, console
 * errors, and the gap between the header band and the first content (dead
 * space is a visual bug, not just a preference).
 *
 *   npm run preview -- --port 4321
 *   node scripts/qa-site.mjs        # or QA_BASE=... node scripts/qa-site.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321';
const ROUTES = [
  '/', '/home', '/collections', '/collections/luxury-rugs',
  '/collections/luxury-rugs/isfahan-signature', '/gallery', '/custom', '/bag',
  '/checkout', '/order', '/search', '/about', '/workshop', '/contact',
  '/account', '/admin', '/legal/impressum', '/legal/datenschutz', '/legal/agb',
  '/legal/widerruf', '/legal/shipping', '/404.html',
];
const WIDTHS = [390, 768, 1440];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];

for (const w of WIDTHS) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } });
  await pg.route('**/*', (r) =>
    r.request().url().startsWith(BASE) ? r.continue() : r.abort());

  const errs = [];
  pg.on('pageerror', (e) => errs.push(String(e).slice(0, 110)));
  pg.on('console', (m) => {
    // the off-origin webfont is blocked by this harness on purpose
    if (m.type() === 'error' && !/ERR_FAILED|fonts\.g|404/.test(m.text())) errs.push(m.text().slice(0, 110));
  });

  let worstGap = 0, worstGapRoute = '';
  for (const route of ROUTES) {
    errs.length = 0;
    const url = BASE + (route.endsWith('.html') ? route : route.replace(/\/?$/, '/'));
    const res = await pg.goto(url, { waitUntil: 'load' });
    if (!res.ok()) { problems.push(`${w}px ${route}: HTTP ${res.status()}`); continue; }
    await pg.waitForTimeout(320);

    const m = await pg.evaluate(() => {
      const band = document.querySelector('.band')?.getBoundingClientRect();
      const main = document.querySelector('main');
      // The first BLOCK under the header, not the first text node. A split
      // layout that centres its copy beside a tall image puts the first <p>
      // far down the page by design; measuring that reports dead space that
      // is not there.
      let firstTop = null;
      for (const e of main?.children ?? []) {
        const r = e.getBoundingClientRect();
        if (r.height > 4) { firstTop = r.top; break; }
      }
      const escaped = [...document.querySelectorAll('body *')].filter((e) => {
        if (e.getBoundingClientRect().right <= innerWidth + 1) return false;
        for (let p = e.parentElement; p; p = p.parentElement) {
          if (['hidden', 'clip'].includes(getComputedStyle(p).overflowX)) return false;
        }
        return true;
      }).length;
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        escaped,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length,
        gap: band && firstTop != null ? Math.round(firstTop - band.height) : null,
        hasHeader: !!band,
      };
    });

    if (m.overflow > 0) problems.push(`${w}px ${route}: overflow ${m.overflow}px`);
    if (m.escaped > 0) problems.push(`${w}px ${route}: ${m.escaped} element(s) escape an unclipped parent`);
    if (m.broken > 0) problems.push(`${w}px ${route}: ${m.broken} broken image(s)`);
    if (!m.hasHeader && !['/', '/admin'].includes(route)) problems.push(`${w}px ${route}: no header band`);
    if (m.gap != null && m.gap > 240) problems.push(`${w}px ${route}: ${m.gap}px dead space under the header`);
    if (m.gap != null && m.gap > worstGap) { worstGap = m.gap; worstGapRoute = route; }
    if (errs.length) problems.push(`${w}px ${route}: ${errs[0]}`);
  }
  console.log(`${String(w).padStart(5)}px  ${ROUTES.length} routes  worst header gap ${worstGap}px (${worstGapRoute})`);
  await pg.close();
}

console.log('\n' + (problems.length
  ? `PROBLEMS (${problems.length}):\n  ` + problems.join('\n  ')
  : 'ALL ROUTES PASS'));
await b.close();
