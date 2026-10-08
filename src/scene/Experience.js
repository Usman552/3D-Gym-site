import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createRenderer } from './renderer.js';
import { CameraRig } from './camera.js';
import { Lighting } from './lighting.js';
import { createDumbbell } from './dumbbell.js';
import { createStudio } from './studio.js';
import { Choreography } from '../animation/choreography.js';
import { PROPS } from '../animation/timeline.js';
import { Loop } from '../utils/loop.js';
import { pointer } from '../utils/pointer.js';
import { dampFactor, clamp, idle } from '../utils/math.js';

/**
 * Experience: owns the renderer, scene and single render loop.
 *
 * Every frame:
 *   1. sample the scroll keyframe track (the target state)
 *   2. damp the live state toward it (smooth and frame-rate independent)
 *   3. apply the state to camera, object, lights, environment and shade
 *   4. render, unless the scene is completely covered
 */
export class Experience {
  constructor(canvas, quality, onProgress = () => {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.onProgress = onProgress;
    this.shadeEl = document.querySelector('[data-shade]');

    this.state = Object.fromEntries(PROPS.map((p) => [p, 0]));
    this.ptr = { x: 0, y: 0 };
    this.lastScroll = window.scrollY;
    this.speed = 0;
    this.lastShade = -1;
    this.canvasVisible = true;
    this.gym = null;

    // adaptive resolution
    this.frameTimes = 0;
    this.frameCount = 0;
    this.pixelRatio = quality.pixelRatio;

    this.update = this.update.bind(this);
    this.loop = new Loop(this.update);
  }

  async init() {
    const { quality } = this;
    await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]);
    this.onProgress(0.2);

    this.renderer = createRenderer(this.canvas, quality);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07080a);
    this.scene.fog = new THREE.FogExp2(0x07080a, 0.085);

    // Image-based lighting from a procedural room: realistic chrome without an HDR download.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();
    this.onProgress(0.45);

    this.rig = new CameraRig(window.innerWidth / window.innerHeight);
    this.lights = new Lighting(this.scene, quality);
    this.dumbbell = createDumbbell(quality);
    this.scene.add(this.dumbbell.group, ...this.dumbbell.ghosts);
    this.studio = createStudio(this.scene, quality);
    this.onProgress(0.65);

    this.choreo = new Choreography();
    Object.assign(this.state, this.choreo.sample());
    this.update(0, 0, true);

    try {
      await this.renderer.compileAsync(this.scene, this.rig.camera);
    } catch {
      this.renderer.compile(this.scene, this.rig.camera);
    }
    this.onProgress(0.95);

    window.addEventListener('resize', () => this.resize());
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => {
      this.quality.reducedMotion = e.matches;
    });

    // The gym is not needed until the third section: load it after first paint.
    idle(() => this.loadGym());
  }

  async loadGym() {
    const { createGym } = await import('./gym.js');
    this.gym = createGym(this.quality);
    this.scene.add(this.gym.group);
    this.gym.group.visible = true;
    try {
      await this.renderer.compileAsync(this.scene, this.rig.camera);
    } catch {
      /* compile lazily on first draw instead */
    }
    this.gym.update(this.state.gym);
  }

  start() {
    this.loop.start();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Mobile browser chrome changes height while scrolling; ignore small height-only changes
    if (this.size && this.size.w === w && Math.abs(this.size.h - h) < 140) return;
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.rig.resize(w, h);
    this.studio.resize(w, h);
  }

  update(dt, t, force = false) {
    const { state: s, quality } = this;
    const rm = quality.reducedMotion;
    const target = this.choreo.sample();

    // 1–2. damp toward the scroll target
    const a = force ? 1 : dampFactor(rm ? 24 : 5, dt);
    for (const key of PROPS) s[key] += (target[key] - s[key]) * a;

    // scroll speed (0..1) feeds the motion trail
    const scroll = this.choreo.scroll;
    const v = dt > 0 ? Math.abs(scroll - this.lastScroll) / dt : 0;
    this.lastScroll = scroll;
    this.speed += (clamp(v / 2200) - this.speed) * dampFactor(6, dt);

    // smoothed pointer
    const pa = dampFactor(3, dt);
    this.ptr.x += (pointer.x - this.ptr.x) * pa;
    this.ptr.y += (pointer.y - this.ptr.y) * pa;

    const idleAmt = rm ? 0 : s.idle;
    const parallax = rm ? 0 : s.parallax;
    const live = Object.assign(this.live || (this.live = {}), s);
    live.parallax = parallax;

    // 3. object: scroll pose + idle breathing + a little cursor yaw
    const g = this.dumbbell.group;
    g.position.set(s.objX, s.objY + Math.sin(t * 1.1) * 0.06 * idleAmt, s.objZ);
    g.rotation.set(
      s.rotX + Math.sin(t * 0.7) * 0.05 * idleAmt,
      s.rotY + Math.sin(t * 0.45) * 0.12 * idleAmt + this.ptr.x * 0.15 * parallax,
      s.rotZ + Math.cos(t * 0.6) * 0.03 * idleAmt,
    );
    g.scale.setScalar(s.scale);

    this.rig.update(live, this.ptr);
    this.lights.update(live, g.position, this.ptr);
    this.dumbbell.updateTrail(rm ? 0 : s.trail * (0.3 + 0.7 * this.speed));
    this.studio.update(s, g, t);
    this.gym?.update(s.gym);

    this.scene.fog.density = s.fog;
    this.scene.environmentIntensity = s.env;
    this.renderer.toneMappingExposure = s.exposure;

    // Shade overlay: only touch the DOM when the value meaningfully changes
    if (Math.abs(s.shade - this.lastShade) > 0.002) {
      this.shadeEl.style.opacity = s.shade.toFixed(3);
      this.lastShade = s.shade;
    }

    // 4. pause rendering entirely while the scene is fully covered
    const visible = s.shade < 0.995;
    if (visible !== this.canvasVisible) {
      this.canvas.style.visibility = visible ? 'visible' : 'hidden';
      this.canvasVisible = visible;
    }
    if (!visible) return;

    this.renderer.render(this.scene, this.rig.camera);
    if (!force) this.adapt(dt);
  }

  /** Drop resolution if the device cannot hold ~40fps. */
  adapt(dt) {
    this.frameTimes += dt;
    this.frameCount++;
    if (this.frameCount < 90) return;
    const avg = this.frameTimes / this.frameCount;
    this.frameTimes = 0;
    this.frameCount = 0;
    if (avg > 1 / 40 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
    }
  }
}
