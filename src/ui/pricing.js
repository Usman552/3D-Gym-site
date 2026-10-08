import { gsap } from 'gsap';

/** Monthly / annual billing toggle with a short number roll. */
export function initPricing(quality) {
  const group = document.querySelector('[data-billing]');
  if (!group) return;
  const buttons = group.querySelectorAll('button');
  const prices = document.querySelectorAll('[data-price]');

  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const annual = btn.dataset.period === 'annual';

    prices.forEach((el) => {
      const monthly = Number(el.dataset.price);
      const target = annual ? Math.round((monthly * 10) / 12) : monthly; // two months free
      const proxy = { v: Number(el.textContent) };
      gsap.to(proxy, {
        v: target,
        duration: quality.reducedMotion ? 0 : 0.6,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = String(Math.round(proxy.v)); },
      });
      const unit = el.parentElement.querySelector('span');
      if (unit) unit.textContent = annual ? '/ month, billed yearly' : '/ month';
    });
  });
}
