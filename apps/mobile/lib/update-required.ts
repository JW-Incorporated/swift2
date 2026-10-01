// Dormant forced-update gate (docs/mobile-release.md "Forcing an update").
// Pure logic: never locks a user out on missing information.
import * as Application from 'expo-application';

export const IOS_STORE_URL = 'https://apps.apple.com/app/id6807657306';
export const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.jwlabs.longlive';

export interface UpdateRequiredInput {
  platform: string;
  nativeBuild: number | null;
  minNativeBuild?: { ios?: number; android?: number };
}

export function isUpdateRequired({
  platform,
  nativeBuild,
  minNativeBuild,
}: UpdateRequiredInput): boolean {
  if (!minNativeBuild) return false;
  if (platform !== 'ios' && platform !== 'android') return false;
  const min = minNativeBuild[platform];
  if (typeof min !== 'number' || Number.isNaN(min)) return false;
  if (nativeBuild === null || Number.isNaN(nativeBuild)) return false;
  return nativeBuild < min;
}

export function storeUrlFor(platform: string): string {
  return platform === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
}

/** The installed native build number, or null when unavailable/unparsable. */
export function currentNativeBuild(): number | null {
  const raw = Application.nativeBuildVersion;
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}
