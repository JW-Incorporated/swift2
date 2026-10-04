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
  closeItem(): void;
  closeTrackGuide(): void;
  closeTheoryGuide(): void;
  setSearchOpen(open: boolean): void;
  setSelectorOpen(open: boolean): void;
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

const isBare = (search: string) => new URLSearchParams(search).size === 0;

/**
 * True when the search named a target the reader honoured (state changed). A target that does not resolve returns
 * false and touches NOTHING (the tap stays queued / native handles it); a bare `/` is an explicit home. A valid
 * target first normalizes incompatible live state (moment, guides, search, selector) so it is never hidden behind it.
 */
export function applyDeepLink(search: string, q: DeepLinkQueries, a: DeepLinkActions): boolean {
  const target = deepLinkTarget(search, q.threadIds);
  let act: (() => void) | null = null;
  if (!target) {
    if (isBare(search)) act = () => a.goHome();
  } else if (target.kind === 'item') {
    const id = q.contentItemId(target.id);
    const eraId = id ? null : resolveVideoDeepLink(target.id, new URLSearchParams(search).get('era'), q.isEraId, q.eraHasVideoSlug, q.findEraForVideoSlug);
    if (id) act = () => a.openItem(id);
    else if (eraId) act = () => a.openVideo(as(eraId), target.id);
  } else if (target.kind === 'song') {
    const eraId = q.eraOfTrackKey(target.key);
    if (eraId) act = () => a.openSong(as(eraId), target.key);
  } else if (target.kind === 'guide') {
    if (q.isEraId(target.eraId)) act = () => a.openTrackGuide(as(target.eraId));
  } else if (target.kind === 'theories') {
    if (q.isEraId(target.eraId)) act = () => a.openTheoryGuide(as(target.eraId));
  } else if (target.kind === 'lens') {
    act = () => a.openThread(as(target.id));
  } else if (target.kind === 'mode') {
    act = () => a.setMode(as(target.mode));
  } else if (q.isEraId(target.id)) {
    act = () => a.setEra(as(target.id));
  }
  if (!act) return false;
  a.closeItem();
  a.closeTrackGuide();
  a.closeTheoryGuide();
  a.setSearchOpen(false);
  a.setSelectorOpen(false);
  act();
  return true;
}
