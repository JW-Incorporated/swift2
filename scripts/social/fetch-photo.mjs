#!/usr/bin/env node
// Downloads one social-library image as REAL BYTES so an agent can look at it
// (issue #6806). Library binaries live in Git LFS and are excluded from the
// Vercel deploy (docs/decisions.md 2026-10-07), so a checkout holds 131-byte
// pointer text and the site serves that same text — Tree's daily-draft run had
// no way to actually see a photo before using it ("look at the image before you
// use it", tree-daily-draft.md). This is a thin CLI over the existing
// resolveImageBytes() (scripts/social/lib/image-ledger.mjs), which resolves the
// pointer through GitHub's LFS media endpoint and sha256-verifies the download
// against the pointer's oid.
//
//   node --use-env-proxy scripts/social/fetch-photo.mjs /social/library/photos/x.jpg
//   node --use-env-proxy scripts/social/fetch-photo.mjs /social/library/photos/x.jpg --out .scratch/x.jpg
//
// Read-only by design: it never writes inside apps/web/public (so it can never
// turn a committed pointer into committed bytes) and it never touches the queue.
// Default destination is .scratch/photos/<basename>, which is gitignored.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isLfsPointerBuffer } from './lib/lfs-pointer.mjs';
import { resolveImageBytes } from './lib/image-ledger.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_OUT_DIR = path.join('.scratch', 'photos');
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** Magic-byte signatures, so "it downloaded something" is not mistaken for "it downloaded an image". */
const SIGNATURES = [
  { kind: 'jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    kind: 'png',
    test: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    kind: 'webp',
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

/** The image kind of `bytes`, or null when they are not a supported image. */
export function imageKind(bytes) {
  return SIGNATURES.find((s) => s.test(bytes))?.kind ?? null;
}

/**
 * The media path to resolve, normalized to the leading-slash form the queue and
 * mediaUrlFor() use. Accepts `social/...`, `/social/...` or
 * `apps/web/public/social/...`. Throws on anything outside /social/ , on path
 * traversal, and on a non-image extension.
 */
export function normalizeMediaPath(input) {
  const raw = String(input ?? '')
    .trim()
    .replace(/\\/g, '/');
  if (!raw) throw new Error('a media path is required, e.g. /social/library/photos/example.jpg');
  const stripped = raw.replace(/^(?:\.\/)?apps\/web\/public/, '');
  const mediaPath = stripped.startsWith('/') ? stripped : `/${stripped}`;
  if (!mediaPath.startsWith('/social/'))
    throw new Error(`${input} is not a /social/... library path`);
  if (mediaPath.split('/').includes('..')) throw new Error(`${input} must not contain ".."`);
  if (!ALLOWED_EXTENSIONS.includes(path.extname(mediaPath).toLowerCase())) {
    throw new Error(`${input} must end in ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  return mediaPath;
}

/**
 * The absolute destination for `--out`, defaulting to .scratch/photos/<basename>.
 * Refuses apps/web/public so this tool can never overwrite the committed
 * pointer with bytes (that is import-photo-library.mjs's job, through LFS).
 */
export function resolveOutPath(out, mediaPath, { root = ROOT } = {}) {
  const rel =
    typeof out === 'string' && out.trim()
      ? out.trim()
      : path.join(DEFAULT_OUT_DIR, path.basename(mediaPath));
  const abs = path.isAbsolute(rel) ? path.normalize(rel) : path.resolve(root, rel);
  const publicDir = path.join(root, 'apps', 'web', 'public');
  if (abs === publicDir || abs.startsWith(`${publicDir}${path.sep}`)) {
    throw new Error(
      '--out must not be inside apps/web/public (this tool never writes into the library)',
    );
  }
  return abs;
}

/**
 * Writes the real bytes of `mediaPath` to `out`. Returns
 * `{ mediaPath, out, bytes, kind }`. Throws when the bytes cannot be resolved,
 * are still an LFS pointer, or are not a supported image.
 */
export async function fetchPhoto(
  { mediaPath, out },
  { root = ROOT, fetchImpl, retryDelayMs } = {},
) {
  const media = normalizeMediaPath(mediaPath);
  const target = resolveOutPath(out, media, { root });
  const options = {
    root,
    ...(fetchImpl ? { fetchImpl } : {}),
    ...(retryDelayMs === undefined ? {} : { retryDelayMs }),
  };
  const bytes = await resolveImageBytes(media, options);
  if (isLfsPointerBuffer(bytes))
    throw new Error(`${media} still resolved to Git LFS pointer text, not an image`);
  const kind = imageKind(bytes);
  if (!kind)
    throw new Error(`${media} resolved to ${bytes.length} bytes that are not a JPEG, PNG or WebP`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return { mediaPath: media, out: target, bytes: bytes.length, kind };
}

function parseArgs(argv) {
  const out = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const next = argv[i + 1];
      out[argv[i].slice(2)] = next === undefined || next.startsWith('--') ? true : argv[++i];
    } else {
      out.positional.push(argv[i]);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mediaPath = args.positional[0] ?? (typeof args.media === 'string' ? args.media : undefined);
  if (!mediaPath) {
    console.error('Usage: fetch-photo.mjs /social/library/photos/<file>.jpg [--out <path>]');
    process.exit(1);
  }
  const r = await fetchPhoto({
    mediaPath,
    out: typeof args.out === 'string' ? args.out : undefined,
  });
  console.log(
    `Wrote ${path.relative(ROOT, r.out) || r.out} — ${r.kind}, ${(r.bytes / 1024).toFixed(0)} KB (${r.mediaPath})`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`fetch-photo: ${err.message ?? err}`);
    process.exit(1);
  });
}
