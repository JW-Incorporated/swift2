# Marjorie Overhaul — plan of record

Epic: #4180. Sibling to the Tree Overhaul (#4117). Source: the founder's
2026-09-12 brief in chat plus three read-only research passes over
`docs/agents/marjorie.md`, `watchdog.yml`, the mail path, and the Hermes OS
contract (answers from the Hermes session, recorded on #4180).

**Goal state.** Marjorie is the accountable site-ops manager. Tree owns
social; Marjorie owns everything else the founders would otherwise notice:
content keeps flowing, the site is not broken, routines stay alive, user
submissions become real work, and the founders hear one daily brief that
knows everything. She never writes product code or content; she diagnoses
and dispatches (GitHub issues to the build desk, human actions for what only
a founder can do) and she is accountable for the outcome, not the ticket.
Every message from her lands in `#longlive-marjorie`. No bot emails a
founder except the production-backup receipt and a mechanical fallback
when a Discord call fails.

**Posture.** Same as Tree's: build the full end state, observe only what
needs real run data. One fresh session per wave, paste-ready prompts in
`waves/`. Never a Marjorie wave and a Tree wave in the same checkout.

## Constraints settled before Wave 0 (do not re-litigate)

- Channel roles: `docs/decisions.md` 2026-09-12 "Three Discord channels, one
  job each". `#longlive-tree` stays reaction-pure; `#longlive` never gets an
  unprompted routine post.
- Human actions from a routine: write a v2 item to `HUMAN-ACTIONS.md` in a
  PR; the Hermes VM poller turns anything on `main` into a card in
  `#human-action-1` within 10 minutes. Never post to `#human-action-*`.
- Kanban: no API, ops bridge does not allowlist `create`. A routine cannot
  touch a card. Do not design around Kanban.
- Discord from Actions: REST with a webhook or bot token held in a repo
  environment. Agent processes never see `DISCORD_BOT_TOKEN` (standing rule
  from `routine-tree-weekly-plan.yml`); a poller job that reads replies may.
- Marjorie's charter forbids *self*-edits (invariant 5). The amendment
  lands as an ordinary PR in Wave M0 — green CI, merged by whoever opened
  it, no separate founder comment (2026-09-12, Joey).
- Files under 300 lines; `watchdog.yml` is already ~1,100 lines and gets
  smaller, never bigger: new logic goes in `scripts/watchdog/lib/` or
  `scripts/marjorie/lib/`.

## Waves

| Wave | Session model | Depends on | Time | Output |
|---|---|---|---|---|
| M0 · Plan committed, recheck routine live ✓ 09-12 | (done in the assessing session) | — | 1h | this dir, `plan-recheck-marjorie.yml`, #4180 |
| M0 · Design ✓ 09-12 (#4184, #4183, #4185) | **Opus** (`/model opus`), Fable read-only review | HA #66 filed | 2–3h | `docs/specs/marjorie-overhaul/*.md`, charter amendment PR, decisions |
| M1 · Comms ✓ 09-12 | **Sonnet**, up to 4 executors | M0 merged, HA #66 done, PR #4047 reconciled first (`waves/m1-comms.md` Step 0) | 1 day | Discord delivery module, rebuilt brief, email retired, alerts in-channel — social-poster's own alert deferred to PR #4202/HA #68 (social-posting-freeze CI gate, human-only) |
| M2 · Watchdog handling ✓ 09-12 (#4216, #4217, #4221, #4224, #4225) | **Sonnet**, Codex review on anything that dispatches workflows | M1 merged | 1 day | `routine-marjorie-ops.yml`, alert handlers, FB-export human action, **the reply poller** (moved from M4 — no Tree dependency) |
| M3 · Submissions triage ✓ 09-13 (#4228, #4229, #4237, #4238) | **Sonnet** | M1 merged | 1 day | intake classifier routine, build-desk dispatch, founder branch |
| M4 · Tree/Marjorie loop | **Opus** (touches Tree's prompts) | Tree R2 reported (2026-09-21), M1 + M2 merged | half day | L1 spec, brief sections both ways, ask→issue mechanics |
| MR1–MR2 · Rechecks | **Opus** routine | dates in `checkpoints.json` | 20 min | comment on #4180 + PR |

M2 and M3 are independent; run in either order, never in one checkout.

## Item map

| Item | What the founder sees | Where |
|---|---|---|
| C1 delivery | Marjorie posts in `#longlive-marjorie` as "Marjorie" | `scripts/marjorie/lib/discord.mjs`, env `ops`, `DISCORD_MARJORIE_WEBHOOK_URL` |
| C2 brief | One morning message: yesterday, today, waiting-on-you (open human actions by number), alerts, Tree's line, distance to done against the real Definition of Done | `scripts/marjorie/assemble-brief.mjs` rebuilt, `routine-marjorie-brief.yml`, `brief-mailer.yml` retired |
| C3 email off | `send-mail.py` reachable only through `upsert-alert.sh`'s `ALERT_ALSO_MAIL` opt-in (used by `production-backup.yml`) and the webhook-failure fallback | `brief-mailer.yml`, `watchdog.yml`, `tree-mail.yml`, `social-poster.yml`, `marjorie-inbox.yml` |
| W1 alerts | Every watchdog alert appears in-channel with what Marjorie did about it | `scripts/watchdog/upsert-alert.sh` gains a Discord leg |
| W2 handler | A quiet routine gets re-dispatched; a stuck PR gets a nudge; the FB export becomes HA with literal steps | `routine-marjorie-ops.yml`, `docs/agents/runner-prompts/marjorie-ops.md` |
| S1 triage | A site submission becomes either a build-desk issue with acceptance criteria or a founder question in-channel | `routine-marjorie-triage.yml`, labels |
| L1 loop | "Needs from Marjorie" in Tree's Monday brief; "For Tree" in Marjorie's brief; both become issues | `tree-weekly-plan.md`, `marjorie-brief.md`, `social/lessons.md` read-only |

## Gates

**M0 done:** specs merged; charter amendment PR merged on green CI; each spec has Behavior / Data / Mechanics / Acceptance
criteria / Files affected / Open questions; decisions logged; HA #66 status
known.

**M1 done:** a real scheduled run posted the brief to `#longlive-marjorie`;
`git grep send-mail.py` over workflows and `upsert-alert.sh` shows only the
`ALERT_ALSO_MAIL` opt-in tail and the `post-or-mail.mjs` fallback; `marjorie-inbox.yml` deleted; a forced watchdog alert
appeared in-channel; no founder received a bot email that day.

**M2 done ✓ 09-12, with one honest caveat.** Proven against real alerts
(#4009, #4129), not just synthetic ones: `routine-marjorie-ops.yml` ran
for real multiple times (runs `34728233315`→`34731784616`), diagnosed
both, filed the FB-export HUMAN-ACTIONS.md item (#70, PR #4222) with the
spec's literal text, and correctly recognizes its own prior work on
later sweeps (0 duplicate comments, 7 turns on a clean re-run vs. 65 on
first real contact). `watchdog.yml` shrank 1190→1083 lines.
**Caveat, not silently closed:** neither alert has actually CLOSED yet —
#4009 needs the founder's own browser/upload work (HA #70, by design,
not automatable); #4129's `gh workflow run` redispatch 403s under the
routine's current GitHub App installation token (tracked in **#4223**,
likely needs an `actions:write` grant on the App installation — a
founder/admin action, not a code fix). Until #4223 resolves, 7 of the 14
handler rows (every row whose "may do" is a redispatch) are diagnosis-only
in practice. Three iterations were needed to get the routine's own
duplicate-work-detection actually correct (**#4216** hardcoded a wrong
identity, **#4224** live-queried a wrong identity via the wrong endpoint,
**#4225** finally used GitHub's `viewerDidAuthor` field instead of any
identity string at all) — full trail on #4180. Also found and fixed: the
first live run hit `error_max_turns` with zero progress (**#4221**,
30→60 turns + "finish one alert before starting the next" prompt
guidance). Open non-blocking follow-ups: **#4218** (does `allowedTools`
actually restrict tool availability, or only preapprove?), **#4219**
(a permanent handled-marker can suppress a NEW target added later to an
aggregate alert), **#4226** (a failed upstream `gh issue view` looks
identical to a genuinely empty ledger).

**M3 done ✓ 09-13 (#4228, #4229, #4237, #4238).** Proven with three real
synthetic `[Feedback]` issues, not just code review: a live
`routine-marjorie-triage.yml` dispatch (run `34735870892`) classified a bug
report (#4233) and filed a build-desk issue with acceptance criteria and
the verbatim quote (#4236); classified a pricing request as needs-founder
(#4234, `founder-decision` label, audit comment + handoff message); closed
a `<script>alert(1)</script>` submission as spam with a comment (#4235,
the only class auto-closed, per spec). All three synthetic originals and
the filed build-desk issue were closed afterward as test fixtures — see
#4180 closeout comment.
**Caveat, not silently closed:** the first live run exposed a real bug the
code review missed — the needs-founder → Discord handoff never actually
fired. `pendingFounderIssues`'s trust check used `viewerDidAuthor`, which
is relative to whichever credential runs the query; the `run` job's agent
comments (authored as `claude`) and the `deliver` job's read of them
(under `secrets.GITHUB_TOKEN`) are different credentials in different
jobs, so it was always `false` — confirmed live on #4234 before the fix.
Fixed in #4238 (two Codex rounds: round 1 caught the original bug, the
first fix attempt introduced a second one — reusing the `pending` marker's
trust allowlist for the `posted` marker, which `deliver` never authors as
`claude`, would have reposted every needs-founder handoff to Discord on
every sweep forever; round 2 confirmed the corrected asymmetric check).
Re-ran the live dispatch (run `34736610727`) after the fix: `deliver`
posted to `#longlive-marjorie` for real (`delivered: discord`, message id
`1548542716592521289`). Four non-blocking follow-ups filed from residual
Codex findings, none touching the core five-class path: #4230 (comment-
list truncation in override discovery), #4231 (override-boundary edge
case), #4232 (reconciliation one-way ratchet), #4239 (the `deliver` job's
50-issue cap on open `founder-decision` issues).

**M4 done:** one Monday cycle where Tree asked for something and Marjorie's
next brief carried the issue number, and vice versa.

## Why M4 waits for Tree R2

Tree's plan is measuring its first closed-loop week (R2, 2026-09-21). M4
edits Tree's Monday prompt. Changing the instrument mid-measurement makes
R2 unreadable. M4 starts the day after R2 reports.

## Observation checkpoints (automated)

`checkpoints.json`, run by `plan-recheck-marjorie.yml`. MR1 at +7 days after
M1 merges (brief cadence, zero bot emails, alert leg working). MR2 at +21
days (handler resolved a real alert, triage handled a real submission, the
loop produced an issue). Dates are set by the M1 session when it merges.

## M0 findings that bind M1 (verified in source 2026-09-12; details on #4180)

1. **PR #4047 already implements most of C1/C2's delivery layer** (open since
   09-09, `CONFLICTING`, repo-level secret, wrong channel, built on
   `brief-mailer.yml`). M1 lifts its logic and tests, keeps C1's
   environment-scoped two-job shape, and closes or rebases it — before any
   Discord code. Its human gate (HA #50) was closed without the secret ever
   existing; a closed human action is not proof.
2. `routine-template.yml` has no `environment:` input → M1's first task.
3. `upsert-alert.sh` has six callers; each needs `environment: ops` or it
   silently keeps mailing.
4. Watchdog is hourly and re-opens standing alerts → post on state change only.
5. The Gmail secrets stay (`community-inbox.yml` reads them over IMAP).
6. The brief scores `docs/definition-of-done.md`'s eight product items.
7. The `intake` label has three producers → select by title prefix in code.
8. `founder-decision` is **not** a live label; M3 creates it.

## Non-negotiables carried into every wave prompt

No `git restore`/`reset --hard`/`clean`; never run `post-queue.mjs` or
`delete-media.mjs`; never hand-write an `approval` object; never merge a
`social/queue/**.json` PR; never post to `#longlive-tree` or `#longlive` from
Marjorie; never post to `#human-action-*`; `gh secret`/`gh variable` are
human-only; you confirm real CI before merging; "auto-merge armed" is not
"merged", check PR state before reporting; files under 300 lines; MAP.md row
for every new file.
