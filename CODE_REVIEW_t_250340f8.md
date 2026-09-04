# Code Review: FR-t_2745eb60-1 / #3515 — Clownbot lore seed migration

## IMPORTANT — card superseded mid-review
While this review was in progress, the operator flagged that this card
(t_250340f8) is a duplicate/scratch workspace superseded by **t_3d00a21a**,
the authoritative worktree card for this same ruling. No PR should be opened
from this workspace. This document is preserved as a review artifact only;
findings below should be re-verified against whatever diff is present on
t_3d00a21a before being acted on.

## Scope reviewed
`git diff` between merge-base(origin/main, HEAD) and HEAD in
`/workspace/projects/Swift2/.worktrees/t_250340f8` (branch swift2/t_250340f8):
- `supabase/seed/clownbot-lore/clownbot-lore.mjs` (new seed, 11 items)
- `scripts/sync-clownbot-lore.mjs` (new generator)
- `apps/web/lib/longlive/clownbot-lore.ts` (now generated)
- `scripts/lib/generated-content.mjs` (SYNC_TARGETS + EXTRA_GENERATED)
- `.github/content-automerge-allowlist.txt`
- `package.json` (sync:content chain)
- `apps/web/lib/longlive/clownbot-lore.test.ts`
- `docs/agents/runner-prompts/vault-lanes/4-rumor-desk.md`,
  `docs/agents/runner-prompts/vault-run.md`,
  `docs/content-ops/clownbot-rumor-refresh.md`

## Findings

### Data fidelity — PASS
Diffed the pre-migration `clownbot-lore.ts` (at merge-base) item-by-item
against the new seed's `items[]`: all 11 items (ids, status, dates,
headline/detail text, sources incl. outlet/url, prompts, ledger,
evergreen, tags) match exactly. `normalizeSource`/`normalizeLoreItem`
faithfully reproduce shape (`{outlet,url}` → `{name,url}`), and the
generated output's types/consts/helpers (`LoreItem`, `LoreStatus`,
`LoreSource`, `LoreLedger`, `LORE`, `LORE_UPDATED_ON`, `FRESH_WINDOW_DAYS`,
`loreById`, `daysBetween`, `loreFreshness`) are emitted verbatim and
logically identical to the old hand-authored versions.

### Bug — header comment points to the wrong seed path
Both `scripts/sync-clownbot-lore.mjs`'s top-of-file comment and
`renderModule()`'s emitted header in the generated `clownbot-lore.ts` say:

    Produced by scripts/sync-clownbot-lore.mjs from
    supabase/seed/content/clownbot-lore.mjs (the authored source of truth...)

but the actual `SEED_FILE` constant and the real file on disk is
`supabase/seed/clownbot-lore/clownbot-lore.mjs` — a **sibling** of
`supabase/seed/content/`, not inside it. This is the exact distinction the
code depends on (to keep `sync-longlive-content.mjs`'s directory scan of
`content/` from picking this file up as a Vault moment), so getting it wrong
in the most-visible breadcrumb (the generated file's own header, which any
future maintainer will read first) is a real defect, not cosmetic. It also
appears in the module-level JSDoc comment inside the generator itself (lines
~8-17). Fix: correct both occurrences to
`supabase/seed/clownbot-lore/clownbot-lore.mjs`.

### Consumer safety — PASS
`clown-index.ts`, `clown-board.ts`, and their tests
(`clown-index.test.ts`, `clown-index.integration.test.ts`,
`clown-index-status.test.ts`, `clown-board.test.ts`) all import from
`./clownbot-lore` (no `.generated` suffix) and only consume `LORE`,
`LoreItem`, `LoreStatus` — all preserved verbatim. No consumer changes
needed and none were made. `clown-fallback.ts` also references the module;
same story.

### Seed placement — sound
`supabase/seed/clownbot-lore/` as a sibling of `supabase/seed/content/`
correctly avoids `sync-longlive-content.mjs`'s directory scan (confirmed the
scan targets `content/` specifically). The seed file's own header comment
gets this right ("lives in its own supabase/seed/clownbot-lore/ directory (a
sibling of supabase/seed/content/)") — only the generator header and
generated-output header (above) have the stale path.

### generated-content.mjs / allowlist changes — correct, no security gap
- `EXTRA_GENERATED` cleanly extends `listGeneratedOnDisk()` to recognize
  non-`*.generated.ts` artifacts without weakening the "every entry must
  also be a SYNC_TARGETS[].out" invariant (asserted in the comment, and
  structurally true since `EXTRA_GENERATED` only contains
  `clownbot-lore.ts`, which is indeed a `SYNC_TARGETS[].out`).
- `check:generated` / `check-automerge-allowlist` both consume
  `listGeneratedOnDisk()`, so both gates now see `clownbot-lore.ts`; no gap
  where the file could silently drift and slip through `check:generated`.
- Allowlist entry is correctly scoped under the generated-artifact section
  with a comment explaining the non-standard filename — a human reviewer
  scanning the allowlist won't be confused into thinking it's a manual
  carve-out for hand-edited app code.
- No automerge widening beyond intent: this only allows a bot-authored
  *content* diff to automerge when it is the mechanical output of the
  generator, same trust model as the other `*.generated.ts` entries.

### Docs/tests — consistent with 5-step scope, not independently re-executed
`vault-lanes/4-rumor-desk.md`, `vault-run.md`, and
`clownbot-rumor-refresh.md` diffs read as internally consistent with the
new seed-then-sync flow (old "edit clownbot-lore.ts directly" language is
gone). `clownbot-lore.test.ts`'s regression-test rewrite
(scheduled-refresh-ownership block) asserts the lane doc references the
seed path and `sync:content`, plus a new assertion for the `GENERATED FILE`
header. Did not re-execute the test suite myself in this pass (relying on
implementer's reported green run); recommend the authoritative card's
reviewer re-run `npx vitest run apps/web/lib/longlive/clownbot-lore.test.ts`
directly.

## Verdict (informational — see supersession notice above)
Absent the supersession issue, this diff would be **VERDICT: REQUEST CHANGES**
on one required fix:
- Correct the stale seed-path reference
  (`supabase/seed/content/clownbot-lore.mjs` →
  `supabase/seed/clownbot-lore/clownbot-lore.mjs`) in both
  `scripts/sync-clownbot-lore.mjs`'s header comment and the `renderModule()`
  header text it writes into the generated `clownbot-lore.ts`.

Everything else (data fidelity, consumer safety, seed placement,
generated-content.mjs/allowlist wiring, doc updates) checked out clean.

**This finding should be carried over and re-verified against t_3d00a21a's
actual diff**, since that is the authoritative card going forward. This
card (t_250340f8) should be closed as a duplicate per operator instruction,
not merged.
