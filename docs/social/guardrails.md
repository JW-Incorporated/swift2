# Social guardrails — the founder-owned list

**Founder-owned. Never auto-merged** (`docs/social/guardrails.md` is in
`NEVER_ALLOWLIST`, `scripts/check-automerge-allowlist.mjs`). **Tree and
Marjorie may not edit this file** — a change to it is the owner's, by PR.
Added 2026-10-01 (owner instruction, `docs/decisions.md` 2026-10-01): the owner
is in the reviewing/approving business, not the rule-making business.
**Signed off by the owner in chat 2026-10-01** (rows 1–5 as written; row 6
reworded at his request). **Row 2 reworded by the owner in chat 2026-10-01**
(uncredited photos are fine — see the normative text below; edited here on his
explicit instruction, `docs/decisions.md` 2026-10-01).

**Everything not listed here is Tree's and Marjorie's to decide** — format
(photo, card, screenshot, text), cadence, hooks, pillars, experiments, targets,
calendar. Tree owns execution and format (`docs/marketing/social-strategy.md`,
`social/calendar.md`, `social/lessons.md`, `social/strategy-params.json`);
Marjorie owns growth goals; **Fable rules** on any taste dispute between them
(`taste-ruling` issue). Only a matter that touches this file goes to the owner.

| # | Guardrail | Where it is enforced |
|---|---|---|
| 1 | **Nothing posts without a signed stamp** (HMAC). **Amended by the owner, 2026-10-09 (final): the per-post founder ✅ is retired for IG/X** — Tree clears his own drafts via `social-tree-approve.yml`, which mints a signed v4 `tree-auto` stamp (the dispatcher and the PR author must be a committed Tree identity; only `social/queue/*.json` plus referenced `.png/.jpg/.jpeg` ≤1.5MB; refuses `scheduledAt` more than 48h ahead; refuses under `SOCIAL_FREEZE`; trusted `check-drafts`; stamp removed if a run fails). During the transition the owner's ✅ prompt still appears for `tree/draft/*` PRs as a fallback; it is not required. Unchanged: `SOCIAL_FREEZE`, the poster's per-run caps (1 per run, 1 per platform per day, 48h staleness). Reddit and Facebook are posted by the owner from Tree's paste-ready cards | `.github/workflows/social-tree-approve.yml`, `scripts/social/lib/approvers.mjs`, `stamp-approval.mjs`, `social-approval-poll.mjs`, `scripts/automerge-social-approval-gate.mjs`, `lib/queue.mjs`, `post-queue.mjs` |
| 2 | **Rights.** Credit the photographer whenever we know who they are; when we don't, the photo may post with no credit line; takedown on request, no argument; no watermarked images and no fan edits without the creator's permission; no lyrics in cards | known credit bound to the library entry, `mediaSource` required: `check-drafts.mjs` `checkMedia` + `lib/queue-schema.mjs` (hard-coded, not in `strategy-params.json`); no-lyrics: Tree's rubric gate (`notEmbarrassed` ≥4) and takedown on request (not machine-checkable) |
| 3 | **No AI-generated images of Taylor** | `check-drafts.mjs` media-kind/inventory gate (`era-art`/uncleared images rejected); Tree's rubric gate |
| 4 | **Sensitive personal-life topics are confirmed-only**; no fabricated facts; never speak as Taylor; always labelled fan-made | the normative text below (moved here from the strategy doc, which Tree can edit); `check-drafts.mjs` voice rules; Tree's rubric gate |
| 5 | **Platform limits.** X 280 weighted characters; Instagram needs an image in its aspect window; a story-unique `campaign` on every item; no Reels/video (not automatable) | `check-drafts.mjs` `checkLength`/`checkMedia`/`checkCampaignPair`, `lib/queue-schema.mjs`, `lib/platforms.mjs` |
| 6 | **Replies and DMs are human — for now.** The owner answers every reply and DM himself and must be notified of each one. Automated replies to real people are expected once the account is big enough; switching them on is an owner decision, not a ban. No new channel, account, payment or spend without the owner (paid X API metrics declined 2026-10-01). Never tease an unshipped feature | `docs/agents/tree.md` rails; `scripts/check-routine-workflows.mjs`; owner ✅ |

Guardrail checks live in code and have **no parameter**: `social/strategy-params.json`
holds taste thresholds only and cannot switch any row above off.

A content or social `DECIDE` item reaches the owner **only if it touches this
file**. Anything else is a Fable ruling, never an owner question.

## Normative text (moved verbatim from `docs/marketing/social-strategy.md`, 2026-10-01)

The strategy doc is Tree's and lands without a founder merge, so the guardrail wording
itself lives here, where Tree cannot edit it. The strategy doc, `docs/agents/tree.md` and
Tree's prompts point to this section.

### Guardrail 2 — Rights posture and the no-lyrics redline

**Rights posture** (decision entries 2026-07-09 and 2026-08-12; the
2026-08-11 entry's *ladder* is superseded, its rights bars are not): hosting real
internet photos is unrestricted — embed, hotlink, or rehost, press/agency all
fine — as a knowing accepted risk. **Credit the photographer whenever we know
who took the photo; when we don't, the photo may post with no credit line**
(owner, chat, 2026-10-01: "I'm ok with uncredited photos. If we know who took
the photo, we should always give them credit, but if we don't that's fine too,
just post it… We must prioritize getting more photos and uncredited photos are
going to be the bulk of our content"). A missing credit is never printed as
"unknown" or "u/unknown" — the caption simply has no credit line;
takedown-on-request without argument. The hard bars: **no AI-generated
images, ever**, and any reference/comparable stand-in must be visibly labeled
as such (never passed off as Taylor). No watermarked images, no fan edits
without the creator's permission. Clickability is priority #1 — a
rights-clean but boring tile is the failure mode we corrected, not the safe
default.

Cards: **cards never reproduce lyrics** — titles, dates, numbers, and sourced quotes
only, the same no-lyrics line the Mood starter chips hold (docs/decisions.md
2026-07-09 lyrics entry).

### Guardrail 4 — Sensitive topics, no fabrication, confirmed-only carve-out

The `#36`/Clownbot blocklist (health, pregnancy,
sexuality, family/minors, legal wrongdoing, private individuals,
relationship-existence speculation) applies to every draft, and nothing is ever
invented — no stat, quote, or trend without a Vault item or a verifiable source
behind it.

**Major personal-life events — confirmed-only carve-out (Joey, 2026-09-01,
`D1=A`).** The blocklist above still bars searching for, drafting, or posting
any pregnancy or relationship-existence *speculation* — that stays absolute,
zero exceptions, same as every other rumor-stage topic on this list. The one
change: once a major personal-life event (pregnancy, engagement, marriage, and
comparable milestones) is **confirmed** — by Taylor or her team directly, or
independently reported as settled fact by two major outlets — it is no longer
"speculation" and social may cover it like any other confirmed public news
event (the same treatment a Grammy win or a tour date gets): warm, factual,
sourced, celebratory. It never gets a "clues/countdown/rumor tracker"
treatment the way an album rollout does — that framing is reserved for
product launches and creative rollouts, not a person's private life. Until
confirmation, silence; the moment it's confirmed, normal coverage. This
carve-out is social-caption policy only (this file, `docs/agents/tree.md`,
`docs/agents/runner-prompts/tree-daily-draft.md`) — it does not touch the
site's Vault/editorial pipeline or the Clownbot safety gate, which remain
governed by their own docs and are outside Tree's mutation
rights.
