// Pure "what does Back do" for the native screens. Back closes the visible
// screen one level (song -> its track guide -> home); from the root (era) tab
// it is unhandled so Android can exit the app. Pure so the order is unit-tested.
import type { EraId } from '@swift2/experience';
import { visibleScreen, type OverlayState } from './visible-screen';

export interface BackState extends OverlayState {
  trackGuideEraId: EraId | null;
  activeTab: string;
}

export type BackAction =
  | { type: 'close-inbox' }
  | { type: 'close-settings' }
  | { type: 'song-to-track-guide'; eraId: EraId }
  | { type: 'close-track-guide' }
  | { type: 'close-moment' }
  | { type: 'close-onboarding' }
  | { type: 'close-legal' }
  | { type: 'go-home-tab' };

export function backAction(s: BackState): BackAction | null {
  switch (visibleScreen(s)) {
    case 'inbox':
      return { type: 'close-inbox' };
    case 'settings':
      return { type: 'close-settings' };
    case 'song':
      return s.trackGuideEraId ? { type: 'song-to-track-guide', eraId: s.trackGuideEraId } : { type: 'close-track-guide' };
    case 'track-guide':
      return { type: 'close-track-guide' };
    case 'moment':
      return { type: 'close-moment' };
    case 'onboarding':
      return { type: 'close-onboarding' };
    case 'legal':
      return { type: 'close-legal' };
    default:
      return s.activeTab === 'era' ? null : { type: 'go-home-tab' };
  }
}
