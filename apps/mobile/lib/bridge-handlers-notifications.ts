import { resErr, resOk } from '@swift2/ui';
import type { HandlerMap, ResResult } from '@swift2/ui';

type NotificationHost = {
  status(): Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'>;
  request(): Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'>;
  register(): Promise<void>;
  updatePrefs(prefs: Record<string, boolean>): Promise<void>;
};

export type NotificationHandlerDeps = NotificationHost;
export type NotificationHandlers = Pick<
  HandlerMap,
  'notifications.status' | 'notifications.request' | 'notifications.register' | 'notifications.updatePrefs'
>;

const MAX_PREFS = 64;
const MAX_PREF_KEY = 64;

function cleanPrefs(x: unknown): Record<string, boolean> | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null;
  const keys = Object.keys(x);
  if (keys.length > MAX_PREFS) return null;
  const out: Record<string, boolean> = {};
  for (const k of keys) {
    const v = (x as Record<string, unknown>)[k];
    if (k === '__proto__' || k.length === 0 || k.length > MAX_PREF_KEY || typeof v !== 'boolean') return null;
    out[k] = v;
  }
  return out;
}

/** Failures answer a fixed message: a token or server text never crosses the bridge. */
async function guarded<V>(run: () => Promise<V>): Promise<ResResult<V>> {
  try {
    return resOk(await run());
  } catch {
    return resErr('failed', 'notification operation failed');
  }
}

export function createHandlers(deps: NotificationHandlerDeps): NotificationHandlers {
  return {
    'notifications.status': () => guarded(() => deps.status()),
    'notifications.request': () => guarded(() => deps.request()),
    'notifications.register': () => guarded(async () => (await deps.register(), null)),
    'notifications.updatePrefs': async (payload) => {
      const prefs = cleanPrefs(payload?.prefs);
      if (!prefs) return resErr('invalid', 'prefs must be a bounded map of booleans');
      return guarded(async () => (await deps.updatePrefs(prefs), null));
    },
  };
}
