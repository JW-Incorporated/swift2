import { describe, expect, it, vi } from 'vitest';
import { setTracksRawProvider, trackKey } from '@swift2/experience';

const item = { id: 'interrupted-speech' };
const track = { title: 'Fearless', note: 'A rushing first-love anthem.', trackNumber: 1 };

vi.mock('@/components/longlive/LongLive', () => ({ LongLive: () => null }));
vi.mock('@/lib/longlive/content', () => ({ getContentItem: (id: string) => (id === item.id ? item : undefined) }));

import { generateMetadata } from './page';

setTracksRawProvider({ fearless: [track] });

function searchParams(params: Record<string, string>) {
  return Promise.resolve(params);
}

const metadataFor = (params: Record<string, string>) => generateMetadata({ searchParams: searchParams(params) });

describe('generateMetadata (og:image selection)', () => {
  it('points at the lens card for a recognized lens', async () => {
    const meta = await metadataFor({ lens: 'hidden-clues' });
    expect(meta.openGraph?.images).toEqual(['/api/og?lens=hidden-clues']);
    expect(meta.twitter?.images).toEqual(['/api/og?lens=hidden-clues']);
  });

  it('points at the mode card for mood/clownbot', async () => {
    const meta = await metadataFor({ mode: 'clownbot' });
    expect(meta.openGraph?.images).toEqual(['/api/og?mode=clownbot']);
  });

  it('falls back to no override for an unrecognized lens with no mode', async () => {
    await expect(metadataFor({ lens: 'not-real' })).resolves.toEqual({});
  });

  it('falls back to no override for a bare homepage (no params)', async () => {
    await expect(metadataFor({})).resolves.toEqual({});
  });

  it('an invalid lens paired with a valid mode uses the mode, not the invalid lens', async () => {
    const meta = await metadataFor({ lens: 'not-real', mode: 'mood' });
    expect(meta.openGraph?.images).toEqual(['/api/og?mode=mood']);
  });

  it('a valid lens paired with an invalid mode uses the lens', async () => {
    const meta = await metadataFor({ lens: 'fashion', mode: 'not-real' });
    expect(meta.openGraph?.images).toEqual(['/api/og?lens=fashion']);
  });

  it('routes item, era, song, guide, and theories targets to their own cached OG cards', async () => {
    await expect(metadataFor({ item: item.id })).resolves.toMatchObject({ openGraph: { images: ['/api/og?item=interrupted-speech'] } });
    await expect(metadataFor({ era: 'fearless' })).resolves.toMatchObject({ openGraph: { images: ['/api/og?era=fearless'] } });
    await expect(metadataFor({ song: trackKey('fearless', track) })).resolves.toMatchObject({ openGraph: { images: [`/api/og?song=${encodeURIComponent(trackKey('fearless', track))}`] } });
    await expect(metadataFor({ guide: 'fearless' })).resolves.toMatchObject({ openGraph: { images: ['/api/og?guide=fearless'] } });
    await expect(metadataFor({ theories: 'fearless' })).resolves.toMatchObject({ openGraph: { images: ['/api/og?theories=fearless'] } });
  });

  it('uses the static fallback for an invalid target', async () => {
    await expect(metadataFor({ era: 'not-an-era' })).resolves.toEqual({});
  });
});
