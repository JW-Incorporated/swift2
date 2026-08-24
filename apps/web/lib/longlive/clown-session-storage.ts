/**
 * Clownbot session-token persistence (HUMAN-ACTIONS.md #15 item 3 fix) — a
 * small localStorage-backed store, mirroring `progress.ts`'s SSR-safe
 * read/write pattern (that file's own header explains the same posture in
 * more detail).
 *
 * The token lived only in a `ClownChat` component ref before this fix, so
 * switching UI modes (which unmounts `ClownChat` — `LongLive.tsx`) or
 * reloading the page lost it, minting a fresh anonymous identity every time
 * and resetting both conversation continuity and the per-user daily cap.
 * The token itself is already just an opaque base64 string
 * (`clown-session.ts`'s `encodeSessionToken`/`decodeSessionToken`) — safe to
 * store client-side the same way any other UI state persists across reloads
 * in this app. This is NOT the message transcript: `store.tsx`'s
 * `clownMessages` stays deliberately in-memory only (see that file's own
 * header) — this module holds nothing but the opaque identity token.
 */

export const CLOWN_SESSION_STORAGE_KEY = 'll-clown-session-v1';

/** Read the persisted token. Safe everywhere: on the server, in private
 * mode, or with a corrupted/empty value it returns `null` instead of
 * throwing — same defensive posture as `progress.ts`'s `readStoredProgress`. */
export function readStoredClownSessionToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(CLOWN_SESSION_STORAGE_KEY);
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

/** Persist (or clear, on `null`) the token. Best-effort — storage failures
 * are silently ignored; the session still works for the rest of the page
 * load, it just won't survive a reload. */
export function writeStoredClownSessionToken(token: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(CLOWN_SESSION_STORAGE_KEY, token);
    else window.localStorage.removeItem(CLOWN_SESSION_STORAGE_KEY);
  } catch {
    /* private mode / quota — the session still works, it just won't persist */
  }
}
