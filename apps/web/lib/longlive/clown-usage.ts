/**
 * Clownbot (build B) — the daily compose cap.
 *
 * PLAN.md Step 7: reuses `MoodUsage` (mood-usage.ts) rather than forking a
 * second copy of the same reservoir class — one gate class, the same UTC-day
 * rollover, the same honest per-warm-instance limitation (resets on cold
 * start; the real spend ceiling is the Console-level API cap, this is defense
 * in depth). See mood-usage.ts's header for the full rationale; this file
 * only adds Clownbot's own cap number and its own singleton.
 *
 * CAP IS PENDING WYATT'S SIGN-OFF (PLAN.md § Rulings — Wyatt: "the cap
 * numbers (spec proposes 200 composes/day/instance)"). 200 is the spec's
 * proposed number, kept as a single named constant so ratifying — or
 * changing — it is a one-line diff.
 */

import { MoodUsage as ClownUsage } from './mood-usage';

/** Composes/day per warm instance. PENDING Wyatt's ratification — see header. */
export const CLOWN_DAILY_CAP = 200;

export { ClownUsage };

/** Process-wide singleton, shared by every request a warm instance serves. */
export const clownUsage = new ClownUsage(CLOWN_DAILY_CAP);
