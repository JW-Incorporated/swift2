// "How many days until done?" — computed, never guessed.
//
// THE RULE THIS FILE ENFORCES: a confidently wrong ETA is worse than no ETA.
// Every number below is derived from the gate-point series in
// `gate-history.mjs` (which is derived from git history of
// docs/launch-readiness.md), and every number ships with the evidence that
// produced it and an explicit confidence grade. Nothing here is an LLM's
// opinion; `assemble-brief.mjs` prints what this returns verbatim.
//
// The method, in full:
//
//   1. REMAINING WORK is measured in gate-points (🔴 0 · 🟡 0.5 · 🟢 1.0),
//      12.0 == launched. See gate-history.mjs for why partial credit.
//
//   2. VELOCITY is measured over three trailing windows (14 / 28 / 56 days),
//      not one. Three windows disagreeing IS the uncertainty — we report the
//      spread rather than inventing an error bar. A window that reaches back
//      further than the file's own history is clamped to the history and
//      flagged, so the earliest days don't get counted as zero-progress days.
//
//   3. IDLE GATES ARE EXCLUDED FROM THE TRAJECTORY. This is the correction
//      that matters. Velocity earned on gates that have owners says nothing
//      about gates nobody is touching; spreading it across them produces
//      exactly the kind of number the founders were right not to trust. So
//      idle points are reported by name as "not on any trajectory", never
//      averaged in.
//
//      "Idle" is decided by `gate-activity.mjs`, NOT by the tracker file
//      alone. A tracker row can be a month old while the gate's tickets have
//      an open PR against them today — that is a stale tracker, not stalled
//      work, and reporting it as "unstaffed" is how the 2026-08-11 brief told
//      the founders LEGAL and BACKUPS had nobody on them on the very morning
//      PRs #1889 and #1890 were opened to close them.
//
//   4. CONFIDENCE is graded from sample size and window spread, and is HARD
//      CAPPED AT 'low' whenever any gate is idle. When confidence is low the
//      point estimate is suppressed and only a week band is printed. And when
//      idle points are at least half of what remains, NO estimate is given at
//      all — "most of what's left isn't moving" is the true answer, and
//      dividing the surviving sliver by a velocity would dress it up as
//      progress.

import { GATES, TOTAL_POINTS, STATUS_POINTS, lastChangeByGate } from './gate-history.mjs';
import { classifyStall } from './gate-activity.mjs';

const DAY_MS = 86_400_000;

export const DEFAULT_WINDOWS = [14, 28, 56];

/** A gate untouched for this long is stalled, not slow. */
export const STALL_DAYS = 21;

const days = (ms) => ms / DAY_MS;

/** Points at a moment in time: the last snapshot at or before `atMs`. */
export function pointsAt(series, atMs) {
  let found = null;
  for (const snap of series) {
    if (new Date(snap.iso).getTime() <= atMs) found = snap;
    else break;
  }
  return found ? { points: found.points, iso: found.iso } : null;
}

/**
 * Count status transitions inside a window. This — not the number of green
 * gates — is the estimator's sample size.
 */
export function transitionsIn(series, fromMs, toMs) {
  let n = 0;
  let prev = null;
  for (const snap of series) {
    const t = new Date(snap.iso).getTime();
    if (prev) {
      for (const g of GATES) {
        const a = prev.gates[g]?.status;
        const b = snap.gates[g]?.status;
        if (a && b && a !== b && t > fromMs && t <= toMs) n += 1;
      }
    }
    prev = snap;
  }
  return n;
}

/**
 * Velocity over one trailing window, in gate-points per day.
 *
 * `clamped` is true when the window reaches back before the series begins —
 * the rate is then computed over the observed span only. Without this, a
 * 56-day window on a 31-day-old file reports a rate ~45% too low and the ETA
 * ~80% too high, purely because the org did not exist yet.
 */
export function velocityOverWindow(series, windowDays, nowMs) {
  if (series.length === 0) return null;
  const firstMs = new Date(series[0].iso).getTime();
  const wantFrom = nowMs - windowDays * DAY_MS;
  const fromMs = Math.max(wantFrom, firstMs);
  const spanDays = days(nowMs - fromMs);
  if (spanDays <= 0) return null;

  const start = pointsAt(series, fromMs) ?? { points: series[0].points, iso: series[0].iso };
  const end = series.at(-1);
  const deltaPoints = end.points - start.points;
  return {
    windowDays,
    spanDays: Number(spanDays.toFixed(2)),
    clamped: wantFrom < firstMs,
    fromIso: new Date(fromMs).toISOString(),
    startPoints: start.points,
    endPoints: end.points,
    deltaPoints: Number(deltaPoints.toFixed(2)),
    ratePerDay: Number((deltaPoints / spanDays).toFixed(4)),
    transitions: transitionsIn(series, fromMs, nowMs),
  };
}

