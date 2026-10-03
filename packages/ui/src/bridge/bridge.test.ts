import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HapticKind, Insets, NotificationPrefs, NotificationStatus, SharePayload } from '../host/types';
import {
  BRIDGE_VERSION,
  COMMAND_TYPES,
  DOM_COMMAND_TYPES,
  EVENT_TYPES,
  MAX_API_BODY,
  MAX_PAYLOAD_DEPTH,
  MAX_PAYLOAD_SIZE,
  NATIVE_COMMAND_TYPES,
  NATIVE_SUPPORTED_RANGE,
  answerUnknown,
  inRange,
  isBridgeId,
  isDomCommandType,
  isExternalUrl,
  isResResult,
  isWebPath,
  makeRes,
  negotiate,
  parseEnvelope,
  parseReady,
  resErr,
  resOk,
  sanitizeApiRequest,
  toExternalUrl,
  toWebPath,
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

const env = (r: unknown) => {
  const p = parseEnvelope(r);
  return p.ok ? p.envelope : null;
};
const reason = (r: unknown) => {
  const p = parseEnvelope(r);
  return p.ok ? null : p.reason;
};

describe('parseEnvelope', () => {
  it('accepts a valid envelope and an optional seq', () => {
    expect(env(good)).toEqual(good);
    expect(env({ ...good, kind: 'evt', seq: 3 })?.seq).toBe(3);
  });
  it('normalizes a missing payload to null', () => {
    expect(env({ ...good, payload: undefined })?.payload).toBeNull();
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
    ['fractional v', { ...good, v: 1.5 }],
    ['negative v', { ...good, v: -1 }],
    ['string seq', { ...good, seq: '1' }],
  ])('rejects %s', (_name, raw) => {
    expect(parseEnvelope(raw).ok).toBe(false);
  });
  it('ids: 1-64 chars of [A-Za-z0-9_-]', () => {
    expect(reason({ ...good, id: 'a'.repeat(65) })).toBe('bad-id');
    expect(reason({ ...good, id: 'a b' })).toBe('bad-id');
    expect(reason({ ...good, id: 'a/../b' })).toBe('bad-id');
    expect(env({ ...good, id: 'A_z-9'.repeat(12) + 'abcd' })).not.toBeNull();
    expect(isBridgeId('')).toBe(false);
  });
});

describe('parseEnvelope payload is strict JSON', () => {
  const holes: unknown[] = [1, 2, 3];
  delete holes[1];
  const withProtoKey = JSON.parse('{"__proto__":{"x":1}}') as unknown;
  class Klass {
    a = 1;
  }
  let deep: unknown = 1;
  for (let i = 0; i < 40; i++) deep = [deep];
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  it.each([
    ['function', () => 1],
    ['nested function', { a: () => 1 }],
    ['bigint', 1n],
    ['NaN', Number.NaN],
    ['Infinity', { a: Infinity }],
    ['undefined value', { a: undefined }],
    ['array hole', holes],
    ['symbol', Symbol('x')],
    ['Date', new Date()],
    ['Map', new Map()],
    ['class instance', new Klass()],
    ['own __proto__ key', withProtoKey],
    ['constructor key', { constructor: 1 }],
    ['prototype key', { prototype: 1 }],
    ['getter', Object.defineProperty({}, 'a', { get: () => 1, enumerable: true })],
    ['cycle', cyclic],
    ['array with extra prop', Object.assign([1], { x: 1 })],
  ])('rejects %s without throwing', (_n, payload) => {
    expect(parseEnvelope({ ...good, payload }).ok).toBe(false);
  });
  it('rejects a throwing proxy without throwing', () => {
    const proxy = new Proxy({}, { ownKeys: () => { throw new Error('boom'); } });
    expect(parseEnvelope({ ...good, payload: proxy }).ok).toBe(false);
  });
  it('rejects depth > 32 and serialized size > 256 KB', () => {
    expect(reason({ ...good, payload: deep })).toBe('too-deep');
    expect(reason({ ...good, payload: 'x'.repeat(MAX_PAYLOAD_SIZE + 1) })).toBe('too-large');
  });
  it('accepts null-prototype objects, nesting at the limit and the size limit', () => {
    expect(parseEnvelope({ ...good, payload: Object.assign(Object.create(null), { a: [1, 'x', null, true] }) }).ok).toBe(true);
    let ok: unknown = 1;
    for (let i = 0; i < MAX_PAYLOAD_DEPTH; i++) ok = [ok];
    expect(parseEnvelope({ ...good, payload: ok }).ok).toBe(true);
    expect(parseEnvelope({ ...good, payload: 'x'.repeat(MAX_PAYLOAD_SIZE - 2) }).ok).toBe(true);
  });
  it('explicit undefined is dropped by JSON.stringify but rejected on the wire', () => {
    expect(JSON.stringify({ a: undefined })).toBe('{}');
    expect(parseEnvelope({ ...good, payload: { a: undefined } }).ok).toBe(false);
  });
});

describe('isWebPath', () => {
  it.each(['/', '/era/folklore?x=1', '/a/b#c', '/era/a.b'])('accepts %s', (p) => {
    expect(isWebPath(p)).toBe(true);
  });
  it.each([
    'era', '//evil.test', '///x', '/\\evil', '/a\\b', '/a\nb', '/a\u0000b', '/../x', '/a/../b', '/a/./b',
    '/%2F%2Fevil', '/%2f', '/%5Cevil', '/%5c', '/%2e%2e/x', '/a%00', 'https://x.test', 'javascript:1', '',
  ])('rejects %j', (p) => {
    expect(isWebPath(p)).toBe(false);
  });
  it('rejects non-strings', () => {
    expect(isWebPath(1)).toBe(false);
    expect(isWebPath(null)).toBe(false);
  });
});

describe('isExternalUrl', () => {
  it('accepts https only', () => {
    expect(isExternalUrl('https://example.test/a?b=1')).toBe(true);
  });
  it.each([
    'http://example.test', 'javascript:alert(1)', 'intent://x#Intent;end', 'file:///etc/passwd',
    'data:text/html,hi', 'mailto:a@b.test', 'https:example.test', 'https://', 'https://a.test/\\x',
    'https://a.test/\n', ' https://a.test', 'HTTPS://u@a.test', '',
  ])('rejects %j', (u) => {
    expect(isExternalUrl(u)).toBe(false);
  });
});

describe('sanitizeApiRequest', () => {
  const req = { method: 'POST', path: '/api/mood', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: '{}' };
  it('keeps safelisted headers (lower-cased) and drops nothing else silently', () => {
    expect(sanitizeApiRequest(req)).toEqual({
      method: 'POST', path: '/api/mood', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: '{}',
    });
    expect(sanitizeApiRequest({ method: 'GET', path: '/api/x' })).toEqual({ method: 'GET', path: '/api/x' });
  });
  it.each([
    ['Authorization', { headers: { Authorization: 'Bearer x' } }],
    ['Cookie', { headers: { cookie: 'a=b' } }],
    ['arbitrary header', { headers: { 'x-foo': '1' } }],
    ['unsafe content-type', { headers: { 'content-type': 'application/xml' } }],
    ['header injection', { headers: { accept: 'a\r\nCookie: x' } }],
    ['non-string header', { headers: { accept: 1 } }],
    ['bad method', { method: 'PATCH' }],
    ['non-api path', { path: '/era/x' }],
    ['traversal', { path: '/api/../admin' }],
    ['absolute path', { path: 'https://evil.test/api/x' }],
    ['protocol-relative', { path: '//evil.test/api/x' }],
    ['non-string body', { body: 5 }],
    ['oversized body', { body: 'x'.repeat(MAX_API_BODY + 1) }],
  ])('rejects %s', (_n, patch) => {
    expect(sanitizeApiRequest({ ...req, ...patch })).toBeNull();
  });
  it('rejects non-objects without throwing', () => {
    expect(sanitizeApiRequest(null)).toBeNull();
    expect(sanitizeApiRequest([])).toBeNull();
    expect(sanitizeApiRequest('x')).toBeNull();
  });
});

describe('answerUnknown', () => {
  it('answers unsupported for an unknown cmd type, same id', () => {
    const res = answerUnknown({ id: 'q1', type: 'teleport' }, BRIDGE_VERSION, 3);
    expect(res).toMatchObject({ id: 'q1', kind: 'res', type: 'teleport', payload: { ok: false, error: { code: 'unsupported' } } });
    expect(answerUnknown({ id: 'q1', type: 'toString' }, 1, 3)?.kind).toBe('res');
  });
  it('returns null for a known command', () => {
    expect(answerUnknown({ id: 'q1', type: 'haptic' }, 1, 3)).toBeNull();
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
  it('negotiate fails closed on bad versions and ranges', () => {
    for (const v of [Number.NaN, -1, 1.5, Infinity]) expect(negotiate(v, range)).toEqual({ ok: false, reason: 'invalid' });
    for (const r of [{ min: 4, max: 2 }, { min: Number.NaN, max: 2 }, { min: 1, max: 2.5 }, { min: -1, max: 2 }]) {
      expect(negotiate(3, r)).toEqual({ ok: false, reason: 'invalid' });
      expect(inRange(3, r)).toBe(false);
    }
  });
  it('NATIVE_SUPPORTED_RANGE accepts the current version', () => {
    expect(negotiate(BRIDGE_VERSION, NATIVE_SUPPORTED_RANGE)).toEqual({ ok: true });
  });
  it('parseReady validates v and an optional range (absent = DOM speaks only v)', () => {
    expect(parseReady({ v: 1 })).toEqual({ v: 1 });
    expect(parseReady({ v: 1, range: { min: 1, max: 2 } })).toEqual({ v: 1, range: { min: 1, max: 2 } });
    for (const p of [null, [], {}, { v: -1 }, { v: 1.5 }, { v: 1, range: { min: 3, max: 1 } }, { v: 1, range: 5 }]) {
      expect(parseReady(p)).toBeNull();
    }
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
    expect([...EVENT_TYPES].sort()).toEqual(['ack', 'contentVersion', 'diag', 'insets', 'navigate', 'ready', 'readyAck']);
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
    api: { req: { method: 'POST', path: '/api/mood', headers: { accept: 'application/json' }, body: '{}' } },
    cancel: { targetId: 'a1' },
    back: {},
  };
  const eventSamples: { [T in EventType]: EventPayloadOf<T> } = {
    ready: { v: 1, range: { min: 1, max: 1 } },
    diag: { stage: 'mount', detail: 'ok' },
    ack: { seq: 4 },
    readyAck: { hwm: 0 },
    insets,
    contentVersion: { token: 'abc' },
    navigate: { path: toWebPath('/')!, source: 'deeplink' },
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
