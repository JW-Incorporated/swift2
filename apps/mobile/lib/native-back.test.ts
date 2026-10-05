import { describe, expect, it } from 'vitest';
import { backAction, type BackState } from './native-back';

const base: BackState = {
  settingsOpen: false,
  inboxOpen: false,
  trackGuideScreen: null,
  trackGuideEraId: null,
  momentOpen: false,
  onboardingOpen: false,
  legalOpen: false,
  activeTab: 'era',
};
const era = 'lover' as never;

describe('backAction', () => {
  it('song goes back to its track guide', () => {
    expect(backAction({ ...base, trackGuideScreen: 'song', trackGuideEraId: era })).toEqual({
      type: 'song-to-track-guide',
      eraId: era,
    });
  });
  it('track guide closes', () => {
    expect(backAction({ ...base, trackGuideScreen: 'track-guide', trackGuideEraId: era })).toEqual({
      type: 'close-track-guide',
    });
  });
  it('overlays close before anything else', () => {
    expect(backAction({ ...base, inboxOpen: true, settingsOpen: true })).toEqual({ type: 'close-inbox' });
    expect(backAction({ ...base, settingsOpen: true })).toEqual({ type: 'close-settings' });
    expect(backAction({ ...base, momentOpen: true })).toEqual({ type: 'close-moment' });
    expect(backAction({ ...base, onboardingOpen: true })).toEqual({ type: 'close-onboarding' });
    expect(backAction({ ...base, legalOpen: true })).toEqual({ type: 'close-legal' });
  });
  it('non-root tab returns to era; root tab is unhandled (app may exit)', () => {
    expect(backAction({ ...base, activeTab: 'threads' })).toEqual({ type: 'go-home-tab' });
    expect(backAction(base)).toBeNull();
  });
});
