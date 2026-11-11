import { describe, expect, it } from 'vitest';
import { trackConfirmTierFields } from './track-confirm-tier.mjs';

const wiki = {
  source_type: 'wiki',
  source_url: 'https://en.wikipedia.org/wiki/X',
  publisher: 'Wikipedia',
};
const press = {
  source_type: 'press',
  source_url: 'https://example.com/x',
  publisher: 'Rolling Stone',
};

describe('trackConfirmTierFields', () => {
  it('warns on a wiki-only confirmed claim', () => {
    const row = { inspiration: 'Confirmed autobiography about her move.', sources: [wiki] };
    expect(trackConfirmTierFields(row)).toEqual(['inspiration']);
  });
  it('warns when there are no sources', () => {
    expect(trackConfirmTierFields({ note: 'She said it was about home.' })).toEqual(['note']);
  });
  it('does not warn when a press source is present', () => {
    const row = { inspiration: 'Confirmed autobiography.', sources: [wiki, press] };
    expect(trackConfirmTierFields(row)).toEqual([]);
  });
  it('does not warn on negated confirmations', () => {
    for (const t of [
      'An unconfirmed reading.',
      'She never confirmed it.',
      'Not confirmed by her.',
      "She hasn't confirmed this.",
    ]) {
      expect(trackConfirmTierFields({ summary: t, sources: [wiki] })).toEqual([]);
    }
  });
});
