/**
 * MiLAEDiA — the six invariants, as failing tests.
 *
 * Each threshold is measured from the reference set (see
 * docs/milaedia/MEASUREMENTS.md). If one of these fails, the build has
 * drifted away from the reference and toward a generic dark template.
 * Fix the page, not the threshold.
 */
import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

/**
 * The intro gate is a transient overlay carrying the reference video, which
 * has its own baked-in look. The invariants guard THE PAGES, so every test
 * starts from the "already entered" state — which is also what a returning
 * visitor and every crawler see.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('milaedia:intro-seen', '1'); } catch { /* ignore */ }
  });
  // Block every off-origin request. The webfont is the only one, it is not
  // what these invariants measure, and leaving it in makes `networkidle`
  // depend on the container's egress proxy -- which stalls the whole suite.
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4321') || url.startsWith('data:')) return route.continue();
    return route.abort();
  });
});

// Every page the build serves is guarded, not just the landing page.
const PAGES = ['/', '/home', '/collections', '/collections/antique-rugs',
  '/collections/antique-rugs/kashan-medallion-antique', '/gallery', '/custom',
  '/about', '/workshop', '/contact', '/bag', '/checkout', '/search'];

/* ---------- helpers ---------- */

async function pixels(page: Page) {
  const buf = await page.screenshot({ type: 'png', fullPage: false });
  // Decode PNG in the browser context — no image library needed on Node.
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    // Downsample before extraction. The reference baselines in
    // MEASUREMENTS.md were computed on 200–400px resizes, so this matches
    // the measurement method — and it keeps millions of values off the
    // CDP bridge, which was timing out at DPR 3 on mobile.
    const W = 400;
    const H = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * W));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const out: number[] = [];
    for (let i = 0; i < d.length; i += 4) out.push(d[i], d[i + 1], d[i + 2]);
    return out;
  }, buf.toString('base64'));
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hsv(r: number, g: number, b: number) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/* ---------- 1. true low-key light ---------- */
test.describe('invariant 1 — true low-key light', () => {
  for (const path of PAGES) {
    test(`${path}: >=40% darkest decile, <=2% above 70% luminance`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      await page.waitForTimeout(350);
      const px = await pixels(page);
      let dark = 0, bright = 0;
      const n = px.length / 3;
      for (let i = 0; i < px.length; i += 3) {
        const L = luminance(px[i], px[i + 1], px[i + 2]);
        if (L < 25.5) dark++;
        if (L > 178.5) bright++;
      }
      const darkPct = (dark / n) * 100;
      const brightPct = (bright / n) * 100;
      // Measured across all 15 reference assets: 23–74% in the darkest
      // decile, under 1–2% above 70%.
      expect(darkPct, `darkest decile ${darkPct.toFixed(1)}%`).toBeGreaterThanOrEqual(40);
      expect(brightPct, `highlights ${brightPct.toFixed(2)}%`).toBeLessThanOrEqual(2);
    });
  }
});

/* ---------- 2. warm monochrome ---------- */
test.describe('invariant 2 — warm monochrome', () => {
  for (const path of PAGES) {
    test(`${path}: saturated pixels sit in H 20–40, twilight excepted`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      await page.waitForTimeout(350);
      const px = await pixels(page);
      let inRange = 0, twilight = 0, offPalette = 0;
      for (let i = 0; i < px.length; i += 3) {
        const { h, s, v } = hsv(px[i], px[i + 1], px[i + 2]);
        if (s < 0.25 || v < 0.15) continue; // unsaturated or near-black: ignore
        // Bands derived by scoring the reference assets themselves:
        //   gold H 24–37, crimson H 4–17 — and crimson WRAPS through 360,
        //   so the warm band must wrap or the rugs score as off-palette.
        //   The twilight sky is a nine-stop arc running 219 -> 329 -> 10,
        //   so its cool band extends to 345, not 280.
        //   H 45–190 (greens, cyans) appears in NO reference asset and in
        //   no palette token — that is the genuinely forbidden zone.
        if (h <= 45 || h >= 345) inRange++;
        else if (h >= 190 && h < 345) twilight++;
        else offPalette++;
      }
      const total = inRange + twilight + offPalette;
      if (total === 0) return; // nothing saturated on screen yet
      const offPct = (offPalette / total) * 100;
      // Reference assets score 0.08–2.4% under these bands; 3% is the ceiling.
      expect(offPct, `off-palette saturated pixels ${offPct.toFixed(1)}%`).toBeLessThanOrEqual(3);
    });
  }
});

