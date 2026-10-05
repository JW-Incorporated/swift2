// Notifications Phase 2 (NOTIFICATIONS_SPEC.md §7) — tracks whether the
// pre-permission onboarding screen has already been offered on this
// install, so App.tsx shows it at most once (a value-moment trigger that
// re-fires every time would be nagging, which spec §7's own "if denied: no
// nagging" principle rules out even before permission is asked).
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_OFFERED_KEY = 'longlive_notifications_onboarding_offered';

export async function hasOnboardingBeenOffered(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_OFFERED_KEY);
  return value === 'true';
}

/** Same notion of "undetermined" as the DOM offer: a real device whose OS permission is neither granted nor denied. */
export async function isPushPermissionUndetermined(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status !== 'granted' && status !== 'denied';
}

export async function markOnboardingOffered(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_OFFERED_KEY, 'true');
}
