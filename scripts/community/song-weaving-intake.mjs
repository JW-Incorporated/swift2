// Song-page weaving intake — Community Engine plan §3.4 point 4, §9 card
// P2-6 (docs/proposals/2026-09-06-community-engine-plan.md). Parents: P2-3
// (merge/promote pass, merged PR #3963).
//
// WHAT THIS DOES: weekly, reads every `live_theory` row that is
// `origin='fan'`, `persistent=true`, `track_slug is not null`, not
// `debunked`, and clears `PERSISTENCE_MENTION_FLOOR` mention_count (the
// "well-established enough to be worth a human's look" bar — a theory
// that JUST cleared P2-3's mention_count>=3 promotion floor last night
// is not yet "well-documented", so this script applies its own, higher
// bar rather than reusing the promotion threshold verbatim), and files
// one Content Shift `intake`-labeled GitHub issue per theory not already
// filed — a LEAD, never a finished song-page edit.
//
// WHY A LEAD, NEVER AN EDIT (per docs/content-ops/theory-weaving.md and
// docs/proposals/2026-09-06-community-engine-plan.md §3.4 point 4 verbatim:
// "That is a Content Shift lane input, not automatic"): this script has no
// mainstream-coverage verification step and makes NO claim that one
// exists — `live_theory` rows are built from Reddit/Facebook chatter
// (Theory Miner, P2-2), which theory-weaving.md's own sourcing bar
// explicitly excludes ("not a single forum post ... covered by mainstream
// fan media"). Every issue this files says so up front and points Content
// Shift at the real verification step (find >=1 mainstream fan-media
// outlet that covers the same theory) before any song-page edit — same
// "the drop is never the copy" discipline as appearance-discovery's
// `intake:` issues and docs/content-ops/intake.md's "Rules of the door".
//
// SCOPE GUARDRAIL (theory-weaving.md's own hard ban, restated in every
// issue body): relationship/private-life/sexuality/family/identity
// theories NEVER weave into a song page, regardless of documentation —
// but that ban is already enforced upstream by `screenTopic()` at
// candidate-write time (write-theory-candidate.ts) and again by
// theory-promote.ts's redline_ok posture, so no promoted `live_theory` row
// should ever reach this script carrying one. This script doesn't
// re-screen (there is nothing left to screen — `claim`/`evidenceSummary`
// already passed `screenTopic()` before promotion), it only restates the
// guardrail in the issue body as a standing reminder for the human/Content
// Shift triage step, same belt-and-suspenders posture as
// appearance-discovery's issue body restating oEmbed verification it
// cannot itself perform.
//
// DEDUPE (fail-closed, same discipline as appearance-discovery/discover.mjs
// #2008/#2034): reads the repo-scoped `intake`-labeled issue list (open AND
// closed) via scripts/lib/gh.mjs, extracts every `fan-theory-weaving:<uuid>`
// marker already filed, and refuses to file anything when that read is
// unavailable or possibly truncated — a missed week self-heals next week; a
// duplicate issue does not.
//
//   node scripts/community/song-weaving-intake.mjs                # DRY RUN (default): print, no gh calls
//   node scripts/community/song-weaving-intake.mjs --file         # actually file issues (needs GH_TOKEN or gh auth)
//   node scripts/community/song-weaving-intake.mjs --file --max 10
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY to read `live_theory`;
// degrades to a clean no-op log line when absent, matching every other
// Community Engine script's scripts/lib/supabase.mjs contract.

import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serviceClient } from '../lib/supabase.mjs';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';

const INTAKE_LABEL = 'intake';
const LEDGER_LIMIT = 1000;
const MARKER_RE = /fan-theory-weaving:([0-9a-f-]{36})/g;

// A theory just clearing P2-3's mention_count>=3 promotion floor overnight
// is not yet "well-documented" in the sense theory-weaving.md means it —
// this is deliberately a higher bar than PROMOTION_MENTION_THRESHOLD
// (theory-promote.ts), applied here rather than raised there, because the
// promotion floor and the "worth a human's look for a song page" floor are
// different questions with different owners (P2-3's merge pass vs. this
// weekly report).
export const WEAVING_MENTION_FLOOR = 8;

/** Machine-readable marker embedded in every issue this tool files. */
export function fingerprintMarker(theoryId) {
  return `<!-- fan-theory-weaving:${theoryId} -->`;
}

/** Every live_theory id already referenced by a set of issue bodies/titles. */
export function theoryIdsIn(texts) {
  const ids = new Set();
  for (const body of texts) {
    const text = String(body ?? '');
    for (const m of text.matchAll(MARKER_RE)) ids.add(m[1]);
  }
  return ids;
}

