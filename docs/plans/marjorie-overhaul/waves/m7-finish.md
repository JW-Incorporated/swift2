You are finishing the doorbell half of Wave M7 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180, spec `docs/specs/marjorie-overhaul/m7-doorbell.md`). Read `CLAUDE.md`, `docs/cto-role.md`, the spec, `docs/specs/marjorie-overhaul/m7-chat-direct-replies.md`, `docs/ops/doorbell.md`, `waves/m7-doorbell.md` task 5, and the last three comments on #4180 and on #4319 first. `STATE.md` on main is the checkpoint from the Claude session that built this.

Status you inherit (verified 2026-09-14 16:30 UTC):
- Doorbell merged (#4306, #4308, #4309, #4311, #4312), tag `doorbell-v1`, installed and running on the Hermes host. Tests 1 and 2 passed (evidence on #4180).
- #4320 merged (channel-level, concise replies) with CI green, but its behavior is NOT verified live, and it had no independent review.
- The Hermes gateway's old Tree responder is excluded on the host (`discord.ignored_channels`), not in this repo.
- `DOORBELL_LIVE = false` in `scripts/marjorie/lib/chat-inbox.mjs`. HA #75 and #4319 are open.

## Rules (Codex has no guard hooks; these are the guard)
- Never commit to `main`. Branch `fix/` from a fresh `origin/main` in your own worktree under `C:/Users/Fourtys/.codex/worktrees/`. Never switch branches in the `Swift2` checkout itself.
- Never: `git push --force`, `git reset --hard`, `git restore`, `git checkout --`, `git clean`, `rm -rf`, `--no-verify`, `gh secret`/`gh variable`, reading any real `.env`, anything under `scripts/social/**` or `social/queue/**`, merging a `social-draft` PR.
- Tokens live only on the host. Never ask Joey for one, never print one.
- The repo is PUBLIC: no founder text in issues, comments, PRs, logs.
- The doorbell never posts. Approvals stay reaction-only.
- Do not touch L1: `tree-weekly-plan.md`, `weekly-brief.mjs`, `assemble-brief.mjs`, `loop-asks.mjs`.
- Tests: `node_modules` junctioned from the main checkout; vitest with `.scratch/vitest.plain.config.mts` (copy of `C:/Users/Fourtys/AppData/Local/Temp/claude-worktrees/scratch-vitest.config.ts`, no repo `globalSetup`); `npm run lint` before every push. CI is the gate for the full suite.
- Land via `gh pr merge --squash --auto --delete-branch`; never watch a PR after that.
- Review: before opening any PR that changes `scripts/marjorie/**` or a workflow, run a second, fresh, read-only Codex pass on the diff (`codex exec -s read-only -m gpt-5.6-sol "Adversarially review the diff of branch X against origin/main for bugs, races, and spec violations against docs/specs/marjorie-overhaul/m7-doorbell.md and m5-chat.md; list findings with severity"`). Fix what it finds. Max two rounds; a third means stop and write `DEBUG.md`.
- Stop for every line marked YOU:. Joey's chat answer is the decision. Never skip a proof.

## Tasks
1. **Independent review of #4320** (it was self-authored). Run the read-only review pass on `git diff 300254b7..d201a5ff`. Fix real findings in a `fix/chat-replies-review` PR; if none, say so on #4319.
2. **Repo copy of this prompt:** add it verbatim as `docs/plans/marjorie-overhaul/waves/m7-finish.md` in that same PR (or its own if there are no fixes).
3. **YOU:** ask Joey to post one short top-level question in `#longlive-marjorie` and one in `#longlive-tree`. Verify with the Discord API and the Actions API (read-only, no values printed):  from the doorbell, a run as `sffan15-sys`, exactly one reply per channel, in the channel (no new thread), under ~80 words, ✅ on the message, and no reply from the old Hermes Tree. Record message ids, run ids and message-to-✅ seconds. If anything fails, fix it (Codex round rules apply) and repeat this step once.
4. Comment the evidence on #4319 and close it.
5. **Flip the switch:** PR `fix/doorbell-live` sets `DOORBELL_LIVE = true`. Confirm the tests for the poll's doorbell watch (spec Mechanics 5) pass with it on. Auto-merge.
6. **Test 3, the dead-doorbell proof. YOU:** ask Joey to run on the Hermes host `sudo systemctl stop longlive-doorbell`, then post `fallback test 3` in `#longlive-marjorie`, then wait. Expected within ~6 minutes: the poll (cron or, if GitHub drops it, a `gh workflow run bot-chat-poll.yml --ref main` you dispatch and say so) answers the message with ✅, AND the alarm posts "Doorbell is not answering" in `#longlive-marjorie` and opens its alert issue. Then YOU: `sudo systemctl start longlive-doorbell`, and Joey posts one more short message; expect  within 5 s. Record run ids, the alert issue number, and times.
7. **Close HA #75** with `node scripts/marjorie/ha-close.mjs 75 --note "<#4180 comment link>" --by agent` on a branch, PR, auto-merge.
8. Post all evidence on #4180 (ids, run URLs, seconds; no founder words). Update `PLAN.md` M7 row to "doorbell ✓ 09-14, clock: waves/m7-clock-v2.md", `docs/ops/doorbell.md` if any step changed, `STATE.md`. PR, auto-merge. Stop.

## Done means
- Step 3: one concise in-channel reply per channel, no thread, no duplicate,  < 5 s, ✅, ids and times on #4319 and #4180.
- `DOORBELL_LIVE = true` on main.
- Test 3: the poll answered and the "Doorbell is not answering" alert posted, then the restarted doorbell rang again. Evidence on #4180.
- #4319 closed, HA #75 closed by PR.
- Unit tests green, lint 0 errors, no token anywhere but the host.
- `PLAN.md` and `STATE.md` updated by PR.

Please use cheaper agents for the work that can be done by them safely - work in a token efficient manor. 

When complete, hand me a promp for our SW architect, fable, recapping what you did
