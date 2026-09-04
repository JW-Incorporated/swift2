// Guards `docs/launch-readiness.md` — the 12-gate launch scoreboard the
// founders read as "distance to launch".
//
// THE TWO BUGS THIS EXISTS FOR (both found in the 2026-08-11 audit):
//
//   1. A COST DECISION SILENTLY INVALIDATED A LAUNCH CRITERION. Gate SCAN's
//      criterion is "the content-safety scan actually runs every night". On
//      2026-07-25 a sustainment pass throttled Karen to weekly (`0 9 * * 0`).
//      The criterion became unsatisfiable that day. Nothing noticed for 17
//      days — the daily brief went on reporting "nightly safety scan clean".
//      Gate VOICE was worse: it was closed 🟢 partly BECAUSE "Karen's nightly
//      scan now enforces this permanently… caught the next night
//      automatically". That sentence stopped being true before the gate
//      closed, and voice findings duly reappeared on 2026-08-09 with nothing
//      to catch them.
//
//   2. GATES CITED DEAD TICKETS. PLUMBING's next action was #669 and
//      CAMPAIGN's was #736. Both closed 2026-07-30; both gates were further
//      along than scored; the brief kept printing them as the next step for
//      12 days. Same failure class as the brief re-asking for finished work.
//
// So the doc now carries two machine-readable tables, and this check keeps
// them honest:
//
//   • THE CADENCE RULE (offline, hard-fails in CI). A gate whose criterion
//     names a cadence must name the runner that provides it and where that
//     runner's cadence is registered. The registered cron must actually exist
//     in the cited file, and must be at least as frequent as the criterion
//     claims. A gate may not be 🟢 on a cadence its runner does not provide.
//     Changing a runner's cadence therefore breaks `build` until someone
//     re-scores the gate — which is the entire point.
//
//   • THE DEAD-TICKET RULE (`--issues`, needs network). Every issue a gate
//     names as its next action must still be open. A closed one means the
//     gate needs re-scoring, not that the row is fine.
//
// Deliberately NOT enforced: whether a status colour is *correct*. No script
// can read evidence. This proves the scoreboard is internally consistent and
// that its cadence claims are backed by a real cron — the two things that
// rotted mechanically.
//
// Exports the pure pieces for scripts/check-launch-gates.test.ts.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

export const DOC_FILE = 'docs/launch-readiness.md';

/** Blocked-on is a closed vocabulary — the whole point is that it forces a choice. */
export const BLOCKED_ON = ['founder', 'agent', 'nobody'];

/** Statuses, in the doc's own legend order. */
export const STATUSES = ['🟢', '🟡', '🔴'];

/** Marks a knowingly-unmet cadence claim. Legal only on a non-green gate. */
export const MISMATCH_MARK = '⚠️';

/** An empty cell. The doc uses an em dash so a blank is never ambiguous. */
export const NONE = '—';

/**
 * Cadence words a criterion can claim, ranked by frequency. A runner may
 * over-deliver (hourly satisfies a nightly claim) but never under-deliver.
 */
export const CADENCE_RANK = {
  hourly: 4,
  nightly: 3,
  daily: 3,
  weekly: 2,
  monthly: 1,
};

/**
 * Cadence words that, appearing anywhere in a gate's criterion or remaining
 * work, oblige that gate to declare its runner. Kept literal and small on
 * purpose: a fuzzy matcher here would produce false alarms nobody would fix.
 */
export const CADENCE_WORDS = {
  hourly: 'hourly',
  nightly: 'nightly',
  'every night': 'nightly',
  'each night': 'nightly',
  daily: 'daily',
  'every day': 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};

/** Pull a `<!-- name:start -->` … `<!-- name:end -->` block out of the doc. */
export function extractBlock(text, name) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a === -1 || b === -1 || b < a) return null;
  return text.slice(a + start.length, b);
}

/**
 * Parse a GitHub-flavoured pipe table into `{ header, rows }`, where each row
 * is an array of trimmed cells. Separator rows (`|---|---|`) are dropped.
 */
