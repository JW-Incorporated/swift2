import { getEra } from '@swift2/experience';
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
  url?: string;
  pageTitle?: string;
  viewport?: string;
  userAgent?: string;
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
    url: host.currentUrl?.(),
    pageTitle: typeof document !== 'undefined' ? document.title : undefined,
    viewport:
      typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ts: new Date().toISOString(),
  };
}
