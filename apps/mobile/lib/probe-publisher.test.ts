import { describe, expect, it, vi } from 'vitest';
import { createDomHostHandlers } from './dom-host-handlers';
import { createProbePublisher } from './probe-publisher';

describe('probe publisher wired through the real handlers', () => {
  it('reportProbe with the right token populates raw and reaches every sink, stamped with native timing', async () => {
    let ms: number | null = null;
    const a = vi.fn();
    const b = vi.fn();
    const probe = createProbePublisher({ nativeMs: () => ms, withNativeTiming: (j, m) => `${j}@${m}`, sinks: [a, b] });
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() }, token: 'tok', onProbe: probe.publish });
    await h.reportProbe('{"v":1}', 'tok');
    expect(probe.raw()).toBe('{"v":1}');
    expect(a).toHaveBeenCalledWith('{"v":1}@null');
    ms = 42;
    probe.publish(probe.raw()!);
    expect(b).toHaveBeenLastCalledWith('{"v":1}@42');
  });

  it('a wrong token leaves raw empty', async () => {
    const probe = createProbePublisher({ nativeMs: () => null, withNativeTiming: (j) => j, sinks: [] });
    const h = createDomHostHandlers({ onSignal: vi.fn(), watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() }, token: 'tok', onProbe: probe.publish });
    await expect(h.reportProbe('x', 'bad')).rejects.toThrow();
    expect(probe.raw()).toBeNull();
  });
});
