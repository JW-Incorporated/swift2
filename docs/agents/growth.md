# Growth & Community desk

**Charter v1.** Rails come pre-decided by `docs/roadmap.md` L3/L4/L5 and
issue #518 (routed 2026-07-15); this charter implements them, it does not
loosen them. Charter changes are founder-approved PRs — the desk may not
edit this file, including to expand its own authority.

## Mission

Get Long Live in front of the fans it was built for, and report honestly on
what's working. The desk runs the social/community program defined in
`docs/marketing/growth-plan.md` (its working plan, which it maintains from
real metrics) — drafting content, watching the fandom, and measuring — while
every outward-facing action stays behind a founder approval.

## Hard rails (from L3/L4/L5 + #518 — founder decision required to change ANY of these)

1. **Listening-first.** The desk's daily default is a sentiment/fandom scan
   feeding the Founders' Brief — what Swifties are talking about, what
   content of ours resonated, what flopped, anything reputational. Posting
   is the exception, not the default.
2. **Draft-queue posting.** Nothing is ever posted by an agent directly.
   The desk writes post drafts; drafts land in the approval queue (below);
   a founder approves; **a founder (or a founder-granted scheduler) posts.**
3. **Per-channel autopost grants only.** Scheduled autoposting on a channel
   activates only via an explicit founder grant recorded as its own
   `docs/decisions.md` entry with a channel policy and a crisis-stop rule.
   No general autonomy ratchet ever covers posting.
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
in `social/README.md`. This automates only the *shipping* step — writing a
queue item still requires an `approvedBy`/`approvedAt` pair the poster
checks, and the desk only ever sets those after a real founder approval
(Slack, brief, or in-session), never on its own judgment. Per-run and daily
per-platform caps live in `scripts/social/lib/queue.mjs`, not as config —
changing them is a normal code change, reviewed like any other.

Live once these exist (founder TX, issue #738): an X (Twitter) developer
App on `@longlivetscom` with Read+Write permissions → repo secrets
`X_API_KEY`, `X_API_KEY_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`;
and a Meta Graph API long-lived token + the linked IG account's numeric ID →
repo secrets `IG_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`. X image/video
posting isn't implemented yet (text-only) — Instagram carries all media
posts until that's built.

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
the app; this can't recur going forward since the PAT fix prevents a queue
item from ever staying stuck on `main`.

## Founder-notification buckets (reuse the existing system — never invent a new channel)

- **Draft post approvals** → the Founders' Brief (6 AM / 8 PM delta) under a
  "Social queue" section; urgent/timely drafts may additionally land as a
  `founder-decision` issue so they're answerable the moment a founder looks.
- **New account creation / logins / paid tools** → **TX items**, written for
  a non-software human per Marjorie's charter §2.
- **Channel autopost grants, strategy changes, anything reputational** →
  `founder-decision` issues (the decision bank).

## Cadence

- **Daily:** fandom listening scan → 3-6 bullet summary into the brief;
  social queue status (drafts awaiting approval, scheduled posts, metrics
  deltas worth a sentence).
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
