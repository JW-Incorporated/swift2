// DOM side of native-to-DOM `navigate` (W2-I): the notification tap gate emits it to a bound host.
// The reader-owned route (pathname `/`) is applied THROUGH the reader store (never a remount, so open overlays and
// scroll survive): rewrite the page query (search + hash only; the DOM page keeps its own path), apply the
// search via `deps.apply`, and only AFTER that committed answer `navigated {id, ok:true}`. Anything else
// (another pathname, no reader mounted yet, a throw) answers ok:false so the tap stays queued, never a silent home.
// Native opens every non-reader path itself (lib/tap-bind-epoch.ts createTapTarget); the DOM never sees it.
import type { EventPayloadOf } from '@swift2/ui';

export type NavigateDeps = {
  replaceUrl: (relative: string) => void;
  /** Applies the reader search through the store; resolves true once it committed, false when the target did not resolve (state untouched), rejects when no reader is mounted. */
  apply: (search: string) => Promise<boolean>;
};

type NavigateClient = {
  on(type: 'navigate', fn: (e: EventPayloadOf<'navigate'>) => void): () => void;
  sendEvent(type: 'navReady' | 'navigated', payload: never): void;
};

export async function applyNavigateEvent(e: Pick<EventPayloadOf<'navigate'>, 'path'>, deps: NavigateDeps): Promise<boolean> {
  try {
    const u = new URL(e.path, 'http://dom.invalid');
    if (u.pathname !== '/') return false;
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
