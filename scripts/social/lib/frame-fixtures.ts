import sharp from 'sharp';

/** Deterministic blocky test image: sharp edges, mid luminance, distinct per seed. */
export async function blocky(seed: number, width = 1280, height = 720, { bars = false, flat = false } = {}): Promise<Buffer> {
  const data = Buffer.alloc(width * height * 3);
  const block = 40;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const bx = Math.floor(x / block);
      const by = Math.floor(y / block);
      let v = flat ? 128 : 40 + (((bx * 7919 + by * 104729 + seed * 15485863) >>> 3) % 180);
      if (bars && (y < height * 0.1 || y > height * 0.9)) v = 0;
      const i = (y * width + x) * 3;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
}

export const solid = (width: number, height: number, value: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: value, g: value, b: value } } }).jpeg().toBuffer();
