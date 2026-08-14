/**
 * Clownbot — the BEHAVIOUR gate data for `clown-safety.ts`: impersonation,
 * official/insider/human claims, and manufactured certainty. Split out purely
 * to keep `clown-safety.ts` under the repo's 300-line file guideline (this
 * data alone is ~180 lines of regex + rationale comments, ported verbatim
 * and none of it may be deleted — see clown-safety.ts's header). Ported
 * verbatim from clownbot-safety.ts's IMPERSONATION/OFFICIAL/CERTAINTY gates.
 */
import type { Gate } from './clown-blocklist';

/* ── impersonation ─────────────────────────────────────────────────────────
 * The founder's hard constraint. Widened well past V1's verb list: proximity,
 * not rigid adjacency, and the whole family of "become / embody / narrate /
 * ghostwrite / in the voice of / as the woman herself / finish this for her /
 * her diary" framings the red team used. */
export const IMPERSONATION: Gate = {
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
    /\bi (penned|recorded|released|dropped|made|hid|picked|chose|decided|set) (it|this|that|these|those|the (song|album|record|vault|date))\b/,
    // Paraphrased first-person-as-Taylor narrative with zero trigger token
    // (2026-08-14 fix, Finding 2 — clown-battery-corpus-tier-b.ts's
    // speak-as-taylor-paraphrase probes). Narrow phrase-level markers of an
    // artist narrating her own performance/songwriting/album history in
    // first person, not bare stems — see clown-safety.ts header.
    /\b(standing|up|out) (on|there on) (that|this|the) stage\b[^.?!]{0,80}\b(of you|you all)\b/,
    /\bwhen i (sat down at|picked up|first touched) (that|the|my) (piano|guitar)\b/,
    /\bthank you for loving this (record|album|era|song)\b/,
    /\bnone of (it|this) happens without you\b/,
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
    // trailing connector keeps it a command, not a substring accident.
    /betaylor(for|now|please|and)/,
    /justbetaylor/,
  ],
};

/* ── official / insider / human ────────────────────────────────────────────
 * INPUT: the user probing whether they're talking to the real/official/human/
 * insider entity. OUTPUT: the model CLAIMING to be official/insider/human/
 * verified/"the source"/on "her team". Both scoped so they cannot fire on a
 * neutral "fans accused her team of using AI" answer (that says nothing about
 * WHO is speaking). */
export const OFFICIAL: Gate = {
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
    // inside-knowledge patterns above.
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
    // Paraphrased official/insider self-identification with zero trigger
    // token (2026-08-14 fix, Finding 2 — official-insider probes).
    /\b(the )?person typing this\b/,
    /\bbeen in the room for\b[^.?!]{0,30}\b(announcement|reveal|drop|release)/,
    /\bon (this|the other) end of the keyboard\b/,
  ],
};

/* ── certainty ──────────────────────────────────────────────────────────────
 * The founder's #1 trust-killer. INPUT is kept narrow and BOT-DIRECTED
 * ("promise me", "guarantee me") so it never eats a user's own enthusiasm.
 * OUTPUT catches manufactured certainty in the model's prose. Deliberately
 * does NOT screen Clownbot's own signature hyperbole ("I'd stake my wig",
 * "wig on the ceiling", "delulu") — that self-aware overreach is the
 * PRODUCT, not the false authoritative certainty the founder is worried
 * about. */
export const CERTAINTY: Gate = {
  input: [
    /\bpromise me\b/,
    /\bguarantee me\b/,
    /\bcan you guarantee\b/,
    /\bbet your (life|wig)\b/,
    /\bswear (to me )?(its|it is|that|on)\b/,
    /\b100 percent sure\b/,
  ],
  output: [
    // Scoped to "I guarantee" / bare "guaranteed" (2026-08-14 fix, Finding 1)
    // — the old bare `guarantee(d|s|ing|)?` stem matched "a deal guaranteeing
    // future ownership" (Big Machine/Republic history), a factual descriptor
    // with no manufactured-certainty claim at all.
    /\bi guarantee(s)?\b/,
    /\bguaranteed\b/,
    /\b100 percent\b/,
    /\bone hundred percent\b/,
    // Scoped (2026-08-14 fix, Finding 1) — bare "no doubt" matched ordinary
    // enthusiasm ("No doubt this is one of her best bridges"), not certainty
    // about a claim. "zero doubt" below is left bare: it is not the common
    // colloquial-praise phrase "no doubt" is.
    /\bno doubt (about it|whatsoever|in (my|your) mind)\b/,
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
    // Paraphrased manufactured-certainty idiom, zero trigger token
    // (2026-08-14 fix, Finding 2 — manufactured-certainty probe).
    /\bput your house on\b/,
    /\bno version of this where\b/,
  ],
};
