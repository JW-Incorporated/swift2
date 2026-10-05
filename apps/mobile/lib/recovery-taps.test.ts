import { describe, expect, it, vi } from 'vitest';

vi.mock('./diagnostics', () => ({ diagCollector: { mark: vi.fn() } }));

import { createTapGate } from './notification-tap-gate';
import { startDeepLinkIntake } from './use-deep-links';
import { startTapIngest } from './notification-tap-ingest';
import { recoveryTapDiscard } from './recovery-taps';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Recovery tap discard', () => {
  it('a notification tap (cold and live) is consumed with a diag mark, not queued or navigated', async () => {
    const mark = vi.fn();
    const gate = createTapGate({ siteUrl: 'https://x.test' });
    gate.setNativeNavigator(recoveryTapDiscard(mark));
    let live: (r: unknown) => void = () => {};
    const resp = (id: string) => ({ notification: { date: 1, request: { identifier: id, content: { data: { deepLink: '/?item=abc' } } } } });
    const clearLast = vi.fn(async () => {});
    startTapIngest(gate, {
      getLast: async () => resp('cold') as never,
      clearLast,
      listen: (cb) => ((live = cb as never), () => {}),
    });
    await flush();
    live(resp('live'));
    await flush();
    expect(mark).toHaveBeenCalledTimes(2);
    expect(mark).toHaveBeenCalledWith('recovery-tap-dropped');
    expect(gate.size()).toBe(0);
    expect(clearLast).toHaveBeenCalled();
  });

  it('a deep link (cold and live) is consumed the same way', async () => {
    const mark = vi.fn();
    const gate = createTapGate({ siteUrl: 'https://x.test' });
    gate.setNativeNavigator(recoveryTapDiscard(mark));
    let live: (u: string) => void = () => {};
    startDeepLinkIntake(gate, {
      getInitialURL: async () => 'longlive://?item=abc',
      listen: (cb) => ((live = cb), () => {}),
    });
    await flush();
    live('https://www.longlivets.com/?item=def');
    await flush();
    expect(mark).toHaveBeenCalledTimes(2);
    expect(gate.size()).toBe(0);
  });

  it('without the discard (pending), taps stay held for the DOM host', async () => {
    const gate = createTapGate({ siteUrl: 'https://x.test' });
    gate.setNativeNavigator(null);
    gate.enqueue({ id: 'a', deepLink: '/?item=abc' });
    expect(gate.size()).toBe(1);
  });
});
