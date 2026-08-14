// Guards `docs/agents/fleet-schedule.md` — the DESIRED STATE of the scheduled
// cloud fleet, and the one file a non-founder may edit to retime a bot.
//
// WHY THIS EXISTS. The scheduled routines run on Wyatt's Anthropic account so
// their spend lands there. Editing a live routine therefore requires his
// account, which makes every cadence change a founder errand. `fleet-schedule.md`
// inverts that: the repo file is the desired state, and one routine (the Fleet
// Reconciler, `docs/agents/runner-prompts/fleet-reconcile.md`) reconciles the
// live fleet to it. Joey edits a table; nobody hands over an account.
//
// That routine is the SECOND to carry the `Claude_Code_Remote` connector — the
// ability to write triggers (see `docs/agents/routine-invariants.md`, invariant
// 2). Its blast radius is exactly this file, so this file has to be right. Every
// rule below exists to make a bad edit fail in CI, at the pull request, rather
// than at 3am inside a runner that is holding a live trigger's whole config.
//
// WHAT IT REJECTS
//   • a malformed cron, or one that fires more often than hourly
//   • unknown / renamed / reordered columns — a field nothing enforces
//   • duplicate trigger ids, or duplicate routine names
//   • an entry for a FORBIDDEN trigger: the Routine Auditor or the reconciler
//     itself. Those two are the control plane; see FORBIDDEN below
//   • a trigger id that is not registered in `runners.md` (an unregistered
//     routine has no prompt file, so nothing describes what it does)
//   • an enabled count above the invariant-4 ceiling of 35
//   • a run-frequency budget blowout, per entry and fleet-wide (the knob a
//     cost mistake would actually turn — invariant 4 counts routines, not runs)
//   • a cadence that contradicts a launch-readiness gate's cadence claim
//
// WHAT IT DELIBERATELY DOES NOT DO. It cannot see the live fleet — it has no
// account access, by design. So it cannot tell you that a listed trigger id has
// been deleted, or that an unlisted routine is burning tokens. That is the
// Routine Auditor's job, and the reconciler's own "refuse and report" rule.
//
// Exports the pure pieces for scripts/check-fleet-schedule.test.ts.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/generated-content.mjs';
// One markdown-table dialect, one parser. These are the same helpers
// `check-launch-gates.mjs` uses to read the launch scoreboard, and this check
// compares the two documents cell-for-cell — so they must parse identically.
import { cronOf, extractBlock, parseTable } from './check-launch-gates.mjs';

export const SCHEDULE_FILE = 'docs/agents/fleet-schedule.md';
export const REGISTRY_FILE = 'docs/agents/runners.md';
export const GATES_FILE = 'docs/launch-readiness.md';

/** The table's columns, exactly. Order is part of the contract. */
export const COLUMNS = ['Routine', 'Trigger id', 'Cron (UTC)', 'Enabled', 'Why this cadence'];

/** Modes the reconciler understands. `report-only` is the kill switch. */
export const MODES = ['report-only', 'apply'];

/** Live trigger ids look like `trig_018V66TnhXVAt8BLt5AZZuUa`. */
export const TRIGGER_ID = /^trig_[0-9A-Za-z]{20,40}$/;

/**
 * THE CONTROL PLANE — triggers that may NEVER appear in the schedule file,
 * keyed by id with the reason.
 *
 * This lives in code rather than in the schedule file for the same reason
 * `NEVER_ALLOWLIST` does in check-automerge-allowlist.mjs: a bar that the
 * governed file can lift is not a bar. `scripts/` also sits inside that
 * allowlist's own never-auto-merge set, so changing this map always costs a
 * reviewed, human-merged PR.
 *
 * @type {Record<string, string>}
 */
export const FORBIDDEN = {
  trig_018V66TnhXVAt8BLt5AZZuUa:
    'The Routine Auditor. It is the ONLY detection layer that exists for rogue routines (docs/agents/routine-invariants.md) — the repo cannot see that failure class at all. Retiming or disabling it would blind the fleet silently, which is precisely how the 2026-07-25 runaway loops burned ~144 sessions/day leaving no trace.',
  // The reconciler's own trigger id goes here the moment a founder creates it.
  // Until then the name bar below is what stops it being listed. Keeping the
  // placeholder visible is deliberate: an empty line here is a TODO, a missing
  // line is a hole nobody remembers.
  // trig_<fleet-reconciler>: 'The reconciler itself. A routine that can retime or disable itself is bounded by nothing.',
};

