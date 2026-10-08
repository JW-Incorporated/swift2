import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

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
    expect(src).toContain(
      "cpSync(join(experienceSrc, LENSES), join(fixtureDir, 'experience', LENSES))",
    );
  });

  it('fixture.json pins the frozen lens module hash', () => {
    const { lensesSha256 } = JSON.parse(read('scripts/parity/fixture/fixture.json'));
    const text = read('scripts/parity/fixture/experience/lenses.generated.ts').replaceAll(
      '\r\n',
      '\n',
    );
    expect(lensesSha256).toBe(createHash('sha256').update(text).digest('hex'));
    expect(read('scripts/parity/make-fixture.mjs')).toContain(
      'committed.lensesSha256 !== lensesSha256',
    );
  });

  describe('workflow step order', () => {
    type Step = { name?: string; run?: string };
    const wf = parse(read('.github/workflows/parity.yml')) as {
      jobs: Record<string, { steps: Step[] }>;
    };
    const idx = (job: string, match: (s: Step) => boolean) => {
      const i = wf.jobs[job].steps.findIndex(match);
      expect(i, `${job} step not found`).toBeGreaterThanOrEqual(0);
      return i;
    };
    const runs = (needle: string) => (s: Step) => (s.run ?? '').includes(needle);

    it('build-dom: sync:content, then --lenses, then expo export', () => {
      const sync = idx('build-dom', runs('sync:content'));
      const lenses = idx('build-dom', runs('make-fixture.mjs --lenses'));
      const expo = idx('build-dom', runs('expo export'));
      expect(sync).toBeLessThan(lenses);
      expect(lenses).toBeLessThan(expo);
    });

    it('build-web: sync:content, then --apply, then next build', () => {
      const sync = idx('build-web', runs('sync:content'));
      const apply = idx('build-web', runs('make-fixture.mjs --apply'));
      const build = idx('build-web', runs('next build'));
      expect(sync).toBeLessThan(apply);
      expect(apply).toBeLessThan(build);
    });
  });
});
