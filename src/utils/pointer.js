/**
 * Shared normalised pointer (-1..1). One passive listener for the whole app;
 * consumers read it inside their own rAF and smooth it themselves.
 */
export const pointer = { x: 0, y: 0 };

window.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  },
  { passive: true },
);

document.documentElement.addEventListener('pointerleave', () => {
  pointer.x = 0;
  pointer.y = 0;
});
