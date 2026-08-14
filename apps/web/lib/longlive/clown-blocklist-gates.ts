/**
 * Clownbot — the raw TOPIC GATE data for `clown-blocklist.ts`.
 *
 * Split out purely to keep `clown-blocklist.ts` under the repo's 300-line
 * file guideline (this data alone is ~200 lines of regex + rationale
 * comments, ported verbatim and none of it may be deleted — see that file's
 * header). Ported verbatim from clownbot-safety.ts's BODY/HEALTH/SEXUALITY/
 * LOCATION/RELATIONSHIP/FAMILY/accusation/SEXUAL/POLITICS/OTHER_ARTISTS
 * gates, plus the SEXUALIZATION_TERMS mirror additions to SEXUAL (see
 * clown-blocklist.ts for the mirror-not-import pointer comment).
 */
import type { Gate } from './clown-blocklist';

export const BODY: Gate = {
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
    // Foreign-language pregnancy triggers.
    /\bembarazada\b/,
    /\bschwanger\b/,
    /\benceinte\b/,
    /\bincinta\b/,
    /\bgravida\b/,
    /\bzwanger\b/,
    /\bencinta\b/,
  ],
  // Output patterns (2026-08-14, Finding 1 + Finding 2): a deliberate, narrow
  // set — NOT a fallback to `input` (see clown-safety.ts's screenOutput/
  // screenTopicOutput). Bare `pregnan` stays input+tight only; the phrase-
  // level patterns below are answer-safe.
  output: [
    /\bbaby bump\b/,
    /\bexpecting a (baby|child)\b/,
    /\b(weight|body) (gain|loss|change|shape|check)\b/,
    /\bplastic surgery\b/,
    /\bboob job\b/,
    /\beating disorder\b/,
    /\bbody count\b/,
    /\bhas she had work done\b/,
    // Pregnancy-speculation euphemism, zero trigger token (Finding 2).
    /\b(hiding|concealing) (a |her )?(silhouette|bump|figure)\b/,
  ],
  tight: [/pregnan/, /babybump/, /boobjob/, /plasticsurgery/, /eatingdisorder/],
};

export const HEALTH: Gate = {
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
  // Scoped to a she/taylor subject (2026-08-14 fix, Finding 1) — the old
  // bare `diagnos` stem (via input-fallback) matched "I diagnosed a whole
  // color theory off a stone", which has nothing to do with her health.
  output: [
    /\bmental (health|illness|breakdown)\b/,
    /\b(she|taylor|shes|taylors)\b[^.?!]{0,20}\b(diagnosed|diagnosis)\b/,
    /\b(she|taylor|shes|taylors) (is |was )?(on )?medication\b/,
    /\bin rehab\b/,
    /\bsubstance abuse\b/,
    /\bdrug problem\b/,
    /\bhealth scare\b/,
  ],
};

/* Sexuality: stems + proximity so DECLARATIVES and past tense are caught, not
 * just questions. Bare orientation nouns are in per the founder's explicit
 * list; "came out" is restricted to "came out AS <orientation>" so it cannot
 * collide with release "coming out". */
export const SEXUALITY: Gate = {
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
    // Foreign-language orientation triggers.
    /\blesbiana\b/,
    /\blesbica\b/,
    /\blesbisch\b/,
    /\bhomosexuell\b/,
  ],
  // Deliberate, narrow output set (2026-08-14): the two input patterns below
  // already require she/taylor + orientation-word proximity (or the
  // possessive "her girlfriend/gf"), so they are answer-safe as-is — unlike
  // the bare orientation-noun stems above, which stay input+tight only.
  // DOCUMENTED GAP (Finding 2): a token-free sexuality-speculation paraphrase
  // ("Track five was never about a man. The person it is about has been
  // three rows back...", clown-battery-corpus-tier-b.ts's tb-priv-02) is NOT
  // caught here. A pattern general enough to catch that paraphrase collides
  // with legitimate lyric interpretation the 48-prompt over-refusal guard
  // protects (e.g. "What is track five on Midnights really about?") — this
  // is exactly the semantic-classification job the shelved Tier B model was
  // for (see clown-safety.ts header), not something regexing on phrasing can
  // safely close.
  output: [
    /\b(taylor|she|shes|taylors) (is |was |secretly )?(gay|a lesbian|bisexual|closeted|in the closet)\b/,
    /\bher (girlfriend|gf)\b/,
  ],
  tight: [
    /gaylor/,
    /kaylor/,
    /lesbian/,
    /bisexual/,
    /closeted/,
    /comingoutas/,
    /is(taylor|she)(gay|queer|bi\b|alesbian)/,
    /(taylor|she)is(gay|queer|bisexual|alesbian|inthecloset)/,
    /shes(gay|queer|alesbian)/,
    /hergirlfriend/,
  ],
};

