/**
 * Bridge envelope (One UI WP2.3-A). Transport-neutral: nothing here knows how
 * an envelope travels (Expo DOM props/actions live only in the app's host
 * wiring). Everything that crosses is JSON-serializable: no functions, Dates,
 * Maps, class instances or `undefined` array holes.
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
  /** A `res` reuses the `id` of the `cmd` it answers. */
  id: string;
  kind: EnvelopeKind;
  type: string;
  payload: unknown;
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

/** Hand-written guard (no dependency). Returns null for anything that is not an envelope. */
export function parseEnvelope(raw: unknown): Envelope | null {
  if (!isRecord(raw)) return null;
  const { v, id, kind, type, payload, ts, seq } = raw;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (typeof id !== 'string' || id === '') return null;
  if (typeof kind !== 'string' || !KINDS.includes(kind as EnvelopeKind)) return null;
  if (typeof type !== 'string' || type === '') return null;
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
  if (seq !== undefined && (typeof seq !== 'number' || !Number.isFinite(seq))) return null;
  const env: Envelope = { v, id, kind: kind as EnvelopeKind, type, payload: payload ?? null, ts };
  if (seq !== undefined) env.seq = seq;
  return env;
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
export function makeRes(cmd: Pick<Envelope, 'id' | 'type'>, result: ResResult<unknown>, v: number, ts: number): Envelope {
  return { v, id: cmd.id, kind: 'res', type: cmd.type, payload: result, ts };
}
