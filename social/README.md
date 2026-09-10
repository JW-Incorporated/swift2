# Social posting queue

Feeds `.github/workflows/social-poster.yml` (runs every 30 min). Full context: `docs/agents/growth.md` and `docs/marketing/growth-plan.md` §4.

- **`queue/`** — drafts waiting to ship. One JSON file per post. **Every draft added or changed here is checked by `scripts/social/check-drafts.mjs` before it can auto-merge** — see "Draft-time checks" below. That script is the main quality gate now; the guards in `scripts/social/lib/queue.mjs` at post time exist to stop a bad draft from actually posting wrong, not to be the first line of defense.
- **`posted/`** — the log of everything sent, moved here automatically on success.

**Hard pairing rule (Joey, 2026-08-25, made UNCONDITIONAL 2026-08-26,
reaffirmed 2026-09-10 after the appearance-discovery lane's brief X-only
carve-out): every real campaign is two queue items authored together** — one
`platform: "x"`, one `platform: "instagram"`, with the exact same
story-unique `campaign` value, **scheduled to post at the same instant (or
within a few minutes of each other)** — see the `scheduledAt` note below.
The Instagram item already auto-cross-posts to Facebook, so never draft a
third Facebook item. **There is no single-platform exception of any kind,
for any reason** ("Always an IG copy. Always." — Joey, 2026-08-26; "there's
never a time where we post to only X, or only IG — everything should be the
same" — Joey, 2026-09-10). A single-platform exception marker existed
briefly for content whose FORMAT genuinely could not work on the other
platform; it was removed the same day it shipped, because it was immediately
used as a scheduling pretext instead (the two 2026-08-26 campaigns that
shipped X-only, issue #3373) — missing media, forgetting the sibling,
convenience, or a scheduling/calendar reason was never valid, and now no
reason is. A second, narrower carve-out (2026-09-05, #3584: the
appearance-discovery fast lane's `appearance:<videoId>` campaigns, on the
theory that the lane had no license-cleared photo to offer Instagram) was
itself the exact same mistake and was removed 2026-09-10 (kanban
t_bac31b1a) — that lane now sources a real credited photo from
`social/photo-library.json` for both platforms, same as every other
campaign.

**No human review gate (2026-07-25, reaffirmed 2026-08-25 — see
`docs/decisions.md`):** `queue/` is also on
`.github/content-automerge-allowlist.txt` and auto-merges on green exactly
like `posted/`/`failed/` below — a draft PR is never held open for a founder
to read. The only gate on a queue item before it ships is automated:
`scripts/social/check-drafts.mjs` at PR time (schema, voice, sourcing,
length, media). The founder's only checkpoint is the notification email the
poster sends on every post, success or failure, after the fact.

**State recording (2026-08-25, issue #2040, supersedes the 2026-08-12/issue
#2031 mechanism):** every run pushes its queue/posted/failed changes
straight to an unprotected branch, `social-ledger` — a plain `git push`,
no PR, no required check, nothing that can silently strand it. Dedupe reads
the union of `main` and `social-ledger` before every run, so the ledger
this repo's duplicate-post defense actually depends on can't go stale just
because a PR failed to land. A throwaway `social-poster/state-*` PR into
`main` still runs afterward (same allowlist mechanics as before — `.github/
content-automerge-allowlist.txt` covers `social/posted/`/`social/failed/`
as machine bookkeeping — `queue/` auto-merges too, per the no-human-review
note above), but it's
VISIBILITY-only now: it keeps `main`'s own copy current for humans and for
`check-drafts.mjs`'s recent-history heuristics, and a stuck one is a
staleness-on-`main` problem, not a live-duplicate risk. Full mechanics:
`.github/workflows/social-poster.yml`'s header comment and `docs/
decisions.md` 2026-08-25. The 2026-08-11/12 Instagram triple-post (three
identical live posts the IG API cannot delete) is what this exists to
prevent — see `docs/agents/growth.md`'s duplicate-post-incident section.
- **`failed/`** — anything that failed 3 times in a row, hit an ambiguous transport failure (see "Post-time guards" below — never auto-retried), had an invalid/missing `scheduledAt`, sat due (past `scheduledAt`) for more than 48h without posting for any reason (repeated failure, a guard skip, a deploy-lag skip, an idempotency skip), or was retired by hand — see `failureReason` below. Needs a human look either way.

Every run resolves each touched item to an outcome — `posted`, `retrying`, `failed`, `skipped`, or `waiting` (media not deployed yet) — and `scripts/social/lib/run-report.mjs` turns those into a markdown report (job summary + queue-state PR body) and `::error::`/`::warning::` annotations. A permanently failed item makes the run exit non-zero; before 2026-08-11, twelve posts died into `failed/` across runs that all finished green. `skipped` and `waiting` deliberately spend **no** attempt, so escalation is a ladder: past **24 hours overdue** either state reddens the run (`::error::`, non-zero exit) while the item is still recoverable, and at **48 hours** the staleness rule below retires it to `failed/`.

## Queue item schema

```json
{
  "platform": "x",
  "body": "post text, exactly as it will appear",
  "media": ["/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg"],
  "mediaKind": "photo",
  "photoId": "lover-minneapolis-2023",
  "mediaCredit": "Photographer Name/Getty Images",
  "mediaSource": "https://example.com/where-this-came-from",
  "scheduledAt": "2026-07-18T01:00:00Z",
  "approvedBy": "joey",
  "approvedAt": "2026-07-17T20:00:00Z",
  "campaign": "launch:mood-chat:announce"
}
```

This example is the shape to copy. Note the two fields that are easiest to get
wrong, both for reasons documented below: `mediaKind` is `"photo"` (era tiles
are dead, and any draft carrying media must declare a kind), and `campaign`
carries the story, not just its family — a bare bucket value silently kills
every later post that reuses it.

**Every field below is enforced in CI** by `npm run validate:social`
(`scripts/social/validate-queue.mjs`), which runs in the `build` job — the
required check on `main`. A malformed draft fails on its own PR, not at 23:00
UTC three attempts later. Rules live in `scripts/social/lib/queue-schema.mjs`.

- `platform`: `"x"` or `"instagram"`.
- `body`: required, non-empty, and **within the platform's real limit — 280 *weighted* characters for X** (X counts an autolinked URL as exactly 23 characters regardless of its real length, and most emoji/CJK as 2 — the same `weightedTweetLength` rule `check-drafts.mjs` enforces at draft time), **2,200 for Instagram.** This is not a style preference: every one of the eleven X posts in `failed/` was over the weighted limit, and X answers an over-length tweet with `403 "You are not permitted to perform this action"`, which reads like a permissions problem and is not one. If the account is ever upgraded to X Premium, raise the limit in `queue-schema.mjs` (and `check-drafts.mjs`) deliberately.
- `media`: required for Instagram and every X campaign — every real campaign ships credited `photo` media on both platforms (up to 4 images on X); there is no X-only link-preview lane any more (the 2026-09-05 `appearance:` exception was removed 2026-09-10). Paths are relative to `apps/web/public/social/` on both platforms (that's where they must be committed — the poster fetches them from the live site, so **the media file's PR must be merged and deployed before `scheduledAt`**). Since 2026-08-11 the poster HEAD-checks each media URL before spending a real publish attempt on it (the "deploy-lag preflight" — see below): an item whose media isn't live yet **waits** (no attempt spent, reported as "waiting on deploy") and ships itself on the first run after the deploy lands.
- `mediaKind` — **required on every draft that carries media** (the 2026-08-12 **Taylor-photo standard**, Joey's directive after the era-tile grid + issue #2031). Two living values, one dead one:
  - `"photo"` — a **real photograph of Taylor Swift**, and the tile **must live under `/social/library/photos/`** (path-enforced, so a screenshot can't be laundered as a credited photo — and a `site-screen` may NOT point there, so a real photo can't ship uncredited). Sourced from the repo's own credited corpus (`supabase/seed/content/**` `moment.photos`, `apps/web/lib/longlive/lenses.ts`). Requires **`photoId`** plus exact matching **`mediaCredit`** (the photographer/agency line — put it in the caption too whenever the platform's length budget allows) and **`mediaSource`**, all bound to the entry in `social/photo-library.json` by `npm run validate:social`; this prevents attribution from drifting after selection. The same binding applies to a launch `site-screen` carousel's Taylor-photo grid tile. Never an AI image; never an unlabeled stand-in (media policy, `docs/decisions.md` 2026-07-09). A `mediaCredit`/`mediaSource` that reads like a rehosted video thumbnail, or a tile under the photo prefix that is absent from the credited inventory, hard-fails — a rehosted YouTube/broadcaster thumbnail is not a "photo" (`docs/decisions.md` 2026-08-15).
  - `"site-screen"` — a deliberate product screenshot for a feature/launch post; must live under `/social/library/`. Prefer a carousel with a Taylor `photo` tile first and the screenshot as slide 2 — the grid should show Taylor.
  - `"video-thumb"` — **dead, REMOVED 2026-09-10 (kanban t_bac31b1a).** Added 2026-09-05 (#3584) as a rehosted YouTube/broadcaster thumbnail that shipped X-only with no Instagram sibling; that was itself the single-platform exception the pairing rule above already forbids, so the value is no longer schema-recognized at all — a draft declaring it hard-fails like any other unknown `mediaKind`. The appearance-discovery fast lane now sources a real credited `photo` for both platforms instead.
  - `"era-art"` — **dead.** Generic era tiles (`/eras/<id>.png`) hard-fail `check-drafts.mjs` outright, declared or not; the value stays schema-recognized only so historical `posted/` records parse. On 2026-08-06 all 17 posted IG items were era tiles; that is the failure this standard exists to end.
  - Media may not repeat any of the last 10 posted Instagram items' media as a default diversity goal. The credited-photo selector prefers less-used, longer-unseen photos, then safely reuses the least-recently-used credited entry when the inventory is exhausted; this is deliberately a warning rather than a ban so the paired calendar cannot deadlock. `social/photo-library.json` is the durable inventory and `npm run social:select-photo` produces the exact `photoId`, media path, credit, and source fields for a draft.
- `photoId`: required for every new `mediaKind: "photo"` draft. It binds a draft to one `social/photo-library.json` entry; the checker requires its media path, credit, and source to match exactly so attribution cannot drift.
- `photoEra`: **required for a `mediaKind: "photo"` draft in a THEMED campaign family; optional otherwise** (2026-09-10, kanban t_75ec7106 — the 2026-09-09 reputation/snake X post that shipped a Lover-era tour photo, docs/decisions.md; requirement tightened in PR #4062 review round 4, Fable ruling). Names the draft's target era/theme (a `social/photo-library.json` tag, e.g. `"reputation"`) — set it whenever the post IS about a specific era. **`thread:easter-eggs:*` and `heartbeat:era-deep-cut:*` campaigns are hard-required to set it** (`scripts/social/lib/queue-schema.mjs`'s `THEMED_CAMPAIGN_PREFIXES`) — those families are inherently about one specific era (an easter-eggs/thread post keyed to a lens/egg node's `eraId`, `heartbeat:era-deep-cut:<era>-*`), so shipping without declaring the era is exactly the original bug's shape and is now a hard CI failure on its own, before the tag-mismatch check even runs. `validatePhotoInventoryBinding`/`check-drafts.mjs` then require the bound `photoId`'s `tags` to include it — a themed draft whose photo doesn't match its own declared era is a hard CI failure, not a warning. Get a matching photo with `npm run social:select-photo -- --era <tag>` (also accepts `--era=<tag>`), which prints the exact `photoId`/`media`/`mediaCredit`/`mediaSource`/`photoEra` fields to copy in, and **hard-fails loudly if no photo is tagged for that era** — that is the correct outcome (delay the draft and add inventory), never a silent fallback to an unrelated era's photo. Leave `photoEra` unset only for a non-themed campaign with no single target era (a launch/mood/merch post, a cross-era roundup). **Known gap (tracked, not yet built):** `THEMED_CAMPAIGN_PREFIXES` is a static campaign-family list, not automatic derivation from the lens/egg content data (`packages/experience/src/lenses.ts`) — the validators can't see content data today, so a themed campaign OUTSIDE the two listed prefixes could still ship without a `photoEra` check. Widen `THEMED_CAMPAIGN_PREFIXES` if a new themed family is added, or file the "wire lens/egg eraId into the queue validators" follow-up to close the gap for good.
- `scheduledAt`: **this is what ships the post — and it is also the "all at once" signal.** Since 2026-07-25 (see `docs/decisions.md`) there is no per-item approval gate — when this timestamp passes, the next poster run sends it, subject only to the caps, the guards below, and `SOCIAL_FREEZE`. **A campaign's two siblings must carry the SAME `scheduledAt` (or one within a few minutes of the other)** — `check-drafts.mjs`'s simultaneous-pair check (2026-09-10, kanban t_bac31b1a) hard-fails a pair scheduled hours apart, which used to be common (e.g. one item at 15:00Z, its sibling at 23:00Z the same day, or even the day before). Choose it deliberately and never backdate.
- `approvedBy` + `approvedAt`: **optional provenance only** — a record of who signed off and when, for the cases where a human did. They no longer gate anything; the poster does not check them. (They were a hard gate until 2026-07-25.)
- `campaign`: **story-unique** (e.g. `on-this-day:red-announcement-wanegbt`), shared ONLY between the IG/X siblings covering the same story. Used by `check-drafts.mjs`'s cross-post-copy check to find an X draft's IG sibling, by the simultaneous-pair check to find the sibling's `scheduledAt`, and by the poster's idempotency check (`findPostedDuplicate`), which treats same platform + same campaign as an already-posted duplicate. A thematic bucket value reused across stories (`heartbeat:on-this-day` on five different posts) therefore false-skips every post in the bucket after its first one lands, and the 48h rule then retires them to `failed/` — found and fixed queue-wide on 2026-08-12. There is no campaign-family exception to the pairing rule any more — the 2026-09-05 `appearance:<videoId>` exemption (#3584) was removed 2026-09-10 (kanban t_bac31b1a).
- `why`: the human-readable "why this, why now" audit trail. It does not
  change routing — there is no pairing escape hatch of any kind (removed
  2026-08-26; a `Single-platform exception:` marker here does nothing now).
- `failureReason`: written by the poster (never by a drafter) when an item lands in `failed/` — a human-readable explanation, distinct from `lastError` (the raw API error text), covering the 48h-stale case too where there may never have been an API error at all.

The deterministic `content.social-post-missing` checker scans every unique
`campaign` across both `social/queue/` and `social/posted/`. A campaign without
both X and Instagram produces a P2 finding, unconditionally — there is no
exception marker that suppresses it. `social/failed/` does not satisfy the
rule: a failed item neither reached the audience nor remains queued to do so.
Historical findings are surfaced for review rather than backfilled
automatically.

## Draft-time checks (`scripts/social/check-drafts.mjs`)

Run automatically by `.github/workflows/auto-merge-content.yml` whenever a PR changes `social/queue/**.json` — a failing draft just leaves the PR for a human (same fail-safe direction as the rest of that workflow), it doesn't block anything else. Run by hand any time with `node scripts/social/check-drafts.mjs` (checks every file currently in `queue/`) or `node scripts/social/check-drafts.mjs <file>...` (just those files — same idea CI uses via `--manifest <path>`, a JSON array file, so a filename with a space never gets silently split by the shell). **A file explicitly requested but not found under `queue/` is a hard failure (exit 1), not a warning** — this never silently reports "all clear" on a possibly-broken file list.

Seven rule families, in order (later ones assume earlier ones passed):
- **Schema** — `body` must be a non-empty string, `platform` must be `x`/`instagram`, `scheduledAt` must parse to a real date. A schema failure skips every other rule for that item (they all assume well-formed input) and reports only the schema finding.
- **Voice** — reuses `scripts/content-engine/checkers/voice.mjs`'s surname-overuse, ai-tell, and wire-attribution rules against the draft's `body`.
- **Openers** — bans a body that opens with "did you know" (case-insensitive, word-boundary matched, and normalized past any leading emoji/quote/punctuation) outright, and flags a draft whose first 6 words match the opening of anything posted in the last 14 days or any other current queue item (formula detection).
- **Campaign pair** — enforces the hard pairing rule above on the merge
  path (added 2026-08-26, made unconditional later the same day). A draft
  whose `campaign` has no sibling on the other platform in `social/queue/`
  or `social/posted/` fails, so its PR does not auto-merge — no exception,
  however genuinely worded. A draft with no `campaign` at all fails too —
  nothing can be paired to it. This gate exists because the rule spent its
  first day as prose plus an advisory `content.social-post-missing` P2
  finding and nothing on the merge path enforced it: on 2026-08-26 all five
  posts that shipped were `platform: "x"`, Instagram got nothing, and both of
  that day's drafts carried a `Single-platform exception:` citing a dropped
  IG slot. The gate briefly honored a well-worded format-incompatibility
  exception while rejecting scheduling pretexts; Joey closed that carve-out
  the same day too ("Always an IG copy. Always.") once it became clear the
  marker itself was the drafting lane's escape hatch of choice. A second,
  narrower `appearance:`-family exemption (2026-09-05, #3584) reopened
  exactly this hole for one lane; it was removed 2026-09-10 (kanban
  t_bac31b1a) — there is no campaign-family exception left, of any kind.
- **Simultaneous pair** (`checkSimultaneousPair`, added 2026-09-10, kanban
  t_bac31b1a) — "all at once" means literally that: when both of a
  campaign's siblings are in `social/queue/`, their `scheduledAt` values
  must fall within `SIMULTANEOUS_WINDOW_MS` (5 minutes) of each other.
  Real queue history had X post at 15:00–22:00Z and its Instagram sibling
  ship hours later the same day (or even the day before) — that shipped
  the story to each platform's audience at a different moment, not "all
  together." A sibling that has already posted is out of scope (it can't be
  rescheduled); this only fires while both items are still drafts.
- **Cross-post copy** — an X draft whose `body` is more than 80% similar (word-overlap coefficient, not Jaccard — see the script for why) to its Instagram sibling's `body` fails. Siblings are matched by shared `campaign`; when an X draft has no `campaign`, this falls back to the closest same-day Instagram item — a near-duplicate still fails, and even a merely-plausible-looking pair gets a "you probably meant to tag these" nudge. Near-identical siblings are what triggers X's duplicate-content 403s.
- **Media** — Instagram and X drafts both need credited image media (no X-only link-preview lane remains); every media path must be a `.png`/`.jpg`/`.jpeg` and exist under `apps/web/public/`; every `"photo"` additionally requires a mandatory, exact `photoId`/path/credit/source inventory binding; era tiles fail outright. The selector prefers diversity but permits credited reuse, so a finite inventory cannot deadlock the calendar.

## Post-time guards (`scripts/social/lib/queue.mjs`, `post-queue.mjs`)

Per due item, in this order:
1. **48h staleness check, first and unconditional.** Any item still due and unposted more than 48h after its `scheduledAt` moves straight to `social/failed/` with a `failureReason` — regardless of whether it would be postable right now. This is what stops a guard/preflight skip from becoming a silent, permanent deadlock (exactly what happened to `2026-08-09-august-augustine-ig.json`, stuck re-skipping every 30 min for 2 days because the era-art guard's window only advanced when a new Instagram post landed) — a 3-day-stale item never quietly ships just because it happened to clear on the run that finally checked it.
2. **Idempotency check** — is there already a `social/posted/` record with the same platform and (`campaign` or an identical `body`)? If so, skip loudly rather than repost. This mitigates the real 2026-07-17 triple-post incident: the queue → posted state-commit PR (see `social-poster.yml`) can itself fail to land even after a genuine successful post, leaving the item still sitting in `social/queue/` for a later run to find.
3. **Era-art guard** (`eraArtGuardReason`) — undeclared or recently-repeated era art (see `mediaKind` above) — plus a same-run media dedupe, so two items posting in the same run can't reuse each other's media before `social/posted/` would even reflect it.
4. **Deploy-lag preflight** — HEAD-checks (falling back to a ranged GET if a host rejects HEAD, and requiring an image content-type) every media URL before an IG or X-with-media publish; unreachable media records the item as **`waiting`** (reported as "waiting on deploy", no attempt spent) rather than wasting a retry on a 404 — it ships itself on the first run after the deploy lands. For Instagram, the publish itself also polls each media container to `FINISHED` before calling `/media_publish` (`lib/ig-container.mjs`, issue #1897) — publishing a container Meta hasn't finished processing is what produced the 9007/2207027 "media not ready" failure, and retries can't fix it because every attempt rebuilds a fresh container and re-loses the same race.

None of 2-4 burn one of the item's 3 retry attempts, and none of them consume a per-run posting slot — **only an item that clears all four checks and is actually attempted counts against `MAX_POSTS_PER_RUN` (1 since 2026-08-26, was 5)**, so a run that selects several due-but-blocked items can't starve a later, immediately-postable item of its turn.

**Pacing (2026-08-26).** `MAX_POSTS_PER_RUN` is **1**, which makes the
30-minute run interval itself the floor on spacing between two live posts.
`scheduledAt` is the only other spacing signal in this pipeline and it stops
meaning anything the moment a batch of items lands already overdue — which is
exactly what happened on 2026-08-26T09:41Z, when four appearance-discovery X
drafts (all scheduled within 3.6 seconds of each other, all ~11h overdue by
the time their PR merged) published in a single run, 1.2 seconds apart on the
live timeline. A cap of 1 drains a backlog at one post per half hour instead
of as a burst. It is a pacing floor, not the volume policy —
`MAX_POSTS_PER_PLATFORM_PER_DAY` (**1**, since 2026-08-26, issue #3373 — was
10) is what bounds a day. "Day" is a UTC calendar day, measured from the
`postedAt` of `social/posted/` records (`countPostedToday`/`utcDateOnly`),
not a rolling 24h window. Combined with mandatory X+Instagram pairing above,
the real ceiling is one campaign — one X post plus its Instagram sibling —
per platform per UTC calendar day.

Two more failure-time behaviors: a platform missing required credentials aborts the **entire run** before touching any item (no attempts burned on a problem no retry fixes), and a transport-level failure at the actual publish moment (request sent, response never received) is recorded as `lastError: "ambiguous"` and is **never auto-retried** — retrying one is indistinguishable from manufacturing a duplicate, which is exactly the 2026-07-17 incident's mechanism.

## IG media audit (`scripts/social/list-media.mjs`, `.github/workflows/social-audit.yml`)

Manual-only (`workflow_dispatch`), never scheduled. Lists every post actually live on the linked Instagram account (not just what `social/posted/` claims — a human can delete a post in the app, which this repo never learns about) and flags likely duplicates by caption. Opens or refreshes a single "IG media audit" issue with the report. Instagram's Content Publishing API cannot delete published media at all (see `scripts/social/delete-media.mjs`'s header) — any flagged duplicate needs a founder to remove it by hand in the app.

## The crisis stop

Set the repo variable `SOCIAL_FREEZE` to `true` (Settings → Secrets and variables → Actions → Variables) and the very next run — at most 30 minutes — does nothing at all, queue untouched. Unset it (or set to empty) to resume.
