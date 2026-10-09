import { API_TIMEOUT_MS, CLOWN_TIMEOUT_MS, apiTimeoutFor, resErr, resOk } from '@swift2/ui';
import type { ApiStreamHead, HandlerMap, ResResult } from '@swift2/ui';
import type { ApiResponse } from '@swift2/content';
import { createStreamTable } from './bridge-handlers-api-stream';

// Native side of the `api` bridge command (One UI WP2.3-F1). Pure and
// transport-neutral: fetch, base URL and timers are injected, nothing here
// imports expo/* or the host wiring (F2, held until G0).
export const API_ALLOWLIST: readonly string[] = [
  'POST /api/intake',
  'POST /api/feedback',
  'POST /api/mood',
  'POST /api/submit-link',
  'POST /api/clown',
  'GET /api/notifications/inbox',
];
export const MAX_API_BYTES = 256 * 1024;
export { API_TIMEOUT_MS, CLOWN_TIMEOUT_MS };
const CLOWN_ENDPOINTS: readonly string[] = ['POST /api/clown'];

const REQ_HEADERS = ['content-type', 'accept'];
const NETWORK_FAILURE: ApiResponse = { status: 0, headers: {}, body: '' };

export type ApiHandlerDeps = {
  /** Must expose res.body as a ReadableStream: expo/fetch, not RN global fetch. */
  fetch: typeof fetch;
  baseUrl: () => string;
  timeoutMs?: number;
  clownTimeoutMs?: number;
  /** Native-held ClownChat session (OS-036). */
  clownSession?: {
    get: () => Promise<string | null>;
    set: (token: string) => Promise<void>;
  };
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

const keepResponseHeader = (name: string) =>
  name === 'content-type' || name === 'retry-after' || name.startsWith('x-ratelimit-');

function pickHeaders(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    if (keepResponseHeader(name)) out[name] = value;
  });
  return out;
}

const UNREADABLE = Symbol('unreadable');

/**
 * Reads the body with a byte cap, streaming only (res.body.getReader()):
 * counts Uint8Array bytes and stops (null) once the cap is exceeded or the
 * request was aborted. A response with no stream body is refused (UNREADABLE):
 * RN's global fetch never exposes res.body, so F2 must inject expo/fetch,
 * which streams on iOS and Android. No arrayBuffer() fallback: it would buffer
 * the whole body before any cap applies.
 */
async function readCapped(
  res: Response,
  signal: AbortSignal,
  setReader: (r: ReadableStreamDefaultReader<Uint8Array>) => void,
): Promise<string | null | typeof UNREADABLE> {
  const reader = res.body?.getReader?.();
  if (!reader) return UNREADABLE;
  setReader(reader);
  const dec = new TextDecoder();
  let total = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (signal.aborted) return null;
      if (done) return text + dec.decode();
      total += value.byteLength;
      if (total > MAX_API_BYTES) {
        void reader.cancel().catch(() => {});
        return null;
      }
      text += dec.decode(value, { stream: true });
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* a pending read after cancel can make releaseLock throw */
    }
  }
}

