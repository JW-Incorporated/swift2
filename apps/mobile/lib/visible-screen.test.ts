import { describe, expect, it } from 'vitest';
import { visibleScreen, type OverlayState } from './visible-screen';

const NONE: OverlayState = {
  settingsOpen: false,
  inboxOpen: false,
  trackGuideScreen: null,
  momentOpen: false,
  onboardingOpen: false,
  legalOpen: false,
};

describe('visibleScreen — which screen App.tsx renders', () => {
  it('shows the native home when no overlay is open', () => {
    expect(visibleScreen(NONE)).toBe('home');
  });

  it('Settings → Inbox shows the inbox (regression: settings used to stay on top)', () => {
    const settings = { ...NONE, settingsOpen: true };
    expect(visibleScreen(settings)).toBe('settings');
    // NotificationSettingsScreen's Inbox link only sets inboxOpen.
    const inboxFromSettings = { ...settings, inboxOpen: true };
    expect(visibleScreen(inboxFromSettings)).toBe('inbox');
    // The inbox's Done only clears inboxOpen, which lands back on Settings.
    expect(visibleScreen({ ...inboxFromSettings, inboxOpen: false })).toBe('settings');
  });

  it('shows each overlay on its own', () => {
    expect(visibleScreen({ ...NONE, trackGuideScreen: 'track-guide' })).toBe('track-guide');
    expect(visibleScreen({ ...NONE, trackGuideScreen: 'song' })).toBe('song');
    expect(visibleScreen({ ...NONE, momentOpen: true })).toBe('moment');
    expect(visibleScreen({ ...NONE, onboardingOpen: true })).toBe('onboarding');
    expect(visibleScreen({ ...NONE, legalOpen: true })).toBe('legal');
  });

  it('keeps the remaining order: settings over onboarding over a legal page', () => {
    expect(visibleScreen({ ...NONE, settingsOpen: true, onboardingOpen: true })).toBe('settings');
    expect(visibleScreen({ ...NONE, onboardingOpen: true, legalOpen: true })).toBe('onboarding');
  });
});