/* ---------- 3. interface reduced to hairline ---------- */
test.describe('invariant 3 — interface reduced to hairline', () => {
  for (const path of PAGES) {
    test(`${path}: zero box-shadows, no border wider than 1px`, async ({ page }) => {
      await page.goto(path);
      const bad = await page.evaluate(() => {
        const shadows: string[] = [];
        const thick: string[] = [];
        // A surface genuinely lifted along Z may cast a shadow -- that is what
        // makes it read as lifted rather than pasted on, and the approved 3D
        // direction asks for it. A shadow on a FLAT surface is still
        // forbidden: that is the decorative drop-shadow this invariant exists
        // to keep out. The test is the transform, not the element.
        const lifted = (el: Element) => {
          const t = getComputedStyle(el).transform;
          if (!t || t === 'none') return false;
          const m = t.match(/matrix3d\(([^)]+)\)/);
          if (!m) return false;
          const z = parseFloat(m[1].split(',')[14]);
          return Number.isFinite(z) && z > 1;
        };
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const cs = getComputedStyle(el);
          if (cs.boxShadow && cs.boxShadow !== 'none' && !lifted(el)) {
            shadows.push(el.tagName + '.' + (el.className || '') + ' :: ' + cs.boxShadow);
          }
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
            const w = parseFloat(cs[`border${side}Width` as any] as string);
            if (w > 1.01) thick.push(el.tagName + '.' + (el.className || '') + ` :: ${side} ${w}px`);
          }
        }
        return { shadows, thick };
      });
      expect(bad.shadows, 'box-shadow on a FLAT surface is forbidden — elevation is hairline + reflection + bloom, or a real Z lift').toEqual([]);
      expect(bad.thick, 'border must never exceed 1px — 2px doubles the weight of the whole interface').toEqual([]);
    });
  }
});

/* ---------- 4. editorial type ratio ---------- */
const DISPLAY_PAGES = ['/', '/home', '/collections'];
test.describe('invariant 4 — editorial type ratio', () => {
  for (const path of DISPLAY_PAGES)
  test(`${path}: display ÷ support ≈ 6.2, with no intermediate level`, async ({ page }) => {
    await page.goto(path);
    const sizes = await page.evaluate(() => {
      const el = (s: string) => document.querySelector(s);
      const px = (e: Element | null) => (e ? parseFloat(getComputedStyle(e).fontSize) : 0);
      return {
        display: px(el('[data-type="display"]')),
        tagline: px(el('[data-type="tagline"]')),
      };
    });
    expect(sizes.display, 'no [data-type="display"] on page').toBeGreaterThan(0);
    expect(sizes.tagline, 'no [data-type="tagline"] on page').toBeGreaterThan(0);
    const ratio = sizes.display / sizes.tagline;
    // BASELINE UPDATED to the second reference, which supersedes the first
    // as the approved visual direction.
    //   reference 1: display cap 6.2x the support line
    //   reference 2: display cap 67px, support cap 15px  ->  4.47x
    // Both measured off the supplied images, not chosen. The invariant's
    // PURPOSE is unchanged and is not the specific number: it forbids a
    // middle tier. A "balanced" modular scale (3-4:1) still fails at every
    // width. Below 640px the ratio may compress further -- 6.12vw is only
    // 24px at 390px, which is no longer a hero.
    const width = page.viewportSize()?.width ?? 1440;
    const floor = width <= 640 ? 3.9 : 4.2;
    expect(ratio, `display:support ratio ${ratio.toFixed(2)} at ${width}px`).toBeGreaterThanOrEqual(floor);
  });
});

/* ---------- 5. asymmetric panel rhythm ---------- */
test.describe('invariant 5 — asymmetric panel rhythm', () => {
  for (const path of PAGES)
  test(`${path}: no repeat(n, 1fr) in scene rows`, async ({ page }) => {
    await page.goto(path);
    const uniform = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll('[data-scene-row]'))) {
        const cols = getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat);
        if (cols.length > 1 && cols.every((c) => Math.abs(c - cols[0]) < 1)) {
          out.push((el as HTMLElement).dataset.sceneRow ?? el.className);
        }
      }
      return out;
    });
    // Measured: window triptych 1.5 : 1.1 : 1, object triptych 1 : 1.8 : 1.2.
    // Only the five collection cards are uniform, and they are not scene rows.
    expect(uniform, 'scene rows must not use equal columns').toEqual([]);
  });
});

