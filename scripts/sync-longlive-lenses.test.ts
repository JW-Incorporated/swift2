import { describe, expect, it } from 'vitest';
import { renderModule } from './sync-longlive-lenses.mjs';

// The lenses generator is a straight seed-to-generated-module pass-through
// (like merch — see the header comment in sync-longlive-lenses.mjs), so the
// only pure logic worth unit-testing is renderModule's TS-literal output.
describe('renderModule', () => {
  it('emits a valid, importable TS module with every dataset export', () => {
    const datasets = [
      { exportName: 'THREADS', type: 'ThreadMeta[]', data: [{ id: 'the-proposal', title: 'End Game' }] },
      { exportName: 'RELATIONSHIPS', type: 'Relationship[]', data: [] },
      { exportName: 'CLUE_PAIRS', type: 'CluePair[]', data: [{ id: 'clue-x', title: 'X' }] },
    ];
    const ts = renderModule(datasets, { 'number-13': ['egg-1'] });
    expect(ts).toContain('// GENERATED FILE — do not hand-edit.');
    expect(ts).toContain(
      "import type { CluePair, EggLink, EggNode, Motif, MotifId, ReRecord, Relationship, RunwayLook, SinglePeriod } from './types';",
    );
    expect(ts).toContain("import type { ThreadMeta } from './lenses';");
    expect(ts).toContain('export const THREADS: ThreadMeta[] = [');
    expect(ts).toContain('"id": "the-proposal"');
    expect(ts).toContain('export const RELATIONSHIPS: Relationship[] = [];');
    expect(ts).toContain('export const CLUE_PAIRS: CluePair[] = [');
    expect(ts).toContain('export const MOTIF_MEMBERSHIP: Record<MotifId, string[]> = {');
    expect(ts).toContain('"number-13"');
  });

  it('omits MOTIF_MEMBERSHIP entirely when not provided', () => {
    const ts = renderModule([{ exportName: 'THREADS', type: 'ThreadMeta[]', data: [] }]);
    expect(ts).not.toContain('MOTIF_MEMBERSHIP');
  });

  it('round-trips every field through JSON.stringify without loss', () => {
    const datasets = [
      {
        exportName: 'THREADS',
        type: 'ThreadMeta[]',
        data: [{ id: 't1', title: 'Title', heroPosition: '50% 36%' }],
      },
    ];
    const ts = renderModule(datasets);
    // eslint-disable-next-line no-eval
    const THREADS = eval(ts.match(/export const THREADS: ThreadMeta\[\] = (\[[\s\S]*?\]);/)[1]);
    expect(THREADS).toEqual(datasets[0].data);
  });

  it('renders an empty dataset list as a minimal valid TS module', () => {
    const ts = renderModule([]);
    expect(ts).toContain('// GENERATED FILE — do not hand-edit.');
    expect(ts.trim().endsWith("from './lenses';")).toBe(true);
  });
});
