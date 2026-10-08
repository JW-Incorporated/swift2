import { describe, expect, it } from 'vitest';
import {
  buildEggLedgerRow,
  buildMomentDoc,
  buildTheoryDoc,
  buildTrackDoc,
  hintDateFrom,
  mechanismFrom,
  sourceTierFrom,
} from './knowledge-rows.mjs';

const lexicon = [{ key: 'heartbreak', label: 'heartbreak', aliases: [], category: 'theme', linked_eras: [], note: '' }];

describe('sourceTierFrom', () => {
  it('picks the highest tier among the sources present', () => {
    expect(sourceTierFrom([{ type: 'wiki' }, { type: 'official' }])).toBe('official');
    expect(sourceTierFrom([{ type: 'fan_forum' }])).toBe('fan');
  });

  it('defaults unscored/missing sources to established, never unverified', () => {
    expect(sourceTierFrom([])).toBe('established');
    expect(sourceTierFrom([{}])).toBe('established');
    expect(sourceTierFrom(undefined)).toBe('established');
  });
});

describe('buildMomentDoc', () => {
  const item = {
    id: 'vault-1989-example',
    title: 'An example moment',
    date: '2014-10-27',
    body: ['Full of heartbreak.'],
    sources: [{ name: 'Example', url: 'https://example.com', type: 'reputable_press' }],
  };

  it('projects a confirmed moment with the moment: id prefix', () => {
    const doc = buildMomentDoc(item, '1989', lexicon);
    expect(doc.id).toBe('moment:vault-1989-example');
    expect(doc.tier).toBe('vault');
    expect(doc.status).toBe('confirmed');
    expect(doc.open).toBe(false);
    expect(doc.redline_ok).toBe(true);
    expect(doc.symbols).toEqual(['heartbreak']);
  });

  it('flags status/open from an unresolved rumor', () => {
    const doc = buildMomentDoc({ ...item, rumors: [{ status: 'unconfirmed' }] }, '1989', lexicon);
    expect(doc.status).toBe('reported');
    expect(doc.open).toBe(true);
  });

  it('does not flag open for a resolved rumor', () => {
    const doc = buildMomentDoc({ ...item, rumors: [{ status: 'confirmed' }] }, '1989', lexicon);
    expect(doc.status).toBe('confirmed');
    expect(doc.open).toBe(false);
  });
});

describe('buildTrackDoc', () => {
  it('projects a track note with the track: id prefix, falling back to a slugified title', () => {
    const doc = buildTrackDoc(
      { title: 'A Song Title', note: 'A note about heartbreak.', sources: [{ type: 'official' }] },
      'debut',
      lexicon,
    );
    expect(doc.id).toBe('track:debut:a-song-title');
    expect(doc.status).toBe('confirmed');
    expect(doc.source_tier).toBe('official');
    expect(doc.symbols).toEqual(['heartbreak']);
  });
});

describe('buildTheoryDoc', () => {
  const base = { slug: 'example-egg', title: 'Example egg', claim: 'A heartbreak clue.', sources: [] };

  it('prefixes easter_egg theories with egg: and theories with theory:', () => {
    expect(buildTheoryDoc({ ...base, kind: 'easter_egg', outcome: 'confirmed' }, 'debut', lexicon).id).toBe(
      'egg:debut:example-egg',
    );
    expect(buildTheoryDoc({ ...base, kind: 'theory', outcome: 'pending' }, 'debut', lexicon).id).toBe(
      'theory:debut:example-egg',
    );
  });

  it('maps outcome to status/open per the documented mapping', () => {
    expect(buildTheoryDoc({ ...base, kind: 'theory', outcome: 'confirmed' }, 'debut', lexicon)).toMatchObject({
      status: 'confirmed',
      open: false,
    });
    expect(buildTheoryDoc({ ...base, kind: 'theory', outcome: 'pending' }, 'debut', lexicon)).toMatchObject({
      status: 'rumor',
      open: true,
    });
    expect(
      buildTheoryDoc({ ...base, kind: 'theory', outcome: 'partially_confirmed' }, 'debut', lexicon),
    ).toMatchObject({ status: 'reported', open: true });
    expect(buildTheoryDoc({ ...base, kind: 'theory', outcome: 'debunked' }, 'debut', lexicon)).toMatchObject({
      status: 'debunked',
      open: false,
    });
    expect(buildTheoryDoc({ ...base, kind: 'theory', outcome: 'abandoned' }, 'debut', lexicon)).toMatchObject({
      status: 'faded',
      open: false,
    });
  });
});

describe('mechanismFrom', () => {
  it('reads a mechanism keyword from the theory text, falling back to other', () => {
    expect(mechanismFrom('She wore a purple gown as a wardrobe clue.')).toBe('wardrobe');
    expect(mechanismFrom('The Google vault puzzle revealed the titles.')).toBe('website');
    expect(mechanismFrom('Nothing recognizable here at all.')).toBe('other');
  });
});

describe('hintDateFrom', () => {
  it('uses the earliest accessed_at across the raw sources', () => {
    expect(hintDateFrom([{ accessed_at: '2026-07-08' }, { accessed_at: '2026-01-01' }], '2000-01-01')).toBe(
      '2026-01-01',
    );
  });

  it('falls back to the era start date when no source has accessed_at', () => {
    expect(hintDateFrom([{}], '2014-10-27')).toBe('2014-10-27');
    expect(hintDateFrom([], '2014-10-27')).toBe('2014-10-27');
  });
});

describe('buildEggLedgerRow', () => {
  it('builds a row with confirmed=true and a self-referencing hint_doc_id', () => {
    const theory = { slug: 'example-egg', title: 'Example egg', claim: 'A vault puzzle clue.', outcome: 'confirmed', sources: [] };
    const row = buildEggLedgerRow(theory, [{ accessed_at: '2026-07-08' }], 'debut', '2006-10-24', lexicon);
    expect(row.id).toBe('egg:debut:example-egg');
    expect(row.hint_doc_id).toBe('egg:debut:example-egg');
    expect(row.reveal_doc_id).toBeNull();
    expect(row.hint_date).toBe('2026-07-08');
    expect(row.confirmed).toBe(true);
    expect(row.mechanism).toBe('website');
  });
});
