import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => readFileSync(join(repo, p), 'utf-8');

describe('parity frozen fixture includes lenses (#5341)', () => {
  it('commits the frozen lens module with the lens datasets', () => {
    const p = 'scripts/parity/fixture/experience/lenses.generated.ts';
    expect(existsSync(join(repo, p))).toBe(true);
    const text = read(p);
    for (const name of ['THREADS', 'RUNWAY_LOOKS', 'MOTIF_MEMBERSHIP']) {
      expect(text).toContain(`export const ${name}`);
    }
  });

  it('make-fixture freezes, applies and regenerates the lens module', () => {
    const src = read('scripts/parity/make-fixture.mjs');
    expect(src).toContain("const LENSES = 'lenses.generated.ts'");
    expect(src).toContain("'--lenses'");
    expect(src.match(/cpSync\(join\(fixtureDir, 'experience', LENSES\)/g)).toHaveLength(2);
    expect(src).toContain("cpSync(join(experienceSrc, LENSES), join(fixtureDir, 'experience', LENSES))");
  });

  it('both parity builds overlay the frozen lenses before building', () => {
    const wf = read('.github/workflows/parity.yml');
    expect(wf).toContain('make-fixture.mjs --apply');
    expect(wf).toContain('make-fixture.mjs --lenses');
  });
});
