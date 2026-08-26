/**
 * Clownbot — THE DETERMINISTIC REFUSAL LAYER (rebuild, ported from build A's
 * `clownbot-safety.ts` V2). See that file's history for the full red-team
 * narrative (three harnesses, session 2026-08-11/12) — condensed here:
 *
 * Boundary judgment is exactly where a small fast model fails, and every
 * failure here is a screenshot. Boundary enforcement is BUILT not to depend
 * on the persona prompt holding, on both sides of the gate:
 *   - INPUT (`screenInput`) is fully prompt-independent already.
 *   - OUTPUT (`screenOutput`) used to silently fall back to the INPUT
 *     patterns for any category without its own `output` list — which
 *     over-matched the bot's own prose (an input-tuned `\bdiagnos` stem
 *     caught "I diagnosed a whole color theory") AND under-matched real
 *     redlines (paraphrased first-person-as-Taylor narration with zero
 *     trigger token sailed straight through). As of 2026-08-14 every
 *     category in `clown-safety-gates.ts` / `clown-blocklist-gates.ts` owns
 *     a deliberate, narrow `output` list instead — see
 *     clown-safety.test.ts's "Finding 1" / "Finding 2" suites, which are the
 *     regression lock for both directions.
 * That output net is NOT airtight: one class (sexuality speculation phrased
 * with zero orientation word, e.g. "the person it's about has been three
 * rows back at every show") is a DOCUMENTED gap — see the comment on
 * `SEXUALITY.output` in clown-blocklist-gates.ts for why closing it
 * deterministically risks eating legitimate lyric interpretation instead.
 * This module is pure TypeScript, runs with no API key, is unit-tested
 * directly, and cannot be argued with — there is no prompt for a user to
 * talk their way around.
 *
 * WHAT THIS FILE OWNS vs. what moved out in the rebuild's split:
 *   - THIS FILE: the BEHAVIOUR redlines (impersonation, official/insider/
 *     human, manufactured certainty — about WHO is speaking / HOW
 *     confidently), the refusal copy for every category, and the combined
 *     `screenInput`/`screenOutput`/`screenConversation` entry points a
 *     caller actually wants (behaviour + topic categories together, in the
 *     exact category-precedence order build A shipped).
 *   - `clown-blocklist.ts` (+ `clown-blocklist-gates.ts`): the TOPIC
 *     redlines — relationship-existence speculation, health, pregnancy,
 *     sexuality, family/minors, legal wrongdoing, private individuals,
 *     sexual content, politics, other-artists. Its own `screenTopic()` is a
 *     narrower, topic-only entry point this file composes into the full
 *     gate below.
 *   - `mood-safety.ts`: the crisis path. This file does NOT fork a second
 *     crisis lexicon — `crisisCheck` below is a thin wrapper reusing
 *     `assessCrisis` and the verbatim `CRISIS_MESSAGE`/`CRISIS_MESSAGE_ABUSE`.
 *   - `clown-safety-gates.ts`: the raw IMPERSONATION/OFFICIAL/CERTAINTY
 *     regex data, split out purely for file-length hygiene.
 *
 * Tier B (a dedicated semantic output classifier) from build A's V2 is NOT
 * carried forward in this rebuild — see docs/proposals/2026-08-13-clownbot-
 * shelved-content.md. This module is the WHOLE deterministic floor now.
 *
 * WHAT MUST NOT REGRESS: over-refusal at 0/48. The 48 legitimate clowning
 * prompts (release "coming out", vault, Debut TV, TS13, countdown, number/
 * color theory, "grade my theory", exes at canon level, documented feuds
 * neutral, "her body of work") MUST still engage. Every pattern here and in
 * clown-blocklist(-gates).ts is scoped so it cannot eat a legitimate take.
 */
