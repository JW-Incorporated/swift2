import { describe, expect, it } from 'vitest';

import {
  composeFallback,
  FALLBACK_EMPTY,
  FALLBACK_INTRO_CHIP,
  FALLBACK_INTRO_DEGRADED,
  FALLBACK_OUTRO,
  type RetrievedItem,
} from './clown-fallback';

const CONFIRMED: RetrievedItem = {
  id: 'lore:masters-buyback',
  headline: 'She bought her masters back',
  detail: 'On 30 May 2025 Taylor announced she had purchased the master recordings of her first six albums.',
  status: 'confirmed',
  date: '2025-05-30',
  sources: [{ name: 'taylorswift.com', url: 'https://www.taylorswift.com' }],
};

const RUMOR: RetrievedItem = {
  id: 'rumor:debut-tv',
  headline: 'The debut re-record is finished',
  detail: 'Fans read her May 2025 wording as implying only one re-record remains.',
  status: 'rumor',
  date: '2026-08-01',
  sources: [{ name: 'Some Outlet', url: 'https://example.com/debut' }],
};

const DEBUNKED: RetrievedItem = {
  id: 'theory:example-debunked',
  headline: 'A theory that did not survive contact with reality',
  detail: 'It was widely believed, then it was not true.',
  status: 'debunked',
  date: '2026-01-01',
  sources: [],
};

describe('composeFallback', () => {
  it('is deterministic: same items + reason in, same output out', () => {
    const a = composeFallback([CONFIRMED, RUMOR], 'degraded');
    const b = composeFallback([CONFIRMED, RUMOR], 'degraded');
    expect(a).toEqual(b);
  });

  it('never asserts an unresolved (rumor/reported) item as settled fact', () => {
    const { text } = composeFallback([RUMOR], 'degraded');
    expect(text).toContain('Rumor only, not confirmed: The debut re-record is finished');
    expect(text).not.toMatch(/^Confirmed:/m);
  });

  it('states a confirmed item plainly, as a resolved fact', () => {
    const { text } = composeFallback([CONFIRMED], 'degraded');
    expect(text).toContain('Confirmed: She bought her masters back');
  });

  it('states a debunked item plainly and copes with zero sources', () => {
    const { text } = composeFallback([DEBUNKED], 'degraded');
    expect(text).toContain('Debunked: A theory that did not survive contact with reality');
    expect(text).toContain('(2026-01-01)');
  });

  it('shares the same fixed outro on both paths', () => {
    const chip = composeFallback([CONFIRMED], 'chip');
    const degraded = composeFallback([CONFIRMED], 'degraded');
    expect(chip.text.endsWith(FALLBACK_OUTRO)).toBe(true);
    expect(degraded.text.endsWith(FALLBACK_OUTRO)).toBe(true);
  });

  it('returns the in-character empty-shelf line when nothing was retrieved, never nothing at all', () => {
    const { text, items } = composeFallback([], 'chip');
    expect(text).toBe(FALLBACK_EMPTY);
    expect(items).toEqual([]);
  });

  it('carries the retrieved items through unmodified, for the UI to render as source cards', () => {
    const { items } = composeFallback([CONFIRMED, DEBUNKED], 'degraded');
    expect(items).toEqual([CONFIRMED, DEBUNKED]);
  });

  it('makes zero model calls: composeFallback is a synchronous pure function', () => {
    const result = composeFallback([CONFIRMED], 'chip');
    expect(result).not.toBeInstanceOf(Promise);
  });

  describe('reason: chip (a column tap — the model was never going to run)', () => {
    it('uses the deliberate chip intro and never the degraded/outage wording', () => {
      const { text } = composeFallback([CONFIRMED], 'chip');
      expect(text.startsWith(FALLBACK_INTRO_CHIP)).toBe(true);
      expect(text).not.toContain('No model on deck');
      expect(text).not.toContain(FALLBACK_INTRO_DEGRADED);
    });
  });

  describe('reason: degraded (cap exhausted, no key, model down, kill switch)', () => {
    it('uses the degraded intro, admitting the model was supposed to run', () => {
      const { text } = composeFallback([CONFIRMED], 'degraded');
      expect(text.startsWith(FALLBACK_INTRO_DEGRADED)).toBe(true);
      expect(text).toContain('No model on deck');
      expect(text).not.toContain(FALLBACK_INTRO_CHIP);
    });
  });
});
