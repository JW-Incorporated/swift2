# Human actions — Swift2

<!-- ha-format: 2 -->

> **12 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #91 🟡 [DECIDE] May Tree post site-made share cards in the feed? (~1 min)
<!-- ha filed=2026-10-01 -->

**Why:** Tree is starved of new images (no photo reuse) and hasn't posted since
09-22. New share cards (era-styled moment cards, longlivets.com mark) give
unlimited fresh images, but you earlier retired text cards from the feed
("no pictures of Taylor"). Users can share cards either way.
**Steps:**
1. Decide: `mix` — cards may fill gaps, at most 1 in 3 posts, real photos stay the default; `no` — cards stay a share feature only, Tree keeps photos-only.
2. Criteria: growth needs posting volume (0 posts in 8 days) vs feed looking like a real fan account.
**Worked if:** Your reply is recorded and Tree's drafting rules match it.

## #90 🔴 [BLOCKING] Unfreeze social posting once PR #4660 has merged (~1 min)
<!-- ha filed=2026-10-01 -->

**Why:** You froze posting so PR #4660 (one-message approvals, reply-to-reject,
IG+X pairs) could pass CI ruling A6. While frozen, nothing Tree drafts can
post. Agents are guard-blocked from changing repo variables.
**Steps:**
1. Confirm https://github.com/JW-Incorporated/swift2/pull/4660 shows Merged.
2. Run `gh variable set SOCIAL_FREEZE --repo JW-Incorporated/swift2 --body false`
**Worked if:** `gh variable get SOCIAL_FREEZE --repo JW-Incorporated/swift2` prints `false`.

## #89 🟢 [UPGRADE] Turn on Marjorie's bot1 bridge: Discord webhook, GitHub secret, Hermes allowlist (~10 min)
<!-- ha filed=2026-09-30 -->

**Why:** Marjorie can only file GitHub issues. Hermes-side blockers need bot1, and bot1 ignores webhook messages until it is told to accept this one. Nothing halts while off; the bridge ships disabled.
**Steps:**
1. In Discord open #longlive, then Edit Channel, Integrations, Webhooks, New Webhook. Name it `Marjorie` and click Copy Webhook URL.
2. Open github.com/JW-Incorporated/swift2/settings/environments, choose `ops`, Add environment secret: name `DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL`, value the copied URL.
3. In a Hermes session (not this project) apply the allowlist change tracked at https://github.com/JW-Incorporated/Hermes/issues/1.
4. Reply `done` here. An agent then sets `bot1Bridge.enabled` to `true` in `scripts/marjorie/marjorie-config.json` by PR.
**Worked if:** after that PR merges, Marjorie's first bot1 prompt appears as a card on Hermes' board and is logged on the `bot1-bridge` issue.

## #88 🔴 [BLOCKING] Store Facebook login and schedule the weekly export (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** The weekly Facebook group export is now deterministic local automation
(`docs/decisions.md`, 2026-09-30), but only Joey can store his personal login
with Windows DPAPI and register the task in his logged-in Windows session.
The credential stays user-scoped outside the repo; checkpoints, 2FA, and
CAPTCHA still stop for Joey.
**Steps:**
1. In PowerShell, run
   `New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\longlive-fb" | Out-Null`
   and then run exactly
   `Get-Credential | Export-Clixml "$env:LOCALAPPDATA\longlive-fb\fb-cred.xml"`.
   Enter the username and password for Joey's personal Facebook account.
2. In this project folder, run `npm run knowledge:fb-schedule`.
3. Run `npm run knowledge:fb-export:dry` once. In the visible dedicated Chrome
   window, sign into Facebook if asked; complete any checkpoint/2FA/CAPTCHA
   yourself, then rerun the dry run.
**Worked if:** Windows Task Scheduler shows `Long Live Weekly Facebook Export`
for Sunday 6:00 PM with “run as soon as possible after a missed start” and
wake enabled, and the dry run reports every joined group as `validated` (a
group Joey has not joined may report `not-member`).

## #87 🟡 [DECIDE] Ownership backlog stuck 7+ days — accept it or get it routed (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** Issue #4546 has flagged the same "abandoned"/"ambiguous" backlog (9 abandoned + 1 ambiguous issue, budget 0) every day since 2026-09-23 with no automated fix — only a policy call can stop the daily alert.
**Steps:**
1. Open github.com/JW-Incorporated/swift2/issues/4546 and read the latest breach list.
2. Decide: raise the budget in `.github/work-ownership-budget.json` to accept the backlog, or ask for the listed issues to be routed/worked.
3. Comment your decision on issue #4546.
**Worked if:** a founder comment on #4546 records either an accepted new budget or a routing decision.

## #86 🔴 [BLOCKING] SOCIAL_POSTER_PAT can't trigger GitHub Actions — Marjorie's routine re-runs 403 (~10 min)
<!-- ha filed=2026-09-29 -->

