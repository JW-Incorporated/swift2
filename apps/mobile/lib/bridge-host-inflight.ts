import { apiCommandTimeout, checkParsedJson, isResResult, resErr } from '@swift2/ui';
import type { DomCommandType, HandlerContext, HandlerMap, JsonValue, ResResult } from '@swift2/ui';

export const DEFAULT_TIMEOUT_MS = 8000;

type Arm = (fn: () => void, ms: number) => { h: unknown } | null;
type Inflight = { id: string; type: DomCommandType; controller: AbortController; timer: unknown };
type RunHandler = (payload: unknown, ctx: HandlerContext) => Promise<ResResult<JsonValue>>;

export interface InflightDeps {
  handlers: Omit<HandlerMap, 'cancel'>;
  timeouts?: Partial<Record<DomCommandType, number>>;
  arm: Arm;
  disarm: (h: unknown) => void;
  respond: (id: string, type: string, result: ResResult<JsonValue>) => void;
  onSignal: (stage: string, detail?: string) => void;
}

const SKIP = Symbol('skip');
type Outcome = ResResult<JsonValue> | typeof SKIP;

/** In-flight DOM commands: one `res` each, abortable, timer-bounded. */
export function createInflight(deps: InflightDeps) {
  const { arm, disarm, respond, onSignal } = deps;
  const map = new Map<string, Inflight>();

  /** The one `res` for a cmd: only the first settle of this very record wins. */
  function settle(f: Inflight, result: ResResult<JsonValue>) {
    if (map.get(f.id) !== f) return;
    map.delete(f.id);
    disarm(f.timer);
    respond(f.id, f.type, result);
  }

  function run(id: string, type: Exclude<DomCommandType, 'cancel'>, payload: JsonValue) {
    const controller = new AbortController();
    const timeoutMs = deps.timeouts?.[type] ?? (type === 'api' ? apiCommandTimeout(payload) : DEFAULT_TIMEOUT_MS);
    const f: Inflight = { id, type, controller, timer: undefined };
    const t = arm(() => {
      if (map.get(id) !== f) return;
      controller.abort();
      settle(f, resErr('timeout', `${type} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    if (!t) return respond(id, type, resErr('failed', 'timer unavailable'));
    f.timer = t.h;
    map.set(id, f);
    const handler = deps.handlers[type] as unknown as RunHandler;
    Promise.resolve()
      .then((): Promise<Outcome> | Outcome => (map.get(id) !== f || controller.signal.aborted ? SKIP : handler(payload, { signal: controller.signal })))
      .then(
        (r) => {
          if (r === SKIP) return;
          const ok = isResResult(r) && checkParsedJson(r).ok;
          settle(f, ok ? (r as ResResult<JsonValue>) : resErr('failed', 'handler returned an invalid result'));
        },
        (e) => {
          onSignal('bridge-handler-error', `${type}: ${String(e instanceof Error ? e.message : e).slice(0, 200)}`);
          settle(f, resErr('failed', `${type} failed`));
        },
      );
  }

  return {
    has: (id: string) => map.has(id),
    size: () => map.size,
    run,
    cancel(targetId: string) {
      const f = map.get(targetId);
      if (!f) return;
      f.controller.abort();
      settle(f, resErr('cancelled', 'cancelled by DOM'));
    },
    abortAll() {
      for (const f of map.values()) {
        try {
          f.controller.abort();
        } catch {
          /* ignore */
        }
        disarm(f.timer);
      }
      map.clear();
    },
  };
}
