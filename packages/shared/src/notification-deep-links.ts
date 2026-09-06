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
  | { screen: 'track'; slug: string }
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
        // Phase 4: lyric_of_day deep-links to the song's track-guide page
        // (spec §4: "deep-links to song page") via the same `?song=` param
        // MAP.md documents the reader reading once on mount.
        const songSlug = url.searchParams.get('song');
        if (songSlug) return { screen: 'track', slug: songSlug };
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

// --- Shell routing (OS-003) ---------------------------------------------
//
// The native shell (apps/mobile/App.tsx) receives the SAME longlivets.com
// URLs the backend emits (packages/core/src/notification-*.ts) — a tapped
// push or an inbox row carries the `deepLink` payload verbatim. Two of
// those URL shapes address screens that only exist natively (Settings,
// Inbox); everything else — `?current=<value>`, `?song=<slug>`,
// `#merch-new-drops`, a bare `/`, or an off-site URL — is the WEBSITE's
// job to interpret once loaded, so the shell's only responsibility for
// those is to hand the WebView the URL unchanged (or fall back to the
// site root for anything that isn't ours to show). `destinationFor` used
// to live in apps/mobile/App.tsx; it moved here (OS-003) so the deep-link
// contract test below can exercise it directly — apps/mobile has no test
// runner of its own wired into the root vitest suite.
export type ShellDestination =
  | { kind: 'web'; url: string }
  | { kind: 'settings' }
  | { kind: 'inbox' }
  | { kind: 'era-stream' }
  // OS-035: the native track guide (one album's song list) and song dossier.
  // Reachable via new explicit `?screen=` markers — same pattern as
  // `era-stream` above — rather than the WEBSITE's own `?guide=<eraId>` /
  // `?song=<key>` params (deepLink.ts, ShareSheet.tsx), which stay untouched
  // and continue to fall through to the `web` case below: those are shared
  // URLs and notification payloads (`notification-fun.ts`'s `lyric_of_day`)
  // that must keep opening in the WebView until this screen's flag flips on
  // for everyone, not just when a shell happens to be running this build.
  | { kind: 'track-guide'; eraId: string }
  | { kind: 'song'; trackKey: string }
  // OS-036: the native Clownbot + mood chat screen, same `?screen=` pattern.
  | { kind: 'clownbot' };

const DEFAULT_SITE_URL = 'https://www.longlivets.com';

/**
 * Where a notification (tap or inbox row) should take the shell. `siteUrl`
 * defaults to the production site but is injectable because the mobile app
 * points at `EXPO_PUBLIC_SITE_URL` in non-production builds.
 */
export function destinationFor(
  rawUrl: string | null | undefined,
  siteUrl: string = DEFAULT_SITE_URL,
): ShellDestination {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  if (!rawUrl) return { kind: 'web', url: normalizedSiteUrl };
  try {
    const site = new URL(normalizedSiteUrl);
    const siteHosts = new Set(
      site.hostname.startsWith('www.')
        ? [site.hostname, site.hostname.slice('www.'.length)]
        : [site.hostname, `www.${site.hostname}`],
    );
    const u = new URL(rawUrl);
    if (!siteHosts.has(u.hostname) && u.origin !== normalizedSiteUrl) {
      return { kind: 'web', url: normalizedSiteUrl };
    }
    if (u.searchParams.get('screen') === 'settings') return { kind: 'settings' };
    if (u.searchParams.get('current') === 'inbox') return { kind: 'inbox' };
    // OS-032: the native era stream is reachable the same way Settings is —
    // an explicit `?screen=era-stream` marker — rather than claiming the
    // bare site root, which stays the WebView's job until OS-039 retires
    // SiteShell as the default for every route this phase ports.
    if (u.searchParams.get('screen') === 'era-stream') return { kind: 'era-stream' };
    // OS-035: same pattern, one param per native screen — `?screen=track-
    // guide&era=<eraId>` and `?screen=song&key=<trackKey>`. The website's
    // OWN `?guide=<eraId>` / `?song=<key>` params (deepLink.ts) are left
    // alone and fall through to the `web` case below: those are shared URLs
    // and notification payloads that must keep opening in the WebView until
    // this screen is rolled out, not just because a build happens to carry
    // the native screen.
    if (u.searchParams.get('screen') === 'track-guide') {
      const eraId = u.searchParams.get('era');
      if (eraId) return { kind: 'track-guide', eraId };
    }
    if (u.searchParams.get('screen') === 'song') {
      const trackKey = u.searchParams.get('key');
      if (trackKey) return { kind: 'song', trackKey };
    }
    // OS-036: the native Clownbot + mood chat screen, reached the same way —
    // an explicit `?screen=clownbot` marker.
    if (u.searchParams.get('screen') === 'clownbot') return { kind: 'clownbot' };
    // `?current=theories|merch|countdowns`, `?song=<slug>`,
    // `#merch-new-drops`, and a bare site root all address something the
    // website itself renders — hand the URL through unchanged so the
    // site's own router (apps/web/lib/longlive/deepLink.ts) or a plain DOM
    // anchor resolves it.
    return { kind: 'web', url: rawUrl };
  } catch {
    // Not a parseable URL — never crash on a tap, just show the front door.
    return { kind: 'web', url: normalizedSiteUrl };
  }
}
