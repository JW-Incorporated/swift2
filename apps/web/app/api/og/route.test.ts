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

vi.mock('../../../lib/longlive/vault-wiring', () => ({}));
vi.mock('@/lib/longlive/content', () => ({ getContentItem: (id: string) => (id === item.id ? item : undefined) }));

import { DEFAULT_OG_COPY } from '@/lib/longlive/og-card';
import { GET, ogCopyForRequest } from './route';

const request = (query: string) => new URL(`https://www.longlivets.com/api/og?${query}`);

setTracksRawProvider({ fearless: [track] });

describe('GET /api/og', () => {
  function get(qs: string): Response {
    return GET(new Request(`http://localhost/api/og${qs}`) as never);
  }

  it('renders a PNG for a recognized lens id', async () => {
    const res = await get('?lens=hidden-clues');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('renders a PNG for each of the six thread lenses', async () => {
    for (const id of ['the-proposal', 'love-story', 'fashion', 'taylors-version', 'easter-eggs', 'hidden-clues']) {
      expect(get(`?lens=${id}`).status).toBe(200);
    }
  });

  it('renders a PNG for the mood and clownbot feature modes', async () => {
    for (const mode of ['mood', 'clownbot']) {
      expect(get(`?mode=${mode}`).status).toBe(200);
    }
  });

  it('falls back to the generic card for inherited-property mode names, never 500s', async () => {
    for (const mode of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(get(`?mode=${mode}`).status).toBe(200);
    }
  });
});

describe('ogCopyForRequest', () => {
  it('uses moment-specific metadata', () => {
    expect(ogCopyForRequest(request('item=interrupted-speech'))).toMatchObject({
      title: 'The interrupted speech',
      subtitle: 'A defining public turning point.',
    });
  });

  it('uses era-specific metadata', () => {
    const era = getEra('fearless');
    expect(ogCopyForRequest(request('era=fearless'))).toMatchObject({ title: era.name, subtitle: era.tagline });
  });

  it('uses song-specific metadata', () => {
    expect(ogCopyForRequest(request(`song=${encodeURIComponent(trackKey('fearless', track))}`))).toMatchObject({
      title: 'Fearless',
      subtitle: 'A rushing first-love anthem.',
    });
  });

  it('uses guide and theories metadata', () => {
    const era = getEra('fearless');
    expect(ogCopyForRequest(request('guide=fearless'))).toMatchObject({ title: era.album });
    expect(ogCopyForRequest(request('theories=fearless'))).toMatchObject({ title: `${era.shortName} decoded` });
  });

  it('falls back to the generic card for an invalid target', () => {
    expect(ogCopyForRequest(request('era=not-an-era'))).toEqual(DEFAULT_OG_COPY);
  });
});
