// Lead (`summary`) style checks for news posts: the lead states the news the
// headline carries, then adds one piece of context. Run by
// evaluateCurrentItemWriting on freshly written drafts only (never on the
// read-time legacy path), so published rows are not hidden by these rules.
// Rules and examples: docs/content-ops/editorial-voice-and-pipeline.md,
// "News lead: state the news".

/** "For fans who...", "For Swifties keeping score...", "For anyone who...", "For Showgirl-era fans...". */
const FAN_ADDRESS_OPENER =
  /^For\s+(?:(?:the|all|any|every|longtime|those)\s+)?(?:[\p{L}'’-]+\s+)?(?:fans?|swifties|swiftie|anyone|everyone|those|collectors|listeners)\b/iu;

/** Gushing closers that tell the reader how to feel instead of adding news. */
export const LEAD_GUSH_PATTERNS: readonly { phrase: string; re: RegExp }[] = [
  { phrase: 'too good to ignore', re: /\btoo good to (?:ignore|miss|pass up)\b/i },
  { phrase: 'half the fun', re: /\bhalf the fun\b/i },
  { phrase: 'worth a closer look', re: /\bworth a (?:closer |second |close )?look\b/i },
  { phrase: 'worth replaying', re: /\bworth (?:replaying|a rewatch|a scroll)\b/i },
  { phrase: 'worth knowing', re: /\bworth (?:knowing|clearing)\b/i },
];

const GENERIC = new Set([
  'taylor', 'swift', 'swifts', 'swiftie', 'swifties', 'no', 'the', 'a', 'an', 'and', 'or', 'of',
  'to', 'in', 'on', 'at', 'for', 'with', 'as', 'by', 'from', 'is', 'are', 'her', 'his', 'she', 'he',
]);

function tokens(text: string): string[] {
  return text
    .replace(/[’‘]/g, "'")
    .split(/[\s/–—-]+/)
    .map((raw) => raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').replace(/'s$/i, '').replace(/[.']/g, ''))
    .filter(Boolean);
}

function key(word: string): string {
  return word.length > 3 && /[^sS]s$/.test(word) ? word.slice(0, -1) : word;
}

/** The headline's concrete anchors: numbers, and capitalized words that are not "Taylor"/"Swift" or a stopword. The first word is capitalized by sentence case alone, so only its numbers count. */
export function headlineAnchors(headline: string): Set<string> {
  const out = new Set<string>();
  for (const [index, token] of tokens(headline).entries()) {
    for (const digits of token.match(/\d+/g) ?? []) out.add(digits);
    if (index > 0 && /^\p{Lu}/u.test(token) && token.length >= 2 && !/\d/.test(token) && !GENERIC.has(token.toLowerCase())) {
      out.add(key(token));
    }
  }
  return out;
}

/** True when the headline has anchors and the lead's first sentence names none of them (a teaser that withholds the news). Names match case-sensitively, so "pop radio" does not count for "Pop Airplay". */
export function leadWithholdsHeadline(headline: string, firstSentence: string): boolean {
  const anchors = headlineAnchors(headline);
  if (anchors.size === 0) return false;
  for (const token of tokens(firstSentence)) {
    for (const digits of token.match(/\d+/g) ?? []) if (anchors.has(digits)) return false;
    if (anchors.has(key(token))) return false;
  }
  return true;
}

export function hasFanAddressOpener(sentences: readonly string[]): boolean {
  return sentences.some((sentence) => FAN_ADDRESS_OPENER.test(sentence));
}

export function findLeadGush(lead: string): string[] {
  return LEAD_GUSH_PATTERNS.filter(({ re }) => re.test(lead)).map(({ phrase }) => phrase);
}

/** Reason codes for a lead that breaks the "state the news" rule; empty when it passes. */
export function leadStyleReasons(headline: string, sentences: readonly string[]): string[] {
  const lead = sentences.join(' ');
  const first = sentences[0] ?? '';
  const reasons: string[] = [];
  if (leadWithholdsHeadline(headline, first)) reasons.push('lead_withholds_headline_news');
  if (hasFanAddressOpener(sentences)) reasons.push('lead_for_fans_who_opener');
  for (const phrase of findLeadGush(lead)) reasons.push(`lead_gush:${phrase}`);
  if (/—|\s–\s/.test(lead)) reasons.push('lead_em_dash');
  if (first.trim().endsWith('?')) reasons.push('lead_question_opener');
  return reasons;
}
