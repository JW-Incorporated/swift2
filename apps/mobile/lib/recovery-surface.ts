// Which non-DOM surface mounts. Interim rule until the legacy-deletion PR removes the kill switch:
// an explicit flag-off launch keeps the legacy native router; every watchdog outcome (strike,
// fallback, quarantine, pending expiry, failed attempt) gets the Recovery screen.
import type { MountState } from './watchdog-gate';
import type { NativeReason } from './watchdog-policy';

export type NativeSurface = 'legacy' | 'recovery';

export function nativeSurface(mount: MountState, reason: NativeReason | null): NativeSurface | null {
  if (mount !== 'native') return null;
  return reason === 'flag-off' ? 'legacy' : 'recovery';
}
