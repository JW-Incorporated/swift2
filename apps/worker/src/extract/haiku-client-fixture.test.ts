import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import { extractWithLLM } from './haiku-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

const ARTICLE =
  'Taylor announced during a livestream on Tuesday that her new single, "Evermore Skies," will release ' +
  'on November 14, tying the date to the fifth anniversary of the Evermore era. She said the song was ' +
  'written in the same creative stretch as that album but was left off the original tracklist. The ' +
  'announcement followed weeks of cryptic countdown posts on her official Instagram since early October.';
const SUMMARY =
  'Taylor announced a new single, "Evermore Skies," releasing November 14 — the fifth anniversary of the ' +
  'Evermore era. Fans have been decoding cryptic countdown posts on her Instagram since early October.';
const DETAIL =
  'During a livestream on Tuesday, Taylor revealed that "Evermore Skies" will arrive November 14, deliberately ' +
  'timed to the fifth anniversary of the Evermore era. She explained the song came from the same writing stretch ' +
  'as that album but did not make the original tracklist, giving longtime fans a new piece of an era they already ' +
  'know well. The reveal capped weeks of cryptic countdown posts on her official Instagram, which fans had been ' +
  'picking apart since early October trying to guess what was coming.';

function usageDb(): UsageDb {
  return { todaysCallCount: async () => 0, incrementToday: async () => undefined };
}

function fakeClaude() {
  return vi.fn().mockResolvedValue({
    status: 'ok',
    data: {
      kind: 'current_item',
      redline_flags: [],
      current_item: {
        observed_on: '2026-10-12',
        category: 'release',
        headline: 'Taylor announces "Evermore Skies," out November 14',
        summary: SUMMARY,
        detail: DETAIL,
        status_hint: 'confirmed',
        tags: ['evermore'],
        symbols: [],
        entities: [],
      },
    },
  }) as WorkerClaudeCaller;
}

async function extractFixture() {
  vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
  const usage = await ExtractUsageStore.create(usageDb());
  return extractWithLLM(usage, {
    items: [{ title: 't', snippet: 's' }],
    symbolLexiconKeys: [],
    eraId: 'tloas',
    today: '2026-10-12',
    articleTexts: [{ url: 'https://variety.com/evermore-skies', text: ARTICLE }],
  }, fakeClaude());
}

afterEach(() => vi.unstubAllEnvs());

describe('grounded extraction fixture', () => {
  it('keeps the summary above the two-sentence copy floor', async () => {
    const summary = (await extractFixture())?.currentItem?.summary ?? '';
    expect(summary.length).toBeGreaterThanOrEqual(160);
    expect((summary.match(/[.!?](\s|$)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('keeps detail within the 60-150 word range', async () => {
    const detail = (await extractFixture())?.currentItem?.detail ?? '';
    const words = detail.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(60);
    expect(words).toBeLessThanOrEqual(150);
  });

  it('does not add concrete facts absent from the fake wrapper response', async () => {
    const item = (await extractFixture())?.currentItem;
    const combined = `${item?.summary ?? ''} ${item?.detail ?? ''}`;
    expect(combined).toContain('Evermore Skies');
    expect(combined).toContain('November 14');
    expect(combined).not.toContain('platinum');
    expect(combined).not.toContain('world tour');
  });
});
