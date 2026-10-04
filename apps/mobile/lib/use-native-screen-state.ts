// Native screen state for App.tsx (moved verbatim from App.tsx — no behaviour change):
// which overlay / tab / legal page / track-guide / moment is showing, plus the two
// openers every navigation entry point funnels through.
import { useCallback, useEffect, useState } from 'react';
import type { EraId, TrackNote } from '@swift2/experience';
import { resolveTrackKey } from '@swift2/experience';
import type { NativeParams, ScreenId } from './routes';
import { isLegalPageUrl, legalPageUrl, type LegalPageId } from './legal-links';
import { ensureTrackGuideWired, loadTrackGuide } from './track-guide-data';
import { SITE_URL } from '../components/SiteShell';
import type { HomeTab } from '../components/BottomTabBar';

/**
 * OS-035's two param-carrying screens don't fit the existing plain-boolean
 * `xOpen` state slots the other screens use (they need an eraId, and `song`
 * additionally needs which track) — this union is the minimal extension of
 * that pattern rather than a bigger routing refactor. `null` = neither is
 * showing (i.e. some other screen or the WebView owns the view).
 */
export type TrackGuideRouteState =
  | { screen: 'track-guide'; eraId: EraId }
  | { screen: 'song'; eraId: EraId; track: TrackNote }
  | null;

