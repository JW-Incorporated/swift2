# MAP.md

<!-- The purpose of this file is to make codebase exploration unnecessary — for
     the orchestrator AND for every agent it briefs. If anyone ever has to grep
     around asking "where does X live", that is a MAP.md bug: fix it here.
     Cap: 150 lines.

     SCOPE NOTE: this is the top-level map. It is deliberately shallow — deepen
     a row the first time a session has to go looking inside it, rather than
     pre-filling detail nobody has needed yet. -->

## Where the authority lives

`CLAUDE.md` is the operating manual and outranks this file. The durable
reference docs it points at:

| Doc | What it settles |
|---|---|
| `docs/cto-role.md` | Engineering role, authority limits, session bootup |
| `docs/vision.md` | What the product is for |
| `docs/architecture.md` | Stack + coding standards |
| `docs/dev-quickstart.md` | **Read before running anything** — commands, env, repo map |
| `docs/longlive-experience.md` | **Read before touching the shipped web reader** |
| `docs/roadmap.md` | Roadmap and who owns what |
| `docs/decisions.md` | Anything expensive to reverse. Append BEFORE implementing |
| `docs/definition-of-done.md` | The long form of CLAUDE.md § Definition of done |
| `docs/agents/runners.md` | Scheduled runners — all on Wyatt's account |

## Conventions

- Branch names: `feature/<short-name>`, `fix/<short-name>`. Never commit to `main`.
- Workspaces: `apps/*` and `packages/*` (npm workspaces, root `package.json`).
- Generated, never hand-edit: `*.generated.ts` (written by the `sync:content`
  scripts; `npm run check:generated` fails if they drift).
- LF-pinned via `.gitattributes`: `*.mjs`, `*.generated.ts`, `*.sh`.
- Scratch//throwaway output: `.scratch/` (git-ignored).

## Top-level layout

| Path | Responsibility | Don't |
|------|----------------|-------|
| `apps/web` | Next.js front end, incl. the shipped era/threads reader at `/` | Don't touch `components/longlive/**` or `lib/longlive/**` without reading `docs/longlive-experience.md` |
| `apps/worker` | Server-side jobs. Any product LLM call lives here, hard-capped | Don't put an LLM call in a user-request path |
| `apps/mobile` | Mobile client | — |
| `packages/core` | Shared domain logic | Don't import app code into it |
| `packages/shared` | Shared types/utilities | Don't duplicate types in apps |
| `scripts/` | Repo automation: `check:*`, `validate:*`, `sync:*`, seeds, migrations | Don't re-do a chore by hand twice — codify it (Workflow rule 8) |
| `scripts/social/` | Social pipeline. **`post-queue.mjs` and `delete-media.mjs` hit the LIVE accounts** | Don't invoke those two, ever. `guard.sh` denies it |
| `scripts/content-engine/` | Content engine (`npm run karen` / `cie`) | — |
| `social/` | Queue/posted/failed/metrics content + `calendar.md` | Don't hand-edit `posted/` — it is the ledger the poster dedupes against |
| `supabase/` | Database project (migrations, config) | — |
| `e2e/` | Playwright specs (`npm run test:e2e`) | — |
| `docs/` | All durable knowledge | Don't leave a decision only in a conversation |
| `.github/workflows/` | CI + scheduled runners. `ci.yml` job `build` is the required check | Don't dispatch `social-poster.yml` / `social-delete-media.yml` |

## The kit layer

| Path | Responsibility |
|------|----------------|
| `.claude/settings.json` | Tracked. Permissions, hooks, model pin (`opus`), statusline |
| `.claude/hooks/triage.sh` | `UserPromptSubmit` — restates the routing rule every prompt |
| `.claude/hooks/guard.sh` | `PreToolUse` (Bash) — deterministic deny list, incl. social real-send |
| `.claude/hooks/post-edit.sh` | `PostToolUse` (Edit/Write) — prettier on every edited file |
| `.claude/hooks/checkpoint-gate.sh` | `Stop` — blocks ending a turn on stale `STATE.md` |
| `.claude/statusline.sh` | Model, context %, usage-limit gauge, branch |
| `.claude/agents/*.md` | scout, researcher, grunt, executor, reviewer, architect |
| `.claude/skills/pause/SKILL.md` | Usage-limit pause/resume protocol |
| `.claude/commands/` | Pre-existing project slash commands (design-debate, marketing) |
| `PLANtemplate.md` | Copy to `PLAN.md` when a task touches >~3 files |
| `docs/OPERATINGMANUAL.md` | The kit's own long-form manual |