export function parseTable(block) {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'));
  const cells = (l) =>
    l
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const parsed = lines.map(cells).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
  if (!parsed.length) return { header: [], rows: [] };
  return { header: parsed[0], rows: parsed.slice(1) };
}

/** Strip backticks/whitespace from a cell holding a repo-relative path. */
export const sourcePathOf = (cell) => (cell ?? '').replace(/`/g, '').trim();

/** `` `0 9 * * 0` `` → `0 9 * * 0`. Returns null if the cell holds no cron. */
export function cronOf(cell) {
  const m = cell.match(/`([^`]+)`/);
  if (!m) return null;
  const cron = m[1].trim();
  return cron.split(/\s+/).length === 5 ? cron : null;
}

/**
 * Classify a 5-field cron by how often it fires. Returns a key of
 * CADENCE_RANK, or null when the shape is one this check should not pretend
 * to understand (better to fail loudly than to guess).
 */
export function classifyCron(cron) {
  const f = cron.trim().split(/\s+/);
  if (f.length !== 5) return null;
  const [, hour, dom, , dow] = f;
  const every = (x) => x === '*';
  const stepped = (x) => /^\*\/\d+$/.test(x);
  // Anything narrowing the day-of-week to specific days is at most weekly.
  const dowNarrowed = !every(dow);
  const domNarrowed = !every(dom);
  if (dowNarrowed && domNarrowed) return null; // ambiguous OR-semantics; don't guess
  if (dowNarrowed) return 'weekly';
  if (domNarrowed) return 'monthly';
  if (every(hour) || stepped(hour)) return 'hourly';
  return 'daily'; // a fixed hour (or a list of hours) on every day
}

/** Every `#123` in a cell, deduped, as numbers. */
export function issueRefs(cell) {
  if (cell === NONE) return [];
  return [...new Set([...cell.matchAll(/#(\d+)/g)].map((m) => Number(m[1])))];
}

/** Does this text claim a cadence? Returns the highest-frequency word found. */
export function claimedCadence(text) {
  const lower = text.toLowerCase();
  let best = null;
  for (const [word, norm] of Object.entries(CADENCE_WORDS)) {
    if (!lower.includes(word)) continue;
    if (!best || CADENCE_RANK[norm] > CADENCE_RANK[best]) best = norm;
  }
  return best;
}

/**
 * The whole check, as a pure function over injected state so tests can drive
 * it without touching the repo.
 *
 * @param {object} input
 * @param {string} input.docText             contents of docs/launch-readiness.md
 * @param {Record<string,string|null>} input.sources  cadence-source path → file text (null = missing)
 * @param {Record<number,'OPEN'|'CLOSED'>} [input.issueStates]  only when --issues ran
 * @returns {{errors: string[], warnings: string[], gates: object[]}}
 */
export function checkGates({ docText, sources, issueStates }) {
  const errors = [];
  const warnings = [];

  const meanings = extractBlock(docText, 'gates:meaning');
  const scoreboard = extractBlock(docText, 'gates:scoreboard');
  const cadence = extractBlock(docText, 'gates:cadence');
  for (const [name, blk] of [
    ['gates:meaning', meanings],
    ['gates:scoreboard', scoreboard],
    ['gates:cadence', cadence],
  ]) {
    if (blk === null) errors.push(`${DOC_FILE}: missing the <!-- ${name}:start/end --> block`);
  }
  if (errors.length) return { errors, warnings, gates: [] };

  const meaningRows = parseTable(meanings).rows;
  const boardRows = parseTable(scoreboard).rows;
  const cadenceRows = parseTable(cadence).rows;

  const meaningOf = new Map(meaningRows.map((r) => [r[0], r.join(' ')]));
  const cadenceOf = new Map();
  for (const r of cadenceRows) {
    if (cadenceOf.has(r[0])) errors.push(`cadence table: gate ${r[0]} listed twice`);
    cadenceOf.set(r[0], r);
  }

  // Every gate in the meaning table must be scored, and vice versa.
  const boardNames = boardRows.map((r) => r[0]);
  for (const g of meaningOf.keys()) {
    if (!boardNames.includes(g)) errors.push(`gate ${g} has a meaning but no scoreboard row`);
  }
  for (const g of boardNames) {
    if (!meaningOf.has(g)) errors.push(`gate ${g} is scored but has no plain-English meaning`);
  }
  for (const g of cadenceOf.keys()) {
    if (!boardNames.includes(g)) errors.push(`cadence table names unknown gate ${g}`);
  }

  const gates = [];
  for (const row of boardRows) {
    const [gate, status, blockedOn, left, next] = row;
    if (row.length < 5) {
      errors.push(`scoreboard row for ${gate ?? '(unnamed)'} has ${row.length} cells, expected 5`);
      continue;
    }
    if (!STATUSES.includes(status)) {
      errors.push(`gate ${gate}: status "${status}" is not one of ${STATUSES.join(' ')}`);
    }
    if (!BLOCKED_ON.includes(blockedOn)) {
      errors.push(
        `gate ${gate}: blocked-on "${blockedOn}" is not one of ${BLOCKED_ON.join('/')} — ` +
          `every non-green gate must say who it waits on, and "nobody" is a real answer`,
      );
    }
    if (status === '🟢' && blockedOn !== 'nobody') {
      errors.push(`gate ${gate}: a 🟢 gate cannot be blocked on ${blockedOn}`);
    }

    const refs = issueRefs(next);
    if (issueStates) {
      for (const n of refs) {
        const st = issueStates[n];
        if (st === 'CLOSED') {
          errors.push(
            `gate ${gate}: next-action issue #${n} is CLOSED — re-score the gate, ` +
              `do not leave a dead ticket as the next step`,
          );
        } else if (st === undefined) {
          warnings.push(`gate ${gate}: could not resolve issue #${n}`);
        }
      }
    }

    // ── the cadence rule ────────────────────────────────────────────────
    const criterion = `${meaningOf.get(gate) ?? ''} ${left}`;
    const claim = claimedCadence(criterion);
    const crow = cadenceOf.get(gate);
    if (claim && !crow) {
      errors.push(
        `gate ${gate}: its criterion claims a "${claim}" cadence but the cadence table ` +
          `does not name the runner that provides it (see ${DOC_FILE} → "Cadence provenance")`,
      );
    }
    if (!claim && crow) {
      warnings.push(`gate ${gate}: has a cadence row but its criterion claims no cadence`);
    }
    if (claim && crow) {
      const [, claimedCell, runner, registeredCell, sourceCell] = crow;
      const sourcePath = sourcePathOf(sourceCell);
      const declared = claimedCell.toLowerCase().replace(/[^a-z]/g, '');
      if (CADENCE_RANK[declared] !== CADENCE_RANK[claim]) {
        errors.push(
          `gate ${gate}: criterion reads as "${claim}" but the cadence table declares ` +
            `"${claimedCell}" — the two must agree`,
        );
      }
      if (runner === NONE || !runner) {
        errors.push(`gate ${gate}: cadence claimed but no runner named`);
      }
      const cron = cronOf(registeredCell);
      if (!cron) {
        errors.push(
          `gate ${gate}: registered cadence "${registeredCell}" is not a backtick-quoted ` +
            `5-field cron — a cadence claim must point at a real schedule`,
        );
      } else {
        const src = sources[sourcePath];
        if (src === undefined || src === null) {
          errors.push(`gate ${gate}: cadence source "${sourcePath}" does not exist`);
        } else if (!src.includes(cron)) {
          errors.push(
            `gate ${gate}: cron \`${cron}\` is not in ${sourcePath} — either the runner's ` +
              `cadence changed (re-score this gate) or the citation is wrong`,
          );
        }
        const actual = classifyCron(cron);
        if (!actual) {
          errors.push(`gate ${gate}: cannot classify cron \`${cron}\` — state the cadence plainly`);
        } else {
          const short = CADENCE_RANK[actual] < CADENCE_RANK[claim];
          const acked = registeredCell.includes(MISMATCH_MARK);
          if (short && !acked) {
            errors.push(
              `gate ${gate}: criterion needs ${claim} but \`${cron}\` runs ${actual}. ` +
                `The criterion is unsatisfiable as written. Re-score the gate and mark the ` +
                `registered-cadence cell ${MISMATCH_MARK}, or restore the cadence.`,
            );
          }
          if (short && status === '🟢') {
            errors.push(
              `gate ${gate}: scored 🟢 on a ${claim} criterion its runner only meets ${actual} — ` +
                `a gate cannot be green on a cadence nothing provides`,
            );
          }
          if (!short && acked) {
            warnings.push(
              `gate ${gate}: carries the ${MISMATCH_MARK} mismatch mark but \`${cron}\` ` +
                `satisfies the ${claim} claim — drop the mark`,
            );
          }
        }
      }
    }

    gates.push({ gate, status, blockedOn, issues: refs, claim });
  }

  return { errors, warnings, gates };
}

/** Cadence-source paths the doc cites, for the runner to read off disk. */
export function citedSources(docText) {
  const cadence = extractBlock(docText, 'gates:cadence');
  if (!cadence) return [];
  return [
    ...new Set(
      parseTable(cadence)
        .rows.map((r) => sourcePathOf(r[4]))
        .filter((p) => p && p !== NONE),
    ),
  ];
}

async function main() {
  const wantIssues = process.argv.includes('--issues');
  const docPath = join(ROOT, ...DOC_FILE.split('/'));
  if (!existsSync(docPath)) {
    console.error(`✗ ${DOC_FILE} not found`);
    return 1;
  }
  const docText = readFileSync(docPath, 'utf8');

  const sources = {};
  for (const p of citedSources(docText)) {
    const abs = join(ROOT, ...p.split('/'));
    sources[p] = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  }

  let issueStates;
  if (wantIssues) {
    const nums = [
      ...new Set(
        parseTable(extractBlock(docText, 'gates:scoreboard') ?? '').rows.flatMap((r) =>
          issueRefs(r[4] ?? ''),
        ),
      ),
    ];
    issueStates = await resolveIssues(nums);
    if (!issueStates) {
      console.log('· --issues: no usable GitHub access, skipping the dead-ticket check');
      issueStates = undefined;
    }
  }

  const { errors, warnings, gates } = checkGates({ docText, sources, issueStates });

  for (const w of warnings) console.log(`! ${w}`);
  if (errors.length) {
    console.error(`\n✗ ${DOC_FILE} — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    return 1;
  }
  const green = gates.filter((g) => g.status === '🟢').length;
  const byBlock = BLOCKED_ON.map(
    (b) => `${b} ${gates.filter((g) => g.status !== '🟢' && g.blockedOn === b).length}`,
  ).join(' · ');
  console.log(
    `✓ ${DOC_FILE}: ${gates.length} gates, ${green} green; non-green blocked on ${byBlock}` +
      (issueStates ? ' · next-action tickets all open' : ''),
  );
}

/**
 * Ask GitHub whether each issue is open. Returns null when GitHub is not
 * reachable at all, so an offline run degrades to the cadence rule rather
 * than failing for a reason that has nothing to do with the scoreboard.
 */
async function resolveIssues(nums) {
  if (!nums.length) return {};
  const { gh, githubReachable } = await import('./lib/gh.mjs');
  if (!(await githubReachable())) return null;
  const out = {};
  for (const n of nums) {
    try {
      const { stdout } = await gh(['issue', 'view', String(n), '--json', 'number,state']);
      const state = JSON.parse(stdout)?.state;
      if (state) out[n] = String(state).toUpperCase();
    } catch {
      return null;
    }
  }
  return out;
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-launch-gates.mjs')
) {
  await runMain(main, { name: 'check-launch-gates' });
}
