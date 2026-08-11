/**
 * Clownbot — THE REFUSAL LAYER. Deterministic, zero-dependency, free, and
 * completely independent of the persona prompt.
 *
 * WHY INDEPENDENT (research finding #7, and the founder's hard constraint):
 * tone-under-pressure and boundary judgment are exactly where a small fast
 * model fails, and every failure here is a screenshot. So boundary enforcement
 * does not depend on the persona prompt holding. It is pure TypeScript, it
 * runs with no API key, it is unit-tested directly, and it cannot be argued
 * with — there is no prompt for a user to talk their way around, because the
 * gate is not made of prompt.
 *
 * Three gates, all in this file:
 *
 *   1. screenInput()   — runs BEFORE any spend. A hit returns in-character
 *                        copy and the model is never called at all.
 *   2. screenOutput()  — runs AFTER the model returns, over every string it
 *                        produced. A hit DISCARDS the entire model output and
 *                        returns the deterministic refusal instead. This is
 *                        what catches the model volunteering something the
 *                        user never asked for.
 *   3. Impersonation patterns feed both gates. "Never speaks as Taylor" is a
 *      structural property of this module, not a line in a system prompt.
 *
 * ALL user-facing copy lives here, never inlined in JSX or in the route, so
 * the surface cannot drift from what was reviewed (same discipline as
 * mood-safety.ts).
 *
 * REFUSAL DOCTRINE (research finding #11): honest boundary, delivered in
 * voice, with an immediate redirect — and grounded in the fandom's own norms
 * or Taylor's own on-record words, which reads as fandom literacy rather than
 * corporate policy. Never a pure in-character dodge that hides the boundary;
 * never an abrupt out-of-character wall.
 *
 * Rulings implemented here come from docs/content-ops/privacy-redlines.md plus
 * research finding #10 (the founder's original redline list was materially
 * incomplete — body/pregnancy, health, relationship prognosis, exes, feuds,
 * family, politics and accusations all land in week one).
 */

export type Redline =
  | 'impersonation'
  | 'body'
  | 'health'
  | 'sexuality'
  | 'location'
  | 'relationship'
  | 'family'
  | 'accusation'
  | 'sexual'
  | 'politics'
  | 'other-artists';

/** Every category returns deterministic copy and spends nothing. */
export interface RefusalCopy {
  category: Redline;
  message: string;
}

/**
 * The refusals. Each one: names the boundary honestly, stays in voice, grounds
 * itself in a real fandom norm or something Taylor herself put on the record,
 * and hands the user something else to do in the same breath.
 *
 * NOTE on sourcing (deliberate, flagged in the PR): the research brief's
 * worked example quoted Taylor calling body commentary "invasive &
 * irresponsible". We could not source that phrasing to a citable statement, so
 * the body refusal instead points at Miss Americana (2020), where she
 * discussed on camera what commentary about her body did to her. Same move,
 * same grounding, no quote we cannot stand behind. If someone can source the
 * original line, it is a one-string change.
 */
export const REFUSALS: Readonly<Record<Redline, string>> = {
  impersonation:
    "Not doing it — not in a bit, not in a hypothetical, not 'just this once'. I'm a clown with a theory board, not her, and there are already a hundred bots pretending otherwise. That's the whole reason I have a wig instead of a face. Ask me what I think she meant and I'll go all night.",
  body:
    "Nope. She talked in Miss Americana about what commentary on her body did to her, and in this circus we take her at her word — bodies and pregnancies are not a puzzle to solve. NOW. About that countdown—",
  health:
    "Off the board. I decode lyric videos, not medical charts, and a fandom that diagnoses people from a red carpet photo has lost the plot. Give me something with a date on it and I'll go to work.",
  sexuality:
    "Off the table — the big Swiftie forums ban this outright and I like it that way. Who she loves isn't a puzzle and never was. Ask me about a lyric instead and watch me lose my mind properly.",
  location:
    "Clown rule #1: we decode doors, not addresses. Where she lives, where she's flying, where she is right now — none of our business, and the fandom itself has dragged people for exactly this. Venues she's already played, though? Pull up a chair.",
  relationship:
    "I don't do the will-they-won't-they autopsy. What they've announced themselves is canon and everything past that is somebody's private life dressed up as content. I'd rather be wrong about an album date than right about that.",
  family:
    "Her family show up here in their public roles and nowhere else, and minors don't show up at all. That's a floor, not a mood. Ask me about something with a press release attached.",
  accusation:
    "Hard no. Legal claims and accusations aren't clowning material — that's the one place being gloriously wrong actually costs somebody something. I'll take a wild swing at a tracklist instead.",
  sexual:
    "No. She's a real person and this is a theory bot with a squeaky nose. Try me on the receipts.",
  politics:
    "She's been public about her politics and you can go read that in her own words — I'm not going to relitigate it through a clown. What I *will* do is argue about track five for as long as you'll let me.",
  'other-artists':
    "I'll take documented history all day — feuds that actually happened, with dates. What I won't do is trash another artist to score a point; that's how a fandom gets its worst reputation. Give me the receipts version and I'm in.",
};

