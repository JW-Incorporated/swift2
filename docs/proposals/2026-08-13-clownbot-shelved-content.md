# Clownbot Shelved Content — 2026-08-13

## Overview

This document preserves verbatim content from the Clownbot V1 implementation as it existed before rebuild to Spec B (PLAN.md, PR #1961). Per the founder's direction: "Anything that we don't re-use let's set aside as potential content for another iteration (don't lose any content)." This is the archive record.

**Date:** 2026-08-13  
**Related work:** PLAN.md (Clownbot V1→V2 rebuild), PR #1961  
**Files deleted in follow-up step:** `apps/web/lib/longlive/clownbot-persona.ts`, `apps/web/lib/longlive/clownbot-ledger.ts`, `apps/web/lib/longlive/clownbot-prompts.ts`, `apps/web/lib/longlive/clownbot-grade.ts`

---

## From `apps/web/lib/longlive/clownbot-persona.ts`

### The Canon (3 entries)

All entries from the `CANON: readonly CanonEntry[]` array (lines 53–68):

```typescript
[
  {
    label: 'Ride-or-die theory',
    text: "The debut re-record is finished. Done, mixed, sitting in a vault waiting for a date with a 13 in it. My evidence: in May 2025 she said she hadn't re-recorded a quarter of REPUTATION. She was asked about the re-records and she named one album. Note what she did not say. I have been asked to let this go by people who love me.",
    loreId: 'rep-tv-debut-tv',
  },
  {
    label: 'The album take I will defend',
    text: "evermore is the better record and folklore got the press. folklore is the one that won the argument; evermore is the one that won the album. I will die on this hill and I will be holding a coconut cake.",
  },
  {
    label: 'How I got clowned',
    text: "I went all in on the Super Bowl LX theory. Levi's Stadium, Sourdough Sam, the whole board, and I told everyone. Then Bad Bunny walked out on 8 February 2026 and I had to sit very still for a while. The receipts were real. The conclusion was a clown car. I regret nothing and I'd do it again tonight.",
    loreId: 'superbowl-lx-swiftie-theory',
  },
]
```

**Source:** `clownbot-persona.ts`, lines 53–68

### Brand & Identity Strings

**CLOWNBOT_NAME** (line 23):
```typescript
export const CLOWNBOT_NAME = 'Clownbot';
```

**CLOWNBOT_TAGLINE** (line 25):
```typescript
export const CLOWNBOT_TAGLINE = 'Evidence-based nonsense about Taylor Swift clues.';
```

**BOT_DISCLOSURE** (lines 31–32):
```typescript
export const BOT_DISCLOSURE =
  "I'm a bot. Not Taylor, not a person, not anyone with inside knowledge — a fan-made clown with a theory board and access to a vault of dated, sourced moments.";
```

**UNOFFICIAL_NOTICE** (lines 35–36):
```typescript
export const UNOFFICIAL_NOTICE =
  'Long Live is an independent fan project. Not affiliated with, endorsed by, or connected to Taylor Swift or her representatives. Nothing here is insider information.';
```

**PRIVACY_NOTE** (line 39):
```typescript
export const PRIVACY_NOTE = "What you type isn't saved.";
```

### Empty State

**EMPTY_STATE_HEADING** (line 71):
```typescript
export const EMPTY_STATE_HEADING = 'Step right up to the theory board';
```

**EMPTY_STATE_BODY** (lines 72–73):
```typescript
export const EMPTY_STATE_BODY =
  "Bring me a clue, a date, a lyric or a rumour and I'll build you a case out of real dated receipts from the vault, argue against myself, then commit to a position I will probably regret. I show my confidence and I keep score of how often I'm wrong.";
```

### Meter & Evidence Labels

**EVIDENCE_LABEL** (line 76):
```typescript
export const EVIDENCE_LABEL = 'Evidence';
```

**CONFIDENCE_LABEL** (line 78):
```typescript
export const CONFIDENCE_LABEL = 'Confidence';
```

**DELULU_LABEL** (line 77) — **RETAINED in Spec B; included here for archive**:
```typescript
export const DELULU_LABEL = 'Delulu';
```

**METER_NOTE** (lines 84–85) — *being dropped*:
```typescript
export const METER_NOTE =
  'Delulu is a compliment. Evidence is scored from the receipts I actually cited — I cannot talk that number up.';
```

### Ledger & Receipts

**LEDGER_HEADING** (line 88):
```typescript
export const LEDGER_HEADING = 'The ledger';
```

**LEDGER_NOTE** (lines 89–90):
```typescript
export const LEDGER_NOTE =
  "Every theory the fandom committed to, and how it landed. I keep the losses in public because a theorist who only shows you the wins is selling something.";
```

**RECEIPTS_HEADING** (line 93):
```typescript
export const RECEIPTS_HEADING = 'Receipts';
```

### Degraded Path (No API Key / Over Cap)

**DEGRADED_STANCE** (lines 102–103):
```typescript
export const DEGRADED_STANCE =
  "My writing hand is off duty, so you get the raw board: here's what the vault actually holds on that, dated and sourced.";
```

**DEGRADED_COUNTERPOINT** (lines 104–105):
```typescript
export const DEGRADED_COUNTERPOINT =
  "Take it as evidence, not as an argument — I'm not going to pretend I built you a case I didn't build.";
```

**DEGRADED_ASIDE** (line 106):
```typescript
export const DEGRADED_ASIDE = 'Normal service resumes shortly. The wig is fine. The wig is always fine.';
```

### Input & Configuration

**NETWORK_ERROR** (line 109):
```typescript
export const NETWORK_ERROR = "That didn't go through. Give it a second and try me again?";
```

**INPUT_PLACEHOLDER** (line 112):
```typescript
export const INPUT_PLACEHOLDER = 'a clue, a date, a lyric, a rumour…';
```

**INPUT_LABEL** (line 115):
```typescript
export const INPUT_LABEL = 'What should Clownbot decode?';
```

**MAX_CHARS** (line 117):
```typescript
export const MAX_CHARS = 400;
```

---

## From `apps/web/lib/longlive/clownbot-ledger.ts`

### wigCountLine() — Self-Deprecating Stat

The full function implementation (lines 130–133), which derives a motivational stat line from the ledger tally:

```typescript
/**
 * The self-deprecating stat, derived rather than written — so the bit stays
 * true as the ledger grows. This is the running gag with a number behind it.
 *
 * The humility has to land on being WRONG (#1998): the old "51 called, 3
 * clowned" led with the wins and read as a brag. Lead with the clownings and
 * name why we keep them — the losses are the product, not the footnote.
 */
export function wigCountLine(): string {
  const { clowned, confirmed } = ledgerTally();
  return `${clowned} clowned, ${confirmed} called — and I put the clownings first, because a theorist who only counts the wins is selling you something.`;
}
```

**Logic:** Fetches clowned/confirmed counts from `ledgerTally()`, formats as a string with template literals, leading with losses and ending with the philosophical note about credibility.

**Source:** `clownbot-ledger.ts`, lines 130–133

---

## From `apps/web/lib/longlive/clownbot-prompts.ts`

### Suggested Prompts Configuration

**PROMPT_COUNT** (line 39):
```typescript
export const PROMPT_COUNT = 9;
```

### Rotating Prompt Selection Logic

The `suggestedPrompts()` function (lines 70–114) implements a rotating 9-chip suggested-prompt selection system. The mechanism works as follows:

**Pool Construction (lines 71–87):**
- Filters LORE items that are not retired (status ≠ 'debunked' without a ledger entry) and have prompts
- Categorizes into three tiers:
  - **Live:** items with status `'rumor'` or `'reported'` within `FRESH_WINDOW_DAYS` (14 days, from clownbot-lore.ts)
  - **Recent:** items aged up to `RECENT_WINDOW_DAYS` (400 days; line 42)
  - **Evergreen:** items tagged `evergreen: true` (no age limit)

**Ordering Priority (lines 89–103):**
1. Live (news cycle first)
2. Evergreens (top 2, ensure minimum coverage)
3. Recent
4. Remaining evergreens

**Deduplication:** Uses `Set<string>` to track seen prompt IDs (`<loreId>#<index>`)

**Rotation (lines 107–113):**
- Deterministic rotation via offset modulo ordered pool length
- Returns exactly `count` prompts (default 9) from the ordered pool starting at computed offset

**Retirement Logic (lines 62–64):** A prompt is retired (excluded) if its source item has status `'debunked'` AND no ledger entry. Items with ledger entries are kept even if debunked (the debunking itself is the content).

**Source:** `clownbot-prompts.ts`, lines 70–114, with configuration on line 39

---

## From `apps/web/lib/longlive/clownbot-grade.ts`

### Scoring Scales & Confidence Bounds

**Evidence Scale** (line 22):
```typescript
export const MAX_EVIDENCE = 5;
```

**Delulu Scale** (line 23):
```typescript
export const MAX_DELULU = 5;
```

**Confidence Ceiling** (line 26) — *being dropped*:
```typescript
export const CONFIDENCE_CEILING = 85;
```

**Confidence Floor** (line 27):
```typescript
export const CONFIDENCE_FLOOR = 3;
```

### Delulu Labels (lines 42–49)

Array used to label delulu scores 0–5:
```typescript
const DELULU_LABELS: readonly string[] = [
  'Barely clowning',
  'Mild clowning',
  'Solid clowning',
  'Certified clowning',
  'Full circus',
  'Wig on the ceiling',
];
```

### Evidence Scoring Rules — scoreEvidence()

Full function (lines 78–101), *being dropped*:

```typescript
/**
 * Score evidence from the receipts actually cited.
 *
 *   +1 per distinct verified receipt, capped at 3
 *   +1 if at least one is confirmed-with-a-source
 *   +1 if there are 2+ receipts and none of them is debunked
 *   hard cap of 1 if ANY cited receipt is debunked — a theory standing on a
 *   dead claim is not well evidenced, however entertaining it is
 *   0 if nothing was cited at all
 */
export function scoreEvidence(receipts: readonly Receipt[]): { score: number; rationale: string } {
  if (receipts.length === 0) {
    return { score: 0, rationale: 'No receipts cited — this is vibes, and I am saying so.' };
  }

  const debunked = receipts.filter((r) => r.status === 'debunked');
  const strong = receipts.filter(isStrong);

  let score = Math.min(receipts.length, 3);
  if (strong.length > 0) score += 1;
  if (receipts.length >= 2 && debunked.length === 0) score += 1;
  score = Math.min(score, MAX_EVIDENCE);

  if (debunked.length > 0) {
    return {
      score: Math.min(score, 1),
      rationale: `Capped: ${debunked.length === 1 ? 'one receipt has' : `${debunked.length} receipts have`} already been debunked, so this is standing on a dead claim.`,
    };
  }

  const parts = [`${receipts.length} receipt${receipts.length === 1 ? '' : 's'} from the vault`];
  if (strong.length > 0) parts.push(`${strong.length} confirmed and sourced`);
  return { score, rationale: `${parts.join(', ')}.` };
}
```

**Scoring Logic:**
- 0 points if no receipts cited
- Base: min(receipt count, 3) — max 3 points for citing distinct receipts
- +1 if at least one receipt is confirmed with sources (strong)
- +1 if 2+ receipts and zero debunked
- **Hard cap:** if any receipt is debunked, final score is min(calculated, 1) — a theory standing on a dead claim cannot score higher than 1
- Returns score and rationale string for display to user

**Source:** `clownbot-grade.ts`, lines 78–101

### Confidence Derivation — deriveConfidence()

Full function (lines 108–111), *being dropped*:

```typescript
/**
 * Derive confidence. More evidence pushes it up, more delulu pulls it down,
 * and the ceiling means the honest answer is always "probably" rather than
 * "definitely".
 */
export function deriveConfidence(evidence: number, delulu: number): number {
  const raw = 10 + evidence * 14 - delulu * 6;
  return Math.max(CONFIDENCE_FLOOR, Math.min(CONFIDENCE_CEILING, Math.round(raw)));
}
```

**Formula:** `raw = 10 + (evidence × 14) − (delulu × 6)`, then clamped to `[CONFIDENCE_FLOOR=3, CONFIDENCE_CEILING=85]`

**Design intent:** Evidence increases confidence (+14 per point), delulu decreases it (−6 per point). The hard ceiling of 85 ensures Clownbot structurally cannot claim certainty, enforcing honest uncertainty.

**Source:** `clownbot-grade.ts`, lines 108–111

---

## Candidates for Reuse in Later Iteration

### Highest Reuse Value

1. **Canon entries (CANON array)** — These three theories are character-defining and independent of the meter/scoring. They can seed any future Clownbot version or character-focused iteration. The lore IDs (`rep-tv-debut-tv`, `superbowl-lx-swiftie-theory`) remain stable.

2. **wigCountLine() ledger stat** — The self-deprecating stat is a unique voice signature. The logic (lead with losses, frame as credibility) is independently useful and doesn't depend on the deprecated scoring system.

3. **Prompt rotation logic** — The categorization (live/recent/evergreen), deduplication, and deterministic rotation are mechanically sound and reusable even if the lore pool or prompt copy changes. The PROMPT_COUNT (9) and pool-building pattern are durable.

4. **Identity & brand strings** — `CLOWNBOT_NAME`, `BOT_DISCLOSURE`, `UNOFFICIAL_NOTICE`, `PRIVACY_NOTE`, `EMPTY_STATE_HEADING`, `EMPTY_STATE_BODY` capture the voice and legal obligations. These should persist or be deliberately revised if the character evolves.

### Conditional Reuse

5. **Degraded path copy** (`DEGRADED_STANCE`, `DEGRADED_COUNTERPOINT`, `DEGRADED_ASIDE`) — Reusable if Spec B retains a fallback mode for API unavailability. The voice is character-consistent.

6. **Ledger concept & copy** (`LEDGER_HEADING`, `LEDGER_NOTE`) — The philosophy ("I keep losses in public") is core to the brand. If ledger returns in a future iteration, this copy and the `wigCountLine()` logic are a ready template.

7. **Input copy** (`INPUT_PLACEHOLDER`, `INPUT_LABEL`) — Conversational and accessible. Reusable if the input metaphor persists.

### Not Recommended for Reuse (Context-Specific)

- **Meter labels and scoring rules** (`EVIDENCE_LABEL`, `CONFIDENCE_LABEL`, `METER_NOTE`, `scoreEvidence()`, `deriveConfidence()`, `CONFIDENCE_CEILING=85`) — These are tightly coupled to the two-axis meter design being deprecated in Spec B. Reintroducing them would require rearchitecting the grade surface.

- **Delulu labels array** — Was specific to 0–5 scale. DELULU_LABEL is retained in Spec B; the array is archived for reference but not actively reusable.

---

**Archive date:** 2026-08-13  
**Archived by:** PLAN.md Step 1 (Clownbot rebuild)  
**Next step:** Spec B implementation (PLAN.md Step 2–N)
