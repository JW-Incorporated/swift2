// T7 — the autonomy ladder (docs/specs/tree-overhaul/t7-autonomy-ladder.md).
// Wave 4 builds ONLY the read-only measurement half: eligibility() and the
// grant read-path (readGrants/activeGrantFor) it depends on. Wave 5 (Opus,
// mandatory Codex review, gated on R4 + a founder re-confirmation) builds
// the acting half — signed grants, approval schema v: 3, stampUnderPolicy,
// the posted-under-policy notice, revocation, retraction. None of that is
// here, and nothing in this file ever writes `social/autonomy.json`.
// `social/autonomy.json` does not exist yet; its absence is the normal
// day-0 state everywhere below, never an error (spec AC#12).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pillarOf } from './feedback.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const AUTONOMY_FILE = path.join(ROOT, 'social', 'autonomy.json');

// Mirrors feedback.mjs's own (unexported) `draftRows` filter — that file's
// header comment: "T7's own per-campaign-type ladder reads the identical
// filter (spec: the filter is `file.startsWith('social/queue/')`), so this
// is the one definition, not two that could quietly drift apart." The
// literal is intentionally duplicated here rather than imported, since
// `draftRows` itself isn't exported.
const DRAFT_ROW_PREFIX = 'social/queue/';

const ELIGIBILITY_WINDOW_DAYS = 28;
const MIN_BRIEFS = 8;
const MIN_APPROVED_PCT = 95;
const MIN_APPROVED_SHARE = MIN_APPROVED_PCT / 100;

function isDraftRow(row) {
  return typeof row?.file === 'string' && row.file.startsWith(DRAFT_ROW_PREFIX);
}

function isFrozen() {
  // Same truthy convention as post-queue.mjs's own SOCIAL_FREEZE check.
  const value = process.env.SOCIAL_FREEZE;
  return Boolean(value) && value !== 'false' && value !== '0';
}

/**
 * Every grant in `social/autonomy.json` (spec §Data), or `[]` when the file
 * is absent, unreadable, or malformed — the file does not exist until the
 * first grant is ever made (Wave 5), and that day-0 absence must never be
 * an error. Read-only: nothing in Wave 4 ever writes this file.
 */
export function readGrants(file = AUTONOMY_FILE) {
  let text;
  try {
    text = readFileSync(file, 'utf-8');
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.grants) ? parsed.grants : [];
  } catch {
    return [];
  }
}

/**
 * The active grant for `type`, or `null` when there isn't one — a pure
 * lookup over an already-read `grants` array (spec: "existing active
 * grant: none" is one of eligibility's own gate conditions). This does NOT
 * verify a grant's signature (`verifyGrant`, Wave 5) — eligibility only
 * needs to know whether a grant is on record, not whether it is safe to
 * post under; that stronger check belongs to whatever, in Wave 5, actually
 * acts on a grant.
 */
export function activeGrantFor(grants, type) {
  return (grants ?? []).find((g) => g?.type === type && g?.status === 'active') ?? null;
}

/**
 * Eligibility for `type` (a campaign family — the value `pillarOf(campaign)`
 * returns, spec §Data) as of `now`, over the trailing 28 days of
 * `ledgerRows` (any shape of `social/feedback/*.jsonl` rows — this filters
 * to draft rows of `type` itself internally, so a caller may pass the raw,
 * unfiltered ledger straight from disk). `grants` defaults to the real
 * on-disk read path (`readGrants()`) and exists as its own parameter only
 * so a test can synthesize a fake grant without writing a signed file to
 * disk — every real caller omits it and gets the day-0 "no file" behavior.
 *
 * Conditions (spec §Eligibility, all required):
 *   - >= 8 briefs of this type resolved in the window
 *   - >= 95% plain approve share (this permits zero edits at n=8..19 and
 *     one at n=20 — the arithmetic, not a rounding choice)
 *   - exactly 0 rejections (one disqualifies regardless of rate — a
 *     rejection is categorically different from an edit)
 *   - no existing active grant for `type`
 *   - `SOCIAL_FREEZE` not set
 *
 * Returns `{ eligible, briefs, approvedPct, rejected, reason }` — `reason`
 * is `null` when eligible, else the first blocking condition in the
 * priority order above (freeze, then grant, then brief count, then
 * rejections, then approval rate). `approvedPct` is `null` (never NaN) at
 * `briefs === 0`, matching feedback.mjs's own `aggregateVerdicts`
 * convention for an empty bucket; otherwise it is `Math.floor`ed for
 * display, never `Math.round`ed — the >=95% gate itself is checked against
 * the exact, unrounded share (`approved/briefs`), because rounding 18/19
 * (94.736...%) up to a *displayed* 95% must never flip the n=19 case
 * eligible (spec: "95% permits zero edits at n=8..19, one at n=20 — the
 * arithmetic, not a rounding choice"). `floor` also keeps a failing
 * `reason` string honest: it can never print "95%" while still failing the
 * >=95% gate.
 */
export function eligibility(ledgerRows, type, now = Date.now(), grants = readGrants()) {
  const endMs = new Date(now).getTime();
  const cutoffMs = endMs - ELIGIBILITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  let approved = 0;
  let edited = 0;
  let rejected = 0;
  for (const row of ledgerRows ?? []) {
    if (!isDraftRow(row)) continue;
    if (pillarOf(row?.campaign) !== type) continue;
    const at = Date.parse(row?.ts ?? '');
    if (Number.isNaN(at) || !(at > cutoffMs && at <= endMs)) continue;
    if (row.action === 'approve') approved += 1;
    else if (row.action === 'edit') edited += 1;
    else if (row.action === 'reject') rejected += 1;
  }
  const briefs = approved + edited + rejected;
  const approvedShare = briefs === 0 ? null : approved / briefs;
  const approvedPct = approvedShare === null ? null : Math.floor(approvedShare * 100);
  const grant = activeGrantFor(grants, type);

  let reason = null;
  if (isFrozen()) reason = 'SOCIAL_FREEZE is set';
  else if (grant) reason = 'already has an active grant';
  else if (briefs < MIN_BRIEFS) reason = `needs ${MIN_BRIEFS}`;
  else if (rejected > 0) reason = `${rejected} rejection${rejected === 1 ? '' : 's'} in the last ${ELIGIBILITY_WINDOW_DAYS} days`;
  else if (approvedShare < MIN_APPROVED_SHARE) reason = `only ${approvedPct}% plain approvals, needs ${MIN_APPROVED_PCT}%`;

  return { eligible: reason === null, briefs, approvedPct, rejected, reason };
}
