#!/usr/bin/env node
/**
 * Thread hero art: fetch one from Wikimedia Commons, and preview how it will
 * actually crop inside a thread card.
 *
 * Why this is a script and not a session's worth of ad-hoc commands: PR #2053
 * did this by hand for one hero, this PR needed it four more times, and the
 * next new thread will need it again (CLAUDE.md rule 8). The two steps it
 * automates are the two that were being got wrong by hand:
 *
 *   1. VERIFY, don't trust the download. A 200 and a non-zero body prove
 *      nothing — CDNs serve 1x1 placeholders to non-browser clients
 *      (docs/decisions.md, the hotlink-verification lesson). `fetch` checks
 *      magic bytes AND decoded dimensions before it writes anything.
 *   2. MEASURE the crop, don't guess it. A thread card is 4:3 on a phone and
 *      16:10 from `sm:` up, and its text block covers all but the top strip of
 *      the image. `preview` renders exactly that — cover-crop at a candidate
 *      object-position, with the same two scrims ThreadsMode.tsx paints — so
 *      `heroPosition` is chosen by looking, the way #2053's was.
 *
 * Usage:
 *   node scripts/images/thread-hero.mjs fetch "File:Some Photo.jpg" some-photo
 *   node scripts/images/thread-hero.mjs preview apps/web/public/threads/x.jpg "50% 82%"
 *
 * `fetch` prints the Commons artist / licence / description / date. Paste those
 * into the THREADS entry's comment and `heroCredit` verbatim: the caption is
 * the source of truth for what a photo depicts, and we keep its claim rather
 * than embellishing it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const UA = 'LongLiveTS/1.0 (https://longlivets.com; hello@longlivets.com) thread-hero-sourcing';
// Anchored to the repo, never to the cwd: run from a subdirectory and a
// cwd-relative path would happily `mkdir -p apps/web/public/threads` under
// wherever you happened to be standing, report success, and leave the hero
// somewhere the app never looks.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HERO_DIR = path.join(REPO_ROOT, 'apps/web/public/threads');
const HERO_WIDTH = 1200; // matches the End Game hero (#2053)
/**
 * The End Game hero is 127KB at 1200px wide, and that is the scale the rest
 * are held to: six heroes ship on the threads gallery and they all load on one
 * screen. Quality steps down until the file fits rather than being fixed at a
 * number, because a busy photo (a stadium of 60,000 lights) costs far more
 * bytes at q82 than a calm one and a single hard-coded quality would either
 * bloat the busy ones or needlessly soften the calm ones.
 */
const HERO_MAX_BYTES = 150 * 1024;
const HERO_QUALITIES = [82, 78, 74, 70, 66, 62];
const PREVIEW_DIR =
  process.env.THREAD_HERO_PREVIEW_DIR ?? path.join(REPO_ROOT, 'thread-hero-preview');

/** JPEG / PNG / WebP / GIF file signatures — anything else is not a photo. */
const MAGIC = [
  ['ffd8ff', 'jpeg'],
  ['89504e47', 'png'],
  ['52494646', 'webp'],
  ['47494638', 'gif'],
];

/**
 * The source rectangle CSS `object-fit: cover` + `object-position` would show
 * for a box of `boxW`x`boxH`. Pure geometry, so it can be tested without an
 * image: the box is filled by the larger of the two scale factors, and the
 * leftover width/height is split by the position percentages.
 */
export function coverWindow(srcW, srcH, boxW, boxH, posX, posY) {
  // CSS clamps an out-of-range object-position to the edge rather than
  // scrolling past it; without this, 120% walks the extract window off the
  // bottom of the image and sharp dies with "bad extract area".
  posX = Math.min(100, Math.max(0, posX));
  posY = Math.min(100, Math.max(0, posY));
  const scale = Math.max(boxW / srcW, boxH / srcH);
  const width = Math.min(srcW, Math.round(boxW / scale));
  const height = Math.min(srcH, Math.round(boxH / scale));
  return {
    width,
    height,
    left: Math.round((srcW - width) * (posX / 100)),
    top: Math.round((srcH - height) * (posY / 100)),
  };
}

