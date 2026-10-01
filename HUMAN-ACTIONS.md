# Human actions — Swift2

<!-- ha-format: 2 -->

> **11 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #88 🔴 [BLOCKING] Finish the weekly Facebook export setup (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** The first real run failed at ingest: apps/worker's env file lacks the Supabase keys, so nothing uploads. The task needs re-registering (Sundays 23:00-04:00) and the extension reloaded; the PC must stay on and signed in overnight (wake timers on).
**Steps:**
1. Supabase → Project Settings → API: copy Project URL and service_role key into apps/worker's env file as `SUPABASE_URL=<url>` and `SUPABASE_SERVICE_ROLE_KEY=<key>`. Never paste values in chat.
2. In the Swift2 folder run `npm run knowledge:fb-schedule`.
3. Long Live Chrome profile: chrome://extensions → remove Long Live → Load unpacked → `C:\Users\Fourtys\Documents\Claude\Projects\Swift2\scripts\knowledge\fb-extension`; then tray → Exit.
4. Optional: delete `%LOCALAPPDATA%\longlive-fb\fb-cred.xml`.
**Worked if:** `npm run knowledge:fb-export` finishes with N/N uploaded and no KEPT line.

## #86 🔴 [BLOCKING] SOCIAL_POSTER_PAT can't trigger GitHub Actions — Marjorie's routine re-runs 403 (~10 min)
<!-- ha filed=2026-09-29 -->

**Why:** Marjorie re-runs quiet/failing routines using the SOCIAL_POSTER_PAT secret (as GH_DISPATCH_TOKEN). Every gh workflow run 403s: Resource not accessible by personal access token - it lacks Actions write access, so she cannot restart any stuck routine (hit on issue #4575).

**Steps:**
1. Find the GitHub account that owns the SOCIAL_POSTER_PAT token (check Settings -> Developer settings -> Personal access tokens on the account that created it).
2. Open that token. Classic: check the workflow scope box. Fine-grained: set repo access to JW-Incorporated/swift2 with Actions: Read and write. Regenerate.
3. Copy the new token value.
4. Go to github.com/JW-Incorporated/swift2 -> Settings -> Secrets and variables -> Actions -> Secrets -> SOCIAL_POSTER_PAT -> Update, paste, Save.

**Worked if:** the next Marjorie ops sweep that tries to re-dispatch a quiet routine reports success instead of a 403 error.

## #82 🔴 [BLOCKING] GH_DISPATCH_TOKEN can't dispatch workflows (~10 min)
<!-- ha filed=2026-09-22 -->

**Why:** Marjorie's hourly ops sweep uses GH_DISPATCH_TOKEN to re-dispatch quiet or failing workflows (7 of 14 alert types). Re-dispatching plan-recheck.yml failed with HTTP 403 "Resource not accessible by personal access token", so every re-dispatch in that sweep is a no-op.
**Steps:**
1. Open the repo's Settings → Secrets and variables → Actions and find the token behind the `GH_DISPATCH_TOKEN` secret.
2. If it's a fine-grained token, give it "Actions: Read and write" permission for this repo; if it's a classic token, give it the `workflow` scope.
3. Save the updated token as the `GH_DISPATCH_TOKEN` secret value.

**Worked if:** the next hourly Marjorie ops sweep can run `gh workflow run` without a 403 (visible in that run's log).

## #78 🔴 [BLOCKING] Add Actions read/write to SOCIAL_POSTER_PAT (~5 min)
<!-- ha filed=2026-09-16 -->

**Why:** SOCIAL_POSTER_PAT (fine-grained, Contents+PRs read/write) 403s on `gh workflow run` (#4223, #4388). Every watchdog fix that re-dispatches (plan-recheck, tree-weekly-plan, vault-run, karen-nightly, output-sampling) is a silent no-op; several have failed for days (#4411, #4336).
**Steps:**
1. As sffan15-sys, go to github.com/settings/personal-access-tokens.
2. Open the fine-grained token used for SOCIAL_POSTER_PAT (repo: JW-Incorporated/swift2).
3. Edit permissions → set repository permission "Actions" to Read and write → save.
4. If GitHub issues a new token value instead of an in-place edit, update the secret: repo Settings → Secrets and variables → Actions → SOCIAL_POSTER_PAT → paste the new value.

**Worked if:** a re-run of `routine-marjorie-ops.yml` (or a manual `gh workflow run` under this PAT) dispatches a workflow without a 403.

## #70 🟡 [DECIDE] Confirm the first automated Facebook export (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** The fan-signal engine reads six Facebook groups. Joey approved automated collection from his account and accepted the risk (docs/decisions.md, 2026-09-30). This stays open only until the first successful run proves the parser on a real export.
**Steps:**
1. Complete #88 (worker Supabase keys, Sunday task, reload the extension).
2. Let `npm run knowledge:fb-export` finish once, or run it yourself after a
   successful dry run. Do not solve a checkpoint, 2FA prompt, or CAPTCHA with
   automation; complete it in the browser and rerun. Runs are Sundays 23:00-04:00 unattended.
3. Confirm the weekly `FB group export due — week of ...` issue closed with a
   comment listing uploaded/not-member counts.
**Worked if:** the weekly issue is closed, every joined group says `uploaded`,
no group says `failed`, and this #70 action can then be closed.
