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
