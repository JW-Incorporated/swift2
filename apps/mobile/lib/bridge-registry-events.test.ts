import { describe, expect, it, vi } from 'vitest';
import { DOM_EVENT_TYPES, NATIVE_EVENT_TYPES, createBridgeClient, toWebPath } from '@swift2/ui';
import type { BridgeClient, DomEventType, Envelope, EventPayloadOf, NativeEventType } from '@swift2/ui';
import { setup, tick } from './bridge-host.test-kit';

// Every event kind through the REAL host/client: a DOM event must reach its native hook (never the
// 'bridge-ignored-evt' fall-through) and a native event must reach a client subscriber, payload intact.
// Both tables are exhaustive over the event unions, so a new event fails typecheck until added here.
const DOM_SAMPLES: { [T in Exclude<DomEventType, 'ready' | 'ack'>]: EventPayloadOf<T> } = {
  diag: { stage: 'mount', detail: 'ok' },
  navReady: {},
  navigated: { id: 't1', ok: true },
  theme: { statusBarStyle: 'dark', background: '#0c0c0c' },
  route: { path: '/era/folklore?x=1#h', busy: true },
};

const NATIVE_SAMPLES: { [T in Exclude<NativeEventType, 'readyAck'>]: EventPayloadOf<T> } = {
  insets: { top: 1, right: 2, bottom: 3, left: 4 },
  contentVersion: { token: 'abc' },
  navigate: { path: toWebPath('/')!, source: 'deeplink', id: 't1' },
};

function rig() {
  const hooks = { onNavReady: vi.fn(), onNavigated: vi.fn(), onTheme: vi.fn(), onRoute: vi.fn(), onSignal: vi.fn() };
  // eslint-disable-next-line prefer-const -- the send closure needs the binding before assignment
  let client!: BridgeClient;
  const t = setup({}, { ...hooks, send: (e: Envelope) => void client.receive(e) });
  client = createBridgeClient({
    post: (e) => void t.host.receive(e),
    now: () => 1000,
    setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
    clearTimer: (h) => t.sch.clearTimeout(h),
  });
  t.makeReady();
  return { client, t, hooks };
}

describe('registry-driven event round trip (real host + real client)', () => {
  it('the tables cover exactly the registry', () => {
    expect(Object.keys(DOM_SAMPLES).sort()).toEqual(DOM_EVENT_TYPES.filter((e) => e !== 'ready' && e !== 'ack').sort());
    expect(Object.keys(NATIVE_SAMPLES).sort()).toEqual(NATIVE_EVENT_TYPES.filter((e) => e !== 'readyAck').sort());
  });

  it.each(Object.keys(DOM_SAMPLES) as (keyof typeof DOM_SAMPLES)[])('DOM event %s reaches its native hook', async (type) => {
    const { client, hooks } = rig();
    client.sendEvent(type as never, DOM_SAMPLES[type] as never);
    await tick();
    const ignored = hooks.onSignal.mock.calls.filter(([stage]) => stage === 'bridge-ignored-evt' || stage === 'bridge-invalid');
    expect(ignored).toEqual([]);
    const s = DOM_SAMPLES;
    if (type === 'navReady') expect(hooks.onNavReady).toHaveBeenCalledTimes(1);
    if (type === 'navigated') expect(hooks.onNavigated).toHaveBeenCalledWith(s.navigated);
    if (type === 'theme') expect(hooks.onTheme).toHaveBeenCalledWith(s.theme);
    if (type === 'route') expect(hooks.onRoute).toHaveBeenCalledWith(s.route.path, true);
    if (type === 'diag') expect(hooks.onSignal).toHaveBeenCalledWith('mount', 'ok');
  });

  it.each(Object.keys(NATIVE_SAMPLES) as (keyof typeof NATIVE_SAMPLES)[])('native event %s reaches a client subscriber', async (type) => {
    const { client, t } = rig();
    const got = vi.fn();
    client.on(type, got);
    t.host.emit(type, NATIVE_SAMPLES[type] as never);
    await tick();
    expect(got).toHaveBeenCalledWith(NATIVE_SAMPLES[type]);
  });
});
