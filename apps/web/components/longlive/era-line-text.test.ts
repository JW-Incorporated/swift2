import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// #2230: --era-line is the border/hairline token — deliberately low-contrast
// for dividers, never meant to color text. AlbumNarrativeCard's album index
// numerals used it as `color` and measured 1.31:1 (WCAG 1.4.3 needs ≥3:1 for
// large bold text). This source-locks the whole longlive tree so the border
// token can't quietly become a text color again; borders, outlines, rails and
// color-mix derivations stay untouched.

const ROOT = fileURLToPath(new URL('.', import.meta.url));

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });

const TEXT_COLOR_USES = [
  // style={{ color: 'var(--era-line)' }} — the #2230 bug shape
  /color:\s*'var\(--era-line\)'/,
  // Tailwind arbitrary text color: text-[color:var(--era-line)]
  /text-\[color:var\(--era-line\)\]/,
];

describe('#2230 --era-line (border token) is never used as a text color', () => {
  for (const file of tsxFiles(ROOT)) {
    const rel = file.slice(ROOT.length);
    it(rel, () => {
      const src = readFileSync(file, 'utf8');
      for (const pattern of TEXT_COLOR_USES) {
        expect(src).not.toMatch(pattern);
      }
    });
  }
});
