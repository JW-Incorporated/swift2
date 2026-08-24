import { describe, expect, it } from 'vitest';
import {
  mapCurrentItem,
  mapEggLedgerEntry,
  mapFanSignal,
  mapKnowledgeDoc,
  mapLiveTheory,
  mapSymbolLexiconEntry,
  mapTechnique,
} from './current-map';

describe('Current-tier row mappers', () => {
  it('maps a current_item row to camelCase', () => {
    const item = mapCurrentItem({
      id: 'ci1',
      story_id: null,
      observed_on: '2026-08-23',
      era_id: 'life-of-a-showgirl',
      category: 'sighting',
      tags: ['spotted'],
      headline: 'Seen leaving rehearsal',
      summary: 'Fans spotted her leaving the venue.',
      detail: 'Photos circulated on fan accounts.',
      status: 'reported',
      confidence: 'reputable_reporting',
      source_tier: 'established',
      sources: [{ name: 'People', url: 'https://people.com/x', tier: 'established' }],
      location_level: 'city',
      image_url: null,
      social_post: null,
      symbols: ['13'],
      entities: ['Taylor Swift'],
      heat: 4.2,
      promoted_to: null,
      last_checked_on: '2026-08-23',
      expires_at: '2026-11-21T00:00:00.000Z',
      redline_ok: true,
    });
    expect(item.storyId).toBeUndefined();
    expect(item.category).toBe('sighting');
    expect(item.sources).toEqual([{ name: 'People', url: 'https://people.com/x', tier: 'established' }]);
    expect(item.locationLevel).toBe('city');
    expect(item.imageUrl).toBeUndefined();
    expect(item.symbols).toEqual(['13']);
    expect(item.redlineOk).toBe(true);
  });

  it('maps a fan_signal row', () => {
    const signal = mapFanSignal({
      id: 'fs1',
      window_start: '2026-08-22T00:00:00.000Z',
      window_end: '2026-08-23T00:00:00.000Z',
      platform: 'bluesky',
      community: 'bluesky:general',
      topic: 'a popular thread about the setlist',
      summary: 'dozens of posts speculating about the setlist',
      volume: 42,
      heat: 3.1,
      stance_mix: { excited: 30, skeptical: 12 },
      symbols: ['13'],
      theory_ids: [],
      current_item_ids: ['ci1'],
      sample_urls: ['https://bsky.app/x'],
      expires_at: '2026-09-22T00:00:00.000Z',
      redline_ok: true,
    });
    expect(signal.platform).toBe('bluesky');
    expect(signal.currentItemIds).toEqual(['ci1']);
    expect(signal.stanceMix).toEqual({ excited: 30, skeptical: 12 });
  });

  it('maps a live_theory row, including resolution when complete', () => {
    const theory = mapLiveTheory({
      id: 'lt1',
      name: 'Track 5 math',
      claim: 'Track five continues the pattern.',
      first_seen_on: '2026-08-20',
      last_seen_on: '2026-08-23',
      origin: 'fan',
      status: 'rumor',
      outcome: 'pending',
      evidence_ids: ['current:ci1'],
      symbols: ['13'],
      heat: 5,
      resolution: null,
      promoted_to: null,
      expires_at: '2026-10-22T00:00:00.000Z',
    });
    expect(theory.resolution).toBeUndefined();
    expect(theory.outcome).toBe('pending');

    const resolved = mapLiveTheory({
      id: 'lt2',
      name: 'Track 5 math',
      claim: 'Track five continues the pattern.',
      first_seen_on: '2026-08-20',
      last_seen_on: '2026-08-23',
      origin: 'fan',
      status: 'confirmed',
      outcome: 'confirmed',
      evidence_ids: [],
      symbols: [],
      heat: 5,
      resolution: { on: '2026-08-23', url: 'https://x.com', outlet: 'Official', note: 'confirmed' },
      promoted_to: null,
      expires_at: '2026-10-22T00:00:00.000Z',
    });
    expect(resolved.resolution).toEqual({
      on: '2026-08-23',
      url: 'https://x.com',
      outlet: 'Official',
      note: 'confirmed',
    });
  });

  it('maps an egg_ledger row', () => {
    const entry = mapEggLedgerEntry({
      id: 'egg1',
      hint_doc_id: 'moment:1',
      reveal_doc_id: 'moment:2',
      hint_date: '2026-01-01',
      reveal_date: '2026-01-15',
      lag_days: 14,
      mechanism: 'numerology',
      symbols: ['13'],
      era_id: 'lover',
      confirmed: true,
      outcome: 'confirmed',
      summary: 'A confirmed precedent.',
      sources: [],
    });
    expect(entry.lagDays).toBe(14);
    expect(entry.mechanism).toBe('numerology');
  });

  it('maps a symbol_lexicon row', () => {
    const symbol = mapSymbolLexiconEntry({
      key: '13',
      label: 'Lucky 13',
      aliases: ['thirteen'],
      category: 'number',
      linked_eras: ['1989'],
      note: 'Her lucky number.',
    });
    expect(symbol.aliases).toEqual(['thirteen']);
  });

  it('maps a technique row', () => {
    const technique = mapTechnique({
      key: 'numerology',
      label: 'Numerology',
      description: 'Recurring number motifs.',
      reliability: 'signature',
      recurrence_test: 'A number recurs across at least 2 grounded examples.',
      example_ids: ['moment:1', 'moment:2'],
      linked_symbols: ['13'],
      sources: [],
    });
    expect(technique.reliability).toBe('signature');
    expect(technique.exampleIds).toHaveLength(2);
  });

  it('maps a knowledge_doc row', () => {
    const doc = mapKnowledgeDoc({
      id: 'current:ci1',
      kind: 'current_item',
      tier: 'current',
      title: 'Seen leaving rehearsal',
      text: 'Fans spotted her leaving the venue.',
      date: '2026-08-23',
      recency_date: '2026-08-23',
      open: false,
      status: 'reported',
      source_tier: 'established',
      sources: [],
      era_id: 'life-of-a-showgirl',
      symbols: ['13'],
      entities: ['Taylor Swift'],
      expires_at: '2026-11-21T00:00:00.000Z',
      redline_ok: true,
    });
    expect(doc.tier).toBe('current');
    expect(doc.kind).toBe('current_item');
  });
});
