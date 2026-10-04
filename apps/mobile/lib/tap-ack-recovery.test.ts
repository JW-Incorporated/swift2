import { describe, expect, it, vi } from 'vitest';
import { createTapGate } from './notification-tap-gate';
import { createTapQueue } from './notification-tap-queue';
import { MAX_UNCONFIRMED_ATTEMPTS, createTapTarget } from './tap-bind-epoch';

// Real queue + gate + tap target; a fake host that ACKs transport immediately. `navigated` is delivered only for the
// emits listed in `confirm`, simulating a lost DOM confirmation.
function rig(confirm: (emitNo: number) => boolean) {
  const emits: { path: string; id: string }[] = [];
  let seq = 0;
  const holder: { target?: ReturnType<typeof createTapTarget> } = {};
  const host = {
    isReady: () => true,
    emit: (_t: 'navigate', p: { path: never; source: 'notification'; id?: string }) => {
      emits.push({ path: p.path as string, id: p.id as string });
      const n = emits.length;
      if (confirm(n)) setTimeout(() => holder.target?.onNavigated({ id: p.id as string, ok: true }), 5);
      return { epoch: 1, seq: ++seq };
    },
    onAcked: (_r: unknown, cb: (a: boolean) => void) => (queueMicrotask(() => cb(true)), () => {}),
  };
  const onGiveUp = vi.fn();
  const target = createTapTarget({ host: host as never, isReaderPath: () => true, openElsewhere: async () => true, onGiveUp });
  holder.target = target;
  const queue = createTapQueue({ ackTimeoutMs: 30 });
  const gate = createTapGate({ siteUrl: 'https://www.longlivets.com', queue, retryMs: 10 });
  gate.bindHost(target as never);
  return { gate, emits, onGiveUp };
}

describe('lost `navigated` ack', () => {
  it('a timeout after the transport ACK re-emits with a fresh id and the retry is delivered', async () => {
    const { gate, emits } = rig((n) => n >= 2);
    gate.enqueue({ id: 'a', deepLink: '/?item=abc' });
    await vi.waitFor(() => expect(gate.size()).toBe(0), { timeout: 2000 });
    expect(emits.length).toBe(2);
    expect(emits[1].id).not.toBe(emits[0].id);
  });

  it('never blocks the head forever: after N unconfirmed deliveries the tap is consumed and the next one flows', async () => {
    let first = true;
    const { gate, emits, onGiveUp } = rig(() => {
      return !first; // nothing ever confirms the first tap's path
    });
    gate.enqueue({ id: 'a', deepLink: '/?item=lost' });
    await vi.waitFor(() => expect(gate.size()).toBe(0), { timeout: 4000 });
    expect(emits.filter((e) => e.path === '/?item=lost').length).toBe(MAX_UNCONFIRMED_ATTEMPTS);
    expect(onGiveUp).toHaveBeenCalledWith('/?item=lost');
    first = false;
    gate.enqueue({ id: 'b', deepLink: '/?item=next' });
    await vi.waitFor(() => expect(gate.size()).toBe(0), { timeout: 2000 });
  });
});
