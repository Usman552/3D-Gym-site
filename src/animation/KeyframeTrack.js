import { gsap } from 'gsap';

/**
 * A reusable numeric keyframe track.
 *
 * Frames are { pos, ease, v } where `pos` is any monotonic number (here: scroll px)
 * and `v` is a partial set of values. Missing values inherit from the previous
 * frame, so authoring only describes what *changes* at each beat.
 *
 * sample(pos) returns one interpolated object; the same object is reused every
 * call to avoid per-frame allocations.
 */
export class KeyframeTrack {
  constructor(props) {
    this.props = props;
    this.frames = [];
    this.out = Object.fromEntries(props.map((p) => [p, 0]));
  }

  setFrames(frames) {
    const sorted = frames
      .map((f, i) => ({ ...f, i }))
      .sort((a, b) => a.pos - b.pos || a.i - b.i);

    let prev = null;
    this.frames = sorted.map((f) => {
      const v = prev ? { ...prev, ...f.v } : { ...f.v };
      if (!prev) {
        const missing = this.props.filter((p) => !(p in v));
        if (missing.length) console.warn('[KeyframeTrack] first frame missing:', missing.join(', '));
      }
      prev = v;
      return { pos: f.pos, ease: gsap.parseEase(f.ease || 'sine.inOut'), v };
    });
  }

  sample(pos) {
    const fr = this.frames;
    const out = this.out;
    if (!fr.length) return out;

    if (pos <= fr[0].pos) return Object.assign(out, fr[0].v);
    const lastFrame = fr[fr.length - 1];
    if (pos >= lastFrame.pos) return Object.assign(out, lastFrame.v);

    let i = 0;
    while (i < fr.length - 2 && fr[i + 1].pos <= pos) i++;
    const a = fr[i];
    const b = fr[i + 1];
    const span = b.pos - a.pos;
    const t = span > 0 ? b.ease((pos - a.pos) / span) : 1;

    for (const k of this.props) out[k] = a.v[k] + (b.v[k] - a.v[k]) * t;
    return out;
  }
}
