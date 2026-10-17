/**
 * Homepage QA sweep — the checks the invariant suite does not cover.
 *
 * Six widths for horizontal overflow and layout breaks, every scroll reveal
 * firing, every image resolving, reduced-motion and Save-Data leaving the
 * page VISIBLE rather than stuck hidden, and every internal link resolving.
 *
 *   npm run preview -- --port 4321
 *   node scripts/qa-home.mjs            # or QA_BASE=... node scripts/qa-home.mjs
 *
 * An element past the viewport edge only counts as a break when nothing clips
 * it: the hero plate is deliberately overscanned (scale 1.11) so parallax
 * never reveals an edge, and it sits inside overflow:clip.
 */
import { chromium } from '@playwright/test';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4321';
const URL = BASE + '/home/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];

async function scrollThrough(pg) {
  await pg.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 130));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 250));
  });
}

console.log('WIDTH   OVERFLOW  REVEALED  IMGS(broken)  SECTIONS  CONSOLE');
for (const w of [390, 768, 1024, 1440, 1536, 2560]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 120)));
  pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_/.test(m.text())) errs.push(m.text().slice(0, 120)); });
  // Block off-origin so the run does not depend on this container's egress
  // proxy. The webfont is the only one and it is not what QA measures --
  // leaving it in reports a 404 that says nothing about the page.
  await pg.route('**/*', (route) =>
    route.request().url().startsWith(BASE) ? route.continue() : route.abort());
  await pg.goto(URL, { waitUntil: 'load' });
  await pg.waitForTimeout(900);
  await scrollThrough(pg);

  const r = await pg.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    revealed: document.querySelectorAll('[data-reveal][data-revealed]').length,
    reveals: document.querySelectorAll('[data-reveal]').length,
    imgs: document.images.length,
    broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length,
    sections: document.querySelectorAll('main > section').length,
    // An element past the edge is only a break if nothing clips it. Deliberate
    // overscan (the hero plate is scaled 1.11 so parallax never reveals an
    // edge) sits inside an overflow:clip parent and is correct.
    wide: [...document.querySelectorAll('main *')].filter(e => {
      if (e.getBoundingClientRect().right <= innerWidth + 1) return false;
      for (let p = e.parentElement; p; p = p.parentElement) {
        if (['hidden', 'clip'].includes(getComputedStyle(p).overflowX)) return false;
      }
      return true;
    }).length,
  }));
  if (r.overflow > 0) problems.push(`${w}px: horizontal overflow ${r.overflow}px`);
  if (r.wide > 0) problems.push(`${w}px: ${r.wide} element(s) past the viewport edge`);
  if (r.broken > 0) problems.push(`${w}px: ${r.broken} broken image(s)`);
  if (r.revealed < r.reveals) problems.push(`${w}px: ${r.reveals - r.revealed} reveal(s) never fired`);
  if (errs.length) problems.push(`${w}px: ${errs[0]}`);
  console.log(
    String(w).padEnd(8) + String(r.overflow).padEnd(10) +
    `${r.revealed}/${r.reveals}`.padEnd(10) + `${r.imgs}(${r.broken})`.padEnd(14) +
    String(r.sections).padEnd(10) + (errs.length ? errs[0] : 'clean')
  );
  if (w === 390) await pg.screenshot({ path: '/tmp/home-390.png', fullPage: true });
  if (w === 1536) await pg.screenshot({ path: '/tmp/home-1536.png', fullPage: true });
  await pg.close();
}

// ---- reduced motion: content must be VISIBLE, not stuck hidden ----
const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await rm.goto(URL, { waitUntil: 'load' });
await rm.waitForTimeout(1000);
const rmr = await rm.evaluate(() => {
  const hidden = [...document.querySelectorAll('[data-reveal]')]
    .filter(e => parseFloat(getComputedStyle(e).opacity) < 0.9).length;
  return { hidden, total: document.querySelectorAll('[data-reveal]').length,
           perspective: getComputedStyle(document.querySelector('.salon')).perspective };
});
console.log(`\nreduced-motion: ${rmr.total - rmr.hidden}/${rmr.total} visible, hero perspective ${rmr.perspective}`);
if (rmr.hidden > 0) problems.push(`reduced-motion: ${rmr.hidden} element(s) stuck hidden`);
await rm.close();

// ---- Save-Data: engine must bail, content must still be visible ----
const sd = await b.newContext({ viewport: { width: 1440, height: 900 } });
await sd.addInitScript(() => {
  Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true, effectiveType: '4g' }) });
});
const sp = await sd.newPage();
await sp.goto(URL, { waitUntil: 'load' });
await sp.waitForTimeout(1000);
const sdr = await sp.evaluate(() => ({
  static: document.querySelector('[data-salon]')?.hasAttribute('data-depth-static'),
  hidden: [...document.querySelectorAll('[data-reveal]')].filter(e => parseFloat(getComputedStyle(e).opacity) < 0.9).length,
}));
console.log(`save-data:      depth static ${sdr.static}, ${sdr.hidden} element(s) hidden`);
if (!sdr.static) problems.push('save-data: depth engine did not bail');
if (sdr.hidden > 0) problems.push(`save-data: ${sdr.hidden} element(s) stuck hidden`);
await sd.close();

// ---- every link resolves ----
const lp = await b.newPage({ viewport: { width: 1440, height: 900 } });
await lp.goto(URL, { waitUntil: 'load' });
const hrefs = await lp.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')))]);
let bad = [];
for (const h of hrefs) {
  const res = await lp.request.get(BASE + h);
  if (!res.ok()) bad.push(`${h} → ${res.status()}`);
}
console.log(`links:          ${hrefs.length} internal, ${bad.length ? 'BROKEN: ' + bad.join(', ') : 'all resolve'}`);
if (bad.length) problems.push('broken links: ' + bad.join(', '));
await lp.close();

console.log('\n' + (problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'ALL CHECKS PASS'));
await b.close();
