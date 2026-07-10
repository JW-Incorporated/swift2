# Threads rework + day-level dates — 2026-07-10 initiative tracker

**Read this first if you're picking this up cold** (new session, session-limit
interruption, or a different founder's agent). This doc is the source of
truth for status — check here before re-deriving anything from git history.

## Why this exists

Joey's brief (2026-07-10): the Threads section (`/` → Threads tab,
`ThreadsMode.tsx` + `apps/web/lib/longlive/lenses.ts`) is thin enough to cost
us users, and every era's content dates are month/year-only when day-level
precision is knowable. Both need real, ground-up work, not polish. Directive:
be strategic, parallelize across Codex/Gemini/v0/Claude, and make sure the
work survives a session getting cut off (it did, once already, on
2026-07-09 — see chat history if curious).

## Tool fleet actually available in this repo

- **Codex CLI** (`codex` on PATH, logged in via ChatGPT) — same account/API as
  ChatGPT. Also reachable via the `codex:rescue` skill / `codex-rescue` agent.
- **Gemini CLI** (`gemini` on PATH, authenticated) — the MCP registration for
  it in `~/.claude.json` is broken (`command: "\\"`), but the raw CLI works
  fine via `gemini -p "<prompt>"`. Use the CLI directly, not the MCP entry.
