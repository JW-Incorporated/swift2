import { isResResult, makeRes, parseEnvelope, resErr, resOk } from './envelope';
import type { Envelope, JsonValue, ResResult } from './envelope';
import { isNativeCommandType, isNativeEventType } from './messages';
import type { DomCommandType, EventPayloadOf, NativeEventType, PayloadOf, ResultOf } from './messages';
import {
  DEFAULT_TIMEOUT_MS,
  MAX_BATCH,
  MAX_PENDING,
  MAX_RETAINED,
  READY_MAX_ATTEMPTS,
  clean,
  isRec,
  isThenable,
  monotonicIds,
  readyBackoff,
  resultFits,
  validHwm,
} from './client-util';
import type { IdSource } from './client-util';
import { BRIDGE_VERSION } from './version';
import type { VersionRange } from './version';

export { DEFAULT_TIMEOUT_MS, MAX_BATCH, MAX_PENDING, MAX_RETAINED, monotonicIds };
export type { IdSource };

/**
 * DOM-side bridge client (One UI WP2.3-C). Transport-neutral: the app injects
 * `post` (and feeds `receive`/`consumeInbox`); nothing here knows about Expo.
 * Never throws into React: every failure is a typed `ResResult`.
 *
 * Ordering: with `queueUntilReady`, calls made before the `ready` post succeeds
 * are held in call order and flushed after it (ids and timeouts start at send).
 * `ready` retries itself (250 ms doubling, cap 5 s, 6 attempts); after the last
 * failure `onFatal` fires and every queued call is rejected `failed`.
 * A successful `ready` is a new handshake: `lastSeq` resets to -1 (#4853).
 * The host answers it with `readyAck {hwm}`; ids reseed to max(now, hwm+1).
 */
/** The range this DOM bundle speaks; sent on `ready`. */
export const DOM_SUPPORTED_RANGE: VersionRange = { min: 1, max: BRIDGE_VERSION };

type TimerHandle = unknown;
export type ClientOptions = {
  /** May return a promise (an Expo action): its rejection fails the call, its value is fed to `receive`. */
  post(env: Envelope): void | PromiseLike<unknown>;
  now(): number;
  /** Default: `monotonicIds(now())`. A custom source must stay strictly increasing; give it `reseed` to honour `readyAck`. */
  idGen?: IdSource;
  setTimer?(fn: () => void, ms: number): TimerHandle;
  clearTimer?(h: TimerHandle): void;
  defaultTimeoutMs?: number;
  /** Hold calls made before `ready` is posted, flushing them in order after. */
  queueUntilReady?: boolean;
  /** `ready` exhausted its retries, or the id space ran out: the watchdog path. Fires once. */
  onFatal?(reason: string): void;
  /** Non-fatal anomalies: `readyAck-invalid`, `inbox-dropped` (count in `detail`). */
  onSignal?(kind: string, detail?: number): void;
};
export type CallOptions = { signal?: AbortSignal; timeoutMs?: number };
type Call = { type: DomCommandType; id?: string; transmit(): void; resolve(r: ResResult<unknown>): void };
type BackResponder = (payload: PayloadOf<'back'>) => 'handled' | 'exit' | Promise<'handled' | 'exit'>;

export type BridgeClient = {
  call<T extends DomCommandType>(type: T, payload: PayloadOf<T>, opts?: CallOptions): Promise<ResResult<ResultOf<T>>>;
  on<T extends NativeEventType>(type: T, fn: (payload: EventPayloadOf<T>) => void): () => void;
  handle(type: 'back', fn: BackResponder): () => void;
  /** Feed one raw inbound message (a `res`, or a native `evt`/`cmd`; seq-bearing ones take the inbox path). */
  receive(raw: unknown): boolean;
  /** Process up to MAX_BATCH `seq > lastSeq` in ascending order, then ack the last; the rest stays held for the next consume. */
  consumeInbox(inbox: readonly unknown[]): void;
  sendDiag(stage: string, detail?: string): void;
  sendReady(): void;
  /** Resolves pending as cancelled; every later call resolves `failed`. */
  dispose(): void;
};

