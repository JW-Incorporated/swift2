import { describe, expect, it, vi } from 'vitest';
import { resErr, resOk } from '@swift2/ui';
import type { Envelope, ResResult } from '@swift2/ui';
import { setup, tick, body } from './bridge-host.test-kit';

const code = (e: { payload: unknown }) => (e.payload as { error: { code: string } }).error.code;

describe('bridge-host dispatcher', () => {
  it('sends exactly one res on success', async () => {
    const s = setup();
    s.cmd('1', 'haptic', { kind: 'light' });
    await tick();
    expect(s.resFor('1')).toHaveLength(1);
    expect(body(s.resFor('1')[0]!)).toEqual({ ok: true, value: null });
  });

  it('answers unknown command types with unsupported and never throws', () => {
    const s = setup();
    s.cmd('1', 'teleport');
    s.cmd('2', 'back');
    expect((body(s.resFor('1')[0]!) as { error: { code: string } }).error.code).toBe('unsupported');
    expect((body(s.resFor('2')[0]!) as { error: { code: string } }).error.code).toBe('unsupported');
  });

  it('times out at 8 s by default, answers once, and drops the late result', async () => {
    let finish!: () => void;
    const s = setup({
      share: () => new Promise((r) => { finish = () => r(resOk(null)); }),
    } as never);
    s.cmd('1', 'share', { url: 'https://x.test' });
    await tick();
    s.sch.advance(7999);
    expect(s.resFor('1')).toHaveLength(0);
    s.sch.advance(1);
    expect(s.resFor('1')).toHaveLength(1);
    expect((body(s.resFor('1')[0]!) as { error: { code: string } }).error.code).toBe('timeout');
    finish();
    await tick();
    expect(s.resFor('1')).toHaveLength(1);
  });

  it('honours per-type timeouts and aborts the handler signal on timeout', async () => {
    let signal!: AbortSignal;
    const s = setup(
      { api: (_p: unknown, ctx: { signal: AbortSignal }) => { signal = ctx.signal; return new Promise(() => {}); } } as never,
      { timeouts: { api: 100 } },
    );
    s.cmd('1', 'api', { req: { method: 'GET', path: '/api/mood' } });
    await tick();
    s.sch.advance(100);
    expect(s.resFor('1')).toHaveLength(1);
    expect(signal.aborted).toBe(true);
  });

  it('cancel aborts the in-flight handler and answers the target with cancelled', async () => {
    let signal!: AbortSignal;
    const s = setup({
      api: (_p: unknown, ctx: { signal: AbortSignal }) => { signal = ctx.signal; return new Promise(() => {}); },
    } as never);
    s.cmd('1', 'api', { req: { method: 'GET', path: '/api/mood' } });
    await tick();
    s.cmd('2', 'cancel', { targetId: '1' });
    await tick();
    expect(signal.aborted).toBe(true);
    expect((body(s.resFor('1')[0]!) as { error: { code: string } }).error.code).toBe('cancelled');
    expect(s.resFor('1')[0]!.type).toBe('api');
    expect(body(s.resFor('2')[0]!)).toEqual({ ok: true, value: null });
    expect(s.sch.count()).toBe(0);
  });

  it('cancel of a finished or unknown id still answers once', () => {
    const s = setup();
    s.cmd('2', 'cancel', { targetId: 'nope' });
    expect(s.resFor('2')).toHaveLength(1);
  });

  it('rejects replayed ids with invalid: the handler runs once, an in-flight replay gets no extra res', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never);
    s.cmd('1', 'haptic', { kind: 'light' });
    s.cmd('1', 'haptic', { kind: 'light' });
    await tick();
    expect(s.resFor('1')).toHaveLength(1);
    s.cmd('1', 'haptic', { kind: 'light' });
    expect(haptic).toHaveBeenCalledTimes(1);
    expect(s.resFor('1')).toHaveLength(2);
    expect(code(s.resFor('1')[1]!)).toBe('invalid');
    expect(s.onSignal).toHaveBeenCalledWith('rejected_monotonic', '1');
  });

  it('rejects an out-of-order lower id and non-numeric ids; higher ids still run', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never);
    s.cmd('5', 'haptic', { kind: 'light' });
    s.cmd('4', 'haptic', { kind: 'light' });
    s.cmd('abc', 'haptic', { kind: 'light' });
    s.cmd('1234567890123456', 'haptic', { kind: 'light' });
    s.cmd('6', 'haptic', { kind: 'light' });
    await tick();
    expect(haptic).toHaveBeenCalledTimes(2);
    for (const id of ['4', 'abc', '1234567890123456']) expect(code(s.resFor(id)[0]!)).toBe('invalid');
    expect(s.onSignal).toHaveBeenCalledWith('rejected_monotonic', '4');
  });

  it('the high-water mark survives a re-ready: replayed ids stay rejected, higher ids run', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never);
    s.makeReady();
    s.cmd('100', 'haptic', { kind: 'light' });
    await tick();
    s.makeReady();
    s.cmd('100', 'haptic', { kind: 'light' });
    s.cmd('99', 'haptic', { kind: 'light' });
    s.cmd('101', 'haptic', { kind: 'light' });
    await tick();
    expect(haptic).toHaveBeenCalledTimes(2);
    expect(code(s.resFor('99')[0]!)).toBe('invalid');
  });

  it('validates payloads before any handler runs', async () => {
    const h = vi.fn(async () => resOk(null));
    const s = setup({ navigate: h, openExternal: h, api: h } as never);
    s.cmd('11', 'navigate', { path: '//evil.test' });
    s.cmd('12', 'navigate', { path: '/era/x/../../y' });
    s.cmd('13', 'openExternal', { url: 'http://x.test' });
    s.cmd('14', 'openExternal', { url: 'javascript:alert(1)' });
    s.cmd('15', 'api', { req: { method: 'GET', path: '/api/x', headers: { authorization: 'Bearer t' } } });
    s.cmd('16', 'api', { req: { method: 'GET', path: '/api/x', headers: { cookie: 'a=b' } } });
    s.cmd('17', 'api', {});
    s.cmd('18', 'cancel', { targetId: 'bad id!' });
    s.cmd('19', 'haptic', 'not-an-object');
    await tick();
    for (const id of ['11', '12', '13', '14', '15', '16', '17', '18', '19']) {
      expect(s.resFor(id)).toHaveLength(1);
      expect((body(s.resFor(id)[0]!) as { error: { code: string } }).error.code).toBe('invalid');
    }
    expect(h).not.toHaveBeenCalled();
  });

  it('hands handlers the sanitized payload and never forwards Authorization or Cookie', async () => {
    const api = vi.fn(async () => resOk({ status: 200, headers: {}, body: '' }));
    const s = setup({ api } as never);
    s.cmd('15', 'api', { req: { method: 'POST', path: '/api/mood', headers: { 'Content-Type': 'application/json' }, body: '{}' } });
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
    s.cmd('1', 'share', {});
    s.cmd('2', 'haptic', { kind: 'light' });
    s.cmd('3', 'navigate', { path: '/era/a' });
    await tick();
    for (const id of ['1', '2', '3']) {
      expect((body(s.resFor(id)[0]!) as { error: { code: string } }).error.code).toBe('failed');
    }
  });

  it('a malformed cmd envelope after ready is answered invalid; garbage is dropped; never throws', () => {
    const s = setup();
    s.makeReady();
    s.host.receive({ v: 1, id: '1', kind: 'cmd', type: 'haptic', payload: { f: () => 1 }, ts: 1 });
    s.host.receive(null);
    s.host.receive('str');
    s.host.receive({ id: 5 });
    expect((body(s.resFor('1')[0]!) as { error: { code: string } }).error.code).toBe('invalid');
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });
});
