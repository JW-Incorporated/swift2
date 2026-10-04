import type { ApiFetch, ApiRequest } from '@swift2/content';
import { bufferedFrom, type ApiStream, type BridgeClient } from '@swift2/ui';

// DOM side of the `api` bridge command (H2): the host adapter's `apiFetch`/`apiStream`
// for the app DOM page, a null origin where relative fetch cannot reach /api. Allowlist,
// body/response caps and per-endpoint timeouts (apiCommandTimeout) are enforced by the
// client and the native handler; this only adapts shapes.
const HEADERS = ['accept', 'accept-language', 'content-language', 'content-type'] as const;

type Client = Pick<BridgeClient, 'call'>;
// createBridgeApiStream takes the apiFetch it is paired with (the reader-modules call site is unchanged) and finds its client here.
const READ_RETRIES = 2;
const clientOf = new WeakMap<ApiFetch, Client>();

const failure = (e: { code: string; message: string }) =>
  e.code === 'cancelled' ? new DOMException('aborted', 'AbortError') : new Error(`api ${e.code}: ${e.message}`);

function bridgeReq(req: ApiRequest) {
  const headers: Partial<Record<(typeof HEADERS)[number], string>> = {};
  for (const [k, v] of Object.entries(req.headers ?? {})) {
    const name = k.toLowerCase() as (typeof HEADERS)[number];
    if (HEADERS.includes(name)) headers[name] = v;
  }
  return { method: req.method, path: req.path, ...(req.body !== undefined ? { body: req.body } : {}), ...(Object.keys(headers).length ? { headers } : {}) };
}

export function createBridgeApiFetch(client: Client): ApiFetch {
  const apiFetch: ApiFetch = async (req, opts) => {
    const r = await client.call('api', { req: bridgeReq(req) }, opts?.signal ? { signal: opts.signal } : undefined);
    if (!r.ok) throw failure(r.error);
    if (!('body' in r.value)) throw new Error('api failed: unexpected stream head');
    return r.value;
  };
  clientOf.set(apiFetch, client);
  return apiFetch;
}

/**
 * Pull-based stream over the bridge (W6-stream): `api { stream: true }` answers at headers, then this loops
 * `apiRead` for decoded chunks. A non-2xx or a head without a streamId is the buffered shape (whole body once).
 * An apiFetch not made by createBridgeApiFetch has no client here and keeps the buffered fallback.
 */
export function createBridgeApiStream(apiFetch: ApiFetch): ApiStream {
  const client = clientOf.get(apiFetch);
  if (!client) return bufferedFrom(apiFetch);
  return async function* bridgeStream(req, opts) {
    const signal = opts?.signal ? { signal: opts.signal } : undefined;
    const head = await client.call('api', { req: bridgeReq(req), stream: true }, signal);
    if (!head.ok) throw failure(head.error);
    const { status } = head.value;
    if (!('streamId' in head.value)) {
      if (status < 200 || status >= 300) throw new Error(String(status));
      yield head.value.body;
      return;
    }
    const { streamId } = head.value;
    let finished = false;
    let seq = 0;
    try {
      if (status < 200 || status >= 300) throw new Error(String(status));
      while (!finished) {
        if (opts?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
        seq += 1;
        // A timeout may be a lost result: re-ask the same seq (native replays it, so no bytes are skipped).
        let r = await client.call('apiRead', { streamId, seq }, signal);
        for (let retry = 0; !r.ok && r.error.code === 'timeout' && retry < READ_RETRIES; retry++) r = await client.call('apiRead', { streamId, seq }, signal);
        if (!r.ok) throw failure(r.error);
        finished = r.value.done;
        if (r.value.chunk) yield r.value.chunk;
      }
    } finally {
      if (!finished) void client.call('cancel', { targetId: streamId });
    }
  };
}
