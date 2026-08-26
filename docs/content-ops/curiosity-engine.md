# The Curiosity Engine — Lex (asks) + the Answerer (answers)

**Status:** v1, 2026-07-18 (Wyatt's directive). Structural fix for uneven
content depth: the pages fans care most about (the engagement ring is the
canonical example) were thin — missing the goldsmith's story, the ring's
provenance, celebrity-ring comparisons, a macro shot, labeled rumors — while
the data model and layout fully support depth. This turns "some important pages
are shallow" from a vibe into a measured, self-refilling queue.

## The shape

Three stages, each auditable, run by the routine fleet:

```
  depth-deficit checker         Lex (Curious pass)          the Answerer
  ────────────────────    →    ──────────────────    →    ──────────────
  measures which of the        turns each gap into         researches each
  ~two-dozen `defining`        the specific questions      question with live
  moments fall short, and      a superfan would ask        web access; drafts
  on which of 4 axes           that the page leaves        SOURCED answers +
  (narrative/photos/           unanswered → a ranked        VERIFIED photos →
  sources/cross-links)         curiosity ledger            opens a PR
```

1. **The trigger — `content.depth-deficit`** (`scripts/content-engine/checkers/depth-deficit.mjs`).
   Deterministic, no network. Scoped to `significance: 'defining'` items — the
   crown jewels, small enough to be a real queue. Emits, per item, exactly
   which axes are thin. This is the *only* thing that decides what gets worked;
   curiosity is never unbounded.

2. **Lex — the Curious pass.** For a queued moment, Lex writes the questions the
   page doesn't answer, ranked by how much a fan would care. Lex is deliberately
   naive and broad ("who made it? has anyone compared it to X? what's the rumor
   nobody's confirmed?") but every question must be *answerable and checkable* —
   no speculation-bait. Output is a **curiosity ledger** (see below), the
   reviewable contract between the two roles.

3. **The Answerer.** Consumes the ledger and, for each question, researches a
   sourced answer and (where one exists) a verified photo, then drafts the
   content additions — new `moment.context`, `sources` with reliability scores,
   `photos`, `relatedIds`/`threadIds`. Opens a PR. **Never merges** (per
   `CLAUDE.md`, AI cannot merge/deploy without a human).

## The curiosity ledger

One JSON artifact per worked moment (a GitHub issue body, or
`curiosity/<era>-<slug>.json`), so the work is auditable and resumable:

```jsonc
{
  "moment": "vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already",
  "deficit": ["narrative", "photos", "sources"],   // from the checker
  "questions": [
    { "q": "Who is the goldsmith, and what's their background?", "status": "answered",
      "answer": "Kindred Lubeck, 30, Artifex Fine Jewelry NYC…", "sources": ["today.com/…","scmp.com/…"] },
    { "q": "What Artifex piece did Taylor show Travis beforehand?", "status": "open",
      "note": "Provenance confirmed (Complex); the specific earlier piece is not documented." },
    { "q": "Is there a rights-cleared portrait of the goldsmith?", "status": "unanswerable",
      "note": "No unwatermarked, rights-cleared source found this pass — no image added." }
  ]
}
```

Three terminal states for a question: **answered** (sourced + integrated),
**open** (real but not yet found — stays queued), **unanswerable** (chased and
genuinely not documentable, or no clean image — closed, never fabricated).

## Guardrails (what keeps this from becoming fluff)

- **Deficit-gated.** Only `defining` items the checker flags. No page is
  "enriched" just because a bot had spare cycles.
- **Citation-required.** Every added claim carries a source; anything
  unverifiable is dropped, not invented. Rumors are labeled as rumors and
  attributed (the existing confidence tiers + "estimates, not confirmed fact").
- **Image protocol.** Photos follow the verify-first rule: HTTP 200 +
  `image/*`, vision-confirmed as the right subject, ≥400px, credited, no
  watermarked Getty comps. No clean image → the question closes *unanswerable*,
  the page ships without it.
- **Termination.** A moment leaves the queue when the checker's axes are all
  satisfied *or* every remaining question is unanswerable. It re-opens only if
  its significance rises or a new event attaches. Depth converges; it doesn't
  balloon.
- **Human merge.** Output is always a PR gated by `validate:content`, Karen, and
  `check:generated`.

## Pilot (2026-07-18)

First run, by hand, to set the quality bar: the **engagement ring**. Lex's
ledger asked for the goldsmith, the "shown Travis her work" provenance,
celebrity-ring carat comparisons, and labeled cost/size rumors. The Answerer
delivered all four with sourced text (Today, SCMP, Marie Claire, Forbes,
Complex) and three rights-cleared ABC photos of the ring — and correctly left
the goldsmith portrait *open/unanswerable* rather than adding an unverified
image. Same pass consolidated the duplicate: the engagement had been
duplicated into `tortured-poets.mjs` (wrong era); that copy was removed and the
ring content moved to its correct Showgirl-era home.

## Fleet wiring

Runs as scheduled routines alongside Karen/Nils/Kevin. Cadence is intentionally
modest (defining items are few and each answer is real research): the checker
picks the top-ranked under-depth `defining` moment, Lex + the Answerer work it,
and the PR lands in the founders' review queue. See the routine definitions in
the RemoteTrigger fleet.
