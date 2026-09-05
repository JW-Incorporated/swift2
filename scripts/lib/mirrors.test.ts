// Mirror-consistency tests (R5, Fable 5.1 architecture review §3.2/§4).
//
// The repo has adopted "MIRROR, NOT IMPORT" as a named precedent for values
// that must be duplicated by hand across a boundary a real `import` can't
// cross (packages/shared can't import scripts/, .mjs can't import .ts,
// apps/worker can't import apps/web). The review flagged that none of these
// ≥6 hand-kept pairs had a test asserting the two sides still agree — this
// file is that test, for the four pairs named in the review's remediation
// list. Zero production code changes: some of the "mirror" constants are not
// exported by their module (by design — they are private implementation
// details), so this file reads those files' source text directly and
// extracts the literal instead of exporting anything new.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { SEXUALIZATION_TERMS } from '../../packages/shared/src/redline';
// @ts-expect-error -- plain .mjs, no type declarations (mirrored precedent throughout scripts/)
import { CONFIG } from '../content-engine/config.mjs';
import { CONFIRMED_TIER } from '../../apps/web/lib/longlive/types';
import { CURRENT_ERA_ID } from '../../apps/web/lib/longlive/eras';
// @ts-expect-error -- plain .mjs, no type declarations
import { SLUG_TO_ERA_ID } from './longlive-sync-shared.mjs';
import { MOOD_BATTERY } from '../../apps/web/lib/longlive/mood-battery';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (relPath: string) => readFile(path.join(ROOT, relPath), 'utf-8');

/**
 * Pull `const NAME = <expr>;` out of a source file's text without importing
 * it (the constant is deliberately not exported). Fails loudly — not with a
 * false pass — if the declaration's shape ever changes, since a silent
 * regex miss would defeat the whole point of this file.
 */
function extractConst(source: string, name: string, filePath: string): string {
  const match = source.match(new RegExp(`const ${name} = ([^;]+);`));
  if (!match) {
    throw new Error(`mirrors.test.ts: could not find "const ${name} = ...;" in ${filePath}`);
  }
  return match[1];
}

describe('mirror: SEXUALIZATION_TERMS (packages/shared/src/redline.ts vs scripts/content-engine/config.mjs)', () => {
  it('the two hand-kept term lists agree', () => {
    expect([...SEXUALIZATION_TERMS]).toEqual([...CONFIG.safety.sexualizationTerms]);
  });
});

describe('mirror: CONFIRMED_TIER (apps/web/lib/longlive/types.ts vs scripts/content-engine/checkers/hot-thin-topic.mjs)', () => {
  it('the checker\'s private mirror agrees with the exported source of truth', async () => {
    const filePath = 'scripts/content-engine/checkers/hot-thin-topic.mjs';
    const source = await read(filePath);
    const literal = extractConst(source, 'CONFIRMED_TIER', filePath);
    const mirrored: Set<string> = new Function(`return ${literal};`)();
    expect([...mirrored].sort()).toEqual([...CONFIRMED_TIER].sort());
  });
});

describe('mirror: CURRENT_ERA_ID (eras.ts, run-extract-stage.ts, content-engine/config.mjs, longlive-sync-shared.mjs)', () => {
  it('apps/worker\'s private mirror agrees with apps/web\'s exported CURRENT_ERA_ID', async () => {
    const filePath = 'apps/worker/src/extract/run-extract-stage.ts';
    const source = await read(filePath);
    const literal = extractConst(source, 'CURRENT_ERA_ID', filePath);
    const mirrored: string = new Function(`return ${literal};`)();
    expect(mirrored).toBe(CURRENT_ERA_ID);
  });

  it('content-engine/config.mjs\'s latest-news-era slug resolves (via SLUG_TO_ERA_ID) to CURRENT_ERA_ID', () => {
    const [latestSlug] = CONFIG.visibility.latestNewsEras;
    const resolved = SLUG_TO_ERA_ID[latestSlug] ?? latestSlug;
    expect(resolved).toBe(CURRENT_ERA_ID);
  });
});

describe('mirror: mood-chat acceptance battery (mood-battery.ts vs scripts/check-mood-battery.mjs)', () => {
  it('the live-battery script\'s case list agrees with the canonical TS list', async () => {
    const filePath = 'scripts/check-mood-battery.mjs';
    const source = await read(filePath);
    const match = source.match(/const CASES = (\[[\s\S]*?\n\]);/);
    if (!match) {
      throw new Error(`mirrors.test.ts: could not find "const CASES = [...];" in ${filePath}`);
    }
    const mirrored: Array<{ id: number; text: string; expected: string }> = new Function(
      `return ${match[1]};`,
    )();
    expect(mirrored).toEqual(
      MOOD_BATTERY.map((c) => ({ id: c.id, text: c.text, expected: c.expectedKind })),
    );
  });
});
