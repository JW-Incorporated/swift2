// Composer for the native bridge handler map (One UI wave 0, G15). Pure and
// transport-neutral: composes the D1 (ui), E1 (notifications) and F1 (api)
// factories into the single map `createBridgeHost({ handlers })` takes, so no
// slice registers handlers in the host component. The dispatcher owns `cancel`.
import { resErr, type HandlerMap } from '@swift2/ui';
import { apiBaseUrl } from './api-base';
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
 * W2-I: ONE host map from the unwired fail-closed base plus whichever groups have deps (ui: H1, api: H2,
 * notifications: H3). Real groups are merged (a key claimed twice throws); unwired entries remain only for
 * keys no real group claims, so every command key is present exactly once.
 */
export function createAppHandlersFor(
  log: (stage: string, detail: string) => void,
  wired: Partial<AppHandlerDeps>,
): AppHandlers {
  const groups: [string, object][] = [];
  if (wired.ui) groups.push(['ui', createUiHandlers(wired.ui)]);
  if (wired.notifications) groups.push(['notifications', createNotificationHandlers(wired.notifications, wired.notificationOpts)]);
  if (wired.api) groups.push(['api', createApiHandlers(wired.api)]);
  const claimed = new Set(groups.flatMap(([, h]) => Object.keys(h)));
  const base = Object.fromEntries(Object.entries(createUnwiredHandlers(log)).filter(([k]) => !claimed.has(k)));
  return mergeHandlerGroups([['unwired', base], ...groups]);
}

/** The unwired map with the ui group's real handlers replacing its entries (H1). */
export function createWiredHandlers(log: (stage: string, detail: string) => void, wired: { ui?: UiHandlerDeps }): AppHandlers {
  return createAppHandlersFor(log, wired);
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
    'clipboard.write': unwired('clipboard.write'),
    api: unwired('api'),
    apiRead: unwired('apiRead'),
    'notifications.status': unwired('notifications.status'),
    'notifications.request': unwired('notifications.request'),
    'notifications.register': unwired('notifications.register'),
    'notifications.updatePrefs': unwired('notifications.updatePrefs'),
    'notifications.getPrefs': unwired('notifications.getPrefs'),
    'notifications.savePrefs': unwired('notifications.savePrefs'),
    'notifications.unregister': unwired('notifications.unregister'),
    'notifications.registration': unwired('notifications.registration'),
    'notifications.optOutPending': unwired('notifications.optOutPending'),
    'notifications.onboardingOffered': unwired('notifications.onboardingOffered'),
    'notifications.markOnboardingOffered': unwired('notifications.markOnboardingOffered'),
  };
}

/**
 * Live `api` deps (H2): expo/fetch + apiBaseUrl + the native clown session. expo-fetch-deps is
 * loaded on first call so importing the composer stays free of expo/* (node tests, transport isolation).
 */
export function createLiveApiDeps(): ApiHandlerDeps {
  const deps = () => import('./expo-fetch-deps').then((m) => m.createExpoApiDeps());
  return {
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => (await deps()).fetch(input, init)) as typeof fetch,
    baseUrl: apiBaseUrl,
    clownSession: {
      get: async () => (await deps()).clownSession?.get() ?? null,
      set: async (token) => (await deps()).clownSession?.set(token),
    },
  };
}

/** H2 host map: the H0 map with `api` live; H1/H3 swap in their own groups the same way. */
export function createLiveAppHandlers(log: (stage: string, detail: string) => void): AppHandlers {
  return createAppHandlersFor(log, { api: createLiveApiDeps() });
}
