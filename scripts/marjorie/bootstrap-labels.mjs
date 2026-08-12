// Idempotent label bootstrap for the desk system (CLAUDE.md rule 8: repo
// setup is code, not a remembered checklist). Issue forms only apply labels
// that already exist, and assemble-brief.mjs / watchdog.yml query by label —
// so a fresh repo (or the future org home, see org-transfer plans) must run
// this once:  node scripts/marjorie/bootstrap-labels.mjs
import { gh } from '../lib/gh.mjs';

// The `desk:*` routing taxonomy (2026-08-11). EXACTLY ONE of these on an open
// issue is what "routed" means — see scripts/check-work-ownership.mjs and
// docs/proposals/2026-08-11-autonomous-pickup-and-merge-delegation.md.
//
// Why a label and not the assignee: GitHub assignees must be repo
// collaborators, this repo has exactly two, and both are bot identities every
// agent runs under. An assignee therefore cannot name a desk. Assignment keeps
// the meaning Austin's charter already gave it — a CLAIM LOCK on a specific
// run — and the label carries the route.
//
// `desk:unowned` is a first-class answer, not a failure to answer: it is how
// "no charter covers this" becomes a countable state instead of something
// nobody is chartered to notice.
const DESKS = [
  ['desk:ops', 'Chief of staff (Marjorie) — coordination, briefs, cross-desk chores'],
  ['desk:build', 'Build desk (Austin) — app code inside his change-type fence'],
  ['desk:content', 'Content desk (Content Shift / Vault Run) — seed content authoring'],
  ['desk:integrity', 'Integrity desk (Karen) — content-engine findings and checkers'],
  ['desk:critic', 'Critic desk (Nils) — site experience findings'],
  ['desk:a11y', 'Accessibility desk (Laura) — WCAG findings'],
  ['desk:security', 'Security desk (Paul Blart) — dependencies, supply chain, CI/security config'],
  ['desk:growth', 'Growth desk — social drafting and community'],
  ['desk:founder', 'A human founder owes an action here (TX items, legal, product intent)'],
  ['desk:unowned', 'NO CHARTER COVERS THIS — the fence complement, deliberately countable'],
];

export const LABELS = [
  ['founder-decision', 'B60205', 'Needs a founder answer — banked into the daily Founders Brief'],
  ['founders-brief', '0E8A16', 'The daily Founders Brief issues (Marjorie)'],
  ['watchdog-alert', 'D93F0B', 'A scheduled cadence failed — loud by design'],
  ['intake', '1D76DB', 'Real-world event dropped for content authoring'],
  ['needs-sources', 'FBCA04', 'Intake item stalled on real sourcing'],

  ...DESKS.map(([name, description]) => [
    name,
    name === 'desk:unowned' ? 'D93F0B' : name === 'desk:founder' ? 'B60205' : '5319E7',
    description,
  ]),

  // Splits `needs-human-review`, which currently means two opposite things
  // (docs/decisions.md 2026-08-11). Austin applies it when Codex DISAGREED and
  // the disagreement stands; Content Shift applies it when Codex was merely
  // UNREACHABLE. "Contested" and "unreviewed" are not the same risk, and the
  // 2026-07-18 standing grant lets that class be merged on the assumption it
  // is the benign one.
  [
    'review:not-run',
    'C5DEF5',
    'Codex review could not run in the authoring environment — unreviewed, not contested',
  ],
  [
    'review:contested',
    'B60205',
    'Codex review ran and a finding stands unresolved — a human must adjudicate',
  ],

  // Founder-mail semantics (2026-08-11 four-email incident, #1955-#1958):
  // `founder-task` MAILS the founders (tree-mail.yml digest, body verbatim),
  // so it is reserved for "a human must personally act, body written for a
  // non-coder per docs/agents/founder-comms.md". Agent-to-agent coordination
  // gets `desk-coordination` and mails no one. `founder-mailed` is the
  // digest's machine-only exactly-once bookkeeping.
  // (GitHub caps label descriptions at 100 chars.)
  [
    'founder-task',
    'C5DEF5',
    'A human founder must personally act; body written for a non-coder (docs/agents/founder-comms.md)',
  ],
  [
    'desk-coordination',
    'EDEDED',
    'Agent-to-agent coordination (merge order, file claims) — mails no one',
  ],
  ['founder-mailed', 'F9D0C4', 'Machine-only: the tree-mail digest already emailed this issue'],
];

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  for (const [name, color, description] of LABELS) {
    try {
      await gh([
        'label',
        'create',
        name,
        '--color',
        color,
        '--description',
        description,
        '--force',
      ]);
      console.log(`ok: ${name}`);
    } catch (e) {
      console.error(`FAILED: ${name}: ${e.message}`);
      process.exitCode = 1;
    }
  }
}
