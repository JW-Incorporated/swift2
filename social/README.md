# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — approved posts waiting to ship. One JSON file per post.
- **`posted/`** — the log of everything sent, moved here automatically on success.
- **`failed/`** — anything that failed 3 times in a row; needs a human look.

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

- `platform`: `"x"` or `"instagram"`.
- `media`: optional for X (not yet supported — omit it), required for Instagram, paths relative to `apps/web/public/social/` (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**, or Instagram's fetch will 404).
- `scheduledAt`: **this is what ships the post.** Since 2026-07-25 (see `docs/decisions.md`) there is no per-item approval gate — when this timestamp passes, the next poster run sends it, subject only to the caps and `SOCIAL_FREEZE`. Choose it deliberately and never backdate.
- `approvedBy` + `approvedAt`: **optional provenance only** — a record of who signed off and when, for the cases where a human did. They no longer gate anything; the poster does not check them. (They were a hard gate until 2026-07-25.)

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
