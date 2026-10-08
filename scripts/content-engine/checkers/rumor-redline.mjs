// Rumor Desk privacy-redline checker — the debt the 2026-07-25 auto-merge
// decision record took on and named:
//
//   "If a redline violation ships, the fix is to add a deterministic checker for
//    it in scripts/content-engine/, not to restore a human gate that was not
//    being exercised in time to help."
//
// Rumor Desk publishes to longlivets.com with no human read, and currently runs
// roughly daily (a standalone trigger on odd days plus an orchestrator lane on
// even ones) rather than every other day as designed — so the window this covers
// is wider than the grant assumed.
//
// The rules themselves live in scripts/lib/rumor-redlines.mjs, because they bind
// in TWO places and must never be written down twice:
//
//   • validate-content.mjs hard-fails the blocking subset  → the merge never happens
//   • this checker files every rule as a Karen finding      → catches what is already live
//
// Those are not redundant. A P0 ticket filed after a redline violation is
// already on the internet is not the same thing as a merge that never happened;
// the blocking binding is the one that actually pays the debt, and this one is
// the net under it for content that landed before the rule existed.
//
// This checker adds no rules of its own — it is the Finding-shaped adapter.
import { makeFinding } from '../lib/finding.mjs';
import { rumorRedlineViolations } from '../../lib/rumor-redlines.mjs';

export const id = 'safety.rumor-redline';

export async function check(items) {
  const findings = [];

  for (const it of items) {
    // Read the RAW seed shape, not the generated one — same reason
    // rumor-lifecycle does: a claim the generator dropped for being malformed
    // must still be visible to the safety layer. A dropped claim is invisible
    // on the site but it is still sitting in the seed file waiting for the
    // typo that revives it.
    const rumors = it.raw?.moment?.rumors ?? it.raw?.rumors;
    if (!Array.isArray(rumors) || rumors.length === 0) continue;

    const ctx = { category: it.category ?? it.raw?.category };

    rumors.forEach((r, ri) => {
      for (const v of rumorRedlineViolations(r, ctx)) {
        findings.push(
          makeFinding({
            checker: id,
            severity: v.severity,
            title: `${v.title} — "${it.title}"`,
            itemRef: {
              type: it.type,
              file: it.file,
              era: it.era,
              key: it.key,
              field: `rumors[${ri}]`,
            },
            excerpt: v.excerpt,
            evidence: `[${v.rule}] ${v.evidence}`,
            suggestedFix: v.fix,
            // Every rule here fires on structure — a field value, a field's
            // absence, or two fields disagreeing — so there is no model
            // judgment to discount. RR4 consults prose, but only to name a
            // category inside a set a structural provenance gate already
            // selected, so its confidence is the same.
            confidence: 1,
            // Safety P0s pin to the top of the run report. A blocking rule
            // reaching this checker at all means it landed before the rule
            // existed, or on a path that skips validate-content.
            escalate: v.severity === 'P0',
          }),
        );
      }
    });
  }

  return findings;
}
