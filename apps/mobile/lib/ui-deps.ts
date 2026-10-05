// Real deps for the UI bridge handlers (One UI H1 / WP2.3-D2). The native
// modules are injected (Linking, Share, expo-haptics, Platform.OS) so this file
// stays testable under node; SharedUiHost passes the real ones.
import type { HapticKind, SharePayload, WebPath } from '@swift2/ui';
import type { UiHandlerDeps } from './bridge-handlers-ui';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes';
import { resolveDestination } from './destination-resolver';

const DEFAULT_SITE_URL = 'https://www.longlivets.com';

export type HapticsLike = {
  impactAsync(style: unknown): Promise<void>;
  notificationAsync(type: unknown): Promise<void>;
  selectionAsync(): Promise<void>;
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
  NotificationFeedbackType: { Success: unknown; Warning: unknown; Error: unknown };
};

/** Native share-card file ports (expo-file-system / expo-clipboard); absent = image shares degrade to a link share. */
export type ShareCardPorts = {
  /** Downloads `url` to the cache as `share/<name>.png` and returns the file. Callers pass a unique name per request. */
  download(url: string, name: string): Promise<{ uri: string; base64(): string | Promise<string> }>;
  copyImage(base64: string): Promise<void>;
  /** Best-effort: delete all but the newest `keep` share files (names sort oldest-first). */
  prune(keep: number): Promise<void>;
};

const CARD_DOWNLOAD_TIMEOUT_MS = 8000;

export type UiDepsEnv = {
  linking: { openURL(url: string): Promise<unknown> };
  share: { share(content: { title?: string; message?: string; url?: string }): Promise<unknown> };
  cards?: ShareCardPorts;
  /** Absent when the haptics module is unavailable: the handler answers no-op success. */
  haptics?: HapticsLike;
  platformOS: string;
  log: (stage: string, detail: string) => void;
  siteUrl?: string;
  /**
   * Reads the D-7 presenter (`createNativeRoutePresenter().presentNativeRoute`) at call
   * time. Until the app supplies one (H4/D1) a native-route navigate answers `failed`.
   */
  getPresenter?: () => ((path: WebPath) => unknown) | undefined;
};

export function createUiDeps(env: UiDepsEnv): UiHandlerDeps {
  const siteUrl = env.siteUrl ?? DEFAULT_SITE_URL;
  const { haptics } = env;
  let generation = 0;
  return {
    log: env.log,
    // Native only when the ONE destination resolver says the path canonicalizes to a registered host route (what the
    // presenter accepts). Everything else, legacy query forms included, is the DOM's to route: the handler answers invalid.
    isNativeRoute: (path) => {
      const d = resolveDestination(path, { isHostRoute, siteUrl });
      return d.kind === 'native' && isHostRoute(d.path);
    },
    navigate: (path) => {
      const present = env.getPresenter?.();
      if (!present) throw new Error('native route presenter not attached');
      if (present(resolveDestination(path, { isHostRoute, siteUrl }).path as WebPath) === 'rejected') throw new Error('native route rejected');
    },
    openURL: async (url) => {
      await env.linking.openURL(url);
    },
    imageHost: new URL(siteUrl).host,
    share: async (p: SharePayload & { image?: { url: string } }) => {
      const { image, ...link } = p;
      const gen = ++generation;
      const card = image && env.cards ? await fetchCard(env.cards, image.url, gen) : null;
      if (gen !== generation) return;
      if (card) {
        if (env.platformOS === 'android') {
          // No file share on Android in this build: put the card on the clipboard, then share the text.
          let imageCopied = false;
          try {
            await env.cards!.copyImage(await card.base64());
            imageCopied = true;
          } catch (e) {
            env.log('share.card', e instanceof Error ? e.message : 'copy failed');
          }
          await shareLink(link);
          return { imageCopied };
        } else {
          await env.share.share({ title: link.title, message: [link.text, link.url].filter((x): x is string => !!x).join('\n'), url: card.uri });
          return { imageCopied: false };
        }
      }
      await shareLink(link);
    },
    haptic: haptics ? (kind) => runHaptic(haptics, kind) : undefined,
  };

  async function fetchCard(cards: ShareCardPorts, url: string, gen: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const size = new URL(url).searchParams.get('size');
      const name = size === 'story' || size === 'portrait' ? size : 'card';
      const card = await Promise.race([
        cards.download(url, `${Date.now()}-${gen}-${name}`),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('card download timed out')), CARD_DOWNLOAD_TIMEOUT_MS);
        }),
      ]);
      if (gen !== generation) return null;
      void cards.prune(2).catch(() => {});
      return card;
    } catch (e) {
      env.log('share.card', e instanceof Error ? e.message : 'download failed');
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function shareLink(p: SharePayload): Promise<void> {
    // iOS shows `url` itself; Android ignores it, so fold it into the message there.
    if (env.platformOS === 'android') {
      const message = [p.text, p.url].filter((s): s is string => !!s).join('\n');
      await env.share.share({ title: p.title, message });
      return;
    }
    await env.share.share({ title: p.title, message: p.text, url: p.url });
  }
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
