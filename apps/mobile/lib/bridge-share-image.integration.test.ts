import { describe, expect, it, vi } from 'vitest';
import { createBridgeClient, resOk } from '@swift2/ui';
import type { BridgeClient, Envelope } from '@swift2/ui';
import { setup, tick } from './bridge-host.test-kit';
import { createHandlers } from './bridge-handlers-ui';
import { createUiDeps } from './ui-deps';

const CARD = 'https://www.longlivets.com/api/share-card?item=a&size=story';

// Real createBridgeHost + real createBridgeClient over an in-memory transport.
function rig(share: unknown) {
  // eslint-disable-next-line prefer-const -- assigned after setup(); the send closure needs the binding first
  let client!: BridgeClient;
  const t = setup({ share: share as never }, { send: (e: Envelope) => void client.receive(e) });
  client = createBridgeClient({
    post: (e) => void t.host.receive(e),
    now: () => 1000,
    setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
    clearTimer: (h) => t.sch.clearTimeout(h),
  });
  t.makeReady();
  return client;
}

describe('share image through the real host + client', () => {
  it('image.url reaches the handler and { imageCopied: true } reaches the caller', async () => {
    const shareFn = vi.fn(async () => {});
    const handlers = createHandlers(
      createUiDeps({
        linking: { openURL: async () => true },
        share: { share: shareFn },
        platformOS: 'android',
        log: () => {},
        cards: {
          download: vi.fn(async () => ({ uri: 'file:///c.png', base64: () => 'B64' })),
          copyImage: vi.fn(async () => {}),
          prune: vi.fn(async () => {}),
        },
      }),
    );
    const handler = vi.fn(handlers.share);
    const client = rig(handler);
    const p = client.call('share', { title: 'T', text: 'x', image: { url: CARD } });
    await tick();
    expect(await p).toEqual({ ok: true, value: { imageCopied: true } });
    expect(handler.mock.calls[0]?.[0]).toMatchObject({ image: { url: CARD } });
  });

  it.each([{ imageCopied: 'yes' }, { imageCopied: true, extra: 1 }])('the client rejects the malformed result %j', async (value) => {
    const client = rig(async () => resOk(value));
    const p = client.call('share', { title: 'T' });
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'failed' } });
  });
});
