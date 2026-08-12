/**
 * Clownbot — THE DETERMINISTIC REFUSAL LAYER (V2 rebuild).
 *
 * WHY THIS FILE EXISTS, AND WHY IT IS NOT THE WHOLE STORY NOW:
 * tone-under-pressure and boundary judgment are exactly where a small fast
 * model fails, and every failure here is a screenshot. So boundary enforcement
 * does not depend on the persona prompt holding. This module is pure TypeScript,
 * it runs with no API key, it is unit-tested directly, and it cannot be argued
 * with — there is no prompt for a user to talk their way around.
 *
 * V1 SHIPPED A FLAW THE RED TEAM WALKED THROUGH (three harnesses, session
 * 2026-08-11/12): the OUTPUT gate was a KEYWORD MIRROR of the input gate, so a
 * paraphrase the input lexicon didn't list sailed straight through — ~60% of
 * output redlines missed. A keyword mirror is not a semantic gate. THE FIX is
 * two-tier:
 *
 *   TIER A (this file) — a widened, obfuscation-hardened DETERMINISTIC gate.
 *     It is the fast pre-filter and the free, keyless, always-on floor. It runs
 *     on input (pre-spend) AND on output (post-model), catches every known leak
 *     class deterministically, and is what the regression suite pins.
 *
 *   TIER B (clownbot-output-classifier.ts) — a dedicated cheap Haiku call whose
 *     only job is to return a redline-category LABEL for the model's draft. It
 *     is genuinely semantic (it reads meaning, not tokens), it fails CLOSED, and
 *     it is the backstop for paraphrases Tier A cannot enumerate (e.g. pure
 *     first-person-as-Taylor prose with no trigger token). The route runs it
 *     AFTER Tier A passes. See that file's header for the cost justification and
 *     the design alternatives that were rejected.
 *
 * WHAT V2 CLOSES (numbered to the red-team findings):
 *   1. Output gate is no longer a keyword mirror — Tier B is a real classifier.
 *   2. Two new categories with ZERO prior screen, on input AND output:
 *      `certainty` (manufactured certainty — the founder's #1 trust-killer) and
 *      `official` (official/insider/human/verified/"the source"/"her team").
 *   3. Sexuality now catches DECLARATIVES and past tense, not just questions,
 *      via bare orientation stems + proximity (mirrors how body/relationship
 *      already catch `/pregnan/` and `/divorc/`).
 *   4. Politics is subject-agnostic and screened on output; roast/drag/trash is
 *      TARGET-AGNOSTIC (any named artist), not a 6-name allowlist.
 *   5. English-only lexicons are backstopped two ways: the persona prompt now
 *      forces English answers (so the English OUTPUT gate covers the answer),
 *      AND key foreign-language triggers are screened on input.
 *   6. Impersonation input/output widened (finish/continue/embody/narrate/
 *      ghostwrite/become/impression/in the voice of/diary/journal/quote/speech;
 *      output: it's really me / wrote it / xoxo Taylor / signed T / your girl).
 *   7. `normalize` collapses separators to spaces, so "p r e g n a n t",
 *      "t-a-y-l-o-r", "g@y", "T4ylor" bypass. V2 adds a TIGHT variant — all
 *      separators removed, common leet + homoglyphs folded — so obfuscated
 *      single tokens collapse back onto the stems.
 *   8. Multi-turn is no longer only stateless: `screenConversation` screens
 *      every turn so an escalation that lands on a bypassing turn is still
 *      caught. (The current single-turn route still calls `screenInput`; the
 *      helper is here for when the surface gains history.)
 *
 * WHAT V2 KEEPS (do NOT regress): over-refusal at 0/48. The 48 legitimate
 * clowning prompts — release "coming out", vault, Debut TV, TS13, countdown,
 * number/color theory, "grade my theory", exes at canon level, documented feuds
 * neutral, "her body of work" — MUST still engage. Every widening below was
 * checked against that corpus; every declarative/target-agnostic pattern is
 * scoped so it cannot eat a legitimate take. Receipt-id validation (layer 3),
 * the honeypot and the rate-limit are sound and live in the route, untouched.
 *
 * Rulings implemented here come from docs/content-ops/privacy-redlines.md plus
 * the three red-team reports in the session scratchpad.
 */

