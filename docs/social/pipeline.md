# Social posting pipeline — mechanics and incident history

Engineering mechanics and incident history for the social posting pipeline,
moved out of the charter (`docs/agents/tree.md`, linked from its "Mission +
scope" area) so the charter stays something a founder actually finishes
reading (Tree Overhaul T1, 2026-09-12 — `docs/agents/growth.md` folded into
Tree; this file holds what moved out as history/mechanics rather than
charter). Nothing here is a rule Tree must follow going forward — those live
in `docs/agents/tree.md`'s Hard invariants; this is how the pipeline works
and what has broken before.

## The automated posting pipeline (built 2026-07-17, issue #738)

`social/queue/**.json` → `.github/workflows/social-poster.yml` (runs every
30 min) → `scripts/social/post-queue.mjs`, which posts to X and Instagram
and files each item under `social/posted/` (success) or `social/failed/`
(3 failed attempts). Full schema and the founder crisis-stop switch
(`SOCIAL_FREEZE` repo variable — instant halt, no PR needed) are documented
in `social/README.md`. As of 2026-09-10, reaching `social/queue/` on `main`
at all requires a founder's PR merge (the approval gate above); from there,
`isDue` still just checks `scheduledAt`, so an approved item posts when its
`scheduledAt` arrives with no further per-item check. `approvedBy`/
`approvedAt` are written automatically by the poster as an audit trail
(not hand-set by a drafter) via a GitHub API lookup (`merged_by`/
`merged_at` on the commit's associated PR) — local git metadata can't
identify who clicked Merge on a GitHub squash merge, so this deliberately
isn't a `git log` field; see `social/README.md`'s note and `DEBUG.md`.
Either way, not something the poster blocks on. What still bounds posting
is all code, not trust: per-run and daily
per-platform caps in `scripts/social/lib/queue.mjs` (changing them is a
normal reviewed code change), the `SOCIAL_FREEZE` repo variable, and the
`social/posted/` dedupe ledger. As of 2026-08-25 (issue #2040) that ledger's
correctness no longer depends on any PR merging: the workflow pushes
directly to an unprotected `social-ledger` branch (no PR, no required
check) immediately after posting, and reads the union of that branch and
`main` before every run, so a stuck fold-back PR into `main` is a
visibility problem now, not a duplicate-post risk. `social-poster.yml`'s
own header comment is the fullest account of the mechanics.

**What this still means for the drafting run.** A founder now reads every
caption before it can ship (the 2026-09-10 approval gate), but that founder
look is a fast yes/no on the prompt in `#longlive-tree`, not an editorial
pass — the desk's own judgment is still the real editorial gate. The
#36/Clownbot blocklist, the sourcing standard, and the "never invent a stat,
quote, or trend" rule are still things only the desk reliably catches; don't
draft assuming a founder will fact-check for you. Draft accordingly.

Live once these exist (founder TX, issue #738): an X (Twitter) developer
App on `@longlivetscom` with Read+Write permissions → repo secrets
`X_API_KEY`, `X_API_KEY_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`;
and a Meta Graph API long-lived token + the linked IG account's numeric ID →
repo secrets `IG_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`. X posts can carry
images too (as of 2026-08-11, WS1+WS5 — up to 4, uploaded via the v1.1 media
endpoint in `scripts/social/lib/platforms.mjs`); video is still not
implemented on either platform.

**Facebook Page cross-posting (2026-07-17):** every Instagram post also
posts to the linked Facebook Page's own feed as a genuinely separate post —
the Graph API has no "also share to Facebook" flag for automated posts, so
this is a second real API call (`postToFacebookPage` in
`scripts/social/lib/platforms.mjs`), not a toggle. It's best-effort: a
Facebook failure is logged loudly but never fails or retries the Instagram
post it rode in on, since that one already succeeded and is the thing the
founder actually approved. Requires `FB_PAGE_ID` (the Page's numeric ID —
not sensitive, safe as a plain secret) and the *same* `IG_ACCESS_TOKEN`
regenerated to include the `pages_manage_posts` scope (the original
Instagram-only permission set — `instagram_basic`, `instagram_content_publish`,
`pages_read_engagement`, `business_management`, `pages_show_list` — is all
read-oriented for Pages and doesn't cover writing to the Page's feed).
Omitting `FB_PAGE_ID` entirely skips cross-posting with no error.

**State-commit identity (2026-07-17):** the workflow's own "record what
posted" commit runs as Joey (repo secret `SOCIAL_POSTER_PAT`, a fine-grained
PAT scoped to just this repo — Contents + Pull requests read/write, ~1yr
expiry), not the default `GITHUB_TOKEN`. Not a style choice — GitHub's
built-in token can't trigger other workflows on what it pushes, so a PR it
opens can never get the required `build` check to run and sits permanently
stuck (hit this for real on the pipeline's first live content post, #783).
A real user's token doesn't carry that restriction. Needs rotating before
it expires or every future post silently reverts to that stuck state.

**Duplicate-post incident (2026-07-17, pre-PAT-fix):** before the fix above,
the Draft 4 anniversary post went live on Instagram three times (22:48,
22:52, 23:52 UTC) — each stuck state-commit PR left the queue item on
`main`, so the next scheduled run saw it as still-unposted and reposted it.
X's own duplicate-content check blocked its 2nd/3rd attempts (403);
Instagram has no such guard. Only the first post's PR (#766) is the
merged/authoritative record; the two duplicate-post PRs (#767, #776) were
closed unmerged. Cleanup attempted via `scripts/social/delete-media.mjs`
found Instagram posts can't be deleted through the API at all (see that
file's header) — the two duplicate Instagram posts need manual deletion in
the app. The PAT fix removed that particular trigger — but the same disease
DID recur on 2026-08-11/12 through a different strand (the auto-merge
allowlist never covered `social/posted/`, and PR #1900's disarm-on-decline
then stranded every success-recording state PR; see issue #2031 and
`docs/decisions.md` 2026-08-12). The durable lesson: ANY stranded state PR
means a stale ledger, whatever stranded it. PR #2039 made that fail closed
(refuses to post, loudly) while one is open; issue #2040 (2026-08-25) then
removed the dependency on that PR merging at all — see the paragraph above
and `docs/decisions.md` 2026-08-25. A state PR should still always be
merged, never closed (it's `main`'s audit trail), but a stuck one can no
longer manufacture a duplicate the way it did here.

**The silent outage (2026-07-21 → 2026-08-04, found 2026-08-11):** eleven X
queue items hit `403 {"detail":"You are not permitted to perform this
action."}` on all three attempts and were binned into `social/failed/`, and
**every one of those social-poster runs finished green** — the poster caught
the error, logged it to a console nobody reads, and exited 0. Run
[30981473515](https://github.com/JW-Incorporated/swift2/actions/runs/30981473515)
is the canonical receipt: conclusion `success`, log line
"2026-08-04-mine-rush-release-x.json failed 3 times, moved to
social/failed/". X posting recovered on its own from 2026-08-05 (six
consecutive nights of real tweet ids in `social/posted/*-x.json`) with no code
change, so the 403's cause was never established — nothing was watching.
Fixed at the reporting layer, not the cause: the poster now exits non-zero on
a permanent failure, annotates the run, and titles the queue-state PR
`— ⛔ A POST FAILED` (see `docs/decisions.md`, 2026-08-11). **If it recurs,
the check is the X developer portal for the `@longlivetscom` app: User
authentication settings → App permissions must be *Read and Write*, and the
Usage page shows whether the monthly post cap was hit. If permissions were
Read-only, fix them AND regenerate the access token — an existing token keeps
the scope it was minted with.** That is a founder action (credential
surface), never an agent's.

**It was never X-only.** The twelfth item in `social/failed/` is
`2026-07-27-all-too-well-scarf-metaphor-ig.json` — a real Instagram post
(the Red "scarf is a metaphor" deep cut), killed just as silently by Meta
error `9007`/`2207027`, "the media is not ready for publishing". The swallow
was in `post-queue.mjs`'s platform-agnostic catch block; X was simply failing
often enough to be noticed. Its root cause — publishing an IG media container
without waiting for `status_code: FINISHED` — is tracked as **#1897**. Note
for whoever picks that up: the Meta payload says `is_transient: false` while
its own `error_user_msg` says "please wait for a moment", so a
"don't retry non-transient errors" rule would make this failure permanent on
the first attempt. Don't add one without excluding `9007`/`2207027`.

**What "0 posts" in the brief used to mean (fixed 2026-08-11):** the Growth
line's post count was `postsToday`, taken by `growth-snapshot.yml` at 11:05
UTC against a queue scheduled for 23:00–23:20 UTC — so it read 0 on days that
posted perfectly well, and it summed all platforms, hiding a dark channel
behind an active one. It now reports `postsLast24h` per platform
(`X 1/IG 1/FB 0`). A brief showing `X 0` for **followers** is a genuine read
from the X API, not a bug: the account really does have ~0 followers.

## The appearance-discovery fast-lane gap (2026-08-31, kanban `t_895c2ba8` — closed by T6, 2026-09-12)

**Known gap (2026-08-31, kanban t_895c2ba8 root-cause):** the
`appearance-discovery` fast lane (`.github/workflows/appearance-discovery.yml`,
`scripts/appearance-discovery/`, decided 2026-08-25) drafts and queues its
own X+Instagram pairs directly, **entirely outside this desk and outside
Tree's calendar.** It is template-generated (not desk-authored, not
LLM-judged) and Tree itself did not know it existed until finding it live in
`social/queue/` (see `social/calendar.md`'s open incident, issue #3584). Its
2026-08-31 captions triggered a founder complaint and `SOCIAL_FREEZE` — fixed
at the template level in that PR, but the lane's structural gap (no
planning-layer review, no desk judgment) remains a founder decision: whether
it should route through Tree/Growth like every other post, or stay
intake-issue-only until it can.

Closed by T6 (`docs/specs/tree-overhaul/t6-side-doors.md`, 2026-09-12): the
merch and appearance side doors no longer write captions or queue drafts at
all — they write a fact sheet to `social/inbox/`, and Tree drafts (or
declines) any post from it in its own next daily run, under the same
founder ✅ gate as every other post.
