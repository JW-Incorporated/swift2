# Track Guide overhaul (issue #440) — initiative tracker

**Read this first if you're picking this up cold.** This doc is the source of
truth for status on issue #440 Phase 0 + Phase 1. Branch:
`feature/track-guide-phase1` (off `origin/main` at `fa85430d`). Check
`git log` on that branch before re-deriving anything.

## Approved scope (already signed off — do not re-ask)

Joey's decisions on issue #440 (in the issue comments):
- Motif system: **extend** the Clue Web system — but that work is **blocked on
  #445** landing; NOT in this phase.
- TrackNote shape: **grouped fields** (`facts`, `dossier` objects) — done.
- Content priority: **newest songs first** (The Life of a Showgirl).
- Song page stays an **overlay** (keep `useBackDismiss`), not a full page.

Phases (from Kevin's plan on the issue): Phase 0 = plumbing the seed fields
that never reached the UI; Phase 1 = dossier UI + first content wave. Phases
2-3 (lyrics deep-dive, motifs, performance timeline, OV/TV) are LATER, not
this branch.

## Status

| Step | Status |
|---|---|
| Phase 0: migration `20260710160000_track_note_facts_dossier.sql`, seed-tracks INSERT, sync generator (`factsFrom`/`dossierFrom`), web `TrackFacts`/`TrackDossier` types, shared vault-types, `song:<slug>` RelatedId + `songTargetOf`/`resolveConnections` (tracks.ts), `openSong` store action | ✅ built, typecheck clean |
| Phase 1 UI: `TrackDetail.tsx` dossier rebuild (facts card, why-it-matters, tiered meaning w/ existing pill language, on-stage, voices, connections), TrackGuide row opens on dossier too, `formatFullDate` in format.ts | ✅ built, typecheck clean |
| Generator tests (`scripts/sync-longlive-tracks.test.ts`) extended for facts/dossier | ✅ written |
| Web tests for `songTargetOf`/`resolveConnections` + generated invariants | ⬜ TODO |
| Content wave: TLOAS dossiers | 🟡 **delegated to ChatGPT via `node scripts/ask-chatgpt.mjs` (codex exec), per Joey's explicit instruction to save Claude tokens.** Brief: `docs/briefs/tloas-dossier-brief-2026-07-10.md`. Output lands at `supabase/seed/tracks/the-life-of-a-showgirl.dossiers.draft.mjs` (a NEW draft file — Codex must not edit existing files). |
| Fact-check Codex's draft (every URL + claim; media-id/oEmbed rule), merge into `the-life-of-a-showgirl.mjs` as `dossier:` fields, delete the draft file + brief | ⬜ TODO |
| Regenerate (`node scripts/sync-longlive-tracks.mjs`), full `npm test` + typecheck | ⬜ TODO |
| Docs: longlive-experience.md §3/§8 (TrackFacts/TrackDossier + authoring recipe), decisions.md entry for the grouped shape | ⬜ TODO |
| `/codex:review` (or adversarial) on the branch, fix findings | ⬜ TODO |
| PR referencing #440 (TL;DR-first description per CLAUDE.md) | ⬜ TODO |

## Verified fact pack (2026-07-10, via WebSearch — safe to reuse)

- Fate of Ophelia MV: directed by Swift, DP Rodrigo Prieto, choreo Mandy
  Moore, Eras dancers; theatrical premiere Oct 3-5 2025 (~$33M), YouTube
  Oct 5 2025 (Variety, Rolling Stone — URLs in the brief).
- Opalite: Hot 100 No. 1 week of ~2026-02-26 (video premiere + vinyl/CD
  variants + remixes; 168K sales; 14th No. 1, ties Rihanna; first album with
  two No. 1s since 1989). Billboard/Variety URLs in the brief.
- **No** TLOAS tour announced; **no** live TV performance of TLOAS songs
  verified; she did **NOT** play Super Bowl LX halftime (Bad Bunny did).
  Promo (Oct 2025): Fallon, Seth Meyers "TAY/kover", Graham Norton —
  interviews, not performances. TLOAS missed the 68th Grammy eligibility
  window (internal moment `showgirl-grammy-eligibility-window-miss`).

## Gotchas for whoever resumes

- Working tree leftovers from a prior session were WIP-committed on
  `content/showgirl-marquee-photos` (`b4b894c`) — don't touch, already safe.
- `main` is checked out in the `../Swift2-docs-sync` worktree — branch from
  `origin/main`, don't `git checkout main` here.
- Track slugs are globally unique across all 12 era seed files (verified,
  244 slugs, 0 dupes) — `song:<slug>` resolution depends on keeping it that way.
- MomentDetail is z-50, TrackDetail z-[60]: moment connections must close the
  track overlay stack before `openItem` (already handled in TrackDetail.tsx).
- The codex-rescue relay is unreliable — check the draft FILE on disk, not
  the subagent's summary (see Claude memory `codex-rescue-relay-unreliable`).
- Do NOT trust the Codex draft's claims: every URL and factual claim gets
  independently verified before merging into the real seed file.
