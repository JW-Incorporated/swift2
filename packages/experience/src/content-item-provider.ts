import type { ContentItem } from './types';

/**
 * `track-guide.ts`'s dossier-connection resolver needs to look up a single
 * `moment:<id>` content item by id — the app's full content corpus
 * (`apps/web/lib/longlive/content.ts`, itself built from generated Vault
 * data). Same layering fix as `song-catalogue-provider.ts` /
 * `track-catalogue-provider.ts`: the app wires its real `getContentItem` in
 * once via `setContentItemLookup`, and this package only ever calls the
 * injected function.
 *
 * Defaults to always returning undefined so an unwired renderer degrades to
 * "no moment found" (the existing silent-skip contract for a dead link)
 * rather than crashing.
 */
export type ContentItemLookup = (id: string) => ContentItem | undefined;

let lookup: ContentItemLookup = () => undefined;

export function setContentItemLookup(fn: ContentItemLookup): void {
  lookup = fn;
}

export function contentItemLookup(id: string): ContentItem | undefined {
  return lookup(id);
}