export function createHandlers(deps: ApiHandlerDeps): Pick<HandlerMap, 'api' | 'apiRead'> {
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const streams = createStreamTable({ maxBytes: MAX_API_BYTES, setTimer, clearTimer });
  return {
    apiRead: (payload, ctx) => streams.read(payload.streamId, ctx.signal),
    api: async (payload, ctx): Promise<ResResult<ApiResponse | ApiStreamHead>> => {
      const req = payload?.req;
      if (!req || !API_ALLOWLIST.includes(`${req.method} ${req.path}`)) {
        return resErr('invalid', 'api endpoint not allowed');
      }
      if (req.body !== undefined && (typeof req.body !== 'string' || new TextEncoder().encode(req.body).byteLength > MAX_API_BYTES)) {
        return resErr('invalid', 'api body too large');
      }
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers ?? {})) {
        if (REQ_HEADERS.includes(k.toLowerCase()) && typeof v === 'string') headers[k.toLowerCase()] = v;
      }
      const isClown = CLOWN_ENDPOINTS.includes(`${req.method} ${req.path}`);
      const wantStream = payload.stream === true;
      if (wantStream && !isClown) return resErr('invalid', 'api stream not allowed');
      if (ctx.signal.aborted) return resErr('cancelled', 'cancelled');
      const reserved = wantStream && streams.reserve();
      if (wantStream && !reserved) return resErr('invalid', 'a stream is already open');
      let handedOver = false;
      let openedId = '';
      const ac = new AbortController();
      let activeReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      const cancelAll = () => {
        ac.abort();
        void activeReader?.cancel().catch(() => {});
      };
      let settleAbort: (r: ResResult<ApiResponse>) => void = () => {};
      const aborted = new Promise<ResResult<ApiResponse>>((r) => (settleAbort = r));
      // Only an external cancel or the timeout answers here; our own over-limit abort is answered by run().
      const onAbort = () => {
        cancelAll();
        settleAbort(resErr('cancelled', 'cancelled'));
      };
      ctx.signal.addEventListener('abort', onAbort, { once: true });
      // Once a stream is handed over, this same timer is its total deadline (CLOWN_TIMEOUT_MS from request start).
      let onTimeout = () => {
        cancelAll();
        settleAbort(resErr('timeout', 'api request timed out'));
      };
      const timer = setTimer(() => onTimeout(), isClown ? (deps.clownTimeoutMs ?? apiTimeoutFor(req.method, req.path)) : (deps.timeoutMs ?? apiTimeoutFor(req.method, req.path)));
      const run = async (): Promise<ResResult<ApiResponse | ApiStreamHead>> => {
        try {
          // Added natively AFTER sanitization: a page-supplied authorization never survives.
          if (isClown && deps.clownSession) {
            const token = await deps.clownSession.get().catch(() => null);
            if (token) headers.authorization = `Bearer ${token}`;
          }
          const res = await deps.fetch(deps.baseUrl() + req.path, {
            method: req.method,
            headers,
            body: req.body,
            credentials: 'omit',
            redirect: 'error',
            signal: ac.signal,
          });
          // Persist on ANY response carrying the header (status-agnostic, do not gate on res.ok): the server only
          // emits X-Clown-Session after resolveClownSession already consumed our refresh token via Supabase
          // rotation (apps/web/app/api/clown/route.ts:284-298, clown-session.ts:102), so the header is always a
          // fresh mint; dropping it would leave a rotated-out token and trip refresh-token reuse detection.
          // Persisted at headers, before the body read, so a failed stream cannot strand it.
          if (isClown && deps.clownSession) {
            const refreshed = res.headers.get('x-clown-session');
            if (refreshed) await deps.clownSession.set(refreshed).catch(() => {});
          }
          const len = Number(res.headers.get('content-length'));
          if (Number.isFinite(len) && len > MAX_API_BYTES) {
            ac.abort();
            return resErr('failed', 'api response too large');
          }
          if (wantStream) {
            const reader = res.body?.getReader?.();
            if (!reader) {
              ac.abort();
              return resErr('failed', 'api response not readable');
            }
            const head = pickHeaders(res);
            if (res.status < 200 || res.status >= 300 || ctx.signal.aborted) {
              ac.abort();
              void reader.cancel().catch(() => {});
              return ctx.signal.aborted ? resErr('cancelled', 'cancelled') : resOk({ status: res.status, headers: head, body: '' });
            }
            const opened = streams.open({ reader, abort: () => ac.abort(), own: ctx.own, alias: ctx.id, onEnd: () => clearTimer(timer) });
            onTimeout = opened.expire;
            handedOver = true;
            openedId = opened.id;
            return resOk({ status: res.status, headers: head, streamId: opened.id });
          }
          const text = await readCapped(res, ac.signal, (r) => (activeReader = r));
          if (text === UNREADABLE) {
            ac.abort();
            return resErr('failed', 'api response not readable');
          }
          if (text === null) {
            cancelAll();
            return resErr('failed', 'api response too large');
          }
          return resOk({ status: res.status, headers: pickHeaders(res), body: text });
        } catch {
          return resOk(NETWORK_FAILURE);
        }
      };
      try {
        return await Promise.race([run(), aborted]);
      } finally {
        if (reserved && !handedOver) streams.unreserve();
        // A cancel or timeout that settled this command after the stream opened means the DOM never sees the head.
        if (handedOver && ctx.signal.aborted) streams.close(openedId);
        if (!handedOver) clearTimer(timer);
        ctx.signal.removeEventListener('abort', onAbort);
      }
    },
  };
}
