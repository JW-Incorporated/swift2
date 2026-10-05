import { describe, expect, it, vi } from 'vitest';
import { DOM_COMMAND_TYPES, createBridgeClient, resOk } from '@swift2/ui';
import type { BridgeClient, DomCommandType, Envelope } from '@swift2/ui';
import { validateCommand, validRoute } from './bridge-host-validate';
import { createDomHostHandlers } from './dom-host-handlers';
import { setup, tick } from './bridge-host.test-kit';

// Runtime half of the exhaustiveness gates (the compile-time half is the `never` default in validateCommand
// and the Record<DomCommandType, ...> behind resultFits): a command kind with no validator case or no
// result shape fails here by name, not by a silent `{}` / pass-through.
describe('every registered DOM command has validator and resultFits coverage', () => {
  it.each(DOM_COMMAND_TYPES)('%s: validateCommand has a case', (type) => {
    expect(() => validateCommand(type, {})).not.toThrow();
  });

  it('a command kind outside the registry is a thrown gate failure, not a pass', () => {
    expect(() => validateCommand('nope' as DomCommandType, {})).toThrow(/unhandled command/);
  });
});

describe('newer wire shapes', () => {
  it('storage.write allowEmpty: only a boolean, strict keys', () => {
    expect(validateCommand('storage.write', { entries: {}, allowEmpty: true })).toEqual({ entries: {}, allowEmpty: true });
    expect(validateCommand('storage.write', { entries: { a: '1' } })).toEqual({ entries: { a: '1' } });
    expect(validateCommand('storage.write', { entries: {}, allowEmpty: 'yes' })).toBeNull();
    expect(validateCommand('storage.write', { entries: {}, extra: 1 })).toBeNull();
  });

  it('notifications.optOutPending takes an empty payload', () => {
    expect(validateCommand('notifications.optOutPending', {})).toEqual({});
  });

  it('route: engaged is boolean-only; a bad snap is dropped but the route kept', () => {
    const snap = { v: 1, mode: 'era', eraId: 'folklore', scrollY: 5 };
    expect(validRoute({ path: '/a', engaged: true, snap })).toEqual({ path: '/a', busy: false, engaged: true, snap });
    expect(validRoute({ path: '/a', engaged: 'x' })).toBeNull();
    expect(validRoute({ path: '/a', snap: { ...snap, v: 2 } })).toEqual({ path: '/a', busy: false, engaged: false, snap: null });
  });
});

describe('per-epoch bridge token through the real DOM host handlers, host and client', () => {
  function rig(token: string, presented: () => string) {
    // eslint-disable-next-line prefer-const -- the send closure needs the binding before assignment
    let client!: BridgeClient;
    const seen = vi.fn();
    const t = setup(
      { 'notifications.optOutPending': (async () => (seen(), resOk({ pending: true }))) as never },
      { send: (e: Envelope) => void client.receive(e) },
    );
    const onSignal = vi.fn();
    const handlers = createDomHostHandlers({
      onSignal,
      watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() },
      token,
      bridge: async (env) => void t.host.receive(env),
    });
    client = createBridgeClient({
      post: (e) => void handlers.bridge(e, presented()).catch(() => undefined),
      now: () => 1000,
      setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
      clearTimer: (h) => t.sch.clearTimeout(h),
    });
    t.makeReady();
    return { client, seen, onSignal };
  }

  it('the epoch token lets a command through to its handler', async () => {
    const { client, seen } = rig('epoch-2', () => 'epoch-2');
    const p = client.call('notifications.optOutPending', {});
    await tick();
    expect(seen).toHaveBeenCalledTimes(1);
    expect(await p).toEqual(resOk({ pending: true }));
  });

  it('a previous epoch token is refused: signalled, and the handler never runs', async () => {
    const { client, seen, onSignal } = rig('epoch-2', () => 'epoch-1');
    void client.call('notifications.optOutPending', {});
    await tick();
    expect(seen).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('bridge-unauth', 'bridge');
  });
});
