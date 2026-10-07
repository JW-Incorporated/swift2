// The one place the mobile app's API host is decided. Every API client
// imports `apiBaseUrl()` from here — never re-derive it locally.
export const DEFAULT_API_BASE_URL = 'https://www.longlivets.com';

export function apiBaseUrl(): string {
  // Expo inlines EXPO_PUBLIC_* only for this literal member access — don't
  // destructure or index dynamically. `||` (not `??`) so an empty string
  // falls back to the default too.
  return (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}
