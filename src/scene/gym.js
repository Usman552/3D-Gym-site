import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The training environment. Lazy-loaded after first paint (dynamic import).
 *
 * Built for few draw calls: every rack frame is one merged geometry,
 * plates and light columns are InstancedMeshes, and all glowing elements
 * are unlit materials, so no extra lights or shader variants are added.
 * Equipment is dark and low-contrast: it frames the subject, it never
 * competes with it.
 */

const FLOOR_Y = -1.3;

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/** Power rack frame: uprights, crossmembers, safeties. One geometry. */
function rackGeometry() {
  const H = 2.7;
  const parts = [];
  for (const sx of [-0.5, 0.5]) {
    for (const sz of [-0.55, 0.55]) parts.push(box(0.075, H, 0.075, sx, FLOOR_Y + H / 2, sz));
    parts.push(box(0.075, 0.075, 1.18, sx, FLOOR_Y + H, 0));                    // top side rail
    parts.push(box(0.06, 0.06, 1.4, sx, FLOOR_Y + 0.75, 0));                    // safety arm
    parts.push(box(0.12, 0.05, 0.06, sx * 0.86, FLOOR_Y + 1.5, -0.55));         // j-hook
  }
  parts.push(box(1.08, 0.075, 0.075, 0, FLOOR_Y + H, -0.55));
  parts.push(box(1.08, 0.075, 0.075, 0, FLOOR_Y + H, 0.55));
  parts.push(box(1.2, 0.04, 1.4, 0, FLOOR_Y + 0.02, 0));                        // base plate
  return mergeGeometries(parts.map((g) => g.toNonIndexed()), false);
}

export function createGym(quality) {
  const group = new THREE.Group();
  group.visible = false;
  const detail = quality.gymDetail;

  const steel = new THREE.MeshStandardMaterial({ color: 0x2b2f34, metalness: 0.85, roughness: 0.42 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101113, metalness: 0.1, roughness: 0.72 });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a7, metalness: 1, roughness: 0.3 });
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x0e0f11, metalness: 0.2, roughness: 0.6 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0b0d, metalness: 0, roughness: 0.9 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const ceilingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0xc6ff3d, toneMapped: false });
  const accentBase = new THREE.Color(0xc6ff3d);

  // ── Racks along both walls ──
  const rackZs = [1.2, -3.2, -7.6, -12].slice(0, Math.max(2, Math.round(4 * detail)));
  const rackGeo = rackGeometry();
  const barGeo = new THREE.CylinderGeometry(0.016, 0.016, 2.2, 10);
  barGeo.rotateX(Math.PI / 2); // bar runs along the corridor (Z)
  const plateGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.055, quality.tier === 'low' ? 20 : 32);
  plateGeo.rotateX(Math.PI / 2);

  const platePositions = [];
  for (const side of [-1, 1]) {
    for (const z of rackZs) {
      const x = side * 3.6;
      const rack = new THREE.Mesh(rackGeo, steel);
      rack.position.set(x, 0, z);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, FLOOR_Y + 1.52, z);
      const platform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 2.6), platformMat);
      platform.position.set(x, FLOOR_Y + 0.015, z);
      group.add(rack, bar, platform);
      for (const pz of [-0.85, -0.79, 0.79, 0.85]) platePositions.push([x, FLOOR_Y + 1.52, z + pz]);
    }
  }

  // Plate stacks leaning near racks (skipped on the lowest tier)
  if (detail > 0.5) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) platePositions.push([side * 4.7, FLOOR_Y + 0.45, -5.4 + i * 0.07]);
    }
  }

  const plates = new THREE.InstancedMesh(plateGeo, rubber, platePositions.length);
  const m = new THREE.Matrix4();
  platePositions.forEach(([x, y, z], i) => plates.setMatrixAt(i, m.makeTranslation(x, y, z)));
  group.add(plates);

  // ── Vertical light columns: rhythm and depth down the corridor ──
  const columnCount = Math.round(9 * detail) + 3;
  const columns = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 3.4, 0.05), lightMat, columnCount * 2);
  let c = 0;
  for (let i = 0; i < columnCount; i++) {
    const z = 3 - i * (21 / columnCount);
    for (const side of [-1, 1]) columns.setMatrixAt(c++, m.makeTranslation(side * 5.4, FLOOR_Y + 1.9, z));
  }
  group.add(columns);

  // ── Ceiling strips ──
  for (const x of [-1.6, 1.6]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 22), ceilingMat);
    strip.position.set(x, 3.7, -7.5);
    group.add(strip);
  }

  // ── Benches ──
  if (detail > 0.6) {
    for (const [x, z] of [[2.2, -1.2], [-2.2, -9.6]]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 1.2), rubber);
      pad.position.set(x, FLOOR_Y + 0.46, z);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 1.0), steel);
      frame.position.set(x, FLOOR_Y + 0.21, z);
      group.add(pad, frame);
    }
  }

  // ── End wall with a single lime line ──
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  wall.position.set(0, FLOOR_Y + 3.5, -18);
  const line = new THREE.Mesh(new THREE.BoxGeometry(6, 0.02, 0.02), accentMat);
  line.position.set(0, FLOOR_Y + 1.3, -17.95);
  group.add(wall, line);

  // Lane marking down the centre of the floor
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 20).rotateX(-Math.PI / 2), ceilingMat);
  lane.position.set(0, FLOOR_Y + 0.003, -7);
  group.add(lane);

  group.traverse((o) => {
    if (o.isMesh) o.receiveShadow = quality.shadows;
  });

  let last = -1;
  function update(v) {
    if (Math.abs(v - last) < 0.001) return;
    last = v;
    group.visible = v > 0.01;
    lightMat.color.setScalar(v * 1.6);
    ceilingMat.color.setScalar(v * 0.9);
    accentMat.color.copy(accentBase).multiplyScalar(v);
  }

  return { group, update };
}
