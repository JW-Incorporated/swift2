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
- Marjorie's charter forbids self-edits; the amendment lands by founder-
  approved PR in Wave M0.
- Files under 300 lines; `watchdog.yml` is already ~1,100 lines and gets
  smaller, never bigger: new logic goes in `scripts/watchdog/lib/` or
  `scripts/marjorie/lib/`.

## Waves

| Wave | Session model | Depends on | Time | Output |
|---|---|---|---|---|
| M0 · Plan committed, recheck routine live | (done in the assessing session) | — | 1h | this dir, `plan-recheck-marjorie.yml`, #4180 |
| M0 · Design | **Opus** (`/model opus`), Fable read-only review | HA #66 filed | 2–3h | `docs/specs/marjorie-overhaul/*.md`, charter amendment PR, decisions |
| M1 · Comms | **Sonnet**, up to 4 executors | M0 approved, HA #66 done | 1 day | Discord delivery module, rebuilt brief, email retired, alerts in-channel |
| M2 · Watchdog handling | **Sonnet**, Codex review on anything that dispatches workflows | M1 merged | 1 day | `routine-marjorie-ops.yml`, alert handlers, FB-export human action |
| M3 · Submissions triage | **Sonnet** | M1 merged | 1 day | intake classifier routine, build-desk dispatch, founder branch |
| M4 · Tree/Marjorie loop | **Opus** (touches Tree's prompts) | Tree R2 reported (2026-09-21), M1 merged | half day | brief sections both ways, ask→issue mechanics |
| MR1–MR2 · Rechecks | **Opus** routine | dates in `checkpoints.json` | 20 min | comment on #4180 + PR |

M2 and M3 are independent; run in either order, never in one checkout.

## Item map

| Item | What the founder sees | Where |
|---|---|---|
| C1 delivery | Marjorie posts in `#longlive-marjorie` as "Marjorie" | `scripts/marjorie/lib/discord.mjs`, env `ops`, `DISCORD_MARJORIE_WEBHOOK_URL` |
| C2 brief | One morning message: yesterday, today, waiting-on-you (open human actions by number), alerts, Tree's line, distance to done against the real Definition of Done | `scripts/marjorie/assemble-brief.mjs` rebuilt, `routine-marjorie-brief.yml`, `brief-mailer.yml` retired |
| C3 email off | `send-mail.py` called only by `production-backup.yml` and the webhook-failure fallback | `brief-mailer.yml`, `watchdog.yml`, `tree-mail.yml`, `social-poster.yml`, `marjorie-inbox.yml` |
| W1 alerts | Every watchdog alert appears in-channel with what Marjorie did about it | `scripts/watchdog/upsert-alert.sh` gains a Discord leg |
| W2 handler | A quiet routine gets re-dispatched; a stuck PR gets a nudge; the FB export becomes HA with literal steps | `routine-marjorie-ops.yml`, `docs/agents/runner-prompts/marjorie-ops.md` |
| S1 triage | A site submission becomes either a build-desk issue with acceptance criteria or a founder question in-channel | `routine-marjorie-triage.yml`, labels |
| L1 loop | "Needs from Marjorie" in Tree's Monday brief; "For Tree" in Marjorie's brief; both become issues | `tree-weekly-plan.md`, `marjorie-brief.md`, `social/lessons.md` read-only |

## Gates

**M0 done:** specs merged; charter amendment PR merged with the founder's
approval comment; each spec has Behavior / Data / Mechanics / Acceptance
criteria / Files affected / Open questions; decisions logged; HA #66 status
known.

**M1 done:** a real scheduled run posted the brief to `#longlive-marjorie`;
`git grep send-mail.py .github/workflows` returns only `production-backup.yml`
and the fallback step; `marjorie-inbox.yml` deleted; a forced watchdog alert
appeared in-channel; no founder received a bot email that day.

**M2 done:** a synthetic quiet-routine alert was resolved by a real
`routine-marjorie-ops` run (dispatch + close + in-channel line); the FB export
human action exists with steps a non-coder can follow; `watchdog.yml` is
shorter than before.

**M3 done:** a synthetic feedback issue was classified and dispatched with
acceptance criteria; a second one needing a founder was posted in-channel
with a recommendation; nothing was auto-closed.

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

## Non-negotiables carried into every wave prompt

No `git restore`/`reset --hard`/`clean`; never run `post-queue.mjs` or
`delete-media.mjs`; never hand-write an `approval` object; never merge a
`social/queue/**.json` PR; never post to `#longlive-tree` or `#longlive` from
Marjorie; never post to `#human-action-*`; `gh secret`/`gh variable` are
human-only; you confirm real CI before merging; "auto-merge armed" is not
"merged", check PR state before reporting; files under 300 lines; MAP.md row
for every new file.
