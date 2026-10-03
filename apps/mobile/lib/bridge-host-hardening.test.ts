import { describe, expect, it, vi } from 'vitest';
import { resOk } from '@swift2/ui';
import { setup, tick, body } from './bridge-host.test-kit';

const code = (e: { payload: unknown }) => (e.payload as { error: { code: string } }).error.code;
const never = () => new Promise(() => {});
const apiReq = { req: { method: 'GET', path: '/api/mood' } };

describe('bridge-host hardening: bounds', () => {
  it('caps the pre-ready held queue: drops oldest emits, keeps requests', () => {
    const s = setup({}, { outboxCap: 3 });
    void s.host.request('back', {});
    for (let i = 0; i < 5; i++) s.host.emit('contentVersion', { token: String(i) });
    s.makeReady();
    expect(s.sent.map((e) => e.type)).toEqual(['back', 'contentVersion', 'contentVersion']);
    expect(s.sent.map((e) => (e.payload as { token?: string }).token)).toEqual([undefined, '3', '4']);
    expect(s.onSignal).toHaveBeenCalledWith('bridge-queue-drop', expect.any(String));
  });

  it('caps the post-ready unacked queue and refuses a request when only requests are queued', async () => {
    const s = setup({}, { outboxCap: 2 });
    s.makeReady();
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('contentVersion', { token: 'b' });
    s.host.emit('contentVersion', { token: 'c' });
    expect(s.host.inbox()).toHaveLength(2);
    void s.host.request('back', {});
    void s.host.request('back', {});
    expect(s.host.inbox().map((e) => e.type)).toEqual(['back', 'back']);
    expect(await s.host.request('back', {})).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(s.host.inbox()).toHaveLength(2);
  });

  it('malformed commands pass through the same monotonic admission', () => {
    const s = setup();
    s.makeReady();
    const bad = (id: string) => s.host.receive({ v: 1, id, kind: 'cmd', type: 'haptic', payload: { f: () => 1 }, ts: 1 });
    bad('10');
    bad('10');
    bad('9');
    expect(s.resFor('10')).toHaveLength(2);
    expect(s.resFor('9')).toHaveLength(1);
    expect((s.resFor('10')[1]!.payload as { error: { message: string } }).error.message).toBe('command id not monotonic');
    bad('11');
    expect(s.resFor('11')).toHaveLength(1);
  });

  it('caps concurrent in-flight commands: over the cap answers failed without starting a handler', async () => {
    const api = vi.fn(never);
    const s = setup({ api } as never, { maxInflight: 2 });
    s.cmd('1', 'api', apiReq);
    s.cmd('2', 'api', apiReq);
    s.cmd('3', 'api', apiReq);
    await tick();
    expect(api).toHaveBeenCalledTimes(2);
    expect(code(s.resFor('3')[0]!)).toBe('failed');
    expect((body(s.resFor('3')[0]!) as { error: { message: string } }).error.message).toBe('busy');
  });
});

