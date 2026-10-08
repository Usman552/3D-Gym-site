/**
 * Single requestAnimationFrame loop.
 * - Pauses automatically when the tab is hidden.
 * - Clamps dt so a backgrounded tab never produces a giant jump.
 */
export class Loop {
  constructor(callback) {
    this.callback = callback;
    this.running = false;
    this.wanted = false;
    this.last = 0;
    this.raf = 0;
    this.tick = this.tick.bind(this);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else if (this.wanted) this.resume();
    });
  }

  start() {
    this.wanted = true;
    this.resume();
  }

  stop() {
    this.wanted = false;
    this.pause();
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  tick(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.callback(dt, now / 1000);
    this.raf = requestAnimationFrame(this.tick);
  }
}
