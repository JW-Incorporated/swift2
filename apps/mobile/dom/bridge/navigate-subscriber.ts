// DOM side of native-to-DOM `navigate` (W2-I): the notification tap gate emits it to a bound host.
// The reader reads its deep link (?item=, ?lens=, ?era=, ?mode=...) once on mount from the page URL, so
// the reader-owned route (pathname `/`) is: rewrite the query (search + hash only; the DOM page keeps its
// own path), remount the reader, and only AFTER the remount committed answer `navigated {id, ok:true}`.
// Anything else (another pathname, a throw) answers ok:false so the tap stays queued, never a silent home.
// Native opens every non-reader path itself (lib/tap-bind-epoch.ts createTapTarget); the DOM never sees it.
import type { EventPayloadOf } from '@swift2/ui';

export type NavigateDeps = {
  replaceUrl: (relative: string) => void;
  /** Resolves once the reader has remounted and committed. */
  remount: () => Promise<void>;
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
    await deps.remount();
    return true;
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
