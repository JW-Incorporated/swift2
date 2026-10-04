// Composer for the native bridge handler map (One UI wave 0, G15). Pure and
// transport-neutral: composes the D1 (ui), E1 (notifications) and F1 (api)
// factories into the single map `createBridgeHost({ handlers })` takes, so no
// slice registers handlers in the host component. The dispatcher owns `cancel`.
import type { HandlerMap } from '@swift2/ui';
import { createHandlers as createApiHandlers, type ApiHandlerDeps } from './bridge-handlers-api';
import { createHandlers as createNotificationHandlers, type NotificationHandlerDeps } from './bridge-handlers-notifications';
import { createHandlers as createUiHandlers, type UiHandlerDeps } from './bridge-handlers-ui';

export type AppHandlerDeps = {
  ui: UiHandlerDeps;
  notifications: NotificationHandlerDeps;
  api: ApiHandlerDeps;
  notificationOpts?: { opTimeoutMs?: number };
};

export type AppHandlers = Omit<HandlerMap, 'cancel'>;

/** Merges handler groups; a message type claimed by two groups is a wiring bug, so it throws. */
export function mergeHandlerGroups(groups: readonly (readonly [source: string, handlers: object])[]): AppHandlers {
  const out: Record<string, unknown> = {};
  const owner = new Map<string, string>();
  for (const [source, handlers] of groups) {
    for (const key of Object.keys(handlers)) {
      const prior = owner.get(key);
      if (prior !== undefined) throw new Error(`createAppHandlers: duplicate handler "${key}" (from ${prior} and ${source})`);
      owner.set(key, source);
      out[key] = (handlers as Record<string, unknown>)[key];
    }
  }
  return out as AppHandlers;
}

export function createAppHandlers(deps: AppHandlerDeps): AppHandlers {
  return mergeHandlerGroups([
    ['ui', createUiHandlers(deps.ui)],
    ['notifications', createNotificationHandlers(deps.notifications, deps.notificationOpts)],
    ['api', createApiHandlers(deps.api)],
  ]);
}

/**
 * Deps for a host whose commands are not wired yet (H0): every command fails
 * closed (`failed`/`invalid`, never reported to the watchdog). H1/H2/H3 replace
 * the ui/api/notifications entries with real deps.
 */
export function createUnwiredAppDeps(log: (stage: string, detail: string) => void): AppHandlerDeps {
  const unwired = (what: string) => async (): Promise<never> => {
    throw new Error(`${what} not wired`);
  };
  return {
    ui: {
      navigate: unwired('navigate'),
      isNativeRoute: () => false,
      log,
      openURL: unwired('openExternal'),
      share: unwired('share'),
    },
    notifications: {
      status: unwired('notifications.status'),
      request: unwired('notifications.request'),
      register: unwired('notifications.register'),
      updatePrefs: unwired('notifications.updatePrefs'),
    },
    api: { fetch: unwired('api') as unknown as typeof fetch, baseUrl: () => '' },
  };
}
