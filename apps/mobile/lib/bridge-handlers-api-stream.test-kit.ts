import { vi } from 'vitest';
import type { ResResult } from '@swift2/ui';
import { createHandlers } from './bridge-handlers-api';
import { createInflight } from './bridge-host-inflight';

const enc = new TextEncoder();

/** A hand-fed response body: `push`/`end` deliver to the reader; `reads` counts reader.read() calls. */
export function fakeBody(status = 200, headers: Record<string, string> = { 'content-type': 'application/x-ndjson' }) {
  const q: ReadableStreamReadResult<Uint8Array>[] = [];
  let waiter: ((v: ReadableStreamReadResult<Uint8Array>) => void) | null = null;
  const deliver = (v: ReadableStreamReadResult<Uint8Array>) => {
    if (waiter) {
      const w = waiter;
      waiter = null;
      w(v);
    } else q.push(v);
  };
  let reject: ((e: Error) => void) | null = null;
  const reads = vi.fn();
  const cancel = vi.fn(async () => deliver({ done: true, value: undefined }));
  const reader = {
    read: () => {
      reads();
      const next = q.shift();
      return next ? Promise.resolve(next) : new Promise<ReadableStreamReadResult<Uint8Array>>((res, rej) => ((waiter = res), (reject = rej)));
    },
    cancel,
    releaseLock: () => {},
  };
  const response = { status, headers: new Headers(headers), body: { getReader: () => reader } } as unknown as Response;
  return {
    response,
    reads,
    cancel,
    push: (t: string | Uint8Array) => deliver({ done: false, value: typeof t === 'string' ? enc.encode(t) : t }),
    end: () => deliver({ done: true, value: undefined }),
    fail: (e: Error) => reject?.(e),
  };
}

/** The real handlers behind the real in-flight dispatcher, so ctx.own / cancel / abortAll are the production wiring. */
export function session(responses: (() => Response)[]) {
  const signals: AbortSignal[] = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    signals.push(init.signal as AbortSignal);
    return (responses.shift() ?? (() => new Response('{}')))();
  });
  const handlers = createHandlers({ fetch: fetchMock as unknown as typeof fetch, baseUrl: () => 'https://api.test' });
  const waiting = new Map<string, (r: ResResult<never>) => void>();
  const inflight = createInflight({
    handlers: handlers as never,
    arm: (fn, ms) => ({ h: setTimeout(fn, ms) }),
    disarm: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    respond: (id, _type, result) => waiting.get(id)?.(result as ResResult<never>),
    onSignal: () => {},
  });
  let n = 0;
  const call = (type: string, payload: unknown) =>
    new Promise<ResResult<Record<string, unknown>>>((resolve) => {
      const id = `c${++n}`;
      waiting.set(id, resolve);
      inflight.run(id, type as never, payload as never);
    });
  const lastId = () => `c${n}`;
  const clownReq = { method: 'POST', path: '/api/clown', body: '{}' };
  const open = async () => {
    const r = await call('api', { req: clownReq, stream: true });
    return { r, id: r.ok ? (r.value.streamId as string) : '' };
  };
  return { call, inflight, fetchMock, signals, open, lastId, clownReq };
}
