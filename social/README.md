# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — approved posts waiting to ship. One JSON file per post.
- **`posted/`** — the log of everything sent, moved here automatically on success.
- **`failed/`** — anything that failed 3 times in a row; needs a human look.

## Queue item schema

```json
{
  "platform": "x",
  "body": "post text, exactly as approved",
  "media": ["/social/launch-hero.jpg"],
  "scheduledAt": "2026-07-18T01:00:00Z",
  "approvedBy": "joey",
  "approvedAt": "2026-07-17T20:00:00Z",
  "campaign": "launch-day"
}
```

- `platform`: `"x"` or `"instagram"`.
- `media`: optional for X (not yet supported — omit it), required for Instagram, paths relative to `apps/web/public/social/` (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**, or Instagram's fetch will 404).
- `approvedBy` + `approvedAt`: only the desk sets these, only after a real founder approval (Slack, brief, or this chat) — never fabricated.
- The poster ignores anything without both approval fields, no matter how it got into the folder.

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
