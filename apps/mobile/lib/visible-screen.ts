// Which screen App.tsx shows, given its overlay state. App renders exactly
// one screen at a time, so when more than one overlay flag is set the order
// below decides which wins. Pure (no react-native imports) so the order is
// unit-tested.
//
// The inbox sits ABOVE settings: Settings → Inbox sets `inboxOpen` while
// settings stays open underneath, so the inbox shows and its Done button
// (which only clears `inboxOpen`) returns to Settings. With settings first,
// the Inbox link did nothing: settings stayed on top.

export interface OverlayState {
  settingsOpen: boolean;
  inboxOpen: boolean;
  trackGuideScreen: 'track-guide' | 'song' | null;
  momentOpen: boolean;
  onboardingOpen: boolean;
  legalOpen: boolean;
}

export type VisibleScreen =
  'inbox' | 'settings' | 'track-guide' | 'song' | 'moment' | 'onboarding' | 'legal' | 'home';

export function visibleScreen(s: OverlayState): VisibleScreen {
  if (s.inboxOpen) return 'inbox';
  if (s.settingsOpen) return 'settings';
  if (s.trackGuideScreen) return s.trackGuideScreen;
  if (s.momentOpen) return 'moment';
  if (s.onboardingOpen) return 'onboarding';
  if (s.legalOpen) return 'legal';
  return 'home';
}
