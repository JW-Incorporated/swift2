import { describe, expect, it, vi } from 'vitest';
import { getEra, setTracksRawProvider, trackKey } from '@swift2/experience';

const item = {
  id: 'interrupted-speech',
  eraId: 'fearless',
  title: 'The interrupted speech',
  dateLabel: 'September 2009',
  summary: 'A defining public turning point.',
};
const track = { title: 'Fearless', note: 'A rushing first-love anthem.', trackNumber: 1 };

vi.mock('./content', () => ({ getContentItem: (id: string) => (id === item.id ? item : undefined) }));

import { sharePayloadForTarget } from './share-payload';

const baseUrl = 'https://www.longlivets.com/';

setTracksRawProvider({ fearless: [track] });

describe('sharePayloadForTarget', () => {
  it('keeps a moment share target specific and canonical', () => {
    expect(sharePayloadForTarget({ kind: 'item', itemId: item.id }, baseUrl)).toEqual({
      title: 'The interrupted speech — Fearless · Long Live',
      text: 'The interrupted speech (Fearless, September 2009) — A defining public turning point.',
      url: 'https://www.longlivets.com?item=interrupted-speech',
    });
  });

  it('keeps an era share target specific and canonical', () => {
    const era = getEra('fearless');

    expect(sharePayloadForTarget({ kind: 'era', eraId: era.id }, baseUrl)).toEqual({
      title: `${era.name} — Long Live`,
      text: `${era.name} (${era.yearLabel}) — ${era.tagline} Explore it on Long Live.`,
      url: 'https://www.longlivets.com?era=fearless',
    });
  });

  it('keeps a track share target specific and canonical', () => {
    const key = trackKey('fearless', track);

    expect(sharePayloadForTarget({ kind: 'track', eraId: 'fearless', trackKey: key }, baseUrl)).toEqual({
      title: 'Fearless — Fearless · Long Live',
      text: 'Fearless (Fearless) — A rushing first-love anthem.',
      url: `https://www.longlivets.com?song=${encodeURIComponent(key)}`,
    });
  });
});
