# Vault MVP (Time Machine) — v1 Engineering Spec

Status: DRAFT — ready for engineering once the one open item in Section 9 is
confirmed by Joey.
Owner: Joey (product) / Wyatt (architecture, final technical sign-off).
Date: 2026-07-03.
Grounded in: `docs/vision.md`, `docs/architecture.md`, `docs/decisions.md`,
`docs/marketing/feature-brief-2026-07-02.md`,
`docs/proposals/2026-07-02-vault-history-serving-architecture.md`.

**Scope decision this spec implements:** v1 is the Vault ("time machine")
and nothing else. No news/current feed, no notifications, no
source-credibility feature, no accounts, no sharing/collections, no live
tour companion. Those were features 2–8 in the 2026-07-02 marketing brief;
this narrows v1 to feature 1 only, per direct product direction. This
supersedes the brief's "ship #1 then #2 then #3 in one arc" framing — #2
and #3 are not scheduled by this spec at all, just not ruled out later.

---

## 1. What it does (one paragraph)

A user opens the app, picks one of Taylor's eras, and the entire UI —
color, type, mood — morphs to match it. A timeline scrubber lets them move
through that era (and jump to other eras) with a smooth, low-latency
gesture. Inside an era they can drop into any month and see what was
happening then — sightings, fashion, tour dates, releases — then tap into
any single moment for full detail. There is no login, no feed, no
notifications. It is a browsable, curated archive of Taylor's public life,
navigated like a physical timeline.

## 2. User-visible behavior / flows

**Entry:** app opens directly into the Vault (no home/news screen in v1 —
there is nothing else to route to). Default landing era: most recent
completed era, pending Joey confirmation if a different default is wanted.

