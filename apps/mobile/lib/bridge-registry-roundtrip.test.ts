import { SETTINGS_CATEGORY_DEFS } from '@swift2/shared';
import { describe, expect, it } from 'vitest';
import { DOM_COMMAND_TYPES, createBridgeClient, resOk, toExternalUrl, toWebPath } from '@swift2/ui';
import type { BridgeClient, DomCommandType, Envelope, PayloadOf, ResultOf } from '@swift2/ui';
import { PREFS_FIXTURE, setup, tick } from './bridge-host.test-kit';

// Every DOM command through the REAL host (validator included) and the REAL client (resultFits included):
// the payload must reach the handler intact and a representative result must reach the caller intact.
// Both tables are exhaustive over DomCommandType, so a new command fails typecheck until it is added here.
const REQUESTS: { [T in DomCommandType]: PayloadOf<T> } = {
  navigate: { path: toWebPath('/era/folklore?x=1')!, replace: true },
  share: { title: 't', text: 'x', url: 'https://example.test', image: { url: 'https://example.test/i.png' } },
  haptic: { kind: 'success' },
  openExternal: { url: toExternalUrl('https://example.test/a')! },
  'notifications.status': {},
  'notifications.request': {},
  'notifications.register': {},
  'notifications.updatePrefs': { prefs: { releases: true, tour: false } },
  'notifications.getPrefs': {},
  'notifications.savePrefs': {
    settings: { masterEnabled: true, snoozeUntil: null, dailyCap: 2 },
    prefs: [{ category: SETTINGS_CATEGORY_DEFS[0].id, cadence: 'off' }],
  } as PayloadOf<'notifications.savePrefs'>,
  'notifications.unregister': {},
  'notifications.registration': {},
  'notifications.onboardingOffered': {},
  'notifications.markOnboardingOffered': {},
  api: { req: { method: 'POST', path: '/api/mood', headers: { accept: 'application/json' }, body: '{"a":1}' } },
  apiRead: { streamId: 's1' },
  cancel: { targetId: 'a1' },
};

const RESULTS: { [T in Exclude<DomCommandType, 'cancel'>]: ResultOf<T> } = {
  navigate: null,
  share: { imageCopied: true },
  haptic: null,
  openExternal: null,
  'notifications.status': 'granted',
  'notifications.request': 'denied',
  'notifications.register': null,
  'notifications.updatePrefs': null,
  'notifications.getPrefs': PREFS_FIXTURE as ResultOf<'notifications.getPrefs'>,
  'notifications.savePrefs': PREFS_FIXTURE as ResultOf<'notifications.savePrefs'>,
  'notifications.unregister': null,
  'notifications.registration': { registered: true },
  'notifications.onboardingOffered': { offered: true },
  'notifications.markOnboardingOffered': null,
  api: { status: 201, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' },
  apiRead: { chunk: 'hello', done: false },
};

function rig() {
  const seen: Record<string, unknown> = {};
  const over: Record<string, unknown> = {};
  for (const type of DOM_COMMAND_TYPES) {
    if (type === 'cancel') continue;
    over[type] = async (payload: unknown) => {
      seen[type] = payload;
      return resOk(RESULTS[type]);
    };
  }
  // eslint-disable-next-line prefer-const -- the send closure needs the binding before assignment
  let client!: BridgeClient;
  const t = setup(over as never, { send: (e: Envelope) => void client.receive(e) });
  client = createBridgeClient({
    post: (e) => void t.host.receive(e),
    now: () => 1000,
    setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
    clearTimer: (h) => t.sch.clearTimeout(h),
  });
  t.makeReady();
  return { client, seen };
}

describe('registry-driven bridge round trip (real host + real client)', () => {
  it('the tables cover exactly the registry', () => {
    expect(Object.keys(REQUESTS).sort()).toEqual([...DOM_COMMAND_TYPES].sort());
  });

  it.each(DOM_COMMAND_TYPES.filter((t) => t !== 'cancel'))('%s: request and result arrive intact', async (type) => {
    const { client, seen } = rig();
    const p = (client.call as (t: string, p: unknown) => Promise<unknown>)(type, REQUESTS[type]);
    await tick();
    expect(seen[type]).toEqual(REQUESTS[type]);
    expect(await p).toEqual(resOk(RESULTS[type as Exclude<DomCommandType, 'cancel'>]));
  });

  it('cancel: payload accepted and answered null', async () => {
    const { client } = rig();
    const p = client.call('cancel', REQUESTS.cancel);
    await tick();
    expect(await p).toEqual(resOk(null));
  });

  it('api stream request and head result arrive intact', async () => {
    const head = { status: 200, headers: { 'content-type': 'text/event-stream' }, streamId: 'st1' };
    const seen: unknown[] = [];
    // eslint-disable-next-line prefer-const -- the send closure needs the binding before assignment
    let client!: BridgeClient;
    const t = setup(
      { api: (async (p: unknown) => (seen.push(p), resOk(head))) as never },
      { send: (e: Envelope) => void client.receive(e) },
    );
    client = createBridgeClient({
      post: (e) => void t.host.receive(e),
      now: () => 1000,
      setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
      clearTimer: (h) => t.sch.clearTimeout(h),
    });
    t.makeReady();
    const payload = { req: REQUESTS.api.req, stream: true as const };
    const p = client.call('api', payload);
    await tick();
    expect(seen[0]).toEqual(payload);
    expect(await p).toEqual(resOk(head));
  });
});
