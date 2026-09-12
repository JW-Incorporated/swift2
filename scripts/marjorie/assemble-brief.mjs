// Marjorie's deterministic brief skeleton (charter: docs/agents/marjorie.md).
//
// Gathers the raw material for a Founders' Brief from GitHub — zero LLM
// tokens — and prints a markdown brief to stdout. Marjorie's judgment pass
// tightens the prose on top of this; the skeleton alone is already a correct,
// postable brief.
//
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs            # today, live gh data
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs 2026-07-12 # explicit date (accepted, currently decorative — see below)
//   node --use-env-proxy scripts/marjorie/assemble-brief.mjs --json     # the evidence, for the journal
//
// ─── THE 2026-09-12 REBUILD (Marjorie Overhaul C2) ─────────────────────────
// docs/specs/marjorie-overhaul/c2-brief.md is the source of truth. The brief
// is now SIX sections, capped at 40 lines total (headings + blanks
// included), each with its OWN line budget so no section can starve another
// (the old single end-of-brief truncation always ate whatever section came
// last):
//
//   WAITING ON YOU — every open HUMAN-ACTIONS.md item, oldest-first, and
//       nothing else (the founder-decision/founder-task bank system that
//       used to share this section is not part of the new brief at all —
//       c2-brief.md's Data table names HUMAN-ACTIONS.md as the section's
//       only source, and acceptance criterion 5 says "exactly").
//   SINCE YESTERDAY — PRs merged/reverted, watchdog alerts opened/closed,
//       submissions in by label, an optional accountability line for
//       Marjorie's own open dispatched work, an optional pointer to a fresh
//       Tree weekly-plan PR.
//   TODAY — what routines run today, what Marjorie will do.
//   SITE — prod smoke, e2e, Vault Run freshness, content lanes.
//   TREE — one line from `social/lessons.md`, one from Tree's scorecard.
//   DISTANCE TO DONE — scored against `docs/definition-of-done.md`'s eight
//       founder-set items (NOT the retired 12-gate tracker the old estimator
//       measured), naming every non-green item's blocker.
//
// This module intentionally does NOT emit the `cc @sffan15-sys @wjduvall-cmd`
// line or the `**Founders' Brief — YYYY-MM-DD** · [issue #N](url)` header —
// both are composed by the runner prompt (`marjorie-brief.md`), the second
// one necessarily so: it links the issue's own number, which does not exist
// until after the issue is created. This module outputs just the six
// sections, always.
//
// Requires an authenticated `gh` or a GH_TOKEN. Read-only: never writes to GitHub.
//
// Split 2026-09-12 (M1 audit, file was 449 lines / cap is 300): pure section
// renderers/builders live in `lib/brief-sections.mjs`, gh fetch helpers live
// in `lib/brief-state.mjs`. Both are re-exported below unchanged so this
// module's own public surface (and every existing importer) doesn't move.

import { checkRunners } from './standing-checks.mjs';
import { sortForBrief } from './human-actions.mjs';
import { runMain } from '../lib/cli.mjs';
import {
  DAY_MS, SECTION_BUDGETS,
  extractOptions, extractField, todayLA, findLatestTreePR, shortTitle, capSection,
  renderHumanActionLine, buildWaitingOnYouLines,
  renderMergedLine, renderAlertsLine, renderDispatchedLine, buildSinceYesterdayLines,
  renderTodayRunsLine, renderTodayMeLine, buildTodayLines,
  renderSiteLine,
  renderDistanceClosingLine, buildDistanceToDoneSection,
} from './lib/brief-sections.mjs';
import { gh, ghWithCompleteness, ghCriticalList, fetchState, REPO } from './lib/brief-state.mjs';

export {
  extractOptions, extractField, todayLA, findLatestTreePR, shortTitle, capSection,
  renderHumanActionLine, renderMergedLine, renderAlertsLine, renderDispatchedLine,
  renderTodayRunsLine, renderTodayMeLine,
  renderSiteLine, renderDistanceClosingLine,
  gh, ghWithCompleteness, ghCriticalList, fetchState,
};

