// #5139: a live deep link that arrives while Recovery is up is retained (latest wins) and survives the Retry reload,
// which wipes the in-memory tap queue. Persisted only by Retry, replayed once on the next launch, and dropped when stale.

export const RETAINED_LINK_KEY = 'longlive_retained_link_v1';
/** A retained link older than this at replay time is discarded: never navigate to something the user has forgotten. */
export const RETAINED_LINK_TTL_MS = 2 * 60 * 1000;

export interface RetainedLink {
  url: string;
  at: number;
}

// Lazy: the intake hook is imported by pure tests that must not load the native module.
const secureStore = () => import('expo-secure-store');

let latest: RetainedLink | null = null;

/** Most recent live link wins. */
export function noteLiveLink(url: string, at: number): void {
  latest = { url, at };
}

export function currentRetainedLink(): RetainedLink | null {
  return latest;
}

export function resetRetainedLink(): void {
  latest = null;
}

export function serializeRetained(link: RetainedLink): string {
  return JSON.stringify(link);
}

/** Strict parse + freshness check; anything malformed, future-dated or older than the TTL yields null. */
export function parseFreshRetained(raw: string | null, now: number, ttlMs: number = RETAINED_LINK_TTL_MS): string | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<RetainedLink> | null;
    if (!v || typeof v.url !== 'string' || typeof v.at !== 'number' || !Number.isFinite(v.at)) return null;
    const age = now - v.at;
    return age >= 0 && age <= ttlMs ? v.url : null;
  } catch {
    return null;
  }
}

/** Called by Retry before the reload. Best effort: a failed write only loses the link, never blocks Retry. */
export async function persistRetainedLink(): Promise<void> {
  if (!latest) return;
  try {
    await (await secureStore()).setItemAsync(RETAINED_LINK_KEY, serializeRetained(latest));
  } catch {
    // Retry proceeds without the link
  }
}

/** Read-and-delete: a retained link replays at most once. */
export async function takeRetainedLink(now: number = Date.now()): Promise<string | null> {
  try {
    const raw = await (await secureStore()).getItemAsync(RETAINED_LINK_KEY);
    if (raw === null) return null;
    await (await secureStore()).deleteItemAsync(RETAINED_LINK_KEY);
    return parseFreshRetained(raw, now);
  } catch {
    return null;
  }
}
