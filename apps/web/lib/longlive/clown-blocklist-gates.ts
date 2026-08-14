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
    /(?<!\b(theory|take|wig|idea|guess|read|bit|hunch|prediction|call|one|this|that|it) )\bis (a |an )?(\w+ )?(garbage|trash|a joke|a hack|a fraud|a clown|mediocre|the worst|worthless|nothing special)\b/,
  ],
};
