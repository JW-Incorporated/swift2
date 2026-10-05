import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HapticKind, Insets, NotificationPrefs, NotificationStatus, SharePayload } from '../host/types';
import { COMMAND_TYPES, DOM_COMMAND_TYPES, EVENT_TYPES, NATIVE_COMMAND_TYPES, resOk, toExternalUrl, toWebPath } from './index';
import type { CommandType, DomCommandType, EventPayloadOf, EventType, Handler, HandlerMap, JsonValue, PayloadOf, ResultOf } from './index';

describe('runtime registries', () => {
  it('list every command and event exactly once', () => {
    expect(new Set(COMMAND_TYPES).size).toBe(COMMAND_TYPES.length);
    expect(COMMAND_TYPES).toHaveLength(DOM_COMMAND_TYPES.length + NATIVE_COMMAND_TYPES.length);
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
    expect([...COMMAND_TYPES].sort()).toEqual(
      [
        'api', 'apiRead', 'back', 'cancel', 'haptic', 'navigate', 'notifications.register', 'notifications.request',
        'notifications.status', 'notifications.updatePrefs', 'notifications.getPrefs', 'notifications.savePrefs', 'notifications.unregister', 'notifications.registration', 'notifications.onboardingOffered', 'notifications.markOnboardingOffered', 'openExternal', 'share', 'storage.load', 'storage.write',
      ].sort(),
    );
    expect([...EVENT_TYPES].sort()).toEqual(['ack', 'contentVersion', 'diag', 'insets', 'navReady', 'navigate', 'navigated', 'ready', 'readyAck', 'theme']);
  });
});

describe('JSON round-trip, one sample per type', () => {
  const insets: Insets = { top: 1, right: 2, bottom: 3, left: 4 };
  const commandSamples: { [T in CommandType]: PayloadOf<T> } = {
    navigate: { path: toWebPath('/era/folklore?x=1')!, replace: true },
    share: { title: 't', text: 'x', url: 'https://example.test' },
    haptic: { kind: 'success' },
    openExternal: { url: toExternalUrl('https://example.test')! },
    'notifications.status': {},
    'notifications.request': {},
    'notifications.register': {},
    'notifications.updatePrefs': { prefs: { releases: true } },
    'notifications.getPrefs': {},
    'notifications.savePrefs': {},
    'notifications.unregister': {},
    'notifications.registration': {},
    'notifications.onboardingOffered': {},
    'notifications.markOnboardingOffered': {},
    api: { req: { method: 'POST', path: '/api/mood', headers: { accept: 'application/json' }, body: '{}' } },
    apiRead: { streamId: 's1' },
    cancel: { targetId: 'a1' },
    'storage.load': {},
    'storage.write': { entries: { k: 'v' } },
    back: {},
  };
  const eventSamples: { [T in EventType]: EventPayloadOf<T> } = {
    ready: { v: 1, range: { min: 1, max: 1 } },
    diag: { stage: 'mount', detail: 'ok' },
    ack: { seq: 4 },
    insets,
    contentVersion: { token: 'abc' },
    readyAck: { hwm: 0 },
    navigate: { path: toWebPath('/')!, source: 'deeplink', id: 't1' },
    navReady: {},
    navigated: { id: 't1', ok: true },
    theme: { statusBarStyle: 'light', background: '#0c0c0c' },
  };
  it.each([...Object.entries(commandSamples), ...Object.entries(eventSamples)])('%s', (_t, payload) => {
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});

describe('type-level contract', () => {
  it('HandlerMap is exhaustive over the DOM command union and keyed by it', () => {
    expectTypeOf<keyof HandlerMap>().toEqualTypeOf<DomCommandType>();
    expectTypeOf<HandlerMap['api']>().toEqualTypeOf<Handler<'api'>>();
    // @ts-expect-error a map missing a command does not satisfy HandlerMap
    const _missing: HandlerMap = { navigate: async () => resOk(null) };
    void _missing;
  });

  it('payloads and results are JSON-serializable for every command and event', () => {
    type CmdJson = {
      [T in CommandType]: PayloadOf<T> extends JsonValue ? (ResultOf<T> extends JsonValue ? true : false) : false;
    };
    type EvtJson = { [T in EventType]: EventPayloadOf<T> extends JsonValue ? true : false };
    expectTypeOf<CmdJson[CommandType]>().toEqualTypeOf<true>();
    expectTypeOf<EvtJson[EventType]>().toEqualTypeOf<true>();
  });

  it('JsonValue rejects functions, Dates and Maps', () => {
    expectTypeOf<() => void>().not.toExtend<JsonValue>();
    expectTypeOf<Date>().not.toExtend<JsonValue>();
    expectTypeOf<Map<string, string>>().not.toExtend<JsonValue>();
    expectTypeOf<{ cb: () => void }>().not.toExtend<JsonValue>();
  });

  it('JsonValue rejects explicit undefined object values', () => {
    expectTypeOf<{ a: undefined }>().not.toExtend<JsonValue>();
    expectTypeOf<{ a?: string }>().toExtend<JsonValue>();
  });

  it('JsonValue admits optional fields (absent on the wire) and branded strings', () => {
    expectTypeOf<{ a?: string }>().toExtend<JsonValue>();
    expectTypeOf<PayloadOf<'navigate'>>().toExtend<JsonValue>();
  });

  it('a plain string is not a WebPath or ExternalUrl', () => {
    expectTypeOf<string>().not.toExtend<PayloadOf<'navigate'>['path']>();
    expectTypeOf<'/x'>().not.toExtend<PayloadOf<'navigate'>['path']>();
    expectTypeOf<'https://x.test'>().not.toExtend<PayloadOf<'openExternal'>['url']>();
  });

  it('shared primitive types are the host/types definitions', () => {
    expectTypeOf<PayloadOf<'share'>>().toEqualTypeOf<SharePayload>();
    expectTypeOf<PayloadOf<'haptic'>['kind']>().toEqualTypeOf<HapticKind>();
    expectTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>().toEqualTypeOf<NotificationPrefs>();
    expectTypeOf<ResultOf<'notifications.status'>>().toEqualTypeOf<NotificationStatus>();
    expectTypeOf<EventPayloadOf<'insets'>>().toEqualTypeOf<Insets>();
  });
});
