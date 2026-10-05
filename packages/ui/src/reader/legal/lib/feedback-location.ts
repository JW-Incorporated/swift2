import { getEra } from '@swift2/experience';
import { inAppPlatformFromUserAgent } from '../../lib/in-app';
import type { useHost } from '../../../host';
import type { useAppState } from '../../store';

type AppState = ReturnType<typeof useAppState>;
type Host = ReturnType<typeof useHost>;

export type Location = {
  eraId?: string;
  eraName?: string;
  mode?: string;
  view?: string;
  openMomentId?: string | null;
  openTrackKey?: string | null;
  trackGuideEraId?: string | null;
  theoryGuideEraId?: string | null;
  lensId?: string | null;
  /** Page path only — never the query string or hash. */
  path?: string;
  pageTitle?: string;
  viewport?: string;
  /** Coarse label ("iOS app", "Android app", "web: mobile|desktop") — never the raw user-agent. */
  platform?: string;
  ts?: string;
};

/** Human-readable description of the current view for the ticket. */
export function describeView(state: AppState): string {
  if (state.openItemId) return `moment detail (${state.openItemId})`;
  if (state.openTrackKey) return `track detail (${state.openTrackKey})`;
  if (state.trackGuideEraId) return `track guide (${state.trackGuideEraId})`;
  if (state.theoryGuideEraId) return `theories/eggs (${state.theoryGuideEraId})`;
  if (state.searchOpen) return 'search';
  if (state.mode === 'threads') return state.lensId ? `thread: ${state.lensId}` : 'threads gallery';
  return 'era stream';
}

/** Path of a URL with the query string and hash dropped (they can carry personal values). */
export function pathOnly(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let rest = url.trim();
  const scheme = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(rest);
  if (scheme) rest = rest.slice(scheme[0].length);
  rest = rest.split('#')[0]!.split('?')[0]!;
  return rest.startsWith('/') ? rest : `/${rest}`;
}

export function platformLabel(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const app = inAppPlatformFromUserAgent(navigator.userAgent);
  if (app) return app === 'ios' ? 'iOS app' : 'Android app';
  if (typeof window === 'undefined') return undefined;
  return window.innerWidth < 768 ? 'web: mobile' : 'web: desktop';
}

export function buildLocation(state: AppState, host: Host): Location {
  let eraName: string | undefined;
  try {
    eraName = getEra(state.eraId)?.name;
  } catch {
    eraName = undefined;
  }
  return {
    eraId: state.eraId,
    eraName,
    mode: state.mode,
    view: describeView(state),
    openMomentId: state.openItemId,
    openTrackKey: state.openTrackKey,
    trackGuideEraId: state.trackGuideEraId,
    theoryGuideEraId: state.theoryGuideEraId,
    lensId: state.lensId,
    path: pathOnly(host.currentUrl?.()),
    pageTitle: typeof document !== 'undefined' ? document.title : undefined,
    viewport:
      typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : undefined,
    platform: platformLabel(),
    ts: new Date().toISOString(),
  };
}
