import * as THREE from 'three';

const LIME = 0xc6ff3d;

/**
 * Studio lighting rig that follows the subject:
 *  - warm key spot from above-front (casts shadows on high tier)
 *  - lime rim spot from behind: the brand accent, used as light, not paint
 *  - cool hemisphere fill
 *  - a faint cursor-driven point light: interactive lighting
 */
export class Lighting {
  constructor(scene, quality) {
    this.key = new THREE.SpotLight(0xfff1e2, 0, 0, 0.5, 0.85, 2);
    this.key.castShadow = quality.shadows;
    if (quality.shadows) {
      this.key.shadow.mapSize.set(1024, 1024);
      this.key.shadow.bias = -0.0004;
      this.key.shadow.normalBias = 0.02;
      this.key.shadow.camera.near = 1;
      this.key.shadow.camera.far = 20;
    }

    this.rim = new THREE.SpotLight(LIME, 0, 0, 0.6, 0.9, 2);
    this.back = new THREE.DirectionalLight(0x9fb3ff, 0.4);
    this.hemi = new THREE.HemisphereLight(0xb8c4d6, 0x0a0a0a, 0.35);
    this.cursor = new THREE.PointLight(0xffffff, 0, 6, 2);

    scene.add(this.key, this.key.target, this.rim, this.rim.target, this.back, this.back.target, this.hemi, this.cursor);
  }

  update(s, objPos, ptr) {
    const { x, y, z } = objPos;

    this.key.position.set(x + 2.6, y + 4.2, z + 3.2);
    this.key.target.position.copy(objPos);
    this.key.intensity = s.key * 85;

    this.rim.position.set(x - 3.2, y + 1.4, z - 2.8);
    this.rim.target.position.copy(objPos);
    this.rim.intensity = s.rim * 48;

    this.back.position.set(x + 3, y + 1, z - 4);
    this.back.target.position.copy(objPos);

    this.hemi.intensity = s.fill;

    this.cursor.position.set(x + ptr.x * 2.4, y + ptr.y * 1.6, z + 2.2);
    this.cursor.intensity = 3 * s.parallax;
  }
}
