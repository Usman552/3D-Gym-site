import { gsap } from 'gsap';
import { wait } from '../utils/math.js';

/**
 * Brief intro loader that reports real progress from scene setup
 * (environment map, materials, shader compilation).
 */
export function createLoader() {
  const el = document.querySelector('[data-loader]');
  const bar = el.querySelector('[data-loader-bar]');
  const count = el.querySelector('[data-loader-count]');
  const startedAt = performance.now();
  let target = 0.08;
  let shown = 0;
  let raf = 0;

  const tick = () => {
    shown += (target - shown) * 0.12;
    bar.style.transform = `scaleX(${shown.toFixed(3)})`;
    count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    progress(p) {
      target = Math.max(target, Math.min(p, 1));
    },
    async finish() {
      target = 1;
      await wait(Math.max(350, 900 - (performance.now() - startedAt)));
      cancelAnimationFrame(raf);
      bar.style.transform = 'scaleX(1)';
      count.textContent = '100';
      document.body.classList.remove('is-loading');
      await gsap.to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' });
      el.remove();
    },
  };
}