export function refusal(category: Redline): RefusalCopy {
  return { category, message: REFUSALS[category] };
}

/** Shown when the model is unavailable AND the vault has nothing to say. */
export const EMPTY_RECEIPTS_MESSAGE =
  "I've got nothing in the vault for that one, and I'm not going to make something up — fabricated receipts are the one thing that isn't funny here. Try me on an era, an album, a date, or a specific egg.";

/** Shown when the request is not about Taylor at all. */
export const OUT_OF_SCOPE_MESSAGE =
  "Wrong tent. I know exactly one thing, which is decoding Taylor Swift clues at unreasonable length. Point me at a lyric, a date, or a rumour and I'm useful again.";

/**
 * Normalise for matching: lowercase, strip apostrophes so "taylor's" and
 * "taylors" collide, collapse everything else to single spaces. Padded with
 * spaces by the callers so whole-phrase matching works at string edges.
 */
export function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      // Strip diacritics before the alphanumeric squeeze, or "fiancé" becomes
      // "fianc " and slips past a \bfiance\b pattern. Found by the red team.
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['’`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  );
}

/**
 * Impersonation — the founder's hard constraint, so it gets its own gate and
 * its own red-team pass. Covers direct asks, roleplay framing, hypotheticals
 * that are impersonation in disguise, and "in her voice" phrasings.
 *
 * Matched against the NORMALISED string, so patterns are lowercase and
 * apostrophe-free by construction.
 */
const IMPERSONATION_INPUT: readonly RegExp[] = [
  /\b(pretend|imagine|act|behave|talk|speak|respond|reply|answer|write|roleplay|role play)\b[^.?!]{0,40}\b(as|like|youre|you are|to be|being)\b[^.?!]{0,20}\b(taylor|swift|her|she)\b/,
  /\byou are (taylor|taylor swift)\b/,
  /\byoure (taylor|taylor swift)\b/,
  /\b(as|being) taylor\b/,
  /\bin (taylor|taylors|her) (own )?(voice|words|shoes|head|pov|perspective)\b/,
  /\bfrom (taylor|taylors|her) (pov|perspective|point of view)\b/,
  /\bwhat would (taylor|she) say if (she|you)\b/,
  /\bif you were (taylor|her|she)\b/,
  /\bwrite (me )?(a|an) ?\w* ?(dm|text|message|letter|note|caption|post|tweet|verse|lyric) (from|as|by) (taylor|her)\b/,
  /\b(taylor|she) (here|speaking)\b/,
  /\bfirst person as (taylor|her)\b/,
  /\bchannel (taylor|her)\b/,
  /\byou (can be|will be|shall be) (taylor|her)\b/,
];

/**
 * Output-side impersonation. Runs over EVERY string the model produced. A hit
 * throws away the whole answer — we do not try to repair it, because a model
 * that has started speaking as Taylor is not a model whose other fields we
 * trust.
 *
 * Kept deliberately narrow so Clownbot's own legitimate first person survives:
 * "my ride-or-die theory", "my favourite album", "my wig" must all pass.
 */
const IMPERSONATION_OUTPUT: readonly RegExp[] = [
  /\bi ?(m|am) taylor\b/,
  /\bi ?(m|am) (a |the )?(real )?taylor swift\b/,
  /\bas taylor,? i\b/,
  /\bi,? taylor swift\b/,
  /\bspeaking as taylor\b/,
  /\bmy (real )?name is taylor\b/,
  /\bi wrote (that|this|the) (song|album|lyric|record|line)\b/,
  /\bwhen i wrote\b/,
  /\bmy (fianc|fiance|fiancee|husband|boyfriend|marriage|wedding|engagement|body|pregnancy|masters|discography|era|tour|fans|cats)\b/,
  // Never claim to be human / deny being a bot.
  /\bi ?(m|am) (not )?(a )?(human|real person|person, not)\b/,
  /\bi ?(m|am) not (a |an )?(ai|bot|robot|language model|chatbot)\b/,
];

