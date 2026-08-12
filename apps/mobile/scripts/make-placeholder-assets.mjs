// Generates the placeholder app icon / adaptive icon / splash PNGs so EAS
// builds have valid assets before real branding exists. Deterministic and
// dependency-free (hand-rolled minimal PNG encoder over zlib) — re-run any
// time with:  node scripts/make-placeholder-assets.mjs
//
// Replace the files in assets/ with real branding before a store release
// (see docs/mobile-shipping-checklist.md).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// Palette: midnight background + lavender mark (matches the app's dark chrome).
const BG = [0x1e, 0x1b, 0x4b, 0xff];
const MARK = [0xc4, 0xb5, 0xfd, 0xff];
const RING = [0x8b, 0x7c, 0xf6, 0xff];
const CLEAR = [0, 0, 0, 0];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Encode an RGBA pixel function into a PNG buffer. */
function encodePng(size, pixelAt) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let off = 0;
  for (let y = 0; y < size; y += 1) {
    raw[off] = 0; // filter: none
    off += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
      off += 4;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** The placeholder mark: a lavender disc with a ring — "vault dial". */
function markPixel(x, y, size, background, discScale) {
  const cx = size / 2;
  const cy = size / 2;
  const d = Math.hypot(x - cx, y - cy);
  const disc = (size / 2) * discScale;
  if (d <= disc * 0.62) return MARK;
  if (d <= disc * 0.74) return background;
  if (d <= disc) return RING;
  return background;
}

function write(name, buf) {
  const file = join(OUT_DIR, name);
  writeFileSync(file, buf);
  console.log(`wrote ${file} (${buf.length} bytes)`);
}

mkdirSync(OUT_DIR, { recursive: true });
// App icon: opaque, full-bleed background.
write(
  'icon.png',
  encodePng(1024, (x, y) => markPixel(x, y, 1024, BG, 0.72)),
);
// Android adaptive-icon foreground: transparent, mark inside the safe zone
// (central ~61% of the canvas) — backgroundColor comes from app.json.
write(
  'adaptive-icon.png',
  encodePng(1024, (x, y) => markPixel(x, y, 1024, CLEAR, 0.5)),
);
// Splash: transparent mark, letterboxed over app.json's backgroundColor.
write(
  'splash.png',
  encodePng(512, (x, y) => markPixel(x, y, 512, CLEAR, 0.55)),
);
