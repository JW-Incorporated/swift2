import { describe, expect, it } from 'vitest';

import { generateMetadata } from './page';

// The "cool feature only" fix (social-strategy.md §2): a lens/mode deep
// link's OG image must match the feature `deepLinkTarget`
// (packages/experience/src/deepLink.ts) actually opens. Codex review
// caught a real bug here: with `?lens=bogus&mode=mood`, the unvalidated
// version of this picked the invalid lens for the image URL while
// `deepLinkTarget` (lens > mode precedence, but only for a *valid* lens)
// opens Mood — mismatching the card to the destination.
function searchParams(params: Record<string, string>) {
  return Promise.resolve(params);
}

describe('generateMetadata (og:image selection)', () => {
  it('points at the lens card for a recognized lens', async () => {
    const meta = await generateMetadata({ searchParams: searchParams({ lens: 'hidden-clues' }) });
    expect(meta.openGraph?.images).toEqual(['/api/og?lens=hidden-clues']);
    expect(meta.twitter?.images).toEqual(['/api/og?lens=hidden-clues']);
  });

  it('points at the mode card for mood/clownbot', async () => {
    const meta = await generateMetadata({ searchParams: searchParams({ mode: 'clownbot' }) });
    expect(meta.openGraph?.images).toEqual(['/api/og?mode=clownbot']);
  });

  it('falls back to no override for an unrecognized lens with no mode', async () => {
    const meta = await generateMetadata({ searchParams: searchParams({ lens: 'not-real' }) });
    expect(meta).toEqual({});
  });

  it('falls back to no override for a bare homepage (no params)', async () => {
    const meta = await generateMetadata({ searchParams: searchParams({}) });
    expect(meta).toEqual({});
  });

  it('an invalid lens paired with a valid mode uses the mode, not the invalid lens', async () => {
    const meta = await generateMetadata({
      searchParams: searchParams({ lens: 'not-real', mode: 'mood' }),
    });
    expect(meta.openGraph?.images).toEqual(['/api/og?mode=mood']);
  });

  it('a valid lens paired with an invalid mode uses the lens', async () => {
    const meta = await generateMetadata({
      searchParams: searchParams({ lens: 'fashion', mode: 'not-real' }),
    });
    expect(meta.openGraph?.images).toEqual(['/api/og?lens=fashion']);
  });
});
