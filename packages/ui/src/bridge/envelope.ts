import { checkStrictJson, isBridgeId } from './validate';
import type { JsonFailure } from './validate';

/**
 * Bridge envelope (One UI WP2.3-A). Transport-neutral: nothing here knows how
 * an envelope travels (Expo DOM props/actions live only in the app's host
 * wiring). Everything that crosses is JSON-serializable: no functions, Dates,
 * Maps, class instances or `undefined` array holes.
 *
 * Optional-field semantics: an object type's optional field (`a?: T`) is typed
 * `T | undefined` so it satisfies `JsonValue`, but on the wire the key must be
 * ABSENT. An explicit `undefined` value is rejected by `parseEnvelope`.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type EnvelopeKind = 'cmd' | 'res' | 'evt';

export type Envelope = {
  /** Protocol version of the sender (`BRIDGE_VERSION`). */
  v: number;
  /** 1-64 chars of `[A-Za-z0-9_-]`. A `res` reuses the `id` of the `cmd` it answers. */
  id: string;
  kind: EnvelopeKind;
  type: string;
  /** Strict JSON (see `checkStrictJson`); a missing payload is normalized to `null`. */
  payload: JsonValue;
  /** Informational and untrusted: never used for auth, ordering or dedup. */
  ts: number;
  /** Sequence number on native-to-DOM queued messages; acked by `ack {seq}`. */
  seq?: number;
};

export type ResErrorCode = 'unsupported' | 'timeout' | 'cancelled' | 'invalid' | 'failed';

export type ResError = { code: ResErrorCode; message: string };

/** The payload of every `res` envelope. */
export type ResResult<V = JsonValue> = { ok: true; value: V } | { ok: false; error: ResError };

const KINDS: readonly EnvelopeKind[] = ['cmd', 'res', 'evt'];
const ERROR_CODES: readonly ResErrorCode[] = ['unsupported', 'timeout', 'cancelled', 'invalid', 'failed'];

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

export type ParseFailure = 'malformed' | 'bad-id' | JsonFailure;

export type ParseResult = { ok: true; envelope: Envelope } | { ok: false; reason: ParseFailure };

/**
 * Hand-written guard (no dependency). Never throws on hostile input; returns a
 * typed failure for anything that is not a well-formed envelope with a strict
 * JSON payload (depth <= 32, serialized <= 256 KB).
 */
export function parseEnvelope(raw: unknown): ParseResult {
  const bad = (reason: ParseFailure): ParseResult => ({ ok: false, reason });
  try {
    if (!isRecord(raw)) return bad('malformed');
    const { v, id, kind, type, payload, ts, seq } = raw;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) return bad('malformed');
    if (!isBridgeId(id)) return bad('bad-id');
    if (typeof kind !== 'string' || !KINDS.includes(kind as EnvelopeKind)) return bad('malformed');
    if (typeof type !== 'string' || type === '' || type.length > 64) return bad('malformed');
    if (typeof ts !== 'number' || !Number.isFinite(ts)) return bad('malformed');
    if (seq !== undefined && (typeof seq !== 'number' || !Number.isInteger(seq) || seq < 0)) return bad('malformed');
    const json = checkStrictJson(payload === undefined ? null : payload);
    if (!json.ok) return bad(json.reason);
    const envelope: Envelope = { v, id, kind: kind as EnvelopeKind, type, payload: json.value, ts };
    if (seq !== undefined) envelope.seq = seq;
    return { ok: true, envelope };
  } catch {
    return bad('malformed');
  }
}

/** Shape guard for a `res` envelope's payload. */
export function isResResult(x: unknown): x is ResResult<unknown> {
  if (!isRecord(x)) return false;
  if (x.ok === true) return 'value' in x;
  if (x.ok !== false || !isRecord(x.error)) return false;
  return (
    typeof x.error.message === 'string' &&
    typeof x.error.code === 'string' &&
    ERROR_CODES.includes(x.error.code as ResErrorCode)
  );
}

export const resOk = <V>(value: V): ResResult<V> => ({ ok: true, value });

export const resErr = (code: ResErrorCode, message: string): ResResult<never> => ({
  ok: false,
  error: { code, message },
});

/** Build the one `res` that answers `cmd` (same `id`). */
export function makeRes(cmd: Pick<Envelope, 'id' | 'type'>, result: ResResult<JsonValue>, v: number, ts: number): Envelope {
  return { v, id: cmd.id, kind: 'res', type: cmd.type, payload: result, ts };
}
