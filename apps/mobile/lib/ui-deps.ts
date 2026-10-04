// Real deps for the UI bridge handlers (One UI H1 / WP2.3-D2). The native
// modules are injected (Linking, Share, expo-haptics, Platform.OS) so this file
// stays testable under node; SharedUiHost passes the real ones.
import type { HapticKind, SharePayload, ThemeChange, WebPath } from '@swift2/ui';
import type { UiHandlerDeps } from './bridge-handlers-ui';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes';
import { DEFAULT_ROUTE_FLAGS, isNativeRoute, type RouteFlags } from './routes';

const DEFAULT_SITE_URL = 'https://www.longlivets.com';

export type HapticsLike = {
  impactAsync(style: unknown): Promise<void>;
  notificationAsync(type: unknown): Promise<void>;
  selectionAsync(): Promise<void>;
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
  NotificationFeedbackType: { Success: unknown; Warning: unknown; Error: unknown };
};

export type UiDepsEnv = {
  linking: { openURL(url: string): Promise<unknown> };
  share: { share(content: { title?: string; message?: string; url?: string }): Promise<unknown> };
  /** Absent when the haptics module is unavailable: the handler answers no-op success. */
  haptics?: HapticsLike;
  platformOS: string;
  /** Applies the reader's theme colour to the native chrome (status bar, host background). */
  onTheme?: (theme: ThemeChange) => void;
  log: (stage: string, detail: string) => void;
  siteUrl?: string;
  getFlags?: () => RouteFlags;
  /**
   * Reads the D-7 presenter (`createNativeRoutePresenter().presentNativeRoute`) at call
   * time. Until the app supplies one (H4/D1) a native-route navigate answers `failed`.
   */
  getPresenter?: () => ((path: WebPath) => unknown) | undefined;
};

export function createUiDeps(env: UiDepsEnv): UiHandlerDeps {
  const siteUrl = env.siteUrl ?? DEFAULT_SITE_URL;
  const getFlags = env.getFlags ?? (() => DEFAULT_ROUTE_FLAGS);
  const { haptics } = env;
  return {
    log: env.log,
    // A DOM-routed path is not native: the handler answers `invalid` and the DOM routes it itself. The slot route
    // registry (what the presenter accepts, e.g. /inbox) and the legacy screen table (lib/routes) both count.
    isNativeRoute: (path) => isHostRoute(path) || isNativeRoute(new URL(path, siteUrl).toString(), siteUrl, getFlags()),
    navigate: (path) => {
      const present = env.getPresenter?.();
      if (!present) throw new Error('native route presenter not attached');
      if (present(path) === 'rejected') throw new Error('native route rejected');
    },
    openURL: async (url) => {
      await env.linking.openURL(url);
    },
    share: async (p: SharePayload) => {
      // iOS shows `url` itself; Android ignores it, so fold it into the message there.
      if (env.platformOS === 'android') {
        const message = [p.text, p.url].filter((s): s is string => !!s).join('\n');
        await env.share.share({ title: p.title, message });
        return;
      }
      await env.share.share({ title: p.title, message: p.text, url: p.url });
    },
    haptic: haptics ? (kind) => runHaptic(haptics, kind) : undefined,
    theme: env.onTheme,
  };
}

async function runHaptic(h: HapticsLike, kind: HapticKind): Promise<void> {
  switch (kind) {
    case 'light':
      return h.impactAsync(h.ImpactFeedbackStyle.Light);
    case 'medium':
      return h.impactAsync(h.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return h.impactAsync(h.ImpactFeedbackStyle.Heavy);
    case 'success':
      return h.notificationAsync(h.NotificationFeedbackType.Success);
    case 'warning':
      return h.notificationAsync(h.NotificationFeedbackType.Warning);
    case 'error':
      return h.notificationAsync(h.NotificationFeedbackType.Error);
    case 'selection':
      return h.selectionAsync();
  }
}
