// Native-side bridge dispatcher (One UI WP2.3-B). Pure and transport-neutral: no
// React/RN/Expo imports; clock, scheduler, transport and handlers are injected.
// Contract: packages/ui/src/bridge/README.md. Not wired into SharedUiHost yet
// (step 4 waits for G0).
import {
  BRIDGE_VERSION,
  NATIVE_SUPPORTED_RANGE,
  answerUnknown,
  checkStrictJson,
  isBridgeId,
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
} from '@swift2/ui';
import type {
  DomCommandType,
  Envelope,
  EventPayloadOf,
  HandlerContext,
  HandlerMap,
  JsonValue,
  NativeCommandType,
  NativeEventType,
  PayloadOf,
  ResResult,
  ResultOf,
  VersionRange,
} from '@swift2/ui';

export const HOST_RANGE: VersionRange = NATIVE_SUPPORTED_RANGE;
export const DEFAULT_TIMEOUT_MS = 8000;
export const SEEN_IDS_CAP = 256;

export interface BridgeScheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface BridgeHostDeps {
  handlers: HandlerMap;
  /** Delivers one native-to-DOM envelope (transport-neutral). */
  send: (env: Envelope) => void;
  now: () => number;
  scheduler: BridgeScheduler;
  /** Only protocol-fatal failures: the watchdog strike hook. */
  onProtocolFatal: (reason: string) => void;
  onSignal: (stage: string, detail?: string) => void;
  /** Per-type overrides of DEFAULT_TIMEOUT_MS. */
  timeouts?: Partial<Record<DomCommandType, number>>;
  seenCap?: number;
}

type Inflight = { controller: AbortController; timer: unknown; type: DomCommandType };
type Pending = { resolve: (r: ResResult<never>) => void; timeoutMs: number; timer?: unknown };
type RunHandler = (payload: unknown, ctx: HandlerContext) => Promise<ResResult<JsonValue>>;

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** Per-command payload validation; returns the cleaned payload or null. */
function validate(type: DomCommandType, p: JsonValue): JsonValue | null {
  if (!isRecord(p)) return null;
  switch (type) {
    case 'navigate':
      if (!isWebPath(p.path) || (p.replace !== undefined && typeof p.replace !== 'boolean')) return null;
      return p.replace === undefined ? { path: p.path } : { path: p.path, replace: p.replace };
    case 'openExternal':
      return isExternalUrl(p.url) ? { url: p.url } : null;
    case 'api': {
      const req = sanitizeApiRequest(p.req);
      return req ? { req: req as unknown as JsonValue } : null;
    }
    case 'cancel':
      return isBridgeId(p.targetId) ? { targetId: p.targetId } : null;
    default:
      return p;
  }
}

