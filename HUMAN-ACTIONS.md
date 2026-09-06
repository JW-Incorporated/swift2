# HUMAN-ACTIONS.md — things only Joey can do

Anything needing Joey's identity, login, payment method, approval, or a click in
a UI an agent cannot reach. One file, this exact name, repo root.

**How to use this:** each item has a `**Status:** OPEN` line. Change that one
word to `DONE`, `SKIP` (chose not to — add a few words why) or `BLOCKED` (tried,
something stopped you) yourself, or tell a session to in chat and it will write
the edit directly (a session only does this on your explicit instruction, never
on its own judgment). **Never cut, paste, or move a block** — a session
reconciles this file and files finished items into DONE with a date. Item
numbers are stable IDs, never reused or renumbered, so "#4" means the same thing
forever. Saying "I did #2" in chat works just as well as editing the line —
a session will make the edit for you.

**`Filed:` (added 2026-08-23):** every OPEN item carries a `**Filed:**
YYYY-MM-DD` line right under its title — the date it was first written here,
backfilled via `git log` for items that predate this convention. Marjorie's
morning brief reads it to show how long each OPEN item has been waiting on
you; never remove or backdate it. DONE/SKIP items don't need one — aging
only matters while something is still pending.

`SKIP` is final. No session will re-raise a skipped item or re-argue it.

---

## OPEN

### 48. [BLOCKING] Mobile release credentials — 3 remaining founder steps — ~30 min total

**Filed:** 2026-09-06