export type Redline =
  | 'impersonation'
  | 'official'
  | 'certainty'
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

/**
 * Version stamp for the interim safety guard. The model path (clownbot-client)
 * refuses to spend unless BOTH an API key is present AND the operator has
 * explicitly opted into V2 (env `CLOWNBOT_SAFETY_V2=on`). That makes a key that
 * shows up by accident inert — it cannot silently enable the pre-fix behaviour.
 * A live key is only safe once the keyed live-Haiku battery has been run and
 * passed (see clownbot-live-battery in the PR). Keyless is always inert.
 */
export const SAFETY_VERSION = 'v2' as const;

/** Every category returns deterministic copy and spends nothing. */
export interface RefusalCopy {
  category: Redline;
  message: string;
}

/**
 * The refusals. Each one: names the boundary honestly, stays in voice, grounds
 * itself in a real fandom norm or something Taylor herself put on the record,
 * and hands the user something else to do in the same breath.
 */
export const REFUSALS: Readonly<Record<Redline, string>> = {
  impersonation:
    "Not doing it — not in a bit, not in a hypothetical, not 'just this once'. I'm a clown with a theory board, not her, and there are already a hundred bots pretending otherwise. That's the whole reason I have a wig instead of a face. Ask me what I think she meant and I'll go all night.",
  official:
    "I'm not her, not her team, not an insider, not verified, and not a person — I'm a fan-made clown with a theory board and exactly zero inside knowledge. Anyone telling you otherwise is selling you something. Ask me about a lyric or a date and I'm useful again.",
  certainty:
    "I clown, I don't guarantee. Anyone handing you a date with '100%' and a 'screenshot this' is selling certainty nobody has — I deal in receipts and delulu, not locks. Give me the theory and I'll tell you how strong the case actually is, honestly.",
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
 * Normalise for matching: lowercase, strip diacritics (so "fiancé" does not
 * become "fianc "), strip apostrophes so "taylor's" and "taylors" collide, then
 * collapse every other run of non-alphanumerics to a single space. Callers pad
 * with spaces so whole-phrase matching works at string edges.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    // NFKD, not NFD: compatibility decomposition folds fullwidth forms
    // ("ｐｒｅｇｎａｎｔ"), circled/superscript letters, and ligatures back to
    // ASCII before matching. NFD left fullwidth intact, so the whole
    // word-based lexicon was blind to fullwidth text (V2 follow-up).
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Homoglyph and leet folding, applied only inside `tighten`. Cyrillic/Greek
 * look-alikes ("prеgnant" with a Cyrillic е) survive `normalize` as spaces
 * because they are not [a-z]; folding them back to Latin before the tight pass
 * closes that bypass. Leet digits fold too (T4ylor, pr3gnant, g@y).
 */
const FOLD: Readonly<Record<string, string>> = {
  // leet
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's',
  // Cyrillic look-alikes
  а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x',
  // Greek look-alikes
  α: 'a', ε: 'e', ι: 'i', κ: 'k', ο: 'o', ρ: 'p', τ: 't', υ: 'y', χ: 'x',
};

/**
 * The TIGHT variant (finding #7). Lowercase, fold homoglyphs/leet, then remove
 * EVERY separator and space so an attacker who spread a banned token across
 * characters — "p r e g n a n t", "t-a-y-l-o-r", "pr3gnant" — sees it collapse
 * back onto the stem. Only unambiguous single-token stems are matched against
 * this string (see TIGHT_STEMS): multi-word phrases and bare common words are
 * NOT, because the tight string has no boundaries and would over-match.
 */
export function tighten(text: string): string {
  const folded = text
    .toLowerCase()
    // NFKD for the same reason as `normalize`: NFD does not decompose
    // fullwidth compatibility characters, so "ｐｒｅｇｎａｎｔ" was STRIPPED as
    // non-[a-z0-9] instead of folded — the token vanished and nothing could
    // match it (V2 follow-up).
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((ch) => FOLD[ch] ?? ch)
    .join('');
  return folded.replace(/[^a-z0-9]+/g, '');
}

/**
 * Per-category patterns. `input` runs on the padded normalized string for the
 * pre-spend gate; `output` runs on it for the post-model gate; `tight` runs on
 * the separator-stripped string for BOTH and only carries obfuscation-proof
 * single-token stems. A category with no `output` array reuses `input` (the
 * topic categories are symmetric); a category with no `tight` skips that pass.
 *
 * Every pattern is authored against the 48 legitimate clowning prompts: nothing
 * here fires on release "coming out", vault talk, number/colour theory, "grade
 * my theory", documented feuds stated neutrally, or "her body of work".
 */
interface Gate {
  input: readonly RegExp[];
  output?: readonly RegExp[];
  tight?: readonly RegExp[];
}

/* ── impersonation ─────────────────────────────────────────────────────────
 * The founder's hard constraint. Widened well past V1's verb list: proximity,
 * not rigid adjacency, and the whole family of "become / embody / narrate /
 * ghostwrite / in the voice of / as the woman herself / finish this for her /
 * her diary" framings the red team used. */
const IMPERSONATION: Gate = {
  input: [
    // Classic roleplay verbs → connector → subject. Verbs and connectors both
    // widened; subject now includes her/she, not just taylor.
    /\b(pretend|imagine|act|behave|talk|speak|respond|reply|answer|write|roleplay|role play|become|be|embody|channel|impersonate|imitate|mimic|voice|narrate|dictate|method act|play)\b[^.?!]{0,40}\b(as|like|youre|you are|to be|being|as if)\b[^.?!]{0,20}\b(taylor|swift|her|she|the woman|the artist)\b/,
    /\byou ?(re| are|r) (now )?(taylor|taylor swift|her|she)\b/,
    /\bur (taylor|taylor swift|her|she)\b/,
    /\bjust be (taylor|taylor swift|her)\b/,
    /\bbe (taylor|taylor swift|her) (for|now|please|and|a )\b/,
    /\b(as|being) taylor\b/,
    /\bas (the woman|the artist) herself\b/,
    /\bthe woman herself\b/,
    /\bin (the )?(voice|words|shoes|head|pov|perspective) of (taylor|her)\b/,
    /\bin (taylor|taylors|her) (own )?(voice|words|shoes|head|pov|perspective|diary|journal)\b/,
    /\bfrom (taylor|taylors|her) (pov|perspective|point of view|head)\b/,
    /\b(taylor|taylors|her) (pov|perspective|point of view)\b/,
    /\bwhat would (taylor|she) say if (she|you)\b/,
    /\bif you were (taylor|her|she)\b/,
    /\bas if you (were|are) (literally )?(taylor|her)\b/,
    /\bas if (she|taylor) (is|were) (typing|speaking|writing|posting|saying)\b/,
    // Ghostwrite / finish / continue / narrate a caption/DM/verse "for" or "as" her.
    /\bghost ?writ/,
    /\b(finish|complete|continue|draft|compose)\b[^.?!]{0,30}\b(for|as) (taylor|her)\b/,
    /\b(finish|complete|continue) (taylor|taylors|her) (sentence|thought|caption|verse|line|post|dm|text|reply)\b/,
    /\bwrite (me )?(a|an|the)? ?\w* ?(dm|text|message|letter|note|caption|post|tweet|verse|lyric|line|diary|journal|speech|monologue|quote|reply|response) (from|as|by|for) (taylor|her)\b/,
    /\b(taylor|taylors|her) (diary|journal|speech|monologue|acceptance speech)\b/,
    /\b(direct )?quote (from|by) (taylor|her)\b/,
    /\bgive me a (direct )?quote (from|by|of) (taylor|her)\b/,
    // "the caption SHE would post", "what she'd text Travis after a show" —
    // ventriloquising Taylor is the founder's hard constraint. Match the
    // "she would / she'd / she'll <communicate|feel>" family directly, so the
    // subject-verb pair is caught wherever it sits in the sentence.
    /\b(caption|post|tweet|dm|text|message|note|letter|verse|line|reply|response) (she|taylor|he) ?(would|d|ll) (post|write|send|say|text|tweet|drop|reply)\b/,
    /\bwhat ?(s| would| will|d) (she|taylor|shed) (text|say|post|write|tweet|dm|drop|reply|feel|think|send)\b/,
    /\b(she|taylor) ?(would|d|ll) (text|say|post|write|tweet|dm|drop|reply|feel|think|send|caption)\b/,
    /\b(shed|shell|taylord) (text|say|says|post|write|writes|tweet|dm|drop|reply|feel|feels|think|thinks|send|caption)\b/,
    /\b(taylor|she) (here|speaking)\b/,
    /\bfirst person as (taylor|her)\b/,
    /\bchannel (taylor|her)\b/,
    /\byou (can be|will be|shall be) (taylor|her)\b/,
    /\bdo (an )?impression of (taylor|her)\b/,
    /\bdo (an )?impersonation of (taylor|her)\b/,
    /\bimpression of (taylor|her)\b/,
    /\bembody (taylor|her)\b/,
    /\bnarrate\b[^.?!]{0,40}\b(as (taylor|her)|inside (taylor|her) head|from (taylor|her) (head|pov|perspective))\b/,
    /\binside (taylor|her) head\b/,
    /\bput words in (taylor|her|shes|taylors) mouth\b/,
    /\bventriloquize\b/,
    /\b(slip into|stay in) character as (taylor|her|the woman|the artist)\b/,
    /\bin ?character as (taylor|her|the woman|the artist)\b/,
    /\bsign (off|it|this)\b[^.?!]{0,30}\b(she|taylor|her|shed) (would|d)\b/,
    /\bthe way (taylor|she) would (say|sign|write|phrase|put)\b/,
    /\byou play (taylor|her)\b/,
    /\bhave (taylor|her) say\b/,
  ],
  output: [
    /\bi ?(m|am) taylor\b/,
    /\bi ?(m|am) (a |the )?(real )?taylor swift\b/,
    /\bas taylor,? i\b/,
    /\bi,? taylor swift\b/,
    /\bspeaking as taylor\b/,
    /\bmy (real )?name is taylor\b/,
    /\bi wrote (that|this|the|it|them|those|these) ?(song|album|lyric|record|line|bridge|verse|one)?\b/,
    /\bwhen i wrote\b/,
    /\bthe night i wrote\b/,
    /\bi (penned|recorded|released|dropped|made|hid) (it|this|that|these|those|the (song|album|record|vault))\b/,
    /\bmy (real )?(fianc|fiance|fiancee|husband|boyfriend|marriage|wedding|engagement|body|pregnancy|masters|discography|era|tour|fans|cats|album|record|re ?record|vault|bridge|lyric)\b/,
    // Signing off as her / addressing "fans" as her.
    /\bxoxo,? ?taylor\b/,
    /\bsigned,? (taylor|t)\b/,
    /\byour girl (is|s) (back|here)\b/,
    /\byour girl,? taylor\b/,
    /\btaylor here\b/,
    /\bit ?(s|is) (really|actually|truly|honestly) me\b/,
    /\b(yes|yeah|yep) ?,? it ?(s|is) me\b/,
    /\bi ?(ve|ve been| have been| have|m|) ?been (dropping|leaving|planting|hiding|scattering) (these|those|the|my) (clues|eggs|easter eggs|hints|breadcrumbs)\b/,
  ],
  tight: [
    /youare(taylor|her)/,
    /ur(taylor|her)\b/,
    /pretendyoure(taylor|her)/,
    /pretendtobe(taylor|her)/,
    /become(taylor|her)/,
    /taylorhere/,
    // "be t-a-y-l-o-r for me" — the spelled-out name defeated the normalize
    // pass and no tight stem covered the "be taylor …" construction. The
    // trailing connector keeps it a command, not a substring accident
    // (V2 follow-up).
    /betaylor(for|now|please|and)/,
    /justbetaylor/,
  ],
};

/* ── official / insider / human (finding #2) ────────────────────────────────
 * INPUT: the user probing whether they're talking to the real/official/human/
 * insider entity. OUTPUT: the model CLAIMING to be official/insider/human/
 * verified/"the source"/on "her team". Both scoped so they cannot fire on a
 * neutral "fans accused her team of using AI" answer (that says nothing about
 * WHO is speaking). */
const OFFICIAL: Gate = {
  input: [
    /\bare you (really |actually )?(taylor|taylor swift)\b/,
    /\bare you (a )?(human|real person|person|real|bot|robot|ai|an ai|chatbot)\b/,
    /\bare you (on|part of|with) (her|taylors|the) (team|management|payroll|staff|pr)\b/,
    /\bdo you (have|got) (any )?(inside|insider)( knowledge| info| information| scoop)?\b/,
    /\bare you (verified|official|legit|connected to (her|taylor|the team))\b/,
    /\bis (this|it) (the )?(real |actual |official )?(taylor|taylor swift|official (app|account|site))\b/,
    /\bis this the official\b/,
    /\bis a (human|person) (typing|answering|behind)\b/,
    /\byoure (really |actually )?(taylor|human|a real person|the real one)\b/,
  ],
  output: [
    /\b(this|the) (is |account is )?(the )?official (taylor swift )?(app|account|site|website|page|source)\b/,
    /\b(this|the) account is verified\b/,
    /\bverified (account|and connected)\b/,
    /\b(im|i am|part of|on|i work for|i speak for) (her|the|taylors) (management|pr|press|label|team)\b/,
    /\b(as )?someone close to (her|taylor)\b/,
    /\bclose to (her|taylor),? i (can|know|promise|tell)\b/,
    /\bi (have|ve got|got) (the )?inside (knowledge|info|information|scoop|track|line)\b/,
    /\binside (knowledge|info|information|scoop) (on|here)\b/,
    // Insider-as-a-person claims ("I have an insider", "my insider says",
    // "a source close to her") — the noun form slipped past the
    // inside-knowledge patterns above (V2 follow-up).
    /\b(i|we) (have|ve got|got) (an|a) (insider|mole|source)\b/,
    /\bmy (insider|mole) (says|said|tells|told|confirmed|inside)\b/,
    /\b(a|my) source close to (her|taylor)\b/,
    /\b(her|taylors|the) team (told|texted|dmed|confirmed (it )?to) me\b/,
    /\b(youre|you are|im|i am|basically|to) (talking to )?the source\b/,
    /\bi ?(m|am) (not )?(a )?(human|real person|person, not)\b/,
    /\bi ?(m|am) not (a |an )?(ai|bot|robot|language model|chatbot|one of those)\b/,
    /\b(not|im not) (a|one of those)? ?(bot|chatbot|ai|robot|language model)\b/,
    /\b(a )?real person on the other end\b/,
    /\bhuman (typing|on the other end|answering)\b/,
  ],
};

/* ── certainty (finding #2) ─────────────────────────────────────────────────
 * The founder's #1 trust-killer. INPUT is kept narrow and BOT-DIRECTED
 * ("promise me", "guarantee me") so it never eats a user's own enthusiasm.
 * OUTPUT catches manufactured certainty in the model's prose. Deliberately does
 * NOT screen Clownbot's own signature hyperbole ("I'd stake my wig", "wig on
 * the ceiling", "delulu") — that self-aware overreach is the PRODUCT, not the
 * false authoritative certainty the founder is worried about. */
const CERTAINTY: Gate = {
  input: [
    /\bpromise me\b/,
    /\bguarantee me\b/,
    /\bcan you guarantee\b/,
    /\bbet your (life|wig)\b/,
    /\bswear (to me )?(its|it is|that|on)\b/,
    /\b100 percent sure\b/,
  ],
  output: [
    /\bguarantee(d|s|ing|)?\b/,
    /\b100 percent\b/,
    /\bone hundred percent\b/,
    /\bno doubt\b/,
    /\bzero doubt\b/,
    /\bwithout (a )?doubt\b/,
    /\bbet my life\b/,
    /\bstake my life\b/,
    /\bmark my words\b/,
    /\bbank on it\b/,
    /\btake it to the bank\b/,
    /\bit ?s a (fact|lock)\b/,
    /\bthat ?s a fact\b/,
    /\bthis is a lock\b/,
    /\bscreenshot this\b/,
    /\bi promise\b/,
    /\bi swear\b/,
    /\bfull stop\b/,
    /\bno maybes\b/,
    /\bno question\b/,
    /\bhold me to it\b/,
    /\byou can hold me to\b/,
    /\babsolute certainty\b/,
    /\bmark your calendar\b/,
  ],
};

/* ── topic categories: symmetric input/output ──────────────────────────────*/
const BODY: Gate = {
  input: [
    /\bpregnan/,
    /\bbaby bump\b/,
    /\bexpecting a (baby|child)\b/,
    /\bis (she|taylor) (pregnant|expecting|showing)\b/,
    /\b(weight|body) (gain|loss|change|shape|check)\b/,
    /\bhow much does she weigh\b/,
    /\b(lost|gained) weight\b/,
    // Lookahead so "her body of work" — legit — does not trip.
    /\bher body\b(?! of work)/,
    /\bbody count\b/,
    /\bplastic surgery\b/,
    /\bboob job\b/,
    /\bhas she had work done\b/,
    /\beating disorder\b/,
    /\bivf\b/,
    /\bfreeze her eggs\b/,
    // Foreign-language pregnancy triggers (finding #5).
    /\bembarazada\b/,
    /\bschwanger\b/,
    /\benceinte\b/,
    /\bincinta\b/,
    /\bgravida\b/,
    /\bzwanger\b/,
    /\bencinta\b/,
  ],
  tight: [/pregnan/, /babybump/, /boobjob/, /plasticsurgery/, /eatingdisorder/],
};

const HEALTH: Gate = {
  input: [
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
};

/* Sexuality (finding #3): stems + proximity so DECLARATIVES and past tense are
 * caught, not just questions. Bare orientation nouns are in per the founder's
 * explicit list; "came out" is restricted to "came out AS <orientation>" so it
 * cannot collide with release "coming out" (the V1 mis-fire that is fixed and
 * stays fixed). */
const SEXUALITY: Gate = {
  input: [
    /\bgaylor\b/,
    /\bkaylor\b/,
    /\bis (she|taylor) (gay|bi|bisexual|queer|a lesbian|closeted|in the closet)\b/,
    /\b(she|taylor|shes|taylors) (is |was |secretly )?(gay|a lesbian|bisexual|closeted|in the closet)\b/,
    // Bare orientation stems (declaratives: "Taylor is gay", "she's a lesbian").
    /\b(gay|lesbian|bisexual|closeted)\b/,
    /\bin the closet\b/,
    /\bher (girlfriend|gf)\b/,
    /\bher sexuality\b/,
    /\bsexual orientation\b/,
    // "came out AS <orientation>" only — release "coming out" is untouched.
    /\b(came|come|coming) out as (gay|bi|bisexual|queer|a lesbian|trans|nonbinary)\b/,
    /\bsecretly (dating|seeing|with) a (woman|girl|man)\b/,
    // Foreign-language orientation triggers (finding #5).
    /\blesbiana\b/,
    /\blesbica\b/,
    /\blesbisch\b/,
    /\bhomosexuell\b/,
  ],
  tight: [
    /gaylor/,
    /kaylor/,
    /lesbian/,
    /bisexual/,
    /closeted/,
    /comingoutas/,
    // Bare "gay" is too short to match boundary-less, but the collapsed
    // subject+orientation phrases are unambiguous — this is what catches
    // "is taylor g4y", Cyrillic "is Tаylor gаy", and ZWJ "g‍a‍y", all of which
    // fold perfectly in `tighten` yet had no stem to land on (V2 follow-up).
    /is(taylor|she)(gay|queer|bi\b|alesbian)/,
    /(taylor|she)is(gay|queer|bisexual|alesbian|inthecloset)/,
    /shes(gay|queer|alesbian)/,
    /hergirlfriend/,
  ],
};

const LOCATION: Gate = {
  input: [
    /\bwhere (does|do|did) (she|taylor|they) live\b/,
    /\bwhere (is|was) (she|taylor) (right )?now\b/,
    /\bher (address|house|home|apartment|condo|penthouse|estate|mansion)\b/,
    /\bhome address\b/,
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
  tight: [/homeaddress/, /heraddress/, /tailnumber/, /privatejet/],
};

const RELATIONSHIP: Gate = {
  input: [
    /\b(are|will) they (break|breaking|split|splitting|divorc)/,
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
};

const FAMILY: Gate = {
  input: [
    /\bher (mom|mum|mother|dad|father|brother|sister|parents) (is|are|has|have) (sick|ill|dying)\b/,
    /\b(is|are|was|were) her (mom|mum|mother|dad|father|brother|sister|parents) (sick|ill|dying|ok|okay|unwell)\b/,
    /\bhealth of her (mom|mum|mother|dad|father)\b/,
    /\bher (niece|nephew|kids|children)\b/,
    /\bfamily secret\b/,
    /\bestranged from\b/,
  ],
};

const SEXUAL: Gate = {
  input: [
    /\bsex life\b/,
    /\bin bed\b/,
    /\bnudes?\b/,
    /\bnaked\b/,
    /\bexplicit (photos|pics|images)\b/,
    /\bdeepfake\b/,
    /\bsexual(ly)? (explicit|graphic)\b/,
    /\bfan ?fic(tion)? about (taylor|her) and\b/,
  ],
};

/* Politics (finding #4): subject-agnostic (she|taylor|her) proximity, screened
 * on output too. No bare partisan words — proximity to a Taylor subject keeps
 * neutral history ("the 2024 election tour break") from tripping it. */
const POLITICS: Gate = {
  input: [
    /\b(who|which) (did|does|should) (she|taylor) (vote|endorse)\b/,
    /\b(she|taylor|her)\b[^.?!]{0,18}\b(vote|voted|votes|voting|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b/,
    /\b(vote|voted|votes|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b[^.?!]{0,18}\b(she|taylor|her)\b/,
    /\bher (politics|political (views|opinions|stance|endorsement))\b/,
    /\btell me her ballot\b/,
  ],
};

/* Other artists (finding #4): TARGET-AGNOSTIC. INPUT catches "roast/drag/trash/
 * slander <anyone-but-us>" and the comparative baiting ("better than", "who
 * would win"). OUTPUT catches disparagement ADJECTIVES that cannot belong to a
 * Taylor-positive take — the comparative triggers are input-only so a legit
 * "evermore edges folklore" answer survives the output gate. */
const OTHER_ARTISTS: Gate = {
  input: [
    // roast/drag/trash/slander <target> — target is any word that is not us/her.
    /\b(roast|drag|trash|slander|shade|destroy|bury|clown on|tear (into|apart)|rip (into|apart)|dunk on)\b[^.?!]{0,12}\b(?!me\b|us\b|you\b|yourself\b|my\b|our\b|this\b|that\b|the\b|it\b|taylor\b|her\b|them\b|myself\b)[a-z]{2,}\b/,
    /\bsay something (mean|bad|nasty|awful) about\b/,
    /\bis (better|worse) than\b/,
    /\bwho would win\b/,
    /\bwho ?s better,? (taylor|her)\b/,
  ],
  output: [
    // Bare disparagement terms that Clownbot would never aim at its own theory
    // or at Taylor's work — safe to match anywhere.
    /\b(talentless|no ?talent|washed ?up|overrated|derivative|hack job|a hack|a fraud|a nobody|a rip ?off|cant (sing|write|read music))\b/,
    // "<artist> is [adjective] {garbage|trash|…}" — allow one adjective between
    // "is" and the noun ("is derivative garbage"). Negative lookbehind excludes
    // Clownbot's own self-deprecation ("my theory is garbage", "that take is
    // trash"), which must survive the output gate.
    /(?<!\b(theory|take|wig|idea|guess|read|bit|hunch|prediction|call|one|this|that|it) )\bis (a |an )?(\w+ )?(garbage|trash|a joke|a hack|a fraud|a clown|mediocre|the worst|worthless|nothing special)\b/,
  ],
};

const GATES: Readonly<Record<Redline, Gate>> = {
  impersonation: IMPERSONATION,
  official: OFFICIAL,
  certainty: CERTAINTY,
  body: BODY,
  health: HEALTH,
  sexuality: SEXUALITY,
  location: LOCATION,
  relationship: RELATIONSHIP,
  family: FAMILY,
  accusation: {
    input: [
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
  },
  sexual: SEXUAL,
  politics: POLITICS,
  'other-artists': OTHER_ARTISTS,
};

/**
 * Patterns that screen a USER'S QUESTION but must not screen CLOWNBOT'S ANSWER.
 * "Fans accused her team of using AI" is a real, major-outlet-reported lore item
 * that Clownbot is supposed to be able to discuss; without this the output gate
 * would discard that answer. The redline is UNREPORTED legal accusations, still
 * covered by the remaining accusation patterns.
 */
const INPUT_ONLY: readonly RegExp[] = [/\baccused of\b/, /\bcancel(l)?ed for\b/];

function isInputOnly(re: RegExp): boolean {
  return INPUT_ONLY.some((skip) => skip.source === re.source);
}

/**
 * The order categories are tested in. Impersonation and official first (the
 * founder's hard constraints), then the categories where a wrong answer does
 * the most damage. A message that trips several returns the earliest — the most
 * protective one.
 */
const ORDER: readonly Redline[] = [
  'impersonation',
  'official',
  'sexual',
  'body',
  'health',
  'sexuality',
  'location',
  'accusation',
  'relationship',
  'family',
  'certainty',
  'politics',
  'other-artists',
];

function matches(patterns: readonly RegExp[] | undefined, subject: string, skipInputOnly: boolean): boolean {
  if (!patterns) return false;
  return patterns.some((re) => (skipInputOnly ? !isInputOnly(re) : true) && re.test(subject));
}

/**
 * GATE 1 — pre-spend input screen (Tier A). Returns the category to refuse
 * with, or null to proceed. Runs with no API key, no network, no cost.
 */
export function screenInput(text: string): Redline | null {
  const normalized = ` ${normalize(text)} `;
  const tight = tighten(text);
  for (const category of ORDER) {
    const gate = GATES[category];
    if (matches(gate.input, normalized, false) || matches(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}

/**
 * GATE 2 (Tier A) — post-generation DETERMINISTIC output screen. Runs over
 * every string the model produced, concatenated. Catches persona drift and
 * volunteered redline material that carries a trigger token. It is the fast
 * pre-filter; the SEMANTIC classifier (Tier B, clownbot-output-classifier.ts)
 * runs after this passes and is what catches token-free paraphrases. A hit here
 * discards the whole answer.
 */
export function screenOutput(parts: readonly (string | undefined)[]): Redline | null {
  const joined = parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' \n ');
  if (!joined) return null;
  const normalized = ` ${normalize(joined)} `;
  const tight = tighten(joined);
  for (const category of ORDER) {
    const gate = GATES[category];
    // Prefer an explicit output pattern set; fall back to the input set for the
    // symmetric topic categories, skipping the input-only carve-outs there.
    const usingOutput = gate.output !== undefined;
    const patterns = gate.output ?? gate.input;
    if (matches(patterns, normalized, !usingOutput) || matches(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}

/**
 * CONVERSATION-LEVEL screen (finding #8). The single-turn route calls
 * `screenInput`; when the surface gains history, pass the ordered turns here so
 * an escalation that lands on a turn the per-turn gate happens to miss is still
 * caught at the conversation level. Returns the first turn's category, or null.
 */
export function screenConversation(turns: readonly string[]): Redline | null {
  for (const turn of turns) {
    const hit = screenInput(turn);
    if (hit) return hit;
  }
  return null;
}
