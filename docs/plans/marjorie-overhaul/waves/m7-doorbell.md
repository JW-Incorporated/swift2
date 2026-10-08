# Wave M7 — The doorbell (founder messages picked up in seconds)

Paste everything below this line into a fresh **Opus** session (`/model opus`) in Swift2.

**Prerequisites:**
- M5 merged (done 09-13).
- HA #72, #73 and #74 are done: Joey created the Long Live Doorbell bot, limited it to the two channels, and created the `longlive-doorbell-dispatch` key. #74 closed 09-13. Tasks 1–4 can be built before #72/#73 close; the live proof cannot.
- **Not gated on the 2026-09-14 Monday L1 cycle** (nothing here touches L1). M6 also edits the chat routines, so if an M6 build is open at the same time, land one first and rebase the other.

The spec is already written; this session builds and proves it.

---

You are executing Wave M7 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180): the doorbell, spec `docs/specs/marjorie-overhaul/m7-doorbell.md`. Read it in full first; it is the contract. If the build must deviate, amend the spec in the same PR and say why in one line.

Also read:
- `docs/specs/marjorie-overhaul/m5-chat.md` (Mechanics 1–3) and `m7-clock.md` (the clock, decided 2026-09-14)
- `scripts/marjorie/chat-poll.mjs`, `lib/chat-inbox.mjs`, `lib/chat-delivery.mjs`, `lib/discord-bot.mjs`
- `.github/workflows/routine-marjorie-chat.yml`, `routine-tree-chat.yml`, `bot-chat-poll.yml`
- `scripts/watchdog/upsert-alert.sh`, `.github/workflows/routine-marjorie-ops.yml`
- the `docs/decisions.md` entry "A doorbell on the home server picks up founder messages in seconds"

**Hard rules carried in:**
- The M1 list (`waves/m1-comms.md`).
- **Tokens live only on the Hermes VM host**, in `/etc/longlive-doorbell.env`. Never in the repo, an Actions secret, chat, Discord or a file you write. Never ask Joey to paste one; the install HA tells him where to put them.
- `DISCORD_BOT_TOKEN` and every webhook URL live only in `run:` steps under `environment: social`/`ops`; no agent job holds one (the PR diff and a workflow text test are the proof).
- **The doorbell never posts:** no message, no reply, no ✅/❌, and it never reacts to a bot or webhook message. Approvals stay reaction-only; nothing touches `social/queue/` or the approval poll.
- **The repo is PUBLIC:** no founder text in issues, alerts, comments, PRs, logs or artifacts.
- **`gh secret` / `gh variable` are guard-denied,** so `DOORBELL_LIVE` is a committed constant flipped by PR, not a repo variable.
- **Do not touch L1:** `tree-weekly-plan.md`, `weekly-brief.mjs`, `assemble-brief.mjs`, `loop-asks.mjs`.
- **Codex review** on the PR that adds `bot-chat-alarm.yml` and the one that changes `chat-poll.mjs`:
  - `codex:rescue --background`, results via `codex-companion.mjs result <id>`;
  - or `codex exec -s read-only` if the forwarder fails;
  - max two rounds, then the debug ladder.

