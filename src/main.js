import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getQuality, hasWebGL } from './utils/device.js';
import { initNav } from './ui/nav.js';
import { initMagnetic } from './ui/magnetic.js';
import { initTilt } from './ui/tilt.js';
import { initPricing } from './ui/pricing.js';
import { createLoader } from './ui/loader.js';
import { initSectionAnimations } from './animation/sections.js';

gsap.registerPlugin(ScrollTrigger);

// Always start at the top: the shot list begins in the hero.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

async function boot() {
  const quality = getQuality();
  document.documentElement.dataset.quality = quality.tier;

  const loader = createLoader();

  // DOM layer first: it is cheap and makes the page usable immediately.
  initNav();
  initMagnetic(quality);
  initTilt(quality);
  initPricing(quality);
  const sections = initSectionAnimations(quality);

  // 3D layer is code-split: three.js downloads in parallel with the DOM work above.
  let experience = null;
  if (hasWebGL()) {
    try {
      const { Experience } = await import('./scene/Experience.js');
      experience = new Experience(document.querySelector('[data-webgl]'), quality, (p) => loader.progress(p));
      await experience.init();
    } catch (err) {
      console.error('[AXIOM] 3D disabled:', err);
      experience = null;
    }
  }
  if (!experience) document.documentElement.classList.add('no-webgl');

  ScrollTrigger.refresh();
  experience?.start();
  // Web fonts can change line heights; re-measure once they settle.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  const done = loader.finish();
  gsap.delayedCall(0.55, sections.playIntro);
  await done;
}

boot();
