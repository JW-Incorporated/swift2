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
successor bar. **Wyatt is reworking Marjorie's dashboard/brief to focus on
these items plus a few others** — until that lands, Marjorie keeps reading
launch-readiness.md, which now points here.

Rules, same as launch-readiness: statuses update freely with a PR link; items
are added/removed only by founder decision. Each item below inherits
CLAUDE.md's workflow — anything non-trivial gets a spec approved before code.

## Status at a glance

| # | Item | Status | Next action |
|---|---|---|---|
| 1 | Landing page rethink (scroll-first + obvious nav) | ⬜ not started | Design spec + mockups → founder approval |
| 2 | End Game vs Blank Spaces cards differentiated | 🟡 built, awaiting Joey's device check ([#2053](https://github.com/JW-Incorporated/swift2/pull/2053)) | Joey eyeballs both cards on his phone — the last acceptance criterion |
| 3 | Clue Web vs Decode cards differentiated | 🟡 built, awaiting Joey's eyeball ([#2062](https://github.com/JW-Incorporated/swift2/pull/2062)) | Joey checks the two cards side by side — the last acceptance criterion |
| 4 | Marketplace + Community sections | ⬜ not started | Product spec each → founder approval → build |
| 5 | Every link on the site works | 🟡 partial machinery exists | Full one-time AI pass + widen Karen's nightly |
| 6 | Every video, chronological, + video filter | ⬜ not started | Sourcing spec → data model extension → build |
| 7 | Clown bot | 🔴 blocked on scope decision | Founders re-scope vs. the #36 no-go constraints |
| 8 | Era/album capitalization audit | ⬜ not started | Audit + fix + add a checker so it can't regress |

Legend: 🟢 done (criterion met, verified) · 🟡 moving · ⬜ not started ·
🔴 blocked, says on what.

---

## 1. Landing page rethink — land in content, make the nav unmissable

**The problem (Joey/Wyatt):** the landing experience is the eras, and a new
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

## 7. Clown bot — blocked on a scope decision, on purpose

**History this line collides with:** issue **#36** (closed) wrote up the
"clown bot" community theory board as a deliberate **no-go for v1** — it broke
three locked constraints at once (no accounts, no notifications, no LLM in a
user-request path per `docs/decisions.md` / `docs/architecture.md`) and
carries real defamation/moderation risk (user-generated theories about a real
person, AI-validated). Full write-up: `docs/marketing/feature-brief-2026-07-04.md`
(candidate 4).

**Now it's on the founders' DoD list — which means it needs a fresh scope
decision, not a quiet build.** Options the decision should weigh:

- **Editorial "clown zone" (no UGC):** build on the existing 60-entry theory
  system (`theories.generated.ts`, confidence + outcome badges) — a curated,
  clowning-voiced theory surface, authored by the content desks. Zero
  accounts, zero request-path LLM, zero moderation exposure. Ships within
  current constraints.
- **The original interactive board (UGC + AI validation):** requires
  reversing locked architecture decisions (accounts, moderation, LLM cost
  model) — that's a `docs/decisions.md` entry with a cost model and a
  moderation plan, per the standing rules.
- Something between (e.g. submissions via the existing feedback pipe, humans
  curate in).

**Next action:** Joey + Wyatt pick a shape (15-minute decision, banked via a
`founder-decision` issue or the next session); then it gets specced like any
feature. **Status stays 🔴 until that decision exists** — this is the one DoD
item where the blocker is genuinely a founder call, flagged loudly per the
"agents get louder" directive.

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
  sufficient). Items 1, 4, 6 need founder-approved specs first. Item 5 is
  runnable now on existing machinery. Item 7 is blocked on a founder decision
  by design.
- Wyatt owns the Marjorie dashboard/brief rework to track this list; until
  then, status changes here need a PR link like any gate file.