export const LOCATION: Gate = {
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
  output: [
    /\bher (address|house|home|apartment|condo|penthouse|estate|mansion)\b/,
    /\bhome address\b/,
    /\bzip code\b/,
    /\bpostcode\b/,
    /\btail number\b/,
    /\bflight (number|tracker|log|path)\b/,
    /\bprivate jet\b/,
    /\bjet track/,
    /\bsecurity (detail|team|route)\b/,
    // Location-by-directions with zero trigger token (2026-08-14 fix,
    // Finding 2 — private-topic probe: turn-by-turn directions culminating
    // in a "this one is hers" reveal).
    /\bwhich (one|house|place|door|gate) is hers\b/,
  ],
  tight: [/homeaddress/, /heraddress/, /tailnumber/, /privatejet/],
};

export const RELATIONSHIP: Gate = {
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
  output: [
    // Scoped to a subject (2026-08-14) — bare "cheat(ing|ed)?" is too broad
    // for output prose and is deliberately left off this list.
    /\b(she|taylor|they)\b[^.?!]{0,15}\bdivorc/,
    /\baffair\b/,
    /\btrouble in paradise\b/,
    /\btension between\b/,
    /\bis the (relationship|marriage|engagement) (fake|pr|a stunt|real)\b/,
    /\bpr (stunt|relationship|contract)\b/,
    // Relationship-is-fake with zero trigger token (Finding 2 — private-topic probe).
    /\brunning out the clock on (an|the|their) arrangement\b/,
  ],
};

export const FAMILY: Gate = {
  input: [
    /\bher (mom|mum|mother|dad|father|brother|sister|parents) (is|are|has|have) (sick|ill|dying)\b/,
    /\b(is|are|was|were) her (mom|mum|mother|dad|father|brother|sister|parents) (sick|ill|dying|ok|okay|unwell)\b/,
    /\bhealth of her (mom|mum|mother|dad|father)\b/,
    /\bher (niece|nephew|kids|children)\b/,
    /\bfamily secret\b/,
    /\bestranged from\b/,
  ],
  // Already phrase-level (not bare stems), so safe to reuse verbatim for
  // output (2026-08-14).
  output: [
    /\bher (mom|mum|mother|dad|father|brother|sister|parents) (is|are|has|have) (sick|ill|dying)\b/,
    /\b(is|are|was|were) her (mom|mum|mother|dad|father|brother|sister|parents) (sick|ill|dying|ok|okay|unwell)\b/,
    /\bhealth of her (mom|mum|mother|dad|father)\b/,
    /\bher (niece|nephew|kids|children)\b/,
    /\bfamily secret\b/,
    /\bestranged from\b/,
  ],
};

export const ACCUSATION: Gate = {
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
  // Scoped to a she/taylor subject (2026-08-14) — the bare
  // criminal/fraud/illegal/lawsuit stems above are too broad for output.
  output: [
    /\b(she|taylor|shes|taylors) (stole|plagiari[sz]ed)\b/,
    /\b(she|taylor|shes|taylors) (was |is |got )?(sued|charged|convicted|indicted)\b/,
    /\b(she|taylor|shes|taylors)\b[^.?!]{0,20}\b(tax evasion|committed fraud|facing a lawsuit|court case)\b/,
  ],
};

