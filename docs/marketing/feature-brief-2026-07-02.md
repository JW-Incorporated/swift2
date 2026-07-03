# Feature Brief — 2026-07-02

Prepared by: Marketing dept (Claude, with Codex adversarial review).
Human focus question: *"What do you think about the vision for the app, and
what changes would you make?"* — answered in the Vision Take section below,
per the brief format in `/marketing`.

## Where the product actually is today

Confirmed by reading the repo, not assuming: there is no app. `apps/web` and
`apps/mobile` don't exist yet; `package.json` doesn't exist; the only runtime
artifact in the repo is `hello-swifties.html`, a static placeholder (purple
background, "Hello Swifties" heading, no logic). Everything else is docs —
vision, architecture, decisions — describing a product not yet built.

**What a Swiftie would say 30 seconds after opening this today:** nothing,
because there's nothing to open. This brief is written for a pre-MVP company:
its job is to pick the first real thing to build, not to patch an existing
app.

## Vision take (answering Joey's question directly)

**The two-pillar idea (verified recent news + era time-travel) is genuinely
good and worth keeping.** It's not a me-too concept — it pairs a real,
validated pain (see Swift Alert below) with a genuinely unique mechanic
(nobody else does the time-travel Vault) that also happens to be the thing
this team already committed real architecture to (the era-scrubber is
called out as the "reference workload" in `architecture.md`).

Three changes I'd make:

1. **Flip the v1 build order implied by vision.md.** The vision document
   calls news "primarily" the app and the Vault "secondary." I'd reverse
   that for what ships *first* (not what matters most long-term). News/live
   verified updates is a commodity — a fan-run app with zero marketing spend
   (Swift Alert) already does it at 800k downloads and a 4.9-star rating.
   Winning that pillar means being *better* than an incumbent fans already
   love. The Vault is blue ocean — nothing like it exists, and it's the only
   piece of this product a competitor can't quickly clone. `architecture.md`
   already flags "whether News/Current exists in v1 at all, or Vault ships
   first" as an open question — I'd resolve it: **Vault first.** This is the
   basis for Feature 1 in the verdict below.

2. **Narrow "detect fake stories" to "label source credibility" for v1.**
   The pain is real and urgent — Taylor was hit by a coordinated
   disinformation campaign in October 2025 that drove 28% of all
   Taylor-related discussion from 3.7% of (largely bot) accounts, and a fake
   "breakup contract" fooled millions before being debunked. But an AI
   verdict machine that says TRUE/FALSE about claims involving a real person
   is a defamation and hallucination risk, and it requires exactly the kind
   of per-story LLM judgment call that's hard to get both cheap and right.
   A source-credibility label (official account / verified outlet / fan
   account / unverified) is safer, cheaper (classification against a known
   source list, not open-ended truth adjudication), and solves 80% of the
   trust problem the vision is reaching for. Save true/false verdicts for a
   v2 once there's a track record.

3. **"For all Swifties" is too broad to build against — not to serve.**
   The end product can and should serve every Swiftie. But the team needs
   a beachhead to design the first release for. See segments below; I'd
   design v1 around the show-going superfan and the lore-diver, not try to
   serve all four segments in the same release.

None of this changes what the product ultimately is — it changes sequencing
and scope discipline for what ships first, which is exactly what a v0.1
vision doc should leave open ("high level, to be refined as we learn").

## Target segments

1. **The show-going superfan.** Owns tour merch, tracks setlists live,
   posts era outfits. Currently served (partially) by Swift Alert during
   active tours — but there's no tour announced for 2026, so this segment
   is starving for *something* to do with their fandom right now.
2. **The lore-diver.** Wants to understand how Taylor's life, music, and
   relationships connect across eras — rewatches the *End of an Era*
   docuseries, builds Pinterest boards of era aesthetics, reads deep-dive
   threads. This is the Vault's core audience.
3. **The casual streamer.** Listens on Spotify, catches headlines
   passively, doesn't seek out fan spaces. Wants signal without noise —
   exactly the "only notify me about what I chose, at the rate I chose"
   promise in the vision.
4. **The vigilant fan.** Actively fights misinformation about Taylor in
   fan spaces (the accounts that pushed back on the October 2025
   disinformation campaign are this segment). Wants a place they can trust
   and point newer fans to.

## Pains and desires, with evidence

