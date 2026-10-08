import { describe, expect, it } from 'vitest';
import {
  normalizeLoreItem,
  buildLore,
  renderModule,
} from './sync-clownbot-lore.mjs';

// Clownbot lore's generator (Fable ruling FR-t_2745eb60-1, #3515): pure
// normalization, tested here so the "no source, no ship" rule and the seed
// -> generated-file shape can't regress silently. Mirrors
// sync-longlive-era-secrets.test.ts's structure.

describe('normalizeLoreItem', () => {
  const good = {
    id: 'masters-buyback',
    status: 'confirmed',
    date: '2025-05-30',
    lastCheckedOn: '2026-08-11',
    headline: 'She bought her masters back',
    detail: 'On 30 May 2025 Taylor announced she had purchased her masters.',
    sources: [{ name: 'Billboard', url: 'https://example.com/a' }],
    prompts: ['Take a side.'],
    tags: ['business'],
    evergreen: true,
  };

  it('normalizes a well-formed item', () => {
    const out = normalizeLoreItem(good);
    expect(out).toMatchObject({
      id: 'masters-buyback',
      status: 'confirmed',
      date: '2025-05-30',
      lastCheckedOn: '2026-08-11',
      headline: good.headline,
      detail: good.detail,
      evergreen: true,
    });
    expect(out.sources).toEqual([{ name: 'Billboard', url: 'https://example.com/a' }]);
    expect(out.prompts).toEqual(['Take a side.']);
    expect(out.tags).toEqual(['business']);
  });

  it('drops an item with no real https source (never ships an unsourced claim)', () => {
    expect(normalizeLoreItem({ ...good, sources: [] })).toBeNull();
    expect(normalizeLoreItem({ ...good, sources: [{ name: 'x', url: 'http://insecure' }] })).toBeNull();
    expect(normalizeLoreItem({ ...good, sources: [{ name: '', url: 'https://x' }] })).toBeNull();
  });

  it('drops an item missing id, headline, or detail', () => {
    expect(normalizeLoreItem({ ...good, id: '  ' })).toBeNull();
    expect(normalizeLoreItem({ ...good, headline: '' })).toBeNull();
    expect(normalizeLoreItem({ ...good, detail: undefined })).toBeNull();
  });

  it('drops an item with an unknown status', () => {
    expect(normalizeLoreItem({ ...good, status: 'trending' })).toBeNull();
  });

  it('drops an item with a malformed date', () => {
    expect(normalizeLoreItem({ ...good, date: '5/30/2025' })).toBeNull();
    expect(normalizeLoreItem({ ...good, lastCheckedOn: 'unknown' })).toBeNull();
  });

  it('normalizes a valid ledger and drops a malformed one', () => {
    const withLedger = normalizeLoreItem({
      ...good,
      ledger: { theory: 'X headlined', verdict: 'clowned', on: '2026-02-08' },
    });
    expect(withLedger.ledger).toEqual({
      theory: 'X headlined',
      verdict: 'clowned',
      on: '2026-02-08',
    });

    const badLedger = normalizeLoreItem({
      ...good,
      ledger: { theory: 'X', verdict: 'maybe', on: '2026-02-08' },
    });
    expect(badLedger.ledger).toBeUndefined();
  });

  it('omits optional fields entirely when absent rather than emitting empty arrays', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prompts, tags, ledger, evergreen, ...minimal } = good;
    const out = normalizeLoreItem(minimal);
    expect(out.prompts).toBeUndefined();
    expect(out.tags).toBeUndefined();
    expect(out.ledger).toBeUndefined();
    expect(out.evergreen).toBeUndefined();
  });
});

describe('buildLore', () => {
  const src = [{ name: 'N', url: 'https://example.com/s' }];
  const item = (id, extra = {}) => ({
    id,
    status: 'reported',
    date: '2026-08-01',
    lastCheckedOn: '2026-08-01',
    headline: 'Headline',
    detail: 'Detail text here.',
    sources: src,
    ...extra,
  });

  it('de-dupes by id (first wins)', () => {
    const { items } = buildLore({
      updatedOn: '2026-08-31',
      items: [item('a', { headline: 'First' }), item('a', { headline: 'Second' })],
    });
    expect(items).toHaveLength(1);
    expect(items[0].headline).toBe('First');
  });

  it('drops unrenderable items rather than throwing', () => {
    const { items } = buildLore({
      updatedOn: '2026-08-31',
      items: [item('a'), { id: 'bad' }],
    });
    expect(items).toHaveLength(1);
  });

  it('falls back to a real ISO date when updatedOn is missing/malformed', () => {
    const { updatedOn } = buildLore({ updatedOn: 'not-a-date', items: [] });
    expect(updatedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps a well-formed updatedOn as-is', () => {
    const { updatedOn } = buildLore({ updatedOn: '2026-08-31', items: [] });
    expect(updatedOn).toBe('2026-08-31');
  });
});

describe('renderModule', () => {
  it('emits a valid, importable TS module with the expected exports', () => {
    const ts = renderModule({
      updatedOn: '2026-08-31',
      items: [
        {
          id: 'a',
          status: 'confirmed',
          date: '2026-08-01',
          lastCheckedOn: '2026-08-01',
          headline: 'H',
          detail: 'D',
          sources: [{ name: 'N', url: 'https://u' }],
        },
      ],
    });
    expect(ts).toContain("import type { LoreItem } from '@swift2/experience';");
    expect(ts).toContain('export const LORE_UPDATED_ON = "2026-08-31";');
    expect(ts).toContain('export const LORE_RAW: LoreItem[] = [');
    expect(ts).toContain('sources: [{ name: "N", url: "https://u" }],');
  });
});