/** "50% 82%" / "50%" / "" -> [x, y] percentages. Defaults to a centre crop. */
export function parsePosition(value) {
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const nums = parts.map((p) => Number(p.replace('%', '')));
  if (nums.some((n) => !Number.isFinite(n))) throw new Error(`Bad object-position: ${value}`);
  if (nums.length === 0) return [50, 50];
  if (nums.length === 1) return [nums[0], 50];
  return [nums[0], nums[1]];
}

/**
 * Decode to upright raw pixels, and report the dimensions a browser would show.
 *
 * `.rotate()` applies the EXIF orientation and sharp strips EXIF on output, so
 * without it a photo tagged "rotate 90" ships on its side. But `.metadata()`
 * on a rotate-pending pipeline still reports the PRE-rotation width and height
 * (verified against sharp 0.34 / libvips 8.18), so anything that measures a
 * crop from it — `coverWindow`, the placeholder check — would be measuring the
 * wrong axis. Materialising raw pixels is the only reading that cannot lie:
 * `info` describes what actually came out. Raw rather than re-encoded, so the
 * quality ladder below compresses the original once, not twice.
 */
async function uprightPixels(input) {
  const pixels = await sharp(input).rotate().raw().toBuffer({ resolveWithObject: true });
  return { pixels, width: pixels.info.width, height: pixels.info.height };
}

async function commonsMetadata(title) {
  const url =
    'https://commons.wikimedia.org/w/api.php?format=json&action=query&prop=imageinfo' +
    '&iiprop=url|size|extmetadata&titles=' +
    encodeURIComponent(title);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${title}`);
  const json = await res.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No such Commons file: ${title}`);
  const meta = info.extmetadata ?? {};
  const field = (key) =>
    meta[key]
      ? String(meta[key].value)
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
  return {
    width: info.width,
    height: info.height,
    licence: field('LicenseShortName'),
    artist: field('Artist'),
    description: field('ImageDescription'),
    date: field('DateTimeOriginal'),
    source: field('Credit'),
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  };
}

