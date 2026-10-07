import { afterEach, describe, expect, it, vi } from 'vitest';
import { bufferedFrom } from '@swift2/ui';

import { createWebAdapter, createWebRootAdapter } from './host-adapter';
import { webApiStream } from './host-api-stream';

const router = { push: vi.fn(), replace: vi.fn() };
const req = {
  method: 'POST' as const,
  path: '/api/clown' as const,
  headers: { 'content-type': 'application/json' },
  body: '{"text":"hi"}',
};

function controlledStream() {
  const encoder = new TextEncoder();
  let ctl!: ReadableStreamDefaultController<Uint8Array>;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      ctl = c;
    },
    cancel,
  });
  return { stream, cancel, error: (e: unknown) => ctl.error(e), push: (s: string) => ctl.enqueue(encoder.encode(s)), close: () => ctl.close() };
}

afterEach(() => vi.unstubAllGlobals());

describe('web root adapter apiStream', () => {
  it('is provided by the root adapter only', () => {
    expect(createWebRootAdapter(router).apiStream).toBe(webApiStream);
    expect(createWebAdapter(router).apiStream).toBeUndefined();
  });

  it('sends the same request shape the raw fetch used and streams chunks progressively', async () => {
    const s = controlledStream();
    const fetchMock = vi.fn(async () => new Response(s.stream));
    vi.stubGlobal('fetch', fetchMock);
    const it = webApiStream(req)[Symbol.asyncIterator]();
    s.push('{"a":1}\n');
    expect((await it.next()).value).toBe('{"a":1}\n');
    expect(fetchMock).toHaveBeenCalledWith('/api/clown', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"text":"hi"}',
    });
    s.push('{"b":2}\n');
    expect((await it.next()).value).toBe('{"b":2}\n');
    s.close();
    expect((await it.next()).done).toBe(true);
  });

  it('throws the status string on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 500 })));
    await expect(webApiStream(req)[Symbol.asyncIterator]().next()).rejects.toThrow('500');
  });

  it('cancels the underlying stream when the consumer stops', async () => {
    const s = controlledStream();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(s.stream)));
    const it = webApiStream(req)[Symbol.asyncIterator]();
    s.push('x');
    await it.next();
    await it.return?.();
    expect(s.cancel).toHaveBeenCalled();
  });

  it('abort ends the stream with an error and passes the signal to fetch', async () => {
    const s = controlledStream();
    const ac = new AbortController();
    const fetchMock = vi.fn(async (_p: string, init: RequestInit) => {
      init.signal?.addEventListener('abort', () => s.error(new DOMException('aborted', 'AbortError')));
      return new Response(s.stream);
    });
    vi.stubGlobal('fetch', fetchMock);
    const it = webApiStream(req, { signal: ac.signal })[Symbol.asyncIterator]();
    s.push('x');
    await it.next();
    expect(fetchMock.mock.calls[0][1].signal).toBe(ac.signal);
    ac.abort();
    await expect(it.next()).rejects.toThrow('aborted');
  });
});

describe('bufferedFrom', () => {
  it('yields the whole body once with the same request', async () => {
    const apiFetch = vi.fn(async () => ({ status: 200, headers: {}, body: 'line1\nline2\n' }));
    const chunks: string[] = [];
    for await (const c of bufferedFrom(apiFetch)(req)) chunks.push(c);
    expect(chunks).toEqual(['line1\nline2\n']);
    expect(apiFetch).toHaveBeenCalledWith(req, undefined);
  });

  it('throws the status string on non-2xx', async () => {
    const apiFetch = vi.fn(async () => ({ status: 429, headers: {}, body: '' }));
    await expect(bufferedFrom(apiFetch)(req)[Symbol.asyncIterator]().next()).rejects.toThrow('429');
  });
});
