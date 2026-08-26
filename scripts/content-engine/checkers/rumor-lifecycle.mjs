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
/**
 * Days after which a MOMENT-LEVEL sub-confirmed `confidence` is overdue for a
 * re-check. Slightly longer than RECHECK_DAYS: this is the whole page's
 * framing rather than one line item, so it moves less often and a false alarm
 * is more expensive.
 */
const CONFIDENCE_RECHECK_DAYS = 30;

/**
 * Confidence tiers that render the loud "not confirmed" banner. Kept as a
 * literal list rather than imported from the TS types on purpose — the engine
 * is plain .mjs tooling with no build step, and a drift here shows up as a
 * missing finding, so the test asserts the list against types.ts.
 */
const SUB_CONFIRMED = new Set([
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'joke_meme',
  'disproven',
]);

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
    checkMomentConfidence(it, now, findings);

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


/**
 * The moment-level `confidence` field renders the big "Reported — not
 * confirmed" banner at the top of a page. Nothing used to re-check it.
 *
 * Founder (Wyatt, 2026-07-21), after Lex incidentally noticed a stale banner:
 * "I don't think Lex will be reading all articles every night, might make
 * sense to add that to Karen or someone else's scope to explicitly check if
 * the banner status is still accurate or needs updating."
 *
 * Correct, and it is the difference between a sweep and a coincidence. Lex is
 * opportunistic: it works whatever falls in its shard, and it SKIPS anything
 * that already has an open ledger — so a page whose banner went stale after
 * Lex last visited may never be looked at again. A deterministic checker walks
 * every item every run, which is the only way the latency is bounded.
 *
 * There is no `confidenceCheckedOn` field and this deliberately does not add
 * one: a new field means touching the normalizer AND the serializer, and that
 * pair has silently dropped data three times in this repo. Instead it uses the
 * newest source `accessed_at` as the proxy for "when we last looked", which is
 * both already present and the same evidence a human would use — exactly how
 * Lex phrased it on #1022, "as of its 2026-07-09 sources".
 */
function checkMomentConfidence(it, now, findings) {
  const confidence = it.raw?.moment?.confidence ?? it.raw?.confidence;
  if (typeof confidence !== 'string' || !SUB_CONFIRMED.has(confidence)) return;

  const sources = it.raw?.moment?.sources ?? it.raw?.sources ?? [];
  const ages = (Array.isArray(sources) ? sources : [])
    .map((src) => daysSince(src?.accessed_at, now))
    .filter((d) => d != null);
  // Newest source = the most recent time anyone demonstrably looked.
  const freshest = ages.length ? Math.min(...ages) : null;

  if (freshest != null && freshest < CONFIDENCE_RECHECK_DAYS) return;

  findings.push(
    makeFinding({
      checker: id,
      severity: 'P1',
      title: `Page banner still says "not confirmed" and has not been re-checked: "${it.title}"`,
      itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field: 'confidence' },
      excerpt: String(it.title ?? '').slice(0, 160),
      evidence:
        `confidence: "${confidence}" renders the loud not-confirmed banner. ` +
        (freshest == null
          ? 'No source carries an accessed_at, so there is no evidence anyone has ever re-verified this framing.'
          : `The newest source was accessed ${freshest}d ago (threshold ${CONFIDENCE_RECHECK_DAYS}d).`) +
        ' A banner that outlives the truth is worse than no banner: it tells readers a confirmed fact is unconfirmed, ' +
        'and it trains them to ignore the label on the claims where it genuinely matters.',
      suggestedFix:
        'Re-verify against current sources. If it is now confirmed on the record, raise `confidence`, ' +
        'reconcile the hedging language in the prose so words and field agree, and cite the confirmation ' +
        '(docs/content-ops/depth-push.md, "a stale status is a field fix"). If it is still unconfirmed, ' +
        'refresh accessed_at on a source to record that someone actually looked.',
      confidence: 0.9,
    }),
  );
}
