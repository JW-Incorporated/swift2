import { describe, expect, it, vi } from 'vitest';
import { setTracksRawProvider, trackKey } from '@swift2/experience';

const item = {
  id: 'interrupted-speech',
  slug: 'interrupted-speech-slug',
  eraId: 'fearless',
  title: 'The interrupted speech',
  dateLabel: 'September 2009',
  summary: 'A defining public turning point.',
};
const track = { title: 'Fearless', note: 'A rushing first-love anthem.', trackNumber: 1 };

vi.mock('@/components/longlive/LongLive', () => ({ LongLive: () => null }));
vi.mock('@/lib/longlive/content', () => ({
  getContentItemByIdOrSlug: (id: string) => (id === item.id || id === item.slug ? item : undefined),
}));

import { generateMetadata } from './page';

setTracksRawProvider({ fearless: [track] });

function searchParams(params: Record<string, string>) {
  return Promise.resolve(params);
}

const parent = Promise.resolve({
  title: { absolute: 'Long Live — a time machine' },
  openGraph: { title: 'Long Live', description: 'Generic.', type: 'website', url: '/' },
  twitter: { card: 'summary_large_image', title: 'Long Live', description: 'Generic.' },
}) as never;

const metadataFor = (params: Record<string, string>) => generateMetadata({ searchParams: searchParams(params) }, parent);

describe('generateMetadata (og:image selection)', () => {
  it('points at the lens card for a recognized lens', async () => {
    const meta = await metadataFor({ lens: 'hidden-clues' });
    expect(meta.openGraph?.images).toMatchObject([{ url: '/api/og?lens=hidden-clues' }]);
    expect(meta.twitter?.images).toMatchObject([{ url: '/api/og?lens=hidden-clues' }]);
  });

  it('points at the mode card for mood/clownbot', async () => {
    const meta = await metadataFor({ mode: 'clownbot' });
    expect(meta.openGraph?.images).toMatchObject([{ url: '/api/og?mode=clownbot' }]);
  });

  it('keeps generic text and image for an unrecognized lens with no mode', async () => {
    const meta = await metadataFor({ lens: 'not-real' });
    expect(meta.title).toBeUndefined();
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it('makes home og:title and twitter:title match the document title', async () => {
    const meta = await metadataFor({});
    expect(meta.openGraph).toMatchObject({ title: 'Long Live — a time machine', description: 'Generic.' });
    expect(meta.twitter).toMatchObject({ title: 'Long Live — a time machine' });
  });

  it('sets text metadata from the resolved item', async () => {
    const meta = await metadataFor({ item: item.id });
    expect(meta.title).toBe('The interrupted speech — Long Live');
    expect(meta.description).toBe('A defining public turning point.');
    expect(meta.openGraph).toMatchObject({ title: 'The interrupted speech — Long Live', description: 'A defining public turning point.' });
    expect(meta.twitter).toMatchObject({ title: 'The interrupted speech — Long Live', description: 'A defining public turning point.' });
  });

  it('an invalid lens paired with a valid mode uses the mode, not the invalid lens', async () => {
    const meta = await metadataFor({ lens: 'not-real', mode: 'mood' });
    expect(meta.openGraph?.images).toMatchObject([{ url: '/api/og?mode=mood' }]);
  });

  it('a valid lens paired with an invalid mode uses the lens', async () => {
    const meta = await metadataFor({ lens: 'fashion', mode: 'not-real' });
    expect(meta.openGraph?.images).toMatchObject([{ url: '/api/og?lens=fashion' }]);
  });

  it('routes item, era, song, guide, and theories targets to their own cached OG cards', async () => {
    await expect(metadataFor({ item: item.id })).resolves.toMatchObject({ openGraph: { images: [{ url: '/api/og?item=interrupted-speech' }] } });
    await expect(metadataFor({ item: item.slug })).resolves.toMatchObject({ openGraph: { images: [{ url: '/api/og?item=interrupted-speech' }] } });
    await expect(metadataFor({ era: 'fearless' })).resolves.toMatchObject({ openGraph: { images: [{ url: '/api/og?era=fearless' }] } });
    await expect(metadataFor({ song: trackKey('fearless', track) })).resolves.toMatchObject({ openGraph: { images: [{ url: `/api/og?song=${encodeURIComponent(trackKey('fearless', track))}` }] } });
    await expect(metadataFor({ guide: 'fearless' })).resolves.toMatchObject({ openGraph: { images: [{ url: '/api/og?guide=fearless' }] } });
    await expect(metadataFor({ theories: 'fearless' })).resolves.toMatchObject({ openGraph: { images: [{ url: '/api/og?theories=fearless' }] } });
  });

  it('sets og:url to the shared target, not the bare site', async () => {
    await expect(metadataFor({ era: 'fearless' })).resolves.toMatchObject({ openGraph: { url: '/?era=fearless' } });
    await expect(metadataFor({ item: item.slug })).resolves.toMatchObject({ openGraph: { url: '/?item=interrupted-speech' } });
    await expect(metadataFor({ lens: 'hidden-clues' })).resolves.toMatchObject({ openGraph: { url: '/?lens=hidden-clues' } });
  });

  it('never sets a per-query canonical', async () => {
    const meta = await metadataFor({ item: item.id });
    expect(meta.alternates).toBeUndefined();
  });

  it('gives deep-link card images 1200x630 dimensions and target alt text', async () => {
    const meta = await metadataFor({ item: item.id });
    const image = { url: '/api/og?item=interrupted-speech', width: 1200, height: 630, alt: 'Long Live card: The interrupted speech (Fearless · September 2009)' };
    expect(meta.openGraph?.images).toEqual([image]);
    expect(meta.twitter?.images).toEqual([image]);
    const lens = await metadataFor({ lens: 'hidden-clues' });
    expect(lens.openGraph?.images).toMatchObject([{ alt: expect.not.stringContaining('(Long Live)') }]);
  });

  it('uses the static fallback for an invalid target', async () => {
    const meta = await metadataFor({ era: 'not-an-era' });
    expect(meta.title).toBeUndefined();
    expect(meta.openGraph?.images).toBeUndefined();
  });
});
