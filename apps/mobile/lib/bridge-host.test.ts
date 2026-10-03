import { describe, expect, it, vi } from 'vitest';
import { resErr, resOk } from '@swift2/ui';
import type { Envelope, ResResult } from '@swift2/ui';
import { setup, tick, body } from './bridge-host.test-kit';

describe('bridge-host dispatcher', () => {
  it('sends exactly one res on success', async () => {
    const s = setup();
    s.cmd('c1', 'haptic', { kind: 'light' });
    await tick();
    expect(s.resFor('c1')).toHaveLength(1);
    expect(body(s.resFor('c1')[0]!)).toEqual({ ok: true, value: null });
  });

  it('answers unknown command types with unsupported and never throws', () => {
    const s = setup();
    s.cmd('c1', 'teleport');
    s.cmd('c2', 'back');
    expect((body(s.resFor('c1')[0]!) as { error: { code: string } }).error.code).toBe('unsupported');
    expect((body(s.resFor('c2')[0]!) as { error: { code: string } }).error.code).toBe('unsupported');
  });

  it('times out at 8 s by default, answers once, and drops the late result', async () => {
    let finish!: () => void;
    const s = setup({
      share: () => new Promise((r) => { finish = () => r(resOk(null)); }),
    } as never);
    s.cmd('c1', 'share', { url: 'https://x.test' });
    await tick();
    s.sch.advance(7999);
    expect(s.resFor('c1')).toHaveLength(0);
    s.sch.advance(1);
    expect(s.resFor('c1')).toHaveLength(1);
    expect((body(s.resFor('c1')[0]!) as { error: { code: string } }).error.code).toBe('timeout');
    finish();
    await tick();
    expect(s.resFor('c1')).toHaveLength(1);
  });

  it('honours per-type timeouts and aborts the handler signal on timeout', async () => {
    let signal!: AbortSignal;
    const s = setup(
      { api: (_p: unknown, ctx: { signal: AbortSignal }) => { signal = ctx.signal; return new Promise(() => {}); } } as never,
      { timeouts: { api: 100 } },
    );
    s.cmd('c1', 'api', { req: { method: 'GET', path: '/api/mood' } });
    await tick();
    s.sch.advance(100);
    expect(s.resFor('c1')).toHaveLength(1);
    expect(signal.aborted).toBe(true);
  });

  it('cancel aborts the in-flight handler and answers the target with cancelled', async () => {
    let signal!: AbortSignal;
    const s = setup({
      api: (_p: unknown, ctx: { signal: AbortSignal }) => { signal = ctx.signal; return new Promise(() => {}); },
    } as never);
    s.cmd('c1', 'api', { req: { method: 'GET', path: '/api/mood' } });
    s.cmd('c2', 'cancel', { targetId: 'c1' });
    await tick();
    expect(signal.aborted).toBe(true);
    expect((body(s.resFor('c1')[0]!) as { error: { code: string } }).error.code).toBe('cancelled');
    expect(s.resFor('c1')[0]!.type).toBe('api');
    expect(body(s.resFor('c2')[0]!)).toEqual({ ok: true, value: null });
    expect(s.sch.count()).toBe(0);
  });

  it('cancel of a finished or unknown id still answers once', () => {
    const s = setup();
    s.cmd('c2', 'cancel', { targetId: 'nope' });
    expect(s.resFor('c2')).toHaveLength(1);
  });

  it('rejects duplicate and replayed ids: handler runs once, one res', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never);
    s.cmd('c1', 'haptic', { kind: 'light' });
    s.cmd('c1', 'haptic', { kind: 'light' });
    await tick();
    s.cmd('c1', 'haptic', { kind: 'light' });
    expect(haptic).toHaveBeenCalledTimes(1);
    expect(s.resFor('c1')).toHaveLength(1);
    expect(s.onSignal).toHaveBeenCalledWith('bridge-duplicate', 'c1');
  });

  it('bounds the seen-id LRU per session', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never, { seenCap: 2 });
    s.cmd('a', 'haptic', { kind: 'light' });
    s.cmd('b', 'haptic', { kind: 'light' });
    s.cmd('a', 'haptic', { kind: 'light' }); // refreshes a
    s.cmd('c', 'haptic', { kind: 'light' }); // evicts b
    s.cmd('b', 'haptic', { kind: 'light' }); // b was evicted: runs again
    await tick();
    expect(haptic).toHaveBeenCalledTimes(4);
  });

  it('validates payloads before any handler runs', async () => {
    const h = vi.fn(async () => resOk(null));
    const s = setup({ navigate: h, openExternal: h, api: h, cancel: h } as never);
    s.cmd('n1', 'navigate', { path: '//evil.test' });
    s.cmd('n2', 'navigate', { path: '/era/x/../../y' });
    s.cmd('o1', 'openExternal', { url: 'http://x.test' });
    s.cmd('o2', 'openExternal', { url: 'javascript:alert(1)' });
    s.cmd('a1', 'api', { req: { method: 'GET', path: '/api/x', headers: { authorization: 'Bearer t' } } });
    s.cmd('a2', 'api', { req: { method: 'GET', path: '/api/x', headers: { cookie: 'a=b' } } });
    s.cmd('a3', 'api', {});
    s.cmd('x1', 'cancel', { targetId: 'bad id!' });
    s.cmd('h1', 'haptic', 'not-an-object');
    await tick();
    for (const id of ['n1', 'n2', 'o1', 'o2', 'a1', 'a2', 'a3', 'x1', 'h1']) {
      expect(s.resFor(id)).toHaveLength(1);
      expect((body(s.resFor(id)[0]!) as { error: { code: string } }).error.code).toBe('invalid');
    }
    expect(h).not.toHaveBeenCalled();
  });

  it('hands handlers the sanitized payload and never forwards Authorization or Cookie', async () => {
    const api = vi.fn(async () => resOk({ status: 200, headers: {}, body: '' }));
    const s = setup({ api } as never);
    s.cmd('a1', 'api', { req: { method: 'POST', path: '/api/mood', headers: { 'Content-Type': 'application/json' }, body: '{}' } });
    await tick();
    expect(api).toHaveBeenCalledWith(
      { req: { method: 'POST', path: '/api/mood', headers: { 'content-type': 'application/json' }, body: '{}' } },
      expect.anything(),
    );
  });

  it('maps handler rejection, sync throw and malformed result to failed', async () => {
    const s = setup({
      share: async () => { throw new Error('boom'); },
      haptic: (() => { throw new Error('sync'); }) as never,
      navigate: (async () => 'garbage') as never,
    });
    s.cmd('c1', 'share', {});
    s.cmd('c2', 'haptic', {});
    s.cmd('c3', 'navigate', { path: '/era/a' });
    await tick();
    for (const id of ['c1', 'c2', 'c3']) {
      expect((body(s.resFor(id)[0]!) as { error: { code: string } }).error.code).toBe('failed');
    }
  });

  it('a malformed cmd envelope after ready is answered invalid; garbage is dropped; never throws', () => {
    const s = setup();
    s.makeReady();
    s.host.receive({ v: 1, id: 'c1', kind: 'cmd', type: 'haptic', payload: { f: () => 1 }, ts: 1 });
    s.host.receive(null);
    s.host.receive('str');
    s.host.receive({ id: 5 });
    expect((body(s.resFor('c1')[0]!) as { error: { code: string } }).error.code).toBe('invalid');
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });
});