describe('bridge-host hardening: payloads and version', () => {
  it('validates share, haptic and notification payloads per field', async () => {
    const h = vi.fn(async () => resOk(null));
    const s = setup({ share: h, haptic: h, 'notifications.updatePrefs': h, 'notifications.status': h } as never);
    s.cmd('1', 'share', { title: 5 });
    s.cmd('2', 'share', { url: 'x'.repeat(3000) });
    s.cmd('3', 'haptic', { kind: 'earthquake' });
    s.cmd('4', 'haptic', {});
    s.cmd('5', 'notifications.updatePrefs', { prefs: { a: 'yes' } });
    s.cmd('6', 'notifications.updatePrefs', { prefs: [true] });
    s.cmd('7', 'notifications.updatePrefs', {});
    s.cmd('8', 'notifications.status', 'str');
    await tick();
    for (const id of ['1', '2', '3', '4', '5', '6', '7', '8']) expect(code(s.resFor(id)[0]!)).toBe('invalid');
    expect(h).not.toHaveBeenCalled();
    s.cmd('9', 'share', { title: 't', url: 'https://x.test', extra: 1 });
    s.cmd('10', 'haptic', { kind: 'light' });
    s.cmd('11', 'notifications.updatePrefs', { prefs: { news: true } });
    await tick();
    expect(h).toHaveBeenCalledWith({ title: 't', url: 'https://x.test' }, expect.anything());
    expect(h).toHaveBeenCalledWith({ prefs: { news: true } }, expect.anything());
    expect(h).toHaveBeenCalledTimes(3);
  });

  it('after negotiation a mismatched envelope version is invalid (cmd) or dropped (other kinds)', async () => {
    const haptic = vi.fn(async () => resOk(null));
    const s = setup({ haptic } as never);
    s.makeReady();
    s.host.receive({ v: 2, id: '1', kind: 'cmd', type: 'haptic', payload: { kind: 'light' }, ts: 1 });
    s.host.receive({ v: 2, id: 'e1', kind: 'evt', type: 'diag', payload: { stage: 'x' }, ts: 1 });
    s.host.receive({ v: 2, id: 'e2', kind: 'evt', type: 'ack', payload: { seq: 0 }, ts: 1 });
    await tick();
    expect(code(s.resFor('1')[0]!)).toBe('invalid');
    expect(haptic).not.toHaveBeenCalled();
    expect(s.onSignal).not.toHaveBeenCalledWith('x', undefined);
    expect(s.onSignal).toHaveBeenCalledWith('bridge-version-mismatch', expect.any(String));
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });

  it('a second ready renegotiates and re-flushes the unacked queue', async () => {
    const s = setup();
    s.makeReady();
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('contentVersion', { token: 'b' });
    s.evt('ack', { seq: 1 }, 'ack1');
    const p = s.host.request('back', {}, { timeoutMs: 1000 });
    s.sch.advance(900);
    const before = s.sent.length;
    s.makeReady();
    expect(s.sent.slice(before).map((e) => e.seq)).toEqual([2, 3]);
    s.sch.advance(900); // request timer restarted at re-dispatch
    let settled = false;
    void p.then(() => { settled = true; });
    await tick();
    expect(settled).toBe(false);
    s.sch.advance(100);
    expect(await p).toMatchObject({ error: { code: 'timeout' } });
  });

  it('re-ready aborts old-session handlers silently; a reused id stays rejected, a higher id runs', async () => {
    let finish!: () => void;
    let signal!: AbortSignal;
    const api = vi.fn((_p: unknown, c: { signal: AbortSignal }) => {
      signal = c.signal;
      return new Promise((r) => { finish = () => r(resOk({ status: 200, headers: {}, body: '' })); });
    });
    const s = setup({ api } as never);
    s.makeReady();
    s.cmd('1', 'api', apiReq);
    await tick();
    s.makeReady();
    expect(signal.aborted).toBe(true);
    expect(s.sch.count()).toBe(0);
    finish();
    await tick();
    expect(s.resFor('1')).toHaveLength(0);
    s.cmd('1', 'api', apiReq);
    s.cmd('2', 'api', apiReq);
    await tick();
    expect(api).toHaveBeenCalledTimes(2);
    expect(code(s.resFor('1')[0]!)).toBe('invalid');
    s.sch.advance(8000);
    expect(s.resFor('2')).toHaveLength(1);
  });

  it('a second ready with an unsupported version is protocol-fatal and silences the host', () => {
    const s = setup();
    s.makeReady();
    s.evt('ready', { v: 99 });
    expect(s.onProtocolFatal).toHaveBeenCalledTimes(1);
    const n = s.sent.length;
    s.host.emit('contentVersion', { token: 'z' });
    s.cmd('1', 'haptic', { kind: 'light' });
    expect(s.sent).toHaveLength(n);
  });
});

