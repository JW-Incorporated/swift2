import { describe, expect, it } from 'vitest';
import { MAX_PAYLOAD_SIZE, parseEnvelope, parseEnvelopeValue } from './index';

// Fable ruling 2026-10-03 (#4788): the object path must be equivalent to the
// string path, because canonicalize is exactly JSON.stringify -> JSON.parse.
const base = { v: 1, id: 'abc-1', kind: 'evt', type: 'ping', ts: 1 };

const both = (obj: unknown) => ({
  viaValue: parseEnvelopeValue(obj),
  viaString: parseEnvelope(JSON.stringify(obj)),
});

describe('parseEnvelopeValue === parseEnvelope(JSON.stringify(x))', () => {
  it('plain valid envelope: same accepted value', () => {
    const { viaValue, viaString } = both({ ...base, payload: { a: [1, 'x', null] } });
    expect(viaValue.ok).toBe(true);
    expect(viaValue).toEqual(viaString);
  });

  it('own __proto__ key in the payload: same outcome and value', () => {
    const obj = JSON.parse('{"v":1,"id":"abc-1","kind":"evt","type":"ping","ts":1,"payload":{"__proto__":{"polluted":true}}}');
    expect(Object.prototype.hasOwnProperty.call(obj.payload, '__proto__')).toBe(true);
    const { viaValue, viaString } = both(obj);
    expect(viaValue).toEqual(viaString);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('own __proto__ key on the envelope itself: same outcome and value', () => {
    const obj = JSON.parse('{"__proto__":{"polluted":true},"v":1,"id":"abc-1","kind":"evt","type":"ping","ts":1,"payload":null}');
    const { viaValue, viaString } = both(obj);
    expect(viaValue).toEqual(viaString);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('own __proto__ via defineProperty: same outcome and value', () => {
    const payload = {};
    Object.defineProperty(payload, '__proto__', { value: { x: 1 }, enumerable: true, configurable: true, writable: true });
    const { viaValue, viaString } = both({ ...base, payload });
    expect(viaValue).toEqual(viaString);
  });

  it('getter: evaluated once by stringify, same outcome and value', () => {
    const payload = {
      get live() {
        return 'got';
      },
    };
    const { viaValue, viaString } = both({ ...base, payload });
    expect(viaValue.ok).toBe(true);
    expect(viaValue).toEqual(viaString);
  });

  it('canonical JSON over 256 KB is rejected on both paths', () => {
    const obj = { ...base, payload: 'x'.repeat(MAX_PAYLOAD_SIZE + 1) };
    const { viaValue, viaString } = both(obj);
    expect(viaValue).toEqual({ ok: false, reason: 'too-large' });
    expect(viaString).toEqual(viaValue);
  });
});

describe('circular object', () => {
  it('returns invalid and never throws', () => {
    // If canonicalize ever throws in production, the transport isn't JSON:
    // reopen the 2026-10-03 Fable ruling.
    const circ: Record<string, unknown> = { ...base };
    circ.payload = circ;
    let result: ReturnType<typeof parseEnvelopeValue> | undefined;
    expect(() => {
      result = parseEnvelopeValue(circ);
    }).not.toThrow();
    expect(result).toEqual({ ok: false, reason: 'bad-json' });
  });
});
