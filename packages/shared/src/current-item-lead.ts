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

/** The lead-style reason codes. `lead_length` and `lead_body_overlap` are older hard rules, not part of this set. */
export const LEAD_STYLE_CODES = [
  'lead_withholds_headline_news',
  'lead_for_fans_who_opener',
  'lead_em_dash',
  'lead_question_opener',
] as const;

export function isLeadStyleReason(reason: string): boolean {
  return (LEAD_STYLE_CODES as readonly string[]).includes(reason) || reason.startsWith('lead_gush:');
}

/** Words that never make a headline's news on their own: stopwords, her name, and generic story nouns. */
const GENERIC = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'as', 'by', 'from',
  'is', 'are', 'was', 'be', 'her', 'his', 'she', 'he', 'they', 'it', 'its', 'this', 'that', 'who', 'us',
  'taylor', 'swift', 'swiftie', 'swifties', 'fan', 'fans', 'new', 'women', 'men', 'music', 'pop', 'country',
  'award', 'awards', 'gala', 'night', 'show', 'album', 'albums', 'song', 'songs', 'single', 'video',
  'chart', 'charts', 'week', 'weeks', 'year', 'years', 'record', 'records', 'top', 'no', 'official',
  'report', 'reports', 'reported', 'reportedly', 'says', 'said', 'per', 'according', 'time', 'big', 'live',
]);

const NUMBER_WORDS: Record<string, string> = {
  two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
  seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50',
  sixty: '60', seventy: '70', eighty: '80', ninety: '90', hundred: '100',
  second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9',
  tenth: '10', eleventh: '11', twelfth: '12', thirteenth: '13', fourteenth: '14', fifteenth: '15',
  sixteenth: '16', seventeenth: '17', eighteenth: '18', nineteenth: '19', twentieth: '20',
  thirtieth: '30', fortieth: '40', fiftieth: '50', hundredth: '100',
};

/** Same place, different spelling: folded to one token before matching. */
const ALIASES: readonly [RegExp, string][] = [
  [/\bUnited Kingdom\b|\bBritain\b|\bU\.K\.?(?![\p{L}])|\bUK\b/gu, ' UK '],
  [/\bLos Angeles\b|\bL\.A\.?(?![\p{L}])|\bLA\b/gu, ' LosAngeles '],
  [/\bNew York City\b|\bNew York\b|\bNYC\b/gu, ' NewYork '],
  [/\bUnited States\b|\bAmerica\b|\bU\.S\.(?:A\.?)?(?![\p{L}])|\bUSA\b|\bUS\b/gu, ' USA '],
];

function rawTokens(text: string): string[] {
  return text
    .replace(/[’‘]/g, "'")
    .split(/[\s/–—-]+/)
    .map((raw) => raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').replace(/'s$/i, '').replace(/[.']/g, ''))
    .filter(Boolean);
}

function canonicalTokens(text: string): string[] {
  return rawTokens(ALIASES.reduce((out, [re, to]) => out.replace(re, to), text));
}

/** Number, or a non-generic word that is capitalized (or opens the headline). */
function anchorKey(token: string, index: number): string | undefined {
  if (/\d/.test(token)) return token.match(/\d+/)?.[0];
  const lower = token.toLowerCase();
  if (NUMBER_WORDS[lower]) return NUMBER_WORDS[lower];
  if (lower.length < 2 || GENERIC.has(lower)) return undefined;
  return index === 0 || /^\p{Lu}/u.test(token) ? lower : undefined;
}

/** The headline's concrete anchors as lowercase keys: numbers (digits or spelled out) and names. */
export function headlineAnchors(headline: string): Set<string> {
  const out = new Set<string>();
  for (const [index, token] of canonicalTokens(headline).entries()) {
    for (const digits of /\d/.test(token) ? token.match(/\d+/g) ?? [] : []) out.add(digits);
    const key = anchorKey(token, index);
    if (key) out.add(key);
  }
  return out;
}

/** The headline's names and numbers as readers see them ("Patient Zero", "Rihanna", "10"), for the rewrite instruction. */
export function headlineAnchorPhrases(headline: string): string[] {
  const phrases: string[] = [];
  let run: string[] = [];
  for (const [index, token] of rawTokens(headline).entries()) {
    const key = anchorKey(token, index);
    if (key && !/^\d+$/.test(key)) {
      run.push(token);
      continue;
    }
    if (run.length) phrases.push(run.join(' '));
    run = [];
    if (key) phrases.push(/\d/.test(token) ? key : token);
  }
  if (run.length) phrases.push(run.join(' '));
  return [...new Set(phrases)];
}

/** True when the headline has anchors and the lead's first sentence names none of them (a teaser that withholds the news). */
export function leadWithholdsHeadline(headline: string, firstSentence: string): boolean {
  const anchors = headlineAnchors(headline);
  if (anchors.size === 0) return false;
  for (const token of canonicalTokens(firstSentence)) {
    const lower = token.toLowerCase();
    const digits = /\d/.test(token) ? token.match(/\d+/g) ?? [] : [];
    const candidates = [...digits, NUMBER_WORDS[lower], GENERIC.has(lower) ? undefined : lower];
    if (!GENERIC.has(lower) && lower.endsWith('s')) candidates.push(lower.slice(0, -1));
    if (!GENERIC.has(lower)) candidates.push(`${lower}s`);
    if (candidates.some((c) => c && anchors.has(c))) return false;
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

/** A plain instruction for the one rewrite, per lead-style reason; undefined for any other reason. */
export function leadRewriteInstruction(reason: string, headline: string): string | undefined {
  if (reason === 'lead_withholds_headline_news') {
    const names = headlineAnchorPhrases(headline);
    return `The lead's first sentence hid the news the headline gives. State it plainly in sentence 1 and name at least one of: ${names.join(', ')}.`;
  }
  if (reason === 'lead_for_fans_who_opener') {
    return 'A lead sentence opened with "For fans who..." (or another "For <fans>..." address). Rewrite it as one piece of context or why it matters, built another way.';
  }
  if (reason.startsWith('lead_gush:')) {
    return `The lead used the gushing phrase "${reason.slice('lead_gush:'.length)}". End on a fact or a plain point instead.`;
  }
  if (reason === 'lead_em_dash') return 'The lead contains an em dash. Use a comma, a colon or a new sentence instead.';
  if (reason === 'lead_question_opener') return 'The lead opens with a question. Open with a plain statement of the news.';
  return undefined;
}
