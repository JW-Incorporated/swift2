import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { mergeNewFactsIntoOriginal } from './write-knowledge';

const ORIGINAL = {
  headline: 'New single announced',
  summary:
    'Taylor announced a new single today during a surprise livestream event watched by millions. Fans immediately began speculating about which upcoming album the single belongs to.',
  detail:
    'The announcement came via her official Instagram account, posted shortly after midnight with a cryptic caption that fans quickly decoded using the same numerology and color-language techniques that have accompanied past album rollouts, drawing on nearly a decade of precedent across multiple prior eras, and echoing the exact visual motifs fans had already flagged earlier in the week as likely hints.',
  sources: [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' as const }],
  imageUrl: 'https://www.people.com/photo.jpg',
};

describe('mergeNewFactsIntoOriginal retraction guard', () => {
  it('merges facts without changing visibility on a retracted card', async () => {
    const card: Record<string, unknown> = {
      id: 'item-orig',
      status: 'reported',
      retracted_at: '2026-10-15T00:00:00Z',
      redline_ok: false,
    };
    let patch: Record<string, unknown> = {};
    const predicates: Array<(row: Record<string, unknown>) => boolean> = [];
    const query = {
      update: (row: Record<string, unknown>) => {
        patch = row;
        return query;
      },
      eq: (column: string, value: unknown) => {
        predicates.push((row) => row[column] === value);
        return query;
      },
      is: (column: string, value: unknown) => {
        predicates.push((row) => row[column] === value);
        return query;
      },
      then: (resolve: (result: { error: null }) => void) => {
        if (predicates.every((predicate) => predicate(card))) Object.assign(card, patch);
        resolve({ error: null });
      },
    };
    const db = { from: () => query } as unknown as SupabaseClient;

    await mergeNewFactsIntoOriginal(db, 'item-orig', ORIGINAL, {
      duplicateSources: [{ outletName: 'Variety', url: 'https://variety.com/y', tier: 'established' }],
      duplicateImageUrl: null,
    });

    expect(patch.redline_ok).toBe(true);
    expect(card).toMatchObject({ status: 'reported', redline_ok: false, heat: 2 });
    expect(card.sources).toHaveLength(2);
  });
});
