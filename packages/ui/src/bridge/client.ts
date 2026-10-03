import { isResResult, parseEnvelopeValue, resErr } from './envelope';
import type { Envelope, JsonValue, ResResult } from './envelope';
import { isNativeEventType } from './messages';
import type { DomCommandType, EventPayloadOf, NativeEventType, PayloadOf, ResultOf } from './messages';
import { DEFAULT_TIMEOUT_MS, MAX_BATCH, MAX_PENDING, MAX_RETAINED, clean, isRec, isThenable, monotonicIds, resultFits, validHwm } from './client-util';
import type { IdSource } from './client-util';
import { createBackAnswerer } from './client-back';
import type { BackResponder } from './client-back';
import { createInbox } from './client-inbox';
import { createReady } from './client-ready';
import { BRIDGE_VERSION } from './version';
import type { VersionRange } from './version';

export { DEFAULT_TIMEOUT_MS, MAX_BATCH, MAX_PENDING, MAX_RETAINED, monotonicIds };
export type { IdSource };

/**
 * DOM-side bridge client (One UI WP2.3-C). Transport-neutral: the app injects
 * `post` (and feeds `receive`/`consumeInbox`); nothing here knows about Expo.
 * Never throws into React: every failure is a typed `ResResult`.
 *
 * Ordering: with `queueUntilReady`, calls wait for a valid `readyAck` (ids and timeouts start
 * at send, after the id source reseeds to max(now, hwm+1)). `ready` retries on a failed post or a
 * missing ack (client-ready.ts); exhausted retries fire `onFatal` and fail every queued call.
 * A completed handshake resets `lastSeq` to -1 (#4853).
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


export function createBridgeClient(rawOpts: ClientOptions): BridgeClient {
  const newId: IdSource = rawOpts.idGen ?? monotonicIds(rawOpts.now());
  const opts = rawOpts;
  const setT = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearT = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const byId = new Map<string, Call>();
  const calls = new Set<Call>();
  const subs = new Map<string, Set<(p: never) => void>>();
  let queue: Call[] = [];
  const back = createBackAnswerer((e) => opts.post(e), opts.now, () => disposed);
  let lastSeq = -1;
  const inbox = createInbox(() => lastSeq, opts.onSignal);
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
    ready.stop();
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

  const ready = createReady({
    setT,
    clearT,
    now: opts.now,
    range: DOM_SUPPORTED_RANGE,
    nextId,
    post: (env, onFail) => postEnv(env, onFail),
    dead: () => disposed || fatalHit,
    fatal,
  });

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

  const onReadyAck = (payload: unknown) => {
    const hwm = isRec(payload) ? payload.hwm : undefined;
    if (!validHwm(hwm)) return opts.onSignal?.('readyAck-invalid');
    newId.reseed?.(Math.max(opts.now(), hwm + 1));
    if (!ready.complete()) return;
    open = true;
    lastSeq = -1;
    inbox.clear();
    flush();
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
      back.answer(env);
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
    const parsed = parseEnvelopeValue(raw);
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
      back.set(fn);
      return () => {
        if (back.is(fn)) back.set(null);
      };
    },
    receive,
    consumeInbox(raw) {
      if (disposed) return;
      const stale = inbox.hold(raw);
      const envs = inbox.take();
      if (envs.length > 0) consume(envs);
      else if (stale && lastSeq >= 0) ack(lastSeq);
    },
    sendDiag(stage, detail) {
      send('evt', 'diag', detail === undefined ? { stage } : { stage, detail });
    },
    sendReady() {
      ready.start();
    },
    dispose() {
      disposed = true;
      queue = [];
      ready.stop();
      for (const c of [...calls]) c.resolve(resErr('cancelled', 'client disposed'));
      subs.clear();
      back.set(null);
    },
  };
}
