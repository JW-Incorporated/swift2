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

/** Flat grey background with text-like vertical strokes in three bands (a title card), or one big rectangle (a silhouette). */
export async function card(kind: 'text' | 'silhouette', width = 1280, height = 720): Promise<Buffer> {
  const data = Buffer.alloc(width * height * 3, 200);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const band = [150, 300, 450].some((top) => y >= top && y < top + 50);
      const stroke = band && x >= 200 && x < 1000 && x % 24 < 8;
      const blob = x >= 450 && x < 800 && y >= 150 && y < 650;
      if ((kind === 'text' && stroke) || (kind === 'silhouette' && blob)) data.fill(20, (y * width + x) * 3, (y * width + x) * 3 + 3);
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
}

/** Stamps the same high-detail mark into one corner of a 1280x720 frame. */
export async function stampLogo(frame: Buffer, corner: 'bottom-right' | 'top-left' = 'bottom-right'): Promise<Buffer> {
  const w = 200;
  const h = 110;
  const mark = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) mark.fill(((x >> 3) + (y >> 3)) % 2 ? 255 : 0, (y * w + x) * 3, (y * w + x) * 3 + 3);
  const png = await sharp(mark, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  const [left, top] = corner === 'bottom-right' ? [1280 - w - 10, 720 - h - 10] : [10, 10];
  return sharp(frame).composite([{ input: png, left, top }]).jpeg({ quality: 92 }).toBuffer();
}
