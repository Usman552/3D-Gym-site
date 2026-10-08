import * as THREE from 'three';
import { clamp } from '../utils/math.js';

/**
 * Camera rig. Position, target and lens come from the choreography; the rig
 * adds cursor parallax and widens the lens on portrait screens so the
 * composition holds without shrinking the desktop layout.
 */
export class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 80);
    this.target = new THREE.Vector3();
    this.lastFov = 0;
  }

  /** Portrait screens need a taller vertical FOV to keep horizontal framing. */
  portraitBoost() {
    const a = this.camera.aspect;
    return a >= 1 ? 1 : 1 + 0.55 * clamp((1 - a) / 0.55);
  }

  update(s, ptr) {
    const px = ptr.x * 0.35 * s.parallax;
    const py = ptr.y * 0.2 * s.parallax;
    this.camera.position.set(s.camX + px, s.camY + py, s.camZ);
    this.target.set(s.tgtX, s.tgtY, s.tgtZ);
    this.camera.lookAt(this.target);

    const fov = s.fov * this.portraitBoost();
    if (Math.abs(fov - this.lastFov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
      this.lastFov = fov;
    }
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.lastFov = 0; // force projection refresh on next update
  }
}