- **v0** (`mcp__v0__*` tools) — existing project `C9vVM1eei8p` ("Feed design
  exploration", used for the tiered-card feature). Reuse this projectId for
  continuity/design-system consistency across chats.
- Claude subagents (this session's `Agent` tool) — used for source-verification
  research (WebSearch/WebFetch), where fabrication risk means an ungrounded
  CLI call isn't good enough on its own.

## Decision already locked (see `docs/decisions.md` for the real entry once written)

**Threads content architecture:** auto-derive from tagged content items,
*not* keep the hand-authored `lenses.ts` arrays long-term. New content
(relationship sightings, fashion moments, easter eggs, etc.) should flow into
the relevant thread automatically once tagged, the same way era moments
already flow from `supabase/seed/content/**` into the vault. Approved by
Joey 2026-07-10. Implementation is WS2 below — foundational, not delegated.

## Workstreams

| WS | What | Branch/worktree | Owner | Status |
|----|------|------------------|-------|--------|
| **WS1** | Day-level date backfill across all 12 era seed files | `content/day-level-dates` (worktree at `../Swift2-datebackfill`) | Codex CLI (delegated via `codex:codex-rescue`, running in background as of 2026-07-10) | 🟡 in progress — Codex is finishing the 8 partial files + starting fearless/lover/midnights/speak-now, committing per-file. Check `git log` in that worktree to see how far it got if resuming. |
| **WS2** | Threads content architecture: tag-based derivation replacing hand-authored `lenses.ts` arrays | `feature/threads-content-architecture` (worktree at `../Swift2-threads-rework`, branched clean from `main`) | Claude (foundational — not delegated) | 🟡 core mechanism implemented, tests written, verifying now |

**WS2 implementation notes:** added `ContentItem.threadIds?: LensId[]`
(`types.ts`). Resolved in `build()` (`content.ts`) via
`defaultThreadIdsForTags()` — `Relationship` tag implies `love-story`,
`Fashion` implies `fashion`, no authoring action needed (42+ real relationship
items and real fashion items already in `supabase/seed/content/**` get picked
up automatically, no re-tagging required). The other four threads
(`taylors-version`, `easter-eggs`, `hidden-clues`, `the-proposal`) have no
1:1 tag mapping, so they're explicit opt-in via a `threadIds` field on the
seed row, threaded through `scripts/sync-longlive-content.mjs`. New selector:
`contentForThread(threadId)` in `apps/web/lib/longlive/threads.ts`. Tests in
`threads.test.ts`.

Ran a Codex adversarial review (`/codex:adversarial-review`) before calling
this done, per CLAUDE.md rule 3 — it correctly found 4 real issues (explicit
threadIds overrode instead of merged with tag defaults; two seed items
miscategorized as `relationship` when they're friendship/feud content, which
would've polluted Love Story; `threadIdsFrom` silently swallowed typos
instead of failing; `docs/decisions.md` read as though the UI already
consumed this). All 4 fixed in a follow-up commit; a confirming (non-
adversarial) review is running now.

**Not done yet:** wiring any thread's actual UI to `contentForThread()`
(waiting on the v0 designs above to land first — rewiring the old UI now
would be thrown away), and explicitly tagging content for the other four
threads. `docs/decisions.md`'s 2026-07-10 entry is explicit that this is
phase 1 of 2 — don't treat Threads as already rendering from tagged content.
| **WS3** | Love Story rework — real relationship + single-period timeline ending in the 2026 wedding | `content/thread-love-story` | v0 (UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/nhR4XzA7UFE |
| **WS4** | The Runway rework — picture-heavy, guided era style-evolution story | `content/thread-runway` | v0 (UX) + Claude (photo/content sourcing) | 🟡 v0 chat done: https://v0.app/chat/b363XfJaly6 |
| **WS5** | Taylor's Version rework — masters-ownership-over-time visual + deeper per-album narrative | `content/thread-taylors-version` | v0 (UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/e5KdCTYOjZt |
| **WS6** | The Clue Web — keep the home→trail→constellation structure (Joey likes the mechanic), fix intuitiveness/onboarding | `content/thread-clue-web` | v0 (UX refinement, not rebuild) | 🟡 v0 chat done: https://v0.app/chat/gG8tkq1XeX4 |
| **WS7** | The Decode — keep plant→payoff mechanic (Joey called it the best of the group), add real depth (more clue pairs + richer browsing) | `content/thread-decode` | v0 (light UX) + Claude (content sourcing) | 🟡 v0 chat done: https://v0.app/chat/ksK1QOyHkdF |
| **WS8** | The Proposal rework — picture-heavy Travis/Taylor story, move past the "pills" layout | `content/thread-proposal` | v0 (UX) + Claude (photo/content sourcing) | 🟡 v0 chat done: https://v0.app/chat/dS5uHBGADCt |

All six v0 chats live in project `C9vVM1eei8p`. 🟡 = design exploration back, not yet
reviewed/integrated into the app. Next step per thread: review the v0 output,
pick/merge the best ideas, then integrate as real components wired to real
(sourced) data — don't ship v0's placeholder copy or invented facts.

Cross-cutting question baked into every WS3–WS8 v0 brief: does the right-side
`ThreadsTimeline` career scrubber (`apps/web/components/longlive/
ThreadsTimeline.tsx`) make sense for this thread, given most threads don't
scroll far enough today to make it functional? Each thread decides
independently — no rule that it must be present.

## Gotcha: Codex CLI sandbox root vs. git worktrees

`codex-companion.mjs`'s write sandbox anchors to whatever directory it's
*invoked from* (cwd at launch), not to the git repo it operates on. Launching
a `task`/`review` job for a sibling worktree (e.g.
`../Swift2-datebackfill`) from within the main `Swift2` checkout gets its
writes rejected as "outside the project" — happened once already on
2026-07-10 (WS1's first attempt, no files touched, caught by checking
`codex-companion.mjs result <job-id>` directly rather than trusting the
launch confirmation). Fix: `cd` into the actual worktree directory *before*
invoking `node codex-companion.mjs ...`, so its own `workspaceRoot` resolves
there. Always verify a job's `workspaceRoot` in its status JSON matches the
directory you actually wanted it to write to.

## How to resume if a session dies mid-work

1. Read this doc top to bottom.
2. `git branch -vv` and `gh pr list --state all` to see what's actually
   landed vs. still local/uncommitted.
3. Check `mcp__v0__findChats` (or https://v0.app, project `C9vVM1eei8p`) for
   the six thread-redesign chats — each chat's title says which thread.
4. Check the `content/day-level-dates` worktree
   (`../Swift2-datebackfill`) for uncommitted date-backfill progress before
   assuming it needs to restart.
5. Update the status column in this table as work lands — don't let it go
   stale (this is exactly how the previous WIP got lost).

## Definition of done (per workstream, per CLAUDE.md)

Spec'd, real sourced content (no fabrication), Codex review clean, works
mobile + desktop, tests updated, this doc's status row flipped to ✅ with the
merged PR number.