/**
 * A second net under FORBIDDEN, matched on the human name. The reconciler's
 * live id does not exist yet (a founder creates the routine from the prompt
 * file), so an id-only bar cannot cover it today. A name bar can, and it also
 * catches the case where a control-plane routine is re-created with a fresh id.
 *
 * @type {{pattern: RegExp, reason: string}[]}
 */
export const FORBIDDEN_NAMES = [
  {
    pattern: /routine\s*auditor/i,
    reason: 'the Routine Auditor is the fleet\'s only detection layer',
  },
  {
    pattern: /fleet\s*reconcil/i,
    reason: 'the reconciler may never manage itself — it could disable its own supervision or retime itself into a loop',
  },
];

/** Invariant 4 (routine-invariants.md): total enabled triggers ≤ 35. */
export const ENABLED_CEILING = 35;

/**
 * Frequency ceilings. Invariant 4 counts ROUTINES, not RUNS — so it is blind to
 * the mistake this file makes newly possible: leaving the count alone and
 * turning a daily Opus content runner hourly. These two numbers close that.
 *
 * MAX_RUNS_PER_DAY_PER_ENTRY = 12 (at most every 2 hours). Nothing in the fleet
 * runs more than twice a day today, so 12 is 6× the busiest live routine and
 * still forbids the hourly-loop shape that caused the 2026-07-25 incident.
 *
 * FLEET_DAILY_RUNS = 24 across every enabled entry here. Today's table totals
 * ~6/day; the whole Swift2 side was ~15/day at its post-audit floor. 24 leaves
 * real headroom while making "one always-on hourly routine" cost the entire
 * budget — which is the correct price for that shape.
 *
 * Raising either is a code change a human reviews. That is the point.
 */
export const MAX_RUNS_PER_DAY_PER_ENTRY = 12;
export const FLEET_DAILY_RUNS = 24;

/** Field ranges, in cron order. */
const FIELD_RANGE = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day-of-month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day-of-week', min: 0, max: 6 },
];

/**
 * Expand one cron field into the set of values it matches.
 * Supports every-value, literals, ranges, comma lists, and step syntax.
 * Returns null when the term is not one of those shapes — names (`MON`, `JAN`),
 * `?`, `L`, `#` and friends are refused rather than guessed at.
 *
 * @param {string} field
 * @param {{min: number, max: number}} range
 * @returns {number[] | null}
 */
