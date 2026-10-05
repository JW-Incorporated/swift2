// Era-view trigger for the offline art cache (#5112): the reader's route event carries `snap.eraId`; once the content bundle
// is loaded and interactions settle, the cache fetches that era's primary images (third-party included), then the last
// MRU eras'. Pure over injected deps. Nothing runs before content is loaded; coalesces rapid era changes to the latest.
import { collectArtUrls, isThirdParty } from './art-cache-urls';
import type { ArtContext, ArtSyncResult } from './art-cache';

/** Base set (covers + first-party), per-era resolver and the placeholder-guard predicate for a loaded bundle. */
export function artContext(files: Record<string, unknown>, origin: string): ArtContext {
  return {
    base: collectArtUrls(files, origin),
    eraUrls: (eraId) => collectArtUrls(files, origin, { eraId, includeThirdParty: true }),
    strict: (url) => isThirdParty(url, origin),
  };
}

export interface EraSyncDeps {
  syncEra: (eraId: string, version: string, ctx: ArtContext) => Promise<ArtSyncResult | null>;
  origin: string;
  afterInteractions: (fn: () => void) => void;
  onResult?: (r: ArtSyncResult | null) => void;
}

export function createEraSync(deps: EraSyncDeps) {
  let content: { files: Record<string, unknown>; version: string } | null = null;
  let era: string | null = null;
  let synced: string | null = null;
  let scheduled = false;
  let running = false;

  const go = () => {
    scheduled = false;
    if (running || !content || !era || !(`content:${era}` in content.files)) return;
    const key = `${content.version}|${era}`;
    if (key === synced) return;
    running = true;
    synced = key;
    void deps
      .syncEra(era, content.version, artContext(content.files, deps.origin))
      .catch(() => null)
      .then((r) => {
        running = false;
        deps.onResult?.(r);
        trigger(); // the era may have changed while this ran
      });
  };

  function trigger() {
    if (scheduled || !content || !era) return;
    scheduled = true;
    try {
      deps.afterInteractions(go);
    } catch {
      scheduled = false;
    }
  }

  return {
    /** A content bundle loaded (the era sync needs its content files). */
    setContent(files: Record<string, unknown>, version: string) {
      content = { files, version };
    },
    /** The reader's current era (route event snapshot). Unknown ids (no `content:<id>` file) are ignored. */
    noteEra(eraId: string | null | undefined) {
      if (typeof eraId !== 'string' || !eraId) return;
      if (era === eraId) return;
      if (content && !(`content:${eraId}` in content.files)) return;
      era = eraId;
      trigger();
    },
    /** Re-evaluate (after the base sync finished, or when content arrived after the era was noted). */
    trigger,
  };
}
