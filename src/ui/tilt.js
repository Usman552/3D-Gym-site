import { gsap } from 'gsap';

/**
 * Restrained 3D card tilt (max ~5°) plus a cursor-following highlight driven
 * by CSS custom properties. Inner layers use translateZ for depth.
 */
export function initTilt(quality) {
  if (quality.touch || quality.reducedMotion) return;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    gsap.set(card, { transformPerspective: 1000 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
    let rect = null;

    card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      ry((px - 0.5) * 9);
      rx((0.5 - py) * 7);
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      rect = null;
      rx(0);
      ry(0);
    });
  });
}