import {
  BLOCKLIST_GATES,
  matchesPatterns,
  normalize,
  tighten,
  type BlocklistCategory,
  type Gate,
} from './clown-blocklist';
import { CERTAINTY, IMPERSONATION, OFFICIAL } from './clown-safety-gates';
import { CRISIS_MESSAGE, CRISIS_MESSAGE_ABUSE, assessCrisis } from './mood-safety';
import {
  docToRetrievedItem,
  formatItem,
  FALLBACK_EMPTY,
  FALLBACK_INTRO_CHIP,
  FALLBACK_INTRO_DEGRADED,
  FALLBACK_OUTRO,
} from './clown-fallback';
import { allClownDocs } from './clown-index';

// Re-exported so callers of the crisis path never need to know it lives in
// mood-safety.ts — see the module header: reuse, not a fork.
export { CRISIS_MESSAGE, CRISIS_MESSAGE_ABUSE };

export type Redline = BlocklistCategory | 'impersonation' | 'official' | 'certainty';

/**
 * Version stamp for the safety guard, carried over from build A. The model
 * path refuses to spend unless the operator has explicitly opted in — see
 * clown-client.ts (a later step) for how that gate is wired in this rebuild.
 */
export const SAFETY_VERSION = 'v2' as const;

/** Every category returns deterministic copy and spends nothing. */
export interface RefusalCopy {
  category: Redline;
  message: string;
}

/**
 * The refusals. Each one: names the boundary honestly, stays in voice,
 * grounds itself in a real fandom norm or something Taylor herself put on
 * the record, and hands the user something else to do in the same breath.
 * Ported verbatim from clownbot-safety.ts.
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
 * The full category set, in the exact precedence order build A shipped:
 * impersonation and official first (the founder's hard constraints), then
 * the categories where a wrong answer does the most damage. A message that
 * trips several returns the earliest — the most protective one. Composed
 * from the behaviour gates (this file) and the topic gates
 * (clown-blocklist.ts) so a single combined loop preserves that ordering
 * exactly, rather than checking one module then the other.
 */
const GATES: Readonly<Record<Redline, Gate>> = {
  impersonation: IMPERSONATION,
  official: OFFICIAL,
  certainty: CERTAINTY,
  ...BLOCKLIST_GATES,
};

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
// This is BLOCKLIST_ORDER's topic-category set (clown-blocklist.ts) with
// 'impersonation', 'official', and 'certainty' interleaved back in at their
// original build-A positions — a plain array literal, not a re-derivation,
// because the interleaving can't be expressed as a transform of the topic-
// only order. clown-blocklist.test.ts and clown-safety.test.ts each pin
// their own gate's category set, so the two orders cannot silently drift.

/**
 * GATE 1 — pre-spend input screen. Returns the category to refuse with, or
 * null to proceed. Runs with no API key, no network, no cost. Ported
 * verbatim (as a combined loop over both gate sets) from clownbot-safety.ts.
 */
