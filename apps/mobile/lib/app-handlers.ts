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

export function createAppHandlers(deps: AppHandlerDeps): AppHandlers {
  return {
    ...createUiHandlers(deps.ui),
    ...createNotificationHandlers(deps.notifications, deps.notificationOpts),
    ...createApiHandlers(deps.api),
  };
}