/**
 * Gates whose TRACKER ROW has not changed in `stallDays` and which are not
 * already green, each classified against real ticket/PR activity.
 *
 * `kind` is what the caller acts on:
 *   'idle'          — nothing moving anywhere. Excluded from the trajectory.
 *   'tracker-stale' — tickets/PRs are live; only the bookkeeping is behind.
 *                     Counted as moving, but reported as a process failure.
 *   'unknown'       — the row names no ticket, so nothing can be verified.
 *                     Treated as idle (conservative) and labelled as such.
 */
export function stalledGates(series, currentGates, nowMs, stallDays = STALL_DAYS, activity = null) {
  const changes = lastChangeByGate(series);
  const out = [];
  for (const gate of GATES) {
    const status = currentGates[gate]?.status;
    if (!status || status === 'green') continue;
    const changed = changes[gate]?.iso ? new Date(changes[gate].iso).getTime() : null;
    const idleDays = changed === null ? null : Math.floor(days(nowMs - changed));
    if (idleDays !== null && idleDays < stallDays) continue;
    const verdict = activity
      ? classifyStall(gate, activity, nowMs, stallDays)
      : { kind: 'unknown', reason: 'no activity data fetched' };
    out.push({
      gate,
      status,
      idleDays,
      kind: verdict.kind,
      reason: verdict.reason,
      prs: verdict.prs ?? [],
      pointsMissing: Number((1 - (STATUS_POINTS[status] ?? 0)).toFixed(2)),
      nextAction: currentGates[gate]?.nextAction ?? '',
    });
  }
  return out.sort((a, b) => (b.idleDays ?? 0) - (a.idleDays ?? 0));
}

function grade({ transitions, spread, idlePoints }) {
  const reasons = [];
  let level;
  if (transitions < 2) {
    level = 'none';
    reasons.push(`only ${transitions} gate status change(s) observed — too few to fit a rate`);
  } else if (transitions < 4 || spread === null || spread > 3) {
    level = 'low';
    if (transitions < 4) reasons.push(`${transitions} status changes observed (want ≥4)`);
    if (spread !== null && spread > 3) reasons.push(`window rates disagree ${spread.toFixed(1)}× (want ≤3×)`);
    if (spread === null) reasons.push('at least one trailing window shows zero progress');
  } else if (transitions >= 8 && spread <= 2 && idlePoints === 0) {
    level = 'high';
    reasons.push(`${transitions} status changes, window rates within ${spread.toFixed(1)}×, nothing idle`);
  } else {
    level = 'medium';
    reasons.push(`${transitions} status changes, window rates within ${spread.toFixed(1)}×`);
  }
  // The hard cap. Velocity earned on moving gates says nothing about gates
  // nobody is touching, so any idle gate knocks the grade down to 'low'.
  if (idlePoints > 0 && (level === 'medium' || level === 'high')) {
    level = 'low';
    reasons.push(`${idlePoints} of the remaining points sit on gates with no activity — extrapolation does not cover them`);
  }
  return { level, reasons };
}

/** Round to a week band so a low-confidence number never reads as precise. */
export function weekBand(loDays, hiDays) {
  if (loDays === null || hiDays === null) return null;
  const lo = Math.max(1, Math.floor(loDays / 7));
  const hi = Math.max(lo, Math.ceil(hiDays / 7));
  return lo === hi ? `${lo} week${lo === 1 ? '' : 's'}` : `${lo}–${hi} weeks`;
}

/**
 * The estimate. Pure — give it a series and a clock, get the same answer.
 *
 * Returned shape is deliberately verbose: the brief prints a two-line summary
 * but the journal comment prints the whole object, so a founder who doubts the
 * number can see every input that produced it.
 */
