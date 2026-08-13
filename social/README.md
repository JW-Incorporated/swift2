# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — drafts waiting to ship. One JSON file per post. **Every draft added or changed here is checked by `scripts/social/check-drafts.mjs` before it can auto-merge** — see "Draft-time checks" below. That script is the main quality gate now; the guards in `scripts/social/lib/queue.mjs` at post time exist to stop a bad draft from actually posting wrong, not to be the first line of defense.
- **`posted/`** — the log of everything sent, moved here automatically on success.

**State recording (2026-08-12, issue #2031):** every run persists its
queue/posted/failed changes through a `social-poster/state-*` PR that
auto-merges when `build` is green — `social/posted/` and `social/failed/` are
on `.github/content-automerge-allowlist.txt` exactly so those PRs land within
minutes (they are machine bookkeeping, not content; the content gate stays on
`queue/`). Because every dedupe check reads `posted/` from `main`, the poster
**fails closed on a stale ledger**: while any `social-poster/state-*` PR is
still open, the run refuses to post at all and goes red. That is deliberate —
one skipped 30-minute slot is cheap; the 2026-08-11/12 Instagram triple-post
(three identical live posts the IG API cannot delete) is what posting on a
stale ledger costs.
- **`failed/`** — anything that failed 3 times in a row, hit an ambiguous transport failure (see "Post-time guards" below — never auto-retried), had an invalid/missing `scheduledAt`, sat due (past `scheduledAt`) for more than 48h without posting for any reason (repeated failure, a guard skip, a deploy-lag skip, an idempotency skip), or was retired by hand — see `failureReason` below. Needs a human look either way.

Every run resolves each touched item to an outcome — `posted`, `retrying`, `failed`, `skipped`, or `waiting` (media not deployed yet) — and `scripts/social/lib/run-report.mjs` turns those into a markdown report (job summary + queue-state PR body) and `::error::`/`::warning::` annotations. A permanently failed item makes the run exit non-zero; before 2026-08-11, twelve posts died into `failed/` across runs that all finished green. `skipped` and `waiting` deliberately spend **no** attempt, so escalation is a ladder: past **24 hours overdue** either state reddens the run (`::error::`, non-zero exit) while the item is still recoverable, and at **48 hours** the staleness rule below retires it to `failed/`.

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

**Every field below is enforced in CI** by `npm run validate:social`
(`scripts/social/validate-queue.mjs`), which runs in the `build` job — the
required check on `main`. A malformed draft fails on its own PR, not at 23:00
UTC three attempts later. Rules live in `scripts/social/lib/queue-schema.mjs`.

- `platform`: `"x"` or `"instagram"`.
- `body`: required, non-empty, and **within the platform's real limit — 280 *weighted* characters for X** (X counts an autolinked URL as exactly 23 characters regardless of its real length, and most emoji/CJK as 2 — the same `weightedTweetLength` rule `check-drafts.mjs` enforces at draft time), **2,200 for Instagram.** This is not a style preference: every one of the eleven X posts in `failed/` was over the weighted limit, and X answers an over-length tweet with `403 "You are not permitted to perform this action"`, which reads like a permissions problem and is not one. If the account is ever upgraded to X Premium, raise the limit in `queue-schema.mjs` (and `check-drafts.mjs`) deliberately.
- `media`: required for Instagram; optional for X. **X posts can carry images now** (up to 4, uploaded via the v1.1 media endpoint and attached to the tweet) — paths are relative to `apps/web/public/social/` on both platforms (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**). Since 2026-08-11 the poster HEAD-checks each media URL before spending a real publish attempt on it (the "deploy-lag preflight" — see below): an item whose media isn't live yet **waits** (no attempt spent, reported as "waiting on deploy") and ships itself on the first run after the deploy lands.
- `mediaKind` — **required on every draft that carries media** (the 2026-08-12 **Taylor-photo standard**, Joey's directive after the era-tile grid + issue #2031). Two living values, one dead one:
  - `"photo"` — a **real photograph of Taylor Swift**, and the tile **must live under `/social/library/photos/`** (path-enforced, so a screenshot can't be laundered as a credited photo — and a `site-screen` may NOT point there, so a real photo can't ship uncredited). Sourced from the repo's own credited corpus (`supabase/seed/content/**` `moment.photos`, `apps/web/lib/longlive/lenses.ts`). Requires **`mediaCredit`** (the photographer/agency line — put it in the caption too whenever the platform's length budget allows) and **`mediaSource`** (where it came from, so the credit is auditable). Never an AI image; never an unlabeled stand-in (media policy, `docs/decisions.md` 2026-07-09).
  - `"site-screen"` — a deliberate product screenshot for a feature/launch post; must live under `/social/library/`. Prefer a carousel with a Taylor `photo` tile first and the screenshot as slide 2 — the grid should show Taylor.
  - `"era-art"` — **dead.** Generic era tiles (`/eras/<id>.png`) hard-fail `check-drafts.mjs` outright, declared or not; the value stays schema-recognized only so historical `posted/` records parse. On 2026-08-06 all 17 posted IG items were era tiles; that is the failure this standard exists to end.
  - Media may not repeat any of the last 10 posted Instagram items' media (draft-time check) — a photo corpus of 1,000+ credited entries means there is never a reason to.
- `scheduledAt`: **this is what ships the post.** Since 2026-07-25 (see `docs/decisions.md`) there is no per-item approval gate — when this timestamp passes, the next poster run sends it, subject only to the caps, the guards below, and `SOCIAL_FREEZE`. Choose it deliberately and never backdate.
- `approvedBy` + `approvedAt`: **optional provenance only** — a record of who signed off and when, for the cases where a human did. They no longer gate anything; the poster does not check them. (They were a hard gate until 2026-07-25.)
- `campaign`: **story-unique** (e.g. `on-this-day:red-announcement-wanegbt`), shared ONLY between the IG/X siblings covering the same story. Used by `check-drafts.mjs`'s cross-post-copy check to find an X draft's IG sibling — and by the poster's idempotency check (`findPostedDuplicate`), which treats same platform + same campaign as an already-posted duplicate. A thematic bucket value reused across stories (`heartbeat:on-this-day` on five different posts) therefore false-skips every post in the bucket after its first one lands, and the 48h rule then retires them to `failed/` — found and fixed queue-wide on 2026-08-12.
- `failureReason`: written by the poster (never by a drafter) when an item lands in `failed/` — a human-readable explanation, distinct from `lastError` (the raw API error text), covering the 48h-stale case too where there may never have been an API error at all.

## Draft-time checks (`scripts/social/check-drafts.mjs`)

Run automatically by `.github/workflows/auto-merge-content.yml` whenever a PR changes `social/queue/**.json` — a failing draft just leaves the PR for a human (same fail-safe direction as the rest of that workflow), it doesn't block anything else. Run by hand any time with `node scripts/social/check-drafts.mjs` (checks every file currently in `queue/`) or `node scripts/social/check-drafts.mjs <file>...` (just those files — same idea CI uses via `--manifest <path>`, a JSON array file, so a filename with a space never gets silently split by the shell). **A file explicitly requested but not found under `queue/` is a hard failure (exit 1), not a warning** — this never silently reports "all clear" on a possibly-broken file list.

Five rule families, in order (later ones assume earlier ones passed):
- **Schema** — `body` must be a non-empty string, `platform` must be `x`/`instagram`, `scheduledAt` must parse to a real date. A schema failure skips every other rule for that item (they all assume well-formed input) and reports only the schema finding.
- **Voice** — reuses `scripts/content-engine/checkers/voice.mjs`'s surname-overuse, ai-tell, and wire-attribution rules against the draft's `body`.
- **Openers** — bans a body that opens with "did you know" (case-insensitive, word-boundary matched, and normalized past any leading emoji/quote/punctuation) outright, and flags a draft whose first 6 words match the opening of anything posted in the last 14 days or any other current queue item (formula detection).
- **Cross-post copy** — an X draft whose `body` is more than 80% similar (word-overlap coefficient, not Jaccard — see the script for why) to its Instagram sibling's `body` fails. Siblings are matched by shared `campaign`; when an X draft has no `campaign`, this falls back to the closest same-day Instagram item — a near-duplicate still fails, and even a merely-plausible-looking pair gets a "you probably meant to tag these" nudge. Near-identical siblings are what triggers X's duplicate-content 403s.
- **Media** — Instagram drafts need `media`; every media path must be a `.png`/`.jpg`/`.jpeg` (the only formats this pipeline produces or uploads to X) and exist under `apps/web/public/`; era art needs `mediaKind: "era-art"` and can't repeat the last 10 posted Instagram items; a real dedicated photo can't either.

## Post-time guards (`scripts/social/lib/queue.mjs`, `post-queue.mjs`)

Per due item, in this order:
1. **48h staleness check, first and unconditional.** Any item still due and unposted more than 48h after its `scheduledAt` moves straight to `social/failed/` with a `failureReason` — regardless of whether it would be postable right now. This is what stops a guard/preflight skip from becoming a silent, permanent deadlock (exactly what happened to `2026-08-09-august-augustine-ig.json`, stuck re-skipping every 30 min for 2 days because the era-art guard's window only advanced when a new Instagram post landed) — a 3-day-stale item never quietly ships just because it happened to clear on the run that finally checked it.
2. **Idempotency check** — is there already a `social/posted/` record with the same platform and (`campaign` or an identical `body`)? If so, skip loudly rather than repost. This mitigates the real 2026-07-17 triple-post incident: the queue → posted state-commit PR (see `social-poster.yml`) can itself fail to land even after a genuine successful post, leaving the item still sitting in `social/queue/` for a later run to find.
3. **Era-art guard** (`eraArtGuardReason`) — undeclared or recently-repeated era art (see `mediaKind` above) — plus a same-run media dedupe, so two items posting in the same run can't reuse each other's media before `social/posted/` would even reflect it.
4. **Deploy-lag preflight** — HEAD-checks (falling back to a ranged GET if a host rejects HEAD, and requiring an image content-type) every media URL before an IG or X-with-media publish; unreachable media records the item as **`waiting`** (reported as "waiting on deploy", no attempt spent) rather than wasting a retry on a 404 — it ships itself on the first run after the deploy lands. For Instagram, the publish itself also polls each media container to `FINISHED` before calling `/media_publish` (`lib/ig-container.mjs`, issue #1897) — publishing a container Meta hasn't finished processing is what produced the 9007/2207027 "media not ready" failure, and retries can't fix it because every attempt rebuilds a fresh container and re-loses the same race.

None of 2-4 burn one of the item's 3 retry attempts, and none of them consume a per-run posting slot — **only an item that clears all four checks and is actually attempted counts against `MAX_POSTS_PER_RUN` (5)**, so a run that selects several due-but-blocked items can't starve a later, immediately-postable item of its turn.

Two more failure-time behaviors: a platform missing required credentials aborts the **entire run** before touching any item (no attempts burned on a problem no retry fixes), and a transport-level failure at the actual publish moment (request sent, response never received) is recorded as `lastError: "ambiguous"` and is **never auto-retried** — retrying one is indistinguishable from manufacturing a duplicate, which is exactly the 2026-07-17 incident's mechanism.

## IG media audit (`scripts/social/list-media.mjs`, `.github/workflows/social-audit.yml`)

Manual-only (`workflow_dispatch`), never scheduled. Lists every post actually live on the linked Instagram account (not just what `social/posted/` claims — a human can delete a post in the app, which this repo never learns about) and flags likely duplicates by caption. Opens or refreshes a single "IG media audit" issue with the report. Instagram's Content Publishing API cannot delete published media at all (see `scripts/social/delete-media.mjs`'s header) — any flagged duplicate needs a founder to remove it by hand in the app.

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
