import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HapticKind, Insets, NotificationPrefs, NotificationStatus, SharePayload } from '../host/types';
import {
  BRIDGE_VERSION,
  COMMAND_TYPES,
  DOM_COMMAND_TYPES,
  EVENT_TYPES,
  NATIVE_COMMAND_TYPES,
  inRange,
  isDomCommandType,
  isResResult,
  makeRes,
  negotiate,
  parseEnvelope,
  resErr,
  resOk,
} from './index';
import type {
  CommandType,
  DomCommandType,
  EventPayloadOf,
  EventType,
  Handler,
  HandlerMap,
  JsonValue,
  PayloadOf,
  ResultOf,
} from './index';

const good = { v: 1, id: 'a1', kind: 'cmd', type: 'haptic', payload: { kind: 'light' }, ts: 5 };

describe('parseEnvelope', () => {
  it('accepts a valid envelope and an optional seq', () => {
    expect(parseEnvelope(good)).toEqual(good);
    expect(parseEnvelope({ ...good, kind: 'evt', seq: 3 })?.seq).toBe(3);
  });
  it('normalizes a missing payload to null', () => {
    expect(parseEnvelope({ ...good, payload: undefined })?.payload).toBeNull();
  });
  it.each([
    ['null', null],
    ['string', 'x'],
    ['array', []],
    ['wrong kind', { ...good, kind: 'req' }],
    ['numeric id', { ...good, id: 7 }],
    ['empty id', { ...good, id: '' }],
    ['numeric type', { ...good, type: 1 }],
    ['NaN ts', { ...good, ts: Number.NaN }],
    ['string ts', { ...good, ts: '5' }],
    ['Infinity v', { ...good, v: Infinity }],
    ['missing v', { ...good, v: undefined }],
    ['string seq', { ...good, seq: '1' }],
  ])('rejects %s', (_name, raw) => {
    expect(parseEnvelope(raw)).toBeNull();
  });
});

describe('isResResult', () => {
  it('accepts ok and error bodies, rejects malformed', () => {
    expect(isResResult(resOk(null))).toBe(true);
    expect(isResResult(resErr('timeout', 'slow'))).toBe(true);
    expect(isResResult({ ok: true })).toBe(false);
    expect(isResResult({ ok: false, error: { code: 'nope', message: 'm' } })).toBe(false);
    expect(isResResult(null)).toBe(false);
  });
  it('makeRes reuses the cmd id', () => {
    const res = makeRes({ id: 'z', type: 'share' }, resErr('unsupported', 'x'), BRIDGE_VERSION, 9);
    expect(res).toMatchObject({ id: 'z', kind: 'res', type: 'share', v: BRIDGE_VERSION, ts: 9 });
  });
});

describe('version rules', () => {
  const range = { min: 2, max: 4 };
  it('inRange is inclusive', () => {
    expect([1, 2, 4, 5].map((v) => inRange(v, range))).toEqual([false, true, true, false]);
  });
  it('negotiate reports too-old and too-new at the boundaries', () => {
    expect(negotiate(2, range)).toEqual({ ok: true });
    expect(negotiate(4, range)).toEqual({ ok: true });
    expect(negotiate(1, range)).toEqual({ ok: false, reason: 'too-old' });
    expect(negotiate(5, range)).toEqual({ ok: false, reason: 'too-new' });
  });
  it('unknown types are not in the registry (host answers unsupported)', () => {
    expect(isDomCommandType('teleport')).toBe(false);
    expect(isDomCommandType('toString')).toBe(false);
    expect(isDomCommandType('api')).toBe(true);
  });
});

describe('runtime registries', () => {
  it('list every command and event exactly once', () => {
    expect(new Set(COMMAND_TYPES).size).toBe(COMMAND_TYPES.length);
    expect(COMMAND_TYPES).toHaveLength(DOM_COMMAND_TYPES.length + NATIVE_COMMAND_TYPES.length);
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
    expect([...COMMAND_TYPES].sort()).toEqual(
      [
        'api', 'back', 'cancel', 'haptic', 'navigate', 'notifications.register', 'notifications.request',
        'notifications.status', 'notifications.updatePrefs', 'openExternal', 'share',
      ].sort(),
    );
    expect([...EVENT_TYPES].sort()).toEqual(['ack', 'contentVersion', 'diag', 'insets', 'navigate', 'ready']);
  });
});

describe('JSON round-trip, one sample per type', () => {
  const insets: Insets = { top: 1, right: 2, bottom: 3, left: 4 };
  const commandSamples: { [T in CommandType]: PayloadOf<T> } = {
    navigate: { path: '/era/folklore?x=1', replace: true },
    share: { title: 't', text: 'x', url: 'https://example.test' },
    haptic: { kind: 'success' },
    openExternal: { url: 'https://example.test' },
    'notifications.status': {},
    'notifications.request': {},
    'notifications.register': {},
    'notifications.updatePrefs': { prefs: { releases: true } },
    api: { req: { method: 'POST', path: '/api/mood', headers: { accept: 'application/json' }, body: '{}' } },
    cancel: { targetId: 'a1' },
    back: {},
  };
  const eventSamples: { [T in EventType]: EventPayloadOf<T> } = {
    ready: { v: 1, range: { min: 1, max: 1 } },
    diag: { stage: 'mount', detail: 'ok' },
    ack: { seq: 4 },
    insets,
    contentVersion: { token: 'abc' },
    navigate: { path: '/', source: 'deeplink' },
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

  it('shared primitive types are the host/types definitions', () => {
    expectTypeOf<PayloadOf<'share'>>().toEqualTypeOf<SharePayload>();
    expectTypeOf<PayloadOf<'haptic'>['kind']>().toEqualTypeOf<HapticKind>();
    expectTypeOf<PayloadOf<'notifications.updatePrefs'>['prefs']>().toEqualTypeOf<NotificationPrefs>();
    expectTypeOf<ResultOf<'notifications.status'>>().toEqualTypeOf<NotificationStatus>();
    expectTypeOf<EventPayloadOf<'insets'>>().toEqualTypeOf<Insets>();
  });
});
