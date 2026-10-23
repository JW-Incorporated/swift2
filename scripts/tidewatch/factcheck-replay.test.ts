import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateForcedCriticalControls, evaluateReplay } from './factcheck-eval.mjs';
import { relabelItem, relabelReplay } from './relabel-replay.mjs';

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
    expect(generated.report.countsByRule).toEqual(committedReport.countsByRule);
    expect(committedRelabel.items.every((item: Record<string, unknown>) =>
      Object.keys(item).sort().join(',') === 'class,id')).toBe(true);
  });

  it('relabels from title semantics without source status and leaves blank titles alone', () => {
    const released = {
      kind: 'news_story', class: 'critical_breaking',
      title: 'Taylor Swift releases four new songs',
      meta: { verificationStatus: 'rumor' }, answers: { q_official: false },
    };
    expect(relabelItem(released)).toEqual({ class: 'critical_breaking', rule: null });
    expect(relabelItem({ ...released, meta: { verificationStatus: 'official' } }))
      .toEqual({ class: 'critical_breaking', rule: null });
    expect(relabelItem({ ...released, title: 'New album available for pre-order' }).class)
      .toBe('official_drop');
    expect(relabelItem({ ...released, title: 'Official festival headline announced' }).class)
      .toBe('official_drop');
    expect(relabelItem({ ...released, title: 'Taylor Swift announces a new concert film' }).class)
      .toBe('critical_breaking');
    expect(relabelItem({ ...released, title: undefined }).class).toBe('critical_breaking');
  });

  it("moves only stories about Taylor Swift's real estate to the privacy redline", () => {
    const item = { kind: 'news_story', class: 'normal_news' };
    expect(relabelItem({ ...item, title: "Taylor Swift's former home is listed" }).class)
      .toBe('privacy_redline');
    expect(relabelItem({
      ...item, title: "R.I. Property Owners Sue Over Controversial 'Taylor Swift Tax'",
    }).class).toBe('normal_news');
    expect(relabelItem({ ...item, title: "Travis Kelce's homes include proposal location" }).class)
      .toBe('normal_news');
    expect(relabelItem({
      ...item, title: "Taylor Swift explains home in 'Patient Zero' music video",
    }).class).toBe('normal_news');
    expect(relabelItem({
      ...item, title: "Taylor Swift's 'Patient Zero' house sold for nearly $47 million",
    }).class).toBe('normal_news');
  });

  it('reports both label sets and confirms no forced-critical control', async () => {
    const original = await evaluateReplay(replay);
    const relabelled = await evaluateReplay(replay, committedRelabel);
    const forcedCriticalControls = await evaluateForcedCriticalControls(replay);
    expect({ original, relabelled, forcedCriticalControls }).toEqual({
      original: committedResults.original,
      relabelled: committedResults.relabelled,
      forcedCriticalControls: committedResults.forcedCriticalControls,
    });

    expect(original).toMatchObject({
      critical: { confirmed: 23, total: 24 },
      criticalWork: { confirmed: 17, total: 18 },
      criticalPersonal: { confirmed: 6, total: 6 },
      rumor: { confirmed: 0, total: 33 },
      singleSource: { confirmed: 1, total: 371 },
    });
    expect(relabelled).toMatchObject({
      critical: { confirmed: 17, total: 18 },
      criticalWork: { confirmed: 11, total: 12 },
      criticalPersonal: { confirmed: 6, total: 6 },
      rumor: { confirmed: 0, total: 33 },
      singleSource: { confirmed: 1, total: 371 },
    });
    expect(forcedCriticalControls).toMatchObject({
      total: { confirmed: 0 },
      rumor: { confirmed: 0, total: 33 },
      singleSource: { confirmed: 0, total: 371 },
    });
  });
});