export const SEXUAL: Gate = {
  input: [
    /\bsex life\b/,
    /\bin bed\b/,
    /\bnudes?\b/,
    /\bnaked\b/,
    /\bexplicit (photos|pics|images)\b/,
    /\bdeepfake\b/,
    /\bsexual(ly)? (explicit|graphic)\b/,
    /\bfan ?fic(tion)? about (taylor|her) and\b/,
    // Mirrored from SEXUALIZATION_TERMS (see clown-blocklist.ts header + the
    // pointer comment on scripts/content-engine/config.mjs `safety.
    // sexualizationTerms`).
    /\btopless\b/,
    /\bsex ?tape\b/,
    /\bleaked (photo|photos|pics)\b/,
    /\bupskirt\b/,
    /\bnip ?slip\b/,
    /\bonlyfans\b/,
    /\bexplicit photo\b/,
    /\bintimate photos\b/,
    /\bbikini body\b/,
    /\bcleavage\b/,
    /\brevealing\b/,
    /\bthirst trap\b/,
  ],
  output: [
    /\bsex life\b/,
    /\bin bed\b/,
    /\bnudes?\b/,
    /\bnaked\b/,
    /\bexplicit (photos|pics|images|photo)\b/,
    /\bdeepfake\b/,
    /\bsexual(ly)? (explicit|graphic)\b/,
    /\btopless\b/,
    /\bsex ?tape\b/,
    /\bleaked (photo|photos|pics)\b/,
    /\bupskirt\b/,
    /\bnip ?slip\b/,
    /\bonlyfans\b/,
    /\bintimate photos\b/,
    /\bbikini body\b/,
    /\bcleavage\b/,
    // Scoped to a sexualizing noun (2026-08-14 fix, Finding 1) — bare
    // "revealing" matched "The bridge is revealing in how the melody turns."
    /\brevealing (photo|photos|pics|outfit|dress|shot|shots|look)\b/,
    /\bthirst trap\b/,
  ],
};

/* Politics: subject-agnostic (she|taylor|her) proximity, screened on output
 * too. No bare partisan words — proximity to a Taylor subject keeps neutral
 * history ("the 2024 election tour break") from tripping it. */
export const POLITICS: Gate = {
  input: [
    /\b(who|which) (did|does|should) (she|taylor) (vote|endorse)\b/,
    /\b(she|taylor|her)\b[^.?!]{0,18}\b(vote|voted|votes|voting|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b/,
    /\b(vote|voted|votes|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b[^.?!]{0,18}\b(she|taylor|her)\b/,
    /\bher (politics|political (views|opinions|stance|endorsement))\b/,
    /\btell me her ballot\b/,
  ],
  // Already subject-scoped proximity patterns, so safe to reuse verbatim for
  // output (2026-08-14) — see the header note above ("screened on output too").
  output: [
    /\b(she|taylor|her)\b[^.?!]{0,18}\b(vote|voted|votes|voting|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b/,
    /\b(vote|voted|votes|ballot|democrat|republican|liberal|conservative|endorse|endorsed|election|politics|political)\b[^.?!]{0,18}\b(she|taylor|her)\b/,
  ],
};

/* Other artists: TARGET-AGNOSTIC. INPUT catches "roast/drag/trash/slander
 * <anyone-but-us>" and comparative baiting. OUTPUT catches disparagement
 * ADJECTIVES that cannot belong to a Taylor-positive take. */
export const OTHER_ARTISTS: Gate = {
  input: [
    /\b(roast|drag|trash|slander|shade|destroy|bury|clown on|tear (into|apart)|rip (into|apart)|dunk on)\b[^.?!]{0,12}\b(?!me\b|us\b|you\b|yourself\b|my\b|our\b|this\b|that\b|the\b|it\b|taylor\b|her\b|them\b|myself\b)[a-z]{2,}\b/,
    /\bsay something (mean|bad|nasty|awful) about\b/,
    /\bis (better|worse) than\b/,
    /\bwho would win\b/,
    /\bwho ?s better,? (taylor|her)\b/,
  ],
  output: [
    /\b(talentless|no ?talent|washed ?up|overrated|derivative|hack job|a hack|a fraud|a nobody|a rip ?off|cant (sing|write|read music))\b/,
    // Widened (2026-08-14 fix, Finding 2) from `(\w+ )?` (one optional
    // filler word) to `(\w+ ){0,3}` — two adjectives ("frankly pretty
    // mediocre") defeated the old one-word gap; the lookbehind above still
    // excludes Clownbot's own self-deprecation ("my theory is garbage").
    /(?<!\b(theory|take|wig|idea|guess|read|bit|hunch|prediction|call|one|this|that|it) )\bis (a |an )?(\w+ ){0,3}(garbage|trash|a joke|a hack|a fraud|a clown|mediocre|the worst|worthless|nothing special)\b/,
    // Disparagement with no disparagement adjective at all (Finding 2 —
    // adjective-gap-disparagement probe).
    /\b(never|hasn'?t) (once )?written (a |an )?\w+ worth (remembering|hearing|singing)\b/,
  ],
};
