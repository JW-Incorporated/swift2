// Per-process counters surfaced in index.ts's `news-worker: cycle complete`
// summary so a silent regression in Google News / image resolution shows up
// in the log instead of only as held rows (#6114, #6211).

export interface NewsRunStats {
  gnewsResolved: number;
  gnewsUnresolved: number;
  imageResolved: number;
  imageGnewsUnresolved: number;
  imageFetchFailed: number;
  imageNoOg: number;
  imageHostNotAllowlisted: number;
}

const ZERO: NewsRunStats = {
  gnewsResolved: 0,
  gnewsUnresolved: 0,
  imageResolved: 0,
  imageGnewsUnresolved: 0,
  imageFetchFailed: 0,
  imageNoOg: 0,
  imageHostNotAllowlisted: 0,
};

export const runStats: NewsRunStats = { ...ZERO };

export function resetRunStats(): void {
  Object.assign(runStats, ZERO);
}

/** Returns the warning text when most Google News resolutions failed, else null. */
export function gnewsResolutionWarning(stats: NewsRunStats): string | null {
  const attempted = stats.gnewsResolved + stats.gnewsUnresolved;
  if (attempted < 5 || stats.gnewsUnresolved / attempted <= 0.5) return null;
  return (
    `news-worker: ${stats.gnewsUnresolved}/${attempted} Google News article URLs could not be ` +
    'resolved to a publisher — stories without another source will be held for missing_image'
  );
}