async function cmdFetch(title, basename) {
  if (!title || !basename) throw new Error('usage: fetch "File:Name.jpg" <kebab-case-basename>');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(basename)) throw new Error(`Not kebab-case: ${basename}`);

  const meta = await commonsMetadata(title);
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/^File:/, ''))}?width=${HERO_WIDTH * 2}`;
  const res = await fetch(src, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`Download ${res.status} for ${title}`);
  const body = Buffer.from(await res.arrayBuffer());

  // Verification, in the order that catches the most lies for the least work.
  const head = body.subarray(0, 4).toString('hex');
  const kind = MAGIC.find(([sig]) => head.startsWith(sig))?.[1];
  if (!kind) throw new Error(`Not an image (magic bytes ${head}) — got ${body.length} bytes`);
  const { pixels, width: srcW, height: srcH } = await uprightPixels(body);
  if (srcW < HERO_WIDTH) {
    throw new Error(`Only ${srcW}px wide; a hero needs ${HERO_WIDTH}px (placeholder?)`);
  }

  fs.mkdirSync(HERO_DIR, { recursive: true });
  const out = path.join(HERO_DIR, `${basename}.jpg`);
  let quality = HERO_QUALITIES[0];
  let encoded;
  for (const q of HERO_QUALITIES) {
    quality = q;
    encoded = await sharp(pixels.data, { raw: pixels.info })
      .resize({ width: HERO_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();
    if (encoded.length <= HERO_MAX_BYTES) break;
  }
  fs.writeFileSync(out, encoded);
  const written = await sharp(out).metadata();

  console.log(
    `wrote ${out} — ${written.width}x${written.height}, ${Math.round(encoded.length / 1024)}KB at q${quality}`,
  );
  if (encoded.length > HERO_MAX_BYTES) {
    // Said out loud rather than swallowed: a noisy, high-ISO source can sit
    // above the budget at every quality on the ladder, and the honest options
    // are to accept the weight deliberately or to pick a cleaner photo.
    console.warn(
      `  WARNING    over the ${Math.round(HERO_MAX_BYTES / 1024)}KB hero budget even at q${HERO_QUALITIES.at(-1)} ` +
        '— accept it deliberately (say so in the PR) or choose a less noisy source.',
    );
  }
  console.log(`  source     ${srcW}x${srcH} ${kind} from ${meta.page}`);
  console.log(`  artist     ${meta.artist}`);
  console.log(`  licence    ${meta.licence}`);
  console.log(`  date       ${meta.date}`);
  console.log(`  caption    ${meta.description}`);
}

async function cmdPreview(file, position) {
  if (!file) throw new Error('usage: preview <image> "<object-position>"');
  const [posX, posY] = parsePosition(position);
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  // Same reason as in `fetch`: measure the crop against what the browser will
  // actually show, which is the upright image.
  const { pixels, width: srcW, height: srcH } = await uprightPixels(file);
  // 350x262 (4:3) is the phone card; 16:10 is the `sm:` and up card. Rendered
  // at 2x so the strip that stays uncovered is legible on screen.
  for (const [label, boxW, boxH, blockFraction] of [
    ['phone-4x3', 700, 524, 492 / 524],
    ['desktop-16x10', 700, 438, 0.72],
  ]) {
    const win = coverWindow(srcW, srcH, boxW, boxH, posX, posY);
    // Stays raw all the way to the composite below — a raw-input pipeline
    // returns raw pixels, so the scrim stage has to be told their shape rather
    // than sniffing a format that isn't there.
    const base = await sharp(pixels.data, { raw: pixels.info })
      .extract(win)
      .resize(boxW, boxH)
      .raw()
      .toBuffer();
    const baseRaw = { width: boxW, height: boxH, channels: pixels.info.channels };
    const blockTop = Math.round(boxH * (1 - blockFraction));
    const scrims = `<svg width="${boxW}" height="${boxH}">
      <defs>
        <linearGradient id="vignette" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#0d0b12" stop-opacity="0.6"/>
          <stop offset="60%" stop-color="#0d0b12" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="textblock" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#0d0b12" stop-opacity="1"/>
          <stop offset="45%" stop-color="#0d0b12" stop-opacity="0.94"/>
          <stop offset="74%" stop-color="#0d0b12" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#0d0b12" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${boxW}" height="${boxH}" fill="url(#vignette)"/>
      <rect y="${blockTop}" width="${boxW}" height="${boxH - blockTop}" fill="url(#textblock)"/>
    </svg>`;
    const out = path.join(PREVIEW_DIR, `${path.basename(file, path.extname(file))}-${label}.jpg`);
    await sharp(base, { raw: baseRaw })
      .composite([{ input: Buffer.from(scrims) }])
      .jpeg({ quality: 90 })
      .toFile(out);
    console.log(`${out} — window ${win.width}x${win.height} at (${win.left},${win.top})`);
  }
  console.log(`(previews are scratch output; ${PREVIEW_DIR}/ is git-ignored)`);
}

// Only when run as a command — the geometry helpers above are imported by
// scripts/images/thread-hero.test.ts, which must not trigger a CLI dispatch.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  const commands = {
    fetch: () => cmdFetch(args[0], args[1]),
    preview: () => cmdPreview(args[0], args[1]),
  };
  if (!commands[command]) {
    console.error(
      'usage: thread-hero.mjs fetch "File:Name.jpg" <basename> | preview <image> "<x% y%>"',
    );
    process.exitCode = 1;
  } else {
    await commands[command]();
  }
}
