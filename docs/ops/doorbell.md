# Long Live Doorbell — operations

The doorbell is the one small program the Marjorie Overhaul runs off GitHub
(M7; specs `docs/specs/marjorie-overhaul/m7-doorbell.md` and `m7-clock.md`).
It does two jobs:

- **The doorbell.** A founder message in `#longlive-marjorie` or
  `#longlive-tree` gets 👀 within a second, and its chat routine starts at
  once. Six minutes later, if no ✅ or ❌ has arrived, it adds ⚠️ and starts
  `bot-chat-alarm.yml`.
- **The clock.** Once `CLOCK_LIVE` is on, it starts every scheduled routine on
  time with `workflow_dispatch`, because GitHub drops most of this repo's cron
  fires (#4290).

It never posts in Discord and never adds ✅ or ❌. When it is down, the
5-minute poll still answers, and routines still run whenever GitHub's own
cron fires.

## Where it lives

| What | Where |
|---|---|
| Host | the Hermes VM host, outside every Hermes container |
| Service | systemd unit `longlive-doorbell` (`scripts/doorbell/longlive-doorbell.service`) |
| Code | `/opt/longlive-doorbell`, a `--depth 1` clone of **one pinned tag** (`doorbell-v1` at install) |
| Tokens | `/etc/longlive-doorbell.env`, mode `0640`, owner `root:longlive-doorbell`. Nowhere else: not the repo, Actions, Hermes, chat or Discord |
| User | `longlive-doorbell`, a system user with no shell and no home |
| State | `/var/lib/longlive-doorbell/clock-handled.json`: the clock slots already started, so a restart never starts one twice (systemd `StateDirectory`) |

The env file has exactly two lines:

```
DOORBELL_DISCORD_TOKEN=<the Long Live Doorbell bot token>
DOORBELL_GITHUB_TOKEN=<the longlive-doorbell-dispatch key>
```

## Install

The install is a HUMAN-ACTION (see `HUMAN-ACTIONS.md`), and its steps are the
source of truth. In short: Node 22 or newer → the `longlive-doorbell` user →
clone the tag into `/opt/longlive-doorbell` → write the env file → `--check`
→ install the unit and `systemctl enable --now longlive-doorbell`.

## Is it working?

```
journalctl -u longlive-doorbell -n 30 --no-pager
```

A healthy start shows, in order:

- `clock: 55 rows, CLOCK_LIVE=false in this checkout; re-reading main every 10 min`
- `gateway: connecting`, then `gateway: connected as Long Live Doorbell`
- `ready: #longlive-marjorie (<id>) and #longlive-tree (<id>); 2 founder id(s)`

Each founder message adds `rang marjorie <id> → routine-marjorie-chat.yml`.
Once the clock is live, each slot adds `clock: dispatched <workflow> for
<time>` or `already has a run … skipped`.

`node /opt/longlive-doorbell/scripts/doorbell/doorbell.mjs --check`, run as the
service user with the env file loaded, prints the config and the next 10
clock fires without connecting to anything.

## Stop, start, restart

```
sudo systemctl stop longlive-doorbell
sudo systemctl start longlive-doorbell
sudo systemctl restart longlive-doorbell
```

- **While it is stopped,** founder messages wait for the poll (up to 5 minutes
  when GitHub's cron fires). While `DOORBELL_LIVE` is on, the poll also posts
  `Doorbell is not answering` in `#longlive-marjorie`. While `CLOCK_LIVE` is
  on, the poll raises `Clock is not firing` after 20 minutes without a clock
  run.
- **A restart** forgets the pending 6-minute timers; the poll's 45-minute
  reconcile is the backstop. It never re-fires a clock slot: started slots
  are saved in the state file, and any slot with a run is skipped.

## Update to a new tag

The doorbell never updates itself. An update is a short HUMAN-ACTION naming
the new tag:

```
cd /opt/longlive-doorbell
sudo git fetch --depth 1 origin tag doorbell-v2
sudo git checkout -q doorbell-v2
sudo systemctl restart longlive-doorbell
```

Check it worked the same way as after the install (`ready` in the journal).

**What does not need an update:** every 10 minutes the clock reads one commit
of `main` (public, no key), and fetches `scripts/doorbell/schedule.json` and
the `CLOCK_LIVE` line of `scripts/marjorie/lib/chat-inbox.mjs` at that commit.
So a cron change or a `CLOCK_LIVE` flip merged to `main` reaches the host
within about 15 minutes.

It applies a table from `main` only inside the pinned policy:

- workflows and inputs already in the tag's own table;
- no row more often than every 5 minutes;
- at most 40 dispatches in an hour.

A new scheduled workflow, new inputs, or code changes need a new tag.
`DOORBELL_LIVE` is read only by the poll on GitHub.

## Flags

| Flag | Where | Read by | Effect when `true` |
|---|---|---|---|
| `DOORBELL_LIVE` | `scripts/marjorie/lib/chat-inbox.mjs` | the poll | watches the doorbell and raises its alarms |
| `CLOCK_LIVE` | the same file | the doorbell (from `main`) and the poll | the clock fires; the poll watches it |
| `CLOCK_LIVE_SINCE` | the same file | the poll | an ISO time set in the same PR that flips `CLOCK_LIVE`; the watch ignores older runs and waits 30 minutes before its first alarm |

All three are committed constants flipped by PR (`gh variable` is founder-only).

## Keys

- **Discord:** the Long Live Doorbell bot (HA #72). It can read the two
  channels and add reactions; it cannot post there (HA #73). To rotate: reset
  the token in the Discord developer portal, replace the line in the env file,
  then restart.
- **GitHub:** fine-grained key `longlive-doorbell-dispatch` (HA #74). It is
  scoped to swift2 only, with Actions read and write. **It expires 2027-09-13.**
  A checkpoint in `docs/plans/marjorie-overhaul/checkpoints.json` is due
  2027-08-13 to renew it: create the new key with the same scope, replace the
  line, restart. Runs the doorbell and clock start show the key's owner as
  the actor.

## Troubleshooting

| Journal line | Meaning | Fix |
|---|---|---|
| `not ready: #longlive-tree not found in the guild` | the bot cannot see that channel, or it was renamed | give the bot View Channel there (HA #73); a rename needs `BOTS` in `chat-inbox.mjs` and a new tag |
| `gateway: closed (4004) — not reconnecting` | bad Discord token | replace the token line, restart |
| `gateway: closed (4014) — not reconnecting` | an intent is disallowed | the doorbell asks only for GUILDS and GUILD_MESSAGES; check the bot's settings |
| `… dispatch … failed (HTTP 401)` or `(HTTP 403)` | GitHub key expired or lacks Actions write | renew the key (above) |
| `clock: gave up on <workflow> …` | dispatches failed for 10 minutes | usually the key; GitHub's own cron is the fallback |
| `clock: reading main failed …` | GitHub raw was unreachable | nothing; it keeps its last table and retries in 10 minutes |
