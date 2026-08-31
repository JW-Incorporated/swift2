// Notifications Phase 2 (NOTIFICATIONS_SPEC.md §8) — per-category deep
// links. Portable, zero I/O — lives in @swift2/shared (not apps/mobile)
// specifically so it's covered by the root vitest suite (apps/mobile has
// no test runner wired up yet; packages/shared/** is included in
// vitest.config.ts). apps/mobile/lib/deep-links.ts re-exports this
// unchanged for call-site convenience.
import type { AnyNotificationCategory } from './notifications-types';

export type DeepLinkDestination =
  | { screen: 'current-feed'; filter?: string }
  | { screen: 'settings'; focusCategory?: AnyNotificationCategory }
  | { screen: 'inbox' }
  | { screen: 'web'; url: string };

/**
 * Maps a category to its in-app destination (spec §8's "every category →
 * its in-app destination"). `rawUrl` is the FCM payload's `data.deepLink`
 * (set server-side by @swift2/core's notification-router.ts) — when it's a
 * longlivets.com URL we can resolve in-app, prefer that over the generic
 * per-category fallback so an event that already points somewhere specific
 * (e.g. one merch product) isn't flattened into the whole feed.
 */
export function resolveDeepLink(
  category: AnyNotificationCategory,
  rawUrl?: string,
): DeepLinkDestination {
  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.hostname === 'www.longlivets.com' || url.hostname === 'longlivets.com') {
        const currentId = url.searchParams.get('current');
        if (currentId) return { screen: 'current-feed', filter: currentId };
        if (url.hash === '#merch-new-drops') return { screen: 'current-feed', filter: 'merch' };
        return { screen: 'web', url: rawUrl };
      }
    } catch {
      // Not a parseable URL (e.g. a bare YouTube link) — fall through to
      // the per-category default below rather than crashing on a tap.
    }
  }

  switch (category) {
    case 'song_drop':
    case 'album_news':
    case 'tour_news':
    case 'official_youtube':
    case 'official_merch':
    case 'relationship_news':
    case 'public_appearance':
    case 'award_news':
    case 'fan_merch':
      return { screen: 'current-feed', filter: category };
    case 'easter_egg':
      return { screen: 'current-feed', filter: 'theories' };
    case 'lyric_of_day':
    case 'on_this_day':
    case 'swiftie_trivia':
      // Fun categories don't send until Phase 4, but the mapping is defined
      // now so Phase 4 doesn't have to touch this file.
      return { screen: 'current-feed', filter: category };
    default:
      return { screen: 'inbox' };
  }
}

/** The "Settings" notification action always opens Settings focused on the
 * category that sent the push (spec §8: "≤2 taps from the exact setting
 * that controls it" — landing already-scrolled to that row is the second
 * tap saved). */
export function settingsDestination(category: AnyNotificationCategory): DeepLinkDestination {
  return { screen: 'settings', focusCategory: category };
}
