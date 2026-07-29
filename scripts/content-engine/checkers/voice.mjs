// Voice checker (deterministic, NO NETWORK).
//
// Issue #461 (Joey, 2026-07-15): "Content calls her 'Swift' more than
// 'Taylor' — no fan actually talks like this." Quantified site-wide: bare
// 'Swift' outnumbered 'Taylor' in every single era seed file. The voice
// standard (docs/content-ops/editorial-voice-and-pipeline.md) already
// documented a fan-editor voice and a cut-on-sight AI-tell list, but named no
// explicit naming rule and had zero automated enforcement — guidance that
// only lives in a markdown file drifts the next time content gets authored.
//
// This checker is the enforcement half of the three-part fix Joey asked for
// (the doc got its explicit naming rule in the same change that added this
// checker). Two independent findings per item:
//
//   content.voice.surname-overuse — bare "Swift" (not part of "Taylor
//     Swift", and not inside a direct quote) at or above the count of
//     "Taylor" in the same prose. Real fans default to her first name in
//     running prose; repeated bare-surname reference is a news-reporter
//     tic. Quoted spans are excluded because a quote is someone else's real
//     words, not the item's own voice — rewriting a quote to swap the name
//     would be a fabrication risk, not a voice fix.
//
//   content.voice.ai-tell — the literal cut-on-sight AI-tell phrases the
//     voice doc already lists (wire-service throat-clearing, hedging
//     qualifiers, "Taylor Swift, the American singer-songwriter…"). These
//     were documented but never checked against; this makes the existing
//     rule real.
//
// KNOWN LIMIT, by design: quote-stripping only recognizes straight and curly
// double quotes ("…", "…"). Single-quoted dialogue is deliberately NOT
// stripped — apostrophes in contractions ("Swift's," "wasn't") make reliable
// single-quote span detection impractical without a real parser, and the
// false-negative cost (a quote's "Swift" counted as bare) is much cheaper
// than the false-positive cost (silently excluding real running prose).
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.voice';

// A bare "Swift" is fine as part of a full name; only the surname alone, on
// its own, is the news-reporter tic. The lookbehind excludes ANY capitalized
// word directly before "Swift" — not just "Taylor" — because the corpus
// genuinely contains other "[Name] Swift" references that are NOT Taylor:
// her family (Andrea Swift, Scott Swift, Austin Swift), an outlet's own
// brand name ("Nicki Swift"), and one-off name collisions. A real bug from
// this exact gap: an early draft of this checker's own companion fix-up
// pass rewrote "Austin Swift" (her brother) into "Austin Taylor" before this
// lookbehind was widened — never assume "Swift" alone means Taylor Swift
// when a name immediately precedes it.
const BARE_SWIFT = /(?<![A-Z][a-z]+ )\bSwift\b/g;
const TAYLOR = /\bTaylor\b/g;

// Strip double-quoted spans (straight " " and curly " ") before counting —
// a direct quote is someone else's words, not the item's own voice.
function stripQuotes(text) {
  return text.replace(/"[^"]*"|“[^”]*”/g, '');
}

// A bare-surname item needs enough running prose to judge fairly — a
// one-line snippet that happens to open "Swift's..." isn't the pattern
// Joey's complaint describes. Below this, a single occurrence is noise.
const MIN_CHARS_TO_JUDGE = 60;

export async function checkSurnameOveruse(items) {
  const findings = [];
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts ?? {})) {
      if (typeof text !== 'string' || text.length < MIN_CHARS_TO_JUDGE) continue;
      const stripped = stripQuotes(text);
      const bareSwift = (stripped.match(BARE_SWIFT) ?? []).length;
      if (bareSwift === 0) continue;
      const taylor = (stripped.match(TAYLOR) ?? []).length;
      // Flag once bare "Swift" meets or exceeds "Taylor" — the exact
      // pattern Joey's count identified (Swift outnumbering Taylor).
      if (bareSwift < taylor) continue;

      findings.push(
        makeFinding({
          checker: `${id}.surname-overuse`,
          severity: 'P2',
          title: 'Bare "Swift" outnumbers "Taylor" — reads like wire copy, not a fan',
          itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field },
          excerpt: text.slice(0, 300),
          evidence: `${bareSwift} bare "Swift" reference(s) vs. ${taylor} "Taylor" reference(s) in \`${field}\` (quoted spans excluded). Real fans default to "Taylor" (or an era-appropriate nickname) in running prose; repeated bare-surname reference is a news-reporter tic (issue #461).`,
          suggestedFix:
            'Rewrite using "Taylor" as the default in running prose. Bare "Swift" stays only for: a direct quote (leave quoted words untouched), a formal award/chart/catalog name that contains the surname, or the sentence\'s first reference alongside her full name ("Taylor Swift").',
          confidence: 0.75,
        }),
      );
    }
  }
  return findings;
}

// The documented (but previously unenforced) cut-on-sight AI-tell list —
// docs/content-ops/editorial-voice-and-pipeline.md § "Cut on sight". Kept as
// literal substrings/patterns matching the doc's own list, not a fuzzy
// model — a deterministic checker should never guess at tone.
const AI_TELLS = [
  { label: '"In this article..." throat-clearing', re: /\bin this article\b/i },
  { label: '"It is worth noting that..." hedge', re: /\bit is worth noting that\b/i },
  {
    label: 'Wire-style full-name-plus-bio opener ("Taylor Swift, the American singer-songwriter...")',
    re: /\bTaylor Swift,\s*the\s+(?:American\s+)?(?:singer(?:-songwriter)?|musician|artist|pop star)\b/i,
  },
  { label: 'Hedging qualifier ("it seems")', re: /\bit seems\b/i },
  { label: 'Hedging qualifier ("reportedly appears to")', re: /\breportedly appears to\b/i },
  { label: 'Corporate throat-clearing ("we will explore")', re: /\bwe will explore\b/i },
];

export async function checkAiTells(items) {
  const findings = [];
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts ?? {})) {
      if (typeof text !== 'string') continue;
      for (const tell of AI_TELLS) {
        const m = text.match(tell.re);
        if (!m) continue;
        findings.push(
          makeFinding({
            checker: `${id}.ai-tell`,
            severity: 'P2',
            title: `AI-tell phrase in copy: ${tell.label}`,
            itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field },
            excerpt: text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40),
            evidence: `Matched the documented cut-on-sight AI-tell list (docs/content-ops/editorial-voice-and-pipeline.md): "${m[0]}".`,
            suggestedFix: 'Rewrite the sentence in fan-editor voice — cut the hedge/throat-clearing entirely rather than softening it.',
            confidence: 0.85,
          }),
        );
      }
    }
  }
  return findings;
}

export async function check(items) {
  const [surname, aiTell] = await Promise.all([checkSurnameOveruse(items), checkAiTells(items)]);
  return [...surname, ...aiTell];
}
