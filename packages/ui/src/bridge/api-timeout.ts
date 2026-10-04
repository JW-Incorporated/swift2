// Single source of truth for per-endpoint `api` command timeouts. Used by the
// DOM client, the native in-flight dispatcher and the native api handler so the
// three layers never disagree (the wire envelope is unchanged).
export const API_TIMEOUT_MS = 8000;
// ClownChat streams a model answer; OS-036 gives clown endpoints 60 s.
export const CLOWN_TIMEOUT_MS = 60_000;
const ENDPOINT_TIMEOUTS: Readonly<Record<string, number>> = { 'POST /api/clown': CLOWN_TIMEOUT_MS };

export function apiTimeoutFor(method: unknown, path: unknown): number {
  return ENDPOINT_TIMEOUTS[`${String(method)} ${String(path)}`] ?? API_TIMEOUT_MS;
}

/** Timeout for a whole `api` command payload (`{ req: { method, path } }`); default when malformed. */
export function apiCommandTimeout(payload: unknown): number {
  const req = (payload as { req?: { method?: unknown; path?: unknown } } | null | undefined)?.req;
  return apiTimeoutFor(req?.method, req?.path);
}
