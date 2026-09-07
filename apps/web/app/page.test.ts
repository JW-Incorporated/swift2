import { describe, expect, it, vi } from 'vitest';
import { setTracksRawProvider, trackKey } from '@swift2/experience';

const item = { id: 'interrupted-speech' };
const track = { title: 'Fearless', note: 'A rushing first-love anthem.', trackNumber: 1 };

vi.mock('@/components/longlive/LongLive', () => ({ LongLive: () => null }));
vi.mock('@/lib/longlive/content', () => ({ getContentItem: (id: string) => (id === item.id ? item : undefined) }));

import { generateMetadata } from './page';

setTracksRawProvider({ fearless: [track] });

const metadataFor = (searchParams: Record<string, string>) => generateMetadata({ searchParams: Promise.resolve(searchParams) });

describe('generateMetadata', () => {
  it('routes each supported feature target to its own cached OG card', async () => {
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