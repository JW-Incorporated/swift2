// DOM side of native-to-DOM `navigate` (W2-I): the notification tap gate emits it to a bound host.
// The reader-owned route (pathname `/`) is applied THROUGH the reader store (never a remount, so open overlays and
// scroll survive): rewrite the page query (search + hash only; the DOM page keeps its own path), apply the
// search via `deps.apply`, and only AFTER that committed answer `navigated {id, ok:true}`. Anything else
// (another pathname, a target that does not resolve) answers ok:false, which native consumes (never retried to TTL, never a silent home).
// A throw (no reader mounted yet, a render failure) is NOT an answer: it propagates, nothing is sent, and native's lost-confirmation path retries the same delivery id and gives up loudly.
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
}

/** Installs the subscriber, then announces it (`navReady`); the host dedupes repeats, so announcing on every install is safe. */
export function installNavigateSubscriber(client: NavigateClient, deps: NavigateDeps): () => void {
  // Native re-emits a delivery whose confirmation was lost with the SAME id: apply once, answer every repeat from the
  // first result (a double application would re-run overlays/history). Bounded, oldest evicted.
  const seen = new Map<string, Promise<boolean>>();
  const off = client.on('navigate', (e) => {
    let result = e.id === undefined ? undefined : seen.get(e.id);
    if (!result) {
      result = applyNavigateEvent(e, deps);
      if (e.id !== undefined) {
        seen.set(e.id, result);
        if (seen.size > 32) seen.delete(seen.keys().next().value as string);
      }
    }
    result.then(
      (ok) => {
        if (e.id !== undefined) client.sendEvent('navigated', { id: e.id, ok } as never);
      },
      () => {
        // No answer: forget the id so the retry re-applies instead of replaying a failure.
        if (e.id !== undefined && seen.get(e.id) === result) seen.delete(e.id);
      },
    );
  });
  client.sendEvent('navReady', {} as never);
  return off;
}
