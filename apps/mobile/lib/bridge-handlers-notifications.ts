// Threat model (PM ruling): the DOM runs only our own bundled code, and a
// permission request already surfaces the OS prompt, so these handlers carry
// no user-gesture gate. Prefs go through the canonical `validPrefs`.
import { resErr, resOk } from '@swift2/ui';
import type { HandlerContext, HandlerMap, ResResult } from '@swift2/ui';
import { validPrefs } from './bridge-host-validate';

type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';
type NotificationHost = {
  status(): Promise<Permission>;
  request(): Promise<Permission>;
  register(): Promise<void>;
  updatePrefs(prefs: Record<string, boolean>): Promise<void>;
};

export type NotificationHandlerDeps = NotificationHost;
export type NotificationHandlers = Pick<
  HandlerMap,
  'notifications.status' | 'notifications.request' | 'notifications.register' | 'notifications.updatePrefs'
>;

const cancelled = (message = 'cancelled') => resErr('cancelled', message);

/**
 * Runs `run` unless already aborted; an abort during the call discards its
 * result. Failures answer a fixed message: a token or server text never
 * crosses the bridge.
 */
async function guarded<V>(ctx: HandlerContext, run: () => Promise<V>): Promise<ResResult<V>> {
  if (ctx.signal.aborted) return cancelled();
  try {
    const value = await run();
    return ctx.signal.aborted ? cancelled() : resOk(value);
  } catch {
    return ctx.signal.aborted ? cancelled() : resErr('failed', 'notification operation failed');
  }
}

export function createHandlers(deps: NotificationHandlerDeps): NotificationHandlers {
  let latest = 0;
  let tail: Promise<unknown> = Promise.resolve();

  return {
    'notifications.status': (_p, ctx) => guarded(ctx, () => deps.status()),
    'notifications.request': (_p, ctx) => guarded(ctx, () => deps.request()),
    'notifications.register': (_p, ctx) => guarded(ctx, async () => (await deps.register(), null)),
    'notifications.updatePrefs': (payload, ctx) => {
      const clean = validPrefs(payload?.prefs) as { prefs: Record<string, boolean> } | null;
      if (!clean) return Promise.resolve(resErr('invalid', 'prefs must be a bounded map of booleans'));
      // Serialized, latest-wins: an older update still queued behind a slow one is skipped.
      const seq = ++latest;
      const run = tail.then(() => {
        if (seq !== latest) return cancelled('superseded');
        return guarded(ctx, async () => (await deps.updatePrefs(clean.prefs), null));
      });
      tail = run.catch(() => undefined);
      return run;
    },
  };
}