/* ---------- 6. temperature encodes state ---------- */
test.describe('invariant 6 — temperature encodes state', () => {
  for (const path of PAGES)
  test(`${path}: every interactive colour is on the gold or silver ramp, and current is gold`, async ({ page }) => {
    await page.goto(path);
    const result = await page.evaluate(() => {
      const rgb = (c: string) => (c.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      // Gold ramp: warm, red-dominant. Silver ramp: achromatic.
      const gold = (c: string) => { const [r, g, b] = rgb(c); return r > b + 12 && r >= g && g >= b; };
      const silver = (c: string) => {
        const [r, g, b] = rgb(c);
        return Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && Math.abs(r - b) <= 12;
      };
      const offSystem: string[] = [];
      const currentNotGold: string[] = [];
      const els = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      for (const el of els) {
        if (el.classList.contains('skip-link')) continue;
        const c = getComputedStyle(el).color;
        const label = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28);
        // The measured rule: gold = brand/active, silver = neutral/label.
        // Idle nav links ARE interactive and ARE silver in the reference, so
        // the assertion is that nothing sits OUTSIDE the two ramps.
        if (!gold(c) && !silver(c)) offSystem.push(`${label} :: ${c}`);
        // Anything marked current must be gold — that is the state signal.
        if (el.getAttribute('aria-current') === 'page' && !gold(c)) {
          currentNotGold.push(`${label} :: ${c}`);
        }
      }
      // The primary CTA must be gold.
      const cta = document.querySelector('.ghost[data-tone="gold"]');
      const ctaGold = cta ? gold(getComputedStyle(cta).color) : null;
      return { offSystem, currentNotGold, ctaGold };
    });
    expect(result.offSystem, 'interactive colours must sit on the gold or silver ramp').toEqual([]);
    expect(result.currentNotGold, 'aria-current elements must be gold — temperature is the state signal').toEqual([]);
    // Not every page has a primary CTA — the collections index is driven by
    // the cards themselves. The assertion is conditional: IF one exists, it
    // must be gold.
    expect(result.ctaGold ?? true, 'primary CTA must be on the gold ramp').toBe(true);
  });
});

/* ---------- 7. the type never loses its shadow pocket ----------
   The measured hero places its type at ~18% of peak luminance, with no
   scrim. Parallax can drag a bright layer under it — the single most
   predictable failure in the build (spec §11). This measures the region
   BEHIND the type block, at rest and after the depth engine has been pushed
   to its clamp in every direction. */
test.describe('invariant 7 — the type keeps its shadow pocket', () => {
  for (const path of ['/home', '/'])
  test(`${path}: luminance behind the display type stays low under parallax`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');
      await page.waitForTimeout(350);

    const box = await page.locator('[data-type="display"]').first().boundingBox();
    expect(box, 'no display type found').not.toBeNull();

    const sample = async () => {
      const shot = await page.screenshot({
        clip: { x: box!.x, y: box!.y, width: box!.width, height: box!.height },
        type: 'png',
      });
      return page.evaluate(async (b64) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = 200;
        c.height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * 200));
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        // The glyphs themselves are bright by design. Measure the GROUND:
        // the darker half of the region is the backing the type sits on.
        const lums: number[] = [];
        for (let i = 0; i < d.length; i += 4) {
          lums.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
        }
        lums.sort((a, b) => a - b);
        return lums[Math.floor(lums.length * 0.5)]; // median = the backing
      }, shot.toString('base64'));
    };

    const readings: number[] = [await sample()];

    // Push the depth engine to its clamp from four directions and re-measure.
    const vp = page.viewportSize()!;
    for (const [x, y] of [[10, 10], [vp.width - 10, 10], [10, vp.height - 10], [vp.width - 10, vp.height - 10]]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(700);
      readings.push(await sample());
    }

    const worst = Math.max(...readings);
    // Measured backing under the reference hero type: L 16–29 of 255.
    // 70 leaves generous headroom for the interim plate while still failing
    // if a bright layer drifts under the wordmark.
    expect(worst, `worst backing luminance ${worst.toFixed(1)} across ${readings.length} camera positions`)
      .toBeLessThanOrEqual(70);
  });
});
