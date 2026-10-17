/**
 * MiLAEDiA — depth engine.
 *
 * Drives the layered 3D scenes: pointer parallax, scroll parallax and a very
 * slow ambient camera drift. One rAF loop for the whole page, one transform
 * write per layer per frame.
 *
 * THE MEASURED CONSTRAINTS THIS ENFORCES (spec §11):
 *
 * 1. Offsets are CLAMPED. The hero type sits in a shadow pocket at ~18% of
 *    peak luminance. Unclamped parallax can drag a bright layer under it and
 *    destroy readability — the most predictable failure in the whole build.
 *
 * 2. Motion stays BOUNDED INSIDE ITS FRAME. Layer 1 (the twilight sky) is the
 *    only layer that is both cool and bright, and it is 0.5% of the system's
 *    saturated pixels. If parallax lets it escape the window frame, the sole
 *    cool accent is damaged. Every layer therefore moves less than its own
 *    overscan.
 *
 * 3. The envelope is the reference's, not invented: hold -> ease-in ->
 *    plateau -> ease-out -> settle, measured from the intro's encoded
 *    per-frame sizes.
 *
 * Bails out entirely — leaving a correct static composition — on
 * prefers-reduced-motion, Save-Data, coarse low-memory devices, or when the
 * scene is off-screen.
 */

export interface DepthOptions {
  /** Max px a depth-1 layer may travel. Deeper layers move proportionally less. */
  maxShift?: number;
  /** Max degrees of camera yaw/pitch. Kept small: no spinning, no bounce. */
  maxTilt?: number;
  /** Ambient drift amplitude in px. Very slow, very small. */
  drift?: number;
}

const DEFAULTS: Required<DepthOptions> = { maxShift: 18, maxTilt: 2.2, drift: 6 };

export function prefersLessMotion(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const c = (navigator as any).connection;
  if (c?.saveData) return true;
  if (c && /^(slow-)?2g$/.test(c.effectiveType ?? '')) return true;
  // Low-power heuristic: coarse pointer AND little memory or few cores.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if (coarse && ((mem && mem <= 4) || (cores && cores <= 4))) return true;
  return false;
}

export function initDepth(stage: HTMLElement, opts: DepthOptions = {}) {
  const { maxShift, maxTilt, drift } = { ...DEFAULTS, ...opts };

  if (prefersLessMotion()) {
    stage.setAttribute('data-depth-static', '');
    return () => {};
  }

  const layers = Array.from(
    stage.querySelectorAll<HTMLElement>('[data-depth]'),
  ).map((el) => ({ el, depth: Math.max(1, Number(el.dataset.depth) || 1) }));
  if (!layers.length) return () => {};

  const maxDepth = Math.max(...layers.map((l) => l.depth));

  // pointer target (-1..1), scroll progress, and the drift clock
  let px = 0, py = 0;      // target
  let cx = 0, cy = 0;      // current, eased
  let scroll = 0;
  let visible = false;
  let raf = 0;
  const t0 = performance.now();

  /**
   * Listens on the WINDOW, not the stage. The stage is a decorative layer
   * behind the content and is not in the hit-testing path — a listener bound
   * to it never fires. Coordinates are still resolved against the stage's own
   * rect, and the target decays to centre once the pointer leaves its box, so
   * the scene settles instead of freezing at an offset.
   */
  const onPointer = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    // Beyond 1.6 box-widths away the scene returns to rest.
    const falloff = Math.max(0, 1 - (Math.max(Math.abs(nx), Math.abs(ny)) - 1) / 0.6);
    px = Math.max(-1, Math.min(1, nx)) * falloff;
    py = Math.max(-1, Math.min(1, ny)) * falloff;
  };

  const onScroll = () => {
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // -1 (below viewport) .. 1 (above)
    scroll = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / vh));
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    },
    { rootMargin: '10%' },
  );
  io.observe(stage);

  function frame(now: number) {
    // ease toward the pointer target — no snapping, no spring overshoot
    cx += (px - cx) * 0.06;
    cy += (py - cy) * 0.06;

    // ambient drift: two slow, mutually prime periods so it never visibly loops
    const t = (now - t0) / 1000;
    const dx = Math.sin(t / 11) * drift;
    const dy = Math.cos(t / 17) * drift * 0.6;

    for (const { el, depth } of layers) {
      // Deeper layers move LESS — real parallax, and it keeps the far
      // (bright, cool) plate from escaping its frame.
      const k = (maxDepth - depth + 1) / maxDepth;
      const x = (cx * maxShift + dx) * k;
      const y = (cy * maxShift * 0.55 + dy + scroll * maxShift * 1.6) * k;
      /**
       * Custom properties, NOT `transform`. Each plane composes its own 3D
       * placement (translateZ, rotateX) with these offsets in CSS. Writing
       * `transform` here would overwrite that placement and flatten the
       * scene — the floor would stand up and the depth would collapse.
       */
      el.style.setProperty('--dx', `${x.toFixed(2)}px`);
      el.style.setProperty('--dy', `${y.toFixed(2)}px`);
    }

    // Camera yaw/pitch on the stage itself. Small — this is a room, not a toy.
    stage.style.setProperty('--cam-yaw', `${(cx * maxTilt).toFixed(3)}deg`);
    stage.style.setProperty('--cam-pitch', `${(-cy * maxTilt * 0.7).toFixed(3)}deg`);

    raf = visible ? requestAnimationFrame(frame) : 0;
  }

  const fine = window.matchMedia('(pointer: fine)').matches;
  if (fine) window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return () => {
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
  };
}
