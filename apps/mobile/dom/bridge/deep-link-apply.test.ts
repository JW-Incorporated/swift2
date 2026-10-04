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
  }) satisfies Record<keyof DeepLinkActions, unknown>;

const queries: DeepLinkQueries = {
  threadIds: ['easter-eggs'],
  contentItemId: (id) => (id === 'moment-slug' ? 'm-1' : null),
  isEraId: (id) => ['debut', 'folklore'].includes(id),
  eraHasVideoSlug: (era, slug) => era === 'folklore' && slug === 'vid',
  findEraForVideoSlug: (slug) => (slug === 'vid' ? 'folklore' : null),
  eraOfTrackKey: (key) => (key.startsWith('debut::') ? 'debut' : null),
};

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
  ] as const)('%s calls %s', (search, fn, args) => {
    const a = actions();
    expect(applyDeepLink(search, queries, a)).toBe(true);
    expect(a[fn]).toHaveBeenCalledWith(...args);
    expect(a.goHome).not.toHaveBeenCalled();
  });

  it.each(['', '?', '?item=nope', '?song=bad::key', '?guide=nowhere', '?lens=unknown'])('%s lands on the front door, like a fresh mount', (search) => {
    const a = actions();
    expect(applyDeepLink(search, queries, a)).toBe(false);
    expect(a.goHome).toHaveBeenCalledTimes(1);
  });
});
