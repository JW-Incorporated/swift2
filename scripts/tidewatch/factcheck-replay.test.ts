import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateReplay } from './factcheck-eval.mjs';
import { relabelReplay } from './relabel-replay.mjs';

const readJson = (relative: string) => JSON.parse(
  readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8'),
);
const replay = readJson('docs/projects/tidewatch/replay/replay.json');
const committedRelabel = readJson('docs/projects/tidewatch/replay/replay-relabelled.json');
const committedReport = readJson('docs/projects/tidewatch/replay/replay-relabel-report.json');
const committedResults = readJson('docs/projects/tidewatch/replay/factcheck-eval-results.json');

describe('fact-check replay acceptance', () => {
  it('generates the committed labels-only overlay and complete change report', () => {
    const generated = relabelReplay(replay);
    expect(generated.relabelled).toEqual(committedRelabel);
    expect(generated.report).toEqual(committedReport);
    expect(generated.report.countsByRule).toEqual({
      property_privacy_redline: 13,
      critical_new_official_work_only: 11,
    });
    expect(committedRelabel.items.every((item: Record<string, unknown>) =>
      Object.keys(item).sort().join(',') === 'class,id')).toBe(true);
  });

  it('confirms every relabelled critical and no rumor or single-source item', async () => {
    const original = await evaluateReplay(replay);
    const relabelled = await evaluateReplay(replay, committedRelabel);
    expect({ original, relabelled }).toEqual({
      original: committedResults.original,
      relabelled: committedResults.relabelled,
    });

    expect(original).toMatchObject({
      critical: { confirmed: 18, total: 21 },
      criticalWork: { confirmed: 12, total: 15 },
      criticalPersonal: { confirmed: 6, total: 6 },
      rumor: { confirmed: 0, total: 35 },
      singleSource: { confirmed: 0, total: 371 },
    });
    expect(relabelled).toMatchObject({
      critical: { confirmed: 10, total: 10 },
      criticalWork: { confirmed: 4, total: 4 },
      criticalPersonal: { confirmed: 6, total: 6 },
      rumor: { confirmed: 0, total: 34 },
      singleSource: { confirmed: 0, total: 371 },
    });
  });
});
