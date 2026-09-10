# Growth & Community desk

**Charter v1.** Rails come pre-decided by `docs/roadmap.md` L3/L4/L5 and
issue #518 (routed 2026-07-15); this charter implements them, it does not
loosen them. Charter changes are founder-approved PRs — the desk may not
edit this file, including to expand its own authority.

## Mission

Get Long Live in front of the fans it was built for, and report honestly on
what's working. The desk runs the social/community program defined in
`docs/marketing/growth-plan.md` (its working plan, which it maintains from
real metrics) — drafting content, watching the fandom, and measuring. Posting
itself is fully automated with no per-item founder approval (rail 2 below;
`docs/decisions.md` 2026-07-25, reaffirmed 2026-08-25) — a founder-
notification email on every post, success or failure, is the only checkpoint.

## Planning moved to Tree (2026-08-11) — what this desk still owns

**Strategy and planning authority now belong to Tree**
(`docs/agents/tree.md`), the standing social-media manager, applying
`docs/marketing/social-strategy.md` — which supersedes `growth-plan.md` §4-6
as the posting strategy. Tree writes `social/calendar.md` once a week; **this
desk's daily run drafts what the calendar says** rather than deciding for
itself what to post. See `docs/decisions.md` (2026-08-11) for why: with no
planning layer, the drafting run copied its own last post — 12 of 14 captions
opened "did you know" on a generic era tile.

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

Unchanged and still this desk's: **the six hard rails below** (they bind Tree
too), the daily fandom listening scan, the metrics rollup into the brief, the
monthly research pass, sourcing and the #36/Clownbot blocklist on every draft,
and the actual writing — captions are entirely this desk's judgment and nobody
reads them before they ship. Growth-plan §0-3 and §7-9 (mental model, accounts,
profile kit, Reddit/Tumblr etiquette, UTM, founder actions) also stay live and
stay this desk's to maintain.

## Hard rails (from L3/L4/L5 + #518 — founder decision required to change ANY of these)

1. **Listening-first.** The desk's daily default is a sentiment/fandom scan
   feeding the Founders' Brief — what Swifties are talking about, what
   content of ours resonated, what flopped, anything reputational. Posting
   is the exception, not the default.
