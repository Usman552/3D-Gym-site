/**
 * THE SHOT LIST
 * ------------------------------------------------------------------
 * The whole page is one camera move. Each keyframe is pinned to a
 * "beat" (a section's scroll range measured by ScrollTrigger) and a
 * progress 0..1 inside that beat. Values that are not listed are held
 * from the previous keyframe.
 *
 * World layout
 *   - Studio floor at y = -1.3, plinth top at y = -0.8 (finale)
 *   - Gym corridor runs from z = +3 to z = -18, racks at x = ±3.6
 *   - Dumbbell is ~2.3 units long along its local X axis
 */

export const PROPS = [
  'camX', 'camY', 'camZ', 'tgtX', 'tgtY', 'tgtZ', 'fov',
  'objX', 'objY', 'objZ', 'rotX', 'rotY', 'rotZ', 'scale',
  'key', 'rim', 'fill', 'env', 'exposure', 'fog',
  'gym', 'trail', 'shade', 'idle', 'parallax', 'plinth', 'dust',
];

/** ScrollTrigger ranges for each beat (section id → start/end). */
export const BEATS = {
  hero: { start: 'top top', end: 'bottom bottom' },
  power: { start: 'top top', end: 'bottom bottom' },
  training: { start: 'top top', end: 'bottom bottom' },
  movement: { start: 'top top', end: 'bottom bottom' },
  programs: { start: 'top bottom', end: 'bottom bottom' },
  membership: { start: 'top bottom', end: 'bottom bottom' },
  final: { start: 'top bottom', end: 'bottom bottom' },
};

const TAU = Math.PI * 2;
const PLINTH_TOP = -0.8;
const HEX_APOTHEM = 0.368; // flat-face-down resting offset at scale 1

