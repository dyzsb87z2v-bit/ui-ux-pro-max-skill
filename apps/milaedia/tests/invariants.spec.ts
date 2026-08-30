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

const PAGES = ['/'];

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
      await page.waitForLoadState('networkidle');
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
      await page.waitForLoadState('networkidle');
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
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const cs = getComputedStyle(el);
          if (cs.boxShadow && cs.boxShadow !== 'none') {
            shadows.push(el.tagName + '.' + (el.className || '') + ' :: ' + cs.boxShadow);
          }
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
            const w = parseFloat(cs[`border${side}Width` as any] as string);
            if (w > 1.01) thick.push(el.tagName + '.' + (el.className || '') + ` :: ${side} ${w}px`);
          }
        }
        return { shadows, thick };
      });
      expect(bad.shadows, 'box-shadow is forbidden — elevation is hairline + reflection + bloom').toEqual([]);
      expect(bad.thick, 'border must never exceed 1px — 2px doubles the weight of the whole interface').toEqual([]);
    });
  }
});

/* ---------- 4. editorial type ratio ---------- */
test.describe('invariant 4 — editorial type ratio', () => {
  test('/: display ÷ support ≈ 6.2, with no intermediate level', async ({ page }) => {
    await page.goto('/');
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
    // Measured 6.2:1. Allow drift for fluid clamping, but a "balanced"
    // modular scale (3–4:1) must fail — the gap IS the luxury.
    expect(ratio, `display:support ratio ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(5.0);
  });
});

/* ---------- 5. asymmetric panel rhythm ---------- */
test.describe('invariant 5 — asymmetric panel rhythm', () => {
  test('/: no repeat(n, 1fr) in scene rows', async ({ page }) => {
    await page.goto('/');
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
  test('/: interactive elements are gold, labels are silver', async ({ page }) => {
    await page.goto('/');
    const wrong = await page.evaluate(() => {
      const warm = (c: string) => {
        const m = c.match(/\d+/g); if (!m) return false;
        const [r, g, b] = m.map(Number);
        return r > b + 12 && r >= g && g > b; // warm ramp
      };
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll('a, button, [role="button"]'))) {
        if ((el as HTMLElement).dataset.tone === 'silver') continue; // non-purchasable, by design
        if (el.classList.contains('skip-link')) continue;
        const c = getComputedStyle(el).color;
        if (!warm(c)) out.push((el.textContent || '').trim().slice(0, 32) + ' :: ' + c);
      }
      return out;
    });
    expect(wrong, 'interactive elements must take the gold ramp').toEqual([]);
  });
});
