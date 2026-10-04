// DOM side of native-to-DOM `navigate` (W2-I): the notification tap gate emits it to a bound host.
// The reader-owned route (pathname `/`) is applied THROUGH the reader store (never a remount, so open overlays and
// scroll survive): rewrite the page query (search + hash only; the DOM page keeps its own path), apply the
// search via `deps.apply`, and only AFTER that committed answer `navigated {id, ok:true}`. Anything else
// (another pathname, no reader mounted yet, a throw) answers ok:false so the tap stays queued, never a silent home.
// The allow-listed legal paths (dom-path.ts) are shown in the DOM too: `deps.setPath` resolves true only once the layer is
// observed committed (dom-path-commit.ts), false on a render failure or no layer; a reader path first closes any open legal page. A settings path (/settings, /settings/notifications) opens the DOM settings overlay and acks ok:true. Native opens every other non-reader path itself (lib/tap-bind-epoch.ts createTapTarget); the DOM never sees it.
import type { EventPayloadOf } from '@swift2/ui';
import { isDomPath } from './dom-path';
import { isInboxPath, isLegacyInboxLink, isSettingsPath } from '../slots/settings-paths';
import { inboxOverlay } from '../slots/inbox-store';
import { settingsOverlay } from '../slots/settings-store';

export type NavigateDeps = {
  replaceUrl: (relative: string) => void;
  /** Applies the reader search through the store; resolves true once it committed, false when the target did not resolve (state untouched), rejects when no reader is mounted. */
  apply: (search: string) => Promise<boolean>;
  /** Shows an allow-listed legal path or the reader root and resolves once it committed (showDomPath); false when refused or not rendered. Absent: legal paths are refused. */
  setPath?: (path: string) => boolean | Promise<boolean>;
};

type NavigateClient = {
  on(type: 'navigate', fn: (e: EventPayloadOf<'navigate'>) => void): () => void;
  sendEvent(type: 'navReady' | 'navigated', payload: never): void;
};

export async function applyNavigateEvent(e: Pick<EventPayloadOf<'navigate'>, 'path'>, deps: NavigateDeps): Promise<boolean> {
  try {
    const u = new URL(e.path, 'http://dom.invalid');
    if (isInboxPath(u.pathname) || isLegacyInboxLink(e.path)) {
      inboxOverlay.open();
      return true;
    }
    if (isSettingsPath(u.pathname)) {
      inboxOverlay.close();
      settingsOverlay.open();
      return true;
    }
    if (isDomPath(u.pathname) && deps.setPath) {
      return await deps.setPath(u.pathname);
    }
    if (u.pathname !== '/') return false;
    if (deps.setPath && !(await deps.setPath('/'))) return false;
    deps.replaceUrl(`${u.search || '?'}${u.hash}`);
    return await deps.apply(u.search);
  } catch {
    return false;
  }
}

/** Installs the subscriber, then announces it (`navReady`); the host dedupes repeats, so announcing on every install is safe. */
export function installNavigateSubscriber(client: NavigateClient, deps: NavigateDeps): () => void {
  const off = client.on('navigate', (e) => {
    void applyNavigateEvent(e, deps).then((ok) => {
      if (e.id !== undefined) client.sendEvent('navigated', { id: e.id, ok } as never);
    });
  });
  client.sendEvent('navReady', {} as never);
  return off;
}
