import { gsap } from 'gsap';

/**
 * Magnetic buttons: the button leans toward the cursor and its label leans a
 * little further, giving a sense of depth. Pointer devices only.
 */
export function initMagnetic(quality) {
  if (quality.touch || quality.reducedMotion) return;

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const label = el.firstElementChild;
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const lx = label ? gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3' }) : null;
    const ly = label ? gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3' }) : null;
    let rect = null;

    el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', (e) => {
      if (!rect) rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      x(dx * 0.22);
      y(dy * 0.3);
      lx?.(dx * 0.1);
      ly?.(dy * 0.12);
    });
    el.addEventListener('pointerleave', () => {
      rect = null;
      x(0); y(0); lx?.(0); ly?.(0);
    });
  });
}
