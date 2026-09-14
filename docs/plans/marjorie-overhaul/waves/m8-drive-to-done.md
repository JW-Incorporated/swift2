# Wave M8 — Drive to done (Codex prompt)

Paste everything below this line into a **fresh Codex session** in Swift2
(`codex -m gpt-5.6-sol -c model_reasoning_effort=high`). Run it after M6;
never alongside another wave (M6 and M8 both edit the chat prompt).

---

You are executing Wave M8 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180): drive to done, spec `docs/specs/marjorie-overhaul/m8-drive-to-done.md`. Read `CLAUDE.md`, `docs/cto-role.md`, then the spec in full; it is the contract. If the build must deviate, amend the spec in the same PR and say why in one line.

Also read:
- `docs/agents/marjorie.md` (authority, invariants 1 and 3), `docs/agents/austin.md` §Scope, `docs/agents/runner-prompts/kevin-stream3-triage.md` steps 1–4
- `docs/specs/marjorie-overhaul/s1-triage.md` (§The build-desk issue, §The founder branch), `w1-watchdog-handling.md` (Mechanics: the ledger comment), `c2-brief.md`
- `docs/agents/runner-prompts/marjorie-triage.md`, `marjorie-ops.md`, `marjorie-chat.md`, `marjorie-brief.md`
- `scripts/marjorie/lib/brief-state.mjs`, `brief-sections.mjs`, `alert-router.mjs`, `loop-asks.mjs` (the marker/idempotency pattern to copy), `scripts/marjorie/human-actions.mjs`, `ha-close.mjs`
- the `docs/decisions.md` entry "Marjorie drives dispatched work to done: ready-shaped tickets, the founder's yes, a 48/96-hour chase"

## Rules (Codex has no guard hooks; these are the guard)
- Never commit to `main`. Branch `feature/m8-<name>` from a fresh `origin/main` in your own worktree under `C:/Users/Fourtys/.codex/worktrees/<branch>`. Never switch branches in the `Swift2` checkout itself.
- Never: `git push --force`, `git reset --hard`, `git restore`, `git checkout --`, `git clean`, `rm -rf`, `--no-verify`, `gh secret`/`gh variable`, reading any real `.env`, anything under `scripts/social/**` or `social/queue/**`, merging a `social-draft` PR.
- Marjorie's routines keep no Write/Edit tool. Every new behavior is a `run:` step or a `node scripts/marjorie/...` helper she calls with `Bash`; the judgment stays in the prompt, the mechanics in code.
- Do not edit `docs/agents/austin.md` or any Kevin prompt: M8 works with their existing rules (spec §What already exists). If something there must change, stop and say so; it is a founder decision.
- The repo is PUBLIC: no founder Discord text in issues, comments, PRs or human actions; link the message instead.
- Human actions: v2 format, numbered with `node scripts/marjorie/lib/alert-router.mjs next-ha-number`, by PR with auto-merge, one per item ever; `SKIP` is final.
- Charter edits merge on green (#4185 rule); the `marjorie.md` amendment is one short section, not a rewrite.
- Tests: `node_modules` junctioned from the main checkout; vitest with `.scratch/vitest.plain.config.mts` (no repo `globalSetup`); `npm run lint` and `npm run check:routines` before every push. CI is the gate for the full suite. Commit WIP after every green step.
- Land via `gh pr merge --squash --auto --delete-branch`; never watch a PR after that.
- Review: on every PR that touches a runner prompt or `brief-*.mjs`, a fresh read-only Codex pass on the diff (`codex exec -s read-only -m gpt-5.6-sol "Adversarially review the diff of branch X against origin/main for bugs, double-acting, and violations of docs/specs/marjorie-overhaul/m8-drive-to-done.md and docs/agents/marjorie.md invariants 1 and 3"`), max two rounds; a third means stop and write `DEBUG.md`.
- Stop for every line marked YOU:.

## Tasks (in order; one PR each unless trivially coupled)
1. **Ready-shaped filing.** `scripts/marjorie/lib/build-ticket.mjs` (`render`, `check`, the allowlist as data, `size` from paths) + tests; `marjorie-triage.md` and `marjorie-ops.md` file through it; `bootstrap-labels.mjs` gains `founder-assigned` and `deferred` (run it once on main after merge).
2. **The founder's yes.** `marjorie-chat.md` §2 gains the approval case and the `assign|defer|close` words; the `marjorie-approval` comment is written by a `node` helper (idempotent on the marker; put it in `build-ticket.mjs approve`). Tests for: one comment per message id; ambiguous → no comment.
3. **The chase.** `scripts/marjorie/lib/dispatch-chase.mjs` (pure: `verdicts(items, prs, haText, now)` → the table in spec §3, plus `renderNudge`, `renderHumanAction`) + tests for every verdict, the activity rule (her own comments never count), the budget, and idempotency on both markers. `marjorie-ops.md` step 2b calls it once per sweep after the alert handlers; the `gh` fetches are `run:`-step JSON, not agent turns.
4. **The brief.** `brief-state.mjs` computes verdicts with the same helper; `brief-sections.mjs` renders the `stalled 2d+:` line (max 8, `+K more`), unchanged output when nothing is stale. Tests.
5. **Docs.** `marjorie.md` amendment, `MAP.md` rows, `checkpoints.json` MR2 gains: "one marjorie-filed item was nudged at 48 h and either moved or became a [DECIDE] human action at 96 h; the founder's one-word reply was acted on". `PLAN.md` M8 row ticked when done.
6. **Live proof.**
   - Filing: dispatch `routine-marjorie-triage.yml` against a real open submission (or the next scheduled run); the filed issue passes `build-ticket.mjs check`.
   - The yes: YOU: ask Joey to approve one of Marjorie's open build-desk items in `#longlive-marjorie` (his pick). Verify the approval comment, then Kevin's next triage bucket, then Austin's next run (or its "outside fence" note). Run URLs on #4180.
   - Chase: pick one real `marjorie-filed` item already silent ≥ 48 h (there are several: #4296, #4297 as of 09-14). Dispatch the ops sweep; verify one nudge and the next brief's stalled line. If one is ≥ 96 h, verify the `[DECIDE]` HA lands by PR and the card appears. YOU: ask Joey to answer it with one word; verify the action.

## Done means
- A real submission became a ready-shaped build-desk issue.
- A real founder yes became a `marjorie-approval` comment and Kevin's next triage greenlit it (Austin claimed it, or noted it is outside his fence).
- A real stale item got exactly one nudge and appeared on the brief's stalled line; one 96-hour item became a `[DECIDE]` human action by PR and the founder's one-word answer was acted on.
- No double nudges, no double HAs, no Discord posts outside the brief and chat replies.
- Unit tests green, lint 0, `check:routines` passes, Codex review clean within two rounds.
- Tick M8 on #4180 and in `PLAN.md`, update `STATE.md`, stop.
