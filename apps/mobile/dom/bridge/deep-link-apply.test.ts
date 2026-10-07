import { describe, expect, it, vi } from 'vitest';
import { applyDeepLink, type DeepLinkActions, type DeepLinkQueries } from './deep-link-apply';

const actions = () =>
  ({
    goHome: vi.fn(),
    setEra: vi.fn(),
    setMode: vi.fn(),
    openThread: vi.fn(),
    openItem: vi.fn(),
    openVideo: vi.fn(),
    openSong: vi.fn(),
    openTrackGuide: vi.fn(),
    openTheoryGuide: vi.fn(),
    closeItem: vi.fn(),
    closeInbox: vi.fn(),
    closeSettings: vi.fn(),
    closeTrackGuide: vi.fn(),
    closeTheoryGuide: vi.fn(),
    setSearchOpen: vi.fn(),
    setSelectorOpen: vi.fn(),
  }) satisfies Record<keyof DeepLinkActions, unknown>;

const queries: DeepLinkQueries = {
  threadIds: ['easter-eggs'],
  contentItemId: (id) => (id === 'moment-slug' ? 'm-1' : null),
  isEraId: (id) => ['debut', 'folklore'].includes(id),
  eraHasVideoSlug: (era, slug) => era === 'folklore' && slug === 'vid',
  findEraForVideoSlug: (slug) => (slug === 'vid' ? 'folklore' : null),
  eraOfTrackKey: (key) => (key.startsWith('debut::') ? 'debut' : null),
};

describe('applyDeepLink inbox/settings closing', () => {
  it('an unresolved target closes nothing', () => {
    const a = actions();
    expect(applyDeepLink('?current=theories', queries, a)).toBe(false);
    expect(a.closeInbox).not.toHaveBeenCalled();
    expect(a.closeSettings).not.toHaveBeenCalled();
  });
  it('a resolved target closes the inbox and settings once', () => {
    const a = actions();
    expect(applyDeepLink('?item=moment-slug', queries, a)).toBe(true);
    expect(a.closeInbox).toHaveBeenCalledTimes(1);
    expect(a.closeSettings).toHaveBeenCalledTimes(1);
  });
});

describe('applyDeepLink (native navigate through the store, no remount)', () => {
  it.each([
    ['?item=moment-slug', 'openItem', ['m-1']],
    ['?item=vid&era=folklore', 'openVideo', ['folklore', 'vid']],
    ['?song=debut::1::Tim', 'openSong', ['debut', 'debut::1::Tim']],
    ['?guide=debut', 'openTrackGuide', ['debut']],
    ['?theories=folklore', 'openTheoryGuide', ['folklore']],
    ['?lens=easter-eggs', 'openThread', ['easter-eggs']],
    ['?mode=threads', 'setMode', ['threads']],
    ['?era=debut', 'setEra', ['debut']],
  ] as const)('%s calls %s after normalizing overlay state', (search, fn, args) => {
    const a = actions();
    expect(applyDeepLink(search, queries, a)).toBe(true);
    expect(a[fn]).toHaveBeenCalledWith(...args);
    for (const close of ['closeItem', 'closeTrackGuide', 'closeTheoryGuide', 'setSelectorOpen'] as const) {
      expect(a[close]).toHaveBeenCalledTimes(1);
    }
    expect(a.setSearchOpen).toHaveBeenCalledWith(false);
    expect(a.goHome).not.toHaveBeenCalled();
  });

  it.each(['?item=nope', '?song=bad::key', '?guide=nowhere', '?theories=nowhere', '?era=nowhere', '?lens=unknown', '?junk=1'])(
    '%s does not resolve: false and NO store action at all (no goHome, no overlay closed)',
    (search) => {
      const a = actions();
      expect(applyDeepLink(search, queries, a)).toBe(false);
      for (const fn of Object.values(a)) expect(fn).not.toHaveBeenCalled();
    },
  );

  it.each(['', '?'])('a bare root %j is an explicit home', (search) => {
    const a = actions();
    expect(applyDeepLink(search, queries, a)).toBe(true);
    expect(a.goHome).toHaveBeenCalledTimes(1);
  });
});
