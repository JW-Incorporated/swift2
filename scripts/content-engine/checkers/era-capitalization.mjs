// Era/album capitalization checker (deterministic, NO NETWORK).
//
// docs/definition-of-done.md item 8 (Joey, 2026-08-11 in-person): "we may be
// inconsistent on capitalization vs. the official album stylings. Can't get
// that wrong." The official stylings (verified against the album covers /
// Wikipedia / the official store during the 2026-09-05 audit):
//   lowercase, ALWAYS, even at sentence start:  folklore, evermore, reputation
//   capitalized (standard title case):          Taylor Swift, Fearless,
//     Speak Now, Red, 1989, Lover, Midnights, The Tortured Poets Department,
//     The Life of a Showgirl — including the "(Taylor's Version)" suffix.
//
// This checker catches GENUINE drift, not the styling itself:
//   content.era-capitalization.stylized-title-miscased — "Folklore"/"Evermore"/
//     "Reputation" used as if they were ordinary title-case words (mid-sentence
//     noun/adjective use, a display title, a headline). This is the hard part:
//     sentence-initial "Folklore" is INDISTINGUISHABLE from a genuine miscasing
//     by capitalization alone, so a leading-position hit is a lower-confidence,
//     review-only finding (never auto-"fixed"); a mid-sentence hit (preceded by
//     a lowercase word or nothing that would justify a capital) is the strong,
//     default-severity signal. Known deliberate non-matches (do NOT flag):
//       - quoted outlet headlines / real article titles (source_title,
//         quoted strings that are literally a publication's own title) —
//         those are what the outlet wrote, not this repo's prose
//       - "reputation Stadium Tour" / "Reputation Stadium Tour" — the tour's
//         own established proper-noun name as commonly rendered by press
//         (out of scope for this pass; tracked separately, see the
//         2026-09-05 audit note in docs/definition-of-done.md item 8)
//       - "Evermore Park" — a real, unrelated third-party business name, not
//         Taylor's album
//   content.era-capitalization.bad-ttpd-abbreviation — "Ttpd" (mixed case,
//     never a real styling) where "The Tortured Poets Department" or the
//     all-caps acronym "TTPD" was clearly meant.
//
// This checker is READ-ONLY, same contract as every other checker in this
// engine — it proposes findings; it never edits seed content.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.era-capitalization';

// Real full album/era titles that ARE correctly capitalized — never flagged.
const CORRECT_CAPITALIZED = [
  'The Tortured Poets Department',
  'The Life of a Showgirl',
  'Taylor Swift',
  'Fearless',
  'Speak Now',
  'Midnights',
];

// The three lowercase-styled album/era names. Matched case-sensitively for
// the miscased ("Folklore"/"Evermore"/"Reputation") form only.
const LOWERCASE_ERAS = ['Folklore', 'Evermore', 'Reputation'];

// Known-legitimate proper-noun phrases that legitimately keep a capital
// letter on one of the three lowercase-styled names — these are NOT the
// album title itself, so they are exempted rather than flagged.
const ALLOWED_PHRASES = [
  /\bReputation Stadium Tour\b/,
  /\bReputation[ _]Stadium[ _]tour\b/i,
  /\bEvermore Park\b/,
  /\bReputation_Stadium_Tour\b/,
  /\bReputation \(album\)/,
];

// A direct quote (straight/curly double quotes) is someone else's words —
// an outlet's own headline, a lyric excerpt, etc. — not this repo's prose;
// same exclusion voice.mjs uses for the identical reason.
function stripQuotes(text) {
  return text.replace(/"[^"]*"|“[^”]*”/g, (m) => ' '.repeat(m.length));
}

/**
 * Find genuine mid-sentence/title miscasings of a lowercase-styled era name.
 * A "mid-sentence" hit is one NOT at the very start of the (quote-stripped)
 * text and NOT immediately preceded by sentence-ending punctuation + space
 * (which would make it ambiguous — could be sentence-initial styling —
 * so those are lower-confidence findings, not skipped, per the DoD's own
 * instruction to "define the rule set in the checker, not in people's heads").
 */
