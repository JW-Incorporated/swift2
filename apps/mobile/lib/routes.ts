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
 * stream — masthead, era sections, moment cards). OS-034 adds `threads`
 * (the native threads gallery + detail). OS-035 adds `track-guide` (an
 * album's song list) and `song` (one song's dossier). OS-033 adds `moment`
 * (the native moment detail sheet). OS-036 adds `clownbot` (the native
 * Clownbot + mood chat screen). OS-037 adds `community` and `merch` (the
 * fan community directory and the merch directory). Remaining screens join
 * as they're built (OS-038) — each new screen gets one more entry here and
 * one more flag, nothing else in this file changes shape.
 */
export type ScreenId =
  | 'settings'
  | 'inbox'
  | 'era-stream'
  | 'threads'
  | 'community'
  | 'merch'
  | 'track-guide'
  | 'song'
  | 'moment'
  | 'clownbot';

/**
 * The native-side resolution carries whichever params the target screen
 * needs to render (OS-035's `track-guide`/`song` were the first screens in
 * this table that needed any — `settings`/`inbox`/`era-stream`/`threads`/
 * `community`/`merch`/`clownbot` take none; OS-033's `moment` adds
 * `itemId`). `params` is always present (possibly `{}`) so callers never
 * need an `'params' in resolution` guard on top of the `'native' in
 * resolution` one.
 */
export type NativeParams = { eraId?: string; trackKey?: string; itemId?: string };
export type RouteResolution = { native: ScreenId; params: NativeParams } | { web: string };

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
  /** OS-034: same progressive-rollout posture as `eraStream` — defaults OFF
   * (see DEFAULT_ROUTE_FLAGS); flipped on after a staged TestFlight review. */
  threads: boolean;
  /** OS-037: same progressive-rollout posture as `eraStream` — the native
   * community directory ships OFF by default; a remote-config flip after
   * review turns it on without a rebuild. */
  community: boolean;
  /** OS-037: same progressive-rollout posture as `eraStream`/`community`. */
  merch: boolean;
  /** OS-035: same D3 progressive-rollout contract as `eraStream` — defaults
   * OFF, flips on later via remote config once reviewed in TestFlight. */
  trackGuide: boolean;
  song: boolean;
  /** OS-033: same D3 posture as `eraStream`/`trackGuide`/`song` — defaults
   * OFF until the native moment sheet has been through review/TestFlight.
   * `destinationFor` already resolves any `?item=<id>` link to
   * `{ kind: 'moment', itemId, url }` regardless of this flag (it is the
   * deep-link CONTRACT, not the routing decision); this flag is what
   * `resolve()`/`screenForDestination` gate on before actually sending the
   * shell to the native sheet vs. the WebView. */
  moment: boolean;
  /** OS-036: same progressive-rollout posture as eraStream/trackGuide —
   * defaults OFF (see DEFAULT_ROUTE_FLAGS). */
  clownbot: boolean;
}

/** Settings/inbox ship on by default (Phase 0, already shipped); OS-032's era stream, OS-033's moment sheet, OS-034's threads mode, OS-037's community/merch, OS-035's track guide/song screens, and OS-036's Clownbot all ship OFF by default — see each flag's own doc above. */
export const DEFAULT_ROUTE_FLAGS: RouteFlags = {
  settings: true,
  inbox: true,
  eraStream: false,
  threads: false,
  community: false,
  merch: false,
  trackGuide: false,
  song: false,
  moment: false,
  clownbot: false,
};

function screenForDestination(dest: ShellDestination): ScreenId | null {
  if (dest.kind === 'settings') return 'settings';
  if (dest.kind === 'inbox') return 'inbox';
  if (dest.kind === 'era-stream') return 'era-stream';
  if (dest.kind === 'threads') return 'threads';
  if (dest.kind === 'community') return 'community';
  if (dest.kind === 'merch') return 'merch';
  if (dest.kind === 'track-guide') return 'track-guide';
  if (dest.kind === 'song') return 'song';
  if (dest.kind === 'moment') return 'moment';
  if (dest.kind === 'clownbot') return 'clownbot';
  return null;
}

/** The native params a resolved destination carries through to the screen — `{}` for every screen that needs none. */
function paramsForDestination(dest: ShellDestination): NativeParams {
  if (dest.kind === 'track-guide') return { eraId: dest.eraId };
  if (dest.kind === 'song') return { trackKey: dest.trackKey };
  if (dest.kind === 'moment') return { itemId: dest.itemId };
  return {};
}

/** Maps a `ScreenId` to its `RouteFlags` key — the flag names differ from the screen ids in the hyphenated/multi-word cases (`era-stream` -> `eraStream`, `track-guide` -> `trackGuide`; `song`/`threads`/`community`/`merch`/`moment`/`clownbot` match their screen id), all valid RouteFlags/TS identifiers, so this indirection is the one place that mapping lives. */
function flagForScreen(screen: ScreenId, flags: RouteFlags): boolean {
  if (screen === 'settings') return flags.settings;
  if (screen === 'inbox') return flags.inbox;
  if (screen === 'era-stream') return flags.eraStream;
  if (screen === 'threads') return flags.threads;
  if (screen === 'community') return flags.community;
  if (screen === 'merch') return flags.merch;
  if (screen === 'track-guide') return flags.trackGuide;
  if (screen === 'song') return flags.song;
  if (screen === 'moment') return flags.moment;
  return flags.clownbot;
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
  if (screen && flagForScreen(screen, flags)) {
    return { native: screen, params: paramsForDestination(dest) };
  }
  // Either destinationFor already said `web` (nothing native addresses this
  // URL), or it does but the flag is off — both fall back to the WebView.
  // `dest.kind === 'web'` always carries a `url`, and so does `'moment'`
  // (OS-033: the website already renders `?item=<id>` itself via its own
  // deep-link handling, so a flagged-off moment falls back to THAT url
  // rather than the bare site root — unlike settings/inbox/era-stream/
  // threads/community/merch/track-guide/song/clownbot, which have no web
  // equivalent of their own to fall back to).
  if (dest.kind === 'web') return { web: dest.url };
  if (dest.kind === 'moment') return { web: dest.url };
  return { web: siteUrl ?? 'https://www.longlivets.com' };
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
  /** Show the given native screen (settings, inbox, …) with its resolved params. */
  openNative: (screen: ScreenId, params: NativeParams) => void;
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
    if ('native' in resolution) handlers.openNative(resolution.native, resolution.params);
    else handlers.openWeb(resolution.web);
  };
}