/**
 * Decide what to file. Pure — no I/O, unit-testable without a DB or gh.
 *
 * `ledger` is `{ ids, complete }` from the intake-issue scan — `complete:
 * false` means the listing may be truncated, so nothing can be proven
 * unfiled and the whole run refuses (fail closed, mirrors
 * appearance-discovery/lib/dedupe.mjs's `planFilings`).
 */
export function planWeavingFilings(theories, { ledger, max = 10 } = {}) {
  if (!ledger || !ledger.ids) {
    return {
      toFile: [],
      skipped: [],
      refuse: 'intake-issue ledger unavailable — refusing to file (fail closed)',
    };
  }
  if (!ledger.complete) {
    return {
      toFile: [],
      skipped: [],
      refuse:
        'intake-issue listing possibly truncated — cannot prove any theory is new; refusing to file (fail closed)',
    };
  }
  const toFile = [];
  const skipped = [];
  for (const t of theories) {
    if (!t.trackSlug) {
      skipped.push({ ...t, reason: 'no-track-slug' });
      continue;
    }
    if (t.status === 'debunked') {
      skipped.push({ ...t, reason: 'debunked' });
      continue;
    }
    if ((t.mentionCount ?? 0) < WEAVING_MENTION_FLOOR) {
      skipped.push({ ...t, reason: 'below-weaving-mention-floor' });
      continue;
    }
    if (ledger.ids.has(t.id)) {
      skipped.push({ ...t, reason: 'already-filed' });
      continue;
    }
    if (toFile.length >= max) {
      skipped.push({ ...t, reason: 'over-per-run-cap' });
      continue;
    }
    toFile.push(t);
  }
  return { toFile, skipped, refuse: null };
}

function issueTitle(t) {
  return `intake: fan theory weaving — "${t.name}" (${t.trackSlug})`;
}

export function issueBody(t) {
  return [
    `**Theory:** ${t.claim}`,
    `**Track slug:** \`${t.trackSlug}\``,
    `**Fan mention count:** ${t.mentionCount ?? '(unknown)'} — communities: ${(t.communities ?? []).join(', ') || '(none recorded)'}`,
    `**Stance:** ${t.status}`,
    '',
    '**What this is.** Machine-detected from the Community Engine\'s year-deep',
    'Reddit/Facebook fan-theory corpus (`docs/proposals/2026-09-06-community-',
    'engine-plan.md` §3.3/§3.4 point 4, card P2-6). This theory is well-',
    `established as FAN CHATTER (>=${WEAVING_MENTION_FLOOR} mentions across the`,
    'watched communities) and names a specific song, but it has **NOT** been',
    'checked against mainstream fan media — this is a lead, never the copy.',
    '',
    '**Triage (per `docs/content-ops/theory-weaving.md`):**',
    '1. Find >=1 recurring Easter-egg/theory roundup from mainstream fan media',
    '   (e.g. Marie Claire, Nylon, Today.com) covering this same claim — a',
    '   single forum post or a fringe theory with no outlet pickup does not',
    '   clear theory-weaving.md\'s sourcing bar. No outlet found → comment what',
    '   was searched and close; never weave from corpus chatter alone.',
    '2. **Hard scope guardrail, absolute, no exceptions:** if this theory',
    '   touches relationships, private life, sexuality, family, or identity,',
    '   it does not get written, however well-documented it seems. (Every row',
    '   this script reads already passed `screenTopic()` before promotion —',
    '   this is a standing reminder for the human triage step, not evidence a',
    '   screen was skipped.)',
    '3. If it clears both, weave ONE sourced line into the song\'s existing',
    '   `moment.context` (or the seeded `theories/<era>.mjs` entry per',
    '   `docs/decisions.md` 2026-07-19\'s resolution of the two-shape',
    '   conflict) — no standalone theories section, no schema change.',
    '4. Route per `docs/agents/content-shift.md`\'s normal queue — this issue',
    '   enters Content Shift\'s `intake` queue like any other drop.',
    '',
    '---',
    `_Filed by scripts/community/song-weaving-intake.mjs (deterministic; a lead, not copy)._`,
    fingerprintMarker(t.id),
  ].join('\n');
}