export function useNativeScreenState() {
  // OS-039: the native home is now always one of the five BottomTabBar
  // worlds — this replaces the old "webUrl state that defaults to the site
  // root" posture. `legalUrl` is the ONLY thing that still drives a WebView
  // load; it is null whenever no legal page is showing (i.e. every other
  // screen state below takes priority in the render tree).
  const [activeTab, setActiveTab] = useState<HomeTab>('era');
  const [legalUrl, setLegalUrl] = useState<string | null>(null);
  // Where a legal page's Done button returns to: Settings when it was opened
  // from Settings → About, otherwise the home tab that was already active.
  const [legalReturnTo, setLegalReturnTo] = useState<'settings' | null>(null);
  // Notifications Phase 1 (spec §8): the bell is reachable from every screen
  // → Notification Settings. App.tsx renders one screen at a time, so the
  // native screens are full-bleed overlays toggled by local state.
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  // Phase 2 (spec §7): the pre-permission onboarding screen, shown at most
  // once per install, at the value moment of the first bell tap.
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // OS-035: the native track guide / song dossier, reached via
  // `?screen=track-guide` / `?screen=song` (both flag-on by default since
  // OS-039 — see routes.ts). See `TrackGuideRouteState`'s doc for why this
  // is a small union rather than another plain boolean.
  const [trackGuideRoute, setTrackGuideRoute] = useState<TrackGuideRouteState>(null);
  // Tracks for the era currently open in `trackGuideRoute` — loaded async
  // via `loadTrackGuide` (the published bundle, OS-035's data layer) and
  // kept alongside the route so both TrackGuideScreen and SongScreen (which
  // needs the full album list for Previous/Next) can read it without each
  // re-fetching. Cleared whenever the route's era changes so a stale list
  // never renders while the new era's fetch is in flight.
  const [trackGuideTracks, setTrackGuideTracks] = useState<TrackNote[]>([]);
  // OS-033: the native moment detail sheet, reached via `?item=<id>` (the
  // `moment` route flag is on by default since OS-039 — see routes.ts).
  // Holds the id rather than a boolean since the sheet needs it to load the
  // moment.
  const [momentItemId, setMomentItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!trackGuideRoute) return;
    let cancelled = false;
    setTrackGuideTracks([]);
    loadTrackGuide(trackGuideRoute.eraId)
      .then((tracks) => {
        if (!cancelled) setTrackGuideTracks(tracks);
      })
      .catch((e) => {
        console.warn('loadTrackGuide failed', e instanceof Error ? e.message : e);
      });
    return () => {
      cancelled = true;
    };
  }, [trackGuideRoute?.eraId]);

  // OS-030: the single navigate(url) every entry point funnels
  // through — deep links, inbox rows, the web→native bridge, and (via
  // SiteShell's onShouldStart) in-WebView link clicks to native-capable
  // routes. `resolve()` already applies the per-screen feature flags, so
  // toggling one takes effect on the very next navigation with no rebuild.
  // OS-039: `era-stream`/`threads`/`community`/`merch`/`clownbot` no longer
  // get their own boolean — they ARE the five BottomTabBar tabs, so
  // resolving one of them just switches `activeTab` (closing every other
  // overlay first, same as every other branch here always has).
  const openNativeScreen = useCallback((screen: ScreenId, params: NativeParams = {}) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
    setLegalUrl(null);
    setLegalReturnTo(null);
    if (screen === 'settings') {
      setNotificationSettingsOpen(true);
    } else if (
      screen === 'era-stream' ||
      screen === 'threads' ||
      screen === 'community' ||
      screen === 'merch' ||
      screen === 'clownbot'
    ) {
      setActiveTab(screen === 'era-stream' ? 'era' : screen);
    } else if (screen === 'track-guide') {
      // routes.ts only resolves this screen when `params.eraId` is present
      // (see `paramsForDestination`/`destinationFor`'s track-guide arm) —
      // the fallback below is unreachable in practice, kept only so this
      // function never silently no-ops on a malformed call.
      if (params.eraId) setTrackGuideRoute({ screen: 'track-guide', eraId: params.eraId as EraId });
    } else if (screen === 'song') {
      const key = params.trackKey;
      if (!key) return;
      // The song screen also needs the resolved TrackNote (not just its
      // key) — `resolveTrackKey` needs the tracks provider wired first, so
      // this ensures the bundle is loaded before resolving. `loadTrackGuide`
      // (below, via the route-state effect) redundantly re-wires the same
      // provider for the era once `trackGuideRoute` is set, which is a
      // no-op past the first call (see track-guide-data.ts's `tracksWired`
      // guard) — cheap, and keeps this branch simple rather than needing
      // its own loading state.
      ensureTrackGuideWired()
        .then(() => {
          const resolved = resolveTrackKey(key);
          if (resolved) {
            setTrackGuideRoute({ screen: 'song', eraId: resolved.eraId, track: resolved.track });
          } else {
            console.warn('resolveTrackKey: unknown or stale song key', key);
          }
        })
        .catch((e) => {
          console.warn('ensureTrackGuideWired failed', e instanceof Error ? e.message : e);
        });
    } else if (screen === 'moment' && params.itemId) {
      setMomentItemId(params.itemId);
    } else {
      setInboxOpen(true);
    }
  }, []);

  // OS-039: a URL `resolve()` hands to `openWeb` is one of two things now —
  // a legal page (`/privacy`, `/terms`, `/support`), which the WebView still
  // renders, or anything else (a bare site root, an off-site URL, a stale
  // notification param with no native screen), which degrades to the
  // native home rather than ever loading the WebView on a non-legal route
  // (this card's own "done when": no route resolves to `web` except the
  // legal pages).
  const openWebUrl = useCallback((url: string) => {
    setNotificationSettingsOpen(false);
    setInboxOpen(false);
    setOnboardingOpen(false);
    setTrackGuideRoute(null);
    setMomentItemId(null);
    setLegalReturnTo(null);
    if (isLegalPageUrl(url, SITE_URL)) {
      setLegalUrl(url);
    } else {
      setLegalUrl(null);
      setActiveTab('era');
    }
  }, []);

  // App Store 5.1.1(i)/5.1.2(i): Settings → About and the Clownbot AI
  // disclosure open the legal pages through the same `openWebUrl` path.
  const openLegalPage = useCallback(
    (page: LegalPageId, returnTo: 'settings' | null) => {
      openWebUrl(legalPageUrl(page, SITE_URL));
      setLegalReturnTo(returnTo);
    },
    [openWebUrl],
  );

  const closeLegalPage = useCallback(() => {
    setLegalUrl(null);
    setLegalReturnTo(null);
    if (legalReturnTo === 'settings') setNotificationSettingsOpen(true);
  }, [legalReturnTo]);

  return {
    activeTab,
    setActiveTab,
    legalUrl,
    notificationSettingsOpen,
    setNotificationSettingsOpen,
    inboxOpen,
    setInboxOpen,
    onboardingOpen,
    setOnboardingOpen,
    trackGuideRoute,
    setTrackGuideRoute,
    trackGuideTracks,
    momentItemId,
    setMomentItemId,
    openNativeScreen,
    openWebUrl,
    openLegalPage,
    closeLegalPage,
  };
}

export type NativeScreenState = ReturnType<typeof useNativeScreenState>;
