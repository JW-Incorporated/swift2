import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({}));

import { createHeldTaps, type HeldStorage } from './recovery-pending-taps';
import { createTapGate, type TapHost } from './notification-tap-gate';

const memory = (): HeldStorage & { raw: string | null } => {
  const s = {
    raw: null as string | null,
    get: async () => s.raw,
    set: async (r: string) => void (s.raw = r),
    del: async () => void (s.raw = null),
  };
  return s;
};

describe('held taps across a Retry reload', () => {
  it('a tap during Recovery is not consumed, survives the reload, and the DOM host receives it once', async () => {
    const store = memory();
    const emitted: string[] = [];

    // Process 1: Recovery shown (no native navigator, no host). The tap is held and noted.
    const gate1 = createTapGate({ siteUrl: 'https://x.test' });
    gate1.setNativeNavigator(null);
    const held1 = createHeldTaps(store);
    const raw = { id: 'n1', deepLink: '/?item=abc' };
    held1.note(raw);
    gate1.enqueue(raw);
    expect(gate1.size()).toBe(1);
    await held1.persist();
    expect(store.raw).not.toBeNull();

    // Process 2: fresh gate; restore, enqueue, then the DOM host binds and acks.
    const gate2 = createTapGate({ siteUrl: 'https://x.test' });
    const held2 = createHeldTaps(store);
    (await held2.restore()).forEach((t) => gate2.enqueue(t));
    expect(store.raw).toBeNull();
    const host: TapHost = {
      emit: (_t, payload) => (emitted.push(payload.path), { epoch: 1, seq: emitted.length }),
      onAcked: (_ref, cb) => (queueMicrotask(() => cb(true)), () => {}),
    };
    gate2.bindHost(host);
    await vi.waitFor(() => expect(gate2.size()).toBe(0));
    expect(emitted).toHaveLength(1);
    held2.clear();
    expect(held2.size()).toBe(0);
  });

  it('dedupes by id and ignores garbage storage', async () => {
    const store = memory();
    const held = createHeldTaps(store);
    held.note({ id: 'a', deepLink: '/' });
    held.note({ id: 'a', deepLink: '/' });
    expect(held.size()).toBe(1);
    store.raw = 'not json';
    expect(await createHeldTaps(store).restore()).toEqual([]);
  });
});
