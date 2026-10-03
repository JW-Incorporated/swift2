import { isResResult, makeRes, parseEnvelope, resErr, resOk } from './envelope';
import type { Envelope, JsonValue, ResResult } from './envelope';
import { isNativeCommandType, isNativeEventType } from './messages';
import type { DomCommandType, EventPayloadOf, NativeEventType, PayloadOf, ResultOf } from './messages';
import { checkStrictJson } from './validate';
import { BRIDGE_VERSION } from './version';
import type { VersionRange } from './version';

/**
 * DOM-side bridge client (One UI WP2.3-C). Transport-neutral: the app injects
 * `post` (and feeds `receive`/`consumeInbox`); nothing here knows about Expo.
 * Never throws into React: every failure is a typed `ResResult`.
 *
 * Ordering: with `queueUntilReady`, calls made before the `ready` post succeeds
 * are held in call order and flushed after it (a promise-returning `post`
 * succeeds when it resolves); otherwise calls go out at once. A failed `ready`
 * can be retried with `sendReady()`. A successful `ready` is a new handshake:
 * `lastSeq` resets to -1 (the host re-flushes its unacked queue, #4853).
 */
export const DEFAULT_TIMEOUT_MS = 8000;
export const MAX_PENDING = 64;
export const MAX_BATCH = 64;
const MAX_SCAN = 1024;
const SEEN_CAP = 256;
const STATUSES: readonly unknown[] = ['granted', 'denied', 'undetermined', 'unsupported'];
/** The range this DOM bundle speaks; sent on `ready`. */
export const DOM_SUPPORTED_RANGE: VersionRange = { min: 1, max: BRIDGE_VERSION };

type TimerHandle = unknown;
export type ClientOptions = {
  /** May return a promise (an Expo action): its rejection fails the call, its value is fed to `receive`. */
  post(env: Envelope): void | PromiseLike<unknown>;
  now(): number;
  /** Default: `monotonicIds(now())`. A custom source must stay strictly increasing (the host rejects ids at or below its high-water mark). */
  idGen?(): string;
  setTimer?(fn: () => void, ms: number): TimerHandle;
  clearTimer?(h: TimerHandle): void;
  defaultTimeoutMs?: number;
  /** Hold calls made before `ready` is posted, flushing them in order after. */
  queueUntilReady?: boolean;
};
export type CallOptions = { signal?: AbortSignal; timeoutMs?: number };
type Pending = { type: DomCommandType; resolve(r: ResResult<never>): void; finish(): void };
type BackResponder = (payload: PayloadOf<'back'>) => 'handled' | 'exit' | Promise<'handled' | 'exit'>;

export type BridgeClient = {
  call<T extends DomCommandType>(type: T, payload: PayloadOf<T>, opts?: CallOptions): Promise<ResResult<ResultOf<T>>>;
  on<T extends NativeEventType>(type: T, fn: (payload: EventPayloadOf<T>) => void): () => void;
  handle(type: 'back', fn: BackResponder): () => void;
  /** Feed one raw inbound message (a `res`, or a native `evt`/`cmd`; seq-bearing ones take the inbox path). */
  receive(raw: unknown): boolean;
  /** Process up to MAX_BATCH `seq > lastSeq` in ascending order, then ack the last. Idempotent per seq. */
  consumeInbox(inbox: readonly unknown[]): void;
  sendDiag(stage: string, detail?: string): void;
  sendReady(): void;
  /** Resolves pending as cancelled; every later call resolves `failed`. */
  dispose(): void;
};

const isRec = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isThenable = (x: unknown): x is PromiseLike<unknown> => isRec(x) && typeof x.then === 'function';

/** Drop `undefined`-valued keys (optional fields) so the strict-JSON check sees the wire shape. */
function strip(x: unknown, depth = 0): unknown {
  if (depth > 40) return x;
  if (Array.isArray(x)) return x.map((v) => strip(v, depth + 1));
  if (!isRec(x)) return x;
  const proto = Object.getPrototypeOf(x);
  if (proto !== Object.prototype && proto !== null) return x;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(x)) if (x[k] !== undefined) out[k] = strip(x[k], depth + 1);
  return out;
}

