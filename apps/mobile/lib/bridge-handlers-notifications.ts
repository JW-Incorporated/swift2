// Threat model (PM ruling): the DOM runs only our own bundled code, and a
// permission request already surfaces the OS prompt, so these handlers carry
// no user-gesture gate. Prefs go through the strict `validKnownPrefs` (known categories only).
import { resErr, resOk } from '@swift2/ui';
import type { HandlerContext, HandlerMap, PayloadOf, ResResult } from '@swift2/ui';
import type { DevicePrefsResponse } from '@swift2/shared';
import { validKnownPrefs, validPrefsUpdate } from './bridge-host-validate';

type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';
type PrefsUpdate = PayloadOf<'notifications.savePrefs'>;
type NotificationHost = {
  status(): Promise<Permission>;
  request(): Promise<Permission>;
  register(): Promise<void>;
  updatePrefs(prefs: Record<string, boolean>): Promise<void>;
  getPrefs(): Promise<DevicePrefsResponse>;
  savePrefs(body: PrefsUpdate): Promise<DevicePrefsResponse>;
  unregister(): Promise<void>;
};

export type NotificationHandlerDeps = NotificationHost;
export type NotificationHandlers = Pick<
  HandlerMap,
  'notifications.status' | 'notifications.request' | 'notifications.register' | 'notifications.updatePrefs'
  | 'notifications.getPrefs' | 'notifications.savePrefs' | 'notifications.unregister'
>;

const OP_TIMEOUT_MS = 15_000;
const cancelled = (message = 'cancelled') => resErr('cancelled', message);

/**
 * Runs `run` unless already aborted; an abort, or `opTimeoutMs`, settles the
 * call at once (so the update chain never wedges on a hung native call) and
 * discards any later result. An abandoned write may still complete natively:
 * ordering holds only among non-abandoned writes. Failures answer a fixed
 * message: a token or server text never crosses the bridge.
 */
async function guarded<V>(ctx: HandlerContext, run: () => Promise<V>, opTimeoutMs = OP_TIMEOUT_MS): Promise<ResResult<V>> {
  if (ctx.signal.aborted) return cancelled();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const aborted = new Promise<ResResult<never>>((r) => {
      onAbort = () => r(cancelled());
      ctx.signal.addEventListener('abort', onAbort, { once: true });
    });
    const timedOut = new Promise<ResResult<never>>((r) => {
      timer = setTimeout(() => r(resErr('failed', 'notification operation failed')), opTimeoutMs);
    });
    const done = run().then(
      (value): ResResult<V> => (ctx.signal.aborted ? cancelled() : resOk(value)),
      (): ResResult<V> => (ctx.signal.aborted ? cancelled() : resErr('failed', 'notification operation failed')),
    );
    return await Promise.race([done, aborted, timedOut]);
  } catch {
    return resErr('failed', 'notification operation failed');
  } finally {
    clearTimeout(timer);
    if (onAbort) ctx.signal.removeEventListener('abort', onAbort);
  }
}

export function createHandlers(deps: NotificationHandlerDeps, opts: { opTimeoutMs?: number } = {}): NotificationHandlers {
  const guardedT = <V>(ctx: HandlerContext, run: () => Promise<V>) => guarded(ctx, run, opts.opTimeoutMs);
  let latest = 0;
  let tail: Promise<unknown> = Promise.resolve();
  // savePrefs writes are independent per key, so they run strictly FIFO (never latest-wins).
  let writeTail: Promise<unknown> = Promise.resolve();

  return {
    'notifications.status': (_p, ctx) => guardedT(ctx, () => deps.status()),
    'notifications.request': (_p, ctx) => guardedT(ctx, () => deps.request()),
    'notifications.register': (_p, ctx) => guardedT(ctx, async () => (await deps.register(), null)),
    'notifications.getPrefs': (_p, ctx) => guardedT(ctx, () => deps.getPrefs()),
    'notifications.unregister': (_p, ctx) => guardedT(ctx, async () => (await deps.unregister(), null)),
    'notifications.savePrefs': (payload, ctx) => {
      const clean = validPrefsUpdate(payload ?? {}) as PrefsUpdate | null;
      if (!clean || typeof payload !== 'object' || payload === null) return Promise.resolve(resErr('invalid', 'invalid prefs update'));
      const run = writeTail.then(() => guardedT(ctx, () => deps.savePrefs(clean)));
      writeTail = run.catch(() => undefined);
      return run;
    },
    'notifications.updatePrefs': (payload, ctx) => {
      const clean = validKnownPrefs(payload?.prefs) as { prefs: Record<string, boolean> } | null;
      if (!clean) return Promise.resolve(resErr('invalid', 'prefs must be a bounded map of booleans'));
      // Serialized, latest-wins: an older update still queued behind a slow one is skipped.
      const seq = ++latest;
      const run = tail.then(() => {
        if (seq !== latest) return cancelled('superseded');
        return guardedT(ctx, async () => (await deps.updatePrefs(clean.prefs), null));
      });
      tail = run.catch(() => undefined);
      return run;
    },
  };
}