export function buildKeyframes(narrow) {
  const L = (wide, mobile) => (narrow ? mobile : wide);
  const k = [];
  const add = (beat, p, v, ease) => k.push({ at: [beat, p], v, ease });

  const finalScale = L(1, 0.82);

  // ── 01 HERO ── studio void, object right of the headline ────────────
  add('hero', 0, {
    camX: 0, camY: L(0.15, 0.2), camZ: L(6.5, 7.6), tgtX: 0, tgtY: L(0, 0.55), tgtZ: 0, fov: 35,
    objX: L(1.65, 0), objY: L(0, -0.7), objZ: 0,
    rotX: 0.28, rotY: -0.55, rotZ: 0.14, scale: L(1, 0.8),
    key: 1, rim: 1, fill: 0.35, env: 0.35, exposure: 1, fog: 0.085,
    gym: 0, trail: 0, shade: 0, idle: 1, parallax: 1, plinth: 0, dust: 0.55,
  });
  // Scroll begins: push in, roll, drift toward the edge, rim light swells
  add('hero', 1, {
    camX: L(0.7, 0.2), camY: 0.05, camZ: L(4.7, 6.6), tgtX: L(0.7, 0), tgtY: L(0, 0.45),
    objX: L(2.15, 0.2), objY: L(0.1, -0.55),
    rotX: 0.7, rotY: -1.45, rotZ: 0.4,
    key: 1.25, rim: 1.6, env: 0.4, idle: 0.5,
  });

  // ── 02 POWER ── object sweeps across and stands; low hero angle ─────
  add('power', 0, {
    camX: L(-0.3, 0), camY: L(-0.9, -0.5), camZ: L(4.5, 7.0), tgtX: L(-0.5, 0), tgtY: L(0.25, 0.35), tgtZ: 0,
    objX: L(-1.35, 0), objY: L(0.05, -0.85),
    rotX: 0.15, rotY: -2.5, rotZ: Math.PI / 2, scale: L(1.22, 0.78),
    key: 1.7, rim: 1.1, fill: 0.2, env: 0.3, fog: 0.11, idle: 0.35,
  }, 'power2.inOut');
  // Slow orbit while the copy reads
  add('power', 1, {
    camX: L(0.6, 0.4), camY: L(-0.7, -0.4), camZ: L(4.0, 6.6), tgtX: L(-0.6, 0), tgtY: L(0.3, 0.35),
    objX: L(-1.25, 0), objY: L(0.12, -0.8),
    rotX: 0.1, rotY: -1.3, rotZ: Math.PI / 2, scale: L(1.3, 0.82),
    key: 2.0, rim: 1.3,
  });

  // ── 03 TRAINING ── pull back: the void resolves into the gym ─────────
  add('training', 0, {
    camX: 0, camY: L(1.3, 1.5), camZ: L(8.6, 9.6), tgtX: 0, tgtY: 0.2, tgtZ: -2.4, fov: L(36, 38),
    objX: 0, objY: L(0.55, 0.15), objZ: -2.4,
    rotX: 0.4, rotY: -3.4, rotZ: 0.18, scale: L(1, 0.8),
    key: 1.2, rim: 1.0, fill: 0.35, env: 0.5, fog: 0.042, gym: 1, dust: 1, idle: 0.6, parallax: 0.8,
  }, 'power2.inOut');
  // Lateral track along the racks, orbiting the subject
  add('training', 0.5, {
    camX: L(3.3, 1.6), camY: 0.9, camZ: L(2.4, 3.8), tgtX: 0, tgtY: 0.4, tgtZ: -3.8,
    objX: 0, objY: L(0.5, 0.2), objZ: -3.8,
    rotX: 0.2, rotY: -4.7, rotZ: 0.1, key: 1.35, rim: 1.2,
  });
  add('training', 1, {
    camX: L(-2.7, -1.3), camY: 0.65, camZ: L(-0.9, 0.6), tgtX: 0, tgtY: 0.4, tgtZ: -5.2,
    objX: 0, objY: L(0.42, 0.2), objZ: -5.2,
    rotX: 0.35, rotY: -6.0, rotZ: 0.25, key: 1.4, rim: 1.3,
  });

  // ── 04 MOVEMENT ── tempo up: wider lens, close passes, motion trail ─
  add('movement', 0, {
    camX: L(-1.6, -0.9), camY: 0.35, camZ: L(-2.5, -1.4), tgtX: 0, tgtY: 0.4, tgtZ: -5.4, fov: L(42, 44),
    objX: 0, objY: L(0.4, 0.2), objZ: -5.4,
    rotX: 1.4, rotY: -7.2, rotZ: 0.5,
    trail: 0.6, key: 1.6, rim: 1.6, exposure: 1.05, idle: 0.2,
  }, 'power1.inOut');
  add('movement', 0.5, {
    camX: L(1.9, 1.0), camY: L(-0.25, 0), camZ: L(-3.6, -2.6), tgtX: 0.2, tgtY: 0.3, tgtZ: -5.8, fov: L(52, 50),
    objX: L(0.3, 0), objY: L(0.3, 0.1), objZ: -5.8,
    rotX: 4.0, rotY: -9.0, rotZ: 0.15,
    trail: 1, exposure: 1.15, rim: 2.0,
  }, 'power1.inOut');
  add('movement', 1, {
    camX: 0, camY: L(1.4, 1.2), camZ: L(-1.4, -0.4), tgtX: 0, tgtY: 0.25, tgtZ: -6.2, fov: 40,
    objX: 0, objY: 0.25, objZ: -6.2,
    rotX: 6.4, rotY: -10.3, rotZ: 0.3,
    trail: 0.25, exposure: 1.0, rim: 1.4,
  }, 'power2.out');

  // ── 05 PROGRAMS ── camera retreats; scene becomes a dimmed backdrop ─
  add('programs', 0, {
    camX: 0, camY: 1.3, camZ: 1.4, tgtX: 0, tgtY: 0.3, tgtZ: -6.4, fov: 36,
    objX: 0, objY: 0.3, objZ: -7.0,
    rotX: 6.9, rotY: -11, rotZ: 0.2, scale: L(0.95, 0.8),
    trail: 0, shade: 0.55, idle: 0.6, parallax: 0.6,
  });
  add('programs', 1, { camY: 1.6, camZ: 2.4, rotX: 7.6, rotY: -11.8, shade: 0.86 });

  // ── 06 MEMBERSHIP ── fully shaded: rendering pauses, scene restaged ─
  add('membership', 0, { shade: 0.86 });
  add('membership', 0.45, { shade: 1 });
  add('membership', 1, {
    shade: 1,
    camX: 0, camY: L(0.55, 0.6), camZ: L(6.2, 7.8), tgtX: 0, tgtY: L(-0.2, 0.3), tgtZ: 0, fov: 35,
    objX: 0, objY: L(1.4, 1.2), objZ: 0,
    rotX: 2 * TAU - 0.6, rotY: -13.5, rotZ: -0.25, scale: finalScale,
    gym: 0, fog: 0.085, plinth: 0, key: 1.0, rim: 1.2, env: 0.35, dust: 0.5,
    exposure: 1, idle: 0, parallax: 0.5, fill: 0.3,
  });

  // ── 07 FINAL ── lights up, plinth rises, the object settles ─────────
  add('final', 0, { shade: 1 });
  add('final', 0.3, {
    shade: 0, objY: L(0.9, 0.7),
    rotX: 2 * TAU - 0.25, rotY: -13.2, rotZ: -0.1,
    key: 1.2, rim: 1.4, plinth: 0.6,
  }, 'sine.out');
  add('final', 0.78, {
    camY: L(0.9, 1.0), camZ: L(5.6, 7.2), tgtY: L(-0.35, 0.15),
    objY: PLINTH_TOP + HEX_APOTHEM * finalScale,
    rotX: 2 * TAU, rotY: -13.05, rotZ: 0, // flat face down, exact rest pose
    plinth: 1, key: 1.5, rim: 1.6,
  }, 'power3.out');
  add('final', 1, { camX: L(-0.45, 0), camZ: L(5.4, 7.0), key: 1.6 });

  return k;
}