export function screenInput(text: string): Redline | null {
  const normalized = ` ${normalize(text)} `;
  const tight = tighten(text);
  for (const category of ORDER) {
    const gate = GATES[category];
    if (matchesPatterns(gate.input, normalized, false) || matchesPatterns(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}

/**
 * GATE 2 — post-generation deterministic output screen. Runs over every
 * string the model produced, concatenated. A hit here discards the whole
 * answer. Ported verbatim from clownbot-safety.ts.
 */
export function screenOutput(parts: readonly (string | undefined)[]): Redline | null {
  const joined = parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' \n ');
  if (!joined) return null;
  const normalized = ` ${normalize(joined)} `;
  const tight = tighten(joined);
  for (const category of ORDER) {
    const gate = GATES[category];
    const usingOutput = gate.output !== undefined;
    const patterns = gate.output ?? gate.input;
    if (matchesPatterns(patterns, normalized, !usingOutput) || matchesPatterns(gate.tight, tight, false)) {
      return category;
    }
  }
  return null;
}

/** One transcript turn as `screenConversation` needs it — structurally the
 * same shape as `clown-client.ts`'s `ClownTurn`, deliberately not imported
 * from there (that module explicitly does not depend on this one; see its
 * header). Callers with a `ClownTurn[]` (the route) pass it straight through. */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Exact text of every refusal this module itself hands back, so a stored
 * refusal re-screened on the NEXT turn is recognised as our own already-safe
 * copy rather than re-run through the gates (2026-08-14 fix, Finding 1 — see
 * below). Exact string match only, never a heuristic: a loose match here
 * would let an attacker smuggle content past the gate by imitating a
 * refusal's wording. */
const REFUSAL_TEXTS: ReadonlySet<string> = new Set(Object.values(REFUSALS));

/** Lazily built the first time a stored assistant turn actually LOOKS
 * fallback-shaped (see `isFallbackAnswerText` below) — every call site that
 * only ever hands this module refusal/attack strings (most of this file's
 * own test suite included) never touches the real corpus, so importing this
 * module stays cheap for them. */
let fallbackItemLinesCache: ReadonlySet<string> | null = null;

function knownFallbackItemLines(): ReadonlySet<string> {
  if (!fallbackItemLinesCache) {
    fallbackItemLinesCache = new Set(allClownDocs().map((doc) => formatItem(docToRetrievedItem(doc))));
  }
  return fallbackItemLinesCache;
}

/**
 * Recognises a stored assistant turn as the deterministic zero-model
 * fallback (`clown-fallback.ts`'s `composeFallback`) — never model prose,
 * and never trusted because a caller SAYS so. `composeFallback`'s exact join
 * shape is `[intro, '', ...itemLines, '', outro].join('\n')` (or the single
 * fixed `FALLBACK_EMPTY` string when retrieval came back empty). This
 * re-derives that shape and requires the fixed intro/outro lines to be
 * byte-exact AND every middle line to be a byte-exact match against a line
 * the REAL corpus (`allClownDocs()`) would produce for some doc, via the
 * same `formatItem` the composer itself calls — never a partial/prefix
 * match, never a client-supplied flag. An attacker who wraps injected text
 * between the real fixed intro and outro cannot pass: their injected line is
 * not a byte-exact corpus line, so the match fails and the turn falls
 * through to the normal `screenOutput` gate below, same as any other
 * assistant turn.
 */
function isFallbackAnswerText(text: string): boolean {
  if (text === FALLBACK_EMPTY) return true;
  const lines = text.split('\n');
  if (lines.length < 5) return false;
  const first = lines[0];
  if (first !== FALLBACK_INTRO_DEGRADED && first !== FALLBACK_INTRO_CHIP) return false;
  if (lines[1] !== '') return false;
  if (lines[lines.length - 1] !== FALLBACK_OUTRO) return false;
  if (lines[lines.length - 2] !== '') return false;
  const itemLines = lines.slice(2, lines.length - 2);
  if (itemLines.length === 0) return false;
  const known = knownFallbackItemLines();
  return itemLines.every((line) => known.has(line));
}

/**
 * CONVERSATION-LEVEL screen. The single-turn route calls `screenInput`; when
 * the surface gains history, pass the ordered turns here so an escalation
 * that lands on a turn the per-turn gate happens to miss is still caught at
 * the conversation level. Returns the first turn's category, or null.
 *
 * 2026-08-14 fix (Finding 1, round-2 review): this used to run `screenInput`
 * — INPUT-tuned patterns — over every stored turn regardless of who wrote
 * it, including the bot's OWN refusal copy and its own legitimate prose.
 * Four of the thirteen refusals tripped their own gate on re-screen (a
 * self-tripping refusal appends more self-tripping text, and with a capped
 * transcript that never clears, one refusal could permanently brick the
 * session). Fixed two ways, together — switching the pattern set alone is
 * NOT sufficient, because several refusals also trip their OWN topic's
 * `output` patterns (they are text ABOUT the boundary they refuse, e.g. the
 * politics refusal contains the phrase "her politics"):
 *   - Each turn is screened with the patterns appropriate to who wrote it —
 *     user turns (the actual jailbreak-smuggling threat this exists to stop)
 *     keep running `screenInput`; assistant turns run `screenOutput`.
 *   - A stored assistant turn that is an EXACT match for one of the known
 *     `REFUSALS` strings is skipped outright — it is copy this module wrote
 *     and already knows is safe, so re-screening it only risks a false trip.
 *     Exact string match keeps this narrow: nothing an attacker paraphrases
 *     can hit it.
 *
 * 2026-08-15 fix (two more findings from the same class of bug — a REFUSED
 * or FALLBACK turn poisoning turns after it):
 *   - A prior USER turn is skipped when its immediately-following turn is an
 *     assistant turn whose text is an EXACT `REFUSAL_TEXTS` match. That user
 *     turn was already adjudicated — it was screened once, refused, and the
 *     paired refusal is the proof. Re-running `screenInput` on it every
 *     later turn re-punishes whatever question comes next, for as long as it
 *     sits in the capped window. This does NOT weaken screening of the
 *     CURRENT turn (the route always screens that independently, first,
 *     before this function ever runs) and does NOT let a client invent an
 *     exemption: the pairing only fires when the NEXT turn's text is one of
 *     the 13 fixed strings this module itself wrote, so the worst a forged
 *     pair can smuggle past re-screening is `[attacker's turn, a verbatim
 *     refusal]` — the model sees "asked, then firmly refused," never an
 *     agreement, and the model's own fresh output is still gated below by
 *     `screenClownTake` before anything is returned.
 *   - A stored assistant turn that `isFallbackAnswerText` recognises is
 *     skipped the same way `REFUSAL_TEXTS` is: it is never model output
 *     (`composeFallback` calls no model), it was never screened before being
 *     returned the first time (unlike a model take, which passes
 *     `screenClownTake` at generation), and a handful of corpus docs'
 *     honestly-worded framing (quoting Taylor's own words, e.g. a "Hi, I'm
 *     Taylor" moment) can trip `screenOutput`'s IMPERSONATION patterns on
 *     re-screen even though the content was correct and safe to show the
 *     first time. See `isFallbackAnswerText` above for why this cannot be
 *     spoofed with injected text.
 */
export function screenConversation(turns: readonly ConversationTurn[]): Redline | null {
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role === 'assistant') {
      const hit = screenTurn(turn);
      if (hit) return hit;
      continue;
    }
    const next = turns[i + 1];
    if (next?.role === 'assistant' && REFUSAL_TEXTS.has(next.text)) continue;
    const hit = screenTurn(turn);
    if (hit) return hit;
  }
  return null;
}

