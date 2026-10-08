import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { KeyframeTrack } from './KeyframeTrack.js';
import { PROPS, BEATS, buildKeyframes } from './timeline.js';
import { NARROW_QUERY } from '../utils/device.js';

/**
 * Scroll choreography.
 *
 * ScrollTrigger measures each beat's scroll range (it already accounts for
 * layout, resizes and sticky stages). Those ranges convert the shot list
 * into absolute scroll positions, giving ONE continuous keyframe track for
 * the whole page instead of a separate animation per section.
 */
export class Choreography {
  constructor() {
    this.track = new KeyframeTrack(PROPS);
    this.triggers = {};
    this.scroll = window.scrollY;

    for (const [id, cfg] of Object.entries(BEATS)) {
      const trigger = document.getElementById(id);
      if (!trigger) continue;
      this.triggers[id] = ScrollTrigger.create({ trigger, start: cfg.start, end: cfg.end });
    }

    // Single scroll reader for the 3D layer.
    this.master = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => { this.scroll = self.scroll(); },
    });

    this.rebuild = this.rebuild.bind(this);
    ScrollTrigger.addEventListener('refresh', this.rebuild);
    this.rebuild();
  }

  rebuild() {
    const narrow = window.matchMedia(NARROW_QUERY).matches;
    const frames = buildKeyframes(narrow).map((f) => {
      const st = this.triggers[f.at[0]];
      const pos = st ? st.start + (st.end - st.start) * f.at[1] : 0;
      return { pos, ease: f.ease, v: f.v };
    });
    this.track.setFrames(frames);
    this.scroll = window.scrollY;
  }

  /** Target state for the current scroll position. */
  sample() {
    return this.track.sample(this.scroll);
  }
}
