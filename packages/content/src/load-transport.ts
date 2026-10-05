/** Transport helpers for `load.ts` (split out for the 300-line limit): timed fetch, JSON body read, URL join. */
import { TransportError, type FetchLike, type FetchResponseLike } from './load-types';

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Calls `fetchImpl`, converting a network-level throw (offline, DNS, timeout) into a `TransportError` so callers can distinguish it from a data problem in an otherwise-successful response. */
export async function transportFetch(
  fetchImpl: FetchLike,
  url: string,
  init?: { headers?: Record<string, string> },
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<FetchResponseLike> {
  // setTimeout + AbortController, not AbortSignal.timeout (not guaranteed on Hermes). The race
  // rejects even if the fetch implementation ignores the signal. The timer stays armed through
  // the body read (res.text()) and is cleared only once the body is fully read.
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  timedOut.catch(() => {});
  const fail = (err: unknown): never => {
    clearTimeout(timer);
    throw new TransportError(`Network request to ${url} failed`, err);
  };
  let res: FetchResponseLike;
  try {
    res = await Promise.race([
      fetchImpl(url, controller ? { ...init, signal: controller.signal } : init),
      timedOut,
    ]);
  } catch (err) {
    return fail(err);
  }
  if (!res.ok) {
    clearTimeout(timer);
    return res;
  }
  return {
    ok: res.ok,
    status: res.status,
    headers: res.headers,
    text: async () => {
      try {
        const body = await Promise.race([res.text(), timedOut]);
        clearTimeout(timer);
        return body;
      } catch (err) {
        return fail(err);
      }
    },
  };
}

/** Reads and JSON-parses a response body. A malformed body is a DATA problem (the server was reached, it just returned garbage) — never converted to `TransportError`, so it is never masked by the stale-while-revalidate fallback. */
export async function readJson<T>(res: FetchResponseLike): Promise<T> {
  const text = await res.text();
  return JSON.parse(text) as T;
}
