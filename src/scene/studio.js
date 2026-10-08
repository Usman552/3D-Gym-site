import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { radialTexture } from './textures.js';
import { clamp, smoothstep, lerp } from '../utils/math.js';

const FLOOR_Y = -1.3;
const PLINTH_H = 0.5;

/**
 * The always-present studio: reflective floor, a blob contact shadow that
 * grounds the object on every tier, the finale plinth and sparse dust.
 */
export function createStudio(scene, quality) {
  const group = new THREE.Group();
  scene.add(group);

  // ── Floor ──
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0b0c0e,
    roughness: 0.34,
    metalness: 0.45,
    transparent: quality.reflector,
    opacity: quality.reflector ? 0.84 : 1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = quality.shadows;
  group.add(floor);

  let mirror = null;
  if (quality.reflector) {
    const mirrorGeo = new THREE.PlaneGeometry(80, 80);
    mirrorGeo.rotateX(-Math.PI / 2);
    const scale = Math.min(window.devicePixelRatio, 1.5) * 0.5;
    mirror = new Reflector(mirrorGeo, {
      textureWidth: Math.round(window.innerWidth * scale),
      textureHeight: Math.round(window.innerHeight * scale),
      color: 0x8a8f96,
      clipBias: 0.003,
    });
    mirror.position.y = FLOOR_Y - 0.002;
    group.add(mirror);
  }

  // ── Blob contact shadow ──
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.25),
    new THREE.MeshBasicMaterial({
      map: radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  blob.renderOrder = 1;
  group.add(blob);

  // ── Finale plinth ──
  const plinth = new THREE.Group();
  const plinthBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, PLINTH_H, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.78, metalness: 0.2 }),
  );
  plinthBody.receiveShadow = quality.shadows;
  plinthBody.castShadow = quality.shadows;
  const plinthEdge = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: 0xc6ff3d, toneMapped: false }),
  );
  plinthEdge.position.set(0, PLINTH_H / 2 - 0.006, 0.656);
  plinth.add(plinthBody, plinthEdge);
  plinth.visible = false;
  group.add(plinth);

  // ── Dust: sparse, slow, additive ──
  let dust = null;
  if (quality.dust > 0) {
    const count = quality.dust;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = FLOOR_Y + Math.random() * 4.8;
      positions[i * 3 + 2] = 5 - Math.random() * 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dust = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.022,
      map: radialTexture(),
      color: 0xd5dbe0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }));
    group.add(dust);
  }

  function update(s, obj, t) {
    const p = obj.position;

    // Plinth rises from the floor in the finale
    plinth.visible = s.plinth > 0.01;
    const rise = smoothstep(clamp(s.plinth));
    plinth.position.y = FLOOR_Y + PLINTH_H / 2 - (1 - rise) * (PLINTH_H + 0.05);

    // Contact shadow: sits on the floor, or on the plinth when above it
    const overPlinth = plinth.visible && Math.abs(p.x) < 1.6 && Math.abs(p.z) < 0.7;
    const surface = overPlinth ? lerp(FLOOR_Y, plinth.position.y + PLINTH_H / 2, rise) : FLOOR_Y;
    const height = p.y - surface;
    blob.position.set(p.x, surface + 0.004, p.z);
    blob.rotation.set(-Math.PI / 2, 0, obj.rotation.y);
    const upright = Math.abs(Math.cos(obj.rotation.z));
    blob.scale.set(lerp(0.42, 1, upright) * obj.scale.x, obj.scale.x, 1);
    blob.material.opacity = clamp(1 - (height - 0.3) / 2.6) * 0.9;

    if (dust) {
      dust.material.opacity = s.dust * 0.5;
      dust.rotation.y = t * 0.012;
      dust.position.y = Math.sin(t * 0.15) * 0.08;
    }
  }

  function resize(width, height) {
    if (!mirror) return;
    const scale = Math.min(window.devicePixelRatio, 1.5) * 0.5;
    mirror.getRenderTarget().setSize(Math.round(width * scale), Math.round(height * scale));
  }

  return { group, update, resize };
}
