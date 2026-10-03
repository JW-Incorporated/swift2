import { vi } from 'vitest';
import { BRIDGE_VERSION, resOk } from '@swift2/ui';
import type { Envelope, HandlerMap, ResResult } from '@swift2/ui';
import { createBridgeHost } from './bridge-host';

function fakeScheduler() {
  let t = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    setTimeout: (fn: () => void, ms: number) => {
      const id = nextId++;
      timers.set(id, { at: t + ms, fn });
      return id;
    },
    clearTimeout: (h: unknown) => void timers.delete(h as number),
    advance(ms: number) {
      t += ms;
      for (const [id, x] of [...timers]) {
        if (x.at <= t) {
          timers.delete(id);
          x.fn();
        }
      }
    },
    count: () => timers.size,
  };
}

export const tick = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

export function setup(over: Partial<Record<keyof HandlerMap, HandlerMap[keyof HandlerMap]>> = {}, extra = {}) {
  const ok = async () => resOk(null);
  const base = {
    navigate: ok,
    share: ok,
    haptic: ok,
    openExternal: ok,
    'notifications.status': async () => resOk({ permission: 'granted', registered: true, prefs: {} }),
    'notifications.request': async () => resOk({ permission: 'granted', registered: true, prefs: {} }),
    'notifications.register': ok,
    'notifications.updatePrefs': ok,
    api: async () => resOk({ status: 200, headers: {}, body: '' }),
  };
  const handlers = { ...base, ...over } as unknown as Omit<HandlerMap, 'cancel'>;
  const sent: Envelope[] = [];
  const readyAcks: Envelope[] = [];
  const sch = fakeScheduler();
  const onProtocolFatal = vi.fn();
  const onSignal = vi.fn();
  const host = createBridgeHost({
    handlers,
    send: (e) => void (e.type === 'readyAck' ? readyAcks : sent).push(e),
    now: () => 1000,
    scheduler: sch,
    onProtocolFatal,
    onSignal,
    ...extra,
  });
  const cmd = (id: string, type: string, payload: unknown = {}) =>
    host.receive({ v: 1, id, kind: 'cmd', type, payload, ts: 1 });
  const evt = (type: string, payload: unknown, id = `e-${type}`) =>
    host.receive({ v: 1, id, kind: 'evt', type, payload, ts: 1 });
  const makeReady = (id = 'e-ready') => evt('ready', { v: BRIDGE_VERSION }, id);
  const resFor = (id: string) => sent.filter((e) => e.kind === 'res' && e.id === id);
  return { host, sent, readyAcks, sch, onProtocolFatal, onSignal, cmd, evt, makeReady, resFor };
}

export const body = (e: Envelope) => e.payload as ResResult;
