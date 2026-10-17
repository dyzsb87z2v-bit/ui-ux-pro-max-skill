/**
 * MiLAEDiA — scroll reveal.
 *
 * One IntersectionObserver for the whole page. Elements marked [data-reveal]
 * gain [data-revealed] once, and the CSS does the rest — no JS animation, no
 * library, nothing running after the element has arrived.
 *
 * THE RULE THIS ENFORCES: not every section animates. The directive is a
 * visual rhythm, so `data-reveal` is applied deliberately per section rather
 * than sprayed over every child. A page where everything moves reads as
 * restless, which is the opposite of the reference.
 *
 * Bails out to the finished state — never the hidden one — on reduced motion,
 * Save-Data, or a coarse low-memory device. A visitor who opts out of motion
 * sees the page, not a blank column.
 */
import { prefersLessMotion } from './depth';

export function initReveal(root: ParentNode = document) {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!targets.length) return () => {};

  // Opting out means arriving already revealed, not staying hidden.
  if (prefersLessMotion() || typeof IntersectionObserver === 'undefined') {
    for (const el of targets) el.setAttribute('data-revealed', '');
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        // Stagger children of a group by their index, capped so a long grid
        // never leaves the last card waiting.
        const i = Number(el.dataset.revealIndex ?? 0);
        el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 70}ms`);
        el.setAttribute('data-revealed', '');
        io.unobserve(el);
      }
    },
    // Fire a little before the element is fully on screen, so the movement
    // has finished by the time it is properly in view.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );

  for (const el of targets) io.observe(el);
  return () => io.disconnect();
}

/**
 * Scroll-linked depth for editorial plates. Writes --scroll-y (-1..1) on each
 * marked element, which CSS composes with that plate's own translateZ exactly
 * as the pointer engine composes --dx/--dy. Never writes `transform`.
 */
export function initScrollDepth(root: ParentNode = document) {
  const plates = Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-depth]'));
  if (!plates.length || prefersLessMotion()) return () => {};

  let raf = 0;
  const live = new Set<HTMLElement>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) live.add(e.target as HTMLElement);
        else live.delete(e.target as HTMLElement);
      }
      if (live.size && !raf) raf = requestAnimationFrame(frame);
    },
    { threshold: 0 },
  );
  for (const el of plates) io.observe(el);

  function frame() {
    const vh = window.innerHeight || 1;
    for (const el of live) {
      const r = el.getBoundingClientRect();
      // -1 when the plate is entering from below, +1 when leaving at the top.
      const p = 1 - 2 * ((r.top + r.height / 2) / vh);
      el.style.setProperty('--scroll-y', Math.max(-1, Math.min(1, p)).toFixed(3));
    }
    raf = live.size ? requestAnimationFrame(frame) : 0;
  }

  return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
}