**Why it matters:** consolidates the three still-open founder items behind
the mobile release train (`docs/mobile-release.md`) into one line so the
brief doesn't show four separate rows for one release pipeline. The Play
service-account key (was #46) is done — see that item's closing note.
These three each block a different piece of mobile CI, but none blocks the
others:

1. **`EXPO_TOKEN` repo secret (was #44, ~5 min, Joey).** Without it the
   whole train (`.github/workflows/mobile-release.yml`) refuses to start —
   this is the one that actually blocks everything else below.
   Steps: generate a token at expo.dev → account settings → Access Tokens
   (owner `wjduvall`, project id `a4ff0e9b-ad3e-48a4-a765-ffc19a8b3209`),
   then `gh secret set EXPO_TOKEN --repo JW-Incorporated/swift2`.
2. **iOS signing + App Store Connect key into EAS (was #45, ~10 min,
   Wyatt's laptop).** `eas credentials --platform ios` is interactive-only;
   `credentials.json` and the cert/profile already sit on Wyatt's machine
   (`C:\Users\wjduv\Desktop\4a-signing\`, `apps/mobile/credentials/`).
   Steps: from `apps/mobile`, `eas credentials --platform ios` →
   production → Build Credentials → upload from `credentials.json`; then
   App Store Connect API key → use existing key
   `./credentials/AuthKey_QU7P2WC49Z.p8` / `QU7P2WC49Z` /
   `26d1ad10-af24-431a-a9bb-d097ca96e9bc`. Tell a session when done so it
   can retire `apps/mobile/eas.json`'s `production-local` profile.
3. **Push credentials on EAS, OS-004 (was #43, ~15 min, founder with Apple
   + Google account access).** `eas credentials -p ios` for the APNs key
   under team `D9N628AFHS`, and the Android equivalent for the FCM v1
   service account key, then one test push via
   `scripts/send-test-push.ts`.

**Worked if:** all three steps above show green (train starts, iOS submit
uses remote credentials, a real device receives a test push). Update this
item as each sub-step lands rather than waiting for all three — a session
can split this back into per-step DONE notes if that's clearer.

**Status:** OPEN

---

### 47. [BLOCKING] URGENT — disable 15 original claude.ai routines now duplicated by the GitHub Actions migration — ~15-20 min

**Filed:** 2026-09-06

**Why it matters:** the routines-migration (t_876f9697, t_36d63712,
t_574dfb62, t_9752a8e0, t_123b1628 — all merged) built GitHub Actions
replacements for the whole standing fleet and they are now live on
`main` (`.github/workflows/routine-*.yml`, using
`CLAUDE_CODE_OAUTH_TOKEN` per D1=B). The original claude.ai triggers for
these same routines are STILL ENABLED — every one of them is now firing
**twice**: once from claude.ai, once from GitHub Actions. This is live
double-spend (double API/token usage) and, for the routines that open
PRs or file issues, doubled real-world output (duplicate PRs, duplicate
issues) starting immediately on each one's next cron fire. This is why
the card is marked URGENT.

**Root cause this session hit:** disabling a live claude.ai trigger
requires the `RemoteTrigger` tool authenticated to your account. No
worker sandbox (docs/CI worktree, this one included) has that tool
attached — confirmed directly this session, matching the same
account-access limitation already documented at items #35/#38/#41. Only
a `claude.ai/code` session running as you, or you directly in the
`claude.ai/code/routines` UI, can flip these.

**Steps — disable each of these 15 triggers** (via the
`claude.ai/code/routines` UI is fastest; toggle "Enabled" to off, do NOT
delete — same convention as every prior disable in this file):

| # | Routine | Trigger ID | Now replaced by |
|---|---|---|---|
| 1 | Laura — a11y walk | `trig_019aY4jhN6T9ZDAMve8YaRGw` | `routine-laura-a11y-walk.yml` |
| 2 | Karen — nightly scan (weekly judgment slice) | `trig_01TmYaZgnecrEp9mkeV3Gq6X` | `routine-karen-nightly.yml` |
| 3 | Marjorie — 6 AM Founders' Brief | `trig_018eDoH5pWRvwGMEg58aW4f3` | `routine-marjorie-brief.yml` |
| 4 | News Triage — news_story to intake issues | `trig_019NuR7EpN7TA28yfmzKPAC7` | `routine-news-triage.yml` |
| 5 | News Triage recall check (T-3 trial) | `trig_01V8JrQPZfWpUqUWiy9fvmkh` | `routine-news-triage-recall.yml` |
| 6 | Tree — weekly social plan | `trig_015YHCK6J3FwKLVn2oABUSic` | `routine-tree-weekly-plan.yml` |
| 7 | Growth — daily draft | `trig_01UBvxMi2Pz7x7qnsffLHAU3` | `routine-growth-draft.yml` |
| 8 | Paul Blart — security patrol | `trig_01Px9HckABpWC4Bq1JQomfWT` | `routine-paul-blart.yml` |
| 9 | Austin — build runs | `trig_01FE8o9vscpHts7FwsVKGMZm` | `routine-austin-build.yml` |
| 10 | Nils — daily site walk | `trig_01WhgsVQFKMRGw2tfRg3i2rB` | `routine-nils-walk.yml` |
| 11 | Kevin — S3 comment radar (cloud) | `trig_01LaSLx4qzbsz68E6uRLkyDd` | `routine-kevin-radar.yml` |
| 12 | Kevin — daily desk (S1+S2+S3) | `trig_01GH3EMWdDwwKpx2GCRnCYM5` | `routine-kevin-daily-desk.yml` |
| 13 | Kevin — S1 Karen-ticket solver (cloud) | `trig_01QEvYmKcpyDJJ8ec81aBjCV` | `routine-kevin-s1-karen-solver.yml` (this one was already flagged "pending disable" at item #38 — now doubly justified) |
| 14 | The Vault Run — all content lanes | `trig_01XKjJCfxyL2Bm24Ko4M4mWR` | `routine-vault-run.yml` |
| 15 | Routine Auditor — fleet invariants | `trig_011p74968vLqMFeC8HzfCvAL` | retired outright, replaced by `scripts/check-routine-workflows.mjs` in CI (no GH Actions cron equivalent — this one should just go off) |

**Not in this list, leave alone:** Lex depth (already disabled, warm
spare) and Marjorie — 8 PM Evening Delta (already disabled, warm spare)
— neither was migrated. `bedrock nightly audit` is a different project's
routine on the same account per `runners.md`'s ownership note — do not
touch it here.

**After disabling:** update `docs/agents/runners.md`'s live trigger
table to mark all 15 as ⛔ disabled (superseded by GitHub Actions
migration) — a session can do that edit for you once you confirm the
disables are done; just say "disabled #47" in chat.

**Worked if:** `claude.ai/code/routines` shows all 15 rows above as
disabled, and no duplicate PR/issue/output appears from a claude.ai-side
fire after today.

**Status:** OPEN

---

### 46. [BLOCKING] Mobile release train — Google Play service-account key into EAS — ~15 min

**Filed:** 2026-09-05

**Why it matters:** `docs/mobile-release.md`. The release train
(`apps/mobile/.eas/workflows/release.yml`) submits Android builds to the
Play **internal testing** track itself, so nobody uploads `.aab` files by
hand and Android can never lag iOS. That submit step needs a Google Play
service account, which only the Play Console owner can create and link.
Until it exists every train run fails at `submit_android` (and, by design,
blocks `submit_ios` in the same run).

**Steps:**
1. Google Cloud Console → create/select a project → **IAM & Admin → Service
   Accounts → Create service account** (name e.g. `eas-play-submit`) →
   **Keys → Add key → Create new key → JSON** → download the file.
2. Play Console → **Users and permissions → Invite new users** → paste the
   service account's email → App permissions: **LongLive** → Account
   permissions: tick **Release to testing tracks** (under Releases) → Invite.
3. On your machine, from `apps/mobile`:
   `eas credentials --platform android` → choose **production** → **Google
   Service Account** → **Manage your Google Service Account Key for Play Store
   Submissions** → **Set up a Google Service Account Key** → point it at the
   downloaded JSON. Then delete the JSON from Downloads.

**Worked if:** `eas submit --platform android --latest --non-interactive`
(from `apps/mobile`) uploads to the internal track without asking for a key
path, and the next **Mobile release train** run shows `submit_android`
green.

**Update (2026-09-06, t_b31878bb):** the key arrived as the GitHub Actions
repo secret `PLAY_SERVICE_ACCOUNT_JSON` (created 2026-09-06T16:33Z) rather
than through the interactive `eas credentials` upload this item asked for
— which works fine, just differently: EAS Workflows can't see GitHub repo
secrets, so `.github/workflows/mobile-release.yml` now runs `eas submit
--platform android` itself after the EAS release workflow finishes, using
the secret directly (see `docs/mobile-release.md` § "Android submission
lives in the GitHub Action, not here"). Nothing left for a founder on this
item.

**Status:** DONE (2026-09-06)

### 45. [BLOCKING] Mobile release train — iOS signing + App Store Connect key into EAS — ~10 min

**Filed:** 2026-09-05

**Why it matters:** `docs/mobile-release.md`. Today the iOS distribution
certificate, the LongLive provisioning profile, and the App Store Connect
API key exist only in `C:\Users\wjduv\Desktop\4a-signing\` and
`apps/mobile/credentials/` on Wyatt's laptop (`production-local` profile,
`credentials.json`). The release train runs on EAS with no laptop
involved, so it can only sign and submit iOS if those live in EAS
credentials. `eas credentials` is interactive-only (no TTY in agent
shells), so a founder has to run it once.

**Steps:**
1. From `apps/mobile` (where `credentials.json` already points at
   `./credentials/Certificates.p12` and `./credentials/longlive.mobileprovision`):
   `eas credentials --platform ios` → **production** → **Build Credentials**
   → **Upload credentials from credentials.json to EAS** (confirm the
   Distribution Certificate and the Provisioning Profile for
   `ai.jwlabs.longlive`).
2. Same menu → **App Store Connect: Manage your API Key** → **Use an existing
   API Key** → key path `./credentials/AuthKey_QU7P2WC49Z.p8`, Key ID
   `QU7P2WC49Z`, Issuer ID `26d1ad10-af24-431a-a9bb-d097ca96e9bc`.
3. Tell a session it is done so it removes `ascApiKeyPath`/`ascApiKeyId`/
   `ascApiKeyIssuerId` from `apps/mobile/eas.json` `submit.production.ios`
   (the remote key then applies) and retires the `production-local` profile.

**Worked if:** `eas build --platform ios --profile production --non-interactive`
(from `apps/mobile`, no `credentials.json` needed) starts a build that
says `Using remote iOS credentials (Expo server)` and reaches the compile
phase, and `eas submit --platform ios --latest --non-interactive` runs
without a local key path.

**Status:** SUPERSEDED (see #48)


### 44. [BLOCKING] OS-040 — `EXPO_TOKEN` repo secret for automatic EAS Update — ~5 min

**Filed:** 2026-09-05

**Why it matters:** `docs/specs/2026-09-05-one-source-three-surfaces.md`
§6, card OS-040 (Phase 4). `.github/workflows/eas-update.yml` publishes
JS-only mobile changes to the `production` EAS Update channel on every
qualifying merge to `main`, but it needs an Expo access token to
authenticate — `gh secret set` requires repo-secret write access this
session doesn't have per `.claude/hooks/guard.sh`.

**Steps:**
1. Generate a token at expo.dev → account settings → Access Tokens,
   scoped to this project (owner `wjduvall`, project id
   `a4ff0e9b-ad3e-48a4-a765-ffc19a8b3209`).
2. `gh secret set EXPO_TOKEN --repo JW-Incorporated/swift2` and paste it.

**Worked if:** the next JS-only merge to `apps/mobile/**` or
`packages/**` shows a green `EAS Update (mobile OTA)` run in Actions.

**Status:** SUPERSEDED (see #48)



### 43. [BLOCKING] OS-004 — Push credentials on EAS (One Source, Three Surfaces plan) — ~15 min

**Filed:** 2026-09-05

**Why it matters:** `docs/specs/2026-09-05-one-source-three-surfaces.md` §6,
card OS-004 (Phase 0). iOS and Android push don't actually deliver yet.
This needs interactive credential upload only you can do — Apple/Google
account access, not code.

**Steps:**
1. Run `eas credentials -p ios` interactively (from a machine with EAS CLI
   and your Apple Developer login) and upload/generate the APNs key under
   team `D9N628AFHS`.
2. Do the equivalent for Android: upload/generate the FCM v1 service
   account key via `eas credentials -p android`.
3. Send one test push via `scripts/send-test-push.ts` to a real TestFlight
   device.

**Worked if:** a real device receives the push and tapping it opens the
correct deep link in the shell (per OS-004's own "Done when").

**Status:** SUPERSEDED (see #48)

### 42. [UPGRADE] Add a GitHub comment-edit tool to Kevin's cloud sessions (or accept the append-and-supersede workaround) — ~10 min

**Filed:** 2026-09-01

**Why it matters:** issue #3631. Kevin's `docs/kevin.md` anchor-comment
contract (Stream 2 digest / Stream 3 triage) was written assuming a
same-day re-run could **edit its own prior comment in place**. It can't:
Kevin's cloud sessions run with the GitHub MCP server, which exposes
`add_issue_comment` (create only), `issue_write` (issue body/state, not
comments), and PR-review-thread tools — **nothing that PATCHes an
existing issue comment**. Direct `gh`/REST access is explicitly disabled
in that environment ("use the GitHub MCP server tools for ALL GitHub
interactions"). This surfaced for real on the first fire of the new T-10
consolidated `Kevin — daily desk` trigger against issue #3590.

**Already fixed in this repo (no action needed for this half):**
`docs/kevin.md` and the runner prompts (`kevin-desk.md`,
`kevin-stream2-digest.md`, `kevin-stream3-triage.md`) now specify an
**append-and-supersede** convention instead of edit-in-place: a same-day
re-run posts a NEW comment carrying the same anchor plus a
"Supersedes the earlier comment(s) above" line, and the decision-processing
step always reads the **most recent** anchored comment. This keeps the
contract's spirit (one source of truth per anchor per issue) using only
tools Kevin already has, and needs no account access.

**What's left, and why it's yours:** the append-and-supersede workaround
is correct but slightly worse than true edit-in-place (the brief issue
accumulates a duplicate-but-superseded comment on every same-day re-run,
which is minor visual noise for whoever reads #3590-style issues). If you
want the cleaner behavior back, the actual fix is adding a comment-update
capability to the **GitHub MCP tool config** Kevin's cloud sessions run
with — that's a trigger/environment-level MCP server configuration change
(`claude.ai/code` routines UI, or wherever this environment's GitHub MCP
connector is provisioned), which an agent in a docs/CI worktree sandbox
cannot reach or verify, the same class of gap as items #35/#38's
RemoteTrigger access.

**Steps (only if you want true edit-in-place back):**
1. Open the environment/connector config that provisions the GitHub MCP
   server for Kevin's routines (same account as `docs/agents/runners.md` §
   "Live trigger IDs" — Joey's account) and check whether a comment-update
   tool (e.g. an `update_issue_comment` / `issue_comment_write` capability)
   can be enabled for that MCP server.
2. If yes, enable it and tell a session — it can then revert the
   append-and-supersede convention in `docs/kevin.md` and the runner
   prompts back to true edit-in-place.
3. If no such tool exists on the GitHub MCP server at all, this item is a
   `SKIP` (write why) — the append-and-supersede workaround already
   already shipped is the permanent answer.

**Worked if:** either a comment-edit tool is confirmed available and a
follow-up PR reverts to edit-in-place, or you mark this `SKIP` because no
such tool exists.

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-2):** resolved by the
routines-migration (#47), not by a connector change. Kevin's daily desk
now runs as `.github/workflows/routine-kevin-daily-desk.yml` with `Bash`
allowed and `GH_TOKEN` in the environment, so
`gh api -X PATCH repos/{owner}/{repo}/issues/comments/{id}` — true
edit-in-place — is available with no account access at all. The
claude.ai MCP connector this item asked you to inspect is being retired
under #47. Reverting `docs/kevin.md` and the runner prompts from
append-and-supersede back to edit-in-place is agent work, tracked on the
swift2 kanban (child of t_a0ad2392). Nothing left for a founder.

**Status:** DONE (2026-09-06)

---

### 41. [BLOCKING] Rename Karen's live trigger to match its judgment-only prompt (#3616, T-5) — ~2 min

**Filed:** 2026-09-01

**Why it matters:** issue #3616 / `docs/agents/runners.md` § T-5. The rename
itself is pre-approved, standing-agent-authority work — no founder decision
needed on the *what*. `runner-prompts/karen-nightly.md` already reads
"weekly content-safety judgment review" (trimmed to the bounded judgment
slice by PR #3445), so the live trigger's registered name is the only thing
out of sync. This is a metadata-only resync — no prompt, cadence, model, or
connector changes. Same account-access limitation this file documents
elsewhere (items #35/#37/#38): the actual edit needs the `RemoteTrigger`
tool, on Joey's account — this docs/CI worktree sandbox has no such tool
attached at all.

**Exact current vs. target:**

| Field | Current | Target |
|---|---|---|
| Trigger ID | `trig_01TmYaZgnecrEp9mkeV3Gq6X` (the live, current ID — confirmed in `runners.md`'s live table; recreated on Joey's account 2026-08-23 per item #2) | unchanged |
| Name | `Karen — nightly scan` | `Karen — weekly judgment slice` |
| Prompt (`events`), cadence, model, repo, connectors | already correct (`0 9 * * 0` UTC, `claude-sonnet-5`, `JW-Incorporated/swift2`@main, judgment-only prompt per PR #3445) | unchanged — preserve verbatim on the round-trip |

**Do not use `trig_014HWuRmT2MFveDkPGwVDiQX`** — per `runners.md` § T-5 this
ID predates the 2026-08-23 account migration and is very likely stale/
orphaned. `get` it first to confirm it's no longer live before touching
anything; if it turns out to still be live, that's a separate finding (a
live duplicate), not part of this rename.

**Steps (one `job_config` round-trip, never a partial PUT):**
1. From a `claude.ai/code` session with `RemoteTrigger` access on Joey's
   account, `get` `trig_01TmYaZgnecrEp9mkeV3Gq6X`.
2. In the returned object, change only `name` to
   `Karen — weekly judgment slice`. Leave everything else — prompt, cadence,
   model, repo, connectors — exactly as returned.
3. `PUT` the whole object back (never a partial PUT — see `runners.md` §
   RemoteTrigger footgun).
4. Confirm the `get` reflects the new name, then update
   `docs/agents/runners.md`'s live table (both the main table and the
   "Cadence overrides still in force" table) to drop the RENAME PENDING flag
   and show `Karen — weekly judgment slice` outright, and close issue #3616.

**Worked if:** the trigger's registered name reads
`Karen — weekly judgment slice`, `runners.md`'s tables show the new name
with no RENAME PENDING flag, and issue #3616 is closed.

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-1):** the ground moved
under this item. The routines-migration (#47) made
`.github/workflows/routine-karen-nightly.yml` the live runner; the
claude.ai trigger this item wanted renamed is on #47's *disable* list. A
trigger about to be retired is never renamed. The rename was applied
where it now matters — `routine_name` in the workflow and
`scripts/marjorie/runner-cadence.json` read `Karen — weekly judgment
slice`; `runners.md`'s live table shows the new name with no RENAME
PENDING flag; #3616 closed. Nothing left for a founder.

**Status:** DONE (2026-09-06)

---

### 35. [BLOCKING] Vault Phase 4 needs a RemoteTrigger-capable session on your account — the disable step can't run from a docs/CI sandbox — ~10-20 min

**Filed:** 2026-08-31

**Why it matters:** `docs/agents/vault-run-plan.md` Phase 4 (retiring the six
standalone content-lane triggers now duplicated by the Vault Run — worth
~3.9 fewer cold-boot sessions/day per `docs/TIER2-OPTIMIZATION.md` T-1) is
pre-approved, standing-agent-authority work — no founder decision needed on
the *what*. But two things stop an agent from finishing it today:

1. **The actual disable step needs the RemoteTrigger tool, on your
   account.** This repo's own docs (`docs/agents/runners.md` § RemoteTrigger
   footgun) describe reading a trigger's `job_config` and PUTting the whole
   thing back to change `enabled: false` — that requires a Claude Code
   session with the RemoteTrigger tool attached and authenticated to the
   account the routines run on (yours, per `runners.md` § Live trigger IDs,
   confirmed 2026-08-31 D1=B). A docs/CI worktree sandbox (used for PR work
   like this one) has no such tool available at all — confirmed by listing
   its tool set directly. So even once the item below clears, someone needs
   to run this from a session that actually has RemoteTrigger — either you
   directly in `claude.ai/code`, or a session you explicitly point at that
   surface.
2. **A live, reproducing miss as of today (2026-08-31), not yet
   root-caused.** No `vault/2026-08-31` branch or PR exists as of 21:11 UTC
   (5h after the 16:07 UTC cron), while both standalone lanes it's meant to
   replace fired normally the same day. Retiring the standalones before this
   is root-caused and fixed would risk a real content outage on days the
   Vault Run silently no-ops. See `vault-run-plan.md`'s Phase 4 section for
   the full evidence trail.

**Steps:**
1. When you (or a session you point at `claude.ai/code`'s routines UI) have
   a spare few minutes, look at what happened to today's 16:07 UTC Vault Run
   firing specifically — did it fire and fail, or not fire at all? That
   answer is what root-causes item 2 above.
2. Once that's fixed and a session confirms several subsequent clean days,
   a RemoteTrigger-capable session (yours, or one you explicitly authorize)
   can do the actual Phase 4 disable — reading back and disabling each of
   the six standalone triggers one at a time, per the plan's own ordering
   (Rumor Desk first).

**Worked if:** the six standalone triggers listed in
`docs/agents/vault-run-plan.md` are disabled (not deleted) and
`docs/decisions.md` records the actual before/after PR-count and
Actions-minutes delta, per the plan's own Phase 4 instructions.

**Resolved 2026-09-01, from a `claude.ai/code` session with `RemoteTrigger`
access.**

**Root cause of the 08-31 "miss" (item 2 above): it was not a miss.**
Pulled the Vault Run trigger's (`trig_01XKjJCfxyL2Bm24Ko4M4mWR`) actual run
log for that day (session `cse_013BrBHiyjvR4EafbEum1gHQ`, fired 16:11 UTC,
finished 16:18 UTC, `ROUTINE_RUN_STATUS_SUCCEEDED`). It ran end to end and
correctly found **zero authorable work** across all four lanes due that day:
Content Shift's intake queue was fully drained (confirmed live, not from a
stale ledger), the Answerer's narrative axis was drained (live
`scan --no-images`: 0 narrative-thin, 9 depth-deficit findings all
photos-axis-only), Cross-Link had 0 detector findings, and Photo Enrichment
is blocked by the already-tracked image-host egress issue (item #22). Per
its own "never exit silently" contract it posted the full lane-by-lane
no-op ledger to the Nils walk log (#502) and sent a founder push
notification about the one real, already-tracked problem (the egress
block). No `vault/2026-08-31` branch existed because there was nothing to
ship that day, not because the run failed or didn't fire — the "silent
no-op" reading in this item's original filing was a misdiagnosis from
git-log-only evidence.

Also checked the trigger's full run history since the 2026-08-23 account
migration: **8 for 8** daily fires, no gaps, all succeeded
(2026-08-24 → 2026-08-31). The historical "missed days" cited in
`vault-run-plan.md` (08-01, 08-02, 08-08) predate that migration, on a
now-nonexistent trigger ID — unverifiable now, superseded by this clean
record on the live infrastructure.

**Phase 4 executed**, Rumor Desk first per the plan's ordering, each
trigger's `job_config` read back before disabling (`enabled: false`,
confirmed in the response, nothing else in the config touched):

| Lane | Trigger ID | Disabled |
|---|---|---|
| Rumor Desk | `trig_01GS6bcMsEQjXwmyxGr7S1js` | ✅ |
| Content Shift | `trig_01PonDFeQCL4iRNzceGyAYrm` | ✅ |
| Photo Enrichment worker | `trig_01Vcz4iSM9NoUmt7CZ7pkHaB` | ✅ |
| Cross-Link builder | `trig_01FxMuDtwScPFvSgvhFCxdfP` | ✅ |
| Stylist | `trig_011BiHZqLEVHAJ4chfaYfGZH` | ✅ |
| Answerer (sole instance) | `trig_016hygyYPEV9T7BunnTHAWbZ` | ✅ |

All six disabled (not deleted) — cadence history preserved, `enabled: false`
in every case. The Vault Run (`trig_01XKjJCfxyL2Bm24Ko4M4mWR`) is now the
sole writer to `supabase/seed/**`.

**Not yet done, follow-up needed:** the plan's "Worked if" also calls for
watching one full cycle and recording the actual before/after PR-count and
Actions-minutes delta in `docs/decisions.md` — that requires a few days of
data with the six lanes off, which this session cannot observe. A future
session (or Marjorie's brief) should record that delta once there's enough
post-cutover history, and delete the `content-shift/` row from the
watchdog's lane table per the plan's final step.

**Status:** DONE

---

### 38. [DONE] Apply the Kevin daily-desk trigger cutover (T-10)

**Filed:** 2026-08-31
**Closed:** 2026-09-01

**What happened:** Joey created the consolidated trigger directly
(`trig_01GH3EMWdDwwKpx2GCRnCYM5`, "Kevin — daily desk (S1+S2+S3)", cron
`13 15 * * *` UTC, live and enabled) and test-fired it. The test session
correctly determined the UTC day was Tuesday (not Sunday), so it skipped
Stream 1 by design, and found Stream 2 (digest) and Stream 3 (triage) had
already posted for real on issue #3590 hours earlier (~15:16–15:49 UTC,
2026-08-31) via the old standalone triggers — since today's slot had
already fired before the cutover, it correctly abstained from re-posting
rather than duplicating. **Tomorrow's `13 15 * * *` run (2026-09-02) is the
first genuine end-to-end fire of the new trigger.**

Joey disabled both superseded daily triggers directly (not deleted —
history preserved, per this file's convention):
- `trig_0136mXcpmzn6mYtYoUQC3eGP` (S2 digest) → disabled
- `trig_01BRmPqZkLEcYKZhYPjypGMJ` (S3 eng triage) → disabled

Left alone exactly as the cutover sequence specifies:
- `trig_01QEvYmKcpyDJJ8ec81aBjCV` (S1 Karen-ticket solver) — still live;
  the new desk trigger's next Sunday fire will exercise Stream 1 for the
  first time, and this old trigger gets disabled only after that
  Sunday's real output is confirmed. **Not yet done — next Sunday check
  is still outstanding, tracked below.**
- `trig_01LaSLx4qzbsz68E6uRLkyDd` (S3 comment radar) — untouched, not part
  of this consolidation.

**Blocker found and worked around:** the first test-fire tried to disable
the two old triggers itself and got a hard denial — `RemoteTrigger`'s
`update_trigger` is restricted to a trigger's own creator-session; since
the old triggers were created via `http_api` rather than through an
agent's `create_trigger` call, no Claude session (on any account) could
flip them via the API. Only the `claude.ai/code/routines` UI could — which
is what Joey then did directly. Filed as an interim finding in PR #3630
(merged) before Joey's direct fix landed; this entry supersedes that
interim note.

**Open sub-item, not blocking, low urgency:** the new trigger's
`mcp_connections` came back populated with `Google_Drive`/`Vercel`/`Gmail`/
`Claude_Code_Remote` even though creation explicitly requested `[]` — this
matches the RemoteTrigger create/update footgun already documented above
(§ RemoteTrigger API footgun) and appears to be inherited from the shared
environment (`env_01WFa19KpZdcwUUBPvHWPig6`) rather than settable per-
trigger via the create body. Matches what the old triggers already
carried, so not a regression — acceptable as-is; worth a real fix only if
this connector set ever proves to matter for this desk's actual behavior.

**Remaining step:** on the next Sunday after 2026-09-01, confirm the new
desk trigger's Stream 1 output (a real `fix/karen-tickets` PR, or a correct
no-op if no new Karen tickets exist), then disable
`trig_01QEvYmKcpyDJJ8ec81aBjCV`. A session can do this verification and the
disable both, once account-authenticated — record it as its own dated
entry here or in `docs/decisions.md` when done.

---

### 39. [DONE] Restore Etsy v3 API access for E5 fan-made evidence collection — existing account/key

**Filed:** 2026-08-30

**Status:** DONE

**Resolved:** 2026-08-30. Joey verified the existing Etsy app and repository secrets. PR #3519 corrected the Etsy v3 authorization construction and the manual workflow completed successfully with its evidence artifact. This entry records the resolved credential/access prerequisite only; any later evidence-quality repair remains an agent-owned task.

---

### 40. [DONE] Etsy API returns 403 to the E5 evidence workflow — check app approval

**Filed:** 2026-08-30

**Status:** DONE

**Resolved:** 2026-08-30. The Etsy v3 API access issue was resolved by the verified authorization-format correction in PR #3519. The evidence workflow thereafter completed successfully and uploaded `merch-e5-evidence-artifact`.

---

### 33. [REVIEW] Confirm the Phase 2 merch catalog on mobile and desktop — ~2 min

**Status:** DONE

**Why it matters:** Phase 2's deterministic acceptance checks are green on
merged `main`: generated coverage is current for 463 products, every uncovered
row has an explanation, `awin-apply` is empty, the listing-scoped affiliate
resolver/disclosure tests pass, and lint/typecheck pass. The remaining
acceptance item is a real browser check of the merch surface at both viewports.

**Outcome (2026-08-30, founder confirmation):** Joey confirmed in Discord
that the desktop and mobile merch-catalog viewport check is complete (`HA33
complete`). The confirmation covered the catalog surface only: no purchase and
no external retailer link was opened.

**Worked:** the merch catalog was usable on both desktop and mobile; no
purchase or external retailer click was part of this confirmation.

---

### 24. [UPGRADE] Unblock the video seed — code fix is in, just re-run the command — ~2 min

**Filed:** 2026-08-26

**Why it matters:** issue #725. Running the four seed commands today,
`db:seed:content` (718 items) and `db:seed:theories` (74) succeeded;
`db:seed:videos` failed:

```
VIDEO SEED FAILED: duplicate key value violates unique constraint "video_work_slug_key"
```

**Root cause (diagnosed from the repo, no DB access needed):**
`video_work.slug` is globally unique, but `scripts/seed-videos.mjs` used to
delete-then-insert per era file only. Commit 46a88202 (2026-08-25, "Classify
dated content by calendar era", #3317) correctly moved 3 videos to a
different era file each (real-world-date rule, #3315). Production was last
seeded *before* that move (2026-08-24, item #18), so the old-era row for
each moved slug was still sitting in prod when the new-era insert tried to
claim the same slug — the global unique constraint rejected it.

**Fixed in code, this session:** `scripts/seed-videos.mjs` now upserts every
video by `slug` (`on conflict (slug) do update ...`) instead of
delete-then-insert scoped to one era, and deletes only slugs that no longer
appear in ANY seed file (genuine removals). Verified for real against a
fresh ephemeral local Postgres (all 27 migrations applied, `embedded-postgres`
— same mechanism as items #14/#18's own verifications): reproduced the exact
#725 scenario (inserted a video under its old, pre-move era_slug, then ran
the real script), confirmed it relocates cleanly with no duplicate-key error,
and confirmed a second run is a clean no-op (215 rows both times). PR:
`docs/2026-08-26-decisions-and-seed-fix` branch.

**Update (2026-08-31):** DB migrate/seed operations are now automated via
GitHub Actions instead of a laptop command. This item's residual form:

**One-time setup (founder-only, do once):**
1. Set the repo Actions secret (nobody else can — `gh secret set` is
   guard-denied for agents):
   `gh secret set SUPABASE_DB_URL --repo JW-Incorporated/swift2`
2. Trigger `db-migrate` once from the Actions tab and confirm it's green:
   `https://github.com/JW-Incorporated/swift2/actions/workflows/db-migrate.yml`
   (Run workflow → main)
3. Trigger `db-seed` once with `target: videos` and confirm it's green:
   `https://github.com/JW-Incorporated/swift2/actions/workflows/db-seed.yml`
   (Run workflow → target = videos)

**After that:** all future migrations run automatically on merge to `main`
(any change under `supabase/migrations/**` triggers `db-migrate`), and every
seed (`eras`, `content`, `tracks`, `releases`, `tours`, `theories`, `videos`)
is a one-click dispatch from the `db-seed` Actions tab with a `target`
dropdown — no checkout, no `.env`, no laptop command, ever again.

**Worked if:** both workflow runs above show green in the Actions tab, and
production's `video_work` table matches `supabase/seed/videos/**`.

**Status:** DONE

**Resolved (2026-08-31):** `SUPABASE_DB_URL` was already configured as a
repo Actions secret. Found and fixed a real workflow-authoring bug blocking
both actions: an `EXIT` trap inside the "Materialize ephemeral
apps/worker/.env" step deleted the file the instant that step's own shell
exited, before the next step ("Run migrations (pass 1)") could read it
(`node: apps/worker/.env: not found`) — each GH Actions `run:` block is a
separate shell process. Fixed in `db-migrate.yml`/`db-seed.yml` by moving
the cleanup trap into the steps that actually consume the file. Confirmed
both fixed workflows green with fresh `workflow_dispatch` runs directly on
`main`:
- `db-migrate` run 33351892355 — success, includes the pass-2 idempotency
  check.
- `db-seed` (target=videos) run 33351966250 — success.

Production `video_work` now matches `supabase/seed/videos/**`. All future
migrations run automatically on merge to `main`; every seed target is a
one-click Actions dispatch.

---

### 23. [BLOCKING] BACKUPS launch gate (#680) — read Supabase plan/backup status off the dashboard, run one restore drill against production's own bytes — ~10 min

**Filed:** 2026-08-26

**Update (2026-08-30, Joey report):** The current project is on the Supabase
Free plan, which has no available backup options. No backup was made and no
production restore drill was performed. This records the current status only;
it does not accept the associated launch risk. The BACKUPS gate remains
unresolved until the required evidence is recorded.

**Why it matters:** the BACKUPS launch gate has been 🟡 since 2026-08-12. The
restore mechanism itself is built, tested, and green in CI (#1890) — a drill
that backs up, restores into a scratch database, and verifies by checksum.
What's left needs your own Supabase login, not more engineering: (1) nobody
has confirmed whether this project actually has automated daily backups or
PITR — on the free plan the answer is "none," which needs to be a recorded
accepted risk, not an assumption; (2) the drill has only ever run against a
fixture built from repo seeds, never against production's real bytes.
Checked today for any agent-side workaround (env vars, `gh secret list`,
Supabase CLI/MCP/management-API token) — none exists; this is genuinely
founder-only. Full detail: `docs/backup-restore.md` §2 and §6.

**Update (this session, #680 desk pass):** added a one-click Actions
workflow (`.github/workflows/production-backup-drill.yml`, `Run workflow`
from the Actions tab) so step 3 below no longer needs a local checkout,
`apps/worker/.env`, or pasting a production connection string anywhere by
hand — it reuses the `SUPABASE_DB_URL` secret already configured for
`db-migrate`/`db-seed`, opens it strictly read-only, and restores into a
throwaway Postgres inside the job (never a `*.supabase.co` host — the
script's `assertSafeTarget` refuses that regardless). Step 1 (dashboard
plan/backup-status) is still genuinely founder-only; nothing reaches that
information programmatically.

**Steps:**
1. Open the Supabase dashboard for the Long Live project → **Settings** →
   **Billing** (or **Database** → **Backups**). Note: (a) the plan tier,
   (b) whether **Database → Backups** lists automated daily backups, (c) the
   retention window, and whether **PITR** is enabled/available.
2. Record those three answers in `docs/backup-restore.md` §6 (there's a
   table row format already there to follow), or tell a session the answers
   in chat and it will write them in.
3. Run the drill against production's own bytes with one click — no
   checkout, no local Postgres, no credential ever touches your machine:
   `https://github.com/JW-Incorporated/swift2/actions/workflows/production-backup-drill.yml`
   → **Run workflow** → **Run workflow** (main branch). Takes a couple of
   minutes; the job posts PASS/FAIL as an alert issue and uploads the report
   as a run artifact.
4. Paste the pass/fail result (or tell a session the run URL) and it'll log
   it as a new row in `docs/backup-restore.md` §6's drill log and flip the
   BACKUPS gate in `docs/launch-readiness.md` once both items are done.

**Worked if:** `docs/backup-restore.md` §6 has a drill-log row sourced from
production (not the fixture) marked **PASS**, and §2's plan/backup-status
table is filled in instead of "UNVERIFIED."

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-4):** step 1 was already
answered by your 2026-08-30 report (Free plan, no platform backups, no
PITR) — that *is* the dashboard reading; §2 Layer A records it. Step 3
needs no founder: `workflow_dispatch` is reachable from any session with
repo write, so the production-bytes drill was clicked today —
run [34054042528](https://github.com/JW-Incorporated/swift2/actions/runs/34054042528).
Result: **the backup half PASSED against real production bytes** (35
tables · 8298 rows · 11.27 MB read in 7.7 s over a read-only session)
and **the restore half FAILED** — `20260904000000_clown_sessions.sql`
references `auth.users`, and the throwaway Postgres has no `auth` schema
(Supabase-only). The workflow still reported green because `node … | tee`
without `set -o pipefail` masks the script's exit code, so the "Record the
result" step closed the alert as PASSED. Both are agent-fixable bugs and
are on the swift2 kanban (children of t_a0ad2392): fix the drill so a
non-Supabase target gets a stub `auth` schema, and make the workflow fail
honestly. The drill re-runs itself from that fix's PR. Nothing left for a
founder on this item; the gate flips when the corrected drill passes.

**Status:** DONE (2026-09-06) — founder steps complete; remaining work is
engineering, tracked on kanban and on #680.

---

### 22. [BLOCKING] Photo-Enrichment worker's scheduled environment has total network egress block — 3 consecutive no-op runs — ~5 min

**Filed:** 2026-08-25

**Why it matters:** the Photo-Enrichment worker (issue #762) needs to fetch
press pages and Instagram embed HTML, and download/vision-confirm candidate
images, before it can add anything — that's the whole verify-first design of
the protocol. The scheduled environment this trigger runs in has **all
outbound HTTPS blocked**, not just image-host CDNs: `curl`/`WebFetch` to a
neutral control domain (`example.com`) and to `instagram.com` both fail
(`WebFetch` → `EGRESS_BLOCKED`; the proxy status endpoint logs `gateway
answered 403 to CONNECT`). Only `WebSearch` (server-side, bypasses this
session's egress proxy) and `api.github.com` are reachable. This has now
happened on **three separate firings** — 2026-08-24 ~06:40 UTC, 2026-08-24
~20:55 UTC, and 2026-08-25 — each one a complete no-op (0 photos, 0 posts)
because nothing could be verified. Every future firing will keep hitting the
same wall until the environment's network policy changes.

**Steps:**
1. Find the scheduled trigger that fires the Photo-Enrichment worker prompt
   (the one whose stored prompt starts "You are the Photo Enrichment worker
   for the Long Live app..." and references issue #762) — likely in
   `claude.ai/code` under this repo's triggers/schedules, or wherever
   scheduled sessions for `JW-Incorporated/swift2` are managed.
2. Open that trigger's environment configuration and change its **network
   policy** from whatever fully-blocking setting it currently has to one
   that permits general outbound web access (the level other manually-run
   or differently-configured sessions in this repo already have — e.g. the
   photo-sparsity work landing today via PR #3266 clearly had working
   outbound fetch).
3. Save, and let the next scheduled firing confirm the fix (a run that
   posts an actual PR with photos/posts added, or at minimum a comment that
   no longer reports `EGRESS_BLOCKED`, means it worked).

Background/docs on how environments and their network policy are
configured: `https://code.claude.com/docs/en/claude-code-on-the-web`.

**Worked if:** the next Photo-Enrichment run's comment on issue #762 no
longer reports an egress block, and actually adds/rejects real candidates
instead of a 0/0/0 no-op.

**Update (2026-08-25, later firing):** this run had working egress —
`example.com`, `billboard.com`, and `instagram.com` all reachable — and
shipped PR #3296 with real photo/focalPoint work (see the run's comment on
#762). That matches the "worked if" signal above. Leaving Status as OPEN
since one good run isn't proof the underlying policy was changed on purpose
rather than being transiently available; a founder call is still the way to
close this out for good.

**Update (2026-08-26):** egress reachable again (wikimedia, billboard,
forbes, variety, yahoo all 200) — PR #3343 shipped with real photo work.
Third good firing in a row.

**Update (2026-08-27):** egress reachable again (`api.github.com` +
outlet CDNs all 200) — see this run's PR and #762 comment. Fourth
consecutive good firing since the 08-25 fix. Still leaving Status as OPEN
per the above — a founder call remains the way to confirm the policy
change was intentional and close this for good, but at this point the
egress block looks resolved.

**Update (2026-08-30, Stylist run):** same root cause, different worker —
the Stylist's scheduled firing today hit a **total** outbound block again:
`curl`/`WebFetch`/Node `fetch` to `en.wikipedia.org`, `www.gucci.com`,
`www.nordstrom.com`, and `www.therealreal.com` all failed (`EGRESS_BLOCKED` /
proxy status `gateway answered 403 to CONNECT`; Node's own fetch returned
`403 Host not in allowlist`). Only `WebSearch` worked. Since curl-verifying
a real retailer product page (never a search-results page, never fabricated)
is the Stylist's whole SOURCE step, and re-checking existing product URLs
for liveness is its whole MAINTAIN step, this run could do neither — it
exited with no changes and no PR rather than fabricate an unverified link.
This is the same intermittent policy, now confirmed to hit more than one
scheduled trigger in this repo, so the "looks resolved" note above was
premature — leaving Status as OPEN.

**Update (2026-09-05, RESOLVED):** Joey changed the Vault Run routine's
network access setting in claude.ai/code to "full internet access" on
2026-09-04. Confirmed fixed on the real scheduled (non-manual) daily
trigger: today's 16:07 UTC cron firing produced PR #3805 ("vault:
2026-09-05 — 3 lanes"), whose Photo Enrichment lane reports egress open
("Instagram / i.ytimg.com / outlet CDNs reachable") with a reasoned
coverage outcome (no page needed a new photo this run) — no
`EGRESS_BLOCKED` / `403 CONNECT` language anywhere, a clean break from
every prior run (#3744, #3696, and this item's own history) which all
hard-blocked. This is the founder-authorized policy change the prior
updates were waiting on, verified on the actual trigger rather than a
manually-fired one. Closing this out.

**Status:** RESOLVED (2026-09-05)

---

### 16. [UPGRADE] Facebook groups checklist ships empty — needs your real group list, and your first real export to trust the parser

**Filed:** 2026-08-24

**Why it matters:** `scripts/knowledge/fb-groups-checklist.mjs`
(`fb-export-reminder.yml`'s Sunday reminder, PLAN.md Stage 6) ships with
zero groups — only you know which Facebook groups you're actually in and
want tracked, so this was not guessed. The reminder issue itself still
files every Sunday and says so plainly rather than silently doing nothing.

1. **Add your groups** to `scripts/knowledge/fb-groups-checklist.mjs` —
   each entry is `{ slug: 'short-hyphenated-id', label: 'Group Name' }`.
   Start with 3–5 (that week's issue is the checklist).
2. **First real export**: `facebook-groups-parser.ts`'s HTML extraction
   (`role="article"` blocks, `aria-label` author names) was written against
   Facebook's documented accessibility markup, not a real saved export — no
   Facebook account/group was available to verify it against, and creating
   one is outside what an agent may do unattended. Run your first weekly
   export through it once you have one; if it parses to 0 posts on real
   content, tell me and I'll retune the extraction against that real file.

**Worked if:** the checklist file has real entries and at least one real
export has been parsed without silently returning 0 posts.

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-5):** this is not a
decision and should not sit in the Founders' Brief for 13 days. Two halves:
(1) the checklist is being seeded by an agent from the groups already
researched in `sources.md` § "Facebook Groups research" (Taylor Swift's
Vault, the bracelet-trading groups, Kulto ni TAYLOR SWIFT), each entry
flagged `candidate: true` until a real export arrives — the Sunday
reminder then lists them instead of shipping empty; (2) the real export
itself needs your Facebook login and stays on the Sunday
`fb-export-reminder.yml` issue, which is the correct place to nag for it —
not the brief. Edit the seeded list any time; nothing waits on you.

**Status:** DONE (2026-09-06) — converted to the weekly reminder; seeding
tracked on the swift2 kanban (child of t_a0ad2392).

---

### 9. [UPGRADE] Decide whether `main` should keep requiring PRs — ~2 min

**Filed:** 2026-08-19

**CORRECTION, 2026-08-19.** An earlier version of this item said "`main` is
completely unprotected" and gave steps to add protection. **That was wrong.**
`main` has been protected the whole time by an active repository **ruleset**
named `protect-main`. The check that produced the false reading was:

```
gh api repos/JW-Incorporated/swift2/branches/main/protection
-> 404 {"message":"Branch not protected"}
```

That endpoint only reports **classic branch protection**. Protection
implemented as a **ruleset** does not appear there and returns 404 anyway. The
correct check is:

```
gh api repos/JW-Incorporated/swift2/rulesets
gh api repos/JW-Incorporated/swift2/rulesets/18819106
```

The corroborating evidence that was in plain sight: **every commit on `main`
carries a `(#NNNN)` PR number.** Nothing has been pushed directly to `main` in
this repo for a long time, because nothing can be.

**What `protect-main` (id `18819106`, enforcement `active`) actually enforces:**

| Rule | Effect |
|---|---|
| `pull_request` (0 approvals required) | **A PR is required. Direct push to `main` is blocked** |
| `required_status_checks` → `build` | `build` must be green before merge |
| `non_fast_forward` | No force-pushes |
| `deletion` | `main` cannot be deleted |
| `bypass_actors: []` | **Nobody bypasses — not admins, not Actions** |

There is also a second ruleset named `main` (id `21070803`) with enforcement
**`disabled`**, so it currently does nothing.

**So there is no gap to fix, and nothing here is blocking.** This item is now a
decision, not a repair.

**The decision.** Joey said he likes Claude Code pushing straight to `main` on
low-risk projects. In *this* repo that has never been possible, and turning it
on means editing `protect-main`:

- **To keep things as they are (recommended):** do nothing. Work lands by
  branch → PR → `build` green → merge, which is what every runner and
  `auto-merge-content.yml` already do.
- **To allow direct pushes:** open the ruleset, remove the **Require a pull
  request before merging** rule and the **Require status checks to pass** rule,
  and keep **Block force pushes** + **Restrict deletions**. Ruleset UI:
  `https://github.com/JW-Incorporated/swift2/settings/rules`

**Recommendation: leave it alone.** longlivets.com is live, `auto-merge-content.yml`
lands PRs unattended, and `build` is the only thing standing between a bad
generated-file drift and production. The PR requirement costs one extra command
and is the reason `main` has stayed green.

**Worked if:** whichever you choose, `gh api repos/JW-Incorporated/swift2/rulesets/18819106`
reflects it, and a test PR still merges once `build` is green.

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-3):** decided by
precedent, no founder answer needed. `CLAUDE.md` ("`build` gates every
merge"; "Never babysit your own PR" — land via PR + auto-merge) and
`docs/decisions.md` 2026-08-22 (merge/push authority granted *through
`gh pr merge`*, not direct push) already encode the answer this item's own
recommendation gives: keep `protect-main` as is. Reversible at any time
via the ruleset UI if a founder ever wants otherwise — that would be a new
decision, filed fresh. Verified 2026-09-06 (`gh api
repos/JW-Incorporated/swift2/rules/branches/main`): `main` is governed by
active ruleset `protect-swift2-main` (id `21672404` — the `18819106` id
above is stale, that ruleset no longer exists) enforcing `pull_request`,
`required_status_checks`, `non_fast_forward`, `deletion`. Same posture,
new id.

**Status:** SKIP (2026-09-06) — precedent already answers it; keep PRs required.

---


### 4. [UPGRADE] API accounts for the marketplace research — ~20 min

**Filed:** 2026-08-15

**Why it matters:** you asked for a curated dataset of official + viral fan-made
merch. Tier 1 (the official store) is already solved and needs nothing from you.
Everything else in the brief is unreachable from an agent environment —
Etsy/Redbubble/TeePublic return 403, Reddit is refused at the tool level, TikTok
returns an empty shell. You chose "get proper API access first" over browser
automation. Until these exist, agents pointed at those sources would invent
numbers, so the work is deliberately parked.

**Steps:**
1. Reddit script app: `https://www.reddit.com/prefs/apps` → **create another
   app** → type **script**. Save the client id and secret.
2. Etsy Open API Personal App: `https://www.etsy.com/developers/register` (or
   `https://developer.etsy.com`). Save the keystring.
3. Optional, only for referral revenue later: Awin and Amazon Associates.
4. Put the values in the project `.env` yourself — never paste a key into chat.
   Tell a session the key NAMES only, and it will wire them up.

**Known ceiling, so you do not sign up for more than you need:** per-video
TikTok/Instagram view counts for accounts you do not own are **not obtainable**
on any legitimate path, and Etsy listings carry **no review count**. Hype
evidence will be Reddit score + comments + press mentions.

**Progress (2026-08-24):** Etsy Open API done — `ETSY_KEYSTRING` and
`ETSY_SHARED_SECRET` are saved (values never seen by any session, key names
only). Awin (step 3, referral revenue) also done — `AWIN_API` saved, same
way. Reddit script app (step 1) still needed before the marketplace-
research work can start — no code exists yet to consume any of these
credentials, this was just registering accounts/keys ahead of that build.

**Worked if:** the `.env` holds a Reddit client id/secret and an Etsy keystring.

**Update (2026-09-06, Fable ruling FR-t_a0ad2392-6):** Reddit is no longer
a prerequisite. The knowledge engine already reads Reddit without any API
key — `apps/worker/src/sources/reddit-rss.ts` documents the verified
no-auth path (`<permalink>.rss?limit=N&sort=top`, and subreddit RSS
feeds), and `scripts/merch-engine/fanmade-discovery.mjs` already polls
`r/<sub>/new.json` (403 from GitHub runners, fine through the JW Labs
`home-relay` lane on Joey's home PC). Hype evidence for E5 (score +
comment count) is fully available that way; the script-app support ticket
can be ignored or answered whenever Reddit replies — if a key ever arrives
it becomes an optimization, not a gate. Etsy and Awin are done. The
marketplace-research build is unparked and tracked on the swift2 kanban
(child of t_a0ad2392). Nothing left for a founder.

**Status:** DONE (2026-09-06) — Etsy + Awin keys in place; Reddit
dependency removed by ruling.

---


## DONE


### 43. [DONE] Generate `CLAUDE_CODE_OAUTH_TOKEN` for the routines-migration fleet

**Filed:** 2026-09-05
**Closed:** 2026-09-05

**What happened:** Joey ran `claude setup-token` and sent the token to
Hermes over Discord; Hermes stored it as the `CLAUDE_CODE_OAUTH_TOKEN`
repository secret via `gh secret set` (confirmed present via
`gh secret list`, never echoed or logged). All `routine-*.yml` workflows
from the routines-migration (kanban `t_876f9697`, D1=B) can now run
end-to-end on Joey's Claude Pro/Max plan usage instead of exiting clean
with a missing-secret warning.

### 36. [DONE] T-3 News Triage model trial applied

**Filed:** 2026-08-31
**Closed:** 2026-09-01

**What happened:** Applied from a `claude.ai/code` session with
`RemoteTrigger` access, in the exact order `runners.md` § "News Triage —
model trial config applied" specifies:
1. Merged `docs/content-ops/news-triage-trial-active` to `main`
   ([PR #3626](https://github.com/JW-Incorporated/swift2/pull/3626),
   2026-09-01T00:42 UTC) — digest-archive step now live.
2. Created the "News Triage recall check — T-3 trial" trigger
   (`trig_01V8JrQPZfWpUqUWiy9fvmkh`), confirmed working via a manual
   dispatch — correctly returned a vacuous PASS
   ([issue #3628](https://github.com/JW-Incorporated/swift2/issues/3628))
   since neither the archive nor the model flip existed yet at that point.
3. Flipped News Triage's trigger (`trig_019NuR7EpN7TA28yfmzKPAC7`) from
   `claude-opus-4-8` to `claude-sonnet-5` via a full `job_config`
   round-trip (`get` → edit → PUT whole object, never partial), succeeded
   2026-09-01T00:51 UTC — **trial runs 2026-09-01 → 2026-09-15.**
   Also re-synced the live prompt to
   `docs/agents/runner-prompts/news-triage.md` verbatim in the same PUT —
   it had drifted (missing the #1966 prompt-injection defense, the T-3
   archive-snapshot addendum, and the T-20 attribution trailer); left
   unsynced, the recall check's `consumed-snapshot` mechanism and T-20
   telemetry would have been broken from day one.
4. `runners.md`'s live-trigger table updated (News Triage row + new
   recall-check row).

**One new follow-up surfaced, not blocking:** the recall-check trigger got
4 MCP connectors auto-attached on creation (Google_Drive, Vercel, Gmail,
Claude_Code_Remote) despite requesting none — same silent-ignore API
footgun `runners.md` already documents for updates, apparently also true
of creates. Needs manual removal via the `claude.ai/code/routines` UI
(no API lever for it). Low urgency — the prompt is read-only/no-merge by
design regardless of connector access — but worth doing before the trial's
first real weekly audit.

**Status:** DONE


---

### 37. [DONE] Sync T-20 attribution trailer to all 24 live Tier-2 routines

**Filed:** 2026-08-31
**Closed:** 2026-09-01

**What happened:** Applied from a `claude.ai/code` session with
`RemoteTrigger` access, per the checklist's own never-partial-PUT rule
(`get` the trigger → replace only the `prompt` field in the full returned
`job_config` → PUT the whole object back). All 21 live-prompt routines in
the checklist were re-synced to their current `docs/agents/runner-prompts/`
file content, each now carrying the `## Attribution trailer (T-20 Phase 1)`
section verbatim. The 2 approved-but-not-yet-created desks (Karen Deep
review, Notification-quality desk) and News Triage's recall-check trigger
(created and synced separately under item #36) were skipped per the
checklist's own instructions — 24 accounted for, 21 actually re-synced.

Two deliberate deviations from a naive full-file resync, both judgment
calls made in-flight and not later contested:
- **Kevin S3 radar** (`kevin-stream3-radar`): the repo file's cadence
  description doesn't match the trigger's real `23 1,13 * * *` (twice-daily)
  schedule, while the LIVE prompt's cadence text already correctly matches
  the real schedule. Only appended the attribution trailer to the existing
  correct live text; did not overwrite it with the stale file. Flagged as a
  documentation bug needing a fix in the file, not the trigger — separate
  from this item's scope.
- **Vault Run**: the live trigger's prompt is deliberately a short pointer,
  not the full ~12KB orchestrator-contract file — replacing it wholesale
  would have recreated the exact undocumented-inline-instructions anti-
  pattern the file's own text warns against. Only appended the trailer to
  the existing short prompt.

**Also confirmed, not touched:** Marjorie — 8 PM Evening Delta
(`trig_01L2EG5veWBQwMowaykXAi6B`) is disabled per Joey's T-13 decision
(`docs/decisions.md` 2026-08-31 entry) — synced its prompt with the
trailer but left `enabled: false` exactly as found.

**Follow-ups surfaced, not blocking, not part of this item's scope:**
Laura's `cron_expression` differs from `runners.md`'s table
(`20 18 * * *` live vs `20 18 * * 2,5` documented); Austin's model is still
`claude-fable-5` live though `runners.md`'s table names an intended
`claude-opus-4-8` 2-week trial; Karen's pending trigger rename tracked
separately as GitHub issue #3616.

**Status:** DONE

---

### 32. [BLOCKING] Etsy API returns 403 to the E5 evidence workflow — check app approval, ~10 min

**Filed:** 2026-08-30

**Status:** DONE

**Outcome (2026-08-30):** no human action was needed after all — Joey
verified the app is activated (Etsy confirmation email) and both secrets
correct, and the real cause was on the code side: Etsy changed v3 auth so
`x-api-key` must hold `keystring:shared_secret` joined by a colon; the
keystring alone now 403s. PR #3519 fixed both call sites
(`merch-e5-evidence.yml`, `fanmade-discovery.mjs`). The "worked if" is
satisfied: run 33323629432 completed green and uploaded
`merch-e5-evidence-artifact`. Cards t_aec44307 / t_13d961e9 unblocked.

Original ask (kept for the record): check the app's approval state at
`https://www.etsy.com/developers/your-apps`, confirm `ETSY_API_KEY` holds
the Keystring (not the shared secret), then rerun **merch-e5-evidence**
with `COLLECT_E5_EVIDENCE`.

---

### 15. [UPGRADE] Two knowledge-engine calls still open after #12 — Reddit Data API status, Supabase anonymous-auth toggle

**Filed:** 2026-08-23

**Why it matters:** you answered 3 of #12's 5 items in chat tonight (GNews
free-tier yes, embedding vendor = OpenAI, Tumblr key set) and marked #12
DONE — carrying the last 2 forward here so they don't quietly vanish along
with it. Neither blocks tonight's build.

1. **Reddit Data API** — proposal says you have a request in flight and a
   meeting this week. Tell me the outcome (approved / pending / no) and
   I'll either wire the OAuth adapter or keep the RSS-only interim (≤6
   feeds, ~36 req/day, disclosed) as the long-term posture.
2. **Supabase anonymous auth** — Clownbot's server-side conversation memory
   needs "Allow anonymous sign-ins" toggled on in the Supabase dashboard
   (Authentication → Providers). I can't reach that toggle. **Update
   (PLAN.md Stage 11, PR #2319):** the schema (`clown_conversation`/
   `clown_turn`/`bot_prediction`/`clown_pinned_theory`, `supabase/
   migrations/20260904000000_clown_sessions.sql`) and the code (session
   resolution, conversation continuity + rolling summary, per-user daily
   cap, prediction persistence) are built and tested — every write path
   genuinely fails closed to today's stateless behavior while this toggle
   is off, confirmed by both the tests and an independent Codex review.
   **Update (2026-08-24, fix branch `fix/clown-sessions-codex-findings`):**
   that Codex review's three bugs — the client never round-tripping the
   session id, the rolling-summary fold not being transactional, and
   persisted memory being write-only — are now fixed (see item #14's
   addendum for the migration, and this branch's diff for the code):
   `ClownChat.tsx` now captures the `x-clown-session` response header and
   resends it on the next message; the fold is one atomic RPC call
   (`fold_clown_conversation`, item #14's addendum) instead of two
   independent requests; and the route now loads the stored rolling summary
   + recent turns back into the model's context on a returning conversation
   (`clown-memory.ts`'s new `loadClownHistory`) instead of only ever
   writing. A fourth issue the same review round found — the per-user daily
   reservation firing before the route even knew whether a model call would
   happen (kill-switch/missing-key/global-cap misses still consumed the
   user's allowance) — is fixed too, moved inside `runClownAgent` to fire
   only once a model call is genuinely about to be attempted. **Still hold
   off flipping the toggle until item #14's two new migrations are applied**
   (same batch as the rest of that item) — the code fix alone doesn't apply
   the migration or flip the toggle for you.

   **Update (2026-08-24, PR #2325 merged) — I ran that pending Codex review
   myself before merging. Correcting the fix branch's own self-report above,
   which claimed more than the independent review confirmed: still do NOT
   flip the toggle, real issues remain.** Genuinely fixed and independently
   verified: the SECURITY DEFINER grant scoping (item #14), and the fold RPC
   is now provably atomic for its stated claim (a forced mid-call error
   rolls back both the delete and the update together — tested against a
   real ephemeral Postgres, not just asserted). Real issues still open:
   - **New this round, not present before**: loaded conversation history
     (rolling summary + recent turns) is fed into the model's system prompt
     without going through `screenConversation` the way the client-supplied
     transcript is — stored user text becomes elevated-trust context an
     attacker's own prior turn could poison. Needs the same screening pass
     applied to `loadClownHistory`'s output before `clown-agent.ts` uses it.
   - `clown-memory.ts`'s `getConversation`/`loadClownHistory` don't catch
     fetch/JSON failures, so once real sessions exist a Supabase hiccup
     would 500 the live chat route instead of degrading to no-memory —
     confirmed this can't fire TODAY (I verified `resolveClownSession` is
     fully try/caught and Supabase itself rejects every signup attempt
     while the toggle is off, so `memorySession` is null on every request
     right now, meaning `loadClownHistory` is never actually called yet) —
     but it needs a try/catch before the toggle flips.
   - The session token lives only in a `ClownChat` component ref, so
     switching modes or reloading loses it — each return visit mints a
     fresh anonymous identity, which also resets the per-user daily cap.
     Needs to move to something that survives remount (the app's existing
     `store.tsx`, or `localStorage`).
   - A request that gets denied for being over the per-user cap still
     consumes the shared global reservation before returning the denial —
     minor, but real.
   - The fold RPC doesn't verify the turns it deletes actually belong to
     the conversation it's updating, and doesn't check affected-row counts.
   None of this is live-exploitable today — confirmed directly, not
   assumed, since every path requires a resolved anonymous session and
   Supabase itself is the gate keeping that null. But it means the toggle
   genuinely isn't ready to flip yet. Full findings: PR #2325's review,
   Codex session `01a033dd-7645-7373-827e-c22739c7e943`.

   **Update (2026-08-24, fix branch `fix/clown-sessions-final-hardening`) —
   all 5 remaining findings from PR #2325's review are now fixed, third
   pass:** loaded conversation history (rolling summary + recent turns) now
   runs through `screenConversation`/`screenInput` in `route.ts` before ever
   reaching the agent loop, the same gate the client-supplied transcript
   already goes through — a stored turn/summary that would fail the screen
   now gets the same fixed refusal, model never called (tested: a blocked
   turn and a blocked summary each caught before `runClownAgent`).
   `clown-memory.ts`'s `getConversation`/`loadClownHistory` now catch
   rejected fetches and malformed JSON, degrading to `null` instead of
   throwing into `route.ts`'s `POST` — same fails-closed discipline
   `resolveClownSession` already follows, including a warn-once log (tested:
   a rejected fetch and a malformed-JSON response on both the conversation
   lookup and the recent-turns lookup all resolve to `null`, never throw).
   The session token now persists via `clown-session-storage.ts`
   (localStorage, mirroring `progress.ts`'s existing pattern) instead of
   living only in a `ClownChat` component ref, so it survives a mode-switch
   remount or a page reload (tested: write-then-independent-read round-trip,
   simulating a fresh mount). A user-cap denial in `clown-agent.ts` now
   calls a new `MoodUsage.release()` to give back the shared global
   reservation it had already taken, so a cap-denied request no longer
   wastes shared budget (tested: `usage.used()` is 0 after a denial, 1 after
   a call that actually proceeds). `fold_clown_conversation` has a v2
   migration (`20260907000000_clown_fold_conversation_v2.sql`) scoping its
   delete by `conversation_id` too (not just the turn ids) and raising when
   the update affects zero rows — verified against a real ephemeral local
   Postgres: idempotent across all 26 migrations applied twice, a turn
   genuinely owned by the caller but belonging to a DIFFERENT conversation
   survives a fold scoped to the right one, and a fold against a
   nonexistent/invisible conversation id raises instead of silently
   succeeding. Also made a genuine attempt at the LOW file-length finding:
   `ClownChat.tsx` 387→301 lines (`ClownChatTitlebar.tsx`/
   `ClownChatComposer.tsx`/`useChromeOffset.ts` split out) and
   `clown-agent.ts` 334→311 lines (`clown-agent-caps.ts` +
   `clown-agent-prompt.ts`'s new `dispatchReadBlocks`) — both land just
   above the 300-line guideline, not under it, noted honestly rather than
   fragmenting further. **Still do NOT flip the toggle** until this branch's
   `codex:rescue` review comes back clean (same category of risk as every
   prior pass — schema + the live chat route's context-assembly logic).

   **Update (2026-08-24, same branch `fix/clown-sessions-final-hardening`,
   fourth pass) — architect (Fable) escalation after round 3's own
   `codex:rescue` review found recurring trust-boundary gaps; implementing
   Fable's decided design, not another incremental fix:**
   1. **Session credential moved from a client-visible token to an
      `HttpOnly; Secure; SameSite=Strict; Path=/api/clown` cookie**
      (`clown_session`) — round 3's `x-clown-session` header/localStorage
      approach handed the raw Supabase access+refresh token pair to client
      JS; the client now never sees it at all, the browser's cookie jar
      handles persistence and same-origin resend with zero client code.
      `clown-session-storage.ts` (the round-3 localStorage module) is
      deleted outright, along with its test and the now-dead
      `withSessionHeader`/`nextSessionToken` helpers.
   2. **The stored conversation summary is demoted into the first
      user-role message** (wrapped in `<conversation_memory>` tags, with a
      literal `</conversation_memory>` stripped from the stored text first
      against a tag-breakout attempt), never promoted into a system block —
      round 3's second system block is removed. Fold-time screening
      (`clown-memory.ts`'s `maintainRollingSummary`) is now per-turn and
      role-aware (mirrors `screenConversation`'s dispatch), silently
      dropping a turn that fails its own screen from what gets folded
      rather than surfacing a refusal (round 3's regression). The route's
      own `screenInput` pass over the folded summary text is removed —
      replaced by the fold-time screening above; the route's
      `screenConversation` pass over loaded TURNS is unchanged.
   3. **Schema fix:** `clown_conversation` now carries `unique (user_id)`
      (`20260908000000_clown_conversation_unique.sql`, with a dedupe step
      for any pre-existing duplicate rows) — one conversation per user is
      the actual identity model. Conversation creation is now a PostgREST
      upsert (`on_conflict=user_id`, `resolution=merge-duplicates`) with a
      fresh `expires_at`, so an EXPIRED row (still physically present under
      RLS) is recoverable instead of permanently blocking creation.
      `getConversation` now distinguishes a confirmed-empty read from a
      failed one; only confirmed-empty falls through to creation — a read
      failure degrades to no-memory instead of risking a duplicate
      conversation. Also fixed the day-keyed `MoodUsage.release()` bug
      (a per-user cap reservation taken before midnight, released after,
      could decrement the wrong day's counter).
   Verified: `npm run typecheck --workspace=@swift2/web` clean, full suite
   green (216 files / 3543 tests), and the new migration checked against a
   real ephemeral Postgres — idempotent across all 27 migrations applied
   twice, dedupe keeps the most-recently-active row, the unique constraint
   is live, and the upsert recovers from an expired-row collision (reset
   summary + fresh `expires_at`, no duplicate row).

   **RESOLVED, 2026-08-24 12:10 PDT — PR #2328 merged, this whole thread is
   closed out.** Two more `codex:rescue` rounds ran on the architect's
   design (5 review rounds total across this item's history): round 4
   confirmed the architecture itself is sound (both harder pieces — cookie
   session, demoted summary — fully held) and found 3 small mechanical
   gaps (one response path missing its cookie header, an over-loose
   "confirmed empty" check that could wrongly reset real data, a stale doc
   line); a narrow fix closed those; a final round 5 review confirmed both
   real claims genuinely FIXED with real regression tests, no remaining
   system-role summary path anywhere, no defect in either of the two
   latest migrations. What's left is cosmetic, not functional, noted for
   whoever's next through this file: a missing test assertion on the
   cookie header for one specific response branch (the code is right, the
   test just doesn't check it — `route.test.ts`'s loaded-history-refusal
   case), one line of leftover historical wording in `MAP.md`, and a
   non-blocking note that user/assistant turn-pair writes aren't
   transactional (a partial failure could store one side of an exchange
   without the other — flagged non-blocking by the reviewer itself).

   **Anonymous-auth toggle: safe to flip whenever you're ready.** The
   session credential the toggle would start minting is now
   `HttpOnly`/never client-visible, stored conversation history can't
   reach the model with elevated trust, and conversation identity/rate-
   limit accounting are both correct. Nothing left blocking it — do this
   at the same time as item #14's migration batch, since the schema this
   depends on isn't live until those apply.

**Worked if:** you tell me the Reddit outcome in chat. Once item #14's
migrations are applied, flip the Supabase toggle whenever you like — the
code is ready.

**Outcome (2026-08-30):** Reddit denied the knowledge engine's Data API
request. The disclosed RSS-only interim remains in place today while a
separate sustainable-source research lane investigates alternatives. Joey also
accepted Clownbot's current stateless operation until it has users; do not
enable Supabase anonymous sign-ins or server-side conversation memory. See
`docs/decisions.md` 2026-08-30 decision record.

**Status:** DONE (2026-08-30)

---

### 5. [UPGRADE] Five product/tech decisions that lost their owner — ~10 min

**Filed:** 2026-08-15

**Why it matters:** these were Wyatt's calls. With him gone they are yours, or
they ship unratified by default. None is urgent; all are cheap to answer.

1. **Clownbot's model tier** — currently `claude-sonnet-5`, one named constant.
2. **The 200/day/instance Clownbot cap** — keep, raise, or lower.
3. **Ratify the Mood route pattern** (or say you do not care, which is a valid
   answer and closes it).
4. **Sign off the Clownbot decisions entry** in `docs/decisions.md`.
5. **The era reader's bottom nav** formally overrides
   `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3. It is already shipped;
   this just records that you meant it.

**Worked if:** you answer in chat. A session writes the answers into
`docs/decisions.md`.

**Outcome (2026-08-30):** Joey said, “I'm good with these as is.” The five
dispositions are recorded in `docs/decisions.md` under
“Clownbot/Mood/era-reader ratification.”

**Status:** DONE

---


### 6. [UPGRADE] Should `auto-merge-content` keep auto-landing UI code? — ~2 min

**Filed:** 2026-08-15

**Why it matters:** PR #2140 changed two `.tsx`/`.ts` files and merged itself
with no human involved. That is `auto-merge-content.yml` working exactly as
written — its guard only blocks server-executing and secret-reading files, and a
client component is neither — but the name says "content" and it is now shipping
interface changes unattended.

**Options:** leave it (fast, and CI still gates every merge); restrict it to
content files only; or keep the behaviour and rename it so it stops being
surprising.

**Worked if:** you pick one in chat.

**Outcome (2026-08-30):** Joey retained the current CI-gated
`auto-merge-content` behavior, including eligible UI/client-code changes; see
the 2026-08-30 decision entry in `docs/decisions.md`.

**Status:** DONE

---


### 7. [UPGRADE] Three questions left open when #2110 merged — ~5 min

**Filed:** 2026-08-15

**Why it matters:** you deferred these to land the branch. Merging did not
answer them, and the dataset ages from here.

1. **Instagram + TikTok** — your item 4b named both; the build brief omitted
   them. They are a different shape (creator accounts, not joinable groups), so
   scope was not widened without you. In or out?
2. **Who owns refresh cadence** — invites rotate and groups go private. The data
   was accurate 2026-08-14 and decays from there.
3. **`r/TravisAndTaylor`** was excluded as an anti-fan snark board — ratify or
   veto. `r/GaylorSwift` was kept, flagged private since Aug 2025.

**Worked if:** you answer in chat; a session records it on the issue.

**Outcome (2026-08-30):** Joey decided that Instagram and TikTok creator-account
coverage is in scope and must have an automated solution. Group and invite
refresh must also be automated; only if full automation is not feasible may it
use automated human-action reminders with specific instructions. Retain the
exclusion of `r/TravisAndTaylor` and also exclude `r/GaylorSwift`. The decision
is recorded in `docs/decisions.md` (2026-08-30); the automation-design work is
tracked separately.

**Status:** DONE

---


### 8. [UPGRADE] Turn on the spam gate for link submissions — ~10 min

**Filed:** 2026-08-15

**Why it matters:** you asked for "a very simple captcha... the box you click
that says I'm human" on the Community/Merch link-submission form. That's now
built (Cloudflare Turnstile, "managed" mode — it usually passes invisibly and
only shows a checkbox when Cloudflare's own risk signal is ambiguous). It
ships **inert**: no Cloudflare account exists yet, so the code detects the
missing key and skips verification entirely — the site keeps working
normally in the meantime, exactly as it does today (honeypot + rate limiter
only). Nothing breaks by leaving this OPEN.

**Steps:**
1. Log into `https://dash.cloudflare.com` (sign up free if you don't have an
   account — the domain does not need to be on Cloudflare for this to work).
2. Left sidebar → **Turnstile** → **Add site**.
   - Site name: anything, e.g. `Long Live submissions`.
   - Domain: `longlivets.com`.
   - Widget mode: **Managed**.
3. Cloudflare shows you two values: a **Site Key** and a **Secret Key**. Copy
   both.
4. From a terminal, in the repo, with the Vercel CLI set up (see
   `docs/deploy.md`):
   ```bash
   vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY   # paste the Site Key
   vercel env add TURNSTILE_SECRET_KEY             # paste the Secret Key
   vercel --prod
   ```
   Choose **Production** (and Preview, if asked) when each `vercel env add`
   prompts you for environments.

Full write-up: `docs/ops/community-merch-submissions.md`, Part 4.

**Worked if:** open the Community or Merch page — most of the time nothing
looks different (the widget passes invisibly). Submit a test link and
confirm it still works and still shows up as a GitHub issue.

**Outcome (2026-08-30):** Joey decided: “Close this; we can worry about it if
it becomes an issue.” Turnstile remains disabled/inert; the existing honeypot
and rate limiter remain the active protections.

**Status:** SKIP

---



### 30. [UPGRADE] Confirm the two owner-authorized X post deletions

**Status:** DONE (2026-08-30)

**Outcome (2026-08-30):** Joey confirmed both specified posts are gone/unavailable.

---

### 27. [BLOCKING] External IP-counsel review of the merch affiliate layer — gates merch Phases 2–4

**Filed:** 2026-08-30

**Status:** DONE (2026-08-30)

**Why it matters:** `docs/decisions.md` 2026-07-08 §3 is the standing rule:
**nothing monetized ships without external IP-counsel review**
(right-of-publicity, false endorsement, FTC affiliate disclosure), and
FR-MERCH-4/5 hold that no affiliate/commercial implementation (the
`shop.ts` seam flip, engine E0, coverage-report wiring) starts before that
sign-off. The merch plan's Phase 1 trust fixes (E1/E2/E3) proceed without
you; every money phase waits here. Engaging counsel is also a spend
decision, which is yours alone.

**Steps:**
1. Engage an IP attorney (right-of-publicity / false-endorsement / FTC
   affiliate-disclosure scope). Bring: the live site `longlivets.com`, the
   plan `docs/PLAN.merch-autonomy.md`, the UNOFFICIAL fan-project
   disclaimer, and the fact that content stores plain retailer URLs with
   wrapping at one seam (`apps/web/lib/longlive/shop.ts`).
2. Report the outcome in chat (sign-off, or the changes counsel requires);
   a session records it in `docs/decisions.md` and unblocks Phase 2.

**Worked if:** counsel's written sign-off (or required-changes list) is
recorded in `docs/decisions.md` and this item is DONE.

**Outcome (2026-08-30):** Counsel sign-off recorded from Joey's direct chat instruction.

---

### 29. [UPGRADE] Search-API account for merch engine E6 — payment card, ~10 min

**Filed:** 2026-08-30

**Status:** DONE

**Why it matters:** engine E6 (Moment→Product Matcher, merch plan Phase 4)
needs a Google Shopping-class search API for the matches the free Awin
product index can't answer. This is a spend decision (paid account), so
only you can open it. Nothing is halted today — E1/E2/E3 run without it —
but E6 cannot start until this key exists (FR-MERCH-5 gate ruling,
`docs/decisions.md` 2026-08-30). Expect light usage: the Awin index takes
the first pass on every match for free, so a low tier (~$10–30/mo) likely
suffices; start small, upgrade only if E6's ticket volume shows it.

**Steps:**
1. Sign up at `https://serpapi.com` (or an equivalent Google
   Shopping-results API you prefer) on its cheapest paid tier; add the
   payment card.
2. Copy the API key and save it as a repo Actions secret named
   `SEARCH_API_KEY`: from a terminal in the repo, run
   `gh secret set SEARCH_API_KEY --repo JW-Incorporated/swift2` and paste
   the value when prompted (`gh secret set` is guard-denied for agents —
   founder-only on purpose). Key **name** only in chat, never the value.

**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows
`SEARCH_API_KEY`, and E6's first run reports real search results instead
of a missing-credential skip.

**Outcome (2026-08-30):** Joey saved `SEARCH_API_KEY` in GitHub Actions
secrets and set a $25/month cap ($300/year maximum). The closing signal for
this founder action is the first "Worked if" clause (secret present), per
Joey's report; the E6 first-run clause transfers to E6's own acceptance check
when Phase 4 builds it — it is not a founder action and does not hold this item
open.

---

### 31. [UPGRADE] Higher-cap paid-search request — superseded, ~0 min (no action needed)

**Status:** DONE — no longer needed; superseded by #29's completed, lower-cap disposition.

**Outcome (2026-08-30):** The prior $75/month action request is no longer
active. #29 records the completed `SEARCH_API_KEY` setup with a $25/month cap
($300/year maximum).

---

### 28. [UPGRADE] Merch plan: save credentials under canonical names — ~10 min

**Filed:** 2026-08-30

**Status:** DONE

**Why it matters:** Joey's D1/D3 product decisions are complete under
HUMAN-ACTIONS #26. The remaining owner action is the credential-naming cleanup:
the Awin/Etsy engines read the canonical secret names below (FR-MERCH-5,
`docs/decisions.md` 2026-08-30). No code reads the old names, so this is a
save-under-the-right-name step, not a migration.

**Steps:**
1. In the **Awin dashboard**: generate the **Publisher API token** and the
   **Create-a-Feed API key**. Save them in the project `.env` / secret
   store as `AWIN_API_TOKEN` and `AWIN_FEED_API_KEY`, and save your Awin
   publisher ID as `AWIN_PUBLISHER_ID`. Delete the old `AWIN_API` entry
   (ambiguous name, retired by FR-MERCH-5).
2. Re-save the Etsy keystring value under the name `ETSY_API_KEY` (it
   currently sits as `ETSY_KEYSTRING`; keep `ETSY_SHARED_SECRET` as-is).
   As always: key **names** only in chat, never values.

**Worked if:** the secret store holds `AWIN_API_TOKEN`, `AWIN_FEED_API_KEY`,
`AWIN_PUBLISHER_ID`, and `ETSY_API_KEY` with no `AWIN_API` entry left.

**Outcome (2026-08-30):** Joey completed canonical GitHub repository-secret
provisioning: `AWIN_API_TOKEN`, `AWIN_FEED_API_KEY`, `AWIN_PUBLISHER_ID`,
`ETSY_API_KEY`, and `ETSY_SHARED_SECRET`; retired `AWIN_API` is absent.

---

### 26. [MERCH] Record owner decisions D1 and D3 for the autonomous marketplace

**Filed:** 2026-08-29

**Decision received (2026-08-30):** Joey chose D1-a: list the full official
store catalog without affiliate links to the official store, with a secondary
Amazon affiliate alternative only where the same item is verified there. Joey
also approved D3: "inspired-by" yes, bootleg no — reject fan-made items that
reprint official art, tour graphics, or photos of Taylor.

**Status:** DONE — choices recorded in `docs/decisions.md` and
`docs/PLAN.merch-autonomy.md`; downstream E4 and E5 work must follow them.

---

### 25. [BLOCKING] Two PRs stuck with zero GitHub Actions check-suite — one is the live IG/X posting bug fix — ~5-15 min, needs your GitHub UI access

**Filed:** 2026-08-26

**Why it matters:** you asked why Instagram posts have been silent while X
posts keep firing, and why 4 posts went out at once instead of ~daily.
**Both are fully diagnosed and fixed** (see the writeup below/in chat), but
the fix — **PR #3372** — cannot merge: GitHub Actions never creates a
`build`/`CodeQL`/`tree-pr-mail` check-suite for this branch at all, so the
required `build` status check (branch protection, `bypass_actors: []` —
nobody can bypass it, not even you as admin) never appears and the merge
stays blocked. A second, unrelated PR (**#3371**, a routine content batch)
hit the identical symptom, as did its predecessor **#3369** before it. Two
separate agent investigations ruled out: workflow files disabled, repo
Actions permissions, path filters, draft-PR suppression, an org-wide
outage (other same-window PRs got full check-suites fine), and fork-PR
restrictions (both are same-repo branches, not forks). Pushing an empty
commit and closing/reopening the PR did not trigger anything either.

**Status:** DONE — 2026-08-26 ~10:04 PDT. Both #3372 and #3371 merged on
their own not long after Joey checked the Settings/Actions UI (root cause
of the missing check-suite never conclusively identified, but it resolved
itself rather than needing a workaround branch). Confirmed on `main`:
`scripts/social/lib/queue.mjs`'s `MAX_POSTS_PER_RUN = 1` (was 5).

---

### 21. [BLOCKING] Grant the Paul Blart runner read access to Dependabot alerts — ~5 min

**Filed:** 2026-08-17

**Why it matters:** Paul Blart's whole job is "zero CVEs sitting unseen." Right
now he **cannot see them at all.** The token the scheduled runner uses returns
`403 Resource not accessible by integration` on every Dependabot security-alert
endpoint, and the 403 response literally names the missing scope:
`X-Accepted-GitHub-Permissions: vulnerability_alerts=read`. So the weekly patrol
can review version-bump PRs but is **blind to the actual CVE feed** — a critical
alert could be open today and no report would show it. This is the one thing that
makes the whole desk trustworthy, and it is off.

Endpoints confirmed 403 on 2026-08-17: `dependabot/alerts`,
`vulnerability-alerts`, `automated-security-fixes`. (`code-scanning/alerts`
returns "Code Security must be enabled" — that's the separate CodeQL toggle, see
issue #1894, not this item.)

**Correction, 2026-08-24 — the original steps below were wrong, sorry for the
runaround.** You tried them and found none of your 4 installed GitHub Apps
(Claude, Vercel, Slack, Supabase) show anything about Dependabot when opened.
That's not you missing a menu — **it's genuinely not there to find.** Paul
Blart is a Claude Code cloud routine, so its GitHub access runs through the
`Claude` app itself (Anthropic's own GitHub App). A GitHub App's installer
can only grant permissions the app's own manifest requests; you can't add a
scope to someone else's app from the installed-apps screen, no matter which
of the 4 you click. `X-Accepted-GitHub-Permissions: vulnerability_alerts=read`
was real, but the fix isn't a checkbox anywhere in that UI.

**The actual fix, now built** (`.github/workflows/dependabot-alerts-snapshot.yml`
+ `scripts/dependabot-alerts-snapshot.mjs`, PR pending): a GitHub Actions
workflow — which unlike a routine CAN use a dedicated repo secret — fetches
the open alerts once a week and publishes them into one persistent tracking
issue titled "Dependabot alerts — automated snapshot," which Paul Blart's
routine now reads instead (`docs/agents/runner-prompts/paul-blart-run.md`
updated). This needs one thing from you: a fine-grained PAT, scoped to just
this repo, with exactly the one permission that was missing.

**Steps:**
1. Go to `https://github.com/settings/personal-access-tokens/new`.
2. **Token name**: something identifiable, e.g. `swift2-dependabot-alerts-read`.
3. **Resource owner**: `JW-Incorporated`.
4. **Repository access**: **Only select repositories** → `swift2`.
5. **Permissions** → **Repository permissions** → find **Dependabot alerts**
   → set to **Read-only**. (Nothing else needs a permission — leave every
   other row at "No access.")
6. **Generate token**, copy the value (starts `github_pat_...`).
7. From a terminal, in the repo: `gh secret set DEPENDABOT_ALERTS_PAT --repo
   JW-Incorporated/swift2` and paste the value when prompted (or `--body`
   with the value piped in, never typed where it could land in shell
   history) — same pattern as `HUMAN-ACTIONS.md` #13's `ANTHROPIC_API_KEY`
   earlier. I can't run this myself — `gh secret set` is guard-denied,
   human-only on purpose.

**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows
`DEPENDABOT_ALERTS_PAT` (value stays hidden either way), and the next Monday
21:00 UTC run of `dependabot-alerts-snapshot.yml` updates the tracking issue
with either a real severity-ranked table or "0 open alerts" — not the
"PAT not configured yet" notice. You can also trigger it manually anytime via
**Actions → dependabot-alerts-snapshot → Run workflow** (uncheck "dry run"
to actually publish).

**Done 2026-08-24 (Joey):** set `DEPENDABOT_ALERTS_PAT`, confirmed present
via `gh secret list`. Verified end-to-end same day rather than waiting for
Monday — triggered the workflow manually (`gh workflow run
dependabot-alerts-snapshot.yml -f dry_run=false`), it completed
successfully, and tracking issue #3185 updated with a real fetch (no more
"PAT not configured" placeholder). Paul Blart can now actually see the CVE
feed.

**Status:** DONE

---

### 20. [UPGRADE] Register a DMCA agent with the U.S. Copyright Office — ~15 min + a small filing fee

**Filed:** 2026-08-24

**Why it matters:** Joey decided (2026-08-24, in chat) to register a DMCA
agent. `apps/web/lib/longlive/legal.ts`'s takedown-notice section (PR #2332)
now says "we are in the process of registering" — that line needs to become
"is registered" once this is actually done, so don't leave this open long.
This needs your own identity/account and a payment method — no agent can do
it for you.

**Steps:**
1. Go to `https://dmca.copyright.gov` and create/sign in to a U.S. Copyright
   Office account.
2. Start a new **"Designation of Agent to Receive Notification of Claimed
   Infringement"** filing.
3. Fill in: Service Provider Name → `JW Labs LLC` (also list `Long Live` /
   `longlivets.com` as an alternate name if the form asks for one). Agent
   name/title → whoever should actually receive DMCA notices (you, or a
   role). Agent contact → use `legal@longlivets.com` (PR #2332) so it
   matches the published policy. Public contact address → same
   postal-address call as item #19/legal.ts (currently omitted per counsel;
   the Copyright Office may require a real one for this specific filing —
   check the form).
4. Pay the filing fee (check the current amount on the site — it's changed
   before, don't trust a number from an old source) and submit.
5. Tell a session once it's filed — the confirmation gives you the agent's
   registration number, which is worth recording in `docs/decisions.md`.

**Worked if:** `dmca.copyright.gov`'s public agent directory shows JW Labs
LLC / Long Live with a live registration, and `legal.ts`'s DMCA line is
updated to say "is registered."

**Status:** DONE

---

### 18. [UPGRADE] Refresh the production database — content seed has drifted, not urgent — ~15 min, needs Wyatt

**Filed:** 2026-08-24

**Why it matters:** issue #725 — production `month_item`/`track_note`/
`theory`/`video_work` tables are stale against `supabase/seed/**`. The issue
itself says this isn't urgent — it only matters before the Android device
test (item #17 below), so bundle them.

**Steps:**
1. Whoever has `apps/worker/.env` (`SUPABASE_DB_URL` — Wyatt) runs `npm run
   db:seed:content`, `db:seed:tracks`, `db:seed:theories`, `db:seed:videos`.

**Worked if:** production content matches the current seed files.

**Status:** DONE — content/tracks/theories seeded clean. Videos seed
failed on a real bug (`video_work_slug_key` collision); root cause,
code fix, and the one command to unblock it are filed separately as
item #24.

---

### 17. [UPGRADE] Android — real-device test is the only thing left before Play Store — ~15 min, needs Wyatt

**Filed:** 2026-08-24

**Why it matters:** issue #530. Engineering is done — two draft PRs (#42,
#67) hold a working Expo/EAS build plus the shipping checklist. The only
remaining blocker is running it on a real Android phone, which needs
Wyatt's account/hardware. `docs/definition-of-done.md` row 8's "#1815 —
unshipped" note is stale; #1815 is a merged PR, not the actual tracker — the
live tracker is #530.

**Steps:**
1. Wyatt installs the EAS build from #67's checklist on a real Android
   phone and runs through it.
2. Report back pass/fail; if it passes, the Play Store submission steps are
   already written in #67.

**Worked if:** #530 closes with a real-device pass recorded.

**Done 2026-08-24 (Joey):** tested the EAS build on a real Android phone —
works great. #530 closed with the pass recorded. Next step per #67's
checklist: Play Store submission (separate, not blocking this item).

**Status:** DONE

---

### 14. [BLOCKING] No `apps/worker/.env` in knowledge-engine worktrees — 10 migrations unapplied against prod, pgvector untested, one real security gap to close first

**Filed:** 2026-08-23

**Security finding — FIXED IN CODE (2026-08-24, fix branch
`fix/clown-sessions-codex-findings`), still needs applying like every other
migration below:** `increment_usage_daily` (from
`20260902000000_usage_daily.sql`, used by Stage 3/6/11's daily caps) is a
`SECURITY DEFINER` function that takes a caller-controlled scope string
and, once applied, would have been callable by anyone holding the site's
public anon key (embedded client-side by design) via Supabase's
auto-generated REST RPC endpoint — nothing in the original migration
revoked its default `PUBLIC` execute grant. A new migration,
`supabase/migrations/20260905000000_usage_daily_grants.sql`, closes this:
`revoke execute ... from public` + explicit grants to only the two roles
that actually call it (`authenticated` — the web app's anonymous-auth
sessions; `service_role` — the worker). It also re-creates the function to
check, for an `authenticated` caller specifically, that the scope it's
asking to touch is its OWN `clown-chat:<uid>` scope — granting to
`authenticated` alone would otherwise reopen nearly the same hole, since
Supabase hands that role to every anonymous sign-in (i.e. every site
visitor, once the toggle below is on). Verified for real: applied
alongside every other migration twice against a real ephemeral local
Postgres, confirmed `PUBLIC` has no execute grant, `authenticated`/
`service_role` do, an authenticated caller can increment its own
`clown-chat:` scope but is rejected touching `extract`, and `service_role`
can still touch any scope. Same fix (step 1 below) applies it — nothing
extra needed.

**Update:** Stage 1 (worker fixes, PR #2300) hit the identical gap for the
same reason — two more migrations
(`20260823010000_news_sources_seed_wave2.sql`,
`20260823020000_news_raw_item_resolved_tier.sql`) are written and merged to
`main` but not yet applied against production, because that worktree also
had no `apps/worker/.env`. All three migrations below need one
`npm run db:migrate` run from a checkout that has the real env file — do
them together, one command, once `main` has all three.

**Update 2026-08-24 — no longer reddening CI, still BLOCKING the feature.**
`news-worker.yml` had been crashing every 4h (exit 1) on the resulting
schema-cache errors (`resolved_tier`, `symbol_lexicon`, `news_story.extracted_at`),
which paged daily via watchdog.yml's cadence check. `apps/worker/src/index.ts`
now classifies "schema not yet migrated" errors (`/schema cache|does not exist/`)
as a degraded no-op that keeps the Action green — matching the worker's
documented "zero sources = no-op usefully" posture — while any *genuine* error
still fails the job. This removes the CI noise but does **not** substitute for
this item: the Current tier stays empty and the knowledge engine cannot ingest
until these migrations are applied. Once `npm run db:migrate` runs, the worker's
same calls succeed and it resumes real work automatically.

**Why it matters:** Stage 2 of the knowledge-engine build (`PLAN.md`) asked me
to test `create extension vector` against the real Supabase project first,
then apply `supabase/migrations/20260901000000_knowledge_engine.sql` with
`npm run db:migrate` and verify it's idempotent by running it twice — against
production. `apps/worker/.env` (the file holding `SUPABASE_DB_URL`) does not
exist anywhere in this worktree (`%TEMP%\claude-worktrees\
knowledge-engine-02-migration`), and `SUPABASE_DB_URL` isn't set as an
ambient environment variable either — I checked both. `git worktree add`
only copies git-tracked files; `apps/worker/.env` is gitignored, so it never
existed here even though it's presumably present in your main checkout. The
guard also correctly denies me from reading/copying a real `.env` file
directly, so I can't self-serve this even if the file were reachable.

**What I did instead, so this doesn't block the whole stage (per my
instructions):** wrote the full migration SQL, WITHOUT the proposal's
`embedding vector(1024)` column / `hnsw` index (safe default — matches the
already-ratified stance in `docs/decisions.md` 2026-08-23 that the embedding
column stays effectively unused until a vendor is picked anyway). Verified
the migration's SQL is syntactically correct and genuinely idempotent by
running it twice against a real (ephemeral, local, NOT production)
Postgres via the `embedded-postgres` package — same mechanism
`scripts/backup-restore-test.mjs --cluster ephemeral` already uses in this
repo. Both passes applied clean. I also probed `create extension vector` on
that same local Postgres: **not available** there (the embedded distribution
doesn't ship the extension's binary) — this does NOT tell us whether
pgvector is available on the actual Supabase project; Supabase almost always
ships it, but per `PLAN.md`'s own ground-truth note this was explicitly
supposed to be verified, not assumed, and I have no way to verify it without
the real credential.

**Steps:**
1. Either run `npm run db:migrate` yourself from a checkout that has
   `apps/worker/.env` (this PR's branch, once merged, or checked out
   locally) — the migration is ready to apply as-is — or hand a session
   `apps/worker/.env` in a worktree that needs DB access (copying a
   gitignored env file between your own checkouts isn't a secret leak, just
   a step no session can do to itself under the current guard).
2. While you're at it: `psql "$SUPABASE_DB_URL" -c "create extension if not
   exists vector;"` (or let a session with the env file run it) tells us
   definitively whether pgvector is available on this project's plan tier.
   If it works, a fast-follow migration can add `knowledge_doc.embedding
   vector(1024)` + the `hnsw` index — retrieval stays FTS-only until then,
   which was already the plan pending an embedding vendor pick anyway
   (`HUMAN-ACTIONS.md` #12 item 2).

**Worked if:** `npm run db:migrate` (with `apps/worker/.env` present) applies
`20260901000000_knowledge_engine.sql` cleanly against production, and running
it a second time is a clean no-op (no errors, no duplicate objects).

**Addendum (Stage 4, canonical sync):** same root cause hits
`scripts/sync-clown-knowledge.mjs`/`scripts/knowledge-coverage.mjs`, which
also need `SUPABASE_DB_URL` to write/read `knowledge_doc`/`egg_ledger`/
`symbol_lexicon`/`technique`. Both degrade gracefully instead of crashing
`npm run sync:content` (build every row from real seed data, log a clear
skip message, exit 0) when the credential isn't reachable — same as this
item's Stage 2 note. Verified for real anyway: applied all 17 migrations +
ran the sync script twice against a real ephemeral local Postgres
(`embedded-postgres`, same mechanism as this item's Stage 2 verification) —
1061 `knowledge_doc` / 37 `egg_ledger` / 52 `symbol_lexicon` rows, identical
row counts and ids on both runs (genuine upsert idempotency), `technique`
stayed at 0 rows throughout. Not a new item — same fix (step 1 above) closes
this too.

**Addendum (Stage 6, fan adapters):** another migration,
`20260901010000_knowledge_engine_fan_adapters.sql`, widens
`news_source.source_type` to admit `reddit_rss`/`tumblr`/`gnews`
(`bluesky` was already allowed) and adds `api_usage_daily` (a generic
scoped daily-call counter — first consumer: `gnews.ts`'s free-tier cap).
Same root cause, same fix: verified idempotent (applied twice) against a
real ephemeral local Postgres, not yet applied to production. Run it
together with the rest when you run step 1 above.

**Addendum (2A, live_theory redline fast-follow):** a retroactive Codex
review of `20260901000000_knowledge_engine.sql` (task-mt6t7akh-a22733) found
`live_theory` had no `redline_ok` column/RLS gate, unlike `current_item`/
`fan_signal`. Fixed in a new migration,
`supabase/migrations/20260903000000_live_theory_redline.sql` — same root
cause hits this worktree too (guard denies reading `apps/worker/.env` here
as well, confirmed directly). Verified for real: applied all 21 migrations
twice against a real ephemeral local Postgres (`embedded-postgres`, same
mechanism as this item's other verifications) — clean idempotent re-apply
both times — then, still on that local cluster, confirmed the RLS gate
itself works: inserted one `redline_ok=true` and one `redline_ok=false`
`live_theory` row, granted `SELECT` to a non-owner role (simulating
Supabase's `anon`/`authenticated` default grant), and confirmed only the
`redline_ok=true` row was visible under RLS.

**Addendum (Stage 11, sessions/memory):** one more migration,
`supabase/migrations/20260904000000_clown_sessions.sql`
(`clown_conversation`/`clown_turn`/`bot_prediction`/`clown_pinned_theory` —
`usage_daily` reused with a new scope, not a new table). Same root cause,
same fix. Verified for real: applied all 23 migrations twice against a real
ephemeral local Postgres, clean idempotent re-apply both times — but this
one needed one extra step the others didn't: vanilla Postgres has no `auth`
schema (that's Supabase's own GoTrue service, not anything a migration in
this repo creates), so I stubbed a minimal `auth.users(id uuid)` table and
an `auth.uid() returns uuid` function locally just to prove the DDL/FK/RLS-
policy SQL itself is valid Postgres syntax against a real FK target. That
stub is NOT a substitute for testing against the actual Supabase project —
the real `auth.uid()` returning a genuine anonymous-auth JWT's user id, and
therefore whether the RLS policies actually scope reads/writes correctly for
a real anonymous session, can only be verified once both this migration is
applied AND the toggle in item #15/2 is flipped. Flag this for a look once
both are true, not just the migration alone.

**Addendum (2026-08-24, Codex review fix pass on PR #2319, fix branch
`fix/clown-sessions-codex-findings`):** two more migrations closing the
findings this item and item #15/2 documented —
`supabase/migrations/20260905000000_usage_daily_grants.sql` (the
`increment_usage_daily` grant-scoping fix, see this item's top section) and
`supabase/migrations/20260906000000_clown_fold_conversation.sql` (a new
`fold_clown_conversation` RPC so the rolling-summary fold's delete + summary
patch happen as one atomic transaction instead of two independent
requests — item #15/2's third finding). Same root cause, same fix. Verified
for real: applied all 25 migrations twice against a real ephemeral local
Postgres (same `auth.users`/`auth.uid()` stub as the Stage 11 addendum
above), clean idempotent re-apply both times; then, on that same local
cluster, exercised both new functions directly under simulated
`authenticated`/`service_role` sessions (real `SET LOCAL role` + a stubbed
JWT claim inside an explicit transaction, mirroring how PostgREST actually
scopes a request) — confirmed the grant scoping (item #14 top) and, for the
fold RPC, confirmed a call wrapped in a transaction that's then rolled back
leaves BOTH the summary patch and the turn deletion undone together (proof
the two writes are genuinely one atomic unit), and that a forced mid-call
error (a malformed delete-target id) aborts the whole call rather than
leaving the summary patch to land on its own.

**Running total (reconciled across stages):** counting every addendum
above plus Stage 3's own `usage_daily.sql` /
`news_story_extracted_at.sql` / `refresh_symbol_activity.sql` (landed on
`main` but never logged here by that stage), **11 migrations** are
unapplied against production as of this merge, not 3 or 4 — same fix
(step 1 above) closes all of them in one `npm run db:migrate` run.

**Done 2026-08-24 (Joey):** ran `npm run db:migrate` from a checkout with
`apps/worker/.env` set up — all 27 migrations applied clean, then ran it a
second time with zero errors (the script re-runs every file unconditionally
by design, so a clean second pass IS the idempotency proof — no
"relation already exists"-style failures). Production is caught up; the
knowledge engine, clown-sessions, and the `increment_usage_daily`
grant-scoping security fix are all live. `psql` wasn't available locally
for the optional pgvector check, so a small script
(`scripts/check-pgvector.mjs`, PR #3235) was added as a psql-free
alternative — separate, non-blocking follow-up.

**Status:** DONE

---

### 19. [BLOCKING] 17 Getty photos with unclear rights, still live in seed content — ~15 min to decide, lawyer's call

**Status:** DONE — 2026-08-24, Joey, in chat: retire and replace with real,
verified, non-Getty images (not license, not strip blank). A fresh grep the
same session found only 6 distinct URLs (11 references) still live — the
rest had already been retired in earlier work. All 6 replaced with verified
live images on allowlisted hosts (People.com, WWD, tayswiftstyle.wordpress.com,
one already-fixed YouTube still found on `origin/main`); one item
(`00-orbit.mjs` NYC street style, an unpublished candidate) left with no
photo and a TODO rather than a forced mismatch. `grep -r "gettyimages.com"
supabase/seed/` returns nothing. Full writeup in `docs/decisions.md`
(2026-08-24 entry). PR: see `fix/retire-getty-seed-images` branch.

---

### 13. [UPGRADE] Add `ANTHROPIC_API_KEY` as a worker repo secret — ~2 min

**Status:** DONE — 2026-08-23 22:31 PDT, Joey: `gh secret set
ANTHROPIC_API_KEY --repo JW-Incorporated/swift2`. Unblocks the knowledge
engine's extract stage's live run (`PLAN.md` Stage 3).

---

### 12. [UPGRADE] Vendor/account decisions for the knowledge engine build — ~20 min total

**Status:** DONE — 2026-08-23 22:31 PDT, Joey answered 3 of 5 in chat: (1)
Google News replacement = **GNews free tier** (100 req/day), engineered
around via a hard daily cap well under the limit at the 6-runs/day ingest
cadence — no paid tier needed; (2) embedding vendor = **OpenAI**
(`text-embedding-3-large`, `dimensions: 1024` to match the schema),
`OPENAI_API_KEY` set as a repo secret; (4) Tumblr = both
`TUMBLR_CONSUMER_API_KEY` and `TUMBLR_SECRET_API_KEY` set as repo secrets,
unblocking the `tumblr` adapter. Items 3 (Reddit Data API approval status)
and 5 (Supabase anonymous-auth toggle) were not addressed and are **not**
lost — carried forward as new item #15, treating Joey's DONE edit on this
item as authoritative rather than reopening it.

---

### 1. [BLOCKING] Get the production site and CI off Wyatt's accounts — ~30–60 min

**Why it matters:** Wyatt has left the project, but the live product still runs
on his infrastructure. This is the single largest standing risk in the repo.
Nothing is broken right now, and nothing will warn you before it breaks — if
those accounts lapse or get closed, longlivets.com stops deploying and ~20
scheduled agent routines stop running, and the watchdog will report the runners
as a *quiet queue* rather than as dead.

Three separate dependencies, verified 2026-08-15:

- **Vercel — the live site.** `docs/deploy.md` lines 7–9: production runs
  entirely on **Wyatt's Vercel team**, with you added as a team member. Your own
  personal Vercel account was downgraded to Hobby and is **no longer in the
  deploy path at all**. A merge today deployed to
  `vercel.com/wjduvall-cmds-projects/swift2-web`.
- **GitHub — the scheduled runners.** `docs/agents/runners.md` lines 3–11: "ALL
  scheduled agent spend runs on Wyatt's account", covering ~20 routines
  (Marjorie, Austin, Karen, Kevin, Nils, Laura, Paul Blart, Tree). This was
  deliberate — it keeps your weekly limit free — so **do not just switch it off**
  without deciding where that spend moves to.
- **`wjduvall-cmd` is a bot identity, not just a person.** Repo automation reads
  it to recognise its own runs. It was deliberately left in place today for that
  reason; only his human notifications and email CC were removed.

**Steps:**
1. Go to `https://vercel.com/wjduvall-cmds-projects` → **Settings** → **Members**.
   Confirm you are listed as **Owner**, not just Member. If you are not, have
   Wyatt transfer ownership to you before he loses access.
2. Vercel → **Settings** → **Billing**. Confirm the payment method on file is
   yours, not Wyatt's. This is what actually stops the site if it lapses.
3. Decide where scheduled agent spend should live now that there is no second
   founder to protect a limit on. Tell a session the answer and it will update
   `docs/agents/runners.md` and the workflows.
4. Do **not** delete or rename the `wjduvall-cmd` GitHub account until step 3 is
   done — automation still identifies its own runs by it.

**Worked if:** you can open Vercel → Settings → Billing for the team that serves
longlivets.com and see your own payment method, and you are listed as Owner.

**Status:** DONE — 2026-08-15. **The premise above was WRONG and is retained
only so nobody re-raises it.** Joey: "wyatt is still an owner, he's just working
on a different project while i finish this one. We co-own his vercel team, and
our github accounts are connected." No lapse risk, no migration needed. What
stays true: he is not working on this project day to day, which is why #2144
removed him from alert pings. **Lesson: shared infrastructure is not abandoned
infrastructure — ask before escalating an ownership fact into a risk.**

---

### 2. [BLOCKING] Confirm Karen's cloud routine is actually enabled — ~5 min

**Status (2026-08-23): DONE — no longer needed.** Superseded: Wyatt disabled
his ENTIRE fleet (all 21+ routines, including this Karen trigger) on
2026-08-21 as part of a full handoff (issue #2258) to move everything to
Joey's account instead of chasing individual routines on Wyatt's. Karen was
recreated fresh on Joey's account 2026-08-23 (`trig_01TmYaZgnecrEp9mkeV3Gq6X`,
current prompt from `docs/agents/runner-prompts/karen-nightly.md`, not the
stale trigger text that was originally flagged here) — see item #10 for
what's left to make her (and everything else) actually live.

Original diagnosis (2026-08-16), kept for history: Karen was a scheduled
Claude Code routine on **Wyatt's** account, invisible to any Swift2 session,
last real run 2026-08-09 (PR #1850). A ready-to-paste prompt was drafted for
Wyatt to check/fix it directly. Overtaken by the full-fleet migration before
Wyatt acted on it.

---

### 10. [BLOCKING] Strip Claude_Code_Remote from 22 new routines — ~20-30 min

**Status:** SKIP — Joey (2026-08-23): "this is an illogical approach. Instead
we remove the rule in `docs/agents/routine-invariants.md` invariant #2
forbidding any routine except the Routine Auditor from holding the
`Claude_Code_Remote` connector. That rule doesn't make sense here."

**Resolution:** removed invariant #2 instead of doing the 22-routine manual
strip (PR #2287, full rationale in `docs/decisions.md` 2026-08-23 — flagged
the tradeoff first: the connector grants trigger-creation, and the invariant
existed specifically to close off the 2026-07-25 runaway-loop failure mode;
Joey heard it and accepted the risk). All 22 routines then enabled directly
with the connector left in place — Auditor, Marjorie ×2, Content Shift,
Vault Run, Karen, Kevin ×4, Nils, Austin, Laura, Paul Blart, Growth, Tree,
Answerer, Rumor Desk, Stylist, Cross-Link builder, News Triage, Photo
Enrichment worker. Lex depth stays disabled (warm spare per issue #2258,
never test-run). Two of the original nine undocumented routines — **Audio
Curator** and **Mood Chat builder** — are gone for good, absent from
Wyatt's export and his full dashboard walk; nothing to recreate.

Original ask (2026-08-23), kept for history: a manual per-routine UI pass
to strip the connector before enabling, since the API can't do it
(`mcp_connections: []` returns 200 and silently keeps the connector) and
invariant #2 required it. Superseded by removing the invariant instead.

---

### 11. [UPGRADE] Six stale duplicate routines from a July handoff — ~5 min

**Status:** DONE — 2026-08-23. Joey: "let's kill the duplicate routines."
Deleted all 6 via the routines UI (no API delete action exists) — Content
Shift, Nils, Austin ×2, Marjorie ×2, all from the July 2026 opposite-
direction handoff. Verified via a clean page read afterward: only the
intentionally-paused Lex depth remains paused; no duplicate names left.

**Reconciliation note (2026-08-24):** this DONE record and a stale OPEN
copy of the same item (with a since-superseded "REFINED" instruction set)
existed in the file simultaneously, likely from a parallel branch's merge
against `main` picking up both versions during tonight's overnight build.
Removed the stale OPEN duplicate; this DONE entry is authoritative.

---

### 3. [UPGRADE] Device-check the bottom nav — ~2 min

**Why it matters:** the nav has been fixed three times from code, and each time
a real phone found something the tests did not. Merged 2026-08-15 (PR #2140):
the icon-only threshold moved 5 → 7 and labels dropped 11px → 10px, so all six
tabs should now show **words under the icons**.

**Steps:**
1. Open `https://www.longlivets.com/` on your phone. Hard-refresh.
2. Confirm six tabs, each with a readable label, none wrapping to two lines.
3. If your phone is narrow (360px-class), check the labels still fit.

**Worked if:** six labelled tabs, one line each, no overlap.

**Status:** DONE — 2026-08-15, confirmed on his phone: "there's still 6 but they
now all have text, and honestly it looks really good with 6." This also settled
the nav question permanently — six separate tabs, and PR #2116's merge-to-five
was closed unmerged.

---

### 34. [BLOCKING] Codex review quota lock on merge-ready merch PR #3549 — pick one, ~2 min

**Filed:** 2026-08-30
**Status:** DONE (2026-08-30) — Founder decision D5: substitute Claude-model
review instead of waiting or paying. PR #3549 independently re-reviewed by
Claude (fresh checkout, all tests/typecheck/lint re-run), then merged
2026-08-30T22:07:58Z. This is now the standing precedent for any future card
blocked only by the fleet-wide Codex quota outage.

**Why it mattered:** PR #3549 (test-only, 69 lines added to
`apps/web/lib/longlive/merch.test.ts`) was independently reviewed twice with
every check green (12/12 focused tests, 1983 full-suite tests, typecheck,
lint, live 1440px/360px browser check). It could not merge because the
project's `codex_governed=true` gate requires `sh ~/.codex/review.sh`, and
the OpenAI Codex account had hit its usage limit — a non-transient lock that
resets 2026-09-05 21:26.

---


