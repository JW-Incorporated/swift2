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
