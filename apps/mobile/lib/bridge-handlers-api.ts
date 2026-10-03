import { resErr, resOk } from '@swift2/ui';
import type { HandlerMap, ResResult } from '@swift2/ui';
import type { ApiResponse } from '@swift2/content';

// Native side of the `api` bridge command (One UI WP2.3-F1). Pure and
// transport-neutral: fetch, base URL and timers are injected, nothing here
// imports expo/* or the host wiring (F2, held until G0).
export const API_ALLOWLIST: readonly string[] = [
  'POST /api/intake',
  'POST /api/feedback',
  'POST /api/mood',
  'POST /api/submit-link',
];
export const MAX_API_BYTES = 256 * 1024;
export const API_TIMEOUT_MS = 8000;

const REQ_HEADERS = ['content-type', 'accept'];
const NETWORK_FAILURE: ApiResponse = { status: 0, headers: {}, body: '' };

export type ApiHandlerDeps = {
  fetch: typeof fetch;
  baseUrl: () => string;
  timeoutMs?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

const keepResponseHeader = (name: string) =>
  name === 'content-type' || name === 'retry-after' || name.startsWith('x-ratelimit-');

export function createHandlers(deps: ApiHandlerDeps): Pick<HandlerMap, 'api'> {
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  return {
    api: async (payload, ctx): Promise<ResResult<ApiResponse>> => {
      const req = payload?.req;
      if (!req || !API_ALLOWLIST.includes(`${req.method} ${req.path}`)) {
        return resErr('invalid', 'api endpoint not allowed');
      }
      if (req.body !== undefined && (typeof req.body !== 'string' || req.body.length > MAX_API_BYTES)) {
        return resErr('invalid', 'api body too large');
      }
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers ?? {})) {
        if (REQ_HEADERS.includes(k.toLowerCase()) && typeof v === 'string') headers[k.toLowerCase()] = v;
      }
      if (ctx.signal.aborted) return resErr('cancelled', 'cancelled');
      const ac = new AbortController();
      let timedOut = false;
      const onAbort = () => ac.abort();
      ctx.signal.addEventListener('abort', onAbort, { once: true });
      const timer = setTimer(() => {
        timedOut = true;
        ac.abort();
      }, deps.timeoutMs ?? API_TIMEOUT_MS);
      try {
        const res = await deps.fetch(deps.baseUrl() + req.path, {
          method: req.method,
          headers,
          body: req.body,
          credentials: 'omit',
          signal: ac.signal,
        });
        const text = await res.text();
        if (text.length > MAX_API_BYTES) return resErr('failed', 'api response too large');
        const out: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          const name = key.toLowerCase();
          if (keepResponseHeader(name)) out[name] = value;
        });
        return resOk({ status: res.status, headers: out, body: text });
      } catch {
        if (timedOut) return resErr('timeout', 'api request timed out');
        if (ctx.signal.aborted) return resErr('cancelled', 'cancelled');
        return resOk(NETWORK_FAILURE);
      } finally {
        clearTimer(timer);
        ctx.signal.removeEventListener('abort', onAbort);
      }
    },
  };
}
