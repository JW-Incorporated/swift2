/**
 * Clownbot — the daily-call cap. Same discipline and the same honest
 * limitations as mood-usage.ts: one gate owns every LLM call's budget, and
 * nothing spends without reserve() returning true.
 *
 * PER WARM SERVERLESS INSTANCE, resets on cold start — this bounds runaway
 * spend on a warm instance, it is not a globally exact quota. The real ceiling
 * is the Console-level API spend cap; this is defense in depth. If exactness is
 * ever needed, back reserve() with a shared counter (Upstash/Postgres) — the
 * seam is this class and nothing else changes.
 *
 * Cap chosen against the cost model in the PR: at ~$0.004 per turn on
 * claude-haiku-4-5, 300 turns/day/instance is a ceiling of roughly $1.20/day
 * per warm instance. Over the cap the route degrades to the free deterministic
 * receipts answer rather than failing.
 */

export const CLOWNBOT_DAILY_CAP = 300;

function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export class ClownbotUsage {
  private day: string;
  private count = 0;

  constructor(
    private readonly cap: number = CLOWNBOT_DAILY_CAP,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.day = dayKey(this.now());
  }

  /**
   * Reserve budget for one call. False means the caller MUST fall back to the
   * deterministic path — never spend anyway. Rolls at the UTC day boundary.
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

  /** Calls reserved in the current window — observability only. */
  used(): number {
    if (dayKey(this.now()) !== this.day) return 0;
    return this.count;
  }
}

/** Process-wide singleton, shared by every request a warm instance serves. */
export const clownbotUsage = new ClownbotUsage();
