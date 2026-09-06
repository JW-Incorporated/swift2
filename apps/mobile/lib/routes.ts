// OS-030 — hybrid routing table.
//
// Phase 3 of docs/specs/2026-09-05-one-source-three-surfaces.md ports the
// app off the WebView shell one route at a time (D3: progressive, never
// big-bang, flag-gated, WebView fallback). This module is the single place
// that decides, for a given longlivets.com URL, whether the shell shows a
// native screen or hands the URL to the WebView — and it is the one
// `navigate()` every entry point calls, so a flag flip changes behavior
// everywhere at once without a rebuild (EAS Update ships the JS change).
//
// Entry points that all funnel through `navigate()`:
//   - a tapped push notification / digest (App.tsx's
//     `NotificationResponseReceivedListener`)
//   - an inbox row tap (NotificationInboxScreen's `onOpenItem`)
//   - the web -> native bridge (OS-002's `postMessage`, SiteShell's
//     `onBridgeMessage`)
//   - an in-WebView link click that targets a native-capable route
//     (SiteShell's `onShouldStartLoadWithRequest`)
//
// `destinationFor` (@swift2/shared, OS-003) already knows which URLs
// *could* be native (`settings`, `inbox`) vs. which are the website's own
// job (`web`). This module adds the missing piece: a per-screen feature
// flag that can turn a native-capable route back into a WebView route
// without touching `destinationFor` or the deep-link contract test.
import { destinationFor, type ShellDestination } from '@swift2/shared';

/**
 * Every screen this table can route to natively. `settings` and `inbox`
 * shipped in Phase 0; OS-032 adds `era-stream` (Phase 3's native era
 * stream — masthead, era sections, moment cards). `moment`, `track-guide`,
 * etc. join as they're built (OS-033..OS-038) — each new screen gets one
 * more entry here and one more flag, nothing else in this file changes
 * shape.
 */
export type ScreenId = 'settings' | 'inbox' | 'era-stream' | 'community' | 'merch';

export type RouteResolution = { native: ScreenId } | { web: string };

/**
 * One boolean per native-capable screen. `true` = route to the native
 * screen; `false` = fall back to the WebView even though a native screen
 * exists for it (e.g. to kill-switch a screen that shipped a bug, or to
 * stage a rollout). Screens not yet built simply have no flag and always
 * resolve to `web` — see `resolve()`.
 */
export interface RouteFlags {
  settings: boolean;
  inbox: boolean;
  /** OS-032: defaults OFF (see DEFAULT_ROUTE_FLAGS) — D3's progressive,
   * flag-gated rollout. The card's "done when" is "flag on in TestFlight",
   * i.e. a remote-config/staged flip after review, not a same-PR default
   * flip that would put an unreviewed native screen in front of every user
   * on merge. */
  eraStream: boolean;
  /** OS-037: same progressive-rollout posture as `eraStream` — the native
   * community directory ships OFF by default; a remote-config flip after
   * review turns it on without a rebuild. */
  community: boolean;
  /** OS-037: same progressive-rollout posture as `eraStream`/`community`. */
  merch: boolean;
}

/** Settings/inbox ship on by default (Phase 0, already shipped); the new OS-032 era stream, and OS-037's community/merch, ship OFF by default — see `RouteFlags`'s per-field docs. */
export const DEFAULT_ROUTE_FLAGS: RouteFlags = {
  settings: true,
  inbox: true,
  eraStream: false,
  community: false,
  merch: false,
};

function screenForDestination(dest: ShellDestination): ScreenId | null {
  if (dest.kind === 'settings') return 'settings';
  if (dest.kind === 'inbox') return 'inbox';
  if (dest.kind === 'era-stream') return 'era-stream';
  if (dest.kind === 'community') return 'community';
  if (dest.kind === 'merch') return 'merch';
  return null;
}

/** Maps a `ScreenId` to its `RouteFlags` key — the flag names differ from the screen ids in one case (`era-stream` -> `eraStream`, a valid RouteFlags/TS identifier) so this indirection is the one place that mapping lives. */
function flagForScreen(screen: ScreenId, flags: RouteFlags): boolean {
  if (screen === 'settings') return flags.settings;
  if (screen === 'inbox') return flags.inbox;
  if (screen === 'era-stream') return flags.eraStream;
  if (screen === 'community') return flags.community;
  return flags.merch;
}

/**
 * `resolve(url) → { native: ScreenId, params } | { web: url }` (per the
 * OS-030 card). `siteUrl` and `flags` are injectable (siteUrl for
 * non-production `EXPO_PUBLIC_SITE_URL` builds, flags for tests and future
 * remote-config wiring); both default to production values so call sites
 * that don't care can omit them.
 */
export function resolve(
  rawUrl: string | null | undefined,
  siteUrl?: string,
  flags: RouteFlags = DEFAULT_ROUTE_FLAGS,
): RouteResolution {
  const dest = siteUrl === undefined ? destinationFor(rawUrl) : destinationFor(rawUrl, siteUrl);
  const screen = screenForDestination(dest);
  if (screen && flagForScreen(screen, flags)) return { native: screen };
  // Either destinationFor already said `web` (nothing native addresses this
  // URL), or it does but the flag is off — both fall back to the WebView.
  // `dest.kind === 'web'` always carries a `url`; the native-but-flagged-off
  // case has no web equivalent URL of its own, so it falls back to the site
  // root the same way destinationFor does for an unroutable link.
  return { web: dest.kind === 'web' ? dest.url : siteUrl ?? 'https://www.longlivets.com' };
}

/** True when `resolve()` would send this URL to a native screen right now. */
export function isNativeRoute(
  rawUrl: string | null | undefined,
  siteUrl?: string,
  flags: RouteFlags = DEFAULT_ROUTE_FLAGS,
): boolean {
  return 'native' in resolve(rawUrl, siteUrl, flags);
}

export interface NavigateHandlers {
  /** Show the given native screen (settings, inbox, …). */
  openNative: (screen: ScreenId) => void;
  /** Load this URL in the WebView. */
  openWeb: (url: string) => void;
}

/**
 * Binds `resolve()` to one site + flag source and returns the single
 * `navigate(url)` every call site should use (per the OS-030 card: "one
 * `navigate(url)` used by deep links, inbox rows, the web→native bridge,
 * and in-WebView link clicks"). `getFlags` is a function (not a snapshot)
 * so a flag flip during the app's lifetime — e.g. a future remote-config
 * refresh — takes effect on the very next navigation.
 */
export function createNavigate(
  handlers: NavigateHandlers,
  siteUrl?: string,
  getFlags: () => RouteFlags = () => DEFAULT_ROUTE_FLAGS,
): (rawUrl: string | null | undefined) => void {
  return (rawUrl: string | null | undefined) => {
    const resolution = resolve(rawUrl, siteUrl, getFlags());
    if ('native' in resolution) handlers.openNative(resolution.native);
    else handlers.openWeb(resolution.web);
  };
}
