import type { ContentItem, EraId, LensId } from './types';

/**
 * `lenses.ts`'s `threadPoints('the-proposal')` case derives its points from
 * tagged content (`contentForThread` in `apps/web/lib/longlive/threads.ts`),
 * which itself reads the full content corpus (`content.ts` → the generated
 * Vault) — content-loading is OS-013/OS-014 scope, not this card's. Rather
 * than importing the app-layer module directly (which would give
 * `packages/experience` a dependency on `apps/web`, the exact layering
 * violation the purity guard exists to catch — see eslint.config.mjs), the
 * dependency is injected: the app wires its real `contentForThread` in once
 * at startup via `setThreadContentProvider`, and this package only ever
 * calls the injected function.
 *
 * Defaults to returning nothing so a renderer that never wires a provider
 * (e.g. an early mobile screen, or a unit test) degrades to "no proposal
 * points" instead of crashing.
 */
export type ThreadContentProvider = (threadId: LensId) => Pick<ContentItem, 'date' | 'eraId' | 'title'>[];

let provider: ThreadContentProvider = () => [];

export function setThreadContentProvider(fn: ThreadContentProvider): void {
  provider = fn;
}

export function contentForThreadInjected(threadId: LensId): Pick<ContentItem, 'date' | 'eraId' | 'title'>[] {
  return provider(threadId);
}

// Re-exported so call sites that only need the EraId type alongside this
// provider don't need a second import line.
export type { EraId };
