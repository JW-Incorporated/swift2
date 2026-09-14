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
follows as a later tag with its own update human action.

## Clock v2 (built; installation and live proof pending)

`doorbell-v2` adds exactly two pinned schedule rows: `bot-chat-poll.yml`
every five minutes and `routine-marjorie-brief.yml` at 12:00 UTC. GitHub's
schedule triggers remain. A new row or changed cadence requires a reviewed
tag and a founder decision; the service never downloads a replacement table.

The tag's `PINNED_CLOCK_LIVE` permits those filenames and inputs. Main's
`CLOCK_LIVE` gates that permission and starts false, beside
`CLOCK_LIVE_SINCE` in `scripts/marjorie/lib/chat-inbox.mjs`. After the update
HA is done, activate by PR with a fresh UTC timestamp. Every off-to-on PR
must refresh that timestamp; an off PR clears it. Main remains trusted
executable authority for the workflows themselves, not for host code.

At startup the clock waits for one successful main flag read. It refreshes
every ten minutes and switches off after three failures or 30 minutes
without a good read. The doorbell's message pickup continues independently.
An off switch may take one refresh interval to arrive. An unreadable run
list never authorizes a dispatch; requests have 15-second deadlines.

Slots before process start are never caught up. A POST is attempted once,
even on timeout or a 5xx response; a read-only GET can retry for ten minutes.
Attempts are limited to 40 per rolling hour and five minutes per row, with
memory-only state. A restart may lose a slot, and GitHub cron is the fallback.
Metadata logs name the workflow, slot, attempt timestamp and acceptance
boolean. `--check` prints the next ten pinned fires without connecting.

The brief workflow serializes guard through delivery. Its guard runs before
the agent and skips a second main run that UTC day, a rerun, or an existing
delivery marker on today's brief issue. Failed/cancelled earlier runs count.
Only a new main-branch manual dispatch with explicit `force=true` bypasses
duplicate checks. It intentionally permits a replacement brief. Rerunning
that forced dispatch is still blocked before the agent.

The poll and `clock-silent` alarm use one gap verdict: two missed five-minute
slots raise `Clock is not firing`, after a 30-minute activation grace and a
ten-minute allowance for runs to appear. Any main poll run serves its slot,
including cron or a manual dispatch. If both host clock and GitHub cron die,
detection waits for a surviving cron. This is coverage monitoring; the live
proof separately verifies dispatch actor `sffan15-sys` and timing.
When coverage recovers and the exact standing clock issue remains open, the
poll starts the same serialized alarm to recheck and close it through the
existing ops notifier. Recovery starts no agent work. A later failure opens
a new incident; an unreadable history cannot close an alert.

The v2 update HA must be run from `/opt/longlive-doorbell`:

```sh
sudo git fetch --depth 1 origin tag doorbell-v2
sudo git checkout -q doorbell-v2
sudo cp scripts/doorbell/longlive-doorbell.service /etc/systemd/system/longlive-doorbell.service
sudo systemctl daemon-reload
sudo systemctl restart longlive-doorbell
```

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
