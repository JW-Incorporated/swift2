// Native-side bridge dispatcher (One UI WP2.3-B). Pure and transport-neutral: no
// React/RN/Expo imports; clock, scheduler, transport and handlers are injected.
// Contract: packages/ui/src/bridge/README.md. Not wired into SharedUiHost yet (G0).
import {
  BRIDGE_VERSION,
  answerUnknown,
  isBridgeId,
  isResResult,
  makeRes,
  negotiate,
  parseEnvelope,
  parseEnvelopeValue,
  parseReady,
  resErr,
  resOk,
} from '@swift2/ui';
import type { DomCommandType, Envelope, EventPayloadOf, JsonValue, NativeCommandType, NativeEventType, PayloadOf, ResResult, ResultOf } from '@swift2/ui';
import { OUTBOX_CAP, createOutbox } from './bridge-host-outbox';
import { DEFAULT_TIMEOUT_MS, createInflight } from './bridge-host-inflight';
import { createTimers } from './bridge-host-timers';
import { createAckTracker, type AckRef } from './bridge-host-acks';
import { HOST_RANGE, MAX_INFLIGHT, MAX_PENDING, READY_LIMIT, READY_WINDOW_MS, type BridgeHostDeps, type Pending } from './bridge-host-types';

export { HOST_RANGE, MAX_INFLIGHT, MAX_PENDING, READY_LIMIT, READY_WINDOW_MS, DEFAULT_TIMEOUT_MS } from './bridge-host-types';
export type { AckRef };
export type { BridgeHostDeps, BridgeScheduler } from './bridge-host-types';
import { isExpectedResult, isRecord, validateCommand } from './bridge-host-validate';
import { handleDomEvent } from './bridge-host-events';

let nextEpoch = 0; // never resets within the process: one id per host instance

