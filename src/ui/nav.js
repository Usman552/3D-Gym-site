import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Navigation: hide on scroll down, reveal on scroll up, a 1px progress line
 * (transform only), active-section highlighting and the mobile menu.
 */
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const progress = nav.querySelector('[data-progress]');
  const toggle = nav.querySelector('[data-nav-toggle]');
  const links = nav.querySelectorAll('[data-nav-links] a');
  let menuOpen = false;
  let hidden = false;
  let solid = false;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      progress.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      const y = self.scroll();
      const shouldHide = !menuOpen && self.direction === 1 && y > 240;
      const shouldBeSolid = y > 40;
      if (shouldHide !== hidden) nav.classList.toggle('is-hidden', (hidden = shouldHide));
      if (shouldBeSolid !== solid) nav.classList.toggle('is-solid', (solid = shouldBeSolid));
    },
  });

  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  const setMenu = (open) => {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  links.forEach((l) => l.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && menuOpen && setMenu(false));
}
