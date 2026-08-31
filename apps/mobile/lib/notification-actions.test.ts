import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-notifications', () => ({
  setNotificationCategoryAsync: vi.fn().mockResolvedValue(undefined),
}));

const fetchDevicePrefs = vi.fn();
const setCategoryCadence = vi.fn();

vi.mock('./prefs-client', () => ({
  fetchDevicePrefs: (...args: unknown[]) => fetchDevicePrefs(...args),
  setCategoryCadence: (...args: unknown[]) => setCategoryCadence(...args),
}));

import {
  handleNotificationAction,
  muteCategory,
  registerNotificationActions,
  undoMute,
} from './notification-actions';

describe('muteCategory / undoMute', () => {
  it('sets the category to off and reports the prior cadence for undo', async () => {
    fetchDevicePrefs.mockResolvedValue({
      settings: {},
      prefs: [{ category: 'song_drop', cadence: 'daily' }],
    });
    setCategoryCadence.mockResolvedValue({});

    const result = await muteCategory('song_drop');
    expect(setCategoryCadence).toHaveBeenCalledWith({ category: 'song_drop', cadence: 'off' });
    expect(result).toEqual({ category: 'song_drop', previousCadence: 'daily' });
  });

  it('ACCEPTANCE: undo restores the EXACT prior cadence, not a hardcoded default', async () => {
    setCategoryCadence.mockClear();
    await undoMute({ category: 'award_news', previousCadence: 'weekly' });
    expect(setCategoryCadence).toHaveBeenCalledWith({ category: 'award_news', cadence: 'weekly' });
  });

  it('defaults previousCadence to off when no persisted pref exists yet', async () => {
    fetchDevicePrefs.mockResolvedValue({ settings: {}, prefs: [] });
    setCategoryCadence.mockResolvedValue({});
    const result = await muteCategory('fan_merch');
    expect(result.previousCadence).toBe('off');
  });
});

describe('handleNotificationAction', () => {
  it('routes the mute action id to muteCategory', async () => {
    fetchDevicePrefs.mockResolvedValue({
      settings: {},
      prefs: [{ category: 'tour_news', cadence: 'instant' }],
    });
    setCategoryCadence.mockResolvedValue({});

    const outcome = await handleNotificationAction('mute-this-type', 'tour_news');
    expect(outcome).toEqual({
      kind: 'muted',
      result: { category: 'tour_news', previousCadence: 'instant' },
    });
  });

  it('routes the settings action id to open-settings', async () => {
    const outcome = await handleNotificationAction('open-settings', 'tour_news');
    expect(outcome).toEqual({ kind: 'open-settings', category: 'tour_news' });
  });

  it('returns null for an unrecognized action id (plain tap)', async () => {
    const outcome = await handleNotificationAction('some-other-id', 'tour_news');
    expect(outcome).toBeNull();
  });
});

describe('registerNotificationActions', () => {
  it('registers one Expo notification category per app category', async () => {
    const Notifications = await import('expo-notifications');
    await registerNotificationActions();
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalled();
    // 10 steady + 3 fun categories = 13 (ALL_NOTIFICATION_CATEGORIES).
    expect(vi.mocked(Notifications.setNotificationCategoryAsync).mock.calls.length).toBe(13);
  });
});
