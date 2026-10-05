// Single source of truth for per-endpoint `api` command timeouts. Used by the
// DOM client, the native in-flight dispatcher and the native api handler so the
// three layers never disagree (the wire envelope is unchanged).
export const API_TIMEOUT_MS = 8000;
// ClownChat streams a model answer; OS-036 gives clown endpoints 60 s.
export const CLOWN_TIMEOUT_MS = 60_000;
// Streamed `api` (pull-based, W6-stream). One `apiRead` long-polls at most this long, then answers an empty
// not-done chunk (hedge: may drop to 250 ms if native actions turn out serialized). Chunks stay well inside
// MAX_PAYLOAD_SIZE after JSON escaping (32 KB of control chars escapes to 192 KB); unread bytes stop the native reader at the buffer cap.
export const API_STREAM_POLL_MS = 1000;
export const API_STREAM_CHUNK_BYTES = 32 * 1024;
export const API_STREAM_BUFFER_BYTES = 64 * 1024;
const ENDPOINT_TIMEOUTS: Readonly<Record<string, number>> = { 'POST /api/clown': CLOWN_TIMEOUT_MS };

export function apiTimeoutFor(method: unknown, path: unknown): number {
  return ENDPOINT_TIMEOUTS[`${String(method)} ${String(path)}`] ?? API_TIMEOUT_MS;
}

/** Timeout for a whole `api` command payload (`{ req: { method, path } }`); default when malformed. */
export function apiCommandTimeout(payload: unknown): number {
  const req = (payload as { req?: { method?: unknown; path?: unknown } } | null | undefined)?.req;
  return apiTimeoutFor(req?.method, req?.path);
}
