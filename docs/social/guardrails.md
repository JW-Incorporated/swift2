# Social guardrails — the founder-owned list

**Founder-owned. Never auto-merged** (`docs/social/guardrails.md` is in
`NEVER_ALLOWLIST`, `scripts/check-automerge-allowlist.mjs`). **Tree and
Marjorie may not edit this file** — a change to it is the owner's, by PR.
Added 2026-10-01 (owner instruction, `docs/decisions.md` 2026-10-01): the owner
is in the reviewing/approving business, not the rule-making business.

**Everything not listed here is Tree's and Marjorie's to decide** — format
(photo, card, screenshot, text), cadence, hooks, pillars, experiments, targets,
calendar. Tree owns execution and format (`docs/marketing/social-strategy.md`,
`social/calendar.md`, `social/lessons.md`, `social/strategy-params.json`);
Marjorie owns growth goals; **Fable rules** on any taste dispute between them
(`taste-ruling` issue). Only a matter that touches this file goes to the owner.

| # | Guardrail | Where it is enforced |
|---|---|---|
| 1 | **Founder ✅ before anything posts** (HMAC-signed stamp); `SOCIAL_FREEZE`; the poster's per-run caps | `scripts/social/lib/approvers.mjs`, `stamp-approval.mjs`, `social-approval-poll.mjs`, `scripts/automerge-social-approval-gate.mjs`, `lib/queue.mjs`, `post-queue.mjs` |
| 2 | **Rights.** A credit on every photo; takedown on request, no argument; no watermarked or uncredited fan edits; no lyrics in cards | credit/source: `check-drafts.mjs` `checkMedia` + `lib/queue-schema.mjs` (hard-coded, not in `strategy-params.json`); no-lyrics: the approval post and the owner's ✅ (not machine-checkable) |
| 3 | **No AI-generated images of Taylor** | `check-drafts.mjs` media-kind/inventory gate (`era-art`/uncleared images rejected); owner ✅ |
| 4 | **Sensitive personal-life topics are confirmed-only**; no fabricated facts; never speak as Taylor; always labelled fan-made | `docs/marketing/social-strategy.md` Voice carve-out as written by the owner; `check-drafts.mjs` voice rules; owner ✅ |
| 5 | **Platform limits.** X 280 weighted characters; Instagram needs an image in its aspect window; a story-unique `campaign` on every item; no Reels/video (not automatable) | `check-drafts.mjs` `checkLength`/`checkMedia`/`checkCampaignPair`, `lib/queue-schema.mjs`, `lib/platforms.mjs` |
| 6 | **Replies and DMs stay human.** No new channel, account, payment or spend without the owner. Never tease an unshipped feature | `docs/agents/tree.md` rails; `scripts/check-routine-workflows.mjs`; owner ✅ |

Guardrail checks live in code and have **no parameter**: `social/strategy-params.json`
holds taste thresholds only and cannot switch any row above off.

A content or social `DECIDE` item reaches the owner **only if it touches this
file**. Anything else is a Fable ruling, never an owner question.
