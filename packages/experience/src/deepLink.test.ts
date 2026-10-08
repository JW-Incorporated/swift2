import { describe, expect, it } from 'vitest';
import { deepLinkTarget, resolveVideoDeepLink } from './deepLink';

const LENSES = ['love-story', 'fashion', 'easter-eggs'];

describe('deepLinkTarget', () => {
  it('returns null for a plain visit — the era stream is the front door', () => {
    expect(deepLinkTarget('', LENSES)).toBeNull();
    expect(deepLinkTarget('?utm_source=share', LENSES)).toBeNull();
  });

  it('routes ?item= to the moment overlay', () => {
    expect(deepLinkTarget('?item=vmas-2009', LENSES)).toEqual({ kind: 'item', id: 'vmas-2009' });
  });

  it('routes ?lens= to a known thread', () => {
    expect(deepLinkTarget('?lens=love-story', LENSES)).toEqual({
      kind: 'lens',
      id: 'love-story',
    });
  });

  it('routes ?era= to an era', () => {
    expect(deepLinkTarget('?era=red', LENSES)).toEqual({ kind: 'era', id: 'red' });
  });

  it('routes ?song= to a song dossier, carrying the whole composite key', () => {
    expect(deepLinkTarget('?song=red%3A%3A5%3A%3AAll%20Too%20Well', LENSES)).toEqual({
      kind: 'song',
      key: 'red::5::All Too Well',
    });
  });

  it('routes ?guide= to an album track guide', () => {
    expect(deepLinkTarget('?guide=red', LENSES)).toEqual({ kind: 'guide', eraId: 'red' });
  });

  it('routes ?theories= to an era theories guide', () => {
    expect(deepLinkTarget('?theories=red', LENSES)).toEqual({ kind: 'theories', eraId: 'red' });
  });

  // #2105 — Threads gallery, Mood, Clownbot, Community, and Merch: each
  // addresses a whole surface, not any user input on it.
  it('routes ?mode=threads to the Threads gallery', () => {
    expect(deepLinkTarget('?mode=threads', LENSES)).toEqual({ kind: 'mode', mode: 'threads' });
  });

  it('routes ?mode=mood to Mood', () => {
    expect(deepLinkTarget('?mode=mood', LENSES)).toEqual({ kind: 'mode', mode: 'mood' });
  });

  it('routes ?mode=clownbot to Clownbot', () => {
    expect(deepLinkTarget('?mode=clownbot', LENSES)).toEqual({ kind: 'mode', mode: 'clownbot' });
  });

  it('routes ?mode=community to Community', () => {
    expect(deepLinkTarget('?mode=community', LENSES)).toEqual({ kind: 'mode', mode: 'community' });
  });

  it('routes ?mode=merch to Merch', () => {
    expect(deepLinkTarget('?mode=merch', LENSES)).toEqual({ kind: 'mode', mode: 'merch' });
  });

  it('ignores an unrecognized ?mode= value and falls through to era', () => {
    expect(deepLinkTarget('?mode=bogus&era=red', LENSES)).toEqual({ kind: 'era', id: 'red' });
    expect(deepLinkTarget('?mode=bogus', LENSES)).toBeNull();
  });

  it('prefers item > song > guide > theories > lens > mode > era', () => {
    expect(deepLinkTarget('?era=red&lens=fashion&item=x', LENSES)).toEqual({
      kind: 'item',
      id: 'x',
    });
    // song outranks the bare guide it stacks on top of.
    expect(deepLinkTarget('?guide=red&song=red%3A%3A5%3A%3AATW', LENSES)).toEqual({
      kind: 'song',
      key: 'red::5::ATW',
    });
    expect(deepLinkTarget('?era=red&guide=1989', LENSES)).toEqual({ kind: 'guide', eraId: '1989' });
    expect(deepLinkTarget('?era=red&theories=1989', LENSES)).toEqual({
      kind: 'theories',
      eraId: '1989',
    });
    expect(deepLinkTarget('?era=red&lens=fashion', LENSES)).toEqual({
      kind: 'lens',
      id: 'fashion',
    });
    // lens outranks a bare mode param.
    expect(deepLinkTarget('?mode=threads&lens=fashion', LENSES)).toEqual({
      kind: 'lens',
      id: 'fashion',
    });
    // mode outranks the era fallback.
    expect(deepLinkTarget('?era=red&mode=mood', LENSES)).toEqual({
      kind: 'mode',
      mode: 'mood',
    });
  });

  it('ignores an unknown lens and falls through to era', () => {
    expect(deepLinkTarget('?lens=not-a-thread&era=red', LENSES)).toEqual({
      kind: 'era',
      id: 'red',
    });
    expect(deepLinkTarget('?lens=not-a-thread', LENSES)).toBeNull();
  });
});

// #3312 — a `?item=` id that isn't a moment may be a video's slug instead
// (videos have no `?video=` param of their own). These fixtures stand in for
// the real `getEra`/`allVideoRecordsForEra`/`findVideoEraId` lookups so the
// resolution order is testable without importing content data.
describe('resolveVideoDeepLink', () => {
  const isValidEraId = (id: string) => id === 'folklore' || id === 'red';
  const eraHasVideoSlug = (eraId: string, slug: string) =>
    (eraId === 'folklore' && slug === 'icon-sessions-grammy-museum-medley') ||
    (eraId === 'red' && slug === 'red-video');
  const findEraForVideoSlug = (slug: string) =>
    slug === 'icon-sessions-grammy-museum-medley'
      ? 'folklore'
      : slug === 'red-video'
        ? 'red'
        : null;

  it('trusts a valid era hint that actually owns the slug', () => {
    expect(
      resolveVideoDeepLink(
        'icon-sessions-grammy-museum-medley',
        'folklore',
        isValidEraId,
        eraHasVideoSlug,
        findEraForVideoSlug,
      ),
    ).toBe('folklore');
  });

  it('falls back to scanning every era when the hint is wrong', () => {
    // Mangled/mismatched hint (e.g. a hand-typed URL) — the slug still
    // resolves via the scan rather than failing outright.
    expect(
      resolveVideoDeepLink(
        'icon-sessions-grammy-museum-medley',
        'red',
        isValidEraId,
        eraHasVideoSlug,
        findEraForVideoSlug,
      ),
    ).toBe('folklore');
  });

  it('falls back to scanning every era when no hint is present', () => {
    expect(
      resolveVideoDeepLink(
        'icon-sessions-grammy-museum-medley',
        null,
        isValidEraId,
        eraHasVideoSlug,
        findEraForVideoSlug,
      ),
    ).toBe('folklore');
  });

  it('returns null for a slug that resolves nowhere', () => {
    expect(
      resolveVideoDeepLink('not-a-real-slug', 'folklore', isValidEraId, eraHasVideoSlug, findEraForVideoSlug),
    ).toBeNull();
  });
});
