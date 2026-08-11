import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

/** AI4Context purple — list / ping glyph */
const A = { r: 102, g: 126, b: 234 };
const B = { r: 118, g: 75, b: 162 };
const PAPER = { r: 255, g: 255, b: 255, a: 255 };

function setRgba(data, w, x, y, c) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (w * y + x) << 2;
  data[i] = c.r;
  data[i + 1] = c.g;
  data[i + 2] = c.b;
  data[i + 3] = c.a ?? 255;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rl = x0 + r;
  const rr = x1 - r;
  const rt = y0 + r;
  const rb = y1 - r;
  if (x >= rl && x <= rr) return true;
  if (y >= rt && y <= rb) return true;
  const cx = x < rl ? rl : rr;
  const cy = y < rt ? rt : rb;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function renderIcon(W) {
  const png = new PNG({ width: W, height: W, colorType: 6, inputColorType: 6, bitDepth: 8 });
  const bgR = Math.max(2, Math.round(W * 0.16));
  const bgPad = Math.max(0, Math.round(W * 0.04));

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (!inRoundedRect(x, y, bgPad, bgPad, W - bgPad - 1, W - bgPad - 1, bgR)) continue;
      const t = (x + y) / (2 * (W - 1));
      setRgba(png.data, W, x, y, {
        r: lerp(A.r, B.r, t),
        g: lerp(A.g, B.g, t),
        b: lerp(A.b, B.b, t),
        a: 255,
      });
    }
  }

  // three horizontal “list” bars (pings)
  if (W >= 16) {
    const left = Math.round(W * 0.22);
    const right = Math.round(W * 0.78);
    const thick = Math.max(2, Math.round(W * 0.08));
    const rows = [0.32, 0.5, 0.68];
    for (const ry of rows) {
      const y0 = Math.round(W * ry - thick / 2);
      for (let y = y0; y < y0 + thick; y++) {
        for (let x = left; x <= right; x++) setRgba(png.data, W, x, y, PAPER);
      }
      // dot on the left
      const cx = left - Math.round(W * 0.06);
      const cy = Math.round(W * ry);
      const r = Math.max(1, Math.round(W * 0.045));
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
            setRgba(png.data, W, x, y, PAPER);
          }
        }
      }
    }
  }

  return png;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const png = renderIcon(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), PNG.sync.write(png));
}
console.log('[icons] My Pings PNGs → public/icons');
