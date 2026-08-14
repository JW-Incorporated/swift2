/**
 * Clownbot — THE TOPIC BLOCKLIST (deterministic, phrase-based).
 *
 * Ported from `clownbot-safety.ts` (build A, V2 rebuild). This file owns the
 * "topic" redlines — categories a message can trip regardless of who is
 * speaking: relationship-existence speculation, health, pregnancy, sexuality,
 * family/minors, legal wrongdoing (accusation), private individuals
 * (location), sexual content, politics, and other-artists disparagement.
 *
 * The BEHAVIOUR redlines — impersonation, official/insider/human claims, and
 * manufactured certainty — live in `clown-safety.ts` instead: they are about
 * WHO is speaking / HOW confidently, not about a topic, and `clown-safety.ts`
 * combines both sets into the single `screenInput`/`screenOutput` gate a
 * caller actually wants. `screenTopic()` below is the narrower, topic-only
 * entry point this module owns on its own.
 *
 * MIRROR, NOT IMPORT (repo precedent: scripts/content-engine/checkers/
 * hot-thin-topic.mjs mirrors `CONFIRMED_TIER` from apps/web/lib/longlive/
 * types.ts with a pointer comment, because a plain-node checker can't import
 * a TS constant). Here the boundary runs the other way: `apps/web` cannot
 * import from `scripts/` without breaking the build. `SEXUALIZATION_TERMS`
 * below is a literal, hand-kept copy of `scripts/content-engine/config.mjs`
 * `CONFIG.safety.sexualizationTerms` — if that array changes, update both.
 *
 * `illegalTerms`, `privacySpeculationTerms`, and `locationPrivacyTerms` in
 * that same config are deliberately NOT mirrored into blocking triggers here.
 * That config's own comments say they are "candidates, NOT findings" for a
 * human/agent to classify — the opposite deterministic-auto-block posture
 * this file needs. Wiring bare "child"/"minor"/"teen" as auto-refuse triggers
 * would misfire hard on ordinary Taylor biography ("she signed her first
 * deal as a teenager"), which is exactly the over-refusal failure mode this
 * module's V2 rebuild was built to avoid (see clown-safety.ts header). The
 * FAMILY and LOCATION gates below already cover the deterministic-safe slice
 * of those lists (her niece/nephew/kids/children; her address/home/jet).
 */

export interface Gate {
  input: readonly RegExp[];
  output?: readonly RegExp[];
  tight?: readonly RegExp[];
}

export type BlocklistCategory =
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
 * Normalise for matching: lowercase, strip diacritics (so "fiancé" does not
 * become "fianc "), strip apostrophes so "taylor's" and "taylors" collide,
 * then collapse every other run of non-alphanumerics to a single space.
 * Callers pad with spaces so whole-phrase matching works at string edges.
 * Ported verbatim from clownbot-safety.ts.
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
 * because they are not [a-z]; folding them back to Latin before the tight
 * pass closes that bypass. Leet digits fold too (T4ylor, pr3gnant, g@y).
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
 * The TIGHT variant. Lowercase, fold homoglyphs/leet, then remove EVERY
 * separator and space so an attacker who spread a banned token across
 * characters — "p r e g n a n t", "t-a-y-l-o-r", "pr3gnant" — sees it
 * collapse back onto the stem. Only unambiguous single-token stems are
 * matched against this string (see the `tight` arrays below): multi-word
 * phrases and bare common words are NOT, because the tight string has no
 * boundaries and would over-match. Ported verbatim from clownbot-safety.ts.
 */
export function tighten(text: string): string {
  const folded = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((ch) => FOLD[ch] ?? ch)
    .join('');
  return folded.replace(/[^a-z0-9]+/g, '');
}

/**
 * Mirrored from `scripts/content-engine/config.mjs` `CONFIG.safety.
 * sexualizationTerms`. Keep this literal array in sync by hand — see the
 * header comment above for why it is copied, not imported.
 */
