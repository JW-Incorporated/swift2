# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — drafts waiting to ship. One JSON file per post. **Every draft added or changed here is checked by `scripts/social/check-drafts.mjs` before it can auto-merge** — see "Draft-time checks" below. That script is the main quality gate now; the guards in `scripts/social/lib/queue.mjs` at post time exist to stop a bad draft from actually posting wrong, not to be the first line of defense.
- **`posted/`** — the log of everything sent, moved here automatically on success.
- **`failed/`** — anything that failed 3 times in a row, OR sat due (past `scheduledAt`) for more than 48h without posting for any reason (repeated failure, a guard skip, a deploy-lag skip) — see `failureReason` below. Needs a human look either way.

## Queue item schema

```json
{
  "platform": "x",
  "body": "post text, exactly as it will appear",
  "media": ["/social/launch-hero.jpg"],
  "mediaKind": "era-art",
  "scheduledAt": "2026-07-18T01:00:00Z",
  "approvedBy": "joey",
  "approvedAt": "2026-07-17T20:00:00Z",
  "campaign": "launch-day"
}
```

- `platform`: `"x"` or `"instagram"`.
- `media`: required for Instagram; optional for X. **X posts can carry images now** (up to 4, uploaded via the v1.1 media endpoint and attached to the tweet) — paths are relative to `apps/web/public/social/` on both platforms (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**). Since 2026-08-11 the poster HEAD-checks each media URL before spending a real publish attempt on it (the "deploy-lag preflight" — see below) rather than burning a retry on a file that simply hasn't deployed yet.
- `mediaKind`: **required whenever `media[0]` is a generic era-cover tile** (`/eras/<id>.png`) — set it to `"era-art"` to declare that using the era tile (instead of a real dedicated photo) is a deliberate choice, not a lazy fallback. A draft that uses era art without this tag is rejected — by `check-drafts.mjs` at draft time, and loudly skipped (then eventually failed, see the 48h rule) by the poster if one somehow gets through. Even DECLARED era art still can't repeat one of the last 10 posted Instagram items — the tag says "this is intentional," not "this is exempt from the repeat check." Omit `mediaKind` entirely for a real dedicated photo.
- `scheduledAt`: **this is what ships the post.** Since 2026-07-25 (see `docs/decisions.md`) there is no per-item approval gate — when this timestamp passes, the next poster run sends it, subject only to the caps, the guards below, and `SOCIAL_FREEZE`. Choose it deliberately and never backdate.
- `approvedBy` + `approvedAt`: **optional provenance only** — a record of who signed off and when, for the cases where a human did. They no longer gate anything; the poster does not check them. (They were a hard gate until 2026-07-25.)
- `campaign`: shared between an IG/X sibling pair covering the same story. Used by `check-drafts.mjs`'s cross-post-copy check to find an X draft's IG sibling.
- `failureReason`: written by the poster (never by a drafter) when an item lands in `failed/` — a human-readable explanation, distinct from `lastError` (the raw API error text), covering the 48h-stale case too where there may never have been an API error at all.

## Draft-time checks (`scripts/social/check-drafts.mjs`)

Run automatically by `.github/workflows/auto-merge-content.yml` whenever a PR changes `social/queue/**.json` — a failing draft just leaves the PR for a human (same fail-safe direction as the rest of that workflow), it doesn't block anything else. Run by hand any time with `node scripts/social/check-drafts.mjs` (checks every file currently in `queue/`) or `node scripts/social/check-drafts.mjs <file>...` (just those files — what CI actually passes, since older items authored before a rule existed shouldn't retroactively fail every future PR).

Four rule families:
- **Voice** — reuses `scripts/content-engine/checkers/voice.mjs`'s surname-overuse, ai-tell, and wire-attribution rules against the draft's `body`.
- **Openers** — bans a body that opens with "did you know" (case-insensitive) outright, and flags a draft whose first 6 words match the opening of anything posted in the last 14 days or any other current queue item (formula detection).
- **Cross-post copy** — an X draft whose `body` is more than 80% similar (word-overlap coefficient, not Jaccard — see the script for why) to its Instagram sibling's `body` (same `campaign`) fails. Near-identical siblings are what triggers X's duplicate-content 403s.
- **Media** — Instagram drafts need `media`; every media path must exist under `apps/web/public/`; era art needs `mediaKind: "era-art"` and can't repeat the last 10 posted Instagram items; a real dedicated photo can't either.

## Post-time guards (`scripts/social/lib/queue.mjs`, `post-queue.mjs`)

Two things can skip a due item WITHOUT burning one of its 3 retry attempts:
- **Era-art guard** (`eraArtGuardReason`) — undeclared or recently-repeated era art (see `mediaKind` above).
- **Deploy-lag preflight** — a HEAD request against every media URL before an IG or X-with-media publish; a non-200 skips the attempt rather than wasting it on a 404.

Both exist so a real, transient blocker doesn't cost the item one of its 3 attempts. But a skip that never resolves is its own failure mode: **any item still due and unposted more than 48h after its `scheduledAt` is moved to `social/failed/` with a `failureReason`**, regardless of why it never posted — this is what stops a guard skip from becoming a silent, permanent deadlock (exactly what happened to `2026-08-09-august-augustine-ig.json`, stuck re-skipping every 30 min for 2 days because the guard window only advanced when a new Instagram post landed).

## IG media audit (`scripts/social/list-media.mjs`, `.github/workflows/social-audit.yml`)

Manual-only (`workflow_dispatch`), never scheduled. Lists every post actually live on the linked Instagram account (not just what `social/posted/` claims — a human can delete a post in the app, which this repo never learns about) and flags likely duplicates by caption. Opens or refreshes a single "IG media audit" issue with the report. Instagram's Content Publishing API cannot delete published media at all (see `scripts/social/delete-media.mjs`'s header) — any flagged duplicate needs a founder to remove it by hand in the app.

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
