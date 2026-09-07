# Definition of Done — the bar before the big marketing push

**Source: Joey + Wyatt, in-person, 2026-08-11.** These eight items are the
founders' definition of "done" for LongLive in the short term: **all eight
complete before any large marketing push.** Documented from Joey's raw notes
the same day (his action item from that meeting), specced by Claude.

**Naming note:** `CLAUDE.md` also has a "Definition of done" — that one is the
*per-feature engineering* checklist (tests pass, review clean, etc.) and still
applies to every PR. THIS file is the *product* definition of done: what the
site must be before we drive real traffic at it. If a founder says "definition
of done" about the product or the marketing push, they mean this file.

**Relationship to `docs/launch-readiness.md`:** that file tracked the original
launch gates (most now 🟢) and Marjorie's brief reads it. This list is the
successor bar. **2026-08-23: Marjorie's brief now reads THIS file** — the
rework Wyatt was assigned never landed, and the gap was blocking exactly the
"why isn't this moving" reporting Joey asked for. `launch-readiness.md`
stays as the historical record; nothing here changes it.

Rules, same as launch-readiness: statuses update freely with a PR link; items
are added/removed only by founder decision. Each item below inherits
CLAUDE.md's workflow — anything non-trivial gets a spec approved before code.
**Every non-green item names who it's blocked on** — `founder`, `agent`, or
`nobody` (same vocabulary as launch-readiness.md rule 3 — `nobody` means
unstaffed, not stuck, and it's the most actionable answer this table has).

## Audit-reporting scope convention

**Any audit summary relayed to the founders — Discord, kanban comments, PR
bodies, Founders' Brief entries — must state its scope in its first line.**
E.g. "prose + sourcing only; photos not checked." A green/pass verdict that
doesn't say what it checked reads as site-wide quality assurance even when
it wasn't, which is exactly how the 09-05 "newest posts have no photos"
incident happened: the 09-04 era quality audits were honest, narrowly-scoped
reviews of voice/fabrication/sourcing, but the summary passed up to the
founder didn't repeat that scope, so a real (and already-flagged-elsewhere)
photo gap read as covered when it wasn't. See
[`docs/audits/2026-09-05-newest-posts-no-images-root-cause.md`](audits/2026-09-05-newest-posts-no-images-root-cause.md)
§3/§5 for the full incident. This is a reporting convention, not a new
automated check — any future audit-writing agent or routine should lead
with scope before its verdict.

## Status at a glance

| # | Item | Status | Blocked on | Next action |
|---|---|---|---|---|
| 1 | Landing page rethink (scroll-first + obvious nav) | 🟢 done — Joey ruled the current landing page is perfect as-is, no rethink needed (2026-08-25, see `docs/decisions.md`) | — | none — closed |
| 2 | End Game vs Blank Spaces cards differentiated | 🟢 done — Joey checked both cards on his phone, confirmed distinguishable ([#2053](https://github.com/JW-Incorporated/swift2/pull/2053), confirmed 2026-08-25) | — | none |
| 3 | Clue Web vs Decode cards differentiated | 🟢 done — Joey checked both cards side by side, confirmed distinguishable ([#2062](https://github.com/JW-Incorporated/swift2/pull/2062), confirmed 2026-08-25) | — | none |
| 4 | Marketplace + Community sections | 🟡 Marketplace moving — autonomy plan + spec adopted on Joey's D1/D3 decisions ([#3439](https://github.com/JW-Incorporated/swift2/pull/3439), [#3441](https://github.com/JW-Incorporated/swift2/pull/3441), `docs/SPEC.merch-autonomy.md`); zero-LLM engine build underway ([#3448](https://github.com/JW-Incorporated/swift2/pull/3448)); the affiliate/monetized layer is gated on external IP-counsel sign-off (`HUMAN-ACTIONS.md` #27, SPEC R7). Community section: still not started, needs its own spec | agent (Marketplace) · nobody (Community) | Marketplace: land the engine lanes per `docs/SPEC.merch-autonomy.md`; Community: spec → founder approval → build |
| 5 | Every link on the site works | 🟡 engineering work not yet done — Karen's nightly link-liveness check (`scripts/check-link-liveness.mjs`) already covers source URLs; shop/product links aren't in that sweep yet and no single full-site pass has ever run | agent | Widen Karen's nightly to shop/product links + run one full-site pass |
| 6 | Every video, chronological, + video filter | 🟡 sourcing underway — the official-YouTube catalog audit ([#3286](https://github.com/JW-Incorporated/swift2/issues/3286)) merged 5 batches on 2026-08-25 (~76 videos: [#3298](https://github.com/JW-Incorporated/swift2/pull/3298), [#3311](https://github.com/JW-Incorporated/swift2/pull/3311), [#3331](https://github.com/JW-Incorporated/swift2/pull/3331), [#3335](https://github.com/JW-Incorporated/swift2/pull/3335), [#3338](https://github.com/JW-Incorporated/swift2/pull/3338)), and era placement now follows real-world upload date ([#3315](https://github.com/JW-Incorporated/swift2/pull/3315), decision 2026-08-25). The video *filter* UI and the completeness-tier spec are still unbuilt | agent | Land the remaining catalog batches (3 open, merge-conflicted); then tier spec + filter UI |
| 7 | Clown bot | 🟢 chat feature live and shipped (agent loop, streaming, investigation trail). Memory/session feature: PR #2328 merged 2026-08-24 after a 5-round review (architecture escalation, redesign, 2 verification rounds) — code is genuinely ready, independently reviewed clean. Not turned on yet — that's a founder action, not an engineering gap: apply the pending migrations and flip the Supabase anon-auth toggle when ready ([`HUMAN-ACTIONS.md`](../HUMAN-ACTIONS.md) #14/#15) | founder | Apply migrations + flip the toggle whenever you're ready — nothing left blocking it |
| 8 | Era/album capitalization audit | 🟡 staffed 2026-09-05, work not yet landed | agent (kanban swift2/t_a783eb4c) | Audit + fix + add a checker so it can't regress |

Legend: 🟢 done (criterion met, verified) · 🟡 moving · ⬜ not started ·
🔴 blocked, says on what.

---

## 1. Landing page rethink — CLOSED, no rework needed (2026-08-25)

**Resolution:** Joey reviewed the current landing page and ruled it's perfect
as-is — no rethink, no new spec, no rework. This item is done; the problem
statement and acceptance criteria below are kept as historical record of what
was considered, not as an open spec. See `docs/decisions.md` 2026-08-25.

**The problem (Joey/Wyatt), as originally framed:** the landing experience is the eras, and a new
user may not "get it." Nobody arriving cold knows what a "thread" is. The main
navigation (Eras, Threads, Mood — plus Marketplace and Community once item 4
exists) isn't obvious.

**Direction (Wyatt):** behave like any modern feed app — the user lands
*directly in scrollable content* (no explainer screen standing between them
and the site), but the navigation is unmistakable: clearly labeled, always
visible, and each section self-explanatory at a glance. Joey's framing: "an
interesting design problem" — treat it as one, not as a nav-bar tweak.

**Acceptance criteria:**
- A first-time visitor lands in content they can immediately scroll, mobile
  first (this is the "doom scroll" requirement).
- All top-level sections are visible without interaction, labeled so a new
  user can predict what's behind each — "Threads" must be glossed at first
  touch (naming itself may change if design finds something clearer; that's a
  founder call to bring back as an option, not a unilateral rename).
- Getting into and out of any section never strands the user (browser back
  behaves; the switcher is reachable everywhere).
- Founder-approved design (mockups or prototype) BEFORE implementation; Joey
  verifies on his own phone before this closes (same bar as the old MOBILE
  gate).

**Existing pieces:** current landing (`#684`/`#740`, eyebrow + subtitle
`#1225`), the ModeToggle (Eras / The Threads / Mood) in
`components/longlive/`, deep links in `lib/longlive/deepLink.ts`. The 2026-07
landing-page decision (`docs/decisions.md`) predates this rethink and is
superseded by it once a new design is approved.

## 2. End Game vs Blank Spaces — cards must not look like the same thread

**The problem:** the two relationship threads' cards are near-twins in both
background and text. Today both `what` lines in `apps/web/lib/longlive/lenses.ts`
lead with the friendship bracelet:

> End Game: "Follow the story from a friendship bracelet to a garden proposal…"
> Blank Spaces: "The real love story — Travis, and the friendship bracelet that
> started it — while every era before him gets its own name…"

**Direction (founders):**
- **End Game is clearly about Travis.** Background: an actual photo of
  Travis's face ("girls would find that cute" — Joey). A credited, vetted real
  photo per the site's photo policy; the social library already vetted one
  Wikimedia Kelce image (`thread-the-proposal-photo.png` source) as a starting
  point.
- **Blank Spaces says plainly it's about the past relationships.** Copy must
  name the idea explicitly (past relationships / exes, era by era, each
  chapter with its own name). Background: needs a *creative* representation of
  "the past relationships" — deliberately NOT one ex's face. Bring 2–3 art
  options to the founders (e.g. era-colored chapter motif, a timeline-of-names
  treatment); pick with Joey.

**Acceptance criteria:** side by side, the two cards are instantly
distinguishable in image AND first line of copy; Blank Spaces copy contains an
explicit "past relationships" statement; End Game art is recognizably Travis;
Joey eyeballs both on device.

## 3. Clue Web vs The Decode — same fix as item 2

**The problem:** both cards read as "hidden clues and payoffs"; the
descriptions don't tell a user how the two differ.

**The actual difference to surface (from the code):** the Clue Web is the
*whole constellation* — 30 eggs across 7 motif trails, the map of the game;
The Decode is *one clue at a time* — a single plant→payoff pair with the
months between them stretched out. Rewrite both `what` lines around that
contrast (map vs. single trail; "see the whole game" vs. "solve one clue"),
and differentiate the card art the same way (many-nodes visual vs.
two-points-and-a-gap visual).

**Acceptance criteria:** a new user reading only the two cards can say which
one to tap for "show me everything" vs. "walk me through one example"; visuals
distinguishable at a glance; founder eyeball.

## 4. Two new sections: Marketplace and Community

Two new top-level navigation pills, peers of Eras/Threads/Mood. **Both are
new product surfaces: each needs its own short spec approved by Joey before
build** (per CLAUDE.md), plus a `docs/decisions.md` entry. Item 1's landing
design must account for five pills.

**4a. Marketplace — all the Taylor swag in one place.** Aggregates: the
existing "shop the look" products (already on fashion moments via
`lib/longlive/shop.ts`, affiliate-ready), Taylor's official store, and curated
fan-made items. Cross-navigation is part of the definition: era/thread pages
link into Marketplace items and Marketplace items link back to the era/thread
they come from — "make sure navigation back and forth works well" (Joey).
Open questions for the spec: fan-made curation bar (who vets sellers),
affiliate/disclosure handling, and the standing rule that we link out — no
on-site payments (anything else is a decisions.md-level change).

**4b. Community — a directory of the best fan communities, split by
platform.** Facebook (groups), Instagram, Reddit, TikTok, X — and yes, X has
"Communities" (group-like spaces), so it gets a column too. Curated and
maintained (dead/toxic communities get pruned — give the list an owner and a
refresh cadence in the spec). This also gives Tree's human-reach lane
(`docs/marketing/social-strategy.md`) a natural home: the communities we
recommend are the ones we participate in.

**Acceptance criteria (both):** approved spec; section reachable from the
global nav per item 1; cross-links work both directions; every external link
passes item 5's liveness bar; mobile + desktop; Joey walkthrough.

## 5. Every link on the site works — one full pass, then keep it true

**The problem:** many "shop the look" links are dead or 404. Joey wants ONE
comprehensive AI pass over **every link on the site** — shop links, source
links, community links, all of them — fixing or replacing everything broken.

**Existing machinery (build on, don't duplicate):** Karen's nightly already
runs `scripts/check-link-liveness.mjs` over every *source* URL and suggests
Wayback snapshots for dead links; the Stylist desk has done spot shop-link
re-checks (e.g. PR #1863). Gaps: shop/product links aren't in the nightly
sweep, and no single full-site pass has ever been run end-to-end.

**Spec:**
1. One-time full pass: enumerate every outbound URL across the seed content,
   generated vaults, shop products, and (once built) Community/Marketplace;
   probe each; classify (ok / redirect / dead / bot-blocked). Bot-blocked
   links get a real-browser verification, not just curl — same lesson as the
   image hotlink checks. Fix everything: replacement link, updated product, or
   archive.org snapshot per Karen's existing convention.
2. Make it permanent: extend the nightly sweep to cover shop links and any
   other class the pass found uncovered, so this never needs a manual pass
   again (CLAUDE.md rule 8).

**Acceptance criteria:** a fresh full-site sweep report shows zero dead links;
the nightly covers every link class; findings from the pass are fixed and
merged, not just filed.

## 6. Every video, in the eras, chronological — plus a Videos filter

**The vision (Joey):** every public video of Taylor — not just official music
videos. Every talk-show appearance (every Fallon visit, every late-night
spot), award-show moment, notable interview. All of them placed in their eras
in chronological order, and a new **filter** that lets a user watch *only*
videos (a video-only view of an era, and/or site-wide).

**Existing pieces:** 65 official YouTube embeds in
`apps/web/lib/longlive/videos.generated.ts` rendered by `EraVideos.tsx`; seed
pipeline already syncs video seeds.

**Spec needs to answer (before the sourcing grind starts):**
- Scope line: "every appearance" is a big corpus — define the tiers (talk
  shows, award shows, interviews, performances) and the completeness bar per
  tier; official/embeddable uploads only (rights-safe YouTube embeds — no
  rehosting, consistent with the site's hotlink-only media policy).
- Data model: dated appearance entries (show, date, era, kind) extending the
  video seed shape; chronological ordering within era.
- UI: the filter's shape (per-era toggle vs. global lens) — coordinate with
  item 1's navigation design so "Videos" doesn't become a sixth unlabeled
  concept.
- Authoring: this is CONTENT-track bulk work — use the content pipeline
  (generator + seeds + Codex fact-check), not hand-entry.

**Acceptance criteria:** filter ships; walked eras show complete video
timelines per the agreed tier bar, in order, all embeds playing; sourcing
verified same as any Vault content.

## 7. Clown bot — scope decided, build B in progress

**History this line collides with:** issue **#36** (closed) wrote up the
"clown bot" community theory board as a deliberate **no-go for v1** — it broke
locked constraints on accounts, stored theories and cross-user features, and
carries real defamation/moderation risk (user-generated theories about a real
person, AI-validated). Full write-up: `docs/marketing/feature-brief-2026-07-04.md`
(candidate 4). Those constraints — no accounts, no stored theories, no
cross-user features — still stand and are unaffected by the scope decision
below.

**Scope decision:** Joey ruled 2026-08-13 — see `docs/decisions.md`,
"Clownbot rebuild — build B ships, in Joey's layout" (J1–J5). Build B is an
editorial, retrieval-grounded chat: no accounts, no stored theories, no
cross-user features, both prefill columns and every chip resolve with zero
model calls, and the one request-path model call is capped, kill-switched,
and gated on a required CI red-team battery plus a one-time live-key
red-team pass before merge (J5).

**Next action:** land the PR — Codex adversarial review, full suite green,
CI red-team battery as a required check. **Status flips to 🟢 once merged
and live**, per the definition of done above.

## 8. Era/album capitalization exactly as Taylor writes it

**The problem:** we may be inconsistent on capitalization vs. the official
album stylings. Joey: "Can't get that wrong."

**The authoritative stylings to audit against** (official album covers /
store; verify each during the audit rather than trusting this list):
lowercase **folklore**, **evermore**, **reputation**; capitalized **Taylor
Swift**, **Fearless**, **Speak Now**, **Red**, **1989**, **Lover**,
**Midnights**, **The Tortured Poets Department**, **The Life of a Showgirl** —
including the "(Taylor's Version)" suffix styling where used.

**Spec:**
1. Audit every user-visible surface: era names in `lib/longlive/eras.ts`,
   thread/card copy, track guides, seed content prose, social templates
   (`scripts/social/`), OG images, the brief/docs where user-facing.
   Sentence-position rules matter: "folklore" stays lowercase even at
   sentence start (that's the point of the styling); define the rule set in
   the checker, not in people's heads.
2. Fix all findings.
3. **Add a content-engine checker** (`scripts/content-engine/checkers/`) that
   enforces era/album casing forever — same pattern as the voice checker, so
   Karen's nightly catches any future drift automatically.

**Acceptance criteria:** audit report merged with zero remaining findings;
checker live in `DET_CHECKERS`; a deliberately-miscased test fixture fails CI.

---

## Working notes

- Items 2, 3, 8 are small and buildable immediately (specs above are
  sufficient); 2 and 3 are now done, confirmed by Joey 2026-08-25. Item 1 is
  closed (2026-08-25, landing page kept as-is). Items 4, 6 need
  founder-approved specs first. Item 5 is runnable now on existing machinery.
  Item 7 is blocked on a founder decision by design.
- **2026-08-23:** Marjorie's brief now reads this file directly (see the
  relationship note above) — status changes here need a PR link like any
  gate file, same as before, but they now show up in the brief the next
  morning instead of going unreported.
- **2026-09-06 (standing trigger, FR-t_a0ad2392-8):** the site does not
  accept user image uploads, so CSAM-scanning enrollment (#138, PhotoDNA +
  NCMEC) is deferred, not open. **Any card or PR that adds a user photo /
  image upload path — Community (item 4) is the likely place — must
  first re-label #138 `founder-decision` and wait for the enrollment
  before that surface ships.** This is a hard precondition, not a
  follow-up.