function clean(x: unknown): { ok: true; value: JsonValue } | { ok: false; reason: string } {
  try {
    return checkStrictJson(strip(x));
  } catch {
    return { ok: false, reason: 'bad-json' };
  }
}

function resultFits(type: DomCommandType, v: unknown): boolean {
  if (type === 'notifications.status' || type === 'notifications.request') return STATUSES.includes(v);
  if (type === 'api') {
    return isRec(v) && typeof v.status === 'number' && typeof v.body === 'string' && isRec(v.headers) && Object.values(v.headers).every((h) => typeof h === 'string');
  }
  return v === null;
}

/** Strictly increasing integer ids as digit strings, starting at `seed` (#4853 Fable ruling). */
export function monotonicIds(seed: number): () => string {
  let next = Math.max(0, Math.floor(seed));
  return () => String(next++);
}

export function createBridgeClient(rawOpts: ClientOptions): BridgeClient {
  const newId = rawOpts.idGen ?? monotonicIds(rawOpts.now());
  const opts = { ...rawOpts, idGen: newId };
  const setT = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearT = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const pending = new Map<string, Pending>();
  const subs = new Map<string, Set<(p: never) => void>>();
  const seen: string[] = [];
  let queue: Array<() => void> = [];
  let responder: BackResponder | null = null;
  let lastSeq = -1;
  let handshook = false;
  let readyInFlight = false;
  let open = !opts.queueUntilReady;
  let disposed = false;

  /** True when the post did not throw synchronously; async rejection calls `onFail`. */
  const postEnv = (env: Envelope, onFail: () => void, onOk?: () => void): boolean => {
    try {
      const r = opts.post(env);
      if (isThenable(r)) {
        r.then(
          (reply) => {
            onOk?.();
            if (reply !== undefined && reply !== null) receive(reply);
          },
          onFail,
        );
      } else onOk?.();
      return true;
    } catch {
      return false;
    }
  };

  const send = (kind: Envelope['kind'], type: string, payload: JsonValue, id = opts.idGen()): boolean =>
    !disposed && postEnv({ v: BRIDGE_VERSION, id, kind, type, payload, ts: opts.now() }, () => undefined);

  const flush = () => {
    const q = queue;
    queue = [];
    q.forEach((f) => f());
  };

  const call: BridgeClient['call'] = (type, payload, o = {}) =>
    new Promise((resolve) => {
      if (disposed) return resolve(resErr('failed', 'client disposed'));
      const body = clean(payload);
      if (!body.ok) return resolve(resErr('invalid', `payload rejected: ${body.reason}`));
      if (o.signal?.aborted) return resolve(resErr('cancelled', 'aborted before send'));
      if (pending.size >= MAX_PENDING) return resolve(resErr('failed', 'busy: too many pending calls'));
      const id = opts.idGen();
      const signal = o.signal;
      const timer: { h?: TimerHandle } = {};
      let done = false;
      let onAbort: (() => void) | undefined;
      const settle = (r: ResResult<unknown>, sendCancel: boolean) => {
        if (!pending.delete(id)) return;
        done = true;
        if (timer.h !== undefined) clearT(timer.h);
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (sendCancel && type !== 'cancel') send('cmd', 'cancel', { targetId: id });
        resolve(r as ResResult<never>);
      };
      const fail = () => settle(resErr('failed', 'transport rejected the message'), false);
      pending.set(id, { type, resolve: (r) => settle(r, false), finish: () => settle(resErr('cancelled', 'client disposed'), false) });
      timer.h = setT(() => settle(resErr('timeout', `${type} timed out`), true), o.timeoutMs ?? opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS);
      if (done) return;
      if (signal) {
        onAbort = () => settle(resErr('cancelled', 'aborted'), true);
        signal.addEventListener('abort', onAbort);
      }
      const transmit = () => {
        if (done) return;
        if (!postEnv({ v: BRIDGE_VERSION, id, kind: 'cmd', type, payload: body.value, ts: opts.now() }, fail)) fail();
      };
      if (open) transmit();
      else queue.push(transmit);
    });

  const answerBack = (env: Envelope) => {
    if (seen.includes(env.id)) return;
    seen.push(env.id);
    if (seen.length > SEEN_CAP) seen.shift();
    const reply = (r: ResResult<JsonValue>) => {
      if (disposed) return;
      try {
        const p = opts.post(makeRes(env, r, BRIDGE_VERSION, opts.now()));
        if (isThenable(p)) p.then(undefined, () => undefined);
      } catch {
        /* transport gone: nothing to tell */
      }
    };
    if (!isNativeCommandType(env.type)) return reply(resErr('unsupported', `unknown command: ${env.type.slice(0, 64)}`));
    if (!responder) return reply(resErr('unsupported', 'no responder registered'));
    Promise.resolve()
      .then(() => responder?.({}))
      .then((v) => reply(resOk(v ?? 'exit')), () => reply(resErr('failed', 'responder threw')));
  };

  const dispatch = (env: Envelope): boolean => {
    if (env.kind === 'res') {
      const p = pending.get(env.id);
      if (!p) return false;
      const r = isResResult(env.payload) ? (env.payload as ResResult<unknown>) : null;
      if (!r) p.resolve(resErr('failed', 'malformed res'));
      else if (r.ok && !resultFits(p.type, r.value)) p.resolve(resErr('failed', `unexpected result for ${p.type}`));
      else p.resolve(r as ResResult<never>);
      return true;
    }
    if (env.kind === 'cmd') {
      answerBack(env);
      return true;
    }
    if (!isNativeEventType(env.type)) return false;
    for (const fn of subs.get(env.type) ?? []) {
      try {
        fn(env.payload as never);
      } catch {
        /* a subscriber must not break delivery */
      }
    }
    return true;
  };

  const ack = (seq: number) => void send('evt', 'ack', { seq });

  const consume = (envs: Envelope[]) => {
    if (disposed) return;
    const fresh = envs.filter((e) => e.seq !== undefined && e.seq > lastSeq).sort((a, b) => (a.seq as number) - (b.seq as number));
    let last = -1;
    for (const env of fresh.slice(0, MAX_BATCH)) {
      if ((env.seq as number) <= lastSeq) continue;
      lastSeq = env.seq as number;
      last = lastSeq;
      dispatch(env);
    }
    if (last >= 0) ack(last);
    else if (lastSeq >= 0 && envs.some((e) => e.seq !== undefined)) ack(lastSeq);
  };

  function receive(raw: unknown): boolean {
    if (disposed) return false;
    const parsed = parseEnvelope(raw);
    if (!parsed.ok) return false;
    const env = parsed.envelope;
    if (env.kind !== 'res' && env.seq !== undefined) {
      consume([env]);
      return true;
    }
    return dispatch(env);
  }

  return {
    call,
    on(type, fn) {
      const set = subs.get(type) ?? new Set();
      subs.set(type, set);
      set.add(fn as (p: never) => void);
      return () => void set.delete(fn as (p: never) => void);
    },
    handle(_type, fn) {
      responder = fn;
      return () => {
        if (responder === fn) responder = null;
      };
    },
    receive,
    consumeInbox(inbox) {
      const envs: Envelope[] = [];
      for (const raw of inbox.slice(0, MAX_SCAN)) {
        const parsed = parseEnvelope(raw);
        if (parsed.ok && parsed.envelope.seq !== undefined) envs.push(parsed.envelope);
      }
      consume(envs);
    },
    sendDiag(stage, detail) {
      send('evt', 'diag', detail === undefined ? { stage } : { stage, detail });
    },
    sendReady() {
      if (disposed || handshook || readyInFlight) return;
      readyInFlight = true;
      const fail = () => void (readyInFlight = false);
      const ok = () => {
        if (disposed) return;
        readyInFlight = false;
        handshook = true;
        open = true;
        lastSeq = -1;
        flush();
      };
      const env: Envelope = { v: BRIDGE_VERSION, id: opts.idGen(), kind: 'evt', type: 'ready', payload: { v: BRIDGE_VERSION, range: DOM_SUPPORTED_RANGE }, ts: opts.now() };
      if (!postEnv(env, fail, ok)) fail();
    },
    dispose() {
      disposed = true;
      queue = [];
      for (const p of [...pending.values()]) p.finish();
      subs.clear();
      responder = null;
    },
  };
}
