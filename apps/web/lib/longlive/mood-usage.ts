/**
 * Mood Chat — Stage 4: the daily-call cap.
 *
 * ONE gate owns every LLM call's budget — the classify client calls reserve()
 * before spending, and nothing spends without it (Orbit's claude_usage
 * discipline, ported; docs/decisions.md 2026-07-18 cost-cap entry). A public,
 * unbounded LLM endpoint is a billing incident waiting to happen; this bounds
 * it hard, and over the cap the route falls back to the free keyword matcher
 * and still returns real songs.
 *
 * THE REAL GLOBAL GATE IS THE DB (Fable 5.1 architecture review, task R13):
 * this in-process counter alone only ever bounded spend PER WARM SERVERLESS
 * INSTANCE — every warm instance got its own fresh `MOOD_DAILY_CAP`
 * allowance, so the real cross-instance ceiling was `cap * (warm instance
 * count)`, not `cap`, and reset on every cold start. `mood-client.ts`'s
 * `classifyMood` now reserves through `usage-db-gate.ts`'s
 * `reserveGlobalUsage`, which calls `reserve()` here FIRST as a free,
 * synchronous pre-check (still refuses immediately once this one instance's
 * own slice is spent, no network round trip needed), then confirms the
 * durable cross-instance `usage_daily` row (scope `mood-chat-global`,
 * shared with `clown-usage.ts`'s `clown-chat-global` table but never
 * colliding — the table's primary key is `(scope, usage_date)`) is still
 * under the SAME cap number before the call is actually allowed to spend.
 * A local reservation the DB then denies is given back via `release()`.
 * This class's own `reserve()`/`release()`/`used()` behaviour and every
 * existing test against it are unchanged — it is still exactly the
 * lightweight per-instance floor it always was; only what sits ON TOP of it
 * changed.
 */

/** Default calls/day, now enforced globally across every warm instance via
 * the DB gate above — see the header note. Sonnet-cheap and bounded — tune
 * as usage data lands (Stage 6). */
export const MOOD_DAILY_CAP = 200;

/** `usage_daily` scope for the durable cross-instance gate — see the
 * header's THE REAL GLOBAL GATE IS THE DB note. Distinct from any
 * per-user scope (this feature has none) and from Clownbot's own
 * `clown-chat-global` (`clown-usage.ts`). */
export const MOOD_GLOBAL_SCOPE = 'mood-chat-global';

/** UTC day key (YYYY-MM-DD) — the window this counter rolls over on. */
function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * A per-instance daily counter. `now` is injectable so tests drive the
 * roll-over deterministically without touching the clock.
 */
export class MoodUsage {
  private day: string;
  private count = 0;

  constructor(
    private readonly cap: number = MOOD_DAILY_CAP,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.day = dayKey(this.now());
  }

  /**
   * Reserve budget for one LLM call. Returns false once the day's cap is
   * reached — the caller MUST fall back to the keyword matcher, never spend
   * anyway. Rolls the window at the UTC day boundary.
   */
  reserve(): boolean {
    const today = dayKey(this.now());
    if (today !== this.day) {
      this.day = today;
      this.count = 0;
    }
    if (this.count >= this.cap) return false;
    this.count += 1;
    return true;
  }

  /** The day key the CURRENT reservation window belongs to — call this
   * immediately after a successful `reserve()` and hold onto the result, so
   * a later `release()` can name exactly which day's counter it means to
   * give a slot back to (HUMAN-ACTIONS.md #15 round 4, day-keyed release
   * fix — see `release()`'s own note). */
  reservedDay(): string {
    return this.day;
  }

  /** Give back one reserved slot — for a reservation that turns out to have
   * been wasted (e.g. Clownbot's per-user cap denies the request AFTER the
   * shared global slot was already taken; HUMAN-ACTIONS.md #15 item 4).
   * `day` is the caller's OWN reservation's day key (`reservedDay()`,
   * captured at reservation time), not "today" inferred at release time —
   * a reservation taken right before midnight and released right after,
   * once some OTHER caller's `reserve()` has already rolled this window
   * forward to the new day, must stay a no-op against the stale day rather
   * than decrementing the new day's live count (the bug this fixes: the
   * old `release()` inferred "today" via the clock at release time, which
   * could match the counter's already-rolled `this.day` and silently
   * decrement someone else's live reservation instead of leaving it alone).
   * A no-op when `day` no longer matches the counter's current window, and
   * never drops the count below 0. */
  release(day: string): void {
    if (day !== this.day) return;
    if (this.count > 0) this.count -= 1;
  }

  /** Calls reserved in the current window — for logging/observability only. */
  used(): number {
    // Reconcile the window first so a read after midnight reports 0, not stale.
    if (dayKey(this.now()) !== this.day) return 0;
    return this.count;
  }
}

/**
 * The process-wide singleton the route uses. Module scope means it is shared by
 * every request served by a warm instance (the whole point) and re-created on
 * cold start (the accepted limitation above).
 */
export const moodUsage = new MoodUsage();