const SEEN_CAP = 256;
const MAX_SCAN = 1024;

export function createBridgeClient(rawOpts: ClientOptions): BridgeClient {
  const newId: IdSource = rawOpts.idGen ?? monotonicIds(rawOpts.now());
  const opts = rawOpts;
  const setT = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearT = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const byId = new Map<string, Call>();
  const calls = new Set<Call>();
  const subs = new Map<string, Set<(p: never) => void>>();
  const seen: string[] = [];
  const held = new Map<number, unknown>();
  let queue: Call[] = [];
  let responder: BackResponder | null = null;
  let lastSeq = -1;
  let handshook = false;
  let readyInFlight = false;
  let readyFailures = 0;
  let readyTimer: TimerHandle | undefined;
  let open = !opts.queueUntilReady;
  let disposed = false;
  let fatalHit = false;

  const failAll = (msg: string) => {
    queue = [];
    for (const c of [...calls]) c.resolve(resErr('failed', msg));
  };
  const fatal = (reason: string) => {
    if (fatalHit || disposed) return;
    fatalHit = true;
    if (readyTimer !== undefined) clearT(readyTimer);
    readyTimer = undefined;
    failAll(`bridge fatal: ${reason}`);
    try {
      opts.onFatal?.(reason);
    } catch {
      /* the watchdog hook must not break teardown */
    }
  };
  /** Assert-or-fatal: an id that cannot be issued (space exhausted) kills the bridge. */
  const nextId = (): string | null => {
    try {
      const id = newId();
      if (Number(id) >= Number.MAX_SAFE_INTEGER) throw new RangeError('id too large');
      return id;
    } catch {
      fatal('id-space-exhausted');
      return null;
    }
  };

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

  const send = (kind: Envelope['kind'], type: string, payload: JsonValue): boolean => {
    if (disposed || fatalHit) return false;
    const id = nextId();
    return id !== null && postEnv({ v: BRIDGE_VERSION, id, kind, type, payload, ts: opts.now() }, () => undefined);
  };

  const flush = () => {
    const q = queue;
    queue = [];
    q.forEach((c) => c.transmit());
  };

  const call: BridgeClient['call'] = (type, payload, o = {}) =>
    new Promise((resolve) => {
      if (disposed || fatalHit) return resolve(resErr('failed', disposed ? 'client disposed' : 'bridge fatal'));
      const body = clean(payload);
      if (!body.ok) return resolve(resErr('invalid', `payload rejected: ${body.reason}`));
      if (o.signal?.aborted) return resolve(resErr('cancelled', 'aborted before send'));
      if (calls.size >= MAX_PENDING) return resolve(resErr('failed', 'busy: too many pending calls'));
      const signal = o.signal;
      let timer: TimerHandle | undefined;
      let done = false;
      let onAbort: (() => void) | undefined;
      const c: Call = { type, transmit: () => undefined, resolve: (r) => settle(r, false) };
      const settle = (r: ResResult<unknown>, sendCancel: boolean) => {
        if (done) return;
        done = true;
        calls.delete(c);
        if (c.id !== undefined) byId.delete(c.id);
        else queue = queue.filter((q) => q !== c);
        if (timer !== undefined) clearT(timer);
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (sendCancel && c.id !== undefined && type !== 'cancel') send('cmd', 'cancel', { targetId: c.id });
        resolve(r as ResResult<never>);
      };
      c.transmit = () => {
        if (done) return;
        const id = nextId();
        if (id === null) return;
        c.id = id;
        byId.set(id, c);
        timer = setT(() => settle(resErr('timeout', `${type} timed out`), true), o.timeoutMs ?? opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS);
        if (done) return;
        const fail = () => settle(resErr('failed', 'transport rejected the message'), false);
        if (!postEnv({ v: BRIDGE_VERSION, id, kind: 'cmd', type, payload: body.value, ts: opts.now() }, fail)) fail();
      };
      calls.add(c);
      if (signal) {
        onAbort = () => settle(resErr('cancelled', 'aborted'), true);
        signal.addEventListener('abort', onAbort);
      }
      if (open) c.transmit();
      else queue.push(c);
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

  const onReadyAck = (payload: unknown) => {
    const hwm = isRec(payload) ? payload.hwm : undefined;
    if (!validHwm(hwm)) return opts.onSignal?.('readyAck-invalid');
    newId.reseed?.(Math.max(opts.now(), hwm + 1));
  };

  const dispatch = (env: Envelope): boolean => {
    if (env.kind === 'res') {
      const p = byId.get(env.id);
      if (!p) return false;
      const r = isResResult(env.payload) ? (env.payload as ResResult<unknown>) : null;
      if (!r) p.resolve(resErr('failed', 'malformed res'));
      else if (r.ok && !resultFits(p.type, r.value)) p.resolve(resErr('failed', `unexpected result for ${p.type}`));
      else p.resolve(r);
      return true;
    }
    if (env.kind === 'cmd') {
      answerBack(env);
      return true;
    }
    if (!isNativeEventType(env.type)) return false;
    if (env.type === 'readyAck') {
      onReadyAck(env.payload);
      return true;
    }
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

  /** Cheap length/type checks only; the full parse happens after the batch slice. */
  const hold = (inbox: readonly unknown[]): boolean => {
    let stale = false;
    const n = Math.min(inbox.length, MAX_SCAN);
    for (let i = 0; i < n; i++) {
      const raw = inbox[i];
      if (!isRec(raw)) continue;
      const seq = raw.seq;
      if (typeof seq !== 'number' || !Number.isInteger(seq)) continue;
      if (seq > lastSeq) held.set(seq, raw);
      else stale = true;
    }
    if (held.size > MAX_RETAINED) {
      const drop = held.size - MAX_RETAINED;
      for (const s of [...held.keys()].sort((a, b) => a - b).slice(0, drop)) held.delete(s);
      opts.onSignal?.('inbox-dropped', drop);
    }
    return stale;
  };

  const attemptReady = () => {
    readyTimer = undefined;
    if (disposed || fatalHit || handshook || readyInFlight) return;
    readyInFlight = true;
    const fail = () => {
      if (!readyInFlight) return;
      readyInFlight = false;
      if (disposed || fatalHit) return;
      readyFailures++;
      if (readyFailures >= READY_MAX_ATTEMPTS) return fatal('ready-failed');
      readyTimer = setT(attemptReady, readyBackoff(readyFailures));
    };
    const ok = () => {
      if (disposed || fatalHit || !readyInFlight) return;
      readyInFlight = false;
      handshook = true;
      open = true;
      lastSeq = -1;
      held.clear();
      flush();
    };
    const id = nextId();
    if (id === null) return;
    const env: Envelope = { v: BRIDGE_VERSION, id, kind: 'evt', type: 'ready', payload: { v: BRIDGE_VERSION, range: DOM_SUPPORTED_RANGE }, ts: opts.now() };
    if (!postEnv(env, fail, ok)) fail();
  };

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
      if (disposed) return;
      const stale = hold(inbox);
      const batch = [...held.keys()].sort((a, b) => a - b).slice(0, MAX_BATCH);
      const envs: Envelope[] = [];
      for (const s of batch) {
        const parsed = parseEnvelope(held.get(s));
        held.delete(s);
        if (parsed.ok && parsed.envelope.seq !== undefined) envs.push(parsed.envelope);
      }
      if (envs.length > 0) consume(envs);
      else if (stale && lastSeq >= 0) ack(lastSeq);
    },
    sendDiag(stage, detail) {
      send('evt', 'diag', detail === undefined ? { stage } : { stage, detail });
    },
    sendReady() {
      if (disposed || fatalHit || handshook || readyInFlight) return;
      if (readyTimer !== undefined) clearT(readyTimer);
      attemptReady();
    },
    dispose() {
      disposed = true;
      queue = [];
      if (readyTimer !== undefined) clearT(readyTimer);
      readyTimer = undefined;
      for (const c of [...calls]) c.resolve(resErr('cancelled', 'client disposed'));
      subs.clear();
      responder = null;
    },
  };
}
