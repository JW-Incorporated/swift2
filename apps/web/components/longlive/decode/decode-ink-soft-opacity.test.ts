import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// #3412: --era-ink-soft is tuned to clear WCAG 1.4.3 (≥4.5:1) against the era
// surfaces — that margin is the token's whole contract. DecodeCard's "the
// wait" label stacked an inline `opacity: 0.7` on top, cutting the effective
// contrast to 3.9:1 on every clue card. This source-locks the decode tree so
// an opacity multiplier can't quietly ride along with the token again;
// opacity utilities on non-text elements and other tokens stay untouched.

const ROOT = fileURLToPath(new URL('.', import.meta.url));

const tsxFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });

const INK_SOFT_WITH_OPACITY = [
  // style={{ color: 'var(--era-ink-soft)', opacity: … }} — the #3412 bug shape
  /\{\{[^}]*color:\s*'var\(--era-ink-soft\)'[^}]*opacity:/,
  // same pair, written in the other order
  /\{\{[^}]*opacity:[^}]*color:\s*'var\(--era-ink-soft\)'/,
];

describe('#3412 --era-ink-soft never carries an inline opacity multiplier in decode/', () => {
  for (const file of tsxFiles(ROOT)) {
    const rel = file.slice(ROOT.length);
    it(rel, () => {
      const src = readFileSync(file, 'utf8');
      for (const pattern of INK_SOFT_WITH_OPACITY) {
        expect(src).not.toMatch(pattern);
      }
    });
  }
});
