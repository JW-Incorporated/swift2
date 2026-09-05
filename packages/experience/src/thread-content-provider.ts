import type { ContentItem, EraId, LensId, EraSecret, TheoryNote, TrackNote } from './types';

/**
 * The single seam through which `packages/experience` reaches app-layer data
 * it cannot load itself — content-loading is OS-013/OS-014 scope, and the
 * generated Vault/theories/era-secrets/tracks data all still live under
 * `apps/web/lib/longlive/*.generated.ts` pending that migration. Importing
 * those modules directly from here would give `packages/experience` a
 * dependency on `apps/web`, the exact layering violation the purity guard
 * exists to catch (see eslint.config.mjs) — so instead each app wires its
 * real implementation in once at startup (`apps/web/lib/longlive/{threads,
 * theories,era-secrets}.ts`), and this package only ever calls the injected
 * function. Every provider defaults to an empty/no-op implementation so a
 * renderer that never wires one (an early mobile screen, or a unit test)
 * degrades gracefully instead of crashing.
 *
 * `lenses.ts`'s `threadPoints('the-proposal')` and `threads.ts`'s
 * `contentForThread` both derive their results from the full content corpus
 * via `contentForThreadInjected`. `theories.ts` and `era-secrets.ts` (moved
 * in from `apps/web/lib/longlive` in OS-023) read their generated datasets
 * via `theoriesRawInjected`/`eraSecretsRawInjected`, and cross-reference
 * songs/moments via `songTargetInjected`/`contentItemInjected`.
 */
export type ContentProvider = () => ContentItem[];

let contentProvider: ContentProvider = () => [];

export function setThreadContentProvider(fn: ContentProvider): void {
  contentProvider = fn;
}

export function contentForThreadInjected(): ContentItem[] {
  return contentProvider();
}

/** A `song:<slug>` RelatedId resolved to its era + track note, or null. */
export type SongTarget = { eraId: EraId; track: TrackNote };
export type SongTargetResolver = (relatedId: string) => SongTarget | null;

let songTargetResolver: SongTargetResolver = () => null;

export function setSongTargetResolver(fn: SongTargetResolver): void {
  songTargetResolver = fn;
}

export function songTargetInjected(relatedId: string): SongTarget | null {
  return songTargetResolver(relatedId);
}

export type TheoriesRawProvider = () => Partial<Record<EraId, TheoryNote[]>>;

let theoriesRawProvider: TheoriesRawProvider = () => ({});

export function setTheoriesRawProvider(fn: TheoriesRawProvider): void {
  theoriesRawProvider = fn;
}

export function theoriesRawInjected(): Partial<Record<EraId, TheoryNote[]>> {
  return theoriesRawProvider();
}

export type EraSecretsRawProvider = () => Partial<Record<EraId, EraSecret[]>>;

let eraSecretsRawProvider: EraSecretsRawProvider = () => ({});

export function setEraSecretsRawProvider(fn: EraSecretsRawProvider): void {
  eraSecretsRawProvider = fn;
}

export function eraSecretsRawInjected(): Partial<Record<EraId, EraSecret[]>> {
  return eraSecretsRawProvider();
}

/** Looks up a `ContentItem` by id from the injected content corpus. */
export function contentItemInjected(id: string): ContentItem | undefined {
  return contentProvider().find((c) => c.id === id);
}

// Re-exported so call sites that only need these types alongside a provider
// don't need a second import line.
export type { EraId, LensId };