export function expandField(field, range) {
  const out = new Set();
  for (const term of field.split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(term);
    if (!m) return null;
    const [, spec, stepRaw] = m;
    const step = stepRaw === undefined ? 1 : Number(stepRaw);
    if (step < 1) return null;
    let lo;
    let hi;
    if (spec === '*') {
      lo = range.min;
      hi = range.max;
    } else if (spec.includes('-')) {
      [lo, hi] = spec.split('-').map(Number);
    } else {
      lo = Number(spec);
      hi = stepRaw === undefined ? lo : range.max; // `5/2` means 5,7,9…
    }
    if (lo < range.min || hi > range.max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Validate a 5-field cron. Returns `{ fields }` on success or `{ error }`.
 *
 * THE FLOOR: the minute field must be a single literal number. A bare star,
 * a step, a list or a range is refused there, so an every-minute cron
 * (1440 runs/day) and an every-5-minutes cron cannot be written at all. Sub-hourly is not expressible in the
 * cloud scheduler anyway (`runners.md`: "Cron floor is 1 hour"), so this costs
 * nothing real and removes the single most expensive typo available.
 *
 * @param {string} cron
 * @returns {{fields?: number[][], error?: string}}
 */
export function validateCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { error: `\`${cron}\` has ${parts.length} field(s); a cron has 5 (minute hour day-of-month month day-of-week)` };
  }
  if (!/^\d{1,2}$/.test(parts[0]) || Number(parts[0]) > 59) {
    return {
      error:
        `\`${cron}\` — the minute (first) field must be a plain number 0-59, not \`${parts[0]}\`. ` +
        'This is the frequency floor: it makes "every minute" and "every N minutes" impossible to write, ' +
        'and the cloud scheduler cannot run sub-hourly regardless.',
    };
  }
  const fields = [];
  for (let i = 0; i < 5; i += 1) {
    const range = FIELD_RANGE[i];
    const values = expandField(parts[i], range);
    if (!values || values.length === 0) {
      return {
        error: `\`${cron}\` — the ${range.name} field \`${parts[i]}\` is not a valid ${range.min}-${range.max} value. Use numbers, \`*\`, \`a-b\`, \`*/n\` or a comma list; names like MON/JAN are not supported.`,
      };
    }
    fields.push(values);
  }
  return { fields };
}

/**
 * Expected runs per day for a valid cron.
 *
 * Day-of-month and day-of-week are OR-ed by cron when both are narrowed, so the
 * fraction of days matched is summed and clamped — deliberately the pessimistic
 * reading. A month is 30.44 days.
 *
 * @param {number[][]} fields output of validateCron
 * @returns {number}
 */
export function runsPerDay(fields) {
  const [minutes, hours, dom, , dow] = fields;
  const domNarrowed = dom.length < 31;
  const dowNarrowed = dow.length < 7;
  let dayFraction = 1;
  if (domNarrowed && dowNarrowed) dayFraction = Math.min(1, dom.length / 30.44 + dow.length / 7);
  else if (domNarrowed) dayFraction = dom.length / 30.44;
  else if (dowNarrowed) dayFraction = dow.length / 7;
  return minutes.length * hours.length * dayFraction;
}

/** `yes` → true, `no` → false, anything else → null (rejected). */
export function parseEnabled(cell) {
  const v = cell.trim().toLowerCase().replace(/`/g, '');
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

/** Strip backticks and whitespace from a trigger-id cell. */
export const triggerIdOf = (cell) => (cell ?? '').replace(/`/g, '').trim();

/** The declared mode, or null when the block is missing or unrecognised. */
export function parseMode(text) {
  const block = extractBlock(text, 'fleet:mode');
  if (block === null) return null;
  const m = /mode:\s*`?([a-z-]+)`?/i.exec(block);
  if (!m) return null;
  return m[1].toLowerCase();
}

/**
 * Parse the schedule table into rows. Returns `{ header, entries, problems }`;
 * `entries` holds only rows with the right cell count, so downstream rules can
 * assume shape.
 */
export function parseSchedule(text) {
  const problems = [];
  const block = extractBlock(text, 'fleet:schedule');
  if (block === null) {
    problems.push(
      `${SCHEDULE_FILE}: missing the <!-- fleet:schedule:start/end --> block — the reconciler reads that block and nothing else.`,
    );
    return { header: [], entries: [], problems };
  }
  const { header, rows } = parseTable(block);
  const entries = [];
  rows.forEach((cells, i) => {
    if (cells.length !== COLUMNS.length) {
      problems.push(
        `${SCHEDULE_FILE}: row ${i + 1} has ${cells.length} cell(s), expected ${COLUMNS.length} (${COLUMNS.join(' · ')}). A stray or missing \`|\` silently shifts every value one column left.`,
      );
      return;
    }
    const [name, idCell, cronCell, enabledCell, why] = cells;
    entries.push({
      row: i + 1,
      name,
      triggerId: triggerIdOf(idCell),
      cronCell,
      cron: cronOf(cronCell),
      enabledCell,
      enabled: parseEnabled(enabledCell),
      why,
    });
  });
  return { header, entries, problems };
}

/**
 * Cadence claims from `docs/launch-readiness.md`, keyed by trigger id.
 * Only rows whose "Runner that provides it" cell names a `trig_…` can be
 * matched — the others are gates backed by GitHub Actions, which this file
 * does not govern.
 *
 * @param {string} gatesText
 * @returns {Map<string, {gate: string, cron: string}>}
 */
export function gateCadences(gatesText) {
  const out = new Map();
  const block = extractBlock(gatesText, 'gates:cadence');
  if (block === null) return out;
  for (const row of parseTable(block).rows) {
    const [gate, , runner, registered] = row;
    const id = /trig_[0-9A-Za-z]+/.exec(runner ?? '')?.[0];
    const cron = cronOf(registered ?? '');
    if (id && cron) out.set(id, { gate, cron });
  }
  return out;
}

/**
 * The whole check, as a pure function over injected state so tests can drive it
 * without touching the repo.
 *
 * @param {object} input
 * @param {string} input.scheduleText  contents of docs/agents/fleet-schedule.md
 * @param {string} input.registryText  contents of docs/agents/runners.md
 * @param {string} input.gatesText     contents of docs/launch-readiness.md
 * @param {Record<string,string>} [input.forbidden]
 * @returns {{problems: string[], entries: object[], mode: string|null, totalRuns: number}}
 */
export function checkSchedule({ scheduleText, registryText, gatesText, forbidden = FORBIDDEN }) {
  const { header, entries, problems } = parseSchedule(scheduleText);

  // ── 0. The mode ────────────────────────────────────────────────────────
  const mode = parseMode(scheduleText);
  if (mode === null) {
    problems.push(
      `${SCHEDULE_FILE}: missing or unreadable <!-- fleet:mode --> block. It must contain a line like \`mode: report-only\`.`,
    );
  } else if (!MODES.includes(mode)) {
    problems.push(
      `${SCHEDULE_FILE}: mode \`${mode}\` is not one of ${MODES.join(' / ')}. \`report-only\` reports differences and changes nothing; \`apply\` makes the changes.`,
    );
  }

  // ── 1. Columns are exactly the contract ────────────────────────────────
  if (header.length && (header.length !== COLUMNS.length || header.some((h, i) => h !== COLUMNS[i]))) {
    problems.push(
      `${SCHEDULE_FILE}: the table header is [${header.join(' | ')}] but must be exactly [${COLUMNS.join(' | ')}]. ` +
        'An added or renamed column is a field nothing validates and the reconciler would ignore — which is worse than not having it.',
    );
  }

  const seenId = new Map();
  const seenName = new Map();
  let enabledCount = 0;
  let totalRuns = 0;
  const gates = gateCadences(gatesText);

  for (const e of entries) {
    const where = `${SCHEDULE_FILE}: row ${e.row} (${e.name || 'unnamed'})`;

    if (!e.name) problems.push(`${where}: needs a human-readable routine name.`);
    if (!e.why || e.why === '—' || e.why.length < 12) {
      problems.push(
        `${where}: the "Why this cadence" cell must say why, in a sentence. A cadence with no stated reason is one nobody can safely change later.`,
      );
    }

    // ── 2. Trigger id: shape, uniqueness, control plane, registration ────
    if (!TRIGGER_ID.test(e.triggerId)) {
      problems.push(
        `${where}: \`${e.triggerId}\` is not a trigger id. It must look like \`trig_018V66TnhXVAt8BLt5AZZuUa\` and be copied from the live routine — a made-up id points the reconciler at some other routine, or at nothing.`,
      );
    } else if (seenId.has(e.triggerId)) {
      problems.push(
        `${where}: trigger \`${e.triggerId}\` is already listed on row ${seenId.get(e.triggerId)}. Two rows for one routine means the reconciler has two contradictory desired states for it.`,
      );
    } else {
      seenId.set(e.triggerId, e.row);
    }

    if (Object.prototype.hasOwnProperty.call(forbidden, e.triggerId)) {
      problems.push(`${where}: \`${e.triggerId}\` may NEVER be listed here. ${forbidden[e.triggerId]}`);
    }
    for (const { pattern, reason } of FORBIDDEN_NAMES) {
      if (pattern.test(e.name)) {
        problems.push(
          `${where}: this is a control-plane routine and may never be listed — ${reason}. If the name is a coincidence, rename the row; the bar is deliberately name-based because the reconciler's own trigger id may not be recorded yet.`,
        );
      }
    }

    if (TRIGGER_ID.test(e.triggerId) && !registryText.includes(e.triggerId)) {
      problems.push(
        `${where}: \`${e.triggerId}\` does not appear in ${REGISTRY_FILE}. A routine you can retune must first be registered there with a prompt file — nine runners drifted precisely because their prompts lived only inside the trigger.`,
      );
    }

    if (seenName.has(e.name)) {
      problems.push(`${where}: the name "${e.name}" is already used on row ${seenName.get(e.name)}; names are how the change log reads.`);
    } else if (e.name) {
      seenName.set(e.name, e.row);
    }

    // ── 3. Enabled ───────────────────────────────────────────────────────
    if (e.enabled === null) {
      problems.push(
        `${where}: Enabled is "${e.enabledCell}" — it must be exactly \`yes\` or \`no\`. Anything else is a guess the reconciler would have to make about whether a bot should be running.`,
      );
    } else if (e.enabled) {
      enabledCount += 1;
    }

    // ── 4. Cron ──────────────────────────────────────────────────────────
    if (!e.cron) {
      problems.push(
        `${where}: the Cron cell reads "${e.cronCell}" — it must hold a backtick-quoted 5-field cron, written exactly like \`0 9 * * *\` (backticks included).`,
      );
      continue;
    }
    const { fields, error } = validateCron(e.cron);
    if (error) {
      problems.push(`${where}: ${error}`);
      continue;
    }
    const perDay = runsPerDay(fields);
    if (perDay > MAX_RUNS_PER_DAY_PER_ENTRY) {
      problems.push(
        `${where}: \`${e.cron}\` fires about ${perDay.toFixed(1)} times a day; the per-routine ceiling is ${MAX_RUNS_PER_DAY_PER_ENTRY} (at most every 2 hours). Every one of those is a full cold-boot session on Wyatt's account. If this is genuinely intended, raise MAX_RUNS_PER_DAY_PER_ENTRY in scripts/check-fleet-schedule.mjs in its own reviewed PR.`,
      );
    }
    if (e.enabled) totalRuns += perDay;

    // ── 5. Launch-gate coherence ─────────────────────────────────────────
    // A gate whose criterion claims a cadence cites the cron that provides it.
    // If this file changes that cron, the scoreboard is making a promise
    // nothing keeps — the exact failure that left "nightly safety scan clean"
    // in the daily brief for 17 days after Karen went weekly.
    const gate = gates.get(e.triggerId);
    if (gate && gate.cron !== e.cron) {
      problems.push(
        `${where}: launch gate ${gate.gate} in ${GATES_FILE} registers this routine's cadence as \`${gate.cron}\`, but this file says \`${e.cron}\`. Changing a cadence that backs a launch promise means the gate has to be re-scored in the same PR — update the "Registered cadence" cell (and the ⚠️ mark) in ${GATES_FILE}, or revert this cadence.`,
      );
    }
    if (gate && e.enabled === false) {
      problems.push(
        `${where}: launch gate ${gate.gate} depends on this routine running, but it is being disabled. Re-score that gate in ${GATES_FILE} in the same PR — a gate cannot stay green on a routine that is switched off.`,
      );
    }
  }

  // ── 6. Ceilings ────────────────────────────────────────────────────────
  if (enabledCount > ENABLED_CEILING) {
    problems.push(
      `${SCHEDULE_FILE}: ${enabledCount} entries are enabled, above the invariant-4 ceiling of ${ENABLED_CEILING} (docs/agents/routine-invariants.md). Note this counts only the routines listed here — the live fleet total can exceed the ceiling without this check seeing it, which is what the Routine Auditor is for.`,
    );
  }
  if (totalRuns > FLEET_DAILY_RUNS) {
    problems.push(
      `${SCHEDULE_FILE}: the enabled entries add up to about ${totalRuns.toFixed(1)} runs a day, above the ${FLEET_DAILY_RUNS}/day budget for this file. Invariant 4 caps how MANY routines exist, not how OFTEN they run — this is the ceiling that catches a cadence change that quietly multiplies spend. Cut a cadence, or raise FLEET_DAILY_RUNS in scripts/check-fleet-schedule.mjs in its own reviewed PR.`,
    );
  }
  if (entries.length === 0 && !problems.some((p) => p.includes('fleet:schedule:start'))) {
    problems.push(
      `${SCHEDULE_FILE}: the schedule table is empty. That is not a safe no-op to leave lying around — an empty table means the reconciler governs nothing while the file claims to be the control panel. Delete the routine instead, or keep at least one row.`,
    );
  }

  return { problems, entries, mode, totalRuns };
}

function main() {
  const read = (rel) => {
    const abs = join(ROOT, ...rel.split('/'));
    return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  };
  const scheduleText = read(SCHEDULE_FILE);
  if (scheduleText === null) {
    console.error(`✗ ${SCHEDULE_FILE} not found`);
    process.exit(1);
  }
  const registryText = read(REGISTRY_FILE) ?? '';
  const gatesText = read(GATES_FILE) ?? '';

  const { problems, entries, mode, totalRuns } = checkSchedule({
    scheduleText,
    registryText,
    gatesText,
  });

  const enabled = entries.filter((e) => e.enabled).length;
  console.log(
    `fleet schedule: ${entries.length} routine(s), ${enabled} enabled, ~${totalRuns.toFixed(1)} run(s)/day ` +
      `(budget ${FLEET_DAILY_RUNS}); mode=${mode ?? '?'}; ${Object.keys(FORBIDDEN).length} control-plane trigger(s) barred.`,
  );

  if (problems.length) {
    console.error(`\n✗ ${problems.length} fleet-schedule problem(s):\n`);
    for (const p of problems) console.error(`  • ${p}`);
    console.error(
      `\n${SCHEDULE_FILE} is the desired state of routines running on a founder's\n` +
        'account. A bad edit here would be applied by a routine that holds live triggers —\n' +
        'so it fails HERE, at the pull request, instead. Read the file header before editing.\n',
    );
    process.exit(1);
  }
  console.log('✓ fleet schedule is well-formed, within budget, and clear of the control plane');
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/check-fleet-schedule.mjs')) {
  main();
}
