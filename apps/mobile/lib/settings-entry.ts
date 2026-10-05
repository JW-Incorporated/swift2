// The one gate every "open settings" entry point runs (the home top bar's
// Settings button, and the legacy web bridge's `openNotificationSettings`
// message). Notifications Phase 2 (NOTIFICATIONS_SPEC.md §7): the first
// time, show the pre-permission onboarding screen instead, so the user is
// actually offered push permission; after that, go straight to settings.
// Dependencies are injected so this stays a pure, vitest-runnable module.

export interface SettingsEntryDeps {
  hasOnboardingBeenOffered: () => Promise<boolean>;
  openSettings: () => void;
  openOnboarding: () => void;
}

export async function openSettingsEntry(deps: SettingsEntryDeps): Promise<void> {
  let offered: boolean;
  try {
    offered = await deps.hasOnboardingBeenOffered();
  } catch {
    // Secure store unavailable: never dead-end the tap, fall back to settings.
    deps.openSettings();
    return;
  }
  if (offered) deps.openSettings();
  else deps.openOnboarding();
}
