import { describe, expect, it } from 'vitest';
import { resolveDeepLink, settingsDestination } from './notification-deep-links';

describe('resolveDeepLink', () => {
  it('resolves a longlivets.com current-item URL to the current-feed screen', () => {
    const dest = resolveDeepLink('song_drop', 'https://www.longlivets.com/?current=abc-123');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'abc-123' });
  });

  it('resolves the merch-drops anchor URL to the merch filter', () => {
    const dest = resolveDeepLink(
      'official_merch',
      'https://www.longlivets.com/?utm_source=push#merch-new-drops',
    );
    expect(dest).toEqual({ screen: 'current-feed', filter: 'merch' });
  });

  it('falls back to the per-category default when the URL is off-site', () => {
    const dest = resolveDeepLink('song_drop', 'https://www.youtube.com/watch?v=abc');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'song_drop' });
  });

  it('falls back to the per-category default with no rawUrl', () => {
    expect(resolveDeepLink('tour_news')).toEqual({ screen: 'current-feed', filter: 'tour_news' });
  });

  it('maps easter_egg to the theories filter', () => {
    expect(resolveDeepLink('easter_egg')).toEqual({ screen: 'current-feed', filter: 'theories' });
  });

  it('handles an unparseable rawUrl without throwing', () => {
    const dest = resolveDeepLink('song_drop', 'not a url');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'song_drop' });
  });
});

describe('settingsDestination', () => {
  it('always opens settings focused on the given category', () => {
    expect(settingsDestination('award_news')).toEqual({
      screen: 'settings',
      focusCategory: 'award_news',
    });
  });
});
