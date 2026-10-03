import { isResResult, makeRes, parseEnvelope, resErr, resOk } from './envelope';
import type { Envelope, JsonValue, ResResult } from './envelope';
import { isNativeCommandType, isNativeEventType } from './messages';
import type { DomCommandType, EventPayloadOf, NativeEventType, PayloadOf, ResultOf } from './messages';
import { BRIDGE_VERSION } from './version';
import type { VersionRange } from './version';

/**
 * DOM-side bridge client (One UI WP2.3-C). Transport-neutral: the app injects
 * `post` (and feeds `receive`/`consumeInbox`); nothing here knows about Expo.
 * Never throws into React: every failure is a typed `ResResult`.
 */
export const DEFAULT_TIMEOUT_MS = 8000;
const SEEN_CAP = 256;
/** The range this DOM bundle speaks; sent on `ready`. */
export const DOM_SUPPORTED_RANGE: VersionRange = { min: 1, max: BRIDGE_VERSION };

type TimerHandle = unknown;
export type ClientOptions = {
  post(env: Envelope): void;
  now(): number;
  idGen(): string;
  setTimer?(fn: () => void, ms: number): TimerHandle;
  clearTimer?(h: TimerHandle): void;
  defaultTimeoutMs?: number;
};
export type CallOptions = { signal?: AbortSignal; timeoutMs?: number };
type Pending = { resolve(r: ResResult<never>): void; finish(): void };
type BackResponder = (payload: PayloadOf<'back'>) => 'handled' | 'exit' | Promise<'handled' | 'exit'>;

export type BridgeClient = {
  call<T extends DomCommandType>(type: T, payload: PayloadOf<T>, opts?: CallOptions): Promise<ResResult<ResultOf<T>>>;
  on<T extends NativeEventType>(type: T, fn: (payload: EventPayloadOf<T>) => void): () => void;
  handle(type: 'back', fn: BackResponder): () => void;
  /** Feed one raw inbound message (a `res`, or a native `evt`/`cmd`). */
  receive(raw: unknown): boolean;
  /** Process `seq > lastSeq` in ascending order, then ack the last. Idempotent per seq. */
  consumeInbox(inbox: readonly unknown[]): void;
  sendDiag(stage: string, detail?: string): void;
  sendReady(): void;
  dispose(): void;
};

export function createBridgeClient(opts: ClientOptions): BridgeClient {
  const setT = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearT = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const pending = new Map<string, Pending>();
  const subs = new Map<string, Set<(p: never) => void>>();
  const seen: string[] = [];
  let responder: BackResponder | null = null;
  let lastSeq = -1;
  let readySent = false;

  const send = (kind: Envelope['kind'], type: string, payload: unknown, id = opts.idGen()): boolean => {
    try {
      opts.post({ v: BRIDGE_VERSION, id, kind, type, payload: payload as JsonValue, ts: opts.now() });
      return true;
    } catch {
      return false;
    }
  };

  const call: BridgeClient['call'] = (type, payload, o = {}) =>
    new Promise((resolve) => {
      const id = opts.idGen();
      const signal = o.signal;
      let onAbort: (() => void) | undefined;
      const settle = (r: ResResult<unknown>, sendCancel: boolean) => {
        if (!pending.delete(id)) return;
        clearT(timer);
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (sendCancel && type !== 'cancel') send('cmd', 'cancel', { targetId: id });
        resolve(r as ResResult<never>);
      };
      if (signal?.aborted) return resolve(resErr('cancelled', 'aborted before send'));
      pending.set(id, { resolve: (r) => settle(r, false), finish: () => settle(resErr('cancelled', 'client disposed'), false) });
      const timer = setT(() => settle(resErr('timeout', `${type} timed out`), true), o.timeoutMs ?? opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS);
      if (signal) {
        onAbort = () => settle(resErr('cancelled', 'aborted'), true);
        signal.addEventListener('abort', onAbort);
      }
      if (!send('cmd', type, payload, id)) settle(resErr('failed', 'transport rejected the message'), false);
    });

  const answerBack = (env: Envelope) => {
    if (seen.includes(env.id)) return;
    seen.push(env.id);
    if (seen.length > SEEN_CAP) seen.shift();
    const reply = (r: ResResult<JsonValue>) => {
      try {
        opts.post(makeRes(env, r, BRIDGE_VERSION, opts.now()));
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
      p.resolve(isResResult(env.payload) ? (env.payload as ResResult<never>) : resErr('failed', 'malformed res'));
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
    receive(raw) {
      const parsed = parseEnvelope(raw);
      return parsed.ok ? dispatch(parsed.envelope) : false;
    },
    consumeInbox(inbox) {
      const fresh: Envelope[] = [];
      for (const raw of inbox) {
        const parsed = parseEnvelope(raw);
        if (parsed.ok && parsed.envelope.seq !== undefined && parsed.envelope.seq > lastSeq) fresh.push(parsed.envelope);
      }
      fresh.sort((a, b) => (a.seq as number) - (b.seq as number));
      let last = -1;
      for (const env of fresh) {
        if ((env.seq as number) <= lastSeq) continue;
        lastSeq = env.seq as number;
        last = lastSeq;
        dispatch(env);
      }
      if (last >= 0) send('evt', 'ack', { seq: last });
    },
    sendDiag(stage, detail) {
      send('evt', 'diag', detail === undefined ? { stage } : { stage, detail });
    },
    sendReady() {
      if (readySent) return;
      readySent = true;
      send('evt', 'ready', { v: BRIDGE_VERSION, range: DOM_SUPPORTED_RANGE });
    },
    dispose() {
      for (const p of [...pending.values()]) p.finish();
      subs.clear();
      responder = null;
    },
  };
}