**Carried in from M5 (2026-09-13):**
- **Dispatch identity:** a run dispatched by another workflow's `GITHUB_TOKEN` has the `github-actions` bot as its actor. Runs the doorbell starts (a founder's fine-grained key) have a human actor instead; the chat routines accept both.
- **GitHub starts no workflow from events a `GITHUB_TOKEN` created.** Dispatch explicitly.
- **Concurrency:** a GitHub concurrency group keeps one pending run and cancels the older pending one. The chat routines' per-message group plus `context`'s ✅/❌ stop is what makes a duplicate dispatch harmless; keep both.
- **Gate agent and webhook jobs on `github.run_attempt == '1'`.**
- **Cron:** GitHub cron can stall for hours; dispatch is push and unaffected.
- **Commit and push often:** the Temp directory was wiped mid-session once, so commit WIP after every green step.
- **Tests and lint:** in a junctioned worktree, run vitest with a scratch config that has no repo `globalSetup`, and always run `npm run lint` before pushing.
- **Scratch files:** the guard denies `rm -f`; write them under the gitignored `.scratch/` and leave them.
- **Worktree:** work in one outside `Documents\Claude\Projects\`.

## Tasks (in order; one PR each unless trivially coupled)

1. **The doorbell.**
   - `scripts/doorbell/lib/doorbell-core.mjs`, pure: channel and thread resolution state, the ring predicate (import `isFounderMessage`/`founderIds`/`BOTS` from `lib/chat-inbox.mjs`), the dispatch request body, the timer decision, config parsing.
   - `scripts/doorbell/doorbell.mjs`, thin gateway loop: identify, heartbeat, resume, capped backoff, `ready` log line.
   - `--check` mode: loads config and exits, without connecting.
   - `longlive-doorbell.service`.
   - Tests: ring predicate cases, dispatch body, timer, the no-POST-to-messages text test, the import-graph test. Use no real network, and inject `fetch` and `WebSocket`.
2. **Poll and context.**
   - `context` adds 👀 as its first write.
   - The poll's doorbell watch behind `DOORBELL_LIVE = false`.
   - A helper for someone else's 👀.
   - Tests for every branch of spec Mechanics 5.
3. **The alarm.**
   - `bot-chat-alarm.yml` (`check` → `alert`) and `scripts/marjorie/chat-alarm.mjs`: titles, bodies, stuck re-check.
   - `finish` gains `replied in <n>s`.
   - Workflow text tests; a live `dry_run` of the alarm against one replied message.
4. **Docs and install HA.**
   - Docs:
     - `docs/ops/doorbell.md`: install, update, stop, logs, key expiry 2027-09-13;
     - the `m5-chat.md` amendment note;
     - `MAP.md` rows;
     - `checkpoints.json`: MR2 gains "doorbell rang for ≥1 real message in each channel", plus a 2027-08-13 key renewal check.
   - Tag the release commit (`doorbell-v1`).
   - File the install HA in v2 format, numbered with `node scripts/marjorie/lib/alert-router.mjs next-ha-number`, by PR with auto-merge. Its literal steps follow spec Mechanics 9 and pin `doorbell-v1`. Its final step: `sudo systemctl stop longlive-doorbell`, post a test message and wait for the reply, then `sudo systemctl start longlive-doorbell` (the fallback proof).
4b. **The clock** (spec Pieces 4 and `docs/specs/marjorie-overhaul/m7-clock.md`; Joey's decision 2026-09-14 on #4290: "yes, let's run the clock on the server").
   - `scripts/doorbell/schedule.json` seeded from every workflow's own `cron:` (53 on 09-14), and the test that keeps them equal.
   - `scripts/doorbell/lib/clock-core.mjs`: due rows, skip when a run already exists in the window (any trigger), retry then give up at 10 minutes. The doorbell loop evaluates it once a minute; `--check` prints the next 10 fires.
   - `grep -n "event_name" .github/workflows/*.yml`: any step that treats `schedule` specially must treat a clock dispatch the same; list each change in the PR.
   - The alarm gains `stage=clock-silent`; the poll dispatches it when the newest clock-started poll run is older than 20 minutes and `CLOCK_LIVE` is on.
   - `CLOCK_LIVE = false` until the live proof. The GitHub `schedule:` triggers stay in every workflow; the clock adds runs, never removes any.
   - Codex review on this PR too (it dispatches every routine).
5. **Live proof** (after Joey says the install HA is done).
   - Ask Joey (YOU:) to post one message in each channel. Record 👀 time, run actor, reply and message-to-✅ time.
   - Then flip `DOORBELL_LIVE = true` by PR, and run the fallback proof: service stopped → poll answers + "Doorbell is not answering" alert → service restarted → rings again.
   - Flip `CLOCK_LIVE = true` by PR, then watch one hour: `bot-chat-poll.yml` starts within 2 minutes of every 5-minute slot and `routine-marjorie-ops.yml` at its slot, all `workflow_dispatch` by the key's owner, none doubled. Then a `dry_run` `clock-silent` alarm.
   - Evidence (run URLs, timings, alert issue) on #4180, and close #4290 with the hour's run list.

## Done means

- A founder message in each channel got 👀 from Long Live Doorbell within 5 s and one reply with ✅, and the times are on #4180.
- With the doorbell stopped, the poll answered and the alert posted in `#longlive-marjorie`.
- The clock started the 5-minute poll and the hourly ops routine on time for one hour with no doubled runs, and #4290 is closed with that evidence.
- No duplicate replies.
- No token anywhere but the host.
- Unit tests are green and lint has 0 errors.
- Codex review is clean within two rounds.
- Tick M7 on #4180 and in `PLAN.md`, update `STATE.md`, stop.
