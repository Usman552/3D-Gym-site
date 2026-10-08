import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { knurlTexture, capTexture } from './textures.js';

/**
 * Procedural 32 kg hex dumbbell (~2.3 units long, handle along local X).
 * Built in code: zero download, a controlled polygon budget per quality tier,
 * and real PBR materials that pick up the environment map.
 *
 * To use a scanned/authored model instead, load a Draco-compressed GLB with
 * GLTFLoader and add it to `inner`; the choreography only moves `group`.
 */

const HEX_R = 0.39;        // inner shape radius (bevel adds 0.03)
const HEAD_DEPTH = 0.5;
const BEVEL = 0.03;
const HEAD_X = 0.88;       // head centre offset
const TRAIL_LENGTH = 3;
const HISTORY = 16;

function hexShape(r) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2; // vertex at 0° → flat top and bottom faces
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function headGeometry(bevelSegments, bevel = true) {
  const geo = new THREE.ExtrudeGeometry(hexShape(bevel ? HEX_R : HEX_R + BEVEL), {
    depth: HEAD_DEPTH,
    bevelEnabled: bevel,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments,
    curveSegments: 1,
  });
  geo.translate(0, 0, -HEAD_DEPTH / 2);
  geo.rotateY(Math.PI / 2); // extrusion axis → X
  return geo;
}

export function createDumbbell(quality) {
  const seg = quality.segments;
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  // ── Materials ──
  const knurl = knurlTexture();
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xd8dce1, metalness: 1, roughness: 0.24, bumpMap: knurl, bumpScale: 1.6,
  });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb4b9bf, metalness: 1, roughness: 0.36 });
  const rubber = new THREE.MeshPhysicalMaterial({
    color: 0x131518, metalness: 0, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.55,
  });
  const cap = new THREE.MeshStandardMaterial({ map: capTexture(), metalness: 0.85, roughness: 0.34 });
  const accent = new THREE.MeshBasicMaterial({ color: 0xc6ff3d, toneMapped: false });

  // ── Handle ──
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 1.08, seg, 1, true), chrome);
  handle.rotation.z = Math.PI / 2;
  inner.add(handle);

  // ── Collars, heads, accent rings, end caps ──
  const collarGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.07, seg);
  collarGeo.rotateZ(Math.PI / 2);
  const shoulderGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, seg);
  shoulderGeo.rotateZ(Math.PI / 2);
  const headGeo = headGeometry(quality.tier === 'low' ? 1 : 3);
  const ringGeo = new THREE.RingGeometry(0.205, 0.218, seg);
  const capGeo = new THREE.CircleGeometry(0.25, seg);

  for (const side of [-1, 1]) {
    const collar = new THREE.Mesh(collarGeo, steel);
    collar.position.x = side * 0.565;
    const shoulder = new THREE.Mesh(shoulderGeo, steel);
    shoulder.position.x = side * 0.51;

    const head = new THREE.Mesh(headGeo, rubber);
    head.position.x = side * HEAD_X;

    const ring = new THREE.Mesh(ringGeo, accent);
    ring.rotation.y = side * -Math.PI / 2; // face the handle
    ring.position.x = side * (HEAD_X - HEAD_DEPTH / 2 - BEVEL - 0.002);

    const endCap = new THREE.Mesh(capGeo, cap);
    endCap.rotation.y = side * Math.PI / 2; // face outward
    endCap.position.x = side * (HEAD_X + HEAD_DEPTH / 2 + BEVEL + 0.002);

    inner.add(collar, shoulder, head, ring, endCap);
  }

  inner.traverse((o) => {
    if (o.isMesh && o.material !== accent) {
      o.castShadow = quality.shadows;
      o.receiveShadow = false;
    }
  });

  // ── Motion trail: low-poly ghosts replaying recent transforms ──
  const ghostParts = [
    new THREE.CylinderGeometry(0.1, 0.1, 1.1, 10).rotateZ(Math.PI / 2),
    headGeometry(0, false).translate(HEAD_X, 0, 0),
    headGeometry(0, false).translate(-HEAD_X, 0, 0),
  ].map((g) => {
    const geo = g.index ? g.toNonIndexed() : g;
    geo.clearGroups();
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name);
    }
    return geo;
  });
  const ghostGeo = mergeGeometries(ghostParts, false);

  const ghosts = [];
  if (!quality.reducedMotion) {
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x7d858e, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const ghost = new THREE.Mesh(ghostGeo, mat);
      ghost.matrixAutoUpdate = false;
      ghost.visible = false;
      ghost.renderOrder = 2;
      ghosts.push(ghost);
    }
  }

  const history = Array.from({ length: HISTORY }, () => new THREE.Matrix4());
  let head = 0;
  let filled = 0;

  /** Record this frame's transform and drive ghost opacity (0..1). */
  function updateTrail(amount) {
    group.updateMatrix();
    history[head].copy(group.matrix);
    head = (head + 1) % HISTORY;
    filled = Math.min(filled + 1, HISTORY);

    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const lag = (i + 1) * 4;
      const opacity = amount * (0.16 - i * 0.04);
      g.visible = opacity > 0.004 && filled > lag;
      if (!g.visible) continue;
      g.matrix.copy(history[(head - 1 - lag + HISTORY * 2) % HISTORY]);
      g.material.opacity = opacity;
    }
  }

  return { group, inner, ghosts, updateTrail };
}