export function createBridgeHost(deps: BridgeHostDeps) {
  const { send, now } = deps;
  const onSignal = (stage: string, detail?: string) => {
    try {
      deps.onSignal(stage, detail);
    } catch {
      /* a throwing signal sink must not break the dispatcher */
    }
  };
  const maxInflight = deps.maxInflight ?? MAX_INFLIGHT;
  let hwm = -1; // highest cmd id admitted; `ready` never resets it
  let readyTimes: number[] = [];
  const pending = new Map<string, Pending>(); // native-to-DOM requests, by id
  const { arm, disarm } = createTimers(deps.scheduler, onSignal);
  const epoch = ++nextEpoch;
  const acks = createAckTracker({ epoch, closed: () => closed, outbox: () => outbox, onSignal });
  const outbox = createOutbox(deps.outboxCap ?? OUTBOX_CAP, onSignal, (gone) => acks.evict(gone.seq!));
  let ready = false;
  let closed = false; // fatal or disposed: nothing further is sent or run
  let negotiated: number | null = null;
  let hostId = 0;

  const safeSend = (env: Envelope) => {
    if (closed) return;
    try {
      send(env);
    } catch (e) {
      onSignal('bridge-send-failed', String(e).slice(0, 200));
    }
  };
  const respond = (id: string, type: string, result: ResResult<JsonValue>) => {
    try {
      safeSend(makeRes({ id, type }, result, BRIDGE_VERSION, now()));
    } catch (e) {
      onSignal('bridge-send-failed', String(e).slice(0, 200));
    }
  };

  const inflight = createInflight({ handlers: deps.handlers, timeouts: deps.timeouts, arm, disarm, respond, onSignal });

  function shutdown() {
    if (!closed) {
      try {
        deps.onBeforeShutdown?.();
      } catch (e) {
        onSignal('bridge-before-shutdown-failed', String(e).slice(0, 200));
      }
    }
    closed = true;
    inflight.abortAll();
    const ps = [...pending.values()];
    pending.clear();
    for (const p of ps) {
      disarm(p.timer);
      p.resolve(resErr('failed', 'bridge closed'));
    }
    outbox.clear();
    acks.settle(() => true, false);
  }
  const raise = (reason: string) => {
    if (closed) return;
    shutdown();
    try {
      deps.onProtocolFatal(reason);
    } catch (e) {
      onSignal('bridge-fatal-hook-failed', String(e).slice(0, 200));
    }
  };

  /** Monotonic admission: ids are digit strings strictly above the high-water mark. */
  function admit(id: string, type: string): boolean {
    const n = /^[0-9]{1,15}$/.test(id) ? Number(id) : Number.NaN;
    if (n > hwm) {
      hwm = n;
      return true;
    }
    onSignal('rejected_monotonic', id.slice(0, 64));
    if (!inflight.has(id)) respond(id, type.slice(0, 64), resErr('invalid', 'command id not monotonic'));
    return false;
  }

  /** Answer a cmd that cannot run; a replayed or out-of-order id is rejected by `admit`. */
  function rejectCmd(id: string, type: string, message: string) {
    if (admit(id, type)) respond(id, type.slice(0, 64), resErr('invalid', message));
  }

  function onCmd(env: Envelope) {
    if (!admit(env.id, env.type)) return;
    const unknown = answerUnknown(env, BRIDGE_VERSION, now());
    if (unknown) return safeSend(unknown);
    const type = env.type as DomCommandType;
    const payload = validateCommand(type, env.payload);
    if (payload === null) return respond(env.id, type, resErr('invalid', `invalid ${type} payload`));
    if (type === 'cancel') {
      inflight.cancel((payload as { targetId: string }).targetId);
      return respond(env.id, type, resOk(null));
    }
    if (inflight.size() >= maxInflight) return respond(env.id, type, resErr('failed', 'busy'));
    inflight.run(env.id, type, payload);
  }

  function finishRequest(id: string, result: ResResult<never>) {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    outbox.remove(id);
    disarm(p.timer);
    p.resolve(result);
  }

  function dispatch(env: Envelope) {
    const p = env.kind === 'cmd' ? pending.get(env.id) : undefined;
    if (p) {
      disarm(p.timer);
      p.timer = undefined;
    }
    safeSend(env);
    if (!p || closed) return;
    const t = arm(() => finishRequest(env.id, resErr('timeout', `${env.type} timed out`)), p.timeoutMs);
    if (t) p.timer = t.h;
    else finishRequest(env.id, resErr('failed', 'timer unavailable'));
  }

  function onReady(env: Envelope) {
    readyTimes = [...readyTimes.filter((x) => now() - x < READY_WINDOW_MS), now()];
    if (readyTimes.length > READY_LIMIT) return raise('bridge-ready rate limit');
    const r = parseReady(env.payload);
    if (!r) {
      if (ready) return onSignal('bridge-invalid', 'ready payload');
      return raise('bridge-invalid ready payload');
    }
    const n = negotiate(r.v, HOST_RANGE);
    const overlap = !r.range || (r.range.min <= HOST_RANGE.max && r.range.max >= HOST_RANGE.min);
    if (!n.ok || !overlap) {
      const reason = n.ok ? (r.range!.min > HOST_RANGE.max ? 'too-new' : 'too-old') : n.reason;
      return raise(`bridge-version ${reason} dom=${r.v} host=${HOST_RANGE.min}-${HOST_RANGE.max}`);
    }
    if (env.v !== r.v) return raise(`bridge-version envelope v=${env.v} ready v=${r.v}`);
    if (hwm >= Number.MAX_SAFE_INTEGER - 1) return raise('bridge-hwm exhausted');
    if (ready) {
      inflight.abortAll();
      try {
        deps.onReadyAgain?.();
      } catch (e) {
        onSignal('bridge-ready-again-failed', String(e).slice(0, 200));
      }
    }
    ready = true;
    negotiated = r.v;
    safeSend({ v: BRIDGE_VERSION, id: `h-${++hostId}`, kind: 'evt', type: 'readyAck', payload: { hwm: Math.max(hwm, 0) }, ts: now() });
    outbox.all().forEach(dispatch);
  }

  function onAck(payload: unknown) {
    const n = isRecord(payload) ? payload.seq : undefined;
    if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= outbox.highest()) {
      outbox.ack(n);
      acks.acked(n);
    } else onSignal('bridge-bad-ack', String(n).slice(0, 32));
  }

  function onRes(env: Envelope) {
    const p = pending.get(env.id);
    if (!p || p.type !== env.type) return onSignal('bridge-res-mismatch', env.id.slice(0, 64));
    const out = env.payload;
    if (!isResResult(out) || (out.ok && !isExpectedResult(p.type, (out as unknown as { value: unknown }).value))) {
      return onSignal('bridge-res-invalid', p.type);
    }
    finishRequest(env.id, out as ResResult<never>);
  }

  function receive(raw: unknown): void {
    try {
      if (closed) return;
      const parsed = typeof raw === 'string' ? parseEnvelope(raw) : parseEnvelopeValue(raw);
      if (!parsed.ok) {
        if (!ready) return raise(`bridge-invalid envelope ${parsed.reason}`);
        onSignal('bridge-invalid', parsed.reason);
        const r = isRecord(raw) ? raw : {};
        if (r.kind === 'cmd' && isBridgeId(r.id) && typeof r.type === 'string') {
          rejectCmd(r.id, r.type, `invalid envelope: ${parsed.reason}`);
        }
        return;
      }
      const env = parsed.envelope;
      const isReady = env.kind === 'evt' && env.type === 'ready';
      if (negotiated !== null && env.v !== negotiated) {
        onSignal('bridge-version-mismatch', `${env.kind} v=${env.v} negotiated=${negotiated}`);
        if (env.kind === 'cmd') rejectCmd(env.id, env.type, 'envelope version mismatch');
        return;
      }
      if (env.kind === 'cmd') return onCmd(env);
      if (env.kind === 'res') return onRes(env);
      if (isReady) return onReady(env);
      handleDomEvent(env, { ready: () => ready, onSignal, onAck, onNavReady: deps.onNavReady, onNavigated: deps.onNavigated, onTheme: deps.onTheme, onRoute: deps.onRoute });
    } catch (e) {
      onSignal('bridge-receive-error', String(e).slice(0, 200));
    }
  }

  function enqueue(kind: 'evt' | 'cmd', id: string, type: string, payload: unknown): Envelope | null {
    if (closed) return null;
    const env = outbox.push({ v: BRIDGE_VERSION, id, kind, type, payload: payload as JsonValue, ts: now() });
    if (env && ready) dispatch(env);
    return env;
  }

  /**
   * Returns the envelope's {epoch, seq} (seq is monotonic per host, epoch unique per
   * host instance in this process), or null when nothing was queued. The wire is unchanged.
   */
  function emit<T extends NativeEventType>(type: T, payload: EventPayloadOf<T>): AckRef | null {
    try {
      const env = enqueue('evt', `h-${++hostId}`, type, payload);
      return env ? { epoch, seq: env.seq! } : null;
    } catch (e) {
      onSignal('bridge-emit-failed', String(e).slice(0, 200));
      return null;
    }
  }

  /** Native-to-DOM command. Never rejects: failure and timeout resolve as a `res` error. */
  function request<T extends NativeCommandType>(
    type: T,
    payload: PayloadOf<T>,
    opts?: { timeoutMs?: number },
  ): Promise<ResResult<ResultOf<T>>> {
    return new Promise((resolve) => {
      const id = `h-${++hostId}`;
      const fail = (message: string) => resolve(resErr('failed', message));
      try {
        if (closed) return fail('bridge closed');
        if (pending.size >= MAX_PENDING) return fail('too many pending requests');
        pending.set(id, { type, resolve: resolve as Pending['resolve'], timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS });
        if (!enqueue('cmd', id, type, payload)) {
          pending.delete(id);
          fail('bridge queue full');
        }
      } catch (e) {
        pending.delete(id);
        onSignal('bridge-request-failed', String(e).slice(0, 200));
        fail('bridge request failed');
      }
    });
  }

  return {
    receive,
    emit,
    onAcked: acks.onAcked,
    ackWaiterCount: acks.size,
    request,
    isReady: () => ready,
    /** Aborts handlers, clears timers, settles pending requests; nothing is sent afterwards. */
    dispose: shutdown,
    /** Dispatched, un-acked sequenced envelopes (the `inbox` prop in step 4). */
    inbox: (): Envelope[] => (ready ? outbox.all() : []),
  };
}

export type BridgeHost = ReturnType<typeof createBridgeHost>;