export const SEXUALIZATION_TERMS: readonly string[] = [
  'nude', 'nudes', 'naked', 'topless', 'sex tape', 'sextape', 'leaked photo',
  'leaked photos', 'leaked pics', 'upskirt', 'nip slip', 'nipslip',
  'onlyfans', 'explicit photo', 'intimate photos', 'bikini body', 'cleavage',
  'revealing', 'thirst trap',
];

/* ── topic categories: symmetric input/output ──────────────────────────────
 * Ported verbatim from clownbot-safety.ts's BODY/HEALTH/SEXUALITY/LOCATION/
 * RELATIONSHIP/FAMILY/accusation/SEXUAL/POLITICS/OTHER_ARTISTS gates. Moved to
 * clown-blocklist-gates.ts to keep this file under the 300-line guideline —
 * see that file's header. */
export {
  BODY,
  HEALTH,
  SEXUALITY,
  LOCATION,
  RELATIONSHIP,
  FAMILY,
  ACCUSATION,
  SEXUAL,
  POLITICS,
  OTHER_ARTISTS,
} from './clown-blocklist-gates';
import {
  BODY,
  HEALTH,
  SEXUALITY,
  LOCATION,
  RELATIONSHIP,
  FAMILY,
  ACCUSATION,
  SEXUAL,
  POLITICS,
  OTHER_ARTISTS,
} from './clown-blocklist-gates';

export const BLOCKLIST_GATES: Readonly<Record<BlocklistCategory, Gate>> = {
  body: BODY,
  health: HEALTH,
  sexuality: SEXUALITY,
  location: LOCATION,
  relationship: RELATIONSHIP,
  family: FAMILY,
  accusation: ACCUSATION,
  sexual: SEXUAL,
  politics: POLITICS,
  'other-artists': OTHER_ARTISTS,
};

/**
 * Patterns that screen a USER'S QUESTION but must not screen CLOWNBOT'S
 * ANSWER. "Fans accused her team of using AI" is a real, major-outlet-
 * reported lore item Clownbot is supposed to be able to discuss; without this
 * the output gate would discard that answer.
 */
export const INPUT_ONLY: readonly RegExp[] = [/\baccused of\b/, /\bcancel(l)?ed for\b/];

export function isInputOnlyPattern(re: RegExp): boolean {
  return INPUT_ONLY.some((skip) => skip.source === re.source);
}

/** Relative order of the topic-only categories, preserved from clownbot-safety.ts's ORDER. */
export const BLOCKLIST_ORDER: readonly BlocklistCategory[] = [
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

export function matchesPatterns(
  patterns: readonly RegExp[] | undefined,
  subject: string,
  skipInputOnly: boolean,
): boolean {
  if (!patterns) return false;
  return patterns.some((re) => (skipInputOnly ? !isInputOnlyPattern(re) : true) && re.test(subject));
}

/**
 * The blocklist entry point — pre-spend TOPIC screen only (no impersonation/
 * official/certainty; see clown-safety.ts for the combined gate). Runs with
 * no API key, no network, no cost.
 */
export function screenTopic(text: string): BlocklistCategory | null {
  const normalized = ` ${normalize(text)} `;
  const tight = tighten(text);
  for (const category of BLOCKLIST_ORDER) {
    const gate = BLOCKLIST_GATES[category];
    if (matchesPatterns(gate.input, normalized, false) || matchesPatterns(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}

/** Post-generation TOPIC screen — the output-side counterpart of `screenTopic`. */
export function screenTopicOutput(parts: readonly (string | undefined)[]): BlocklistCategory | null {
  const joined = parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' \n ');
  if (!joined) return null;
  const normalized = ` ${normalize(joined)} `;
  const tight = tighten(joined);
  for (const category of BLOCKLIST_ORDER) {
    const gate = BLOCKLIST_GATES[category];
    const usingOutput = gate.output !== undefined;
    const patterns = gate.output ?? gate.input;
    if (matchesPatterns(patterns, normalized, !usingOutput) || matchesPatterns(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}