async function loadLedger() {
  const res = await gh([
    'issue',
    'list',
    '--label',
    INTAKE_LABEL,
    '--state',
    'all',
    '--json',
    'number,title,body',
    '--limit',
    String(LEDGER_LIMIT),
  ]);
  const { stdout } = res;
  if (!String(stdout).trim()) throw new Error('issue list returned no output');
  const rows = JSON.parse(stdout);
  if (!Array.isArray(rows)) throw new Error('issue list did not return an array');
  return {
    ids: theoryIdsIn(rows.flatMap((r) => [r?.title, r?.body])),
    issues: rows.length,
    complete: res.complete ?? rows.length < LEDGER_LIMIT,
  };
}

async function createIntakeIssue(t) {
  const bodyPath = join(tmpdir(), `theory-weaving-intake-${t.id}-${Date.now()}.md`);
  writeFileSync(bodyPath, issueBody(t), 'utf8');
  try {
    const { stdout } = await gh([
      'issue',
      'create',
      '--title',
      issueTitle(t),
      '--body-file',
      bodyPath,
      '--label',
      INTAKE_LABEL,
    ]);
    return stdout.trim();
  } finally {
    try {
      unlinkSync(bodyPath);
    } catch {
      /* best-effort cleanup */
    }
  }
}

function parseArgs(argv) {
  const out = { fileMode: argv.includes('--file'), max: 10 };
  const i = argv.indexOf('--max');
  if (i !== -1 && argv[i + 1]) {
    const n = Number(argv[i + 1]);
    if (Number.isInteger(n) && n >= 1) out.max = n;
  }
  return out;
}

export { parseArgs };

async function loadCandidateTheories(db) {
  const { data, error } = await db
    .from('live_theory')
    .select('id, name, claim, status, track_slug, mention_count, communities')
    .eq('origin', 'fan')
    .eq('persistent', true)
    .not('track_slug', 'is', null);
  if (error) throw new Error(`live_theory load failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    claim: r.claim,
    status: r.status,
    trackSlug: r.track_slug,
    mentionCount: r.mention_count,
    communities: r.communities ?? [],
  }));
}

async function main() {
  const { fileMode, max } = parseArgs(process.argv.slice(2));

  const db = serviceClient();
  if (!db) {
    console.log(
      'song-weaving-intake: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.',
    );
    return 0;
  }

  const theories = await loadCandidateTheories(db);
  console.log(
    `song-weaving-intake: ${fileMode ? 'FILE mode' : 'DRY RUN (no gh calls)'} — ` +
      `${theories.length} persistent fan theory(ies) with a track_slug, cap ${max}/run.`,
  );
  if (theories.length === 0) return 0;

  let ledger;
  if (fileMode) {
    try {
      ledger = await loadLedger();
      console.log(
        `ledger: ${ledger.issues} intake issues scanned, ${ledger.ids.size} theory id(s) known${ledger.complete ? '' : ' (POSSIBLY TRUNCATED)'}`,
      );
    } catch (e) {
      console.error(`ledger: unavailable — ${e.message}`);
      ledger = null;
    }
  } else {
    // Dry run: no gh calls by contract. Pretend the ledger is empty-and-complete.
    ledger = { ids: new Set(), issues: 0, complete: true };
  }

  const plan = planWeavingFilings(theories, { ledger, max });

  for (const s of plan.skipped)
    console.log(`  skip [${s.reason}] ${s.id} — "${s.name}" (${s.trackSlug ?? 'no track'})`);
  for (const t of plan.toFile)
    console.log(`  ${fileMode ? 'FILE' : 'would file'} ${t.id} — ${issueTitle(t)}`);

  let filed = 0;
  const createFailures = [];
  if (plan.refuse) {
    console.error(`REFUSED to file: ${plan.refuse}`);
  } else if (fileMode) {
    for (const t of plan.toFile) {
      try {
        const url = await createIntakeIssue(t);
        filed++;
        console.log(`  filed ${url}`);
      } catch (e) {
        createFailures.push(`${t.id}: ${String(e?.stderr || e?.message || e).slice(0, 300)}`);
        console.error(`  FAILED to file ${t.id}: ${e.message}`);
      }
    }
  }

  console.log(
    `summary: ${theories.length} candidate(s), ${plan.toFile.length} ${fileMode ? 'to file' : 'would file'}, ` +
      `${plan.skipped.length} skipped, ${filed} filed${plan.refuse ? ', REFUSED (fail closed)' : ''}`,
  );
  if (createFailures.length) console.error(`create failures:\n  ${createFailures.join('\n  ')}`);

  if (createFailures.length || plan.refuse) return 1;
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/song-weaving-intake.mjs')
) {
  runMain(main, { name: 'song-weaving-intake' });
}