// ─── analysis (pure) ───────────────────────────────────────────────────────

/**
 * Everything the brief asserts, decided before a single line is written.
 * Exported so tests can assert on the numbers rather than on the prose, and
 * so `--json` can dump the evidence trail into the journal comment.
 */
export function analyse(state, { now = state.now ?? Date.now() } = {}) {
  const nowMs = Number(now);
  const merged24 = (state.allPRs || [])
    .filter((p) => p.mergedAt && nowMs - new Date(p.mergedAt).getTime() < DAY_MS)
    .sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime());
  return { merged24, now: nowMs };
}

// ─── render ────────────────────────────────────────────────────────────────

/**
 * Just the six sections — no `cc @…` line, no `**Founders' Brief — date**`
 * self-link header. Both are composed by the runner prompt around this
 * output (see this file's header note for why the header can't live here).
 */
export function buildBrief(state, { now = state?.now ?? Date.now() } = {}) {
  const a = analyse(state, { now });
  const out = [];

  const allAlerts = state.alerts || [];
  const openAlertsNow = allAlerts.filter((al) => String(al.state || 'open').toUpperCase() === 'OPEN');

  // ── WAITING ON YOU ────────────────────────────────────────────────────
  const openActions = sortForBrief(state.openActions || []);
  out.push(`**Waiting on you (${openActions.length})**`, '');
  out.push(...capSection(buildWaitingOnYouLines(openActions), SECTION_BUDGETS.waitingOnYou), '');

  // ── SINCE YESTERDAY ───────────────────────────────────────────────────
  out.push('**Since yesterday**', '');
  out.push(...capSection(buildSinceYesterdayLines(state, a, now), SECTION_BUDGETS.sinceYesterday), '');

  // ── TODAY ─────────────────────────────────────────────────────────────
  out.push('**Today**', '');
  out.push(...capSection(buildTodayLines(state, openAlertsNow), SECTION_BUDGETS.today), '');

  // ── SITE ──────────────────────────────────────────────────────────────
  out.push('**Site**', '');
  const runnersResult = checkRunners({
    allPRs: state.allPRs || [], issues: [], briefComments: [],
    cadence: state.cadence || { runners: [] }, now, listsCapExhausted: state.allPRsCapExhausted,
  });
  const vaultRow = runnersResult.rows.find((r) => r.runner === 'Vault Run') || null;
  const siteLines = [renderSiteLine({ openAlertsNow, vaultRow, contentShipped: state.contentShipped })];
  out.push(...capSection(siteLines, SECTION_BUDGETS.site), '');

  // ── TREE ──────────────────────────────────────────────────────────────
  out.push('**Tree**', '');
  const treeLines = state.treeLines && state.treeLines.length ? state.treeLines : ['- Nothing to report yet.'];
  out.push(...capSection(treeLines, SECTION_BUDGETS.tree), '');

  // ── DISTANCE TO DONE ──────────────────────────────────────────────────
  const distance = buildDistanceToDoneSection(state, now);
  out.push(distance.heading, '');
  out.push(...capSection(distance.lines, SECTION_BUDGETS.distanceToDone));

  return `${out.join('\n').trimEnd()}\n`;
}

// ─── entry point ───────────────────────────────────────────────────────────

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  async function main() {
    const args = process.argv.slice(2);
    const wantJson = args.includes('--json');
    // Accepted for CLI-contract compatibility (a fixed-date recovery run);
    // buildBrief no longer needs it, since the date-stamped header line
    // moved to the runner prompt's post-create edit step.
    const now = Date.now();

    const state = await fetchState(REPO, { now });

    if (wantJson) {
      process.stdout.write(`${JSON.stringify({ analysis: analyse(state, { now }), state }, null, 2)}\n`);
    } else {
      process.stdout.write(buildBrief(state, { now }));
    }
  }
  runMain(main, { name: 'assemble-brief' });
}