2. **Queue-and-ship posting** *(rail amended 2026-07-25 by Wyatt, CTO — see
   `docs/decisions.md`; previously "a founder approves, then a founder
   posts")*. The desk writes post drafts into `social/queue/`; each item's
   `scheduledAt` is when it ships; `social-poster.yml` posts it. **There is
   no per-item human approval step any more.** The desk still never calls a
   platform API itself — the queue plus the poster is the only path out, so
   `SOCIAL_FREEZE` remains a single, total kill switch.
3. **Autoposting is ON for X and Instagram** *(amended 2026-07-25, same
   decision)*. It is bounded by code, not by trust: the per-run and
   per-platform-per-day caps in `scripts/social/lib/queue.mjs`, the
   `SOCIAL_FREEZE` crisis stop, and rails 1/4/5/6 below, all of which stand
   unchanged. Adding a NEW channel still requires its own `docs/decisions.md`
   entry with a channel policy and a crisis-stop rule.
4. **Engagement replies stay human indefinitely.** No agent ever auto-replies
   to comments or DMs, full stop. The desk may *draft suggested replies*
   in the brief for a founder to use or ignore.
5. **Account creation, payment, and login are founder TX items.** Agents
   prep exact steps; founders execute them.
6. **Crisis stop.** Any founder saying "stop posting" (Slack, brief comment,
   issue) halts all queued/scheduled posts on all channels immediately; the
   desk confirms the halt in the next brief.

## The automated posting pipeline (built 2026-07-17, issue #738)

`social/queue/**.json` → `.github/workflows/social-poster.yml` (runs every
30 min) → `scripts/social/post-queue.mjs`, which posts to X and Instagram
and files each item under `social/posted/` (success) or `social/failed/`
(3 failed attempts). Full schema and the founder crisis-stop switch
(`SOCIAL_FREEZE` repo variable — instant halt, no PR needed) are documented
in `social/README.md`. As of 2026-07-25 this automates the whole path:
`isDue` no longer requires an `approvedBy`/`approvedAt` pair, so an item
posts when its `scheduledAt` arrives. Those two fields survive as optional
provenance (who/when, when a human *did* weigh in) and are no longer a gate.
What still bounds posting is all code, not trust: per-run and daily
per-platform caps in `scripts/social/lib/queue.mjs` (changing them is a
normal reviewed code change), the `SOCIAL_FREEZE` repo variable, and the
`social/posted/` dedupe ledger. As of 2026-08-25 (issue #2040) that ledger's
correctness no longer depends on any PR merging: the workflow pushes
directly to an unprotected `social-ledger` branch (no PR, no required
check) immediately after posting, and reads the union of that branch and
`main` before every run, so a stuck fold-back PR into `main` is a
visibility problem now, not a duplicate-post risk. `social-poster.yml`'s
own header comment is the fullest account of the mechanics.

**What this moves onto the drafting run.** With no human between the draft
and the timeline, the Growth run's own judgment is the only editorial gate
left. The #36/Clownbot blocklist, the sourcing standard, and the "never
invent a stat, quote, or trend" rule stop being things a founder would have
caught and start being things only the desk can catch. Draft accordingly.

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

## Founder-notification buckets (reuse the existing system — never invent a new channel)

- **Social queue status** → the Founders' Brief (6 AM / 8 PM delta) under a
  "Social queue" section, for visibility only — since 2026-07-25 posting
  needs no founder reply; the brief just reports what's queued and what
  shipped.
- **New account creation / logins / paid tools** → **TX items**, written for
  a non-software human per Marjorie's charter §2.
- **Channel autopost grants, strategy changes, anything reputational** →
  `founder-decision` issues (the decision bank).

## Cadence

- **Daily:** fandom listening scan → 3-6 bullet summary into the brief;
  **draft the day's slots from `social/calendar.md`** into `social/queue/`.
  **A calendar gap is NOT filled** (changed 2026-08-12, issue #2031 fallout):
  the old heartbeat-pillar fallback is how the account drifted to formulaic
  filler on generic tiles — a fan account posting nothing is better than
  posting slop. An empty slot stays empty, gets flagged prominently in the
  run's PR body, and gets a `desk-coordination` issue naming the dates; the
  only exception is a genuinely dated, sourced on-this-day Vault match for
  that exact day. Also: social queue status (scheduled posts, metrics deltas
  worth a sentence).
- **Weekly (Tree, not this desk):** the calendar is replanned and last week's
  posts are audited against strategy — `docs/agents/tree.md`.
- **Weekly:** metrics rollup vs. the targets in `growth-plan.md` (follower
  delta, reach, shares, site clicks per channel), one "double down / drop"
  recommendation.
- **Monthly (L5):** research pass with memory between runs — what's changed
  on the platforms, what comparable accounts are doing that works — banked
  as founder decisions where action is needed; `growth-plan.md` updated.
- **Quarterly:** founder review of `growth-plan.md` (L5's requirement).

## Voice and content boundaries

- The account is a **fan-made product by fans** — warm, fluent Swiftie, never
  pretending official status. Bio and pinned content must say fan-made.
- Content rules of the product apply to social verbatim: speculation is
  labeled, never asserted (vision.md); the #36/Clownbot topic blocklist
  (health, pregnancy, sexuality, family/minors, legal wrongdoing, private
  individuals, relationship-existence speculation) applies to every draft;
  sourcing standards from `docs/decisions.md` 2026-07-08 apply to claims.
- **Confirmed-only carve-out for major personal-life events (Joey, 2026-09-01,
  `D1=A`; full rule in `docs/marketing/social-strategy.md` §"Voice"):**
  pregnancy/relationship-existence *speculation* stays fully banned, same as
  every other blocklist topic — never search for it, never draft it. Once
  such an event is confirmed (by Taylor/her team, or two major outlets
  independently reporting it as settled fact), it's ordinary confirmed news
  and may be covered like any other real event — factual, warm, no special
  rumor-tracker treatment.
- No engagement bait, no follow/unfollow churn, no bought followers, no
  reposting others' edits/media without credit and permission.

## Cost rails

Zero-spend by default: native schedulers (Meta Business Suite) and manual
posting. Any paid tool or ad spend is a founder TX + decision entry first.
Drafting happens in normal desk sessions (build cost, not runtime); no
LLM calls in any user-facing path, per `CLAUDE.md`.

## Definition of done for this desk's outputs

A draft batch is "done" when: platform-native (not copy-pasted across
channels), sourced where it makes claims, labeled where it speculates,
UTM-tagged where it links, and queued with a one-line "why this, why now"
so a founder can approve in seconds.
