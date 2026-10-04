// Composer for the native bridge handler map (One UI wave 0, G15). Pure and
// transport-neutral: composes the D1 (ui), E1 (notifications) and F1 (api)
// factories into the single map `createBridgeHost({ handlers })` takes, so no
// slice registers handlers in the host component. The dispatcher owns `cancel`.
import { resErr, type HandlerMap } from '@swift2/ui';
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

/** The unwired map with each wired group's real handlers replacing its entries (H1: ui; H2/H3 add theirs). */
export function createWiredHandlers(log: (stage: string, detail: string) => void, wired: { ui?: UiHandlerDeps }): AppHandlers {
  return { ...createUnwiredHandlers(log), ...(wired.ui ? createUiHandlers(wired.ui) : {}) };
}

/**
 * H0 handler map: every DOM command answers `failed` (never success, never a
 * watchdog report) until H1/H2/H3 swap in real handlers via createAppHandlers.
 * Typed as the exhaustive AppHandlers, so a new command is a compile error here.
 */
export function createUnwiredHandlers(log: (stage: string, detail: string) => void): AppHandlers {
  const unwired = (type: string) => async () => {
    log('bridge-unwired', type);
    return resErr('failed', `${type} is not available yet`);
  };
  return {
    navigate: unwired('navigate'),
    openExternal: unwired('openExternal'),
    share: unwired('share'),
    haptic: unwired('haptic'),
    api: unwired('api'),
    'notifications.status': unwired('notifications.status'),
    'notifications.request': unwired('notifications.request'),
    'notifications.register': unwired('notifications.register'),
    'notifications.updatePrefs': unwired('notifications.updatePrefs'),
  };
}
