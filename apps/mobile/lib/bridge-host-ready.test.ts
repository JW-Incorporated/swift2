import { describe, expect, it } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';

describe('bridge-host ready limits and request settlement', () => {
  it('ready is limited to 3 per 10 s on the injected clock; the 4th is protocol-fatal', () => {
    let t = 0;
    const s = setup({}, { now: () => t });
    s.makeReady();
    s.makeReady();
    s.makeReady();
    expect(s.onProtocolFatal).not.toHaveBeenCalled();
    t = 9999;
    s.makeReady();
    expect(s.onProtocolFatal).toHaveBeenCalledTimes(1);
    const u = setup({}, { now: () => t });
    u.makeReady();
    u.makeReady();
    u.makeReady();
    t += 10_000;
    u.makeReady();
    expect(u.onProtocolFatal).not.toHaveBeenCalled();
  });

  it('ready is checked like any message: payload range, and envelope v against payload and negotiation', () => {
    const s = setup();
    s.host.receive({ v: 2, id: 'e-ready', kind: 'evt', type: 'ready', payload: { v: 1 }, ts: 1 });
    expect(s.onProtocolFatal).toHaveBeenCalledWith('bridge-version envelope v=2 ready v=1');
    const t = setup();
    t.makeReady();
    t.host.receive({ v: 1, id: 'e-ready', kind: 'evt', type: 'ready', payload: { v: 2 }, ts: 1 });
    expect(t.onProtocolFatal).toHaveBeenCalledWith(expect.stringContaining('too-new'));
    const u = setup();
    u.makeReady();
    u.host.receive({ v: 2, id: 'e-ready', kind: 'evt', type: 'ready', payload: { v: 1 }, ts: 1 });
    expect(u.onProtocolFatal).not.toHaveBeenCalled();
    expect(u.onSignal).toHaveBeenCalledWith('bridge-version-mismatch', expect.any(String));
  });

  it('a settled request leaves the outbox; re-ready resends only unsettled requests and unacked emits', async () => {
    const s = setup();
    s.makeReady();
    const p1 = s.host.request('back', {});
    void s.host.request('back', {});
    s.host.emit('contentVersion', { token: 'a' });
    s.host.emit('contentVersion', { token: 'b' });
    s.evt('ack', { seq: 3 }, 'ack1');
    expect(s.host.inbox().map((e) => e.seq)).toEqual([1, 2, 4]);
    s.host.receive({ v: 1, id: s.sent[0]!.id, kind: 'res', type: 'back', payload: { ok: true, value: 'exit' }, ts: 1 });
    await p1;
    expect(s.host.inbox().map((e) => e.seq)).toEqual([2, 4]);
    const before = s.sent.length;
    s.makeReady();
    expect(s.sent.slice(before).map((e) => e.seq)).toEqual([2, 4]);
  });
});