function findMiscasedEras(text) {
  const hits = [];
  for (const era of LOWERCASE_ERAS) {
    const re = new RegExp(`\\b${era}\\b`, 'g');
    let m;
    while ((m = re.exec(text))) {
      const idx = m.index;
      const before = text.slice(Math.max(0, idx - 40), idx);
      const matchedPhrase = text.slice(Math.max(0, idx - 20), idx + era.length + 20);
      if (ALLOWED_PHRASES.some((p) => p.test(matchedPhrase))) continue;
      // Sentence-initial position: start of string, or preceded by
      // [.!?] + whitespace, or a line-start after a dash/quote opener.
      const precedingTrim = before.replace(/\s+$/, '');
      const sentenceInitial =
        idx === 0 ||
        /[.!?]\s*$/.test(before) ||
        /^[\s"'“(—-]*$/.test(before);
      hits.push({ era, index: idx, sentenceInitial, context: text.slice(Math.max(0, idx - 60), idx + era.length + 60) });
    }
  }
  return hits;
}

export async function checkStylizedTitleMiscased(items) {
  const findings = [];
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts ?? {})) {
      if (typeof text !== 'string' || !text) continue;
      const stripped = stripQuotes(text);
      const hits = findMiscasedEras(stripped);
      for (const hit of hits) {
        findings.push(
          makeFinding({
            checker: `${id}.stylized-title-miscased`,
            severity: 'P2',
            title: `"${hit.era}" capitalized as if title-case — the styling is always lowercase`,
            itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field },
            excerpt: hit.context,
            evidence: hit.sentenceInitial
              ? `"${hit.era}" appears at what looks like the start of a sentence/title in \`${field}\` — could be a genuine miscasing (a title/display field, or a mid-sentence use split across a line) rather than the correct sentence-initial lowercase styling. Needs human review; not auto-fixable from capitalization alone.`
              : `"${hit.era}" appears mid-sentence in \`${field}\`, not at a sentence boundary — this is the album's officially all-lowercase styling used as if it were a normal title-case word (docs/definition-of-done.md item 8).`,
            suggestedFix: `Lowercase to "${hit.era.toLowerCase()}" — the album/era is stylized in all lowercase everywhere, including mid-sentence and at the start of a sentence (that sentence-initial lowercase is the point of the styling, not a typo to "fix" the other way).`,
            confidence: hit.sentenceInitial ? 0.4 : 0.75,
          }),
        );
      }
    }
  }
  return findings;
}

// "Ttpd" in mixed case is never a real styling — the acronym is either
// spelled out ("The Tortured Poets Department") or rendered all-caps ("TTPD").
const BAD_TTPD = /\bTtpd\b/g;

export async function checkBadTtpdAbbreviation(items) {
  const findings = [];
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts ?? {})) {
      if (typeof text !== 'string') continue;
      const matches = [...text.matchAll(BAD_TTPD)];
      if (!matches.length) continue;
      findings.push(
        makeFinding({
          checker: `${id}.bad-ttpd-abbreviation`,
          severity: 'P2',
          title: '"Ttpd" is not a real styling — spell out the title or use all-caps TTPD',
          itemRef: { type: it.type, file: it.file, era: it.era, key: it.key, field },
          excerpt: text.slice(Math.max(0, matches[0].index - 60), matches[0].index + 64),
          evidence: `${matches.length} mixed-case "Ttpd" match(es) in \`${field}\` — neither the spelled-out "The Tortured Poets Department" nor the all-caps acronym "TTPD" this repo otherwise uses.`,
          suggestedFix: 'Replace "Ttpd" with "The Tortured Poets Department" (first/display reference) or "TTPD" (the established all-caps shorthand already used throughout the corpus).',
          confidence: 0.9,
        }),
      );
    }
  }
  return findings;
}

export async function check(items) {
  const [miscased, badTtpd] = await Promise.all([
    checkStylizedTitleMiscased(items),
    checkBadTtpdAbbreviation(items),
  ]);
  return [...miscased, ...badTtpd];
}
