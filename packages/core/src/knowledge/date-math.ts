// Deterministic date-math helper (proposal §7's `dateMath()`, PLAN.md
// Stage 9) — resolves the small set of relative-date phrases the retrieval
// layer needs (e.g. `recent(days)`'s cutoff). No existing spec for this in
// docs/content-ops/** — kept intentionally small per PLAN.md's Stage 9 note:
// today/yesterday/last N days/this week, nothing more. Pure, no I/O, no
// timezone lookups — always UTC calendar days off the injected `now`.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface DateMath {
  /** Today's date, ISO (YYYY-MM-DD). */
  today(): string;
  /** Yesterday's date, ISO (YYYY-MM-DD). */
  yesterday(): string;
  /** `n` days before today, ISO (YYYY-MM-DD). `daysAgo(0)` === `today()`. */
  daysAgo(n: number): string;
  /** Monday of the current (UTC) week, ISO (YYYY-MM-DD). */
  thisWeekStart(): string;
  /**
   * Resolves a small fixed, case-insensitive vocabulary of relative-date
   * phrases to an ISO date: `'today'`, `'yesterday'`, `'this week'` (->
   * `thisWeekStart()`), `'last N days'` / `'past N days'` (-> `daysAgo(n)`).
   * Unrecognized input returns `null` rather than guessing.
   */
  resolve(phrase: string): string | null;
}

/** `now` defaults to `new Date()`; pass a fixed value for deterministic tests. */
export function dateMath(now: Date = new Date()): DateMath {
  const today = () => toIsoDate(now);
  const daysAgo = (n: number) => toIsoDate(new Date(now.getTime() - n * ONE_DAY_MS));
  const yesterday = () => daysAgo(1);
  const thisWeekStart = () => {
    const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const sinceMonday = (day + 6) % 7;
    return daysAgo(sinceMonday);
  };
  const resolve = (phrase: string): string | null => {
    const p = phrase.trim().toLowerCase();
    if (p === 'today') return today();
    if (p === 'yesterday') return yesterday();
    if (p === 'this week') return thisWeekStart();
    const match = /^(?:last|past) (\d+) days?$/.exec(p);
    if (match) return daysAgo(Number(match[1]));
    return null;
  };
  return { today, yesterday, daysAgo, thisWeekStart, resolve };
}
