export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);

/** Frame-rate independent exponential damping factor. */
export const dampFactor = (lambda, dt) => 1 - Math.exp(-lambda * dt);

/** Frame-rate independent damping toward a target. */
export const damp = (current, target, lambda, dt) => lerp(current, target, dampFactor(lambda, dt));

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const idle = (cb, timeout = 2000) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout }) : setTimeout(cb, 300);
