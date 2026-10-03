import { describe, expect, it } from 'vitest';
import { createBridgeClient } from '@swift2/ui';
import type { BridgeClient, Envelope } from '@swift2/ui';
import { setup, tick } from './bridge-host.test-kit';

// Real native dispatcher + real DOM client over a fake in-memory transport,
// one shared fake clock: proves the per-endpoint api timeout holds end to end.
function rig() {
  let client!: BridgeClient;
  const never = () => new Promise<never>(() => {});
  const t = setup({ api: never as never }, { send: (e: Envelope) => void client.receive(e) });
  client = createBridgeClient({
    post: (e) => void t.host.receive(e),
    now: () => 1000,
    setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
    clearTimer: (h) => t.sch.clearTimeout(h),
  });
  t.makeReady();
  return { client, t };
}

describe('api command timeout through the real dispatcher + client', () => {
  it('does not abort a 30 s clown request', async () => {
    const { client, t } = rig();
    let settled = false;
    void client.call('api', { req: { method: 'POST', path: '/api/clown', body: '{}' } }).then(() => (settled = true));
    await tick();
    t.sch.advance(30_000);
    await tick();
    expect(settled).toBe(false);
    t.sch.advance(30_000);
    await tick();
    expect(settled).toBe(true);
  });

  it('aborts a non-clown request at 8 s', async () => {
    const { client, t } = rig();
    const p = client.call('api', { req: { method: 'POST', path: '/api/mood', body: '{}' } });
    await tick();
    t.sch.advance(30_000);
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'timeout' } });
  });
});
