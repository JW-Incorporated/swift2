// T7 — the Monday ladder-standing block (docs/specs/tree-overhaul/
// t7-autonomy-ladder.md, Mechanics: "an eligibility() block in the Monday
// brief listing every type's standing... so the ladder's state is visible
// every week whether or not anything is proposed"). Wave 4 read-only scope
// only — no proposal text lives here; that is Wave 5's `tree-weekly-plan.md`
// job, once a founder can actually grant something.
import { pillarOf } from './feedback.mjs';
import { eligibility } from './autonomy.mjs';

// S3's pillarOf table (feedback.mjs's own unexported PILLAR_ARITY) has
// exactly these five queue-item-producing prefixes (docs/marketing/
// social-strategy.md §1 a-e); "(f) Human reach" produces no posts and has
// no ladder standing. Duplicated here rather than imported for the same
// reason autonomy.mjs duplicates the `social/queue/` literal — the source
// object isn't exported.
const CAMPAIGN_FAMILY_PREFIXES = ['launch:', 'thread:', 'timeline:', 'mood:', 'heartbeat:'];

const DRAFT_ROW_PREFIX = 'social/queue/';

function isDraftRow(row) {
  return typeof row?.file === 'string' && row.file.startsWith(DRAFT_ROW_PREFIX);
}

/**
 * Every distinct `pillarOf()` value seen among draft rows, one list per
 * known family prefix, alphabetical within a family. A family with no
 * discovered type at all is represented by its bare prefix instead —
 * `pillarOf()` never returns a bare prefix, so `eligibility()` on it always
 * reads as 0 briefs, an honest "nothing yet" placeholder rather than a real
 * (and potentially misleading) count. This guarantees every one of the five
 * families always renders something, even against an empty ledger (spec
 * AC#10 / the Wave 4 gate).
 */
export function discoverTypes(ledgerRows) {
  const byPrefix = new Map(CAMPAIGN_FAMILY_PREFIXES.map((p) => [p, new Set()]));
  for (const row of ledgerRows ?? []) {
    if (!isDraftRow(row)) continue;
    const type = pillarOf(row?.campaign);
    if (typeof type !== 'string') continue;
    const prefix = CAMPAIGN_FAMILY_PREFIXES.find((p) => type.startsWith(p));
    if (prefix) byPrefix.get(prefix).add(type);
  }
  const types = [];
  for (const prefix of CAMPAIGN_FAMILY_PREFIXES) {
    const found = [...byPrefix.get(prefix)].sort();
    types.push(...(found.length > 0 ? found : [prefix]));
  }
  return types;
}

/**
 * One `eligibility()` call per discovered type (or per placeholder prefix)
 * — the full data behind the Monday ladder-standing block. `ledgerRows`
 * should be the full, unwindowed ledger (eligibility() applies its own
 * trailing-28-day window per type internally), not the caller's own
 * 7-day-windowed rows.
 */
export function buildLadderStanding(ledgerRows, now = Date.now()) {
  return discoverTypes(ledgerRows).map((type) => ({ type, ...eligibility(ledgerRows, type, now) }));
}

function line({ type, eligible, briefs, approvedPct, reason }) {
  if (eligible) return `${type} — ${briefs} briefs, ${approvedPct}% ✅, eligible`;
  return `${type} — ${briefs} brief${briefs === 1 ? '' : 's'}, ${reason}`;
}

/**
 * The verbatim block Tree pastes into the Monday brief — never paraphrased
 * (same convention as weekly-scorecard.mjs's renderScorecard/
 * renderCalibration). `standings` missing or empty (an older caller that
 * never wired buildLadderStanding through) renders one honest sentence
 * rather than throwing or silently omitting the section.
 */
export function renderLadderStanding(standings) {
  if (!standings || standings.length === 0) {
    return '**Autonomy ladder standing:** no campaign families to report yet';
  }
  return ['**Autonomy ladder standing:**', ...standings.map(line)].join('\n');
}
