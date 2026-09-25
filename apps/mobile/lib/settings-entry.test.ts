import { describe, expect, it, vi } from 'vitest';
import { openSettingsEntry } from './settings-entry';

function deps(hasOffered: () => Promise<boolean>) {
  return { hasOnboardingBeenOffered: hasOffered, openSettings: vi.fn(), openOnboarding: vi.fn() };
}

describe('openSettingsEntry — the settings button / bridge gate', () => {
  it('shows onboarding the first time, so push permission is actually offered', async () => {
    const d = deps(async () => false);
    await openSettingsEntry(d);
    expect(d.openOnboarding).toHaveBeenCalledTimes(1);
    expect(d.openSettings).not.toHaveBeenCalled();
  });

  it('goes straight to settings once onboarding has been offered', async () => {
    const d = deps(async () => true);
    await openSettingsEntry(d);
    expect(d.openSettings).toHaveBeenCalledTimes(1);
    expect(d.openOnboarding).not.toHaveBeenCalled();
  });

  it('falls back to settings if the offered flag cannot be read', async () => {
    const d = deps(async () => {
      throw new Error('secure store unavailable');
    });
    await openSettingsEntry(d);
    expect(d.openSettings).toHaveBeenCalledTimes(1);
    expect(d.openOnboarding).not.toHaveBeenCalled();
  });
});
