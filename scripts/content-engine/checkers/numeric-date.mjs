// Deterministic claim-risk checker: flags the high-stakes factual claims that
// most need verification (superlatives, quantitative records, dates) so the
// factual-review agents — and humans — spend attention where a wrong word does
// the most damage. It does NOT decide truth (no network); it routes risk.
// A single-source, high-visibility superlative is exactly the "casual wording
// is a disaster" failure mode the brief calls out.
import { makeFinding } from '../lib/finding.mjs';
import { tier } from '../lib/visibility.mjs';

const SUPERLATIVE = /\b(first|biggest|largest|highest|longest|most|best|youngest|oldest|fastest|greatest|only|record[- ]?(?:setting|breaking)?)\b/i;
const SCOPE = /\b(ever|in history|of all time|all[- ]time|to date|on record|in the world|worldwide|of the (?:decade|century|year))\b/i;
const CHARTY = /\b(no\.?\s*1|#\s*1|number one|debuts? at|album of the year|grammy|billion(?:aire)?)\b/i;
const QUANT = /(\$[\d][\d,.]*|\b\d[\d,]*\s*(?:million|billion|thousand|records?|weeks?|shows?|tickets?|copies|units|nights?|%)\b)/i;
// Attributed public statements / event-occurrence claims — the class that has NO
// stat/superlative and so used to slip through with zero scrutiny, but is a prime
// place for a hallucinated event ("recapped the wedding on the podcast"). A verb
// of public utterance/occurrence near a public venue or recency marker gets routed.
const ATTRIBUTION = /\b(said|told|announced|confirmed|revealed|recounted|recapped|detailed|addressed|reflected|opened up|spoke about|talked about|walked through|debriefed|shared|posted|tweeted|explained|admitted)\b/i;
const PUBLIC_VENUE = /\b(podcast|episode|interview|new heights|instagram|red carpet|press conference|on stage|onstage|livestream|statement|first-person|honeymoon debrief)\b/i;
const RECENCY = /\b(yesterday|last night|this (?:week|morning|weekend)|days? ago|just|recently|now a|newly[- ]wed|post[- ]wedding)\b/i;

const splitSentences = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
const nowYmd = new Date().toISOString().slice(0, 10);

export const id = 'fact.claim-risk';

export async function check(items) {
  const findings = [];
  for (const it of items) {
    const hi = tier(it) === 'high';
    const singleSource = (it.sources?.length ?? 0) <= 1;

    // 1) Future / impossible dates (moments carry a structured date).
    if (it.type === 'moment') {
      const y = it.raw?.year, m = it.raw?.month, d = it.raw?.day;
      if (Number.isInteger(y) && Number.isInteger(m)) {
        const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d ?? 1).padStart(2, '0')}`;
        if (m < 1 || m > 12 || (d != null && (d < 1 || d > 31))) {
          findings.push(makeFinding({
            checker: id, severity: 'P1', title: `Invalid date on "${it.title}"`,
            itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field: 'date' },
            excerpt: ymd, evidence: `Month/day out of range (${ymd}).`,
            suggestedFix: 'Correct the year/month/day to a valid, sourced date.', confidence: 0.95,
          }));
        } else if (ymd > nowYmd) {
          findings.push(makeFinding({
            checker: id, severity: 'P1', title: `Future-dated moment "${it.title}"`,
            itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field: 'date' },
            excerpt: ymd, evidence: `Dated ${ymd}, which is in the future (today ${nowYmd}).`,
            suggestedFix: 'Confirm the event has actually happened and fix the date, or remove until it has.',
            confidence: 0.9,
          }));
        }
      }
    }

    // 2) Superlative + quantitative claim risk (route to verification).
    for (const [field, text] of Object.entries(it.texts)) {
      for (const s of splitSentences(text)) {
        const hasSuper = SUPERLATIVE.test(s);
        const hasScopeOrNum = SCOPE.test(s) || QUANT.test(s) || CHARTY.test(s);
        const isSuperlativeClaim = hasSuper && hasScopeOrNum;
        const isRecordStat = CHARTY.test(s) && QUANT.test(s);
        // Attributed public statement / event-occurrence: a verb of utterance or
        // occurrence next to a public venue or a recency marker. High-risk for a
        // fabricated event even with no number in the sentence.
        const isEventClaim = ATTRIBUTION.test(s) && (PUBLIC_VENUE.test(s) || RECENCY.test(s));
        if (!isSuperlativeClaim && !isRecordStat && !isEventClaim) continue;

        // Priority: high-visibility + single-source claims are the worst; an
        // event-occurrence claim on a latest-news item is exactly the miss class.
        const severity = hi ? 'P1' : isSuperlativeClaim || isEventClaim ? 'P2' : 'P3';
        const kind = isEventClaim ? 'Event/statement-occurrence' : isSuperlativeClaim ? 'Superlative' : 'Record/stat';
        findings.push(makeFinding({
          checker: id, severity,
          title: `Verify claim: "${s.slice(0, 70)}${s.length > 70 ? '…' : ''}"`,
          itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field },
          excerpt: s.slice(0, 400),
          evidence: `${kind} claim${hi ? ' on a HIGH-VISIBILITY item' : ''}${singleSource ? ', single-sourced' : ''}. ${isEventClaim ? 'Confirm the event/public statement actually occurred and that the cited source is about THIS claim (not a narrower/different one) — do not assume the draft is true.' : 'Needs source-grounded verification (exact figure, record scope, date).'}`,
          suggestedFix: isEventClaim ? 'Independently confirm the event/statement happened; if unconfirmed or the source is about something else, correct or cut it.' : 'Confirm the exact figure/record against a primary source; soften to what the source supports if it overstates.',
          // Sub-issue-floor by design: claim-risk ROUTES claims to the factual
          // agent (which files confirmed errors); it is never itself a defect.
          confidence: hi && singleSource ? 0.45 : 0.3,
          sources: (it.sources ?? []).map((s2) => s2.url),
        }));
      }
    }
  }
  return findings;
}