describe('bridge-host hardening: cancel, fatal, teardown', () => {
  it('a cancel landing before the deferred handler starts means the handler never runs; one res', async () => {
    const api = vi.fn(never);
    const s = setup({ api } as never);
    s.cmd('1', 'api', apiReq);
    s.cmd('2', 'cancel', { targetId: '1' });
    await tick();
    expect(api).not.toHaveBeenCalled();
    expect(s.resFor('1')).toHaveLength(1);
    expect(code(s.resFor('1')[0]!)).toBe('cancelled');
    expect(s.sch.count()).toBe(0);
  });

  const busy = async (dispose: (s: ReturnType<typeof setup>) => void) => {
    let signal!: AbortSignal;
    const s = setup({ api: (_p: unknown, c: { signal: AbortSignal }) => { signal = c.signal; return never(); } } as never);
    s.makeReady();
    s.cmd('1', 'api', apiReq);
    await tick();
    const p = s.host.request('back', {});
    const n = s.sent.length;
    dispose(s);
    expect(signal.aborted).toBe(true);
    expect(s.sch.count()).toBe(0);
    expect(await p).toMatchObject({ ok: false, error: { code: 'failed' } });
    s.host.emit('contentVersion', { token: 'z' });
    s.cmd('2', 'haptic', { kind: 'light' });
    s.sch.advance(60000);
    await tick();
    expect(s.sent).toHaveLength(n);
    expect(await s.host.request('back', {})).toMatchObject({ ok: false });
    return s;
  };

  it('after protocol-fatal: no sends, handlers aborted, timers cleared, pending requests settled', async () => {
    const s = await busy((x) => x.evt('ready', { v: 99 }));
    expect(s.onProtocolFatal).toHaveBeenCalledTimes(1);
  });

  it('dispose() does the same for host teardown without a fatal', async () => {
    const s = await busy((x) => x.host.dispose());
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });

  it('request never rejects when the scheduler or clock throws', async () => {
    const s = setup();
    s.makeReady();
    s.sch.setTimeout = () => { throw new Error('no timers'); };
    expect(await s.host.request('back', {})).toMatchObject({ ok: false, error: { code: 'failed' } });
    s.cmd('1', 'api', apiReq);
    await tick();
    expect(code(s.resFor('1')[0]!)).toBe('failed');
    const t = setup({}, { now: () => { throw new Error('clock'); } });
    expect(await t.host.request('back', {})).toMatchObject({ ok: false });
  });

  it('never sends the raw handler error message to the DOM; logs it natively', async () => {
    const s = setup({ share: async () => { throw new Error('secret /var/path token=abc'); } } as never);
    s.cmd('1', 'share', {});
    await tick();
    expect(JSON.stringify(s.resFor('1')[0])).not.toContain('secret');
    expect(s.onSignal).toHaveBeenCalledWith('bridge-handler-error', expect.stringContaining('secret'));
  });
});

describe('bridge-host hardening: response correlation and ack', () => {
  it('a res must match id and type and the expected shape, else it is dropped with a signal', async () => {
    const s = setup();
    s.makeReady();
    const p = s.host.request('back', {});
    const id = s.sent[0]!.id;
    const res = (over: object) => s.host.receive({ v: 1, id, kind: 'res', type: 'back', payload: { ok: true, value: 'handled' }, ts: 1, ...over });
    res({ type: 'navigate' });
    res({ id: 'other' });
    res({ payload: { ok: true, value: 'maybe' } });
    res({ payload: { ok: true, value: { x: 1 } } });
    res({ payload: 'junk' });
    let settled = false;
    void p.then(() => { settled = true; });
    await tick();
    expect(settled).toBe(false);
    expect(s.onSignal).toHaveBeenCalledWith('bridge-res-mismatch', expect.any(String));
    expect(s.onSignal).toHaveBeenCalledWith('bridge-res-invalid', 'back');
    res({ payload: { ok: true, value: 'exit' } });
    expect(await p).toEqual({ ok: true, value: 'exit' });
  });

  it('ack must be a non-negative safe integer not above the highest sent seq', () => {
    const s = setup();
    s.makeReady();
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('contentVersion', { token: 'b' });
    for (const seq of [-1, 1.5, 3, 2 ** 53, Number.NaN, '1', null]) s.evt('ack', { seq }, 'a');
    s.evt('ack', 'junk', 'a');
    expect(s.host.inbox()).toHaveLength(2);
    expect(s.onSignal).toHaveBeenCalledWith('bridge-bad-ack', expect.any(String));
    s.evt('ack', { seq: 2 }, 'a');
    expect(s.host.inbox()).toHaveLength(0);
  });
});
