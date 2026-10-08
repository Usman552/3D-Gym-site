import { gsap } from 'gsap';

/**
 * Reusable reveal helpers. Every helper respects reduced motion by swapping
 * travel for a plain fade.
 */

/** Masked line reveal for `.line > span` markup. */
export function linesFrom(target, rm, vars = {}) {
  const els = gsap.utils.toArray(`${target} .line > span`);
  return gsap.from(els, rm
    ? { opacity: 0, duration: 0.6, stagger: 0.06, ...vars }
    : { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.08, ...vars });
}

/** Simple rise + fade. */
export function riseFrom(target, rm, vars = {}) {
  return gsap.from(target, {
    opacity: 0,
    y: rm ? 0 : 28,
    duration: 1,
    ease: 'expo.out',
    ...vars,
  });
}

/** Count numbers in [data-count] up from zero; returns a tween you can scrub. */
export function countUp(scope, vars = {}) {
  const els = gsap.utils.toArray(`${scope} [data-count]`);
  const proxy = { p: 0 };
  return gsap.to(proxy, {
    p: 1,
    ease: 'power2.out',
    ...vars,
    onUpdate() {
      for (const el of els) {
        const end = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const text = (end * proxy.p).toFixed(decimals);
        if (el.textContent !== text) el.textContent = text;
      }
    },
  });
}
