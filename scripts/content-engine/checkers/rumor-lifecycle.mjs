// Rumor lifecycle checker — the queue that keeps the rumor system honest.
//
// The rumor pipeline (docs/content-ops/rumor-pipeline.md) admits unverified
// claims on the promise that they get resolved over time. That promise is the
// entire basis for carrying them at all, and it is only kept if something
// tracks which claims are overdue. Without this checker the Vault accumulates
// permanent maybes, which is strictly worse than not carrying rumors: a claim
// labeled "unconfirmed" for three months reads as "still live" when the truth
// is "nobody ever looked again".
//
// Findings here are work for the Rumor Desk, not content bugs.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.rumor-lifecycle';

/** Days after which an unresolved claim is overdue for a re-check. */
const RECHECK_DAYS = 21;
/** Days after which an unresolved, quiet claim should be proposed as `faded`. */
const FADE_DAYS = 45;

const DAY_MS = 86_400_000;

function daysSince(iso, now) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / DAY_MS);
}

/**
 * `items` are the engine's normalized content items. We read the raw seed
 * shape (`it.raw.moment.rumors`) rather than the generated one so a claim
 * dropped by the generator for being malformed still gets surfaced.
 */
export async function check(items, opts = {}) {
  const now = opts.now ?? Date.now();
  const findings = [];

  for (const it of items) {
    const rumors = it.raw?.moment?.rumors ?? it.raw?.rumors;
    if (!Array.isArray(rumors) || rumors.length === 0) continue;

    rumors.forEach((r, ri) => {
      if (!r || typeof r !== 'object') return;
      const at = { type: it.type, file: it.file, era: it.era, key: it.key, field: `rumors[${ri}]` };
      const claim = String(r.claim ?? '').slice(0, 160);
      const resolved = r.status === 'confirmed' || r.status === 'debunked' || r.status === 'faded';

      // A resolved claim is done — it stays on the page as a record, but it
      // never needs another look.
      if (resolved) return;

      const reportedAge = daysSince(r.reportedOn, now);
      const checkedAge = daysSince(r.lastCheckedOn, now);

      // Never audited at all. This is the one that matters most: it is
      // indistinguishable, on the page, from a claim we re-checked yesterday.
      if (r.lastCheckedOn == null) {
        findings.push(
          makeFinding({
            checker: id,
            severity: reportedAge != null && reportedAge >= RECHECK_DAYS ? 'P1' : 'P2',
            title: `Rumor never re-checked in "${it.title}"`,
            itemRef: at,
            excerpt: claim,
            evidence:
              `Status "${r.status}" with no lastCheckedOn` +
              (reportedAge != null ? `, reported ${reportedAge}d ago.` : '.') +
              ' A reader cannot tell this from a claim verified yesterday.',
            suggestedFix:
              'Rumor Desk: search for follow-up coverage. Promote with a resolution citation, ' +
              'debunk with one, or set lastCheckedOn to today to record that you looked and found nothing.',
            confidence: 1,
          }),
        );
        return;
      }

      // Quiet long enough that "unconfirmed" has become misleading.
      if (reportedAge != null && reportedAge >= FADE_DAYS && checkedAge != null && checkedAge >= RECHECK_DAYS) {
        findings.push(
          makeFinding({
            checker: id,
            severity: 'P2',
            title: `Rumor has gone quiet — propose faded in "${it.title}"`,
            itemRef: at,
            excerpt: claim,
            evidence: `Reported ${reportedAge}d ago, last checked ${checkedAge}d ago, still "${r.status}".`,
            suggestedFix:
              'Re-check once more. If there is still no confirmation or denial, set status "faded" ' +
              'so the page says "reported in <month>, never confirmed or denied" instead of implying it is live.',
            confidence: 0.9,
          }),
        );
        return;
      }

      // Overdue for a routine re-check.
      if (checkedAge != null && checkedAge >= RECHECK_DAYS) {
        findings.push(
          makeFinding({
            checker: id,
            severity: 'P3',
            title: `Rumor re-check overdue in "${it.title}"`,
            itemRef: at,
            excerpt: claim,
            evidence: `Last checked ${checkedAge}d ago (threshold ${RECHECK_DAYS}d).`,
            suggestedFix: 'Rumor Desk: re-check and update lastCheckedOn, or resolve it.',
            confidence: 1,
          }),
        );
      }
    });
  }

  return findings;
}