export function estimateDaysToDone(series, currentGates, { now = Date.now(), windows = DEFAULT_WINDOWS, stallDays = STALL_DAYS, activity = null } = {}) {
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const counts = {
    green: GATES.filter((g) => currentGates[g]?.status === 'green').length,
    yellow: GATES.filter((g) => currentGates[g]?.status === 'yellow').length,
    red: GATES.filter((g) => currentGates[g]?.status === 'red').length,
  };
  const donePoints = GATES.reduce((s, g) => s + (STATUS_POINTS[currentGates[g]?.status] ?? 0), 0);
  const remaining = Number((TOTAL_POINTS - donePoints).toFixed(2));

  const stalled = stalledGates(series, currentGates, nowMs, stallDays, activity);
  const idle = stalled.filter((g) => g.kind === 'idle' || g.kind === 'unknown');
  const trackerStale = stalled.filter((g) => g.kind === 'tracker-stale');
  const idlePoints = Number(idle.reduce((s, g) => s + g.pointsMissing, 0).toFixed(2));
  const trackerStalePoints = Number(trackerStale.reduce((s, g) => s + g.pointsMissing, 0).toFixed(2));
  const movingRemaining = Number((remaining - idlePoints).toFixed(2));

  const measured = windows.map((w) => velocityOverWindow(series, w, nowMs)).filter(Boolean);
  const positive = measured.filter((m) => m.ratePerDay > 0);

  const etaFor = (points, rate) => (rate > 0 ? Math.ceil(points / rate) : null);
  const rates = positive.map((m) => m.ratePerDay);
  const fastest = rates.length ? Math.max(...rates) : 0;
  const slowest = rates.length ? Math.min(...rates) : 0;
  const spread = rates.length >= 2 && slowest > 0 ? fastest / slowest : null;

  // The headline basis is the middle window (28d by default) when it shows
  // progress, else the longest window that does. Never the fastest — picking
  // the flattering window is how vibes get laundered into a number.
  const basis = positive.find((m) => m.windowDays === windows[Math.floor(windows.length / 2)])
    ?? positive.at(-1)
    ?? null;

  const transitions = measured.length ? Math.max(...measured.map((m) => m.transitions)) : 0;
  const confidence = grade({ transitions, spread, idlePoints });

  const allLo = etaFor(remaining, fastest);
  const allHi = etaFor(remaining, slowest);
  const movingLo = etaFor(movingRemaining, fastest);
  const movingHi = etaFor(movingRemaining, slowest);

  // When most of what remains is idle, an ETA for the surviving sliver is
  // technically true and practically a lie. Refuse it.
  const idleDominates = remaining > 0 && idlePoints >= remaining / 2;

  return {
    asOf: new Date(nowMs).toISOString(),
    totalPoints: TOTAL_POINTS,
    donePoints: Number(donePoints.toFixed(2)),
    remainingPoints: remaining,
    counts,
    seriesSpanDays: series.length ? Math.round(days(nowMs - new Date(series[0].iso).getTime())) : 0,
    seriesSnapshots: series.length,
    windows: measured,
    transitions,
    spread: spread === null ? null : Number(spread.toFixed(2)),
    stalled,
    idle,
    trackerStale,
    idlePoints,
    trackerStalePoints,
    idleDominates,
    movingRemainingPoints: movingRemaining,
    // Everything, including the gates nobody is working on.
    all: { etaDays: basis ? etaFor(remaining, basis.ratePerDay) : null, lowDays: allLo, highDays: allHi, band: weekBand(allLo, allHi) },
    // Only the work with demonstrable activity behind it.
    moving: { etaDays: basis ? etaFor(movingRemaining, basis.ratePerDay) : null, lowDays: movingLo, highDays: movingHi, band: weekBand(movingLo, movingHi) },
    basisWindowDays: basis?.windowDays ?? null,
    basisRatePerDay: basis?.ratePerDay ?? null,
    confidence: confidence.level,
    confidenceReasons: confidence.reasons,
  };
}

function idleList(est) {
  return est.idle.map((s) => `**${s.gate}** (${s.idleDays}d, ${s.reason})`).join(' · ');
}

/**
 * The two or three lines the brief prints. Suppresses the point estimate
 * whenever confidence is not at least 'medium', and suppresses the estimate
 * entirely when idle work dominates what remains.
 */
export function renderDoneLines(est) {
  const pct = Math.round((est.donePoints / est.totalPoints) * 100);
  const head = `**${est.donePoints.toFixed(1)} / ${est.totalPoints} gate-points done (${pct}%)** — ${est.counts.green} green · ${est.counts.yellow} moving · ${est.counts.red} not started.`;
  const lines = [head];

  if (est.remainingPoints === 0) {
    lines.push('**Time to done: done.** Every gate is green — this is the go/no-go.');
    return lines;
  }

  if (est.confidence === 'none' || !est.moving.band) {
    lines.push(`**Time to done: no defensible estimate.** ${est.confidenceReasons[0]}. No number is being claimed.`);
    return lines;
  }

  if (est.idleDominates) {
    lines.push(
      `**Time to done: not on a trajectory.** ${est.idlePoints} of the ${est.remainingPoints} remaining points have no activity at all, ` +
      `so there is no rate to extrapolate. Idle: ${idleList(est)}.`,
    );
    lines.push(
      `If they were staffed today, the last ${est.basisWindowDays} days' rate (${est.basisRatePerDay} pts/day) would put done at **${est.all.band}** — that is a floor, not a forecast.`,
    );
    return lines;
  }

  const precise = est.confidence === 'medium' || est.confidence === 'high';
  const clause = precise
    ? `~${est.moving.etaDays} days (range ${est.moving.lowDays}–${est.moving.highDays})`
    : est.moving.band;
  lines.push(
    `**Time to done: ${clause}** for the ${est.movingRemainingPoints} points with activity behind them, ` +
    `at ${est.basisRatePerDay} pts/day over the last ${est.basisWindowDays} days. ` +
    `Confidence **${est.confidence}** — ${est.confidenceReasons.join('; ')}.`,
  );
  if (est.idlePoints > 0) {
    lines.push(`⚠ **${est.idlePoints} more points are outside that estimate**: ${idleList(est)}. Until staffed, the honest answer for those is "unbounded".`);
  }
  return lines;
}
