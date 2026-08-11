# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — approved posts waiting to ship. One JSON file per post.
- **`posted/`** — the log of everything sent, moved here automatically on success.
- **`failed/`** — anything that failed 3 times in a row, or was retired by
  hand; needs a human look. Items retired by hand carry a `failureReason`
  explaining what to do with them.

Two states deliberately spend **no** attempt, so an item in either can never
reach `failed/` on its own: `skipped` (the era-art repetition guard) and
`waiting` (media not deployed yet). Both are correct, and both were invisible
until 2026-08-11 — `2026-08-09-august-augustine-ig.json` sat skipped every 30
minutes for two days inside runs that exited 0. The poster now escalates
either state past **24 hours overdue** to an `::error::` annotation and a
non-zero exit, so a wait cannot quietly become a never.

## Queue item schema

```json
{
  "platform": "x",
  "body": "post text, exactly as it will appear",
  "media": ["/social/launch-hero.jpg"],
  "scheduledAt": "2026-07-18T01:00:00Z",
  "approvedBy": "joey",
  "approvedAt": "2026-07-17T20:00:00Z",
  "campaign": "launch-day"
}
```

**Every field below is enforced in CI** by `npm run validate:social`
(`scripts/social/validate-queue.mjs`), which runs in the `build` job — the
required check on `main`. A malformed draft fails on its own PR, not at 23:00
UTC three attempts later. Rules live in `scripts/social/lib/queue-schema.mjs`.

- `platform`: `"x"` or `"instagram"`.
- `body`: required, non-empty, and **within the platform's character limit —
  280 for X, 2,200 for Instagram.** This is not a style preference. Every one
  of the eleven X posts in `failed/` was over 280 (294–373 chars); every X
  post that ever succeeded was under it (84–276). X answers an over-length
  tweet with `403 "You are not permitted to perform this action"`, which
  reads like a permissions problem and is not one. If the account is ever
  upgraded to X Premium, raise the limit in `queue-schema.mjs` deliberately.
- `media`: optional for X (not yet supported — omit it), required for Instagram, paths relative to `apps/web/public/social/` (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**, or Instagram's fetch will 404). Since 2026-08-11 the poster HEAD-checks this before publishing: an item whose media isn't live yet **waits** (no attempt spent, reported as "waiting on deploy") instead of failing, and ships itself on the first run after the deploy lands.
- `scheduledAt`: **this is what ships the post.** Since 2026-07-25 (see `docs/decisions.md`) there is no per-item approval gate — when this timestamp passes, the next poster run sends it, subject only to the caps and `SOCIAL_FREEZE`. Choose it deliberately and never backdate.
- `approvedBy` + `approvedAt`: **optional provenance only** — a record of who signed off and when, for the cases where a human did. They no longer gate anything; the poster does not check them. (They were a hard gate until 2026-07-25.)

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
