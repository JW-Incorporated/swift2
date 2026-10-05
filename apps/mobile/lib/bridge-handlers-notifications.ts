// Threat model (PM ruling): the DOM runs only our own bundled code, and a
// permission request already surfaces the OS prompt, so these handlers carry
// no user-gesture gate. Prefs go through the strict `validKnownPrefs` (known categories only).
import { resErr, resOk } from '@swift2/ui';
import type { HandlerContext, HandlerMap, PayloadOf, ResResult } from '@swift2/ui';
import type { DevicePrefsResponse } from '@swift2/shared';
import { projectPrefs } from './prefs-projection';
import { validKnownPrefs, validPrefsUpdate } from './bridge-host-validate';

type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';
type PrefsUpdate = PayloadOf<'notifications.savePrefs'>;
type NotificationHost = {
  status(): Promise<Permission>;
  request(): Promise<Permission>;
  register(): Promise<void>;
  updatePrefs(prefs: Record<string, boolean>): Promise<void>;
  /** `signal` aborts the underlying request (timeout or caller cancel). */
  getPrefs(signal?: AbortSignal): Promise<DevicePrefsResponse>;
  savePrefs(body: PrefsUpdate, signal?: AbortSignal): Promise<DevicePrefsResponse>;
  unregister(): Promise<void>;
  registered(): Promise<boolean>;
  /** The one-time push-offer flag (shared with the native OnboardingScreen); absent = the commands answer `failed`. */
  optOutPending?(): Promise<boolean>;
  onboardingOffered?(): Promise<boolean>;
  markOnboardingOffered?(): Promise<void>;
};

export type NotificationHandlerDeps = NotificationHost;
export type NotificationHandlers = Pick<
  HandlerMap,
  'notifications.status' | 'notifications.request' | 'notifications.register' | 'notifications.updatePrefs'
  | 'notifications.getPrefs' | 'notifications.savePrefs' | 'notifications.unregister' | 'notifications.registration'
  | 'notifications.optOutPending' | 'notifications.onboardingOffered' | 'notifications.markOnboardingOffered'
>;

const OP_TIMEOUT_MS = 15_000;
/** Writes waiting behind the running one; a full queue answers a fixed failure instead of growing. */
const MAX_QUEUED_WRITES = 16;
/** After a deadline abort, how long the queue waits for the aborted request to settle before moving on. */
const ABORT_GRACE_MS = 2_000;
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

export function createHandlers(deps: NotificationHandlerDeps, opts: { opTimeoutMs?: number; abortGraceMs?: number } = {}): NotificationHandlers {
  const guardedT = <V>(ctx: HandlerContext, run: () => Promise<V>) => guarded(ctx, run, opts.opTimeoutMs);
  let latest = 0;
  let tail: Promise<unknown> = Promise.resolve();
  // savePrefs writes are independent per key, so they run strictly FIFO (never latest-wins), one physical request
  // at a time. The deadline starts when a write EXECUTES (not while it waits); on timeout or cancel the request is
  // aborted and the queue waits for it to settle (bounded by a grace period) before the next write starts, so a
  // slow write can never be overtaken by a later one.
  let writeTail: Promise<unknown> = Promise.resolve();
  let queued = 0;
  const failed = (): ResResult<never> => resErr('failed', 'notification operation failed');
  const writeOne = async (clean: PrefsUpdate, ctx: HandlerContext): Promise<ResResult<ReturnType<typeof projectPrefs>>> => {
    if (ctx.signal.aborted) return cancelled();
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    ctx.signal.addEventListener('abort', onAbort, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const underlying = Promise.resolve()
      .then(() => deps.savePrefs(clean, ac.signal))
      .then((v) => projectPrefs(v));
    underlying.catch(() => undefined);
    try {
      const timedOut = new Promise<'timeout'>((r) => {
        timer = setTimeout(() => r('timeout'), opts.opTimeoutMs ?? OP_TIMEOUT_MS);
      });
      const aborted = new Promise<'abort'>((r) => {
        if (ctx.signal.aborted) r('abort');
        else ctx.signal.addEventListener('abort', () => r('abort'), { once: true });
      });
      const first = await Promise.race([underlying.then(() => 'done' as const, () => 'error' as const), timedOut, aborted]);
      if (first === 'done') return resOk(await underlying);
      if (first === 'error') return failed();
      ac.abort();
      let grace: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([underlying.then(() => undefined, () => undefined), new Promise((r) => (grace = setTimeout(r, opts.abortGraceMs ?? ABORT_GRACE_MS)))]);
      clearTimeout(grace);
      return first === 'abort' ? cancelled() : failed();
    } finally {
      clearTimeout(timer);
      ctx.signal.removeEventListener('abort', onAbort);
    }
  };

  return {
    'notifications.status': (_p, ctx) => guardedT(ctx, () => deps.status()),
    'notifications.request': (_p, ctx) => guardedT(ctx, () => deps.request()),
    'notifications.register': (_p, ctx) => guardedT(ctx, async () => (await deps.register(), null)),
    'notifications.getPrefs': (_p, ctx) => guardedT(ctx, async () => projectPrefs(await deps.getPrefs())),
    'notifications.registration': (_p, ctx) => guardedT(ctx, async () => ({ registered: (await deps.registered()) === true })),
    'notifications.unregister': (_p, ctx) => guardedT(ctx, async () => (await deps.unregister(), null)),
    'notifications.optOutPending': (_p, ctx) =>
      guardedT(ctx, async () => {
        if (!deps.optOutPending) throw new Error('unavailable');
        return { pending: (await deps.optOutPending()) === true };
      }),
    'notifications.onboardingOffered': (_p, ctx) =>
      guardedT(ctx, async () => {
        if (!deps.onboardingOffered) throw new Error('unavailable');
        return { offered: (await deps.onboardingOffered()) === true };
      }),
    'notifications.markOnboardingOffered': (_p, ctx) =>
      guardedT(ctx, async () => {
        if (!deps.markOnboardingOffered) throw new Error('unavailable');
        await deps.markOnboardingOffered();
        return null;
      }),
    'notifications.savePrefs': (payload, ctx) => {
      const clean = validPrefsUpdate(payload ?? {}) as PrefsUpdate | null;
      if (!clean || typeof payload !== 'object' || payload === null) return Promise.resolve(resErr('invalid', 'invalid prefs update'));
      if (queued >= MAX_QUEUED_WRITES) return Promise.resolve(failed());
      queued++;
      const run = writeTail.then(() => writeOne(clean, ctx)).finally(() => void queued--);
      writeTail = run.catch(() => undefined);
      // A caller cancel settles the waiting call at once; its turn in the queue is skipped (writeOne sees the abort).
      return Promise.race([
        run,
        new Promise<ResResult<never>>((r) => {
          if (ctx.signal.aborted) r(cancelled());
          else ctx.signal.addEventListener('abort', () => r(cancelled()), { once: true });
        }),
      ]);
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