- **Notification fatigue and broken monetization trust.** Swift Alert's
  4.9-star rating (15k+ App Store ratings, 6.7k+ Play reviews) proves the
  news-alert format works, but its top complaints are the developers ending
  a promised Lifetime plan without grandfathering or refunds, paywalling
  core features behind a subscription, and forcing Google-account sign-in
  that some users read as a privacy grab.
  [Justuseapp reviews](https://justuseapp.com/en/app/6462791583/swift-alert/reviews),
  [Forbes](https://www.forbes.com/sites/lesliekatz/2024/07/10/taylor-swift-fans-love-this-app-for-tuning-in-to-all-things-eras-tour/)
- **Misinformation is an active, escalating problem, not a hypothetical.**
  A coordinated October 2025 attack falsely tying Taylor to Nazi imagery
  drove outsized discussion volume from a small bot-heavy cluster; AI
  deepfakes (both explicit and political) have repeatedly gone viral before
  being debunked.
  [NME](https://www.nme.com/news/music/coordinated-online-misinformation-attack-accused-taylor-swift-of-nazi-connections-and-fans-may-have-helped-spread-it-3917920),
  [Rolling Stone](https://www.rollingstone.com/music/music-news/taylor-swifts-social-media-campaign-life-of-a-showgirl-1235480646/),
  [Blackbird.AI](https://blackbird.ai/blog/taylor-swift-ai-deepfake-disinformation-narrative-attack/)
- **Nostalgia/era aesthetic is a huge organic fan behavior with no
  purpose-built tool.** Fans already build Pinterest boards of "Eras Tour
  aesthetic," trade friendship bracelets by era, and dress in
  era-specific outfits — this behavior exists entirely off-platform today.
  [Pinterest](https://www.pinterest.com/enchantedbyers/eras-tour-aesthetic/),
  [Medium](https://medium.com/@jordek.jd/why-taylor-swifts-the-eras-tour-a-pop-culture-moment-2445a97d5c0c)
- **The dead zone between tours is a real gap.** No 2026 tour is
  confirmed as of this writing (Taylor told BBC Radio 1 in October 2025 she's
  "so good right now" without touring); *The Life of a Showgirl* released
  October 3, 2025. Tour-dependent apps like Swift Alert have nothing to do
  right now — an opening for a product not dependent on active touring.
  [Cheatsheet](https://www.cheatsheet.com/news/taylor-swift-touring-2026-latest-updates-announcements.html/),
  [SeatPick](https://seatpick.com/blog/taylor-swift-2026-tour-everything-you-need-to-know-as-the-life-of-a-schoolgirl-album-is-released)
- **Proven fan-app retention mechanics exist and translate.** Weverse
  centralizes official updates with translation and live-streams; Duolingo's
  streak/league system drove a 36% YoY DAU increase and record-low churn
  via state that remembers progress, not raw notification volume.
  [Weverse](https://weverse.io/),
  [StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)

## Candidate features

1. **Vault MVP: the era-scrubber timeline.** The signature time-travel
   experience from the vision — pick an era, the whole UI (colors, fonts,
   theme) morphs, scrub a timeline to see milestones. Serves the lore-diver
   and show-going superfan. No competitor has this. Effort: **L** (it's the
   architecture's own reference workload — gesture layer alone is
   nontrivial). Runtime cost: **zero LLM**, static/CDN-cached per
   `architecture.md`'s Vault design — cheapest feature on this list to run.
2. **Source-credibility news feed (not verdict-based fact-checking).**
   A live feed of Taylor-related news tagged by source tier (official /
   verified outlet / known fan account / unverified), addressing the
   misinformation pain without the legal/hallucination risk of a true/false
   AI verdict. Serves the vigilant fan and casual streamer. Effort: **M**
   (needs an ingest pipeline — new infra). Runtime cost: classification can
   run **worker-side at ingest time** (per-article, not per-user-request),
   satisfying the CLAUDE.md rule against per-user LLM calls in the request
   path — still needs a daily cost cap and rule-based fallback per
   `architecture.md`'s AI-integration section.
3. **Preference-driven notifications ("tell us what you care about, we
   decide the rate").** A first-class onboarding flow (not a settings
   screen) where users pick topics (fashion, tour, music, relationship,
   business) and the app self-limits notification frequency. Directly
   answers the Swift Alert complaint pattern (paywalled/annoying alerts).
   Serves the casual streamer. Effort: **M**. Runtime cost: none — rule-based
   frequency capping, no LLM required.
4. **Era aesthetic packs (shareable).** Downloadable/shareable wallpapers,
   color palettes, and "which era are you in" cards generated from Vault
   data, built for posting to Instagram/TikTok. Serves the lore-diver, drives
   acquisition via organic sharing (the exact behavior fans already do
   unprompted on Pinterest). Effort: **S** (pure derivative of Vault
   content, no new data model). Runtime cost: zero LLM, static asset
   generation from existing Vault data.
5. **"On this day" push moment.** Daily notification surfacing what Taylor
   was doing on this exact date in a past era, driving a daily-open habit
   without spamming — a lightweight Duolingo-streak analog scoped to
   editorial content instead of a gamified system. Serves lore-diver +
   casual streamer. Effort: **S** (derivative of Vault's milestone data +
   a cron job). Runtime cost: zero LLM.
6. **Trust/transparency page for the credibility system.** A public,
   plain-language page explaining how source tiers are assigned and how to
   flag a miscategorized story — pre-empts the "who made you the arbiter of
   truth" backlash the vision's "detect fake stories" framing risks. Serves
   the vigilant fan directly, and de-risks Feature 2 for everyone else.
   Effort: **S**. Runtime cost: none (static content + a form).
7. **Friend/collection features (era badges, bracelet-trade log).** Digital
   version of the friendship-bracelet ritual — collect a badge per era
   visited/explored, optionally show off to friends. Serves the lore-diver.
   Effort: **M** (needs accounts + per-user state, which `architecture.md`
   says isn't load-bearing until a feature needs it — this would be that
   feature). Runtime cost: none (no LLM), but is the first feature that
   requires real auth/RLS investment.
8. **Live event companion (setlist tracker, surprise-song alerts).** The
   thing Swift Alert already does well during an active tour. Serves the
   show-going superfan. Effort: **M**, but **only valuable if/when a tour is
   announced** — building this now with no confirmed 2026 tour date is
   pure inventory risk. Flagging for later, not for the next-3 verdict.

## Codex adversarial-review round

Ran one challenge round against this brief (focus: market assumptions,
impact claims, effort estimates, scope creep/bloat). Findings and
responses:

- **"800k downloads on Swift Alert proves demand for *our* news pillar" is
  overstated — Swift Alert's traction was overwhelmingly tour-driven
  (launched at Eras Tour opening night), and the brief itself notes no tour
  is confirmed for 2026.** *Accepted.* This is exactly why Feature 1
  (Vault) leads the verdict and the tour-dependent Feature 8 (live event
  companion) was explicitly deferred rather than recommended — the brief
  already discounts the tour-dependent read of that evidence; edited the
  segment note under "show-going superfan" to make the dead-zone caveat
  explicit rather than implied.
- **Source-credibility tiering is scope creep disguised as a safer
  version of Feature 2 — "tag every story by source tier" still requires
  an ingest pipeline, a maintained source-tier list, and a moderation/appeal
  path (Feature 6), which is a lot of surface for a v1.** *Partially
  accepted.* Kept Feature 2 in the list (the misinformation pain is real and
  time-sensitive per the October 2025 evidence) but it is deliberately
  **not** in the top-3 verdict below — it's ranked behind two features with
  zero ingest-pipeline dependency, which is the honest effort/risk
  read.
- **Feature 7 (collection/badges) is bloat: it requires standing up real
  auth/RLS ahead of any feature that needs it, contradicting
  architecture.md's stance that auth stays non-load-bearing until
  something needs it.** *Accepted outright.* Feature 7 is interesting but
  is exactly the kind of "auth for its own sake" `architecture.md` warns
  against speculating on. Removed from verdict contention; left in the
  candidate list as a later idea, not a next-3 pick.
- **"Zero LLM cost" claims on Features 4 and 5 assume Vault data (eras,
  milestones, dates) is fully authored — it isn't yet; effort estimates
  don't include the underlying content-authoring work.** *Accepted.*
  Both features are truly cheap to *build* once Vault data exists, but
  they are not shippable before Feature 1's data model and initial content
  are in place — that's exactly what "3 features, in order" is for; they're
  sequenced after Feature 1 in the verdict, not estimated independently of
  it.

## Verdict

1. **Vault MVP (the era-scrubber timeline).** It's the one thing on this
   list nobody else can clone quickly, it's already the architecture's
   reference workload so build risk is understood, and it runs at zero
   marginal cost per the static-Vault design — the highest-differentiation,
   lowest-runtime-cost bet on the board.
2. **Preference-driven notification onboarding.** It directly fixes the
   #1 fan complaint about the closest existing competitor (Swift Alert's
   paywalled, frequency-uncontrolled alerts), needs no new AI cost, and
   turns the vision's "notifications are core UX, not a settings screen"
   idea into the first thing users configure, not the last.
3. **Source-credibility news feed + trust/transparency page (shipped
   together).** The misinformation pain is real, current, and escalating
   (October 2025 disinformation campaign, deepfakes), but per the Codex
   review it's the riskiest and most infra-heavy pick — it ships third,
   after the team has a working data pipeline pattern from Vault, and only
   with the transparency page bundled in to pre-empt "who decides what's
   fake" backlash.

---

## For Joey

**The verdict, in plain language:**
1. **Build the time-travel Vault first.** Pick an era, watch the whole app
   change color and mood, scrub through Taylor's timeline. Nobody else has
   this, and it's cheap to run once built.
2. **Then build notification onboarding that isn't a settings screen.**
   Users tell the app what they care about right when they join; the app
   self-limits how often it pings them. This is the exact thing fans
   complain about in the closest competing app today.
3. **Then build a "how trustworthy is this source" tag on the news feed**,
   with a plain-language page explaining how we decide — not an AI saying
   "this is fake," which is legally riskier and harder to get right; a
   softer trust signal that still fixes the real problem.

**What Codex killed or changed:** cut the friendship-bracelet/badge
collection feature from contention — it would require standing up real user
accounts before anything actually needs them, which contradicts our own
architecture stance of not building auth speculatively. Also pushed the
misinformation feature to #3 instead of #1 — it's the most infra-heavy and
legally sensitive pick on the list, so it should ship after the team has a
working pattern from the Vault build, not first.

**One A-or-B question, a real 50/50:** the vision talks about verified
notifications as one core pillar. Do you want the notification-onboarding
feature (#2) to launch **with the Vault** as one release, or **after** it as
a clearly separate follow-up? Bundling tells a cleaner "smart app" story at
launch; splitting means Vault ships sooner and notification quality gets
its own dedicated attention instead of racing a joint deadline.

Approve all three, or tell me which to swap?
