import { describe, expect, it, vi } from 'vitest';
import type { ApiRequest } from '@swift2/content';
import { resErr, resOk, type BridgeClient } from '@swift2/ui';
import { readClownStream, type ClownStreamEvent } from '../../../../packages/ui/src/reader/clown/lib/clown-stream';
import { fakeBody, session } from '../../lib/bridge-handlers-api-stream.test-kit';
import { createBridgeApiFetch, createBridgeApiStream } from './api-fetch';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const req = { method: 'POST', path: '/api/clown', body: '{}' } as ApiRequest;

// The real native handlers + dispatcher behind a fake client; an aborted call sends `cancel` for its command id, like the real client.
function rig(responses: (() => Response)[], dropReads = 0) {
  let drops = dropReads;
  const s = session(responses);
  const calls: string[] = [];
  const cancelTargets: string[] = [];
  const client = {
    call: (type: string, payload: { targetId?: string }, o?: { signal?: AbortSignal }) => {
      calls.push(type);
      if (type === 'cancel') {
        cancelTargets.push(payload.targetId as string);
        s.inflight.cancel(payload.targetId as string);
        return Promise.resolve(resOk(null));
      }
      const p = s.call(type, payload);
      const id = s.lastId();
      if (type === 'apiRead' && drops > 0) {
        drops -= 1;
        return p.then(() => resErr('timeout', 'result lost'));
      }
      o?.signal?.addEventListener('abort', () => s.inflight.cancel(id), { once: true });
      return p;
    },
  } as unknown as BridgeClient;
  const apiFetch = createBridgeApiFetch(client);
  return { ...s, calls, cancelTargets, apiStream: createBridgeApiStream(apiFetch) };
}

const line = (e: object) => `${JSON.stringify(e)}\n`;

describe('createBridgeApiStream (pull-based)', () => {
  it('readClownStream sees the investigation events live, before the final answer exists', async () => {
    const b = fakeBody();
    const r = rig([() => b.response]);
    const events: ClownStreamEvent[] = [];
    const done = readClownStream(r.apiStream(req), (e) => events.push(e));
    await flush();
    b.push(line({ type: 'investigation', step: 1 }));
    await vi.waitFor(() => expect(events).toHaveLength(1));
    b.push(line({ type: 'investigation', step: 2 }));
    await vi.waitFor(() => expect(events).toHaveLength(2));
    expect(events.map((e) => e.type)).toEqual(['investigation', 'investigation']);
    b.push(line({ type: 'answer', answer: { kind: 'take', segments: [] } }));
    b.end();
    await done;
    expect(events.map((e) => e.type)).toEqual(['investigation', 'investigation', 'answer']);
  });

  it('a non-2xx throws Error(status) like the web stream', async () => {
    const r = rig([() => fakeBody(429).response]);
    await expect(r.apiStream(req)[Symbol.asyncIterator]().next()).rejects.toThrow('429');
  });

  it('stopping the consumer early cancels the native stream', async () => {
    const b = fakeBody();
    const r = rig([() => b.response, () => fakeBody().response]);
    const it = r.apiStream(req)[Symbol.asyncIterator]();
    const first = it.next();
    await flush();
    b.push('a\n');
    expect(await first).toEqual({ done: false, value: 'a\n' });
    await it.return?.();
    await flush();
    expect(r.calls).toContain('cancel');
    expect(b.cancel).toHaveBeenCalled();
    expect(r.signals[0].aborted).toBe(true);
  });

  it('aborting the signal mid-read ends with AbortError and closes the stream', async () => {
    const b = fakeBody();
    const r = rig([() => b.response]);
    const ac = new AbortController();
    const it = r.apiStream(req, { signal: ac.signal })[Symbol.asyncIterator]();
    const pending = it.next();
    await flush();
    ac.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(b.cancel).toHaveBeenCalled();
  });

  it('an apiFetch that was not built by createBridgeApiFetch keeps the buffered fallback', async () => {
    const apiFetch = vi.fn(async () => ({ status: 200, headers: {}, body: 'whole' }));
    const out: string[] = [];
    for await (const c of createBridgeApiStream(apiFetch)(req)) out.push(c);
    expect(out).toEqual(['whole']);
  });

  it('T5: an apiRead timeout fails the stream: the generator throws after exactly one apiRead', async () => {
    const b = fakeBody();
    const r = rig([() => b.response], 1);
    b.push('one;');
    await expect(r.apiStream(req)[Symbol.asyncIterator]().next()).rejects.toThrow('timeout');
    expect(r.calls.filter((c) => c === 'apiRead')).toHaveLength(1);
  });

  it('T2: aborting the signal sends cancel for the stream before the next api call', async () => {
    const b = fakeBody();
    const r = rig([() => b.response, () => fakeBody().response]);
    const ac = new AbortController();
    const first = r.apiStream(req, { signal: ac.signal })[Symbol.asyncIterator]();
    const pending = first.next();
    await flush();
    b.push('x');
    await pending;
    ac.abort();
    void r.apiStream(req)[Symbol.asyncIterator]().next();
    const order = r.calls.filter((c) => c === 'cancel' || c === 'api');
    expect(order).toEqual(['api', 'cancel', 'api']);
    expect(r.cancelTargets[0]).toMatch(/^s/);
  });
});
