// Native-to-DOM `navigate` lands here (D2): the reader's own deep-link vocabulary (?item=, ?song=, ?guide=,
// ?theories=, ?lens=, ?mode=, ?era=) applied THROUGH the store's actions, so a tap never remounts the reader
// and open overlays/scroll survive. Mirrors the one-time mount read in packages/ui reader/store `AppProvider`
// (kept in step with it; that effect is not exported). No React imports: runs under node tests.
import { deepLinkTarget, resolveVideoDeepLink } from '@swift2/experience';

export type DeepLinkActions = {
  goHome(): void;
  setEra(id: never): void;
  setMode(mode: never): void;
  openThread(id: never): void;
  openItem(id: string): void;
  openVideo(eraId: never, videoId: string): void;
  openSong(eraId: never, key: string): void;
  openTrackGuide(id: never): void;
  openTheoryGuide(id: never): void;
};

export type DeepLinkQueries = {
  threadIds: readonly string[];
  contentItemId(idOrSlug: string): string | null;
  isEraId(id: string): boolean;
  eraHasVideoSlug(eraId: string, slug: string): boolean;
  findEraForVideoSlug(slug: string): string | null;
  eraOfTrackKey(key: string): string | null;
};

const as = (v: string): never => v as never;

/** True when the search named a target the reader honoured; anything unresolvable lands on the front door (as a fresh mount would). */
export function applyDeepLink(search: string, q: DeepLinkQueries, a: DeepLinkActions): boolean {
  const target = deepLinkTarget(search, q.threadIds);
  if (!target) {
    a.goHome();
    return false;
  }
  if (target.kind === 'item') {
    const id = q.contentItemId(target.id);
    if (id) {
      a.openItem(id);
      return true;
    }
    const eraHint = new URLSearchParams(search).get('era');
    const eraId = resolveVideoDeepLink(target.id, eraHint, q.isEraId, q.eraHasVideoSlug, q.findEraForVideoSlug);
    if (eraId) {
      a.openVideo(as(eraId), target.id);
      return true;
    }
  } else if (target.kind === 'song') {
    const eraId = q.eraOfTrackKey(target.key);
    if (eraId) {
      a.openSong(as(eraId), target.key);
      return true;
    }
  } else if (target.kind === 'guide' || target.kind === 'theories') {
    if (q.isEraId(target.eraId)) {
      if (target.kind === 'guide') a.openTrackGuide(as(target.eraId));
      else a.openTheoryGuide(as(target.eraId));
      return true;
    }
  } else if (target.kind === 'lens') {
    a.openThread(as(target.id));
    return true;
  } else if (target.kind === 'mode') {
    a.setMode(as(target.mode));
    return true;
  } else {
    a.setEra(as(target.id));
    return true;
  }
  a.goHome();
  return false;
}