**Era selection & morph:** selecting an era changes background/theme
color, typography, and cover art to match it (per `vision.md`'s "UI updates
to colors, fonts, and design"). Transition is animated, not an instant
cut.

**Scrubber summon/expand** (per `architecture.md`'s reference workload,
unchanged by this spec):
- A persistent thin peek strip sits at the top, always visible.
- Grabbing it expands into the full era navigator.
- Overscrolling at the top of an era's content also expands it
  (pull-to-refresh muscle memory), firing only at the content top edge so
  it never fights normal scroll.

**Two-axis navigation, bidirectionally coupled:**
- Horizontal = era switching, driven by the scrubber.
- Vertical = content within the current era (scroll through months).
- Scrubbing jumps the page to that era; scrolling into a new era updates
  the scrubber's position indicator.
- v1 snaps to **era boundaries only**. Milestones (album releases, tours)
  render as markers inside the expanded timeline for orientation but are
  not snap targets.

**Month drill-down:** within an era, the user can move to any month and
see a list of dated items for that month across categories (sightings,
fashion, relationship, tour, business, music-in-progress — per
`vision.md`). Sparse months show fewer items, not an empty/broken state.

**Moment detail:** tapping a single dated item opens its full detail
(extended context, linked sources, photos). The summary (title, date,
thumbnail) is already on screen before the tap — it came from the always-
resident month index — so the card never blank-loads; only the detail
region behind it fetches.

**Degraded states for moment detail** (already specified in the reviewed
proposal, restated here as product-visible behavior, not just an
engineering note):
- Fetch >150ms: skeleton/loading state in the detail region only.
- Timeout (>3s): keep the summary on screen, show "still loading" with a
  manual retry.
- Missing detail artifact (404): explicit "details unavailable" state, not
  an infinite spinner.
- Offline: offline indicator in the detail region, auto-retry on
  reconnect.
- Rapid taps across moments: only the currently-open moment's response is
  ever applied; superseded fetches are aborted.

## 3. Out of scope for v1 (explicit)

- News/current feed, source-credibility tagging, trust page (brief
  features 2, 6).
- Preference-driven notifications (brief feature 3) — there are no
  notifications of any kind in v1.
- Accounts, auth, sharing, collections/badges (brief feature 7) — the
  Vault is public and read-only; no per-user state.
- Live event / setlist companion (brief feature 8) — no tour is announced.
- Date/keyword search across the archive — browse by era → month only
  (per the proposal's Open Questions; revisit only if browse-only proves
  insufficient).
- Free-scrub with milestone sub-anchors — snap-to-era-only per
  `docs/decisions.md`.
- Editorial CMS/authoring tooling — v1 content is authored via repo
  seed files, not a UI.

## 4. Data model (v1)

Two tiers, per the reviewed proposal — this spec does not reopen that
design, only restates it as build-facing:

| Tier | Contents | Loaded | Delivery |
|---|---|---|---|
| **0. Skeleton + month index** | `era` (id, title, album, start/end date, order, theme, cover art) + `milestone` wavetops (album releases, tours) + one line per category per month (date, category, title, short snippet, source link, thumbnail URL) | Up front, whole archive, always resident | One static JSON payload per platform, built at deploy time, CDN-cached |
| **1. Moment detail** | Full linked sources/photos/context for one specific item | On demand, only when a user opens a moment | Static JSON per item, built at deploy time, CDN-cached, version-pinned path |

Row shape stays inside `architecture.md`'s existing cap: titles/snippets/
links/metadata only — no article bodies, no rehosted images. Images stay
hotlinked to source; UX is designed around graceful degradation
(placeholders, metadata-first cards) rather than a caching/proxy layer,
per the proposal's Open Questions default.

Source of truth: Supabase Postgres, authored/versioned in the repo (seed
files/migrations), regenerated to static JSON at deploy time — Vault
remains static between deploys, unchanged from `docs/decisions.md`.

## 5. Performance requirements (non-negotiable, carried from architecture.md)

- Scrub gesture + coupled page transition hold 60fps on mid-tier hardware
  including mid-range Android.
- Mobile: gesture/animation on the UI thread via Reanimated worklets +
  Gesture Handler — no per-frame JS/React state.
- Web: CSS transforms + `requestAnimationFrame` — no `setState` per
  pointer-move.
- Tier 0 fully resident before scrubbing is interactive — scrubbing itself
  never waits on the network.
- **Payload budget gate (from the reviewed proposal, restated as an
  acceptance criterion, not a suggestion):** Tier 0 must measure at
  **≤2MB gzipped, ≤10MB parsed in memory on a mid-tier Android device**
  against real seed content before this feature can ship. If real content
  exceeds that budget, the fallback is the proposal's windowed
  prefetch-per-era design (already specified in that doc's Section 6) —
  not a redesign from scratch.

## 6. Acceptance criteria

- [ ] User can select any era and the UI (color/type/cover art) updates to
      match, animated.
- [ ] Scrubber peek strip is visible at rest; grabbing it expands the full
      navigator; releasing/selecting snaps to the nearest era boundary.
- [ ] Overscroll-at-top-of-era also expands the navigator, without
      interfering with normal vertical scroll elsewhere in the content.
- [ ] Scrubbing horizontally changes era; scrolling content vertically into
      a new era updates the scrubber position indicator (two-way coupling
      verified both directions).
- [ ] Within an era, user can navigate to any month and see that month's
      dated items as one chronological list, each labelled with a
      category icon/color badge (not split into category-grouped
      sections) — per `docs/marketing/content-framework-2026-07-03.md`.
- [ ] One opt-in category filter, scoped per-era and off by default,
      reusing the badge icon/color set; applying it hides non-matching
      items in place without changing scrubber/timeline structure — per
      `docs/marketing/content-framework-2026-07-03.md`.
- [ ] Tapping an item shows its summary instantly (no network wait) and
      loads full detail behind it per the latency budget in Section 2.
- [ ] All five degraded states in Section 2 (slow, timeout, 404, offline,
      superseded-tap) are implemented and manually verified, not just
      described.
- [ ] Distinct telemetry events fire for timeout / missing-artifact /
      offline, so editorial gaps are distinguishable from user network
      issues.
- [ ] Measured Tier 0 payload against real seed data is ≤2MB gzipped and
      ≤10MB parsed on a mid-tier Android reference device; result is
      recorded in this spec or a linked follow-up doc before sign-off.
- [ ] 60fps holds during scrub on a mid-tier Android reference device
      (measured, not assumed).
- [ ] Works on mobile viewport and desktop viewport (web first; native
      Expo build follows per `architecture.md`'s "added when we start
      mobile").
- [ ] No article bodies or rehosted images anywhere in the payload — spot
      check against the row-shape rule.
- [ ] Automated tests cover: era/month navigation logic, snap math, Tier 1
      fetch abort-on-supersede behavior, and the four non-happy-path
      detail states (timeout/404/offline/rapid-tap) — per CLAUDE.md's
      "test everything."
- [ ] `npm run typecheck` passes; `/codex:review` run and findings
      addressed before declaring done.

## 7. Files / directories affected

Nothing existed beyond `hello-swifties.html` when this spec was drafted;
the monorepo scaffold and Vault schema/seed skeleton (steps 1–3 of the
build sequence below) have since landed (`feature/wp0-monorepo-scaffold`,
`feature/vault-foundation`). Steps 4 onward (data access, era-switching
UI, the scrubber gesture layer, moment detail) are still ahead. Per
`docs/architecture.md`:

```
apps/web            Next.js (App Router) reader — built first
packages/shared      era/milestone/month-item/moment types + domain logic,
                      snap math, scrub-position → era → section mapping
                      (zero I/O, portable to Expo later)
packages/core        Supabase data-access layer; Tier 0/Tier 1 fetch,
                      version-coherency handling
supabase/            schema + migrations for era, milestone, month_item,
                      moment tables; seed scripts for authored content
```

`apps/mobile` (Expo) is explicitly **not** part of this spec's build —
added later per `architecture.md`. Gesture/animation code for web (Pointer
Events + CSS/rAF) lives only in `apps/web`; it is the one deliberately
non-shared layer.

## 8. Suggested build sequence

1. Monorepo scaffold (npm workspaces, `apps/web`, `packages/shared`,
   `packages/core`) — matches Orbit's layout per `docs/decisions.md`.
2. `packages/shared`: era/milestone/month-item/moment types, ordering,
   snap math — no I/O, unit-testable in isolation.
3. Supabase schema + migrations for the four tables in Section 4; seed
   script with a **real, non-illustrative** batch of authored content (see
   Section 9 — this seed data is what resolves the open item below).
4. `packages/core`: Tier 0/Tier 1 data access, version-pinned Tier 1 paths,
   version-mismatch refetch logic.
5. `apps/web`: fetch + render Tier 0 (era switching, month lists) with no
   gesture layer yet — functional but not yet "the feature."
6. `apps/web`: the scrubber gesture layer (Pointer Events + CSS/rAF) to the
   60fps budget — this is the hard part; budget time accordingly.
7. `apps/web`: moment detail fetch + all five degraded states.
8. **Measure real Tier 0 payload size against the budget gate (Section
   5).** If it fails, apply the windowed-prefetch fallback before
   proceeding rather than shipping over budget.
9. Mobile (Expo) port — separate follow-up spec, not this one.

## 9. Open item requiring Joey's confirmation before content authoring (Section 3, step 3 above)

The reviewed proposal flagged this as "the single open question everything
else is downstream of," and it is still open. Two credible defaults:

- **A — Curated depth (recommended default for v1):** only "notable"
  months get populated at meaningful depth (denser in high-activity eras
  like 2023–2024, sparse elsewhere); sparse months show a lighter view
  rather than being empty. Smaller authoring workload, ships faster,
  matches how the marketing brief scoped the lore-diver segment.
- **B — Full depth:** every month of every era populated to a consistent
  standard across ~20 years. Larger authoring workload before v1 can ship
  at all, and is the scenario most likely to blow the 2MB payload budget
  in Section 5, reopening the windowed-prefetch fallback.

This spec assumes **A** so engineering isn't blocked, but the actual
authored seed content in step 3 of the build sequence is where this
becomes real — confirm before that step starts, not after.

## 10. Definition of done

Per `CLAUDE.md`: acceptance criteria met, tests pass, `/codex:review`
clean, works on mobile + desktop viewport, docs updated (this spec plus
`architecture.md` if the build surfaces a deviation), no secrets
committed. Do not report this feature done if any item in Section 6 is
unmet — say what's missing instead.