/**
 * Per-turn, role-aware dispatch — user turns run `screenInput`, assistant
 * turns run `screenOutput`, with the same recognized-safe-copy exemptions
 * `screenConversation` applies above (an exact `REFUSAL_TEXTS`/fallback-
 * answer match is skipped, never re-punished). Extracted so a caller that
 * needs per-TURN (not whole-conversation) screening doesn't have to
 * reinvent this dispatch — e.g. `clown-memory.ts`'s fold-time screening
 * (HUMAN-ACTIONS.md #15 round 4), which drops a turn that fails its own
 * screen from what gets folded into the rolling summary rather than
 * surfacing a refusal. `screenConversation` above uses this too, for every
 * turn except the conversation-level adjacent-refusal pairing check (which
 * is inherently about NEIGHBORING turns, not a single turn in isolation).
 */
export function screenTurn(turn: ConversationTurn): Redline | null {
  if (turn.role === 'assistant') {
    if (REFUSAL_TEXTS.has(turn.text) || isFallbackAnswerText(turn.text)) return null;
    return screenOutput([turn.text]);
  }
  return screenInput(turn.text);
}

/**
 * The crisis path — REUSES mood-safety.ts's `assessCrisis` and the verbatim
 * `CRISIS_MESSAGE`/`CRISIS_MESSAGE_ABUSE`. Do not fork a second crisis
 * lexicon here; this is intentionally a thin pass-through, not a
 * reimplementation. A future route step (not this one) calls this BEFORE
 * `screenInput`, on the raw text — same ordering mood-chat's route uses, so a
 * reader in crisis gets resources even when everything else is degraded.
 */
export function crisisCheck(text: string): { abuse: boolean; message: readonly string[] } | null {
  const assessment = assessCrisis(text);
  if (!assessment.crisis) return null;
  return { abuse: assessment.abuse, message: assessment.abuse ? CRISIS_MESSAGE_ABUSE : CRISIS_MESSAGE };
}