**Why:** Marjorie re-runs quiet/failing routines using the SOCIAL_POSTER_PAT secret (as GH_DISPATCH_TOKEN). Every gh workflow run 403s: Resource not accessible by personal access token - it lacks Actions write access, so she cannot restart any stuck routine (hit on issue #4575).

**Steps:**
1. Find the GitHub account that owns the SOCIAL_POSTER_PAT token (check Settings -> Developer settings -> Personal access tokens on the account that created it).
2. Open that token. Classic: check the workflow scope box. Fine-grained: set repo access to JW-Incorporated/swift2 with Actions: Read and write. Regenerate.
3. Copy the new token value.
4. Go to github.com/JW-Incorporated/swift2 -> Settings -> Secrets and variables -> Actions -> Secrets -> SOCIAL_POSTER_PAT -> Update, paste, Save.

**Worked if:** the next Marjorie ops sweep that tries to re-dispatch a quiet routine reports success instead of a 403 error.

## #85 🟡 [DECIDE] #4559 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-28 -->
<!-- marjorie-chase: 96h issue=4559 -->

**Why:** Marjorie dispatched it on 2026-09-24 (plan-recheck-marjorie.yml: max_turns=40 too low, fails last 2 scheduled runs despite succ…). Nothing has moved since 2026-09-24. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4559 under stalled.

## #82 🔴 [BLOCKING] GH_DISPATCH_TOKEN can't dispatch workflows (~10 min)
<!-- ha filed=2026-09-22 -->

**Why:** Marjorie's hourly watchdog-ops sweep uses the `GH_DISPATCH_TOKEN` secret to re-dispatch quiet or failing scheduled workflows (7 of the 14 alert types rely on it). Re-dispatching `plan-recheck.yml` today failed with HTTP 403 "Resource not accessible by personal access token" — the token can't trigger a workflow run at all, so every re-dispatch action in that sweep is currently a no-op.

**Steps:**
1. Open the repo's Settings → Secrets and variables → Actions and find the token behind the `GH_DISPATCH_TOKEN` secret.
2. If it's a fine-grained token, give it "Actions: Read and write" permission for this repo; if it's a classic token, give it the `workflow` scope.
3. Save the updated token as the `GH_DISPATCH_TOKEN` secret value.

**Worked if:** the next hourly Marjorie ops sweep can run `gh workflow run` without a 403 (visible in that run's log).

## #80 🟡 [DECIDE] #4364 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-19 -->
<!-- marjorie-chase: 96h issue=4364 -->

**Why:** Marjorie dispatched it on 2026-09-15 (Windows full-suite validation fails on checkout line endings and command resolution). Nothing has moved since 2026-09-15. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4364 under stalled.

## #79 🟡 [DECIDE] #4324 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-18 -->
<!-- marjorie-chase: 96h issue=4324 -->

**Why:** Marjorie dispatched it on 2026-09-14 (Definition of Done #5 — one full-site link sweep, then widen the nightly to shop/product …). Nothing has moved since 2026-09-14. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4324 under stalled.

## #78 🔴 [BLOCKING] Add Actions read/write to SOCIAL_POSTER_PAT (~5 min)
<!-- ha filed=2026-09-16 -->

**Why:** SOCIAL_POSTER_PAT (fine-grained, repo-scoped, currently Contents+PRs read/write) 403s on `gh workflow run`/the dispatches API — confirmed twice (#4223, #4388). Every watchdog handler whose fix is "re-dispatch" (plan-recheck, tree-weekly-plan, vault-run, karen-nightly, output-sampling) is a silent no-op; several have been failing unattended for days (#4411, #4336, #4192, #4129).

**Steps:**
1. As sffan15-sys, go to github.com/settings/personal-access-tokens.
2. Open the fine-grained token used for SOCIAL_POSTER_PAT (repo: JW-Incorporated/swift2).
3. Edit permissions → set repository permission "Actions" to Read and write → save.
4. If GitHub issues a new token value instead of an in-place edit, update the secret: repo Settings → Secrets and variables → Actions → SOCIAL_POSTER_PAT → paste the new value.

**Worked if:** a re-run of `routine-marjorie-ops.yml` (or a manual `gh workflow run` under this PAT) dispatches a workflow without a 403.

## #70 🟡 [DECIDE] Confirm the first automated Facebook export (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** The fan-signal engine reads what Swifties are saying in six Facebook
groups. Joey approved deterministic collection from his personal account and
accepted the account risk (`docs/decisions.md`, 2026-09-30), so this is now
automated. This existing action remains open only until the first successful
run proves the previously unverified parser against a real export.
**Steps:**
1. Complete #88 to store the DPAPI credential and register the Sunday task.
2. Let `npm run knowledge:fb-export` finish once, or run it yourself after a
   successful dry run. Do not solve a checkpoint, 2FA prompt, or CAPTCHA with
   automation; complete it in the visible browser and rerun.
3. Confirm the weekly `FB group export due — week of ...` issue closed with a
   comment listing uploaded/not-member counts.
**Worked if:** the weekly issue is closed, every joined group says `uploaded`,
no group says `failed`, and this #70 action can then be closed.
