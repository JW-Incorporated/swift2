// OS-036 — native Clownbot identity carrier.
//
// `apps/web`'s browser round-trips the Clownbot memory session via an
// `HttpOnly` cookie (see `apps/web/lib/longlive/clown-session.ts`'s header);
// a bare React Native `fetch` has no cookie jar to store or resend a
// `Set-Cookie` header for, so the native app instead persists the SAME
// encoded token (the base64 `{a, r}` shape `encodeSessionToken`/
// `decodeSessionToken` already define — this module never re-derives that
// format, only stores/retrieves the opaque string) in `expo-secure-store`
// and resends it as a `Bearer` credential on every `/api/clown` call
// (`clown-client.ts`). The server route accepts either transport — see
// `apps/web/app/api/clown/route.ts`'s "OS-036" comment.
//
// Same persistence primitive `device-id.ts` already uses for the anonymous
// device id — Keychain / EncryptedSharedPreferences, survives app updates,
// not uninstall/reinstall (an acceptable, already-precedented tradeoff for
// an anonymous identity).
import * as SecureStore from 'expo-secure-store';

const CLOWN_SESSION_TOKEN_KEY = 'longlive_clown_session_token';

/** The current stored session token, or `null` if this device has never
 * held one (first Clownbot message, or the store was cleared). */
export async function getStoredClownSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLOWN_SESSION_TOKEN_KEY);
}

/** Persists a fresh/refreshed token — called after every `/api/clown`
 * response that carries one (see `clown-client.ts`'s response header read).
 * A response with no token (memory system not yet toggled on server-side;
 * see `clown-session.ts`'s header) leaves whatever was previously stored
 * untouched — same "degrade silently, never crash" posture the web cookie
 * carries. */
export async function setStoredClownSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CLOWN_SESSION_TOKEN_KEY, token);
}

/** Test/debug only — never called from app code. */
export async function clearClownSessionTokenForTests(): Promise<void> {
  await SecureStore.deleteItemAsync(CLOWN_SESSION_TOKEN_KEY);
}
