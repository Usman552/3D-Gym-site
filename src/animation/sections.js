import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { linesFrom, riseFrom, countUp } from './reveal.js';

/**
 * DOM choreography. Typography is scrubbed against the same section ranges
 * that drive the 3D track, so text and camera always move as one.
 */
export function initSectionAnimations(quality) {
  const rm = quality.reducedMotion;
  const Y = (v) => (rm ? 0 : v);

  /* ── HERO ─────────────────────────────────────────────────────────── */
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  intro
    .add(riseFrom('[data-hero-content] .label', rm, { y: Y(14), duration: 1 }), 0.05)
    .add(linesFrom('#hero .hero__title', rm, { duration: 1.4 }), 0.1)
    .add(riseFrom(['#hero .hero__sub', '#hero .hero__ctas'], rm, { duration: 1.2, stagger: 0.1 }), 0.45)
    .from('[data-hero-meta] > *', { opacity: 0, duration: 1.2, stagger: 0.1 }, 0.7);

  // Typography leaves as the camera pushes in.
  gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true },
    defaults: { ease: 'none' },
  })
    .to('[data-hero-meta]', { opacity: 0, duration: 0.25 }, 0)
    .to('[data-hero-content]', { y: Y(-80), opacity: 0, ease: 'power1.in', duration: 0.7 }, 0.15)
    .to({}, { duration: 0.15 });

  /* ── POWER ────────────────────────────────────────────────────────── */
  gsap.timeline({
    scrollTrigger: { trigger: '#power', start: 'top 65%', end: 'bottom bottom', scrub: true },
    defaults: { ease: 'none' },
  })
    .add(riseFrom('#power .label', rm, { duration: 0.3, ease: 'power2.out' }))
    .add(linesFrom('#power .title', rm, { duration: 0.6, stagger: 0.1, ease: 'power3.out' }), '<0.05')
    .add(riseFrom('#power .copy', rm, { duration: 0.35, ease: 'power2.out' }), '-=0.25')
    .add(riseFrom('#power .stat', rm, { duration: 0.35, stagger: 0.08, ease: 'power2.out' }), '-=0.15')
    .add(countUp('#power', { duration: 0.6 }), '<')
    .to({}, { duration: 1.3 }) // hold while the camera orbits
    .to('[data-power]', { opacity: 0, y: Y(-50), duration: 0.45 });

  /* ── TRAINING ─────────────────────────────────────────────────────── */
  const chapters = gsap.utils.toArray('#training .chapter');
  const ticks = gsap.utils.toArray('#training .ticks i');
  const training = gsap.timeline({
    scrollTrigger: { trigger: '#training', start: 'top 55%', end: 'bottom bottom', scrub: true },
    defaults: { ease: 'none' },
  });
  training
    .add(riseFrom('[data-training-head] .label', rm, { duration: 0.3 }), 0)
    .add(linesFrom('[data-training-head]', rm, { duration: 0.5, ease: 'power3.out' }), 0.05)
    .from('[data-training-foot] .ticks', { opacity: 0, duration: 0.3 }, 0.3);

  chapters.forEach((chapter, i) => {
    const at = 0.6 + i * 1.1;
    training.fromTo(chapter, { opacity: 0, y: Y(24) }, { opacity: 1, y: 0, duration: 0.3 }, at);
    training.fromTo(ticks[i], { scaleX: 0 }, { scaleX: 1, duration: 1.1 }, at);
    if (i < chapters.length - 1) training.to(chapter, { opacity: 0, y: Y(-24), duration: 0.25 }, at + 0.85);
  });
  training.to(['[data-training-head]', '[data-training-foot]'], { opacity: 0, duration: 0.3 }, '+=0.1');

  /* ── MOVEMENT ─────────────────────────────────────────────────────── */
  const track = document.querySelector('[data-kinetic]');
  const kinetic = track.querySelector('.kinetic');
  const echo = document.querySelector('[data-kinetic-echo]');

  gsap.fromTo(track, { x: 0 }, {
    x: () => -(kinetic.scrollWidth - window.innerWidth * 0.6),
    ease: 'none',
    scrollTrigger: { trigger: '#movement', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });

  gsap.timeline({
    scrollTrigger: { trigger: '#movement', start: 'top 50%', end: 'bottom bottom', scrub: true },
    defaults: { ease: 'none' },
  })
    .add(riseFrom('[data-movement-head] .label', rm, { duration: 0.2 }))
    .add(linesFrom('[data-movement-head]', rm, { duration: 0.4, ease: 'power3.out' }), '<')
    .add(riseFrom('[data-movement-copy]', rm, { duration: 0.3 }), '-=0.1')
    .to({}, { duration: 1.2 })
    .to(['[data-movement-head]', '[data-movement-copy]'], { opacity: 0, duration: 0.3 });

  // Velocity-reactive skew + echo layer: a cheap, transform-only motion smear.
  if (!rm) {
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
    const echoX = gsap.quickTo(echo, 'x', { duration: 0.35, ease: 'power3' });
    const echoA = gsap.quickTo(echo, 'opacity', { duration: 0.35, ease: 'power2' });
    const settle = gsap.delayedCall(0.12, () => { skew(0); echoX(0); echoA(0); }).pause();

    ScrollTrigger.create({
      trigger: '#movement',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        const v = self.getVelocity();
        skew(gsap.utils.clamp(-10, 10, v / -320));
        echoX(gsap.utils.clamp(-90, 90, v * 0.04));
        echoA(gsap.utils.clamp(0, 0.5, Math.abs(v) / 4000));
        settle.restart(true);
      },
    });
  }

  /* ── PROGRAMS + MEMBERSHIP (calmer, play-once entrances) ─────────── */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    riseFrom(el, rm, { duration: 1.2, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  gsap.from('.program-card', {
    opacity: 0,
    y: Y(60),
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.09,
    scrollTrigger: { trigger: '.programs__grid', start: 'top 82%', once: true },
  });

  gsap.from('[data-plan]', {
    opacity: 0,
    y: Y(36),
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.plans', start: 'top 82%', once: true },
  });

  /* ── FINAL ────────────────────────────────────────────────────────── */
  gsap.timeline({
    scrollTrigger: { trigger: '#final', start: 'top 30%', end: 'top -45%', scrub: true },
    defaults: { ease: 'none' },
  })
    .add(riseFrom('[data-final] .label', rm, { duration: 0.3 }))
    .add(linesFrom('[data-final]', rm, { duration: 0.7, stagger: 0.12, ease: 'power3.out' }), '<0.05')
    .add(riseFrom('[data-final] .final__ctas', rm, { duration: 0.4 }), '-=0.25');

  return {
    playIntro: () => intro.play(),
  };
}
