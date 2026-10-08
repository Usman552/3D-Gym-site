import * as THREE from 'three';

/**
 * Procedural canvas textures. No image downloads: everything is tiny and
 * generated at startup, which keeps the first load light.
 */

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

/**
 * Diamond knurl bump map for the handle. V runs along the bar: the centre and
 * the ends stay smooth like a real competition handle.
 */
export function knurlTexture() {
  const [c, g] = canvas(64, 512);
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, 64, 512);
  g.strokeStyle = '#1e1e1e';
  g.lineWidth = 1.4;

  const knurl = (y0, y1) => {
    const h = y1 - y0;
    g.save();
    g.beginPath();
    g.rect(0, y0, 64, h);
    g.clip();
    for (let x = -h - 64; x < 64 + h; x += 8) {
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x + h, y1); g.stroke();
      g.beginPath(); g.moveTo(x + h, y0); g.lineTo(x, y1); g.stroke();
    }
    g.restore();
  };
  knurl(20, 222);
  knurl(290, 492);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  tex.anisotropy = 4;
  return tex;
}

/** Machined steel end cap with an engraved weight. */
export function capTexture() {
  const [c, g] = canvas(256, 256);
  const cx = 128;
  g.fillStyle = '#9ba1a8';
  g.fillRect(0, 0, 256, 256);
  // lathe rings
  for (let r = 128; r > 0; r -= 2) {
    g.strokeStyle = r % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke();
  }
  g.strokeStyle = 'rgba(20,22,25,0.55)';
  g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cx, 112, 0, Math.PI * 2); g.stroke();

  g.fillStyle = '#25282c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '800 92px Archivo, Arial, sans-serif';
  g.fillText('32', cx, cx + 4);
  g.font = '600 18px Arial, sans-serif';
  g.fillText('K G', cx, cx + 62);
  g.fillText('A X I O M', cx, cx - 60);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Soft radial falloff: dust sprites and blob shadows. */
export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
