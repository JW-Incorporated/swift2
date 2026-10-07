import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EraFont } from '@swift2/experience';

/**
 * Fonts for the share-card renderer (satori wants raw TTF/OTF/WOFF bytes up
 * front, never WOFF2). The same two families the site ships (Playfair Display
 * + Inter, SIL OFL — see share-fonts/README.md), vendored as five latin
 * subsets (~150 KB total, well under ImageResponse's 500 KB bundle ceiling)
 * so the route works on Vercel without depending on devDependency tracing.
 * Resolved from this module's own location, not `process.cwd()`, for the same
 * reason as read-bundle-artifact.ts. `next.config.mjs` lists the directory in
 * `outputFileTracingIncludes` so the files ship with the function.
 */
const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'share-fonts');

interface FontFace {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700 | 800 | 900;
  style: 'normal';
}

let cached: FontFace[] | null = null;

export function loadShareCardFonts(): FontFace[] {
  if (cached) return cached;
  const read = (file: string) => readFileSync(path.join(FONT_DIR, file));
  cached = [
    {
      name: 'Playfair Display',
      data: read('playfair-display-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Playfair Display',
      data: read('playfair-display-latin-900-normal.woff'),
      weight: 900,
      style: 'normal',
    },
    { name: 'Inter', data: read('inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Inter', data: read('inter-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Inter', data: read('inter-latin-800-normal.woff'), weight: 800, style: 'normal' },
  ];
  return cached;
}

export interface HeadingStyle {
  fontFamily: string;
  fontWeight: number;
  textTransform?: 'uppercase';
  letterSpacing: number;
}

/**
 * An era's `theme.font` personality mapped onto the faces we can render with.
 * The site's script/mono/bodoni faces are Google fonts loaded in the browser
 * only; the card sticks to what is vendored: serif and script share Playfair
 * (script at its heaviest, 900), sans is Inter 800, and mono is tracked-out
 * uppercase Inter 600 for the typewriter feel.
 */
export function headingStyleFor(font: EraFont): HeadingStyle {
  switch (font) {
    case 'sans':
      return { fontFamily: 'Inter', fontWeight: 800, letterSpacing: -2 };
    case 'mono':
      return { fontFamily: 'Inter', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 };
    case 'script':
      return { fontFamily: 'Playfair Display', fontWeight: 900, letterSpacing: -1 };
    case 'serif':
    default:
      return { fontFamily: 'Playfair Display', fontWeight: 700, letterSpacing: -1 };
  }
}
