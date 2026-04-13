// Generates icon-192.png and icon-512.png for the Outfield PWA
// Runs with: node generate-icons.js
// Uses only Node.js built-ins (zlib) — no npm packages required.

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

/* ── PNG helpers ── */
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const tb   = Buffer.from(type, 'ascii');
  const crcb = Buffer.alloc(4); crcb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcb]);
}

function buildPNG(w, h, pixels /* Uint8Array RGBA */) {
  // Build raw scanlines: filter-byte (0 = None) then RGBA pixels
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = y * (1 + w * 4) + 1 + x * 4;
      raw[dst]   = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
      raw[dst+3] = pixels[src+3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

/* ── Draw helpers ── */
function setPixel(px, w, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= w || y < 0 || y >= w) return;
  const i = (y * w + x) * 4;
  px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a;
}

function fillRect(px, w, x0, y0, x1, y1, r, g, b, a = 255) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++)
      setPixel(px, w, x, y, r, g, b, a);
}

// Draw a thick vertical line with a soft glow halo
function drawStump(px, size, cx, top, bottom, thickness) {
  const half = thickness / 2;
  // Glow (wider, dim green)
  for (let y = top; y <= bottom; y++) {
    for (let dx = -half - 4; dx <= half + 4; dx++) {
      const dist = Math.abs(dx) - half;
      if (dist > 0) {
        const alpha = Math.max(0, 80 - dist * 20);
        const x = Math.round(cx + dx);
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const i = (y * size + x) * 4;
          px[i]   = Math.min(255, px[i]   + 0);
          px[i+1] = Math.min(255, px[i+1] + alpha);
          px[i+2] = Math.min(255, px[i+2] + Math.round(alpha * 0.47));
          px[i+3] = 255;
        }
      }
    }
  }
  // Core bright stroke
  fillRect(px, size, cx - half, top, cx + half, bottom, 0, 255, 120);
}

// Draw a horizontal bail with glow
function drawBail(px, size, x0, x1, cy, thickness) {
  const half = thickness / 2;
  for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
    for (let dy = -half - 3; dy <= half + 3; dy++) {
      const dist = Math.abs(dy) - half;
      if (dist > 0) {
        const alpha = Math.max(0, 70 - dist * 22);
        const y = Math.round(cy + dy);
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const i = (y * size + x) * 4;
          px[i+1] = Math.min(255, px[i+1] + alpha);
          px[i+2] = Math.min(255, px[i+2] + Math.round(alpha * 0.47));
          px[i+3] = 255;
        }
      }
    }
  }
  fillRect(px, size, x0, cy - half, x1, cy + half, 0, 255, 120);
}

/* ── Generate one icon ── */
function generateIcon(size) {
  const px = new Uint8Array(size * size * 4);

  // Background: #040608
  for (let i = 0; i < px.length; i += 4) {
    px[i] = 4; px[i+1] = 6; px[i+2] = 8; px[i+3] = 255;
  }

  // Radial green glow in centre
  const cx = size / 2, cy = size / 2;
  const glowR = size * 0.38;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d < glowR) {
        const t = 1 - d / glowR;
        const alpha = Math.round(t * t * 30);
        const i = (y * size + x) * 4;
        px[i+1] = Math.min(255, px[i+1] + alpha);
        px[i+2] = Math.min(255, px[i+2] + Math.round(alpha * 0.3));
      }
    }
  }

  // Cricket stumps layout
  const stumpTop    = Math.round(size * 0.22);
  const stumpBottom = Math.round(size * 0.75);
  const stumpH      = stumpBottom - stumpTop;
  const thick       = Math.max(3, Math.round(size * 0.035));
  const spacing     = Math.round(size * 0.105);

  const stumps = [cx - spacing, cx, cx + spacing];
  stumps.forEach(sx => drawStump(px, size, sx, stumpTop, stumpBottom, thick));

  // Two bails sitting on top of stumps
  const bailY1   = stumpTop + Math.round(thick * 0.5);
  const bailY2   = stumpTop + Math.round(thick * 1.8);
  const bailThick = Math.max(2, Math.round(size * 0.022));
  const leftEdge  = stumps[0] - thick / 2;
  const rightEdge = stumps[2] + thick / 2;

  drawBail(px, size, leftEdge,  stumps[0] + thick / 2 + spacing * 0.3, bailY1, bailThick);
  drawBail(px, size, stumps[1] + thick / 2 - spacing * 0.3, rightEdge, bailY1, bailThick);

  // Rounded top caps on stumps (bright dots)
  stumps.forEach(sx => {
    const r = thick * 0.8;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx*dx + dy*dy <= r*r) {
          setPixel(px, size, Math.round(sx + dx), stumpTop + Math.round(dy), 80, 255, 160);
        }
      }
    }
  });

  return buildPNG(size, size, px);
}

const publicDir = path.join(__dirname, 'public');

[192, 512].forEach(size => {
  const buf = generateIcon(size);
  const out = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✓ Written ${out} (${buf.length} bytes)`);
});