## Commands worth knowing

- Test: `npm test` (vitest) · E2E: `npm run test:e2e`
- Typecheck: `npm run typecheck` · Lint: `npm run lint` · Format: `npm run format`
- Build: `npm run build`
- Content gates: `npm run check:generated`, `check:content-ownership`,
  `check:voice`, `validate:content`, `validate:social`

## Clown bot rebuild (build B) — new files this workstream

`docs/decisions.md` 2026-08-13 "Clownbot rebuild"; `docs/longlive-experience.md`
§7 has the surface description. Existing as of this update (checked against
`git status --short`, not just `PLAN.md`'s aspirational table):

| Path | What |
|---|---|
| `apps/web/lib/longlive/clown-index.ts` (+ `.test.ts`, `.integration.test.ts`, `clown-index-status.test.ts`) | Retrieval index; blocklist pre-filter at build time |
| `apps/web/lib/longlive/clown-retrieve.ts` (+ `.test.ts`) | Deterministic retrieval + `detectRecencyIntent()` |
| `apps/web/lib/longlive/clown-blocklist.ts` (+ `-gates.ts`, `.test.ts`) | `screenTopic()`, per-category phrase lists |
| `apps/web/lib/longlive/clown-safety.ts` (+ `-gates.ts`, `.test.ts`) | Ported input/output safety, crisis reuse |
| `apps/web/lib/longlive/clown-battery-corpus.ts` (+ `-attacks.ts`, `-attacks-b.ts`, `-tier-b.ts`, `.test.ts`) | Red-team corpus (53 attacks, 21 Tier B probes), ported + extended |
| `apps/web/lib/longlive/clown-board.ts` (+ `.test.ts`) | Both prefill columns, pure/deterministic |
| `apps/web/lib/longlive/clown-fallback.ts` (+ `.test.ts`) | Zero-model card composer |
| `apps/web/lib/longlive/clown-starters.ts` (+ `.test.ts`) | Column item → composer prefill string |
| `apps/web/lib/longlive/clown-names.ts` (+ `.test.ts`) | Ported name registry |
| `apps/web/lib/longlive/clown-client.ts` (+ `-prompt.ts`, `.test.ts`) | The one model call; tier as a named constant; `CLOWN_MODEL_DISABLED` kill switch |
| `apps/web/lib/longlive/clown-answer.ts` | `ClownAnswer` — the one client-facing shape |
| `apps/web/lib/longlive/clown-gate.ts` (+ `.test.ts`) | Output re-screen |
| `apps/web/lib/longlive/clown-usage.ts` (+ `.test.ts`) | Ported cap reservoir |
| `apps/web/components/longlive/ClownChat.tsx` | Title + composer + transcript |
| `apps/web/components/longlive/ClownBoard.tsx` | The two columns |
| `apps/web/components/longlive/ClownItemCard.tsx` | One column item / one source card |
| `scripts/check-clown-battery.mjs` | `clown:battery` CI script (deterministic, no API key) |
| `docs/proposals/2026-08-13-clownbot-shelved-content.md` | Build-A content not carried forward |
| `docs/ops/clown-kill-switch.md` | `CLOWN_MODEL_DISABLED` kill switch |

The build-A `clownbot-*` deletions and the `store.tsx`/`LongLive.tsx` wiring
have landed. Not yet landed as of this update (per `PLAN.md`'s "Files touched"
table, still in flight in a parallel step): `app/api/clown/route.ts`,
`clown-seed-example.ts`, and the `share.ts`/`TopBar.tsx` wiring.

## Dead / do-not-touch

- `.claude/worktrees/` — ~30 registered git worktrees, excluded via
  `.git/info/exclude`. Never delete, never `git clean`.
- `scripts/social/social-poster-workflow.test.ts.tmp` — untracked scratch owned
  by another session. Leave it exactly as-is.
