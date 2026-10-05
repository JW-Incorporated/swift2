// One shared, memoized cold-start registration. App.tsx kicks it off at launch and the prefs client awaits it before
// any /api/devices/:id/prefs call, so a first-run onboarding write can never reach the server ahead of the device row
// (which would 404). Built on registerDevice() and therefore on the registration queue; a failure clears the memo so
// the next caller re-attempts instead of inheriting a stale rejection.
import { registerDevice } from './push-registration';

let inflight: Promise<string> | null = null;

export function ensureDeviceRegistered(): Promise<string> {
  if (!inflight) {
    const attempt = registerDevice().then((r) => r.deviceId);
    inflight = attempt;
    attempt.catch(() => {
      if (inflight === attempt) inflight = null;
    });
  }
  return inflight;
}

export function resetEnsureDeviceRegisteredForTests(): void {
  inflight = null;
}
