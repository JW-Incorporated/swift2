import { describe, expect, it, vi } from 'vitest';
import { resErr } from '@swift2/ui';
import { setup, tick } from './bridge-host.test-kit';

describe('bridge-host ready, queue and protocol-fatal', () => {
  it('holds emits and requests until ready, flushes in order, double ready is a no-op', () => {
    const s = setup();
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('insets', { top: 1, right: 0, bottom: 2, left: 0 });
    void s.host.request('back', {});
    expect(s.sent).toHaveLength(0);
    expect(s.host.inbox()).toHaveLength(0);
    s.makeReady();
    expect(s.sent.map((e) => [e.type, e.seq])).toEqual([['contentVersion', 1], ['insets', 2], ['back', 3]]);
    s.makeReady();
    expect(s.sent).toHaveLength(3);
    s.host.emit('contentVersion', { token: 'b' });
    expect(s.sent[3]!.seq).toBe(4);
    expect(s.host.isReady()).toBe(true);
  });

  it('starts request timers at dispatch, not enqueue', async () => {
    const s = setup();
    const p = s.host.request('back', {}, { timeoutMs: 1000 });
    s.sch.advance(5000);
    s.makeReady();
    s.sch.advance(999);
    let settled = false;
    void p.then(() => { settled = true; });
    await tick();
    expect(settled).toBe(false);
    s.sch.advance(1);
    const r = await p;
    expect(r).toEqual({ ok: false, error: { code: 'timeout', message: 'back timed out' } });
  });

  it('resolves a request from the matching res and drops a late one', async () => {
    const s = setup();
    s.makeReady();
    const p = s.host.request('back', {});
    const id = s.sent[0]!.id;
    s.host.receive({ v: 1, id, kind: 'res', type: 'back', payload: { ok: true, value: 'handled' }, ts: 1 });
    expect(await p).toEqual({ ok: true, value: 'handled' });
    s.host.receive({ v: 1, id, kind: 'res', type: 'back', payload: { ok: true, value: 'exit' }, ts: 1 });
    expect(s.sch.count()).toBe(0);
  });

  it('ack trims the outbound queue through seq', () => {
    const s = setup();
    s.makeReady();
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('contentVersion', { token: 'b' });
    s.host.emit('contentVersion', { token: 'c' });
    s.evt('ack', { seq: 2 }, 'ack1');
    expect(s.host.inbox().map((e) => e.seq)).toEqual([3]);
  });

  it('version too old or too new is protocol-fatal, and the host never becomes ready', () => {
    const a = setup();
    a.evt('ready', { v: 99 });
    expect(a.onProtocolFatal).toHaveBeenCalledWith('bridge-version too-new dom=99 host=1-1');
    expect(a.host.isReady()).toBe(false);
    const b = setup();
    b.evt('ready', { v: 0 });
    expect(b.onProtocolFatal).toHaveBeenCalledWith('bridge-version too-old dom=0 host=1-1');
    const c = setup();
    c.evt('ready', { v: 1, range: { min: 2, max: 3 } });
    expect(c.onProtocolFatal).toHaveBeenCalledWith('bridge-version too-new dom=1 host=1-1');
  });

  it('an invalid envelope before ready is protocol-fatal (once); after ready it is not', () => {
    const s = setup();
    s.host.receive({ nonsense: true });
    s.host.receive({ also: 'bad' });
    expect(s.onProtocolFatal).toHaveBeenCalledTimes(1);
    const t = setup();
    t.evt('ready', { v: 'x' });
    expect(t.onProtocolFatal).toHaveBeenCalledTimes(1);
  });

  it('timeouts, handler failures and unsupported never reach the watchdog, before or after ready', async () => {
    const s = setup({
      share: async () => { throw new Error('x'); },
      haptic: () => new Promise(() => {}),
      api: async () => resErr('failed', 'nope'),
    } as never);
    const run = async () => {
      s.cmd(`s${Math.random()}`.replace('.', ''), 'share', {});
      s.cmd(`h${Math.random()}`.replace('.', ''), 'haptic', {});
      s.cmd(`u${Math.random()}`.replace('.', ''), 'nope');
      s.cmd(`a${Math.random()}`.replace('.', ''), 'api', { req: { method: 'GET', path: '/api/x' } });
      s.cmd(`i${Math.random()}`.replace('.', ''), 'navigate', { path: 'bad' });
      await tick();
      s.sch.advance(8000);
    };
    await run();
    s.makeReady();
    await run();
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });

  it('forwards diag events to onSignal and ignores unknown events', () => {
    const s = setup();
    s.makeReady();
    s.evt('diag', { stage: 'dom-x', detail: 'd' }, 'd1');
    s.evt('mystery', {}, 'm1');
    expect(s.onSignal).toHaveBeenCalledWith('dom-x', 'd');
    expect(s.onSignal).toHaveBeenCalledWith('bridge-ignored-evt', 'mystery');
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
  });
});