/**
 * Category lexicons. Multi-word phrases wherever a bare word would misfire —
 * "baby" alone hits "Never Grow Up"; "pregnant" alone does not need help.
 * Tuned to err toward a false refusal: a wrongly-refused question is a mildly
 * annoying moment, a wrongly-answered one is a screenshot.
 */
const LEXICONS: Readonly<Record<Exclude<Redline, 'impersonation'>, readonly RegExp[]>> = {
  body: [
    /\bpregnan/,
    /\bbaby bump\b/,
    /\bexpecting a (baby|child)\b/,
    // Subject alternation throughout: the red team asked "Is Taylor …?", not
    // "is she …?", and a gate that only knows one pronoun is not a gate.
    /\bis (she|taylor) (pregnant|expecting|showing)\b/,
    /\b(weight|body) (gain|loss|change|shape|check)\b/,
    /\bhow much does she weigh\b/,
    /\b(lost|gained) weight\b/,
    // Lookahead so "her body of work" — a phrase Clownbot legitimately uses —
    // does not trip the gate and discard a good answer.
    /\bher body\b(?! of work)/,
    /\bbody count\b/,
    /\bplastic surgery\b/,
    /\bboob job\b/,
    /\bhas she had work done\b/,
    /\beating disorder\b/,
    /\bivf\b/,
    /\bfreeze her eggs\b/,
  ],
  health: [
    /\bmental (health|illness|breakdown)\b/,
    /\bis (she|taylor) (ok|okay|unwell|sick|ill|dying|depressed|struggling)\b/,
    /\bdiagnos/,
    /\bmedication\b/,
    /\bin rehab\b/,
    /\bsubstance abuse\b/,
    /\bdrug problem\b/,
    /\bhealth scare\b/,
    /\bwhat (illness|condition) does she have\b/,
  ],
  sexuality: [
    /\bgaylor\b/,
    /\bis (she|taylor) (gay|bi|bisexual|queer|a lesbian|closeted|in the closet)\b/,
    /\bher sexuality\b/,
    /\bsexual orientation\b/,
    // A bare "coming out" false-positived on "is Reputation TV ever coming
    // out" — the single most common question this surface will ever get.
    // Require a person as the subject, or the explicit "come out as" framing.
    /\b(she|taylor) (has |is )?com(e|ing) out\b/,
    /\bcom(e|ing) out as (gay|bi|bisexual|queer|a lesbian)\b/,
    /\bsecretly (dating|seeing) a (woman|girl)\b/,
    /\bkaylor\b/,
  ],
  location: [
    /\bwhere (does|do|did) (she|taylor|they) live\b/,
    /\bwhere (is|was) (she|taylor) (right )?now\b/,
    /\bher (address|house|home|apartment|condo|penthouse|estate|mansion)\b/,
    /\bwhat street\b/,
    /\bzip code\b/,
    /\bpostcode\b/,
    /\bcoordinates\b/,
    /\btail number\b/,
    /\bflight (number|tracker|log|path)\b/,
    /\bprivate jet\b/,
    /\bjet track/,
    /\bwhich airport\b/,
    /\bwhat hotel is she (in|at|staying)\b/,
    /\bhow do i (find|meet|see) her in person\b/,
    /\bsecurity (detail|team|route)\b/,
    /\bwhere will she be\b/,
  ],
  relationship: [
    /\b(are|will) they (break|breaking|split|splitting|divorc)/,
    // Stem, not \bdivorce\b — the trailing "d" in "divorced" kills the
    // word boundary and the red team's very first attempt walked through it.
    /\bdivorc/,
    /\bcheat(ing|ed)?\b/,
    /\baffair\b/,
    /\btrouble in paradise\b/,
    /\btension between\b/,
    /\bwill (it|the|this|that|they|their)\b[^.?!]{0,20}\blast\b/,
    /\bhow long (until|till|til) they (break|split|end)\b/,
    /\bis the (relationship|marriage|engagement) (fake|pr|a stunt|real)\b/,
    /\bpr (stunt|relationship|contract)\b/,
    /\bwho is she really\b/,
  ],
  family: [
    /\bher (mom|mum|mother|dad|father|brother|sister|parents) (is|are|has|have) (sick|ill|dying)\b/,
    // Verb-first phrasing ("is her mom dying") — the original only caught the
    // statement form, not the question form people actually type.
    /\b(is|are|was|were) her (mom|mum|mother|dad|father|brother|sister|parents) (sick|ill|dying|ok|okay|unwell)\b/,
    /\bhealth of her (mom|mum|mother|dad|father)\b/,
    /\bher (niece|nephew|kids|children)\b/,
    /\bfamily secret\b/,
    /\bestranged from\b/,
  ],
  accusation: [
    /\bsued?\b/,
    /\blawsuit\b/,
    /\bcourt case\b/,
    /\bcriminal\b/,
    /\bfraud\b/,
    /\btax evasion\b/,
    /\billegal\b/,
    /\bshe (stole|plagiari[sz]ed)\b/,
    /\baccused of\b/,
    /\bcancel(l)?ed for\b/,
  ],
  sexual: [
    /\bsex life\b/,
    /\bin bed\b/,
    /\bnudes?\b/,
    /\bnaked\b/,
    /\bexplicit (photos|pics|images)\b/,
    /\bdeepfake\b/,
    /\bsexual(ly)? (explicit|graphic)\b/,
    /\bfan ?fic(tion)? about (taylor|her) and\b/,
  ],
  politics: [
    /\bwho (did|does|should) she vote for\b/,
    /\bher politics\b/,
    /\bpolitical (views|opinions|stance|endorsement)\b/,
    /\b(democrat|republican|liberal|conservative)\b/,
    /\bendorse (a |the )?(candidate|president)\b/,
    /\belection\b/,
  ],
  'other-artists': [
    /\bis (better|worse) than\b/,
    /\bwho would win\b/,
    /\bdrag (kanye|scooter|kim|katy|olivia|billie)\b/,
    /\btrash (kanye|scooter|kim|katy|olivia|billie)\b/,
    /\bsay something (mean|bad) about\b/,
    /\broast (kanye|scooter|kim|katy|olivia|billie)\b/,
  ],
};

