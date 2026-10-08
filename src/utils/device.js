/**
 * Device + quality detection.
 * One quality profile drives every expensive decision in the 3D layer,
 * so tablet/mobile get a simpler scene rather than a shrunken desktop one.
 */

export const NARROW_QUERY = '(max-width: 820px)';

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isNarrow = () => window.matchMedia(NARROW_QUERY).matches;

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const PRESETS = {
  // Full cinematic experience
  high: { maxPixelRatio: 2, shadows: true, reflector: true, dust: 260, gymDetail: 1, antialias: true, segments: 48 },
  // Tablets / modest laptops: no mirror floor, no shadow maps
  mid: { maxPixelRatio: 1.5, shadows: false, reflector: false, dust: 140, gymDetail: 0.7, antialias: true, segments: 36 },
  // Phones: fewer racks, fewer particles, lower geometry density
  low: { maxPixelRatio: 1.5, shadows: false, reflector: false, dust: 60, gymDetail: 0.45, antialias: false, segments: 24 },
};

export function getQuality() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;

  let tier = 'high';
  if (w <= 820 || (coarse && w < 1100)) tier = 'low';
  else if (coarse || cores <= 4 || memory <= 4) tier = 'mid';

  const reducedMotion = prefersReducedMotion();
  const preset = PRESETS[tier];

  return {
    tier,
    reducedMotion,
    touch: coarse,
    ...preset,
    pixelRatio: Math.min(window.devicePixelRatio || 1, preset.maxPixelRatio),
    dust: reducedMotion ? 0 : preset.dust,
  };
}
