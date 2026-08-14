import { describe, expect, it } from 'vitest';

import { detectRecencyIntent, retrieveClownDocs } from './clown-retrieve';
import type { ClownDoc } from './clown-index';

function doc(overrides: Partial<ClownDoc>): ClownDoc {
  return {
    id: 'doc-default',
    kind: 'lore',
    title: 'Default title',
    text: 'Default title default body text.',
    date: null,
    recencyDate: null,
    open: false,
    status: 'confirmed',
    sources: [],
    eraId: null,
    ...overrides,
  };
}

describe('detectRecencyIntent', () => {
  it('recognises "this week"/"lately"/"right now" style phrasing', () => {
    expect(detectRecencyIntent('what are we clowning on this week')).toBe(true);
    expect(detectRecencyIntent('what has been happening lately')).toBe(true);
    expect(detectRecencyIntent('what is going on right now')).toBe(true);
    expect(detectRecencyIntent('give me the latest on the sourdough theory')).toBe(false);
  });

  it('is case- and punctuation-insensitive', () => {
    expect(detectRecencyIntent("What's new THIS WEEK?!")).toBe(true);
  });
});

describe('retrieveClownDocs — plain relevance', () => {
  const CORPUS: ClownDoc[] = [
    doc({
      id: 'theory:era:sourdough',
      title: 'The Sourdough Fiasco',
      text: 'The Sourdough Fiasco theory claims a bread reference is a clue.',
    }),
    doc({
      id: 'moment:polaroid',
      kind: 'moment',
      title: 'The cropped Polaroid cover',
      text: 'The 1989 cover is a real cropped Polaroid, eyes cut off on purpose.',
    }),
    doc({
      id: 'lore:unrelated',
      title: 'Totally unrelated lore item',
      text: 'Nothing to do with the query terms at all.',
    }),
  ];

  it('ranks a title match above a body-only match', () => {
    const results = retrieveClownDocs('tell me about the sourdough fiasco', CORPUS, {
      now: new Date('2026-08-13'),
    });
    expect(results[0]?.id).toBe('theory:era:sourdough');
  });

  it('returns an honest empty array when nothing clears the relevance threshold', () => {
    const results = retrieveClownDocs('completely unmatched gibberish zzz', CORPUS, {
      now: new Date('2026-08-13'),
    });
    expect(results).toEqual([]);
  });

  it('never returns a doc unrelated to the query terms', () => {
    const results = retrieveClownDocs('polaroid cover cropped', CORPUS, { now: new Date('2026-08-13') });
    expect(results.map((r) => r.id)).not.toContain('lore:unrelated');
  });
});

describe('retrieveClownDocs — recency intent', () => {
  const NOW = new Date('2026-08-13T00:00:00.000Z');

  const CORPUS: ClownDoc[] = [
    doc({
      id: 'rumor:fresh-1',
      kind: 'rumor',
      title: 'A fresh open rumor',
      text: 'Reported two days ago, still unconfirmed.',
      open: true,
      recencyDate: '2026-08-11',
    }),
    doc({
      id: 'rumor:fresher',
      kind: 'rumor',
      title: 'An even fresher open rumor',
      text: 'Reported yesterday, still unconfirmed.',
      open: true,
      recencyDate: '2026-08-12',
    }),
    doc({
      id: 'theory:undated-pending',
      kind: 'theory',
      title: 'An undated pending theory',
      text: 'No date at all, still pending.',
      open: true,
      recencyDate: null,
    }),
    doc({
      id: 'lore:old-confirmed',
      kind: 'lore',
      title: 'An old confirmed fact',
      text: 'Long settled, not open, not relevant to a recency query.',
      open: false,
      recencyDate: '2020-01-01',
    }),
  ];

  it('ranks open, fresher-first, ahead of undated open material, and never surfaces closed docs', () => {
    const results = retrieveClownDocs('what are we clowning on this week', CORPUS, { now: NOW });
    expect(results.map((r) => r.id)).toEqual(['rumor:fresher', 'rumor:fresh-1', 'theory:undated-pending']);
  });

  it('degrades to an honest empty/short result rather than reaching for unrelated material', () => {
    const noOpenDocs: ClownDoc[] = [
      doc({ id: 'lore:closed-1', open: false, recencyDate: '2026-08-01' }),
      doc({ id: 'moment:closed-2', kind: 'moment', open: false, recencyDate: '2026-08-05' }),
    ];
    const results = retrieveClownDocs('what is happening right now', noOpenDocs, { now: NOW });
    expect(results).toEqual([]);
  });

  it('falls through to relevance ranking when recency intent finds nothing open, for a specific query', () => {
    const mixed: ClownDoc[] = [
      ...CORPUS.filter((d) => !d.open),
      doc({
        id: 'theory:sourdough-closed',
        title: 'The Sourdough Fiasco',
        text: 'The Sourdough Fiasco is now a confirmed theory, no longer open.',
        open: false,
      }),
    ];
    const results = retrieveClownDocs('sourdough fiasco this week', mixed, { now: NOW });
    expect(results.map((r) => r.id)).toContain('theory:sourdough-closed');
  });

  it('respects a fourteen-day freshness window: a stale-dated open rumor does not outrank an in-window one', () => {
    const staleCorpus: ClownDoc[] = [
      doc({
        id: 'rumor:in-window',
        kind: 'rumor',
        title: 'An in-window open rumor',
        open: true,
        recencyDate: '2026-08-10',
      }),
      doc({
        id: 'rumor:stale',
        kind: 'rumor',
        title: 'A stale open rumor',
        open: true,
        recencyDate: '2026-01-01',
      }),
    ];
    const results = retrieveClownDocs('this week', staleCorpus, { now: NOW });
    expect(results.map((r) => r.id)).toEqual(['rumor:in-window', 'rumor:stale']);
  });
});

describe('retrieveClownDocs — determinism', () => {
  it('same corpus + same query + same now => same results, same order, every time', () => {
    const now = new Date('2026-08-13T12:00:00.000Z');
    const corpus: ClownDoc[] = [
      doc({ id: 'b', title: 'Debutation theory', text: 'Debutation theory about a re-record.' }),
      doc({ id: 'a', title: 'Debutation extra', text: 'Debutation extra receipt about a re-record.' }),
      doc({
        id: 'c',
        kind: 'rumor',
        title: 'Open rumor about debutation',
        text: 'A rumor about debutation.',
        open: true,
        recencyDate: '2026-08-12',
      }),
    ];

    const runs = Array.from({ length: 5 }, () =>
      retrieveClownDocs('debutation', corpus, { now }).map((d) => d.id),
    );
    for (const run of runs) {
      expect(run).toEqual(runs[0]);
    }
  });

  it('is order-independent in the input corpus (ties break on id)', () => {
    const now = new Date('2026-08-13T12:00:00.000Z');
    const forward: ClownDoc[] = [
      doc({ id: 'x', title: 'Matching title term', text: 'Matching title term body.' }),
      doc({ id: 'y', title: 'Matching title term', text: 'Matching title term body.' }),
    ];
    const reversed = [...forward].reverse();

    const fromForward = retrieveClownDocs('matching title term', forward, { now }).map((d) => d.id);
    const fromReversed = retrieveClownDocs('matching title term', reversed, { now }).map((d) => d.id);
    expect(fromForward).toEqual(fromReversed);
  });
});
