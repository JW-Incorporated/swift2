#!/usr/bin/env -S npx tsx
// CLI: render a designed Long Live social card PNG.
//
//   npx tsx scripts/social/render-card.mjs \
//     --variant text --era midnights \
//     --headline "Feral about a bridge" --kicker "Vault of every 'wait, what?' lyric" \
//     --eyebrow "The Threads" \
//     --out apps/web/public/social/library/thread-blank-spaces-intro.png
//
// Must run under `tsx` (not plain `node`) because it imports the site's own
// eras.ts for palette data (see lib/era-palette.mjs) — that's a TypeScript
// file. `npm run social:card -- <args>` also works (see package.json).
//
// Variants:
//   text   — headline card on the era's own bg + accent glow (default)
//   photo  — full-bleed background photo with a dark scrim + headline
//   quote  — centered oversized quote with attribution
//
// Sizes: --size portrait (1080x1350, default, IG feed 4:5) | square (1080x1080)
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { renderCardPng, SIZES } from './lib/card-render.mjs';
import { eraPalette, listEraIds } from './lib/era-palette.mjs';
import { loadImageAsDataUri } from './lib/image-source.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function usage() {
  return `Usage: render-card.mjs --headline "..." --out <path> [options]

Required:
  --headline <text>       Big hook text (or the quoted line, for --variant quote)
  --out <path>            Output PNG path

Common:
  --variant text|photo|quote   Layout (default: text)
  --era <id>                    Era palette id (${listEraIds().join(', ')}) — omit for brand default
  --eyebrow <text>              Small tracked label above the headline
  --kicker <text>               Subtitle line below the headline (or attribution, for quote)
  --size portrait|square        1080x1350 (default) or 1080x1080
  --icon sparkles|layers|compass  Oversized watermark glyph, text variant only (matches the
                                   app's own Mood/Threads/Eras nav icons)

Photo variant only:
  --photo <path-or-url>         Local file path or http(s) URL for the background image
  --credit <text>                Small credit line rendered bottom-left on the scrim
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(usage());
    return;
  }
  if (!args.headline || !args.out) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const variant = args.variant ?? 'text';
  const sizeKey = args.size ?? 'portrait';
  const size = SIZES[sizeKey];
  if (!size) {
    console.error(`Unknown --size "${sizeKey}". Expected one of: ${Object.keys(SIZES).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const palette = eraPalette(typeof args.era === 'string' ? args.era : null);

  let photoDataUri;
  if (variant === 'photo') {
    if (!args.photo || typeof args.photo !== 'string') {
      console.error('--variant photo requires --photo <path-or-url>');
      process.exitCode = 1;
      return;
    }
    photoDataUri = await loadImageAsDataUri(args.photo);
  }

  const png = await renderCardPng({
    variant,
    palette,
    width: size.width,
    height: size.height,
    eyebrow: typeof args.eyebrow === 'string' ? args.eyebrow : '',
    headline: args.headline,
    kicker: typeof args.kicker === 'string' ? args.kicker : undefined,
    photoDataUri,
    credit: typeof args.credit === 'string' ? args.credit : undefined,
    icon: typeof args.icon === 'string' ? args.icon : undefined,
  });

  await mkdir(path.dirname(args.out), { recursive: true });
  await writeFile(args.out, png);
  console.log(
    `Wrote ${args.out} (${size.width}x${size.height}, ${(png.length / 1024).toFixed(0)} KB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