export function createBridgeHost(deps: BridgeHostDeps) {
  const { send, now, scheduler, onSignal } = deps;
  const seenCap = deps.seenCap ?? SEEN_IDS_CAP;
  const seen = new Map<string, true>(); // bounded LRU of cmd ids
  const inflight = new Map<string, Inflight>();
  const pending = new Map<string, Pending>(); // native-to-DOM requests, by id
  let ready = false;
  let fatal = false;
  let seq = 0;
  let hostId = 0;
  let queue: Envelope[] = []; // sequenced outbound, trimmed by ack
  let held: Envelope[] = []; // sequenced outbound not yet dispatched (pre-ready)

  const safeSend = (env: Envelope) => {
    try {
      send(env);
    } catch (e) {
      onSignal('bridge-send-failed', String(e).slice(0, 200));
    }
  };
  const raise = (reason: string) => {
    if (fatal) return;
    fatal = true;
    deps.onProtocolFatal(reason);
  };

  const respond = (id: string, type: string, result: ResResult<JsonValue>) =>
    safeSend(makeRes({ id, type }, result, BRIDGE_VERSION, now()));

  /** The one `res` for a cmd: only the first settle wins, later ones are dropped. */
  function settle(id: string, type: string, result: ResResult<JsonValue>) {
    const f = inflight.get(id);
    if (!f) return;
    inflight.delete(id);
    scheduler.clearTimeout(f.timer);
    respond(id, type, result);
  }

  function runCommand(env: Envelope, type: DomCommandType, payload: JsonValue) {
    const controller = new AbortController();
    const timeoutMs = deps.timeouts?.[type] ?? DEFAULT_TIMEOUT_MS;
    const timer = scheduler.setTimeout(() => {
      if (!inflight.has(env.id)) return;
      controller.abort();
      settle(env.id, type, resErr('timeout', `${type} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    inflight.set(env.id, { controller, timer, type });
    const run = deps.handlers[type] as unknown as RunHandler;
    Promise.resolve()
      .then(() => run(payload, { signal: controller.signal }))
      .then(
        (r) => {
          const ok = isResResult(r) && checkStrictJson(r).ok;
          settle(env.id, type, ok ? r : resErr('failed', 'handler returned an invalid result'));
        },
        (e) => settle(env.id, type, resErr('failed', String(e instanceof Error ? e.message : e).slice(0, 200))),
      );
  }

  function cancel(targetId: string) {
    const f = inflight.get(targetId);
    if (!f) return;
    f.controller.abort();
    settle(targetId, f.type, resErr('cancelled', 'cancelled by DOM'));
  }

  function onCmd(env: Envelope) {
    if (seen.has(env.id)) {
      seen.delete(env.id);
      seen.set(env.id, true);
      onSignal('bridge-duplicate', env.id);
      return;
    }
    seen.set(env.id, true);
    if (seen.size > seenCap) seen.delete(seen.keys().next().value as string);
    const unknown = answerUnknown(env, BRIDGE_VERSION, now());
    if (unknown) return safeSend(unknown);
    const type = env.type as DomCommandType;
    const payload = validate(type, env.payload);
    if (payload === null) return respond(env.id, type, resErr('invalid', `invalid ${type} payload`));
    if (type === 'cancel') {
      cancel((payload as { targetId: string }).targetId);
      return respond(env.id, type, resOk(null));
    }
    runCommand(env, type, payload);
  }

  function dispatch(env: Envelope) {
    safeSend(env);
    if (env.kind !== 'cmd') return;
    const p = pending.get(env.id);
    if (p) p.timer = scheduler.setTimeout(() => finishRequest(env.id, resErr('timeout', `${env.type} timed out`)), p.timeoutMs);
  }

  function finishRequest(id: string, result: ResResult<never>) {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    scheduler.clearTimeout(p.timer);
    p.resolve(result);
  }

  function onReady(env: Envelope) {
    if (ready) return;
    const r = parseReady(env.payload);
    if (!r) return raise('bridge-invalid ready payload');
    const n = negotiate(r.v, HOST_RANGE);
    const overlap = !r.range || (r.range.min <= HOST_RANGE.max && r.range.max >= HOST_RANGE.min);
    if (!n.ok || !overlap) {
      const reason = n.ok ? (r.range!.min > HOST_RANGE.max ? 'too-new' : 'too-old') : n.reason;
      return raise(`bridge-version ${reason} dom=${r.v} host=${HOST_RANGE.min}-${HOST_RANGE.max}`);
    }
    ready = true;
    const flush = held;
    held = [];
    flush.forEach(dispatch);
  }

  function receive(raw: unknown): void {
    try {
      if (fatal) return;
      const parsed = parseEnvelope(raw);
      if (!parsed.ok) {
        if (!ready) return raise(`bridge-invalid envelope ${parsed.reason}`);
        onSignal('bridge-invalid', parsed.reason);
        const r = isRecord(raw) ? raw : {};
        if (r.kind === 'cmd' && isBridgeId(r.id) && typeof r.type === 'string' && !seen.has(r.id)) {
          seen.set(r.id, true);
          respond(r.id, r.type.slice(0, 64), resErr('invalid', `invalid envelope: ${parsed.reason}`));
        }
        return;
      }
      const env = parsed.envelope;
      if (env.kind === 'cmd') return onCmd(env);
      if (env.kind === 'res') {
        const out = isResResult(env.payload) ? (env.payload as ResResult<never>) : resErr('failed', 'malformed res');
        return finishRequest(env.id, out);
      }
      if (env.type === 'ready') return onReady(env);
      const p = env.payload as Record<string, JsonValue>;
      if (env.type === 'ack' && isRecord(p) && typeof p.seq === 'number') {
        queue = queue.filter((q) => q.seq! > (p.seq as number));
      } else if (env.type === 'diag' && isRecord(p) && typeof p.stage === 'string') {
        onSignal(p.stage.slice(0, 64), typeof p.detail === 'string' ? p.detail.slice(0, 200) : undefined);
      } else {
        onSignal('bridge-ignored-evt', env.type.slice(0, 64));
      }
    } catch (e) {
      onSignal('bridge-receive-error', String(e).slice(0, 200));
    }
  }

  function enqueue(kind: 'evt' | 'cmd', id: string, type: string, payload: unknown): Envelope {
    const env: Envelope = { v: BRIDGE_VERSION, id, kind, type, payload: payload as JsonValue, ts: now(), seq: ++seq };
    queue.push(env);
    if (ready) dispatch(env);
    else held.push(env);
    return env;
  }

  function emit<T extends NativeEventType>(type: T, payload: EventPayloadOf<T>): void {
    enqueue('evt', `h-${++hostId}`, type, payload);
  }

  /** Native-to-DOM command. Never rejects: failure and timeout resolve as a `res` error. */
  function request<T extends NativeCommandType>(
    type: T,
    payload: PayloadOf<T>,
    opts?: { timeoutMs?: number },
  ): Promise<ResResult<ResultOf<T>>> {
    const id = `h-${++hostId}`;
    return new Promise((resolve) => {
      pending.set(id, { resolve: resolve as Pending['resolve'], timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS });
      enqueue('cmd', id, type, payload);
    });
  }

  return {
    receive,
    emit,
    request,
    isReady: () => ready,
    /** Dispatched, un-acked sequenced envelopes (the `inbox` prop in step 4). */
    inbox: (): Envelope[] => queue.filter((q) => !held.includes(q)),
  };
}

export type BridgeHost = ReturnType<typeof createBridgeHost>;