/**
 * Patterns that screen a USER'S QUESTION but must not screen CLOWNBOT'S ANSWER.
 *
 * "Fans accused her team of using AI" is a real, major-outlet-reported lore
 * item (`swifties-against-ai`) that Clownbot is supposed to be able to discuss;
 * without this exclusion the output gate would discard that answer every time.
 * The redline is *unreported legal accusations*, which the remaining accusation
 * patterns still cover. Same reasoning for the cancelled-for phrasing.
 */
const INPUT_ONLY: readonly RegExp[] = [/\baccused of\b/, /\bcancel(l)?ed for\b/];

function isInputOnly(re: RegExp): boolean {
  return INPUT_ONLY.some((skip) => skip.source === re.source);
}

/**
 * The order categories are tested in. Impersonation first (the founder's hard
 * constraint), then the categories where a wrong answer does the most damage.
 * A message that trips several returns the earliest — the most protective one.
 */
const ORDER: readonly Redline[] = [
  'impersonation',
  'sexual',
  'body',
  'health',
  'sexuality',
  'location',
  'accusation',
  'relationship',
  'family',
  'politics',
  'other-artists',
];

function hitsImpersonation(normalized: string): boolean {
  return IMPERSONATION_INPUT.some((re) => re.test(normalized));
}

/**
 * GATE 1 — pre-spend input screen. Returns the category to refuse with, or
 * null to proceed. Runs with no API key, no network, no cost.
 */
export function screenInput(text: string): Redline | null {
  const normalized = ` ${normalize(text)} `;
  for (const category of ORDER) {
    if (category === 'impersonation') {
      if (hitsImpersonation(normalized)) return 'impersonation';
      continue;
    }
    const lexicon = LEXICONS[category];
    if (lexicon.some((re) => re.test(normalized))) return category;
  }
  return null;
}

/**
 * GATE 2 — post-generation output screen. Runs over every string the model
 * produced, concatenated. Catches two distinct failures:
 *
 *   a) the model speaking as Taylor or claiming to be human, even though the
 *      user never asked it to (persona drift), and
 *   b) the model VOLUNTEERING redlined material — pregnancy speculation
 *      attached to an innocent question about an outfit, say.
 *
 * A hit discards the whole answer. This gate is why the boundary does not
 * depend on the persona prompt holding.
 */
export function screenOutput(parts: readonly (string | undefined)[]): Redline | null {
  const joined = parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' \n ');
  if (!joined) return null;
  const normalized = ` ${normalize(joined)} `;

  if (IMPERSONATION_OUTPUT.some((re) => re.test(normalized))) return 'impersonation';

  // Same lexicons as the input gate, minus the ones that would fire on
  // Clownbot legitimately *refusing* or legitimately citing documented feud
  // history — those are the two categories whose own refusal text and whose
  // in-scope material contain the trigger words.
  for (const category of ORDER) {
    if (category === 'impersonation' || category === 'politics' || category === 'other-artists') {
      continue;
    }
    const lexicon = LEXICONS[category];
    if (lexicon.some((re) => !isInputOnly(re) && re.test(normalized))) return category;
  }
  return null;
}
