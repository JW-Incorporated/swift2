/**
 * Clownbot (build B) — the daily compose cap.
 *
 * PLAN.md Step 7: reuses `MoodUsage` (mood-usage.ts) rather than forking a
 * second copy of the same reservoir class — one gate class, the same UTC-day
 * rollover. See mood-usage.ts's header for the full "THE REAL GLOBAL GATE IS
 * THE DB" rationale (Fable 5.1 architecture review, task R13) — this file
 * only adds Clownbot's own cap number, its own `usage_daily` scope, and its
 * own singleton; `clown-agent.ts`'s `runClownAgent` reserves through
 * `usage-db-gate.ts`'s `reserveGlobalUsage` exactly the way
 * `mood-client.ts`'s `classifyMood` does.
 *
 * CAP IS PENDING WYATT'S SIGN-OFF (PLAN.md § Rulings — Wyatt: "the cap
 * numbers (spec proposes 200 composes/day/instance)"). 200 is the spec's
 * proposed number, kept as a single named constant so ratifying — or
 * changing — it is a one-line diff. Now enforced globally (across every
 * warm instance) rather than per-instance — see mood-usage.ts's header.
 */

import { MoodUsage as ClownUsage } from './mood-usage';

/** Composes/day, enforced globally via the DB gate — see header. PENDING
 * Wyatt's ratification. */
export const CLOWN_DAILY_CAP = 200;

/** `usage_daily` scope for the durable cross-instance gate — distinct from
 * Mood Chat's `mood-chat-global` (`mood-usage.ts`) and from the PER-USER
 * `clown-chat:<uid>` scope `clown-memory.ts`'s `incrementUserUsage` already
 * uses (that one bounds a single caller's own daily allowance; this one
 * bounds the whole feature's spend across every caller and every instance). */
export const CLOWN_GLOBAL_SCOPE = 'clown-chat-global';

export { ClownUsage };

/** Process-wide singleton, shared by every request a warm instance serves. */
export const clownUsage = new ClownUsage(CLOWN_DAILY_CAP);
