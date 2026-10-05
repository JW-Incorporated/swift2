# Long Live Doorbell — operations

The doorbell is the one small program the Marjorie Overhaul runs off GitHub
(M7; spec `docs/specs/marjorie-overhaul/m7-doorbell.md`).

- A founder message in `#longlive-marjorie` or `#longlive-tree` gets 👀
  within a second, and its chat routine starts at once.
- Six minutes later, if no ✅ or ❌ has arrived, it adds ⚠️ and starts
  `bot-chat-alarm.yml`.

It never posts in Discord and never adds ✅ or ❌. While it is down, the
5-minute poll still answers.

The routines' clock (`m7-clock.md`, #4290) is **not** in `doorbell-v1`. It
was introduced by `doorbell-v2` after HA #76; the current tag is `doorbell-v3`.

## Clock v3 (installed; noon delivery proof pending)

`doorbell-v2` adds exactly two pinned schedule rows: `bot-chat-poll.yml`
every five minutes and `routine-marjorie-brief.yml` at 12:00 UTC. GitHub's
schedule triggers remain. A new row or changed cadence requires a reviewed
tag and a founder decision; the service never downloads a replacement table.

Installed tag: `doorbell-v3` at `7c89af5b` (PR #4377), deployed on
2026-09-15T14:44:01Z with a clean checkout, active service and zero restarts.
The v3 change prevents cumulative request-latency drift: after a successful
coverage GET, it can wait up to 15 seconds for the same row's physical
five-minute attempt gap, then recheck slot, live state and response freshness
before dispatch. Longer gaps still skip. Stop cancels the pending wait.
The 62 clock tests include 240 slots with varying GET latency over 20 hours.
The v3 hour proof passed all twelve owner dispatches at 14:45-15:40 UTC,
with delays of 6-7 seconds and no duplicate clock dispatches. An independent
GitHub snapshot and the read-only collector's final 15:43:32Z snapshot agree.
[Run IDs and complete slot table](https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5683283421).
A later native schedule overlapped the 15:00 slot. The pre-dispatch coverage
GET cannot suppress a cron run created afterward; poll claims handle that
existing race. This overlap is recorded separately from duplicate clock dispatches.

Original activation PR #4342 sets
`CLOCK_LIVE=true` and `CLOCK_LIVE_SINCE=2026-09-15T02:21:13Z` on main.
The original v2 02:50-03:50 UTC poll proof passed all twelve slots in 6-9 seconds with
no doubles; the clock-silent dry-run passed without posting an alert.
[Run IDs and host evidence](https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5674493098).
On 2026-09-15 the clock dispatched the brief at 12:00:07Z
([run 34966350705](https://github.com/JW-Incorporated/swift2/actions/runs/34966350705)).
The guard passed, but the Claude action failed before meaningful model work
and delivery was skipped. Checkout and prompt loading succeeded. One
controlled `force=true` replacement
([run 34969710921](https://github.com/JW-Incorporated/swift2/actions/runs/34969710921))
also failed. Do not keep dispatching replacements without a diagnosis.
Diagnostic PR #4351 then retained a fixed provider error category. The
instrumented recovery
([run 34972013723](https://github.com/JW-Incorporated/swift2/actions/runs/34972013723))
confirmed `oauth_org_not_allowed`, with zero model tokens and skipped
delivery. HA #77 was subsequently closed after Joey restored access and
bounded GitHub OAuth probe 34978823809 passed. The on-time delivery proof remains unmet; #4290 and M7 stay open.

The tag's `PINNED_CLOCK_LIVE` permits those filenames and inputs. Main's
`CLOCK_LIVE` gates that permission and starts false, beside
`CLOCK_LIVE_SINCE` in `scripts/marjorie/lib/chat-inbox.mjs`. After the update
HA is done, activate by PR with a fresh UTC timestamp. Every off-to-on PR
must refresh that timestamp; an off PR clears it. Main remains trusted
executable authority for the workflows themselves, not for host code.

At startup the clock waits for one successful main flag read. It refreshes
every ten minutes and switches off after three failures or 30 minutes
without a good read. An unexpected clock-loop error stops watchdog heartbeats
until systemd restarts the process; handled request failures still acknowledge
progress. The doorbell's message pickup continues independently.
An off switch may take one refresh interval to arrive. An unreadable run
list never authorizes a dispatch; requests have 15-second deadlines.

Slots before process start are never caught up. A POST is attempted once,
even on timeout or a 5xx response; a read-only GET can retry for ten minutes.
Attempts are limited to 40 per rolling hour and five minutes per row, with
memory-only state. A restart may lose a slot, and GitHub cron is the fallback.
Metadata logs name the workflow, slot, attempt timestamp and acceptance
boolean. `--check` prints the next ten pinned fires without connecting.

The brief workflow serializes guard through delivery. Its guard runs before
the agent and skips a second main run that UTC day, a whole-run rerun, or an existing
delivery marker on today's brief issue. The marker lookup includes the LA-dated
issue across UTC midnight. Failed/cancelled earlier runs count.
Only a new main-branch manual dispatch with explicit `force=true` bypasses
duplicate checks. It intentionally permits a replacement brief. Rerunning
the whole forced workflow is blocked when the guard re-executes. Job-specific
reruns of agent or delivery jobs can skip the guard and retain their existing
operator behavior; this guard does not make delivery idempotent.

The poll and `clock-silent` alarm use one gap verdict: two missed five-minute
slots raise `Clock is not firing`, after a 30-minute activation grace and a
ten-minute allowance for runs to appear. Any main poll run serves its slot,
including cron or a manual dispatch. If both host clock and GitHub cron die,
detection waits for a surviving cron. This is coverage monitoring; the live
proof separately verifies dispatch actor `sffan15-sys` and timing.
When coverage recovers and the exact standing clock issue remains open, the
poll starts the same serialized alarm to recheck coverage and exact-title REST
issue state, then close it through the
existing ops notifier. Recovery starts no agent work. A later failure opens
a new incident. Queued alarms emit no repeated transition when issue state
already matches coverage; unreadable history or issue state cannot close an alert.

Historical v2 HA installation commands, run from `/opt/longlive-doorbell`:

```sh
sudo git fetch --depth 1 origin tag doorbell-v2
sudo git checkout -q doorbell-v2
sudo cp scripts/doorbell/longlive-doorbell.service /etc/systemd/system/longlive-doorbell.service
sudo systemctl daemon-reload
sudo systemctl restart longlive-doorbell
```

The v3 update reused that unit, fetched the reviewed `doorbell-v3` tag,
checked it out and restarted the service. Verify the exact tag/SHA and a
clean checkout before restarting. Reverting the checkout to `doorbell-v2`
and restarting is the code rollback, but restores the cumulative drift bug.

The two unit-install commands were approved on 2026-09-14. They install
`Type=notify`, `WatchdogSec=180`, `StartLimitBurst=5` and a one-hour start-limit
window. The running Node process reports progress after clock ticks through
`systemd-notify`; a hung loop stops watchdog signals. Five starts in an hour
exhaust the limit; investigate first, then `sudo systemctl reset-failed
longlive-doorbell` before restarting. Verify with `systemctl show
longlive-doorbell -p ActiveState -p WatchdogUSec -p StartLimitBurst`.

Proof order: one hour of twelve poll slots on main, dispatch actor and IDs,
within two minutes per slot without doubled clock dispatches; then
`gh workflow run bot-chat-alarm.yml --ref main -f stage=clock-silent -f dry_run=true`
and confirm its canonical body. At the next 12:00 UTC, verify one brief
delivery and any later cron stopping at the guard. If noon is more than two
hours away, record poll evidence on #4180, put the noon check first in
STATE.md Next, and stop. #4290 and the M7 completion tick wait for both halves.

## Where it lives

| What | Where |
|---|---|
| Host | the Hermes VM host, outside every Hermes container |
| Service | systemd unit `longlive-doorbell` (`scripts/doorbell/longlive-doorbell.service`) |
| Code | `/opt/longlive-doorbell`, a `--depth 1` clone of **one pinned tag** (`doorbell-v1` at install) |
| Tokens | `/etc/longlive-doorbell.env`, mode `0640`, owner `root:longlive-doorbell`; nowhere else (not the repo, Actions, Hermes, chat or Discord) |
| User | `longlive-doorbell`, a system user with no shell and no home |

The env file has exactly two lines:

```
DOORBELL_DISCORD_TOKEN=<the Long Live Doorbell bot token>
DOORBELL_GITHUB_TOKEN=<the longlive-doorbell-dispatch key>
```

## Install

The install is a HUMAN-ACTION (`HUMAN-ACTIONS.md`), and its steps are the
source of truth:

1. Node 22 or newer.
2. The `longlive-doorbell` user.
3. Clone the tag into `/opt/longlive-doorbell`.
4. Write the env file.
5. Run `--check`.
6. Install the unit and `systemctl enable --now longlive-doorbell`.

## Is it working?

```
journalctl -u longlive-doorbell -n 30 --no-pager
```

A healthy start shows `gateway: connecting`, then `gateway: connected as …`,
then:

```
ready: #longlive-marjorie (<id>) and #longlive-tree (<id>); 2 founder id(s)
```

Each founder message adds `rang marjorie <id> → routine-marjorie-chat.yml`
(or `tree`). No message text is ever logged.

`--check` prints the config and exits without connecting. Run it as the
service user with the env file loaded:

```
sudo -u longlive-doorbell bash -c 'set -a; . /etc/longlive-doorbell.env; node /opt/longlive-doorbell/scripts/doorbell/doorbell.mjs --check'
```

The host-only verifier loads the protected credentials internally as the
service user and prints metadata only; never copy token values into its output.
Retry a transient network `503`. Reaction measurements are upper bounds from
the available timestamps, not exact latency.

## Live verification (2026-09-14)

`DOORBELL_LIVE = true` is on `main` (#4326), the service is active, and the
installed checkout remains pinned to `doorbell-v1`. Full evidence is on
[#4180](https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5668808609).

- `#longlive-tree`: 67-word reply, ✅ by the reply bot, check at 86.608 s;
  👀 pickup ≤2.343744 s; run `34876298473`.
- `#longlive-marjorie`: 74-word reply, ✅ by the reply bot, check at 127.576 s;
  👀 pickup ≤1.954189 s; run `34876301348`.
- These top-level messages received no new threads, duplicate replies, or
  replies from the old Hermes Tree identity.
- Stopped-service fallback: message `1549123731408945283` at
  `18:24:38.895Z`; after its age was at least 60 s, cron had not run, so the
  measured manual fallback dispatched `bot-chat-poll.yml` (run `34880770758`).
  This proves the poll path, not that GitHub cron is reliable.
- Alarm run `34880797025` opened #4329 with the canonical title
  `Doorbell is not answering`; Discord alarm message
  `1549124270041464832` appeared at `18:26:47.315Z`. Chat run `34880799699`
  succeeded with a 64-word reply and a reply-bot ✅ check at 206.064 s.
- After the final restart at `18:29:34Z`, message `1549125883468587179` at
  `18:33:11.986Z` received 👀 in ≤0.618 s. Run `34881495722` succeeded; reply
  `1549126305558302806` arrived at `18:34:52.620Z` with 59 words, and the
  reply-bot ✅ check at `18:35:14.626Z` bounded completion at 122.640 s.

For a stopped-service test, wait until the message is at least 60 seconds old.
If cron has not run, dispatch `gh workflow run bot-chat-poll.yml --ref main`
and record that manual trigger. Verify the literal alarm title in Discord,
the alert issue, and the reply's bot ✅ separately; an issue title alone is
not proof of the Discord notification. Restart and verify 👀 within 5 seconds.

## Stop, start, restart

```
sudo systemctl stop longlive-doorbell
sudo systemctl start longlive-doorbell
sudo systemctl restart longlive-doorbell
```

- **While it is stopped,** founder messages wait for the poll: up to 5
  minutes, whenever GitHub's cron fires. While `DOORBELL_LIVE` is on, the poll
  also posts `Doorbell is not answering` in `#longlive-marjorie`.
- **A restart** forgets the pending 6-minute timers; the poll's 45-minute
  reconcile is the backstop.

## Update to a new tag

The doorbell never updates itself. An update is a short HUMAN-ACTION that
names the new tag:

```
cd /opt/longlive-doorbell
sudo git fetch --depth 1 origin tag doorbell-v2
sudo git checkout -q doorbell-v2
sudo systemctl restart longlive-doorbell
```

Check it worked the same way as after the install.

## Flags

`DOORBELL_LIVE` in `scripts/marjorie/lib/chat-inbox.mjs` is read by the poll
on GitHub. When `true`, the poll watches the doorbell and raises its alarms.
It is a committed constant flipped by PR (`gh variable` is founder-only); the
host never reads it.

## Keys

- **Discord:** the Long Live Doorbell bot (HA #72). It can read the two
  channels and add reactions, but cannot post there (HA #73). To rotate:
  1. Reset the token in the Discord developer portal.
  2. Replace its line in the env file.
  3. Restart the service.
- **GitHub:** fine-grained key `longlive-doorbell-dispatch` (HA #74), swift2
  only, Actions read and write. Runs the doorbell starts show the key's owner
  as the actor.
  - **It expires 2027-09-13.** Checkpoint MR3 in
    `docs/plans/marjorie-overhaul/checkpoints.json` is due 2027-08-13 to renew
    it.
  - To renew: create a new key with the same scope, replace its line in the
    env file, restart.

## Troubleshooting

| Journal line | Meaning | Fix |
|---|---|---|
| `not ready: #longlive-tree not found in the guild` | the bot cannot see that channel, or it was renamed | give the bot View Channel there (HA #73); a rename needs `BOTS` in `chat-inbox.mjs` and a new tag |
| `gateway: closed (4004) — not reconnecting` | bad Discord token | replace the token line, then restart |
| `gateway: closed (4014) — not reconnecting` | an intent is disallowed | the doorbell asks only for GUILDS and GUILD_MESSAGES; check the bot's settings |
| `… dispatch … failed (HTTP 401)` or `(HTTP 403)` | the GitHub key expired or lacks Actions write | renew the key (above) |

### 2026-09-15 allowance clarification and recovery

Joey confirmed the weekly allowance was exhausted, then restored Claude
access and authorized up to $3 in basic paid testing. No credentials were
read or rotated. Local Haiku verification reported $0.008897; GitHub OAuth
probe 34978823809 passed at $0.025469. HA #77 is closed from that owner
statement and verification. The earlier probe failed before inference on
empty-tool argument serialization, fixed in #4361; it was not an auth result.

Manual brief and intake runs can opt into a numeric max_budget_usd (#4360).
The recovery plan is one $0.75 intake run, then one $1.50 brief run, checking
actual reported usage between them. Initial intake dispatch 34978955061
failed before inference on GitHub's string-to-number reusable-input boundary;
that adapter requires explicit conversion before retry. Neither a probe nor an
off-time recovery satisfies the on-time noon proof. Keep M7/M8 unticked until
all real acceptance conditions hold. Ordinary schedules are unchanged.


### September 15 paid recovery validation

Numeric manual budget forwarding merged in #4362. Real triage run
34980285130 completed successfully, filed #4364 from #4358, and the new
body passed the ready-ticket checker. Reported cost: $0.5927152; cumulative
Claude test spend after triage: $0.6270812. Brief recovery 34980901967
then reached its budget setting before filing or delivery: 14 turns,
$1.3041965 reported. Total spend is $1.9312777. No paid brief retry is
planned. One $0.75 news-triage validation is reserved under the $3 total.
Budget enforcement occurs after a model request; reported cost can exceed
the individual setting, so the remaining margin must be preserved.

A read-only current-user Windows scheduled task,
`Codex-M7-Noon-Proof-20260916`, captures the next noon window. Its persistent
files are under `Hermes/.codex-noon-proof-20260916`; it starts at logon or
11:59 UTC September 16 and was also started immediately. It never dispatches
workflows or invokes a model. Metadata acceptance requires one productive
owner dispatch within two minutes, one recorded delivery marker, no extra
productive run, and an explicitly guard-only completed native cron. Missing
cron remains pending review, not a pass. It does not independently read
Discord or prove absence of an unmarked duplicate message.

M8 permits synthetic 49/97-hour chase proofs. The repeated-sweep integration
check in #4365 complements existing unit coverage; founder chat approval
and Kevin's resulting classification still need their real event evidence.
