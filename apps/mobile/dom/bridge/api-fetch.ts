import type { ApiFetch } from '@swift2/content';
import { bufferedFrom, type ApiStream, type BridgeClient } from '@swift2/ui';

// DOM side of the `api` bridge command (H2): the host adapter's `apiFetch`/`apiStream`
// for the app DOM page, a null origin where relative fetch cannot reach /api. Allowlist,
// body/response caps and per-endpoint timeouts (apiCommandTimeout) are enforced by the
// client and the native handler; this only adapts shapes.
const HEADERS = ['accept', 'accept-language', 'content-language', 'content-type'] as const;

export function createBridgeApiFetch(client: Pick<BridgeClient, 'call'>): ApiFetch {
  return async (req, opts) => {
    const headers: Partial<Record<(typeof HEADERS)[number], string>> = {};
    for (const [k, v] of Object.entries(req.headers ?? {})) {
      const name = k.toLowerCase() as (typeof HEADERS)[number];
      if (HEADERS.includes(name)) headers[name] = v;
    }
    const r = await client.call(
      'api',
      { req: { method: req.method, path: req.path, ...(req.body !== undefined ? { body: req.body } : {}), ...(Object.keys(headers).length ? { headers } : {}) } },
      opts?.signal ? { signal: opts.signal } : undefined,
    );
    if (r.ok) return r.value;
    if (r.error.code === 'cancelled') throw new DOMException('aborted', 'AbortError');
    throw new Error(`api ${r.error.code}: ${r.error.message}`);
  };
}

/** The bridge returns whole bodies (the native reader is capped, not streamed), so ClownChat gets the buffered fallback. */
export function createBridgeApiStream(apiFetch: ApiFetch): ApiStream {
  return bufferedFrom(apiFetch);
}
