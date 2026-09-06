# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

---

## 2026-09-06 — Structural fix for recurring stranded-PR problem: proactive branch keep-up + faster watchdog escalation (t_21a0cd6f)

**Context:** Joey, 2026-09-06, in response to t_dcb1f2c0's root-cause
writeup on 7 stranded PRs that day ("Solve it however you want. Use your
best judgment. I just don't want it to recur"). t_dcb1f2c0 found 6 of 7
failed `build` for the identical reason: opened against an older `main`
while bot content lanes merge every ~2-5 minutes, so each PR's own CI kept
checking stale assumptions. `git merge main` fixed all 6 with zero
conflicts — proof this was pure staleness, not real content collision.
`watchdog.yml`'s existing "PRs stuck" step only detects this 24h+ later and
does not repair anything.

**Fix (two parts):**
1. **New `.github/workflows/auto-merge-keepup.yml`** — runs every 15
   minutes, lists open PRs, and for every PR that (a) targets `main`, (b) is
   `BEHIND` main, (c) is not `hold`/`cie:escalate`/`founder-decision`
   labelled, and (d) passes the SAME branch/author content-lane gate
   `auto-merge-content.yml`'s `enable` job already uses
   (`scripts/automerge-branch-author-gate.mjs`, now with a CLI entry point
   reused via `scripts/automerge-keepup.mjs`) — merges `origin/main` into the
   branch and pushes, using `SOCIAL_POSTER_PAT` (not `GITHUB_TOKEN`, so the
   push actually re-triggers `build`). A real merge conflict is left
   completely untouched (dry-run merge first, abort on conflict) — this
   workflow never resolves content, only mechanically re-syncs. Bounded to 8
   PRs/run (Actions-minutes discipline, same reasoning as watchdog.yml's
   `RERUN_BUDGET`).
2. **`watchdog.yml`'s "PRs stuck on failing or missing checks" step** now
   runs on every hourly trigger (previously daily-only) and its
   `RED_AFTER_H` threshold dropped 24h → 6h: with the staleness class
   structurally prevented by (1), a PR still red after 6h is far more likely
   a genuine failure that deserves a founder's eyes sooner. The CI re-run
   sub-step (`gh run rerun`, `RERUN_BUDGET`) stays gated to the daily cron
   only, so the more frequent alert pass does not multiply re-run spend.

**Why this is safe to run unattended:** the keep-up job reuses the exact
same eligibility gate auto-merge already trusts to land a PR unattended once
green — it does not expand who/what may merge, only keeps already-eligible
branches from drifting stale before auto-merge gets the chance. It never
opens a PR, never resolves a conflict, never touches content.

**Alternatives considered:** widen `RED_AFTER_H` re-run frequency instead of
adding a keep-up job (rejected — a CI re-run against the same stale base
proves nothing; the actual defect is the stale base itself, not a flaky
check); have each content-lane agent self-rebase before re-running
(rejected — agents no longer babysit their own PRs by design, 2026-07-25
decision, and re-arming that would reintroduce the ~69%-of-token-spend
self-check-in problem that decision eliminated); lower `RED_AFTER_H` without
adding keep-up (rejected — would alert MORE on the exact staleness noise this
fix is meant to eliminate).

**Approved by:** Joey ("solve it however you want", 2026-09-06, kanban
t_21a0cd6f).

---

## 2026-09-06 — Future-dated Showgirl moment pulled; blocking future-date gate added (t_187359e9)

**Context:** Joey, 2026-09-06: "our engine for producing content is still
posting stuff without images. Last two posts, one of which is dated IN THE
FUTURE (9/12/26 = wtf?) dont have pictures." Verified against the live site
and a local CIE run (`node scripts/content-engine/run.mjs all --no-images`):
the two newest `the-life-of-a-showgirl` moments were, in order —
1. `florida-orchestra-taylor-swift-symphony-era-mahaffey`, dated 2026-09-12
   (six days after the 2026-09-06 authoring run that added it, PR #3910/#3906)
   and with `thumbnailUrl: null` — the future date AND the missing photo.
2. `i-knew-it-i-knew-you-country-radio-double-meanings`, dated 2026-09-05,
   also `thumbnailUrl: null` — the second no-photo item Joey saw.

**Fix:**
- Pulled the Florida Orchestra moment entirely rather than back-dating it —
  there is no true date to move it to since the concert has not happened
  yet. Left a dated comment in the seed file for whoever re-authors it after
  2026-09-12.
- Marked the radio-interview moment `photosReviewed` (no reusable,
  allowlisted subject photo exists for this specific interview; the era
  already carries verified photos for the same song elsewhere) so
  `content.top-of-feed-photo` stops re-flagging a reviewed decision as a gap.
- Added a blocking check to `scripts/validate-content.mjs` (CI's
  `check:validate-content` step, part of the required `build` check): any
  seed moment dated after the CI run date is now a hard `ERROR`, not just a
  nightly-scan finding someone has to notice. The existing deterministic CIE
  checker (`fact.claim-risk`) already caught this pattern but only surfaces
  in a scheduled report; this closes the gap between "detected" and
  "blocks the merge."

**Why not also fix `amc-leawood-films-eras-tour-inspiration` (the 10th-newest
no-photo item) here:** it is not one of the two items Joey reported (it's
already several positions back in the feed) and is already inside the
existing photo-backlog lane (open PR #3902 and its siblings are actively
working the `content.top-of-feed-photo` ticket queue). Fixing it here would
duplicate that in-flight work.

**Alternatives considered:** leave the future-dated item and just add a
photo (rejected — the event genuinely has not happened yet, so no real photo
can exist and shipping any image would misrepresent an unconfirmed future
event); rely on the nightly CIE scan catching future dates going forward
(rejected — that is the exact detection-without-enforcement gap that let
this one reach the live site, per RC-3 in
`docs/audits/2026-09-05-newest-posts-no-images-root-cause.md`).

**Approved by:** Joey (direct escalation in chat, 2026-09-06, routed via
kanban t_187359e9).

---

## 2026-09-06 — Fable triage of the Founders' Brief: 7 of 13 "waiting on you" items were never founder items

**Context:** Joey, 2026-09-06: "Dispatch one card to assess which of the
issues can be solved without a founder. Be aggressive, make decisions."
Brief #3893 listed 13 open founder asks. Kanban t_a0ad2392 (Fable 5.1)
ruled each one against the reversibility test (2026-07-11 operating
model) and the human-only list (credentials, real spend, irreversible
external actions, legal exposure). Rulings are binding on agents; a
founder may overrule after the fact by commenting the ruling id.

| Ruling | Item | Verdict | Why |
|---|---|---|---|
| FR-t_a0ad2392-1 | HA#41 / #3616 Karen trigger rename | **Done by agent** | The live runner is now `.github/workflows/routine-karen-nightly.yml` (routines migration, HA#47); renamed there + `runner-cadence.json`. The claude.ai trigger is on #47's *disable* list — you never rename something you are retiring. |
| FR-t_a0ad2392-2 | HA#42 / #3631 Kevin comment-edit tool | **Done by agent** | Kevin's desk now runs as a GitHub Action with `Bash` + `GH_TOKEN`; `gh api -X PATCH …/issues/comments/{id}` is edit-in-place with no connector change. Revert to edit-in-place is a child card. |
| FR-t_a0ad2392-3 | HA#9 keep PRs required on `main` | **SKIP — precedent** | `CLAUDE.md` ("`build` gates every merge") and the 2026-08-22 merge-authority entry already assume PR-only landing. Reversible via the ruleset UI any time; verified `protect-swift2-main` (id 21672404) active. |
| FR-t_a0ad2392-4 | HA#23 / #680 BACKUPS gate | **Founder half done; engineering half found broken** | Step 1 was Joey's 2026-08-30 report. Step 3 (`workflow_dispatch`) needs no founder — ran it: backup of production bytes PASSED (35 tables / 8298 rows / 11.27 MB), restore FAILED on `auth.users` (Supabase-only schema), and the workflow **masked the failure** (`\| tee` without `pipefail`). Two child cards. "Accept the risk" is not a founder decision either: a scheduled Layer-B backup artifact at zero spend mitigates it — child card. |
| FR-t_a0ad2392-5 | HA#16 Facebook groups checklist | **Converted** | Seed from `sources.md`'s researched groups (child card); the real export needs Joey's login and belongs on the Sunday `fb-export-reminder.yml` issue, not the daily brief. |
| FR-t_a0ad2392-6 | HA#4 Reddit API account | **Dependency removed** | Reddit is already read without a key (`reddit-rss.ts`, `fanmade-discovery.mjs`); Etsy + Awin keys exist. E5 marketplace research unparked — child card. |
| FR-t_a0ad2392-7 | #1955 Midnights + TTPD depth spot-check | **Agent QA, not founder taste** | The J3.5 bar is the rubric's "Active" tier (2–4 sourceable items/month). That is measurable: a depth audit script + report (child card). The merge sequence that blocked it landed 2026-08-12; the ticket was stale. `founder-task` label removed; re-add only if the audit finds a gap that needs editorial judgment. |
| FR-t_a0ad2392-8 | #138 CSAM enrollment (PhotoDNA + NCMEC) | **Deferred with trigger** | The on-file recommendation is "defer until the site accepts user photo uploads" and it does not. 58 days unanswered *is* deferral; deferral is reversible. `founder-decision` label removed so it leaves the daily brief; `cie:safety` stays. Hard trigger: any card/PR that adds user image upload must reopen the ask first (noted on the issue + `docs/definition-of-done.md`). Enrollment itself remains human-only when that day comes. |
| — | HA#43–46 mobile release train (EXPO_TOKEN, iOS signing, Play key, push creds) | **Human-only — consolidated** | Credentials on Expo/Apple/Google accounts. Reduced to one decision card instead of four line items; `PLAY_SERVICE_ACCOUNT_JSON` already exists as a repo secret (2026-09-06), so the Android submit can be wired from Actions once `EXPO_TOKEN` exists (child card). |
| — | #3891 SOCIAL_FREEZE | **Already cleared** | Joey flipped it 2026-09-06 19:01; verified posting resumed. |

**Net:** 13 → 4 founder items (#47's 15 routine disables, `EXPO_TOKEN`,
Wyatt's iOS credential upload, push credentials). Everything else is
either done or on the swift2 kanban as children of t_a0ad2392.

**Alternatives considered:** leave items as founder asks until answered
(rejected — 5 of them had aged 13–58 days with no decision content); ask
Joey to confirm each ruling before acting (rejected — every ruling is
reversible and the directive was "make decisions").

**Approved by:** Fable arbiter (claude-fable-5-1), per
`policy/escalation-matrix.yaml`; founder overrule by comment.

---

## 2026-09-05 — #3584 checker hole closed: rehosted video thumbnails can't be `mediaKind: "photo"`; appearance lane is X-only

**Decision (Fable 5.1 ruling, kanban t_36d74b87 → t_503ff677, binding, reversible design/policy call — no founder reply needed).**
1. A rehosted YouTube/broadcaster thumbnail is NOT a `photo`. This entry's
   2026-08-15 definition of "photo" (a license-cleared local file) and
   `docs/marketing/social-strategy.md` §2 (no typography/designed cards
   standing in for real media) already said so — #3584 is a checker hole,
   not a new policy. `scripts/social/check-drafts.mjs`'s `checkMedia` now
   hard-fails a `mediaKind: "photo"` tile whose `mediaCredit`/`mediaSource`
   reads like a rehosted video thumbnail, or that isn't in an explicit
   allowlist of the genuinely cleared corpus files under
   `/social/library/photos/` (`CLEARED_PHOTO_ALLOWLIST`) — either signal
   alone fails. `scripts/social/lib/queue-schema.mjs` carries a matching
   `mediaKind: "video-thumb"` value (the new declared kind for this shape):
   Instagram drafts reject it outright; X drafts may only carry it with no
   attached image (a bare link preview).
2. Appearance-lane posts go X text-only. Instagram is skipped unless a
   cleared photo exists (the calendar's "empty IG slot beats a failed one"
   rule) — this lane has none to offer, so it no longer manufactures an
   Instagram sibling at all. `checkCampaignPair`'s otherwise-unconditional
   cross-platform pairing rule (Joey, 2026-08-25/26, "always an IG copy,
   always") now exempts `appearance:`-family campaigns by name, since this
   is the one lane the ruling deliberately carves an X-only shape out for.
3. The lane may keep running unattended (2026-08-25 decision stands)
   PROVIDED the checker enforces 1 and 2 mechanically (now true — see
   above). Caption copy must not claim engagement with unwatched media
   ("come watch with me", "my whole day is now about") — that template was
   already dropped from `scripts/appearance-discovery/lib/social-draft.mjs`
   in the 2026-08-31 entry below; this entry only removes the leftover
   Instagram/thumbnail machinery around it (the thumbnail fetch, the vision
   "Taylor is really in the frame" verification call, and the
   `mediaKind: "photo"` declaration it fed).

**Implementation:** `scripts/social/check-drafts.mjs`,
`scripts/social/check-drafts.test.ts`, `scripts/social/lib/queue-schema.mjs`,
`scripts/appearance-discovery/lib/social-draft.mjs` (rewritten X-only, pure,
no network/vision dependency), `scripts/appearance-discovery/lib/social-draft.test.ts`,
`scripts/appearance-discovery/discover.mjs` (drops the thumbnail fetch/write
step for this lane). Deleted 4 stale queue files past the 48h stale window
that would never post: `2026-08-31-appearance-ldBrFonU8NA-{x,ig}.json`,
`2026-09-01-appearance-T6iTnTV-Rgw-{x,ig}.json` (the GMA Dolly-memorial card
never shipped).

**Approved by:** Fable 5.1 arbiter ruling on kanban t_36d74b87, implemented
on t_503ff677 — reversible checker/policy-enforcement fix under standing
agent authority (`merge_authority: agent`). Issue #3584 commented with this
ruling and closed.

## 2026-09-05 — ADR: the content bundle is a versioned artifact, not a database (OS-010)

**Context:** D1 (ratified 2026-09-05, `docs/specs/2026-09-05-one-source-
three-surfaces.md` §4) already decided content's source of truth is git
seeds → published bundle, not Supabase at runtime. OS-010 is the first
implementation card under D1: define the typed contract (`packages/content`)
every surface (web, iOS, Android) validates the bundle against.

**Decision.** `packages/content/src/schema.ts` defines zod schemas mirroring
the hand-authored types already shipping in `apps/web/lib/longlive/
{types,content,tracks,theories,videos,era-secrets,merch,song-moods,
clownbot-lore}.ts`. A bundle is a `manifest.json` (`{ schemaVersion,
bundleVersion, generatedAt, files: { name -> { path, sha256, bytes } } }`)
plus one JSON file per domain (content is split per era; tracks/theories/
videos/era-secrets are also per-era; merch/song-moods/clownbot-lore are
whole-catalogue). `bundleVersion` is a content hash (sha256 of the sorted
per-file hashes), not a timestamp or counter, so two builds from
byte-identical seed content are byte-identical bundles — this is what lets
OS-011's "run it twice, get identical hashes" done-when be literally true,
and it is what makes `current.json` (OS-012) a safe, cacheable pointer: a
client can compare `bundleVersion` strings to know whether it already has
the content, with no clock or counter to get out of sync across three build
pipelines (Vercel, EAS, CI).

**Why an artifact, not a DB.** Three independent reasons, each sufficient on
its own:
1. **Determinism across three runtimes.** Web (Next.js/Vercel), iOS, and
   Android must render byte-identical content from the same input. A shared
   read-only JSON artifact, versioned and hashed, guarantees that trivially;
   a live DB query does not — different query timing, different replica
   lag, or a mid-release write could serve three surfaces three different
   answers to "what does the app look like right now."
2. **The stale-production failure this avoids is not hypothetical.** D1's
   own rejected-alternative note (`docs/specs/2026-09-05-one-source-three-
   surfaces.md` §4) cites issues #723/#725 — Supabase-as-runtime-content
   already produced a stale-production incident once on this project. An
   artifact with an explicit, hashed version number cannot silently drift:
   a client either has bundle X or it doesn't, and re-fetching `current.json`
   is the entire cache-invalidation story.
3. **Offline-first mobile.** `packages/content`'s loader (OS-013) caches the
   last-good bundle on-device (`expo-file-system`); a native screen renders
   from that cache with the network off. A live DB call has no equivalent
   fallback without re-implementing an offline cache ON TOP of Supabase,
   which is strictly more moving parts for the same result an artifact gives
   for free.

**N-1 schema support.** `schemaVersion` is a small positive integer, bumped
ONLY on a breaking change to the shapes in `schema.ts` (a field changing
type or a previously-optional field becoming required — additive optional
fields do NOT bump it). A loader built against schemaVersion N must still be
able to read a bundle published at schemaVersion N-1: this is what lets a
mobile client running an older EAS Update (D4) continue rendering correctly
against a newer web-published bundle for the one release cycle before it
catches up, instead of hard-failing on every schema bump. OS-041 owns the
CI check that enforces this ("a schema change ships with a loader that
still reads the previous version"); this ADR fixes the mechanism
(`schemaVersion` field + N-1 contract) that check enforces.

**Alternatives considered:**
- *Supabase as the runtime content source* — rejected by D1 itself (re-
  creates #723/#725's stale-production failure; a DB round-trip on every
  page load).
- *A single monolithic JSON file instead of per-domain files* — rejected:
  every surface would download the whole catalogue (all eras, all tracks,
  all lore) to render one era, defeating OS-011's per-era split and
  inflating the mobile bundle-size risk called out in spec §8.
- *`bundleVersion` as a build timestamp or monotonic counter* — rejected:
  neither is reproducible from the same input (a rebuild with no content
  change would still bump the version, breaking client-side cache reuse
  and OS-011's determinism done-when).

**Consequences:** `scripts/build-content-bundle.mjs` (OS-011) must produce
output that validates against every schema in this file byte-for-byte
identically across runs. `packages/content`'s loader (OS-013) is the only
place that touches `zod` at runtime on the client; UI code continues to
consume the same TypeScript shapes it already does today (the schemas here
are structurally compatible with `apps/web/lib/longlive/types.ts`, not a
new/competing type system) until OS-014/OS-015 switch the read path.

**Approved by:** no separate founder approval required — this is scoped,
reversible implementation work under D1's already-ratified decision, per
`CLAUDE.md` decision authority; OS-010 land-your-own-green-PR authority
covers it (`docs/specs/2026-09-05-one-source-three-surfaces.md` registry
constraints).

---

## 2026-09-02 — Nonce-based CSP removes inline-script exception

**Decision.** `apps/web/proxy.ts` generates a fresh nonce for each rendered
request and sends it in the enforcing CSP. The App Router receives the same
nonce in its request headers, automatically applies it to framework-generated
scripts/styles, and `app/layout.tsx` applies it to the static JSON-LD script.
`script-src` no longer permits `'unsafe-inline'`; it uses the request nonce and
`'strict-dynamic'` instead.

**Why.** The security-hardening task explicitly required removing the inline
script exception. Next.js documents nonce support as the supported App Router
path, even though it changes static rendering to per-request rendering. This
is a reversible implementation choice within the approved security task.

**Bounded exception.** `style-src-attr 'unsafe-inline'` remains: the shipped UI
uses numerous dynamic React style attributes for coordinates, colors and layout,
which CSP nonces cannot authorize. `style-src` itself is nonce-based. Removing
the attribute exception requires a separate visual refactor and is not claimed
by this hardening change.

**Alternatives considered:** retaining script `'unsafe-inline'` (rejected — it
does not meet the audit remediation); converting every dynamic style attribute
in this card (rejected — broad UI refactor outside the bounded security change).

**Approved by:** no founder approval required — reversible technical hardening
within Kanban task `t_07025f1e` under `CLAUDE.md` decision authority.

---

## 2026-09-01 — Merch Autonomy provenance-snapshot reconciliation (#3460, Fable-ruled): all 4 conflicts were stale attachment drift, not new decisions

**Context:** GitHub issue #3460, per binding Fable ruling
`ARB-t_b2461a5a-01` ("merge PR #3459 verbatim; reconciliation is a
follow-up, not a precondition"). PR #3459 adopted the 2026-08-29 PLAN/SPEC
Discord attachments byte-for-byte as a provenance snapshot; this reconciles
that snapshot's language against this operative decision record. All four
listed conflicts turned out to be stale attachment-doc prose that the
codebase and earlier decisions had already superseded — no product-direction
change was needed for any of them, so no founder call was required (per the
ruling's own test: "a Joey decision is needed only if resolving this would
amend or reverse docs/decisions.md or change product direction").

1. **Alternate-listing affiliate routing.** The attachment's `networkFor()`
   doc comment described resolution as if it were purely per-retailer.
   `apps/web/lib/longlive/shop.ts` (merged in #3474, "wire affiliate render
   context") already implements listing-scoped routing: every wrap call
   carries an explicit `ShopLinkContext` and a D1-a `altListing` is wrapped
   independently of its primary listing, using its own retailer plus the
   same `{ bucket: 'official' }` context — see `shop.test.ts`'s
   `describe('listing-scoped affiliate wrapping', ...)`. Fixed:
   `docs/SPEC.merch-autonomy.md` §2 now documents this explicitly.
2. **E3 lane split.** The attachment's workflow table and prose described
   `merch-audit.yml` as one scheduled vision workflow. The 2026-08-30
   FR-MERCH-5 ruling (recorded below, "SPEC's workflow table put vision
   scoring + PR output inside scheduled `merch-audit.yml`... Disposition: E3
   splits into `merch-audit-detect.yml` (scheduled, zero-LLM)... and a
   separate authoring lane") already settled this, and the repo already
   ships `merch-audit-detect.yml` + `merch-audit-authoring.yml` as separate
   workflows (`.github/workflows/`, `scripts/merch-engine/audit-matches.mjs`
   + `audit-matches-authoring.mjs`). Fixed: `docs/SPEC.merch-autonomy.md` §5
   and the workflow table (§10) now describe the two-lane split instead of
   the superseded single workflow.
3. **Unscored representation.** The attachment described a mismatch-scored
   product as `tier: null`. The shipped implementation instead uses
   `matchTier: 'unscored'`, an explicit member of the `matchTier` union
   (`apps/web/lib/longlive/types.ts`), which is what actually distinguishes
   "nothing comparable to score" from "not yet audited" — see the generated
   vault's real `matchTier: "unscored"` rows and `MerchCard.tsx`'s
   `item.matchTier !== 'unscored'` badge-suppression check. Fixed:
   `docs/SPEC.merch-autonomy.md` §5 point 4 now documents the real
   `'unscored'` state instead of the never-implemented `tier: null`.
4. **D1/D3 status.** The attachment's PLAN still framed D1 and D3 as open
   options for Joey to pick. Both were already decided in the 2026-08-30
   entry below ("Merch autonomy: full official catalog with verified Amazon
   alternatives; fan-made line is inspired-by, never bootleg" — "D1 is
   **D1-a**... D3 is approved as the hard fan-made curation rule"). Fixed:
   `docs/PLAN.merch-autonomy.md` now states both as settled, citing this
   entry, instead of presenting them as pending choices.

**Why no founder call:** every fix above brings a stale provenance-snapshot
description into line with a decision or implementation this log already
recorded before the snapshot was adopted verbatim in #3459 — none of them
reverses or amends an existing entry, and none changes what ships.

**Approved by:** Fable ruling `ARB-t_b2461a5a-01` authorized proceeding
without a precondition founder review; this entry documents that no founder
decision was triggered by the reconciliation itself, consistent with the
ruling's own test.

**Implementation:** `docs/SPEC.merch-autonomy.md`, `docs/PLAN.merch-autonomy.md`.

---



**Founder decision (t_19f99249):** Joey ruled build REAL photo content
verification — not just filename/credit-string checks — for the
`appearance-discovery` fast lane, and explicitly ruled the lane **stays
auto-posting** (no downgrade to review-first/draft-only). Trigger finding:
`appearance-XwCWKSO0F8s`'s thumbnail was a Pixar-style animated tree/tire-
swing illustration with zero Taylor in it, declared `mediaKind: "photo"`,
and passed every existing gate (path prefix, credit string, aspect ratio) —
none of which is a content check — see the 2026-08-31 SOCIAL_FREEZE entry
above.

**Design chosen (of the two options weighed):** a vision-model verification
step inside `scripts/appearance-discovery/lib/social-draft.mjs`, not a
human-confirm step. A human-confirm step would have amounted to converting
the fast lane to review-first, which Joey explicitly ruled out; a vision
check fits inside the existing zero-approval auto-posting flow.

**Implementation:**
1. `scripts/appearance-discovery/lib/social-draft.mjs` — new
   `verifyTaylorPresence(bytes, mediaType, { apiKey, fetchImpl })`: one
   `claude-sonnet-5` tool-call vision request (`thinking: disabled`,
   `max_tokens: 128`) asking whether Taylor Swift is visibly, photographically
   present (explicitly false for animation/illustration/a different
   person/text-graphics). Fails CLOSED — throws if `ANTHROPIC_API_KEY` is
   unset or the response is malformed, never silently treats "unknown" as
   "yes."
2. `fetchAppearanceThumbnail` now calls `verifyTaylorPresence` on every
   shape-valid candidate thumbnail (after the existing size/aspect-ratio
   check, so a junk-shaped image never reaches the paid vision call) and
   only returns a thumbnail when `taylor_present === true` at confidence
   ≥ 0.6. A thumbnail that fails verification is never written to
   `social/queue/`; `discover.mjs`'s existing `draftFailures` path (loud,
   non-fatal — logged and counted, does not stop the run or the intake
   issue) reports it, unchanged code path, no new failure mode class.
3. `.github/workflows/appearance-discovery.yml` — passes
   `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}` to the "Discover new
   appearances" step (the only step that calls `fetchAppearanceThumbnail`,
   FILE mode only — a dry run never reaches the network call, so the key is
   inert on manual dry-run dispatches). No new secret: this is the same
   Anthropic credential/account already standing-authorized for E3 match
   auditing (`docs/decisions.md` 2026-08-30 "E3 vision judgment uses Claude
   Sonnet 5…") — a second authorized use of an existing one, not a new spend
   channel.
4. `docs/marketing/social-strategy.md` §2 — documents the gate under "the
   source ladder" as a subsection of the existing `mediaKind: "photo"` rung.
5. `social/queue/2026-09-01-appearance-XwCWKSO0F8s-{x,ig}.json` and
   `apps/web/public/social/library/photos/appearance-XwCWKSO0F8s.jpg` —
   removed. The now-known-bad instance cannot be re-verified after the fact
   (the fast lane's job is a fresh detection, and this video's own queue
   slot has already slipped its 72h `SCHEDULE_DELAY_MS` window once); simplest
   correct fix is deleting it rather than inventing a replacement photo by
   hand. If the video still merits a post, the slower Content Shift intake
   lane already has its own issue for the same video (unaffected by this
   change) and can author one with a human-sourced photo.
6. Test coverage: `scripts/appearance-discovery/lib/social-draft.test.ts`
   gained `verifyTaylorPresence` (fails closed without a key, throws on a
   non-ok/malformed response, returns a well-formed judgment) and
   `fetchAppearanceThumbnail` cases covering the XwCWKSO0F8s scenario
   directly (a shape-valid thumbnail rejected by content verification),
   low-confidence "yes," and confirming verification is never called for a
   shape-invalid candidate (no wasted spend).

**Why the confidence floor (0.6) and not a bare boolean:** the tool schema
already lets the model express uncertainty; treating a low-confidence "yes"
as a pass would reintroduce exactly the "looks plausible, wasn't checked"
failure mode this fix exists to close.

**Approved by:** Joey, 2026-08-31 (kanban t_19f99249 → t_ac1281ef). Registry:
`merch_authority: agent`, self-merge once CI green; human_gates already
satisfied for this scope.

**Follow-up (2026-08-31, same task, review round 2):** codex review flagged
that the vision spend had no ceiling independent of `discover.mjs`'s
operator-settable `--max` dispatch input, contrary to CLAUDE.md's "Cost
discipline" rule that any product LLM call be worker-side and hard-capped.
Fixed with two independent caps: `discover.mjs` now clamps `--max` to a
`HARD_MAX_PER_RUN` of 25 regardless of the dispatch input, and
`verifyTaylorPresence` itself enforces a process-local
`MAX_VERIFY_CALLS_PER_PROCESS` of 60 (fails closed, same posture as a
missing API key) as a safety net at the actual spend site.

---



**Founder complaint (verbatim):** "Please stop this social media post from
going out. Also please figure out why our social media is so bad that it
would write this crap. Must be better!! Our whole social kinda sucks atm. I
want just pictures of Taylor and Taylor related stuff, no more pictures of
our website." `SOCIAL_FREEZE` was set live by the operator before this
investigation began and is **not** touched by this entry — lifting it stays
a founder call.

**Root cause #1 — the bad caption.** The post that triggered the complaint
(`social/queue/2026-08-31-appearance-ldBrFonU8NA-ig.json`, caption "my whole
day is now about Taylor Swift, beyonce and more pay tribute to dolly
parton!!") is **template-generated, not desk-authored.** It came from the
`appearance-discovery` fast lane (`scripts/appearance-discovery/discover.mjs`
→ `scripts/appearance-discovery/lib/social-draft.mjs`), added 2026-08-25 —
a fixed-string template that fires on every new official Taylor YouTube
upload with **zero LLM judgment and zero planning-layer review** (it bypasses
Tree's calendar entirely — see the open incident Tree itself flagged in
`social/calendar.md` this same week, issue #3584). The template's fixed
hook lines ("i hit play SO fast", "drop everything because…") plus its fixed
closer ("i haven't watched yet — come watch with me!!") are exactly the
"generic breathless fan-account voice" failure the 2026-08-11 Growth/Tree
split was built to prevent — except this lane sits outside that system,
so none of the quality machinery (Tree's calendar, the desk's own judgment)
ever touched it. It also literally disclosed in the caption that nobody had
watched the video, which reads as glib over a Dolly Parton tribute video.
This is **not** the Growth desk's judgment failing — Growth-authored posts
(`social/posted/*.json`, the heartbeat/thread/mood/launch lanes) do not
carry this voice; every "did you know"-class regression on that side was
already caught and fixed in the 2026-08-11 Tree rebuild.

**Root cause #2 — website screenshots as post media.** `docs/marketing/
social-strategy.md` §2 already said a `site-screen` (a screenshot of
longlivets.com) is only legitimate "for posts whose subject IS a product
surface (a launch, a how-to)" — but nothing on the merge path enforced that
scope. `scripts/social/check-drafts.mjs` only checked that a `site-screen`
tile lived under `/social/library/` and NOT under the credited-photo prefix;
it never checked which campaign was using it. Result, audited this run
against `social/posted/*-ig.json`: **7 of the last 10 posted Instagram
items used a website screenshot, 3 used a real Taylor photo** (target is
≥70% real photo) — heartbeat and era-deep-cut posts, which strategy §2 never
authorized for `site-screen`, were shipping site screenshots anyway because
the gate didn't know the difference. Separately, and worse: the
`appearance-discovery` fast lane declares its rehosted YouTube thumbnails
`mediaKind: "photo"` (not `site-screen`) — `check-drafts.mjs`'s photo check
only verifies the file lives under `/social/library/photos/` plus a credit
string, it never verifies Taylor is actually IN the image. One of the three
queued items (`appearance-XwCWKSO0F8s`) is a Pixar-style animated tree/tire
swing thumbnail with no Taylor in the frame at all, declared "photo" and
would have shipped as one — verified visually this run.

**Fixes shipped in this PR (small, mechanical, reversible — under standing
agent authority per project registry `merge_authority: agent`):**
1. `scripts/appearance-discovery/lib/social-draft.mjs` — rewrote both the X
   and Instagram caption templates. Calm and factual, still title/channel/
   URL-only (this lane must never claim anything about a video's content —
   nobody has watched it), no forced enthusiasm, no longer disclosing "i
   haven't watched yet" as if that's charming. Verified against
   `check-drafts.mjs`'s real gates (voice, opener-collision, cross-post
   similarity) via its own test suite plus the fixed queue items below.
2. `scripts/social/check-drafts.mjs` — new gate: an Instagram `site-screen`
   tile is only accepted when the draft's `campaign` starts with `launch:`
   (the one place strategy §2 actually authorizes it). Every other campaign
   family must use a real Taylor `photo` or go text-only on X. This is the
   enforcement strategy §2 always described but the code never had.
3. The three queue items already staged by the fast lane
   (`2026-08-31-appearance-ldBrFonU8NA-*`, `2026-09-01-appearance-
   T6iTnTV-Rgw-*`, `2026-09-01-appearance-XwCWKSO0F8s-*`) had their bodies
   regenerated with the new template so, if/when the founder lifts
   `SOCIAL_FREEZE`, they no longer carry the old voice. `SOCIAL_FREEZE`
   itself is untouched.

**Left as a founder decision (not implemented here — this is exactly the
kind of product-direction call that shouldn't be unilaterally decided):**
1. **Whether the `appearance-discovery` fast lane should keep auto-posting
   at all**, or be downgraded to intake-issue-only (the slower, human-
   reviewed Vault-authoring lane already exists per-video) until it can
   route through Tree's calendar/judgment layer like every other post. This
   PR only makes its existing captions calmer; it does not add a planning
   or verification layer to the lane itself.
2. **Whether `mediaKind: "photo"` should require a human (or a vision
   check) to confirm Taylor is actually in the frame** before a fast-lane
   thumbnail can be declared "photo" — today the check is purely
   path+credit, which is how `XwCWKSO0F8s`'s Taylor-free animated thumbnail
   almost shipped as a "photo."
3. **Growing the cleared-photo corpus** — `apps/web/public/social/library/
   photos/` has only 4 genuinely license-cleared Taylor photos (the
   `appearance-*.jpg` YouTube thumbnails are NOT part of that corpus and
   were never meant to count toward it). With ~16 Instagram slots a
   fortnight and 4 real photos, the ≥70%-real-photo target is arithmetically
   unreachable regardless of the new `launch:`-only gate above — Tree
   flagged this the same run (`social/calendar.md`). Sourcing more CC-
   licensed Taylor photos is real ongoing work, not a one-line fix.

**Approved by:** Joey's 2026-08-31 complaint is the founder direction being
implemented here ("no more pictures of our website" = settled scope, not
re-litigated). The three items above are new founder decisions this entry
raises, not yet made.

**Implementation:** `scripts/appearance-discovery/lib/social-draft.mjs`,
`scripts/social/check-drafts.mjs`, `scripts/social/check-drafts.test.ts`,
`social/queue/2026-08-31-appearance-ldBrFonU8NA-{x,ig}.json`,
`social/queue/2026-09-01-appearance-T6iTnTV-Rgw-{x,ig}.json`,
`social/queue/2026-09-01-appearance-XwCWKSO0F8s-{x,ig}.json`.

---

## 2026-08-31 — D3=A, D4=B, D5=A, D6=A: Tier-2 founder decisions from `TIER2-OPTIMIZATION.md`

Joey ruled on all four founder-gated Tier-2 recommendations from the Fable
cost/benefit analysis (`docs/TIER2-OPTIMIZATION.md`) in one pass:

**D3 = A → T-6: create "Karen Deep."** Full dial (`--factual-batches 2
--image-batches 1`), ≈$114/month on `claude-sonnet-5`, on the same
Anthropic account the fleet already runs on (Joey's, per D1=B above — not a
new vendor/service). The spec was already fully written in `runners.md` §
"Karen Deep — trigger config to create"; this decision is the founder yes
the spend gate (`AUTOMATION.md` § Adding-a-routine) required. Prompt file
(`runner-prompts/karen-deep-review.md`) already existed; the "NOT YET
CREATED" registry warnings are struck in this PR since the spec is now
approved, but the live `RemoteTrigger` still needs a session authenticated
to Joey's Claude account to actually create it (same account-access
constraint every other trigger creation in this repo has hit — see
`runners.md` § "Tree's routine does not exist yet").

**D4 = B → T-7: Nils cadence = twice weekly (Mon+Fri).** The Fable analysis
recommended twice-weekly over the weekly status quo or a daily restore;
Joey picked B (twice-weekly) — it halves the worst-case unreviewed-content
window on auto-merged content for ~1 extra Opus session/week. `nils.md`'s
charter and `runners.md`'s live-trigger table are updated to match.

**D5 = A → T-11: run the 2-week Austin Fable→Opus 4.8 trial.** `austin.md`
§ Cadence pins Austin to Fable "unless founders say otherwise" — this is
that recorded founder yes. Judge by the charter's own existing metrics
(Codex findings-per-PR, rework rate) against the Fable baseline weeks;
**any counted degradation in findings-per-PR reverts the trial** (a
one-field trigger change back to Fable). T-19's stale "×2/day `0 16, 0 21`"
entry in `runners.md`'s historical split table is fixed in the same pass
(rides along per the analysis).

**D6 = A → T-16: create the weekly notification-quality desk.** Sonnet 5,
weekly, on the standard desk pattern: reads last week's sends/open-rates via
`/api/notifications/metrics` and `deliveries`, files tickets on
over-firing or under-performing categories (≤5/run), one log issue. New
charter (`agents/notification-quality.md`), prompt file
(`runner-prompts/notification-quality-run.md`), and registry row added.
**Sequencing note:** the analysis said this should launch *after* REC-1's
notifications-dispatch watchdog heartbeat lands
(`docs/automation/review-2026-08-31.md#rec-1`) — verified in this PR that
REC-1 has **not** landed yet (no `dispatch_runs` table, no watchdog step, no
`notifications-freshness.mjs`). Per the founder instruction not to block
indefinitely on that precondition, the desk's charter/prompt/registry are
built now and its `runners.md` row is marked `⚠️ NOT YET CREATED — sequence
after REC-1 lands` rather than creating the live trigger ahead of its own
data-quality dependency.

**Why (all four):** these are the four founder-gated items the Fable
analysis could not resolve on its own — two new-spend calls (Karen Deep,
notification desk) and two charter/model-pin overrides (Nils cadence,
Austin's Fable pin) — everything else in the analysis was already inside
standing agent authority.

**Alternatives considered:** per-item alternatives are recorded in
`TIER2-OPTIMIZATION.md` §§ B6/T-6, B2/T-7, C5/T-11, T-16 (weekly vs.
twice-weekly vs. daily for Nils; full vs. half-batch dial for Karen Deep;
declining either new-spend item; skipping or further delaying the Austin
trial).

**Approved by:** Joey, 2026-08-31, D3=A/D4=B/D5=A/D6=A (recorded on Kanban
task t_e698ab19, in response to the Fable analysis referenced above).

**Implementation:** `docs/agents/runners.md`, `docs/agents/nils.md`,
`docs/agents/austin.md`, `docs/AUTOMATION.md`, new
`docs/agents/notification-quality.md`, new
`docs/agents/runner-prompts/notification-quality-run.md`.

---

## 2026-08-31 — D1=B: scheduled routine fleet correctly runs on Joey's account

**Decision:** the automated routine fleet (~24 Claude desk triggers) stays on
**Joey's** account, permanently. Do not migrate any routine to Wyatt's
account. This makes explicit, as the intended standing policy, what has been
the live reality since the fleet was consolidated onto Joey's account
~2026-08-23 (after issue #2258, the prior account's routine loss) and
verified live 2026-08-27 ("Nothing remains on the other founder's account").

**Why:** the 2026-08-31 automation audit (PR #3593, `docs/AUTOMATION.md` +
its companion `docs/automation/review-2026-08-31.md` and
`docs/automation/doc-quality-2026-08-31.md`) flagged that the written policy
in `CLAUDE.md` and `docs/agents/runners.md` still said Wyatt's account while
the live fleet had been on Joey's for weeks — an unresolved, Joey-only
recurring-spend call. Joey's ruling: the consolidation was a reasonable
outcome of the #2258 incident and should stand; migrating ~24 triggers back
to Wyatt's account (each needing a full `job_config` round-trip per the
RemoteTrigger footgun in `runners.md`) is real, error-prone work with no
offsetting benefit. Correct the docs to match reality instead.

**Alternatives considered:** (a) migrate the fleet back to Wyatt's account to
match the original 2026-07-12 policy — rejected, real work with no benefit
and the original policy's premise (freeing Joey's weekly token limit) no
longer needs a dedicated second account now that spend is Sonnet/Haiku-tiered
and metered. (b) leave the gap flagged but unresolved — rejected, it's a
standing invitation for a future agent to "fix" the fleet by migrating it
somewhere worse.

**Approved by:** Joey, 2026-08-31, D1=B.

**Implementation:** `docs/agents/runners.md`, `docs/AUTOMATION.md`,
`docs/automation/doc-quality-2026-08-31.md`, `MAP.md`, `docs/agents/tree.md`,
`docs/agents/paul-blart.md`, `docs/agents/laura.md`, and
`.github/workflows/watchdog.yml`'s alert text corrected in PR #3598.
`CLAUDE.md`'s two references (§ Operating habits, § Parallel fleets) remain
stale pending a separate protected-file write — that file's write tool
hard-blocked the edit with an unresolved approval prompt.

---

## 2026-08-30 — Standing authorization: E3 *** runs at the $5/run cap


**Decision:** `merch-audit-authoring` runs are standing-authorized by Joey at
the existing $5.00/run reservation cap, existing model (`claude-sonnet-5`)
and pre-call reservation policy. Agents dispatch runs whenever new eligible
image pairs exist (for example after product-image re-sourcing) without a
fresh founder ask. Anything beyond this lane — a higher cap, a model or
policy change, or vision spend outside E3 authoring — still requires Joey's
approval, requested with a concrete reason.

**Why:** The first two capped runs proved the lane safe and cheap (~$5.06
and ~$1.47 reserved) while per-run founder asks added latency without adding
control: the cap, not the ask, is the real safety mechanism. Joey set the
standing approach on 2026-08-30 after authorizing the second run.

**Alternatives considered:** per-run approval (rejected: redundant with the
circuit breaker); unlimited authorization (rejected: cap changes and new
lanes stay founder-gated).

**Approved by:** Joey, 2026-08-30 (recorded on kanban card t_6faf515d).

---

## 2026-08-30 — HUMAN-ACTIONS section structure

**Decision:** `HUMAN-ACTIONS.md` contains exactly one `## OPEN` heading and one `## DONE` heading, with OPEN before DONE. Every numbered item lives in the section matching its status; closing an item moves its complete block into the existing DONE section rather than adding another heading.

**Why:** Marjorie reads the first matching section and stops at the next heading. Duplicate OPEN/DONE headings silently omit real pending work or surface closed work in the founder brief.

**Approved by:** Fable arbitration, 2026-08-30 (FABLE-CONSULT-01a0535c), preserving Joey's already-recorded decisions for #15.

---

## 2026-08-30 — Retain CI-gated auto-merge for eligible UI and client-code changes (closes HUMAN-ACTIONS #6)

**Decision:** Retain the existing `auto-merge-content` behavior, including
automatic landing of eligible UI and client-code changes when the current CI
checks pass.

**Why:** The existing workflow already excludes server-executing and
secret-reading paths while preserving a fast, CI-gated delivery route for
eligible client-side work. Joey chose to retain that scope rather than restrict
it to content files or rename the workflow.

**Approved by:** Joey (direct instruction, 2026-08-30).

---

## 2026-08-30 — Clownbot/Mood/era-reader ratification (closes HUMAN-ACTIONS #5)

**Decision:** Joey's direct statement, “I'm good with these as is,” ratifies
all five dispositions in HUMAN-ACTIONS #5: (1) retain Clownbot's
`claude-sonnet-5` model tier; (2) retain its 200/day/instance cap; (3) retain
the existing Mood route pattern; (4) approve and retain the existing
2026-08-13 Clownbot rebuild decisions entry; and (5) ratify the shipped era
reader bottom navigation as the authoritative override of
`docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3.

**Why:** The listed dispositions were already shipped or documented and had
lost their former owner. Joey's direct acceptance closes the remaining
ratification record without changing their implementation, model/provider
configuration, cap, routing, or the superseded specification text.

**Approved by:** Joey (direct instruction, 2026-08-30).

## 2026-08-30 — Knowledge-engine source and Clownbot state decisions

**Decision:** Reddit denied the knowledge engine's Data API request. Retain
the disclosed RSS-only interim today while a separate sustainable-source
research lane investigates alternatives. Clownbot's current stateless operation
is accepted until it has users; do not enable Supabase anonymous sign-ins or
its server-side conversation-memory feature.

**Why:** Joey directly supplied both dispositions. The RSS interim remains
transparent while a sustainable replacement is evaluated, and there is no
current user need to enable anonymous identities or stored conversation data.

**Scope:** This records only the current source and Clownbot-operation posture.
It does not change Reddit access, Supabase settings, authentication, database
schema, server-side memory, or application behavior.

**Approved by:** Joey (direct instruction, 2026-08-30). Closes
HUMAN-ACTIONS #15.

---

## 2026-08-30 — Community coverage includes creator accounts; refresh is automation-first

**Decision:** Instagram and TikTok creator-account coverage is in scope and
requires an automated solution. Group and invite refresh must be automated. If
full automation is not feasible, the fallback is automated human-action
reminders containing specific instructions. Retain the exclusion of
`r/TravisAndTaylor` and additionally exclude `r/GaylorSwift`.

**Why:** Joey resolved the three open questions recorded in HUMAN-ACTIONS #7
after the community-map research landed. Creator accounts are distinct from
joinable communities, and invites and group availability decay; automation is
therefore the required operating posture rather than a founder-owned manual
cadence.

**Scope:** This records the product-direction and operating posture only. It
does not activate a source, alter `data/communities.json`, configure social or
API access, create schedules, use credentials, or implement the separate
automation-design work.

**Approved by:** Joey (direct decision, 2026-08-30).

---

## 2026-08-30 — FR-MERCH-6: E5 fan-made discovery round-2 repair ruling (t_fe545cfd) — four bounded repairs, no third Codex review

**Context:** Fable arbiter ruling for Kanban task t_fe545cfd (E5 fan-made
discovery lane). Both Codex review rounds are spent; per workflow rule 3 the
escalation path is this ruling, not a round 3. Four round-2 findings were
verified against the code before disposition. The E5 hold recorded in
FR-MERCH-5 ("held on the canonical Etsy key save and the commercial gate")
is settled and is not weakened here.

**Finding 1 — scheduled runs file live while E5 is held.** On the cron
trigger `inputs.dry_run` is empty, so `merch-fanmade.yml` falls through to
`--file`. **Disposition: fail-closed dry-run.** The run step defaults to
dry-run whenever `DRY_RUN` is unset or empty (`${DRY_RUN:-true}` semantics,
compared against an explicit `"false"`); live filing is reachable only via
manual `workflow_dispatch` with `dry_run=false`, which stays behind
HUMAN-ACTIONS #27/#28. The daily schedule may remain as a dry-run freshness
probe (no filing, no spend; Etsy is skipped while the key is absent).

**Finding 2 — `fanmade-candidate` label may not exist (422 on filing).**
**Disposition: idempotent ensure-label.** The filing path creates the label
via the REST API before first use, tolerating already-exists; covered by
`issues: write`, no human step.

**Finding 3 — Reddit intake admits non-shop links.** Any `post.url`
(self-posts, i.redd.it images) becomes a candidate. **Disposition:
deterministic shop-domain allowlist.** A checked-in
`SHOP_DOMAIN_ALLOWLIST` in `fanmade-sources.mjs` gates Reddit-sourced
candidates; reddit-internal and non-allowlisted domains are dropped at
normalization. Zero-LLM; the judged curation lane (D3) is unchanged.

**Finding 4 — dedupe checks only open issues, first page.** Curated-then-
closed candidates would re-file daily. **Disposition: `state=all` with full
pagination** in the dedupe query (same function, same correctness surface).

**Completion:** the four repairs above, plus unit tests for each, are the
exact permitted change set. After local verification (suite green + a
dry-run execution of the script), the task may be declared complete
**without a third Codex review** — these are point defects, not an approach
defect. Any repair outside this set re-opens escalation. Human-only
remainder unchanged: #28 (Etsy key save) and #27 (commercial/counsel gate)
must both clear before anyone dispatches a live filing run.

**Approved by:** Fable arbiter, under Decision Authority's reversibility
line (all four repairs revertible by follow-up PR; the hold and D3 are
untouched).

## 2026-08-30 — E3 reserves the full vision cost before each authoring request

**Decision:** The unscheduled E3 authoring runner
`scripts/merch-engine/audit-matches-authoring.mjs` reserves **$0.03408** before
each Claude Sonnet 5 request: two 4,784-token images plus 512 prompt tokens at
$3/MTok, and 256 output tokens at $15/MTok. If the next reservation would
reach the $5.00 run cap, it does not call the model. The runner records the
reservation total separately from any provider-observed usage and leaves the
remaining pairs unresolved.

**Why:** The prior CLI run only detected its cap after provider usage reached
$5.0562825, before it produced a valid score. A pre-call reservation makes the
documented $5.00 circuit breaker enforceable rather than retrospective. The
125-pair zero-cache maximum remains $4.260, so this cap does not require a
change in approved spend.

**Guardrails:** Thinking remains explicitly disabled; exactly one request is
made per eligible detector cache key; pairs without both image URLs and a
detector cache key are never judged; malformed or failed responses remain
unresolved rather than gaining a fabricated score. The scheduled detector is
unchanged and remains zero-LLM.

**Approved by:** Binding Fable arbiter ruling `FBL-ARB-t_6c7b159c-E3-01`
(2026-08-30), under the existing E3 cost-model decision.

---

## 2026-08-30 — E3 vision judgment uses Claude Sonnet 5 with a $5.00 per-run circuit breaker

**Decision:** The E3 Match Auditor's separate, unscheduled authoring lane uses
Claude Sonnet 5 (`claude-sonnet-5`) for each product-image/moment-image pair.
It sends one call per pair, with two images, `max_tokens: 256`, and thinking
explicitly disabled (`thinking: { type: "disabled" }`). The runner
has a hard **$5.00 USD** estimated-cost cap per run. This is a documentation
policy only: it neither invokes scoring nor changes the zero-LLM scheduled
detector.

**Thinking must be explicitly disabled.** On `claude-sonnet-5`, adaptive
thinking is ON when the `thinking` field is omitted, and `max_tokens` caps
thinking and the structured response together.
`apps/web/lib/longlive/mood-client.ts` records a production truncation from
exactly this interaction at `max_tokens: 400` — the model spent the budget
thinking and was cut off before emitting its structured output — and 256 is
lower still. Disabling thinking keeps the full 256-token budget for the
structured score and is required for the cost reservation below to be exact.
This does not change the reservation itself: with thinking disabled, 256
output tokens per call remains the correct worst-case bound, so the
32,000-output-token ($0.480) figure, the $4.260 total, and the $5.00 cap all
stand unchanged.

**Cost model:** The estimate deliberately uses Claude Sonnet 5's normal,
post-intro pricing: $3.00 per million input tokens and $15.00 per million
output tokens (the $2.00/$10.00 introductory rate expires 2026-08-31).
Anthropic documents a 4,784 visual-token maximum for each high-resolution
image. Each request reserves at most 512 input tokens for the fixed prompt.
At the worst case for the current 125-pair queue: `125 × (2 × 4,784 + 512) =
1,260,000` input tokens, costing $3.780; `125 × 256 = 32,000` output tokens,
costing $0.480; total **$4.260**. The $5.00 cap therefore covers the fully
bounded run with $0.740 headroom while remaining a circuit breaker rather than
a budget to fill.

**Cache and cap behavior:** Results are cached by `(product-image hash,
moment-image hash)` as required by SPEC R5, and a pair is re-scored only when
either image changes. An unchanged steady-state queue costs $0; incremental
runs should cost pennies, while the $4.260 bound applies to a zero-cache-hit
125-pair run. The runner must estimate cumulative cost before each call using
these normal rates and its actual token reservation; if
the next call would reach the $5.00 cap, it stops without retrying or raising
the cap, preserves completed cached results, marks the run partial, and
files or updates a GitHub issue for the remaining pairs. A cap increase needs
a new decision-log entry.

**Evidence:** Anthropic's official [vision documentation](https://docs.claude.com/en/docs/build-with-claude/vision)
sets the high-resolution 4,784-token image ceiling for Claude 4.7 and later;
its official [pricing documentation](https://docs.claude.com/en/docs/about-claude/pricing)
lists Claude Sonnet 5 pricing. The checked-in 2026-07-16 assessment records
the normal $3.00/$15.00 rates and the $2.00/$10.00 introductory rates' stated
2026-08-31 expiry.

**Approved by:** Binding Fable arbiter ruling for `t_475ffa1d` (2026-08-30),
under the reversible documentation-policy authority. The existing approved
Claude access is used; no new provider, account, credential, or spend channel
is created.

**Routing receipt:** Policy revision: dcce3a6; Mode: active; Project: swift2;
Owner: Hermes1; Route: risk-lane; Risk: T3 paid vision-judgment enablement;
Budget: implementation max turns 8; review max turns 3; one writer/worktree;
Gate: R1/R2/R5/R6; cost model before E3 judge calls; Reason: SPEC §5 requires
one vision judgment per comparable pair and CLAUDE.md requires a cost model
before a new AI feature ships; State: cost_model_recorded.

---

## 2026-08-30 — External IP-counsel sign-off recorded for the merch affiliate layer

**Decision:** Record external IP-counsel sign-off for the merch affiliate layer,
covering the right-of-publicity, false-endorsement, and FTC affiliate-disclosure
gate in HUMAN-ACTIONS #27.

**Why:** Joey directly instructed in chat, “Counsel signed off.” This records the
approval without naming counsel, disclosing advice, or inferring conditions.

**Scope:** This removes only the HUMAN-ACTIONS #27 counsel gate. Credential,
spend, CI, independent-review, and all other phase gates remain binding.

**Approved by:** External IP counsel, as reported by Joey in direct chat,
2026-08-30.

---

## 2026-08-30 — X site-screen posts are permanently prohibited; remove the two already live

**Decision:** Delete exactly the two owner-identified live X posts
`2092348505243160881` and `2092276284667691117`, which use product site
screenshots. New X drafts with `mediaKind: "site-screen"` must fail both the
draft-time and queue-schema validation gates. This rule changes neither
Instagram's permitted product screenshots nor X text-only and real credited
photo posts.

**Why:** Joey identified the two live site-screen posts as unwanted and directed
that future X site-screen posts must be impossible. A documented, tested
validator rule prevents a queue path from recreating them; the separate,
parameter-free manual workflow can delete only the two explicitly approved IDs.

**Alternatives considered:** Leaving this as drafting guidance was rejected:
prose alone cannot stop a future queue item. Banning all X media was rejected:
real credited photos remain allowed. Changing Instagram was rejected: its
site-screen use remains allowed for product surfaces.

**Approved by:** Joey (direct instruction, 2026-08-30).

---

## 2026-08-30 — FR-MERCH-5: merch-autonomy source-gate ruling (#3440) — counsel gate binds the PLAN, canonical credential names, R1 lane split for E3

**Context:** Fable arbiter ruling for task t_45978f0b / issue #3440, on the
adopted merch-autonomy PLAN/SPEC (#3439). Successor to FR-MERCH-4. Three
defects; three dispositions; the amendments land in the same PR as this
entry. Scope was authoritative-source amendment only — no engines, wiring,
or schedules were built.

**Defect 1 — PLAN vs the IP-counsel gate.** PLAN Phase 2 claimed the Awin
affiliate branch was "unblocked today" the moment credentials land. That
contradicted the standing 2026-07-08 §3 rule ("nothing monetized ships
without external IP-counsel review") and FR-MERCH-4 (counsel before
affiliate/commercial *implementation*). **Disposition: the PLAN is
subordinate and is amended, the gate is not weakened.** Credentials landing
does not open Phase 2; counsel sign-off does. New SPEC ruling R7 encodes
it; PLAN Phase 2 and the automation table now say so; HUMAN-ACTIONS **#27**
files the counsel engagement (also a spend call, Joey-only). The counsel
gate itself remains human-only — nothing in this ruling substitutes for it.

**Defect 2 — credential-name split.** SPEC uses `AWIN_API_TOKEN` /
`ETSY_API_KEY`; HUMAN-ACTIONS #4 recorded saves as `AWIN_API` /
`ETSY_KEYSTRING` (+ `ETSY_SHARED_SECRET`). **Disposition: the SPEC's
descriptive set is canonical** (`AWIN_API_TOKEN`, `AWIN_FEED_API_KEY`,
`AWIN_PUBLISHER_ID`, `ETSY_API_KEY`, `SEARCH_API_KEY`, plus the two
`NEXT_PUBLIC_*` ids); `ETSY_API_KEY` holds the Etsy keystring value;
`ETSY_SHARED_SECRET` keeps its name (OAuth-only, unused by E5); `AWIN_API`
is retired as ambiguous — the Publisher API token was still pending
generation anyway. **No alias shim and no code migration**: no code reads
any legacy name today, so aliases would be pure standing debt to avoid a
two-minute save Joey performs at provisioning time (HUMAN-ACTIONS **#28**).
Names are non-secret metadata — deciding them is a reversible AI call;
saving values stays human-only.

**Defect 3 — E3 scheduled an LLM.** SPEC's workflow table put vision
scoring + PR output inside scheduled `merch-audit.yml`, violating its own
R1 and the CLAUDE.md freshness-vs-judgment rule. **Disposition: E3 splits
into `merch-audit-detect.yml` (scheduled, zero-LLM — enumerates
new/changed image pairs, files a scoring queue) and a separate authoring
lane (vision judgment, writes tiers, gated PR).** SPEC §5 and §10 amended;
a §10 footnote clarifies that every scheduled trigger is zero-LLM and the
LLM column marks the authoring-lane half (same shape governs E5's curation
and E6's matcher).

**Gate disposition for #3440: PASS with these amendments applied.** Engine
starts: **E1, E2, E3 may start now** (editorial, credential-free, E3 under
the amended lane split). **E0 remains blocked** (affiliate infrastructure —
counsel gate + Awin tokens not yet generated). Joey's D1-a/D3 owner decisions
are recorded separately in the 2026-08-30 decision immediately below: E4 and
E5 are no longer source-blocked by those decisions. **E5 remains held** on the
canonical Etsy key save and the commercial gate. **E6 remains blocked** until
both the search-API account (spend, human-only — HUMAN-ACTIONS **#29**) and
the counsel gate are complete; only then may it run degraded (brand-direct +
paid search, skipping the Awin-index first pass) until E0 unblocks.

**Approved by:** Fable arbiter, under Decision Authority's reversibility
line (doc coherence, naming, lane split — all revertible by follow-up PR).
The human-only remainder is exactly HUMAN-ACTIONS #27 (counsel), #28
(canonical credential saves), and #29 (E6's search-API spend);
later-phase signups already recorded in the PLAN's human-surface list
(Amazon Associates, the deferred D2 catch-all, `vercel env` saves) file as
their phases open, each behind the #27 gate where monetized.

**Addendum — superseded attachment sources.** Per Fable ruling task
`t_b765e7fb`, the PLAN attachment SHA-256
`97e90c682de3d0f69d7d0c9b6801623846aa07298038002463c56b0d11467938`
and SPEC v2 attachment SHA-256
`2c06dd48e8bea781714c1c24170cf4b85fa44dfeaeb98216d165b528a4d989b4`
are superseded by the amended `docs/PLAN.merch-autonomy.md` and
`docs/SPEC.merch-autonomy.md` merged on `origin/main` after #3442. Any
mandate for byte identity to those old attachment hashes is void.

---

## 2026-08-30 — E6 matcher is staged dispatch-only pending its existing gate

**Decision:** Per binding Fable ruling `FABLE-E6-t_0b6b4d6a-2026-08-30-01`,
the E6 matcher may ship as a zero-network, `workflow_dispatch`-only artifact
builder. Its automatic fashion-content trigger remains absent until Joey has
recorded completion of the existing counsel and Search API account gates.

**Why:** This preserves the deterministic matcher and re-source handoff for
review without activating the paid-search-dependent engine contrary to the
existing FR-MERCH-5 decision.

**Approved by:** Fable arbiter under the reversible decision-authority line.

---

## 2026-08-30 — Merch autonomy: full official catalog with verified Amazon alternatives; fan-made line is inspired-by, never bootleg

**Decision:** D1 is **D1-a**. E4 lists the full `store.taylorswift.com`
official-store catalog without affiliate links to the official store. When the
same official item is verifiably available on Amazon, E4 adds a secondary
Amazon affiliate alternative; no Amazon twin means the official item remains
listed with only its direct official-store link. D3 is approved as the hard
fan-made curation rule: **"inspired-by" yes, bootleg no.** E5 must reject
items that reprint official artwork, tour graphics, or photos of Taylor, and
may curate original lyric-reference, era-color, and original-design items.

**Why:** the official-store affiliate posture preserves a complete, useful
official catalog and drop coverage without inventing an unavailable programme,
while verified Amazon alternatives recover monetization where it is real. The
fan-made line keeps the marketplace useful without promoting obvious
reproductions of protected official material.

**Alternatives considered:** D1-b (list only official products with a verified
Amazon twin) was rejected because it would omit official-store exclusives. A
more permissive fan-made line was rejected; it would admit reprints of
official artwork, tour graphics, or Taylor photos.

**Approved by:** Joey (direct instruction, in chat, 2026-08-30).

---

## 2026-08-25 — Social posting stays fully automated; no human review gate before publish (closes #2316)

**Decision:** social posting has no human-review/approval step before a post
goes live, and none is being added. `social/queue/` drafts auto-merge on
green (`.github/content-automerge-allowlist.txt`, per the 2026-07-25
decision below) and ship automatically at their `scheduledAt` via
`social-poster.yml` — no founder reads a caption before it posts. The only
safeguard is the existing founder-notification email the poster already
sends on every post, success and failure, so a founder can check what went
out after the fact. This closes issue #2316's open question ("should the
human-merge gate stand?") — the answer is no, there was never meant to be
one going forward, and the docs conflict that issue flagged is fixed by this
entry plus the companion doc sweep in the same PR.

**Why:** Joey's exact words, in chat: "there is no human review required for
social... social is fully automated, I consider social reversible. all I
want is an email whenever social goes out so I can check it. that email is
working, so we don't need any human overview on social besides that." This
reaffirms and makes explicit what the 2026-07-25 decision already did in
mechanics (`isDue` no longer checks `approvedBy`/`approvedAt`; autoposting
turned on for X and Instagram) but left ambiguous in prose — `social/README.
md` and `docs/agents/growth.md` both still carried language a reasonable
reader could take as "the PR merge is the human gate," which is exactly the
conflict issue #2316 reported when an auto-merge fired on a `growth`-labeled
queue PR nobody had read. Per Joey's authority as sole active decision-maker
for this repo (2026-08-25 governance decision, PR #3154) and his stated
reversibility judgment (a bad post can be deleted/corrected; the account is
not the product), the appropriate control is detection-after-the-fact (the
notification email), not prevention-before-publish.

**Alternatives considered:** (1) keep a discretionary "hold" escape valve
where the drafting run can flag a genuinely alarming item for a human look
before it ships (`docs/agents/runner-prompts/growth-draft.md` step 6) —
kept, since it's the desk's own judgment call on rare content, not a default
review requirement, and doesn't contradict "no review required by default";
(2) require human merge on `social/queue/` PRs specifically while
auto-merging everything else — rejected, this is the exact gate Joey just
said isn't needed, and it would leave `social/README.md`'s "the content gate
stays on `queue/`" language actively misleading again.

**Approved by:** Joey (direct instruction, in chat, 2026-08-25).

---

## 2026-08-25 — Era placement is decided by real-world date, never by subject/catalog era

**Decision:** for every content type and every content-authoring pipeline —
worker extract stage (`current_item`/`live_theory`/`fan_signal`), rumor-desk,
video seeds, moment seeds, theory seeds, all of it — the era a piece of
content is filed under is determined SOLELY by the real-world date of the
event/content itself. It is never determined by the subject matter, catalog,
or songs being covered. A piece of content about an older era that happens
IN a later era's window goes in the later era; the reverse never happens
either.

**Why:** "The Icon Sessions at the Grammy Museum" video — a real August 2026
performance during The Life of a Showgirl era, of a medley of "I Knew It, I
Knew You," "august," and "All Too Well" — was filed in
`supabase/seed/videos/folklore.mjs` because "august" is a folklore song. That
reasoning inverted the rule: the event happened 2026-08-24, inside
`the-life-of-a-showgirl`'s date range, so it belongs in
`the-life-of-a-showgirl.mjs` regardless of which eras the performed songs
come from. This rule already existed in one place
(`docs/agents/content-shift.md`'s YouTube-appearance-intake section, "place
it by published date, not by vibe") but wasn't stated as a blanket rule
covering every content type/pipeline, which is how this entry slipped
through despite it. This decision makes the rule explicit and universal
rather than scoped to one intake lane.

**Alternatives considered:** none — this is a correction of an authoring
error against an intended rule, not a new trade-off.

**Approved by:** Joey (direct instruction, in chat, 2026-08-25, ~10:20 PDT).

---

## 2026-08-25 — Landing page rethink closed: current landing page stays as-is

**Decision:** DoD item 1 ("Landing page rethink — scroll-first + obvious
nav") is closed with no rework. The current landing page (`#684`/`#740`,
eyebrow + subtitle `#1225`, the ModeToggle) is the shipped landing
experience going forward; no new design spec, mockups, or nav rebuild.

**Why:** Joey reviewed the live site and judged the current landing page
already meets the bar — "the landing page is perfect as is." The rethink's
original problem statement (a new user may not immediately understand
"threads," nav visibility) is superseded by this direct read of the shipped
product, not by a design exercise.

**Alternatives considered:** none — this is a founder call reversing planned
scope, not a design trade-off; no rework was started, so there is nothing to
unwind.

**Approved by:** Joey (direct instruction, in chat, 2026-08-25).

---

## 2026-08-25 — Social caption register: from lowercase-warm-detached to "a fan in love, out loud"

**Decision:** the social voice's *register* changes — captions must read as
first-person fan reaction first, fact second (lead with the feeling, then
the one concrete detail that earns it), with exclamation points,
caps-for-emphasis, and up to 1-2 emoji welcome. The test: if a caption could
be read aloud by a documentary narrator without sounding wrong, it's in the
old voice and needs a rewrite. Everything else about the voice is
unchanged and stays binding: sourcing is absolute (never invent a stat,
quote, or event), the `#36`/Clownbot blocklist, Taylor never bare "Swift",
no AI-tell phrases, never speak as Taylor or her team. Landed in
`docs/marketing/social-strategy.md` §Voice, `docs/agents/runner-prompts/growth-draft.md`
§Voice, and `docs/agents/runner-prompts/tree-plan.md` step 3's caption-judgment
check (added: "does every caption sound like a fan in love with Taylor, not
a historian? Detached-clever is drift.").

**Why:** the prior register ("lowercase-warm... a fan telling a fan, not a
brand announcing") had drifted toward flat, detached-clever copy that reads
closer to a museum placard than a fan account. Joey's direct call: fans gush,
and the account should sound like it.

**Alternatives considered:** none — this is a voice/tone correction, not a
new mechanism; no sourcing, blocklist, or attribution rule changes.

**Approved by:** Joey (direct instruction, in chat, 2026-08-25).

---

## 2026-08-24 — Single active decision-maker (Joey); authority line is reversibility, not seniority; every work request funnels to issues or HUMAN-ACTIONS.md

**Decision.** (1) Joey is the sole active founder-level decision-maker for this
project, product and engineering alike. Wyatt remains an owner but takes no
actions and makes no decisions here; all forward-looking "ask Wyatt / Wyatt
decides" language is removed from the governing docs (`CLAUDE.md`,
`docs/cto-role.md`). Historical `(Wyatt, <date>)` attributions in this log and
elsewhere are left intact as factual record. (2) The decision-authority line is
now **reversibility, not seniority**: almost nothing is truly irreversible, so
the AI makes any reversible call itself (architecture, data model, naming,
merging, deploying — anything a `git revert`/redeploy/follow-up can undo), and
founder sign-off is reserved for the short irreversible list (secrets/prod
infra, spending money, product direction, deleting data, force-push). (3) Every
change request — from a founder, an agent brief like Tree's mailer, or anyone —
funnels into a GitHub issue (fleet picks it up) or `HUMAN-ACTIONS.md` (owner-only
actions), never a mailbox; `HUMAN-ACTIONS.md` is Joey's single action pane
(issue #3146).

**Why.** The two-human-founder / human-CTO model the docs encoded no longer
matches reality — Wyatt is disengaged, and routing calls to him stalls work.
Consolidating decisions on Joey and pushing the reversible majority onto the AI
keeps velocity high while preserving founder control over the few calls that
actually can't be undone. The funnel rule closes the gap Tree's 2026-08-24 brief
exposed: an engineering request arriving over email that no queue monitors.

**Alternatives considered.** Keep the CTO role vacant-but-named (rejected — it
just reintroduces a decision bottleneck); leave merge/deploy on the may-not
list (rejected — already dropped 2026-08-22/23 and both are reversible); capture
Tree's asks ad hoc in chat (rejected — that is exactly the lost-in-the-inbox
failure being fixed).

**Approved by:** Joey, in chat, 2026-08-24.

---

## 2026-08-24 — Retired the last 6 live `media.gettyimages.com` comp URLs from seed content; replaced with real, verified, non-Getty images

**Decision:** the 6 remaining `media.gettyimages.com` comp-image URLs still
live in `supabase/seed/**` (surfaced by issue #935 / `HUMAN-ACTIONS.md` #19)
are retired and REPLACED with real, verified, non-Getty images — not
stripped blank. This follows the same retire-and-replace direction as the
2026-08-15 "No rehosted third-party press photos" entry above, extended
here to seed-content hotlinks the earlier pass didn't reach (that entry
closed the `apps/web/public/social/library/**` rehosting practice; this one
closes the remaining `supabase/seed/content/**` hotlinks issue #935 flagged
separately on 2026-07-20).

**Scope:** issue #935 was filed against 17 distinct Getty URLs (33
references) across `fearless.mjs`, `speak-now.mjs`, `debut.mjs`,
`reputation.mjs`, plus 2 in `supabase/seed/candidates/00-orbit.mjs`. A fresh
grep on 2026-08-24 found only 6 distinct URLs (11 live references) still
present — the rest had already been retired by prior "Image-fix pass" /
"Kevin Stream 1" work sessions referenced in this repo's own seed-file
comments. This entry covers those final 6:

1. **Fearless — Taylor Lautner, Dec. 3, 2009** (`fearless.mjs`): replaced
   with the same People.com CDN photo already verified for this repo's
   "Benihana and Menchie's" item, which documents the identical outing —
   no new sourcing needed, avoided a redundant second image of the same day.
2. **Fearless — John Mayer, Z100 Jingle Ball, Dec. 11, 2009** (`fearless.mjs`):
   discovered mid-pass that `origin/main` had already retired this one
   independently (a YouTube concert-footage still, `i.ytimg.com`, credited
   to Samantha Faigen) — kept that existing fix rather than duplicate it.
3. **Speak Now — 2011 Teen Choice Awards white halter dress** (`speak-now.mjs`):
   replaced with People.com's own CDN copy of the same dress/event.
4. **Speak Now — Wonderstruck fragrance launch, Macy's Herald Square, Oct.
   13, 2011** (`speak-now.mjs`): replaced with WWD's own hotlink from its
   contemporaneous launch-day coverage of the same event (allowlisted via
   `PHOTO_HOST_LEGACY`).
5. **Reputation — the "cotton candy" tinsel-fringe dress, Reputation Stadium
   Tour** (`reputation.mjs`): no equivalent single, unwatermarked press
   photo of this exact costume could be verified on an allowlisted host
   after checking Wikimedia Commons' Reputation Stadium Tour categories
   (including the MetLife date itself), Billboard, WWD, and People — those
   turned up other costumes from the same "Delicate" segment, not this
   rainbow take. Reused this item's own `thumbnailUrl`
   (`tayswiftstyle.wordpress.com`, already an allowlisted host and the
   correct dress) for the `photos[]` entry too, rather than force a
   wrong-costume substitute. Left a TODO in the seed file for a cleaner
   single-photo replacement if one turns up.
6. **`00-orbit.mjs` — NYC street style, Aug. 2019** (unpublished candidates
   file, `sourceUrl` was already `null`): no equivalent real photo of this
   specific outfit could be verified on an allowlisted host after checking
   People.com, E! News, Yahoo, and Wikimedia Commons. Set `thumbnailUrl:
   null` / `photos: []` (an established pattern already used 200+ times in
   this same file) with a TODO comment, rather than force a mismatched
   image into an unpublished, never-sourced candidate entry.

Every replacement was verified live via this repo's own `probe()`
(`scripts/content-engine/checkers/image-liveness.mjs`) before use — all
resolve HTTP 200/206, `image/jpeg`. `grep -r "gettyimages.com"
supabase/seed/` returns nothing as of this entry.

**Why:** the exposure this batch carried was the same class the 2026-08-15
entry closed for the social library — unlicensed Getty comp thumbnails,
hotlinked and shipped as the product's own asset on a site that carries
affiliate links (commercial use). Tied to the #800 LEGAL launch gate.

**Approved by:** Joey, in chat, 2026-08-24 (`HUMAN-ACTIONS.md` #19) —
retire-and-replace, not license.

---

## 2026-08-24 — Knowledge engine vendor picks: GNews free tier + engineered daily cap; Tumblr consumer-key-only, no OAuth

**Context:** PLAN.md Stage 6 (fan adapters). The 2026-08-23 kickoff entry
left both vendor calls deferred to `HUMAN-ACTIONS.md` #12 items 1 and 4;
Joey answered both live in chat 2026-08-23 22:31 PDT (recorded in that
item's DONE note) — this entry logs the technical decision each answer
implies, per rule 6, not a repeat of the chat exchange itself.

**Decision 1 — GNews free tier, not the paid Business tier the original
proposal recommended.** The free tier's 100-req/day hard vendor cap is
sufficient at this pipeline's actual cadence (6 scheduled runs/day, 1+
query per run) as long as usage is engineered around, not merely
estimated: `apps/worker/src/sources/gnews.ts` reserves budget through a
real durable counter (`api-usage-daily.ts`, a generalized, `scope`-keyed
sibling of `classify/usage-store.ts`'s existing `news_llm_usage`-backed
`UsageStore` — same class, reused, not forked) hard-stopped at 80/day
(`GNEWS_DAILY_CAP`), leaving real margin for retries and a failed run
without ever touching the vendor's actual 100 ceiling. If real usage
patterns later show the free tier is genuinely too thin, upgrading is a
one-line env/cap change, not a re-architecture.

**Decision 2 — Tumblr ships consumer-key-only, no OAuth token exchange.**
`TUMBLR_CONSUMER_API_KEY` (a real repo secret as of 2026-08-23) is enough
for the two public read-only endpoints this adapter needs (`/v2/tagged`,
`/v2/blog/<id>/posts`) — neither requires user authorization.
`TUMBLR_SECRET_API_KEY` (also set) is reserved for a future OAuth flow
that would be needed only for endpoints this build doesn't use (posting,
private/authenticated reads); building that exchange now would be
unused surface area for no present capability gain.

**Approved by:** Joey, in chat, 2026-08-23 22:31 PDT (`HUMAN-ACTIONS.md`
#12 DONE note); this entry is the technical decision record rule 6
requires, filed alongside the Stage 6 build that implements it.

---

## 2026-08-23 — Removed the Claude_Code_Remote-restricted-to-Auditor invariant

**Decision:** Removed invariant #2 from `docs/agents/routine-invariants.md`
("no trigger carries the `Claude_Code_Remote` connector — except the
auditor"). All 22 routines recreated for the issue #2258 migration are
enabled with that connector left in place, rather than requiring a manual
per-routine UI strip first. The invariant is deleted outright, not
"paused" or "waived for this batch" — nothing in the fleet enforces the
one-exception rule going forward, and the Auditor's weekly check no longer
looks for this violation.

**Why:** Joey's direct instruction, in chat, after I flagged what the
connector grants and the incident it was written to close off (below) —
he judged the risk acceptable and asked for the rule removed rather than
worked around. Presented as an explicit choice with the consequence named
plainly (`AskUserQuestion`, both options previewed); he picked removal.

**What this invariant was for, for whoever reads this later:** on
2026-07-25, scheduled routines that could create new triggers via the API
armed self-check-in loops that burned ~144 cloud sessions/day for days,
leaving no trace in git, issues, or CI because they were explicitly
instructed not to comment when nothing changed. `Claude_Code_Remote` is
the connector that grants trigger-creation — the invariant made that
failure mode structurally impossible (no routine could spawn another)
rather than merely forbidden by prompt text. Restricting it to the
Auditor alone (list/get only, by its own prompt's absolute limits) was
the fix. Removing the invariant does not reintroduce the 2026-07-25
incident directly — that required a routine's prompt to actually instruct
self-arming — but it does remove the structural backstop: a routine whose
prompt drifts, is edited carelessly, or is otherwise compromised can now
call `RemoteTrigger create` and nothing stops it before invariant #3 (≤35
enabled triggers) or a founder notices.

**Not touched:** invariants #1 (no `send_later*` names), #2 (no
`persist_session: true`), #3 (≤35 enabled), #4 (no `Task` in
`allowed_tools`) — renumbered from #1/#3/#4/#5 but otherwise unchanged.
The Auditor's own operating limits (list/get only, narrow `allowed_tools`,
cheapest model) are unchanged.

**Approved by:** Joey (direct instruction, in chat, 2026-08-23)

---

## 2026-08-23 — Corrected stale "merge always prompts" claim; AI lands its own PRs directly

**Decision:** Rewrote three passages in `CLAUDE.md` that told sessions
`git merge`/`gh pr merge` "always prompt" as a platform-level "founders'
merge gate" and instructed "open the PR and stop" without merging it:
§ "Never babysit your own PR", § Decision authority, § Agent shell
discipline. The rule now reads: land the PR yourself in one terminal
action — merge immediately if checks are already green, otherwise set
`gh pr merge --auto` and exit — rather than opening it and leaving it for a
human. The "don't babysit" intent (no self-check-ins, Monitors, or wake-ups
to revisit a PR after opening it) is unchanged; only the "don't merge it
yourself" part is removed.

**Why:** Joey spent time last night trying to remove this restriction and
found it still governing sessions today (2026-08-23), during the repowise
install for Swift2 (`#2283`) — a session opened the PR and stopped short of
merging, citing this exact text. The underlying premise was already stale:
the 2026-08-22 entry below claims `gh pr merge` "always prompts for approval
regardless of this list (a platform tool-permission behavior, not governed
by this file)" — but `gh pr merge --squash --delete-branch` on `#2283` ran
and merged with no prompt or friction. `.claude/settings.json` allowlists
`Bash(gh pr *)` and `Bash(git merge *)` directly; there is no separate
confirmation step left to describe as a "gate."

**Not touched:** the other four Decision authority items (product direction,
secrets/credentials/production infra, spending/account creation, data
deletion/force-push) are unchanged. Branch protection on `main` (`build`
must be green) is unchanged — auto-merge still waits on it.

**Approved by:** Joey (direct instruction, in chat, 2026-08-23)

---

## 2026-08-23 — kit-v3.2 orchestration layer restored, superseding the 2026-08-22 "nothing replaces it" decision

**Decision:** Joey asked directly, in chat, to reinstall the kit-v3-lineage
orchestration layer: the `architect`/`executor`/`reviewer` agents,
`triage.sh`/`checkpoint-gate.sh` hooks, `pause`/`human-actions`/
`debug-protocol` skills, `STATE.md`/`PLAN.md` restored as living per-session
files, and a `CLAUDE.md` orchestration section (triage ladder, two-strike
debug rule, context/session-limit discipline). Landed via PR #2279
(`kit-v3.2` branch), merged 2026-08-23.

**Why:** This reverses the 2026-08-22 entry below only in effect — "nothing
replaces it" becomes "kit-v3.2 replaces it" — not in premise; that entry's
"if ever wanted" recovery note anticipated exactly this. Joey's direct ask is
the condition CLAUDE.md's own note required before reintroducing an
orchestration framework. Not a third competing system: same lineage as kit-v3
(retired 2026-08-19), picked back up because AI Dev OS's removal left nothing
in its place.

**What's different from the 2026-08-19 archive:** hooks/skills pulled fresh
from the current kit template (v3.2, not the stale 2026-08-19 copy);
`STATE.md`/`PLAN.md` restored empty, not with their old (already-migrated)
content.

**Approved by:** Joey (direct instruction)

---

## 2026-08-22 — Decision authority loosened: AI may merge/push to `main` and deploy; HUMAN-ACTIONS.md status edits may be delegated

**Decision:** removed two items from `CLAUDE.md` § Decision authority's "AI may
NOT, without explicit human approval" list — "merge or push to `main`" and
"deploy anything." Also amended § HUMAN-ACTIONS.md (and the matching line in
`HUMAN-ACTIONS.md` itself): a session may now write an item's `**Status:**`
change directly when Joey says so in chat, not only when he edits the file
himself — a session still may not flip a status on its own judgment.

**Why:** Joey's call, made in chat 2026-08-22 while working the Wyatt-account
routine handoff (issue #2258) — he wants Claude executing this class of work
end-to-end rather than routing every merge and every HUMAN-ACTIONS.md
reconciliation back through him. `git merge`/`gh pr merge` still always prompt
for approval regardless of this list (a platform tool-permission behavior, not
governed by this file), so a live human confirmation still gates the merge
click itself.

**Not touched:** the other four Decision authority items (product direction,
secrets/credentials/production infra, spending/account creation, data
deletion/force-push) are unchanged. Branch protection on `main` (`build` must
be green, no bypass actors — HUMAN-ACTIONS.md #9) is unchanged.

**Also fixed the same day:** three places in `docs/agents/runners.md` claimed
"live triggers are founders-only" / "creating cloud routines is a Wyatt-account
action" as a hard rule. That was wrong — the `RemoteTrigger` API creates,
updates, lists, and runs routines fine for whichever account the session is
authenticated as (verified against Joey's account 2026-08-22 while working
issue #2258); the actual constraints are (a) it's account-scoped, so a session
can't touch an account it isn't authenticated as, and (b) detaching the
`Claude_Code_Remote` connector is genuinely UI-only, since the API silently
no-ops `mcp_connections: []`. Corrected in place rather than left to mislead
the next session working that file.

**Approved by:** Joey

## 2026-08-22 — AI Dev OS removed entirely; no orchestration framework replaces it

**Decision:** Joey declared the AI Dev OS project a failure and asked for every
trace of it removed from Swift2. All of it is gone: the `CLAUDE.md`
orchestration section, `.claude/rules/ai-team-coordination.md` (the
`REPO-001`…`REPO-007` bundle), the `.gitattributes` LF pin for that rules dir,
and `docs/migrations/2026-08-19-ai-dev-os-v3.2-inventory.md`. The user-level
wiring (global `CLAUDE.md` section, `UserPromptSubmit` hook, `ai-dev-os` MCP
server, `ai-dev` CLI) was already uninstalled at machine scope.

**Nothing replaces it.** kit-v3 was **not** restored — `CLAUDE.md` above the
separator plus GitHub Issues/PRs is the whole contract now. The useful habits
the `REPO-*` rules encoded (branch → PR → green `build` → merge, one editing
agent per isolated worktree, GitHub as shared truth) were already present in
`CLAUDE.md` and survive there, not as a rules bundle.

**Review routing:** the 2026-08-19 entries below say review "is now routed by
AI Dev OS" — that routing no longer exists. Joey's 2026-08-14 ruling stands on
its own: Claude code review of the diff before the PR opens satisfies
cross-review; Codex stays available via `codex:rescue` for risky/architectural
changes. Do not re-raise this with Joey.

**Recovery, if ever wanted:** the deleted files are in git history (migration
landed in `d508f1c8`, removal in this entry's PR); the kit-v3 archive stays at
`docs/archive/kit-v3-2026-08-19/` and the pre-migration tag
`pre-ai-dev-os-migration-2026-08-19` was left in place.

**Approved by:** Joey (removal requested directly)

---

## 2026-08-19 — `main` keeps its PR requirement; the "unprotected" finding was wrong

**Correcting an entry written earlier the same day.** That entry recorded a
decision to leave `main` with force-push/deletion protection only, so direct
pushes would keep working. It was built on a false premise and the decision it
described was never actually available.

**The false premise.** The migration reported `main` as "completely
unprotected", based on:

```
gh api repos/JW-Incorporated/swift2/branches/main/protection
-> 404 {"message":"Branch not protected"}
```

That endpoint only reports **classic branch protection**. `main` was — and
is — protected by a repository **ruleset**, `protect-main` (id `18819106`,
enforcement `active`), which that endpoint does not report. The correct query is
`gh api repos/{owner}/{repo}/rulesets`.

**What was actually true the whole time:**

| Rule in `protect-main` | Effect |
|---|---|
| `pull_request`, 0 approvals | A PR is required; **direct push to `main` is blocked** |
| `required_status_checks` → `build` | `build` must be green |
| `non_fast_forward` | No force-pushes |
| `deletion` | `main` cannot be deleted |
| `bypass_actors: []` | Nobody bypasses, including admins and Actions |

The corroborating evidence was in plain sight and was not checked: **every
commit on `main` carries a `(#NNNN)` PR number.** The error was proven when a
direct `git push origin main` of the migration was rejected with
`Required status check "build" is expected`.

**The standing decision, restated correctly.** `main` requires branch → PR →
`build` green → merge. That is unchanged, was never changed, and matches
`.claude/rules/ai-team-coordination.md` `REPO-004`.

**Joey's stated preference is recorded but not in force here.** He said: *"I
like my claudecode to push to main on my projects that arent live… So I cant
lose that."* Swift2 is live (longlivets.com) and has never permitted it.
Nothing was lost, because nothing was there to lose. Whether to relax
`protect-main` for this repo is left open as `HUMAN-ACTIONS.md` #9, with a
recommendation to leave it alone.

**Workflow rule 2 was amended by Joey the same day** to read *"Never commit
directly to `main` but you can push to 'main' when the branch work is
complete."* That amendment stands as his intent, but note it does not describe
what the repo currently permits — a push to `main` is rejected by the ruleset.
Reconcile the wording, or the ruleset, when he next picks this up.

**Method lesson, recorded in `docs/engineering-lessons.md`:** a 404 from an API
means "not configured *this* way", never "not configured".

**Approved by:** Joey (preference recorded); no ruleset change was made.

---
---

## 2026-08-19 — AI Dev OS v3.2 is the sole orchestration authority *(SUPERSEDED 2026-08-22 — AI Dev OS removed; see the entry above)*

**Decision:** the kit-v3 ORCHESTRATOR CONTRACT inside `CLAUDE.md` was retired.
Routing, model selection, agent spawning, Fable decision authority, task and
runtime state, review loops, checkpointing, pause/resume, supervisor/stall
recovery and team coordination are now owned by AI Dev OS v3.2. `CLAUDE.md`
keeps project policy, project facts and Swift2-specific safety only.

**Why:** the two systems defined the same nine concerns in incompatible ways,
and both were live simultaneously — two `UserPromptSubmit` hooks asserting
different routing ladders, two model authorities, and a direct `REPO-006`
violation (kit-v3 made the mutable `STATE.md` authoritative shared state; the
shared team rule forbids exactly that). Layering was not an option.

**What moved:** `STATE.md`, `PLAN.md`, `PLANtemplate.md`,
`docs/OPERATINGMANUAL.md`, `.claude/hooks/{triage,checkpoint-gate}.sh`,
`.claude/agents/{architect,executor,reviewer}.md` and `.claude/skills/pause/`
were archived to `docs/archive/kit-v3-2026-08-19/`. `guard.sh`, `post-edit.sh`,
`scout`/`researcher`/`grunt`, `MAP.md` and `HUMAN-ACTIONS.md` were kept.

**Alternatives considered:** (a) run both and let precedence sort it out —
rejected, the two hooks fire on every prompt and cannot both be authoritative;
(b) delete kit-v3 outright — rejected, it carried real Swift2 hardening worth
preserving. Archive-and-migrate keeps the work reversible.

**Reversal:** `git checkout pre-ai-dev-os-migration-2026-08-19`, or restore
from `~/.claude/backups/swift2-kit-v3-2026-08-19/`.

**Full inventory:** `docs/migrations/2026-08-19-ai-dev-os-v3.2-inventory.md`.

**Approved by:** Joey (migration requested directly)

---

## 2026-08-16 — Merch is a theme, not an opt-out

*(Migrated 2026-08-19 from `STATE.md`, which flagged both of these as rulings a
future session **will** be tempted to undo.)*

**Decision:** `MERCH_THEME` + `merchStyle()` flow through the **same `--era-*`
mechanism** as Threads' `VAULT_THEME`. `--merch-*` survives only for the three
section accents and the background gradients.

**Why:** that shared mechanism is what makes TopBar / BottomNav / SiteFooter
transition with the page. A page-scoped palette that opts out of `--era-*`
leaves the chrome behind — the first implementation did exactly that and Joey
overruled it. **Never re-separate them.**

**Second ruling, same session — the merch card splits ONLY when both images
exist.** 59 of 156 items have just one photo, so an unconditional split showed
a bare monogram on 38% of cards. `merchItemImage()` is the single source of
that decision. Monograms went 59 → 4.

**Approved by:** Joey (overruled the session's first approach)

---

## 2026-08-14 — Joey is the only merger; Codex is out of the review loop

*(Migrated 2026-08-19 from `STATE.md` § Merge authorization, which was retired.
Recorded here because it is a standing governance ruling, not session state.)*

**Decision:** Joey is the **only** merger, delegated to a session only for the
work that session produced. **Maximum two review rounds, never a third** —
standing and not spent. **Codex is out of the review loop** by his explicit
ruling: *"use claude code review… then just stop reminding me about it."*

**Why:** a four-round review loop on 2026-08-14 burned wall-clock without
converging; the third round was a signal that the fix approach was wrong, not
that more review was needed.

**Consequence, and the conflict it creates:** this **overrides Workflow rule 3**
in `CLAUDE.md`, which requires an independent Codex cross-review. The substitute
the ruling named — the in-house `reviewer` agent — was itself retired on
2026-08-19; review is now routed by AI Dev OS (`review_convergence`,
`delegate_review`, `deepseek_pro`). **Do not re-raise the missing-Codex gap
with Joey**; he closed it explicitly.

**Approved by:** Joey

---

## 2026-08-14 — Community dataset carries per-entry verification provenance

**Decision:** every record in `data/communities.json` carries a `verification`
block — `status` (`verified-live` / `third-party-cited` / `listed-only` /
`blocked-unverified`), `method`, `evidence_url`, `checked_at`. Verified and
unverified entries are never flattened into one list. Where a count cannot be
confirmed, the field is `null` — never an estimate, never an aggregator figure.

**Why:** the research brief required "no hallucinated links", and each platform
permits a different amount of truth. Discord exposes real counts via its invite
API; Reddit blocks this environment entirely (403 on `www.` and `oauth.`);
Facebook groups sit behind a login wall. Without per-entry provenance those
collapse into one confident-looking list and the dataset cannot be refreshed,
only redone.

The concrete evidence this was necessary: published member counts for
r/TaylorSwift ranged from 200k to 3.8M across sources fetched in the same week
(19x). Of 22 candidate Discord invites, 10 were dead or resolved to a different
server, and one directory serves its own promo invite on every page. Roughly
half a naively-sourced version of this dataset would have been fiction.

**Consequences:**
- Yield is 30 entries, the floor of the brief's 30-80 range. That is the honest
  number at this evidence bar; relaxing the bar roughly doubles it with fiction.
- Facebook, predicted as the largest category, is the smallest (5). The groups
  exist; they leave no verifiable trace from outside.
- Reddit entries carry names and stories but NO counts. **A Reddit API app
  would unblock this and make the dataset genuinely refreshable.**
- `r/TravisAndTaylor` excluded as an anti-fan snark board, not a fan community.
  `r/GaylorSwift` included but flagged as reportedly private since Aug 2025.

**Open, not decided here:** (1) the spec (`docs/definition-of-done.md` item 4b)
names Instagram and TikTok; the research brief omits them, and they are a
different shape — creator accounts, not joinable groups. (2) The spec requires
"an owner with a refresh cadence" and nobody owns it. This dataset is accurate
on 2026-08-14 and decays from there.

**Approved by:** pending — Joey (scope: Instagram/TikTok, refresh owner).

## 2026-08-14 — Karen's report path is hers alone, and the watchdog checks provenance

**The incident.** A watchdog email reported that the 2026-08-14 Karen run
"scanned, wrote its report, then died before filing," destroying 830 findings.
That diagnosis was wrong. Verified by `git log` on the report files themselves:

| Report | Added by |
|---|---|
| `2026-08-14-cie-run.md` | `c0477cc9` — photo-enrichment, PR #2088 |
| `2026-08-13-cie-run.md` | `5a4266b8` — rumor-desk, PR #2064 |
| `2026-08-12-cie-run.md` | `87692e81` — depth-audit, PR #2028 |

None of them is a Karen PR. **Karen's last actual run was PR #1850 on
2026-08-09** — she has been dark for five days. Other content-authoring agents
run `run.mjs scan` as a self-check and their PRs commit the report into the
path Karen owns, so the file keeps looking fresh while nothing runs.

Nothing was destroyed on 2026-08-14, because nothing was ever filed: that
report is a byproduct of a photo PR. The 2026-08-12 report's own verdict reads
`status=dry-run filed=25` — an agent running without `--create`, not a crash.

**Decision 1 — `docs/audits/engine/<date>-cie-run.md` is Karen-exclusive.**
A bare `scan` writes its report to a git-ignored scratch path instead. Other
agents keep their self-check; they lose the ability to clobber Karen's
evidence. Alternative rejected: asking each content runner not to commit the
file — that relies on every future runner remembering, and the failure is
silent when one forgets.

**Decision 2 — the report carries its own provenance, and the watchdog reads
it.** The engine stamps which command produced a report. The watchdog stops
inferring health from "newest file by name contains a marker," which cannot
distinguish Karen's output from an unrelated agent's. Alternative rejected:
checking the adding commit's PR title — works, but is archaeology the watchdog
should not have to do.

**Decision 3 — the real alarm is "Karen has not run," not "the last report
looks odd."** The watchdog gains a staleness check on Karen's own runs. This is
the check whose absence let a five-day outage pass unnoticed; the existing
freshness check was satisfied by other agents' files the entire time.

**Not fixable in this repo, and not fixed by this entry:** whether Karen's
cloud routine is enabled at all. She is a Wyatt-account routine
(`docs/agents/runners.md`), not an Actions workflow, so her trigger is not
visible from here — `CronList` only sees the current session. **Someone with
access to the routine dashboard must confirm she is live.** Every fix here
makes the next outage visible within a day; none of them restarts her.

Also noted: `docs/agents/runners.md` contradicts itself on cadence — :387 says
nightly `0 9 * * *`, :365 says a 2026-07-25 override to weekly `0 9 * * 0` is
still in force. The PR gap since Aug 9 (a Sunday) is consistent with weekly.
Resolved in the doc as part of this work; if weekly is wrong, the fix is a
trigger change, not a doc change.

Decided by: Claude, on Joey's instruction ("fix the mechanics of the system").

---

## 2026-08-13 — Era reader rework: bottom nav, one global filter, timeline doorways

Five decisions, all Joey's, taken on the consolidated team review of the "Time
Machine Mockups" artifact. Recorded before implementation per Workflow rule 6.
Implementation plan: `PLAN.md`; branch `feature/era-reader-rework`.

**Decision 1 — mobile navigation moves to a bottom tab bar. This overrides a
prior CTO-side rejection, deliberately.** `docs/specs/2026-08-13-landing-page-
brief.md` §3.2 and D3 record that a bottom-edge control was tested on-device and
rejected for colliding with mobile browser chrome and the home indicator, and
that it could return only "via a device-tested prototype and Wyatt's explicit
approval." Joey, as CEO, has now asked for it directly and unambiguously ("we
absolutely want mobile to have the navigation you show on the bottom"), on the
grounds that it clears up the top bar. That is a product call he is entitled to
make, and it is taken. **Wyatt has not signed off and is to be notified on the
PR** — per Workflow rule 5 this disagreement is surfaced, not settled quietly.
The three known collisions are treated as build requirements, not as things to
discover later: safe-area insets for browser chrome and the home indicator, and
hiding the bar while a text input is focused so Mood's keyboard clears it. The
FeedbackButton floats above the bar and gains a dismiss (below). If a collision
survives on a real device, the plan says stop and report rather than ship
around it. Alternative rejected: keep the sticky top rail (status quo, D3).

**Decision 2 — the Spotify era player is removed.** "Play the era"
(`EraMedia.tsx`, a click-to-load Spotify album embed) is deleted, and Track
guide takes its slot, its full width and its play affordance. Joey's reasoning:
"people don't want to listen to Spotify on our app — they can open a new tab
for that," and the track guide should be the single focal point between the
lyric and the filter, with song videos playable inside it. Consequence: the era
page has no first-party music playback at all; this is intended. Alternative
rejected: keep both, with the player demoted.

**Decision 3 — one global filter replaces the per-era filters.** Today each
`EraSection` owns its own `activeTags`/`videosOnly` React state, so the filter
resets every time you scroll into a new era. It becomes a single set in the
store, rendered once as a sticky bar, applying to every era at once and
persisting as you move between them. Changing it must leave you in the era you
were already in. The taxonomy is fixed at **six**: Music, Fashion, Tour,
Relationship, Lore, Videos. Joey explicitly scrapped the "Threads gets its own
filter" idea from his own brief; thread and egg doorway cards are instead
categorised under the same six. Alternative rejected: an eight-chip two-axis
row (topics + kinds), and a five-chip topics-only row that would have dropped
the Videos filter that ships today.

**Decision 4 — a synthetic anchor date may position a card but may never be
displayed.** Threads and eggs often have no date, and the era timeline is
strictly chronological. Undated items therefore get a resolved anchor —
borrowed from a related moment, else a related song's release, else the era
midpoint — used solely as a sort key. `displayDate` is null unless the date is
genuinely authored. Joey offered "you are welcome to assign a fake date to it";
this decision accepts the sort-key half and refuses the display half, because
the site's standing honesty contract is that nothing is ever labelled with a
date it does not have. This is not a new rule: `undatedAnchorDate()` already
feeds the scrubber an invisible anchor while the card renders "Date unknown".

**Decision 5 — Clownbot keeps a top-level tab, so the nav is sized for six.**
Bottom nav is four tabs today (Eras, Threads, Mood, Clownbot) and six at full
growth once Marketplace and Community exist. This reverses the mockup's
proposal to fold Clownbot into the feed and drop its pill. Known cost, accepted
with the decision: six labelled tabs do not fit a 390px phone — the bar is
built to degrade to icon-only at five and six rather than break, and is tested
with 4, 5 and 6 entries. Alternative rejected: three tabs now / five later,
with Clownbot reachable only from an in-feed theory board and the footer.

---

## 2026-08-13 — The video plays from the top of a detail page, and a card never shows a video frame it cannot play

Two follow-ups to the one-video-treatment decision below, both closing the same
gap from opposite ends: **a still of a video is not a photograph**, and the app
had been treating it as one.

**Decision 1 — a deferring card's video frame is suppressed, like an owner's.**
The #2057 de-dupe gives a video to exactly one card (the first in feed order),
and that stands. But the *other* card kept a frame of that video as its photo,
with no play control, because #2080's suppression only ever compared a card's
photo against the video that card PLAYS — and a deferring card plays none. So
`feedCardImageHidden` (`video-affordance.ts`) now answers both cases, comparing
against every video the era can play (`eraKnownVideoIds`), not just the card's
own — and it takes no `ownsVideo` argument, because the answer is the same on
both sides of the de-dupe (it replaces `cardImageDuplicatesVideo`, which is
gone). Ownership decides what REPLACES the photo — a poster, or nothing — which
is the tier question. Where suppression leaves a card with no picture, the tier
is re-scored without one (`assignFeedTiers(items, imageSuppressedIds)`) rather
than keeping an image silhouette it can no longer fill; `significance` still
outranks that, as it outranks the score.

Deliberately scoped to cards that CARRY footage. 20 moments hold a still of an
era video without carrying the video (a piece about the "22" video illustrated
with a shot from it); they promise no player, and the frame is their only
picture, so suppressing them would delete imagery rather than duplication.

**Decision 2 — a detail hero that is a frame of the moment's own video becomes
the player.** On 10 of the 16 video-carrying moments (8 with no other photo at
all) the ~42vh hero was a still of the very video embedded a screen below —
Photo Enrichment sourced frames as photos precisely because those moments ARE
the video. `heroVideoFor` promotes the video into the hero slot and
`detailVideoFor` yields the body slot to it, so the two are exclusive by
construction rather than by a component remembering to check. A video hero
PLAYS; the lightbox stays for photographs, and the promoted frame leaves the
photo viewer with it. Pages whose hero is a genuinely different photo are
untouched: hero photo, body video, no duplication existed there.

Two carve-outs, both found in review:

- **A sub-confirmed `confidence` outranks the promotion.** #2051 made it
  non-negotiable that the reader meets "Rumor — unconfirmed" *before* the media.
  The body slot sits under that banner; the hero sits above it. So on a rumored
  moment the video stays in the body and the banner still leads. No vault item
  carries both `video` and `confidence` today — which is exactly why the rule
  belongs in code rather than in the corpus.
- **Other frames of the same video leave the body too.** Dropping the hero's own
  `ImageRef` by identity was not enough: "'Elizabeth Taylor' goes to radio"
  carries `maxres3` (promoted) *and* `maxres2`, so the second was woven back into
  the article under a player of the very footage it is a still of.
  `imageDuplicatesPageVideo` matches on the id in the path — the same reason
  #2080 does — and applies whether the video sits in the hero or the body. It
  removes 2 images corpus-wide, both `archival` frames; photographs are
  untouched.

**Sizing:** a 16:9 player cannot honour a fixed 42vh band at both ends —
full-bleed it is 219px tall at 390px and ~850px on a desktop. The player is
aspect-driven with its width capped at `42vh*16/9`, so it fills the column on a
phone and lands at exactly 42vh on a desktop, keeping the page rhythm identical
to a photo page. The article's `-mt-10` overlap is dropped over a player, where
it would crop the frame and sit on the controls.

**Why:** Joey, on the detail pages — "it looks horrible… the site would feel
much more natural if you played the video from the top" — and, on the era feed,
the tloas card "'Elizabeth Taylor' goes to radio", a hero-sized still of the
Elizabeth Taylor music video that does nothing when tapped. A big video-looking
frame you cannot play is worse than the duplication #2080 removed: it promises a
player that does not exist.

**Alternatives considered:** (a) break the #2057 de-dupe so both cards play the
video — reintroduces the exact duplication #2057 fixed; (b) hunt for substitute
photographs for the 8 moments with no alternative — invents a sourcing project
to avoid showing the thing the page is about; (c) suppress every video frame
everywhere, including on the 20 moments that carry no footage — strips real
imagery from cards that were never promising a player; (d) letterbox the player
inside a rigid 42vh band — dead bars at both ends on a phone, where the player
is already shorter than the slot.

**Cost:** none at runtime. Still no iframe in prerendered HTML — the hero renders
`VideoPoster` (a plain `<img>`) and mounts youtube-nocookie only on a real
click, and the player is torn down when the sheet closes.

**Approved by:** Joey (product/UX, 2026-08-13). Implemented in #2081.

---

## 2026-08-13 — Clownbot rebuild — build B ships, in Joey's layout

Seven decisions from the re-spec on PR #1961 (`docs/proposals/2026-08-11-clownbot.md`):

**J1 — Build B, not a refit of build A.** Decided by Joey. The re-spec supersedes the shipped-but-gated build. Rationale: Joey's 2026-08-11 ruling, "get rid of all the old chatbot clown stuff. The items related to threads remain and will actually be inputs for the bot." Build A's safety module, red-team battery corpus, ledger derivation, lore dataset and name registry are ported forward; the rest is shelved to `docs/proposals/2026-08-13-clownbot-shelved-content.md` and deleted.

**J2 — The "current theories" column is derived from the existing corpus.** Decided by Joey. No new content authoring and no scoring engine. Joey: "reuse material we have for now… Long-term we need this to be auto-populated by an engine but that's phase 2 of the clownbot." Phase 2 is explicitly out of scope.

**J3 — Live on merge, gated on a red-team pass.** Decided by Joey, choosing this over shipping dark behind the kill switch. Consequence: the red-team battery becomes a REQUIRED CI check in the `build` job, because a posture that depends on a human remembering to run a script is not a gate.

**J4 — Delulu indicator only; Evidence and Confidence meters dropped.** Decided by Claude under discretion Joey granted. Source cards carry groundedness; three dials restate what the cards already show and fight the chat-box layout.

**J5 — The live-key red-team battery must pass once before merge.** Decided by Joey, 2026-08-13, after it emerged that the CI battery can only hold 30 of 53 attack cases deterministically; the remaining 23 attacks and all 21 Tier B probes are gate-invisible by design and need a real model to exercise. Build A's second-tier semantic output classifier (`clownbot-output-classifier.ts`) was NOT carried forward into build B, so runtime output screening is deterministic-only; the compensating defences are the index-build-time blocklist pre-filter, retrieval-only grounding (the model is handed corpus items and may not invent entities), the output gate's citation validation, and the model's own `offLimits` self-report. Joey chose the one-time live-key gate over porting the classifier forward, which would have doubled per-turn model cost. Porting the classifier remains available to Wyatt if he wants runtime rather than review-time coverage.

**J6 — Merge authorization granted for this work.** Decided by Joey, 2026-08-13, late session. `CLAUDE.md` § Decision authority normally reserves merging to `main` for a founder; Joey explicitly authorised this session to merge the Clownbot rebuild once CI is green, the J5 live-key battery has passed, and the Codex review is complete. This authorisation is scoped to THIS workstream only and does not generalise to other branches or future sessions — the standing rule in `CLAUDE.md` is otherwise unchanged.

**J7 — Codex review is capped at two rounds.** Decided by Joey, 2026-08-13, late session. Workflow rule 3 requires every Codex finding to be fixed before work is declared done; J7 bounds how many review cycles that may take. Reconciliation: at most two review rounds run; everything actionable from both rounds is fixed; anything still outstanding after round two is written into the PR body as a named open finding rather than triggering a third round. Unresolved findings are surfaced, never silently dropped, and they do not block the merge.

**Risk basis for J3 and J6:** Joey's standing instruction for this session was to finish and merge tonight, accepting that a rough or partly-working feature could go live, on the explicit basis that the site currently has zero daily users. If the user count changes, the reasoning behind both J3 (live on merge) and J6 (merge authorization) should be revisited.

**Cost model:** the model call is in the request path but capped and gated, reusing the Mood Chat route pattern — the precedent the re-spec ratifies. Rate limit per IP, a per-instance daily compose cap, a kill switch, and a deterministic zero-model fallback composer so the feature still works when over cap or when the model is down. Both prefill columns and every chip resolve with ZERO model calls.

**Supersedes:** `docs/definition-of-done.md` item 7's now-removed constraint ruling out a request-path model call, which was stale as of this decision.

**Still PENDING on Wyatt (architecture/cost), not decided here:** (1) model tier — Sonnet-class as Mood uses, or Haiku; (2) the cap numbers, proposed at 200 composes/day/instance; (3) ratifying reuse of the Mood route pattern; (4) sign-off on this entry.

**Approved by:** Joey (product call, 2026-08-13). Awaiting Wyatt (architecture/cost sign-off).

---

## 2026-08-13 — One video treatment in the era feed (ends the #2051 → #2055 → #2063 iteration)

**Decision:** every playable video in the era feed renders **the same way**,
regardless of whether the card is a video record or a story moment carrying
footage: a full-width 16:9 poster of the video's own YouTube thumbnail with one
large centered accent play glyph, inside the card. There is one implementation —
`VideoPoster`, exported from `components/longlive/MomentVideo.tsx` — and every
surface renders through it. Two supporting rules fall out of it and are part of
the decision:

1. **A card that plays a video is at least `media` tier** (`withInlineVideoTiers`
   in `feed-tiers.ts`). The `chip` tier is a ~56px dense row and the `text` tier
   is the no-photo breather; a full-width poster on either destroys the
   silhouette that IS that tier — and the claim it makes is wrong anyway, since
   a moment with watchable footage is not a slight item. It is a floor, never a
   cap: `hero` stays `hero`.
2. **A card's own photo is suppressed when it is a frame of the video it plays**
   (`cardImageDuplicatesVideo` in `video-affordance.ts` — superseded 2026-08-13
   by `feedCardImageHidden`, see the entry above). 8 of the 16 moments
   carrying `video` have an `i.ytimg.com/vi/<same id>/…` primary image: two are
   the byte-identical `hqdefault.jpg` url the poster requests, two more are
   `maxresdefault.jpg` (the same frame at another resolution), and four are
   other frames of the same video. Rendering both prints the same footage twice
   inside one card. A photo from anywhere else (album art, a press shot) is a
   different picture and is kept.

**Why:** Joey reviewed #2063 on his phone and rejected it. #2051 established
that a moment carrying footage looked identical to one that didn't; #2055 fixed
that with a text pill that rendered *outside* the card border and read as "no
video here"; #2063 moved it inside as a compact 96px thumbnail row. Each was a
new, different way of saying "this plays". His point is that the reader should
never have to learn a second vocabulary: the video-record cards (he pointed at
the Colbert interview card) already say it with a big poster and a play button,
and that is what every playable card should say. Reusing the component rather
than copying the look is what stops the two drifting apart a fourth time.

**Alternatives considered:** (a) keep the compact row for story moments and the
big poster for records — that is precisely the two-vocabulary state being
rejected; (b) render the poster *and* the moment's own photo everywhere — the
literal reading of "text as today, then the poster", but on Joey's own four
flagged cards it prints the same frame twice, reproducing in the feed the
duplication he separately complained about on detail pages; (c) let the poster
render inside `chip`/`text` unchanged — a 197px poster hanging off a 56px row
reads as a broken card, not as an editorial tier.

**Cost:** none at runtime. No new network calls, no iframes in prerendered HTML
— the poster is still a plain `<img>` and YouTube's player loads only on a real
click (the #1935 click-to-load posture).

**Approved by:** Joey (product/UX call, 2026-08-13, from his phone review of
#2063). Implemented in #2080.

---

## 2026-08-13 — Playable-first timeline: visible video cards always play (supersedes today's fan-re-uploads-are-citations entry)

**Decision:** if a video card is visible, it plays. A video record with no
verified embed is **hidden** from every reader-facing surface (era feed cards,
the Videos rail, the Videos filter, search) rather than rendered as a metadata
card, a link-out, or an "Not available to watch here" state. Hidden, not
deleted: the researched record keeps its summary, symbolism, eggs and citations
in `supabase/seed/videos/**`, and re-adding a verified upload brings the card
back with no code change. Enforced in one place — `videosForEra()` in
`apps/web/lib/longlive/videos.ts` — so no surface can opt out by forgetting.

**Why, in Joey's words (2026-08-13, verbatim):** *"I'm reversing my decision
about the fan re-uploads. I thought you were talking about re-uploads that were
duplicates of already existing content. I don't want anything on the timeline
that can't be played. It just doesn't make sense to show a piece of content
that a user can't view. So let's fix that. Reverse my decision and get all
pieces of content viewable, and anything that doesn't have a video either
deleted or hidden until the content is available. I'm looking for a simple fix
here, not a big in-depth rebuild."* Note his stated reason for reversing: he
had understood the earlier question as being about re-uploads that **duplicate
content we already have**, not about records whose only copy is a re-upload.

**What this REVERSES from the superseded entry:**

- The blanket ban on fan re-uploads as *presentation*. Presentation is now
  governed by playability plus honest attribution, not by channel class alone.
- PR #2055's `NoEmbedFallback` "Not available to watch here" card state, and
  the link-out affordance behind it (`watchAffordance` / `displayHost`). Both
  are deleted — they were built to satisfy "every card either plays or says why
  it can't", which this decision replaces with "every card plays".

**What SURVIVES the reversal, unchanged (scope guard):**

- **Sourcing-gate independence (#2036 / PR #2041):** a fan re-upload still
  counts *zero* toward source independence. This decision is about
  presentation, never about evidentiary weight.
- **The Videos-surface Taylor-on-screen rule (#2042):** if she is not the
  person on screen, it is a timeline moment, not a Videos-rail record. The
  Time Person of the Year TODAY reveal stays banned by video id.
- **`officialUrl` still means official.** A fan archive may never be an
  `officialUrl`. Where a fan upload is ever used as an embed, it must ride the
  `media` oEmbed path with attribution naming the real channel and labelling it
  a fan upload (the shape `folklore: the long pond studio sessions` already
  uses for its official-trailer embed).

**How it landed, in practice:** the reversal turned out to need *no* fan
uploads at all. All 19 unplayable records were audited; 11 were official music
videos that had simply shipped with `officialUrl: null`, and every one of them
has a real upload on Taylor's own YouTube channel (each oEmbed-verified
2026-08-13, `author_name` "Taylor Swift"). Those 11 now embed first-party. The
remaining 8 are the tour films, documentaries and the theatrical release party,
whose works exist only behind Netflix / Disney+ / Apple Music / DVD — no
official upload of the work exists to embed, so they hide. Each is annotated in
its seed file with why.

**Alternatives considered:** embedding official *trailers* for the 8 hidden
films (the shipped `folklore: the long pond studio sessions` precedent) — not
done here, because a trailer is not the work and the ask was explicitly a
simple fix; it is a data-only change if Joey wants those cards back. Deleting
the 8 records outright (Joey allowed "deleted or hidden") — rejected because
the repo rule is never to discard sourced work, and hiding is reversible.

**Who approved:** Joey, 2026-08-13, verbatim above.

## 2026-08-13 — Fan re-uploads are citations, never presentation (SUPERSEDED same day — see "Playable-first timeline" above) (decided by Joey)

**Decision:** a fan/archive re-upload of a video may be *cited* as a source on a
moment (a footnote link with the channel named honestly, e.g. "YouTube —
lionheart33026 (fan archive)"), but is never *presented* as media: no top-slot
placement on a detail page, no play badge, no inline embed, no `officialUrl`,
no Videos-rail entry. Presented media placement is reserved for official
first-party uploads. Concretely: when a moment's only video source is a fan
re-upload, the link stays in the citations, and the card/detail render as
non-video content.

**Why:** three rules landed this week now form one principle, and this entry
names it so future sessions stop re-deciding it piecemeal — (1) the Videos
surface is official-uploads-only (`officialUrl` rule; #2042 tightened it to
Taylor-on-screen-only); (2) a fan re-upload counts zero toward source
independence (#2036 / PR #2041 — footage is evidence, not reporting); (3) the
#2050/#2051 playback build deliberately DROPPED its lone-YouTube-citation
promotion after finding 6 of 29 affected moments cite fan re-uploads — that
drop is ratified here. Presenting a fan re-upload gives our imprimatur to a
link that can vanish on takedown and implies a provenance we haven't verified.

**Alternatives considered:** promoting any lone YouTube citation to the top of
a detail page regardless of channel (built, then dropped in the #2050/#2051
work); a per-case reliability threshold (rejected as unenforceable drift —
the official/fan line is checkable by machine).

**Who approved:** Joey, 2026-08-13, in chat: presented as "keep it as shipped —
fan re-uploads stay as footnote citations; only official uploads get top
billing," answered "I agree with your take. make that a decision."

## 2026-08-13 - [entry removed 2026-08-15; retained in the offline retention archive]

## 2026-08-12 — The Taylor-photo standard: the feed leads with photographs of Taylor, and an empty calendar stays empty (supersedes the 2026-08-11 image-posture ladder)

**Decision:** two reversals of yesterday's social programming, both driven by
issue #2031.

*(1) Media.* The four-rung ladder set on 2026-08-11 — site screenshot first,
designed card second, vetted real photo third, era tile as a declared last
resort — is **replaced** by a three-rung one: (1) a real credited photograph
of Taylor (`mediaKind: "photo"`), the default for every post; (2) a committed
`/social/library/` screenshot (`mediaKind: "site-screen"`), only when the
post's subject *is* a product surface, and on Instagram only as a later
carousel slide behind a photo tile; (3) text-only, X exclusively. **Era tiles
and designed cards leave the feed entirely** — not demoted, removed.
`render-card.mjs` and `capture-screens.mjs` stay in the tree; re-admitting
cards to the feed is a founder call, not a drafter's. The 2026-08-11 entry's
**rights bars survive intact** (credit always, no AI-generated images, no
watermarks, no fan edits without permission, takedown on request) — only its
ordering is overturned. Written out in full in `docs/marketing/social-strategy.md`
§2; enforced by PR #2043. Image sourcing is governed by the third-party image policy entry dated 2026-08-15.

*(2) The drafting fallback.* When `social/calendar.md` has no entry for a
slot, Growth **no longer improvises one from the heartbeat pillars.** The slot
stays empty, the gap is named at the top of the run's PR body, and a
`desk-coordination` issue records the dates. One exception: a real, dated,
sourced on-this-day match in the Vault for that exact day.

**Why:** Joey, looking at the live profile: *"We are a Taylor Swift fan site
whose social media has no pictures of Taylor Swift."* All 10 August Instagram
posts shipped on `/eras/*.png`. The 2026-08-11 ladder is why — it made the
Taylor-free option both the documented default and the cheapest one to
execute, so an agent under time pressure took it every single time, exactly as
written. The 2026-08-06 decision had already demoted era tiles once and the
demotion did not hold; a rung that stays on the ladder gets climbed. Removing
the rungs is the only version of this decision that has ever survived contact
with a runner.

The fallback reversal is the same failure viewed from upstream. The pillar
fallback was designed as resilience — never miss a slot — but a drafter with
no plan and a mandate to fill produces the formula it can generate fastest:
12 of 14 captions opened "did you know", on a generic tile. Silence costs one
empty slot; filler costs the account's credibility with the fans it is trying
to reach, and buries the signal that Tree's weekly routine was never created.
A fan account posting nothing is better than posting slop.

**Alternatives considered:** (a) *Keep era tiles as a hard-justified escape
hatch* — rejected; that is verbatim what 2026-08-11 already tried, and the
justification field was filled in every time it was needed. (b) *Keep designed
cards for text-forward posts only* — genuinely arguable, and the reason the
script survives, but a typography card is still not a picture of Taylor and
the feed cannot afford a second Taylor-free rung while the grid is being
rebuilt; revisit once the grid reads right. (c) *Let the fallback draft but
mark items `needsReview`* — rejected: nothing consumes such a flag before
`scheduledAt`, so it would have posted anyway. (d) *Have Tree backfill on
demand instead of failing loud* — rejected as the cause masquerading as the
cure; Tree's routine not existing is the actual defect, and a fallback that
papers over it is why nobody noticed for a week.

**Approved by:** Joey (verbal direction on the incident, 2026-08-12)

---

---

## 2026-08-12 — The Videos rail is Taylor on screen only (supersedes the appearance-family wording below)

**Decision:** an appearance record requires **Taylor herself as the on-screen
participant**. A broadcast that announces something about her does not qualify,
however big the news. One record was removed on this line: the *Time* Person of
the Year reveal on TODAY (`time-person-of-the-year-today-2023`), which is
Time's editor-in-chief making the announcement. The other 18 appearances on the
rail were audited one by one and all pass — she is the person on screen in each.

**Why:** the entry below left this open. Its reviewer read the record as
mislabelled, the implementing session widened the family definition to "an era
moment" instead of deleting it, and the entry closed by naming the escape
hatch: "if Joey or Wyatt disagrees, the fix is one deleted record". Joey
disagreed — **"it should only be Taylor."** So the fix is the one deleted
record, exactly as scoped. The wider wording is withdrawn wherever it was
written.

**Why the honor is not lost:** removing a record from the Videos rail never
deletes the underlying history. The Person of the Year moment stays in
`supabase/seed/content/midnights.mjs` with all seven of its citations,
including the same TODAY upload as a source link. The rail is a place to watch
her, not the archive of what happened to her.

**Alternatives considered:**
- *Keep the record and keep the wider definition.* Rejected by the owner. A
  rail a fan opens to see Taylor should not open on someone else talking.
- *Ban it by slug only.* Rejected — the candidates ledger still lists that
  upload as verified, so a later integration pass could re-add it under a fresh
  slug and pass the test. The regression bans the **video id** under any slug
  and any era, and the ledger entry is marked
  `videosSurface: 'banned:not-taylor-on-screen'`.
- *Also drop the GMA red-carpet record, as another news-branded upload.*
  Rejected — the rule is about who is on screen, not who owns the channel. She
  walks that carpet; GMA filmed her doing it. Flagged in review as the closest
  remaining call, and left for the owner rather than decided quietly.

**Approved by:** Joey (founder) — the rule itself, in his words. Implementation
and the record-by-record audit: the 2026-08-12 review session.

---

## 2026-08-12 — Source independence is outlet identity; video platforms are evidence, never outlets (#2036)

**Decision:** `independentOutlets()` (`scripts/lib/sourcing-gate.mjs`) stops
counting URL hostnames and counts **outlet identities**:

1. **Video/UGC platform links (YouTube, youtu.be, Vimeo, Dailymotion, Twitch)
   count ZERO toward independence, always** — including official-channel
   uploads. A video is *evidence* that an event happened; it is not an outlet
   reporting on it. An official upload is the subject's own primary source; a
   fan re-upload is nobody's; unknown provenance is classified like a fan
   upload (fail closed). Video links remain valid citations and still satisfy
   the one-source minimum — they just can't lift a `relationship`/`business`
   claim over the two-outlet bar.
2. **Press outlets are identified by registrable domain** (with a small
   ccSLD table so `bbc.co.uk` ≠ `co.uk`), so `music.example.com` and
   `www.example.com` are one outlet. Strictly stricter than exact-host.
3. **An unparseable URL, an IP-literal host, or a trailing-dot FQDN dodge
   counts zero** — previously `hostOf()` returned its garbage input on parse
   failure, so a typo'd URL counted as a full outlet; hosts are normalized
   (lowercase, trailing dot stripped) BEFORE any list check so `youtube.com.`
   cannot re-open the hole.
4. **The subject's own web properties (taylorswift.com, taylornation.com)
   count zero toward independence** — usable citations, never independent
   corroboration of a claim about their owner.

**Why:** issue #2036 — host-keying let any youtube.com link, including an
anonymous fan re-upload, count as one full independent outlet, and two fan
re-uploads as two. Two records were promoted over the two-outlet bar on
exactly that on 2026-08-12, the same day the discovery lane (#2034) started
feeding YouTube URLs into content at volume. Measured against the whole
corpus: 168 `relationship`/`business` moments, 12 lose exactly the phantom
YouTube "outlet", **zero fall below the bar** — the stricter rule delists
nothing, because #2035 already re-sourced the two riders to real press.

**Alternatives considered:**
- *Count an official-channel upload as an outlet identified by channel.*
  Rejected: official uploads are the subject's own account of the event —
  self-published primary sources. Counting them would let "Taylor's channel +
  one outlet" satisfy a bar that exists to require *independent* corroboration.
- *Only demote fan re-uploads, keep official as outlets.* Rejected for the
  same reason, plus provenance is only knowable from `source_type`, which
  most citations lack — the common case would silently decide the rule.
- *Demote `source_type: official/primary` on EVERY host, not just video
  platforms.* Rejected by measurement: the type marks institutions of record
  (grammy.com, nyc.gov) as often as the subject's own properties, and the
  blanket rule delists 3 records that deserve to pass (the awarding body IS
  independent of the subject). The narrow subject-owned-host list implements
  the defensible half mechanically.
- *Full public-suffix list dependency for registrable domains.* Rejected:
  a new dependency for a gate script; the small table fails in the strict
  direction (an unlisted ccSLD collapses further, counting fewer, never more).

**Codex adversarial round (same day):** confirmed the YouTube/trailing-dot/IP
fixes and found the remaining fail-open surface — adopted: mirrors, caches,
aggregators and shorteners (archive.org, archive.today, google.com, bit.ly…)
and self-publishing platforms (medium, substack, blogspot, wordpress) count
zero; non-http(s) schemes, credentialed URLs, single-label hosts,
reserved/special-use names and punycode (xn--) hosts classify unusable; a
small OUTLET_ALIASES table collapses an outlet's own shortener/international
domain (nyti.ms→nytimes.com, bbc.co.uk→bbc.com); and the one-source minimum
now requires at least one USABLE citation (measured free: 0 records ride on
only-unusable citations). Re-measured after all of it: 13 records change
count, still zero fall below the bar.

**Left open, explicitly for Wyatt:** Codex's structural recommendation is a
default-deny **approved-outlet registry** (only registered outlets count,
with canonical aliases) instead of these grow-as-needed denylists — stronger
against unknown-domain gaming (any two real-but-irrelevant domains still
count 2 today), but it makes every new outlet a code change. Also left open:
wire-syndication collapse and category-gaming (a business claim filed under
`music` skips the two-outlet bar) — both pre-existing, neither mechanical.

**Approved:** implemented at Joey's direction (free rein on design);
**sourcing/threshold semantics are Wyatt's call — flagged for his sign-off in
the PR.**

---

## 2026-08-12 — Auto-merge allowlist gains `social/posted/` + `social/failed/`; the poster fails closed on a stale ledger

**Decision:** the social-poster state machinery changes, after the
2026-08-11/12 Instagram triple-post (issue #2031):

1. `.github/content-automerge-allowlist.txt` gains `social/posted/` and
   `social/failed/`. The poster's queue-state PRs (renames of queue items into
   those directories, recording "this already posted / permanently failed")
   auto-merge again the moment `build` is green, as the poster's design has
   always assumed.
2. **The grant is append-only.** The enable job declines to a human any PR
   that deletes, rewrites, or renames-away a record under those paths — the
   ledger is the input to every duplicate defense, so auto-merge may only ever
   ADD to it (review hardening on the fix PR).
3. `social-poster.yml` refuses to post — loudly, red run — while any
   `social-poster/state-*` PR is still open, because the `social/posted/`
   ledger the dedupe checks read from main is then known-stale. Fail closed.
   Honest cost accounting: in the normal case this is one skipped 30-minute
   slot (state PRs auto-merge in minutes); a SUSTAINED strand — including one
   caused by `CONTENT_AUTOMERGE_FREEZE`, a `hold` label, or a red `build` on a
   state PR — halts all posting until a human merges the stuck PR. That is
   deliberate: a halted account recovers; live IG duplicates cannot even be
   deleted via the API. Known secondary effect: items that cross 48h overdue
   during a long halt are retired to `social/failed/` by the staleness sweep
   and need requeueing (recoverable; noted in issue #2040).
4. `SOCIAL_FREEZE` is evaluated first in the workflow, so frozen runs are
   green no-ops (not false watchdog alarms), and the enable job now runs on
   `!cancelled()` so a failed check-drafts/guard-code can no longer skip the
   disarm and let a stale auto-merge arm ride through — plus removed-file
   handling so renames reported as removed+added can't 404 the draft gate.
5. **The poster fails closed on its own ledger read, not just in the
   workflow.** `post-queue.mjs`'s `readJsonDir` swallowed *every* `readdir`
   error and returned `[]`. For `social/queue/` that is harmless (nothing to
   post); for `social/posted/` it made "I cannot read the ledger" identical to
   "nothing has ever been posted" — so a run with an absent or unreadable
   ledger sailed straight past `findPostedDuplicate` and reposted live items.
   That is the incident's own shape (a dedupe source that is unreachable at
   check time, failing open), sitting one layer below the guard in point 3 and
   surviving it: the workflow guard only knows about *open state PRs*, and is
   blind to a ledger that is simply not there. The posted read is now
   `{ required: true }` and throws; `main()` is invoked bare, so the run exits
   non-zero and RED (#1888's loud-failure contract) with nothing posted. An
   empty-but-present ledger stays legal — that is a real cold-start state, not
   a fault. Regression cases in `post-queue.test.ts` construct each broken
   state (missing dir, non-directory, truncated JSON) and assert refusal, with
   two controls proving normal posting and normal dedupe still work.

**Why:** the poster records posting state via an auto-merging PR, but the
allowlist only ever listed `social/queue/`. Before PR #1900 that mismatch was
masked — the poster's own `gh pr merge --auto` arm survived the "declined"
verdict and merged the state PR anyway. #1900 (correctly, as a downgrade
guard) made every non-enabled verdict actively disarm auto-merge, so from
2026-08-11 19:28Z every success-recording state PR stranded open (#1951,
#1952, #1963, #2011), `main` kept showing posted items as queued, and each
30–90-minute run re-posted them: three identical Instagram + Facebook posts
overnight, and a live tweet main still recorded as "retrying". The repo
preferentially forgot successes (rename into `posted/` — declined) and
remembered failures (retry edits inside `queue/` — allowed): the exact
inversion that manufactures duplicates.

**Merge authority rationale (this widens the allowlist, Wyatt's call):** these
two paths are machine-written bookkeeping about actions ALREADY taken on the
live accounts — no content decision rides on them. The content gate remains
upstream on `social/queue/` (check-drafts + validate:social in `build`).
Residual risk is a bot rewriting its own posting ledger — a ledger it already
owns and writes today; the failure mode of NOT allowlisting them is the one
that actually burned us. Approval = a founder merging the PR that carries this
entry (the allowlist is `.github/**`, so it can never auto-merge itself).

**Alternatives considered:**
- *Revert #1900's disarm-on-decline.* Rejected — the disarm is a real
  downgrade guard (a later bad commit must not ride an earlier arm); the
  allowlist being incomplete was the defect.
- *Have the poster push state directly to `main`.* Rejected — `main` is
  branch-protected on purpose, and bots must not push to it.
- *Stop persisting state via PR entirely (dedicated unprotected state branch,
  or querying the platform APIs as the source of truth).* The structurally
  stronger design — the ledger write would no longer depend on a merge gate at
  all — but it changes every read path (`post-queue.mjs`, `check-drafts.mjs`
  recent-history rules, the audit tooling) and is not a same-day fix. Filed as
  a follow-up ticket (see issue #2031's thread); the fail-closed guard above
  caps the blast radius of any future strand to one missed slot meanwhile.

**Approved by:** pending founder merge (Wyatt — merge authority; Joey set
`SOCIAL_FREEZE=true` and is holding it until this lands).

---

## 2026-08-12 — `video_work.kind` grows an APPEARANCE family; the era Videos rail gains a filter

**Decision:** `VIDEO_KINDS` gains four values — `interview`, `award_speech`,
`speech`, `press_event` — forming an "appearance" family beside the existing
"works" family (`music_video` … `performance`). The era filter row gains a
**Videos** chip: a second, mutually-exclusive filter axis that shows everything
watchable in the era.

**Why:** PR #2035 researched and oEmbed-verified 31 YouTube appearances and put
them on the era timelines, but only 2 could reach the Videos surface — the enum
described only things Taylor *made*, so a Grammy speech, a Fallon couch and a
red carpet had nowhere honest to sit. Joey's bar for the program is that the
appearances are "live in their appropriate place in the eras, sortable by a
'videos' filter", and the enum was the thing in the way. 19 of the remaining 29
now reach the rail.

**Why four values, not one per venue:** a talk show, a podcast and a radio
sit-down are the same object to a reader (`interview`); a premiere Q&A, a red
carpet and a news-segment reveal are all publicity (`press_event`). `speech`
stays separate from `award_speech` because a 20-minute commencement address and
"thanks, holding a trophy" read as different records. A ten-value long tail
(`talk_show`, `podcast`, `radio`, `red_carpet`, `news_segment`…) would have
been authoring overhead with no reader payoff.

**Alternatives considered:**
- *Stretch `performance` to cover speeches.* Rejected — the rail would promise
  a performance and deliver a podium. Dishonest labelling is the failure mode
  this taxonomy exists to prevent.
- *A separate `appearance` table/surface.* Rejected — same shape, same sourcing
  rules, same rail; a second pipeline to maintain for no user-visible gain.
- *One flat `appearance` kind.* Rejected — the card's only metadata line is the
  kind label, so collapsing it loses the one word that tells a fan what they're
  about to watch.
- *Make Videos a sixth ContentTag.* Rejected — tags belong to moments; a video
  record carries none, so "Fashion + Videos" would be an intersection the data
  cannot honestly produce. Hence a separate, exclusive axis.

**What did NOT change:** the `officialUrl` rule. An appearance ships only when
the upload belongs to the channel that owns the footage (the show, network,
awards body, or the outlet that filmed it). 10 of the 31 appearances therefore
still cannot reach the rail — their only surviving copy is a fan archive, or no
upload exists at all. They remain timeline moments with a source link. A fan
re-upload is never an `officialUrl`, however long it has been alive.

**Migration:** `supabase/migrations/20260812120000_video_work_appearance_kinds.sql`
widens the CHECK constraint. **Applied to production on 2026-08-13** by Wyatt
(applying is a founder/Wyatt action — `db:*` writes to prod). Verified in prod
at the time of application: the migration is recorded as applied; the superseded
`time-person-of-the-year-today-2023` record is gone (0 rows); and the new kinds
are in use across 84 `video_work` rows — `interview` 8, `award_speech` 7,
`press_event` 2, `speech` 1, alongside the pre-existing `performance` 3.

**Codex review (2026-08-12), and one disagreement left open for the founders:**
- *Enum mirrors:* consistent across all five sites. No finding.
- *`NOT VALID` + `VALIDATE CONSTRAINT` for the migration:* **not adopted**, with
  the reasoning written into the migration. That pattern moves a validation scan
  out of the ACCESS EXCLUSIVE window, but `migrate.mjs` sends a file as one
  query, so both statements would sit in the same implicit transaction and hold
  the lock regardless — and a WIDENED predicate is a superset of the old one, so
  no existing row can fail it. Recorded so a future narrowing migration knows it
  *does* need the two-step.
- *Provenance overclaim:* Codex was right that the VMA 2024 record's note
  implied Access Hollywood owns the ceremony footage. It doesn't — MTV does.
  The note now states only the verified fact (a broadcaster's own upload, not a
  fan re-upload), which is what the rule actually requires.
- *Open disagreement — the TODAY Person of the Year record:* Codex reads it as
  mislabelled, because the event is Time's editor making an announcement rather
  than Taylor appearing. Fair. Two defensible fixes: delete the record, or fix
  the definition. **This change fixed the definition** — the card states exactly
  what it is, the footage is something a fan wants, and deleting verified,
  watchable content to protect a one-sentence definition is the worse product
  outcome. The family is now "an era moment as it played out in someone else's
  programming", with general commentary about her explicitly still excluded.
  **If Joey or Wyatt disagrees, the fix is one deleted record**, not a redesign.
  → **SUPERSEDED the same day** (see the entry above): Joey disagreed, the
  record was deleted, and the family definition is back to Taylor herself on
  screen. Codex's reading was the correct one. Left here unedited because the
  reasoning is what made the escape hatch cheap to use.

**Approved by:** proposed by the 2026-08-12 engineering session (ENGINE lane);
**approved by Wyatt (CTO) on 2026-08-13** — schema sign-off given in a Claude
Code session, and the migration is now applied to production (see **Migration**
above for the verification). Joey's read on whether the appearance vocabulary
lands for a fan is separate and not part of this sign-off.

**Related, same day:** the appearance *discovery* lane below finds new
appearances going forward; this entry is what lets them be represented once
found. The two were written by parallel sessions and are complementary — a
discovered talk-show appearance now has a `kind` to land under.

---

## 2026-08-12 — Appearance discovery: YouTube channel RSS, not the Data API

**Decision:** the content engine gains a standing discovery lane that finds new
Taylor appearances on YouTube forever going forward, built on **public channel
RSS** (`https://www.youtube.com/feeds/videos.xml?channel_id=<id>`), and it is
**deterministic with zero LLM calls**.

Shape: a daily GitHub Actions workflow (`appearance-discovery.yml`) polls a
curated, committed channel list (`scripts/appearance-discovery/channels.mjs` —
14 channels, each with a recorded reason it is watched), applies keyword
relevance rules to video **titles**, and files one `intake` issue per new video.
Nothing downstream changes: those issues enter the existing intake door and the
Content Shift authors them under new handling rules in its charter.

**Cost model.** Discovery is **$0 in model spend** — it is `node` reading 14 XML
documents on a GitHub-hosted runner, in the same zero-AI family as
`watchdog.yml` and `unowned-sweep.yml`. There is no per-user or per-request LLM
call, so this adds nothing to runtime cost (the Vault stays static). The
*judging* half — verify, place, author — rides the **existing Content Shift
budget** and its existing ≤2–3 items/run cap; discovery raises queue supply, not
the token ceiling. A per-run cap (default 10 issues) bounds how much work one
day can inject.

**Why not the YouTube Data API:** it needs an API key, which means a new
account, a new service, and a new secret — all of which are founder-approval
items under CLAUDE.md, and a quota to manage besides. RSS is keyless,
unauthenticated, needs no secret beyond the built-in `GITHUB_TOKEN`, and gives
us the ~15 most recent uploads per channel, which is everything a daily poll
needs. Revisit only if we ever need search across all of YouTube (finding
appearances on channels *not* on the list), which the Data API can do and RSS
cannot. That is the known, accepted limitation: this design sees only curated
channels, and hand-filed intake remains the door for everything else.

**Why zero LLM in detection:** reading XML and matching a title is mechanical,
and rule 8 of CLAUDE.md says codify mechanical work rather than re-executing it
token-by-token. Spending a session's context to re-read fifteen feeds daily
would be the most expensive possible way to do a `grep`.

**Dedupe is stateless, by decision, against two same-week incidents.** The video
id is the fingerprint. Known ids are re-derived every run from the repo-scoped
issue list (open **and** closed `intake` issues) plus the seed corpus — never
from persisted state.

- Never GitHub's global `/search` (#1869, #2008): repo-scoped runners get 403,
  and #2008's code read that failure as "not filed", duplicating #2017–#2027.
  Here an unreadable **or possibly-truncated** ledger **refuses to file**. Fail
  closed: a *transient* failure self-heals on tomorrow's run; a duplicate does
  not. Note the one case that does **not** self-heal: the ledger counts intake
  issues `--state all`, so the population only grows, and at `LEDGER_LIMIT`
  (1000) the refusal becomes permanent rather than daily. The script warns from
  80% so there is room to act; at ~48 issues today that is years out, but it is
  a wedge, not a wobble, and it needs raising rather than waiting out.
- Never state carried by a PR that has to auto-merge (#2031): when the merge
  gate stranded that PR the state silently rolled back and the social poster
  published three duplicates. So there is no state file and no state PR here at
  all — the filed issues themselves are the memory.

**Alternatives considered:** (a) YouTube Data API — rejected above; (b) a
committed `seen.json` ledger — rejected, it is exactly #2031's failure mode and
adds a merge dependency to a read-only job; (c) LLM relevance judging — rejected
as cost with no precision gain over a title keyword at this recall target;
(d) matching video *descriptions* as well as titles — implemented, then removed
after the first live dry run: news/talk-show descriptions are segment lists and
subscribe boilerplate, so GMA's "Rod Stewart calls off remaining tour dates"
matched on a Pop News roundup that listed a Taylor segment. Title-only.

**Approved by:** Joey (pre-approved as engine-lane work); **Wyatt owns the
technical review and the live trigger sync** — per `docs/agents/runners.md`,
changing runner behavior is a PR to the file, while syncing the live trigger is
a founder-only action.

---

## 2026-08-12 — P0: close the auto-merge hole that let server code auto-deploy (#1972)

**Decision:** the content auto-merge gate is tightened, purely additively, so no
file that executes server-side with secrets can auto-merge:

1. The `apps/web/lib/` allow in `.github/content-automerge-allowlist.txt` is
   narrowed to `apps/web/lib/longlive/` (the client/display subtree, where the
   generated vault artifacts and pure view/formatting modules live). The
   top-level `apps/web/lib/*` files — the server data layer `vault.ts`, the CSP
   module `security-headers.mjs`, and the hooks/utils — fall back to human merge
   by default-deny.
2. `!apps/web/lib/longlive/mood-client.ts` is denied explicitly (it reads
   `ANTHROPIC_API_KEY` while living among display modules).
3. A new **content guard** (`scripts/automerge-content-guard.mjs`, run by a
   `guard-code` job in `auto-merge-content.yml`) declines any PR whose changed
   code contains a Next.js route handler (`route.ts`/`.tsx`/`.js` anywhere under
   `app/`, not only `/api/`), a Server Action (`"use server"`), a `server-only`
   import, or a read of a secret env var. A path prefix structurally cannot
   express any of those (a `*/route.ts` suffix; content that can live in any
   file), so this is the durable fix.
4. `apps/web/lib/vault.ts`, `apps/web/lib/security-headers.*`,
   `apps/web/next.config.*`, and `apps/web/middleware.*` are added to
   `NEVER_ALLOWLIST` — they can never be re-allowlisted without a reviewed
   change to the checker itself.

**Why:** red-team finding #1972. PR #1960 widened auto-merge to app code with a
single `!apps/web/app/api/` carve-out. That was too narrow: three real route
handlers already live outside `/api/` (`apps/web/app/vault/{tier0,moment/[id],
album/[slug]/tracks}/route.ts`), the server data layer and CSP module live under
`apps/web/lib/**`, and Server Actions can live anywhere. With `main` requiring 0
approving reviews and E2E not a required check (#669), a CI-passing PR adding a
server route that reads secrets would auto-deploy to prod with no human — a
prod-compromise primitive. `mood-client.ts` reading `ANTHROPIC_API_KEY` from
inside the "display" subtree is a live example that path boundaries do not
separate server from client here, which is why the content guard (not just a
tighter path list) is required.

**Alternatives considered:** (a) explicit client-safe allow-list vs (b) broad
allow + per-path denies. Chose a hybrid: default-deny the top-level lib (a) for
the clean directory split, and the content guard for what no path list can
express. A pure path-based deny cannot cover route handlers (suffix) or Server
Actions/secret reads (content, any location) — stated in the guard's header.

**Residual (not solved here, exposure reduced):** the deeper fix is real
per-author identity plus making E2E a required check (#669); until then app-code
auto-merge still leans on unit+typecheck+build. A Server Component that leaks
data without touching a known secret env var, a `server-only` import, or a
`"use server"` directive is not caught by content signals — path default-deny
plus the required checks are the only net there. `pull_request_target` uses the
base-branch workflow, so this gate takes effect for PRs opened after it merges.

**Approved:** Wyatt (CTO) — P0 directive.

---

## 2026-08-11 — Backups: our own logical backup, not `pg_dump`; drill monthly, not nightly

**Decision:** The BACKUPS launch gate (#680) is met by two layers, and the
second one is ours: (a) whatever Supabase's plan provides — still unverified,
see below — and (b) a **data-only logical backup** taken by
`scripts/backup-restore-test.mjs`: NDJSON per table plus a manifest of row
counts and order-independent content checksums, with **no `pg_dump` /
`pg_restore` binary anywhere in the path**. Schema is restored from
`supabase/migrations/**` in git, not from the backup artifact. The drill runs
**monthly** in CI plus on any change to `supabase/migrations/**`, against a
throwaway Postgres service container with no production credentials. Runbook:
`docs/backup-restore.md`.

**Why:** Three findings drove it.

1. **Most of this database is not at risk.** Schema is git; content is git
   (`supabase/seed/**`) and the live site renders from the committed generated
   vault, not Supabase. The only state that exists nowhere else is the four
   `news_*` tables, `news_source.last_polled_at`, and every generated `uuid`.
   A backup story sized for "we could lose the company's content" would have
   been wrong; the real exposure is small, and *stated*, so nobody
   over-invests here again.
2. **`pg_dump` is not available where this work happens.** No Postgres client
   binaries on the dev machine, no Docker, no Supabase CLI; runners are not
   guaranteed to have them either. This repo's entire DB toolchain already
   speaks `pg` over the wire (`scripts/migrate.mjs`, the seeds), so the backup
   tool speaks it too. A backup tool that cannot be run is not a backup tool.
   The cost is real and accepted: a logical row-level dump does not capture
   roles, grants, or extensions — those come from migrations, and if this
   project ever adds Supabase Storage or Auth, this decision must be revisited.
3. **Cadence is an Actions-minutes decision.** The repo hit 90% of included
   minutes on 2026-07-27 and CI is ~77% of the spend. The drill guards against
   migrations breaking the restore path — a weeks-scale risk — so monthly
   (~3 min/month) plus a `paths` trigger on `supabase/migrations/**` catches
   the actual failure mode at ~1/30th the cost of nightly.

**Alternatives considered:** *Supabase PITR / branching* — rejected for now:
paid, and unverifiable without dashboard access; it remains the right answer
for "bad write 20 minutes ago" and is called out as a founder decision below.
*A one-off manual restore, documented* — rejected under CLAUDE.md rule 8: a
runbook nobody re-executes is a runbook that has already rotted, and the gate
asks for a *tested* restore, which only stays true if it keeps being tested.
*`pg_dump -Fc` in CI only* — rejected: it would make CI the only place the
backup path works, which is precisely backwards for a disaster procedure.

**Still open — founder decision (Wyatt):** nobody has confirmed which Supabase
plan this project is on or whether automated daily backups / PITR are actually
enabled for it; that needs the dashboard. On the free plan there are no
automated backups at all, in which case layer (b) is the *entire* backup story
and that should be an explicit, accepted risk rather than an assumption. Also
open: one real-data drill against production (read-only source, scratch
target) before launch — the committed drill proves the procedure, not
production's own bytes.

**Approved by:** proposed by the Build desk under #680's routing (Marjorie,
2026-07-15, executing Joey's directive on brief #650); the two open items
above are Wyatt's to close.

---

## 2026-08-11 — The queue gets a schema gate in required CI, not only a draft-time checker

**Decision:** Add `npm run validate:social` (`scripts/social/validate-queue.mjs`
+ the pure `scripts/social/lib/queue-schema.mjs`), wired into CI's required
`build` job. It parses every `social/queue/**.json` and enforces shape:
platform enum, non-empty body, per-platform body-length caps (X's 280
**weighted** characters — the same `weightedTweetLength` rule
`check-drafts.mjs` uses, where an autolinked URL counts as 23 — and
Instagram's 2,200), ISO-8601 `scheduledAt`, per-platform media rules
(required for IG, ≤4 images for X, ≤10 for an IG carousel, site-absolute
paths), and bookkeeping-field types.

**Why:** `validate:content` covers only `supabase/seed/**`, and
`check-drafts.mjs` (the draft-time quality gate) runs against the files a PR
touches. Neither layer guards an item that is already sitting in the queue
when a rule tightens, or that lands via a path that skips the draft checker —
until now the first validator such an item ever met was the live platform API
at post time, with three retries and then `social/failed/`. That is how
eleven over-length X drafts died on an unexplained 403 over two weeks (the
280-weighted-limit diagnosis and the draft-time length check landed earlier
today — see the Tree entry below and `docs/marketing/social-strategy.md`).
A parse check also means a truncated/malformed JSON draft fails on its own PR
instead of crashing the poster mid-run.

**Alternatives considered:** Making the poster truncate an over-length body
automatically — rejected, silently publishing a cut-off sentence is worse
than not publishing. Only checking PR-touched files — rejected, that is the
layer that already existed and is kept; this gate is the backstop for items
nobody edits. Warning instead of failing CI — rejected, a warning is what the
previous two weeks already were.

**Approved by:** Wyatt (CTO agent), pending review. If the account is
upgraded to X Premium the 280 cap must be raised deliberately in
`scripts/social/lib/queue-schema.mjs` (and `check-drafts.mjs`), in a PR, with
the upgrade.

---

## 2026-08-11 — Not-yet-deployed media WAITS visibly; Instagram containers are polled to FINISHED

**Decision:** Three coupled changes to `scripts/social/`, integrating with the
deploy-lag preflight and 48h staleness rule that landed via PR #1900:

1. **A blocked item is a first-class run-report outcome.** The poster's
   deploy-lag preflight (media not live on the site yet) now records the item
   as `waiting` — no publish, no Graph write, no attempt spent, still queued,
   ships itself on the first run after the deploy lands — and every skip
   (idempotency duplicate, era-art guard, same-run media dedupe) is a
   `skipped` outcome, each carrying how long it has been overdue.
2. **An escalation ladder, not a silent hold.** A `waiting`/`skipped` item
   past 24h overdue (`STUCK_AFTER_HOURS`, lib/run-report.mjs) turns the run
   red with an `::error::` annotation while the item is still recoverable;
   the existing 48h `isStaleDue` rule then retires it to `social/failed/` a
   day later if nothing changed. 24h makes it loud, 48h moves it — two rungs,
   one mechanism each.
3. **Instagram containers are polled to `FINISHED` before publish**
   (`lib/ig-container.mjs`), including each carousel child and the parent —
   issue #1897. Bounded at 90s / 3s intervals; `ERROR`/`EXPIRED` fail the
   attempt. Retries structurally cannot fix this race (every attempt builds a
   fresh container and publishes milliseconds later), and Meta stamps
   `is_transient: false` on error 9007/2207027 while its own message says to
   wait — so any future "skip retries for non-transient errors" rule must
   exclude it (`isMediaNotReadyError()` is exported for exactly that).

**Why:** The 2026-08-06 human-merge rule for `apps/web/public/**` is right,
but the gate covered the *asset* while the clock ran on the *schedule*: an
item whose photo was waiting on a human was still "due", burned real publish
attempts against a 404, and died — so the drafting agent rationally stopped
queueing real photos (21 of 22 IG posts on era art). The preflight (#1900)
stopped the attempt-burning; this makes the wait visible, bounded, and
self-resolving, so queueing a real photo is the safe choice again. The
escalation exists because a no-attempt skip can never reach `social/failed/`
through the attempts counter: `2026-08-09-august-augustine-ig.json` was
skipped every 30 minutes for two days inside green runs while its X twin
published fine and the founders' brief counted the day as healthy.

**Alternatives considered:** Relaxing the human merge gate for images —
rejected, the 2026-08-06 risk judgement still holds. A single threshold
(only 48h) — rejected, the first loud signal would also be the destructive
one; a human alerted at 24h can merge the image PR and the item still ships.
Publishing the container without polling and retrying harder — rejected,
the race is entirely intra-attempt (see `lib/ig-container.mjs`'s header).

**Approved by:** Wyatt (CTO agent), pending review.

---

## 2026-08-11 — The daily metrics series carries its own gap check

**Decision:** `growth-snapshot.mjs` checks `social/metrics/` for missing days
before writing today's file, records them in the snapshot as `seriesGaps`, and
annotates the run — `::error::` if any gap is inside the last 7 days,
`::warning::` if all are older. It never fails the run: a historical hole must
not stop today's snapshot from being committed.

**Why:** The series had 20 files from 07-18 to 08-11 with five days missing —
a ~25% hole in a daily series, unexplained and unalarmed. The two causes were
completely different, which is exactly why the check has to be on continuity
rather than on any one cause:

- **07-30, 07-31** — a repo-wide GitHub Actions outage. Every scheduled
  workflow in the repo failed in under 5 seconds with no steps run
  (growth-snapshot, social-poster, watchdog, brief-mailer, news-worker,
  marjorie-inbox). Nothing in this pipeline was broken.
- **08-02, 08-03, 08-04** — the snapshot ran and **succeeded** all three days.
  Its auto-merge PRs (#1729, #1754, #1775) then sat open for 7–9 days because
  their required `build` check never got triggered, so the data never reached
  `main` — the only place Marjorie's brief reads it from. They were finally
  merged 2026-08-11T15:44Z. A green workflow whose output never lands is the
  worse of the two: every signal said fine.

**Alternatives considered:** Failing the snapshot run on a gap — rejected, it
would block the very commit that closes the series. Alarming on the workflow's
own success/failure — rejected, it would have caught neither cause.

**Approved by:** Wyatt (CTO agent), pending review.

---

## 2026-08-11 — A failed social post must turn the run red; the brief counts posts per platform over 24h

**Decision:** Two changes, one to delivery and one to measurement.

1. `scripts/social/post-queue.mjs` now exits non-zero when an item permanently
   fails (all 3 attempts burned, moved to `social/failed/`), emits `::error::`
   annotations, writes an Actions job summary, and puts the per-item outcome
   in the queue-state PR's title and body. A mid-retry attempt stays green —
   the item is still queued — but is reported. `social-poster.yml`'s
   state-commit step gains `if: always()` so a red run still records the
   `failed/` move; without it the item would sit in `social/queue/` on `main`
   and retry against the same wall forever.
2. `social/metrics/*.json` gains `postsLast24h` (per platform + total) and the
   Founders' Brief Growth line reports that instead of `postsToday`.

**Why:** The 2026-08-11 brief read `X 0 · 0 posts today` and was taken as "the
X poster is silently failing." Both halves of that reading were wrong in
different, instructive ways.

*Delivery.* X posting was in fact fine — six consecutive nights, 08-05 through
08-10, each with a real tweet id in `social/posted/*-x.json`. But it HAD been
dead: between 2026-07-21 and 2026-08-04, **eleven** X items exhausted their
attempts against `403 {"detail":"You are not permitted to perform this
action."}` and were binned into `social/failed/`. Every one of those
social-poster runs finished **green** — e.g. run 30981473515, conclusion
`success`, whose log contains "2026-08-04-mine-rush-release-x.json failed 3
times, moved to social/failed/". The error was caught, logged to a console
nobody reads, and the process exited 0. Two weeks of a dark channel and the
only artifact was a queue-state PR whose body was fixed boilerplate. The
recovery on 08-05 came with no code change either — nobody knows what X did,
because nothing was watching. What we can control is that a post which never
reached the timeline never again leaves a green check.

*This was never X-only.* The twelfth item in `social/failed/` is
`2026-07-27-all-too-well-scarf-metaphor-ig.json` — a real **Instagram** post,
killed by Meta error `9007`/`2207027` ("the media is not ready for
publishing"), just as silently. The swallow lived in `post-queue.mjs`'s
platform-agnostic catch block, so it was never an X problem; X was simply the
platform failing often enough to notice. That IG failure has its own root
cause — we publish a media container without waiting for it to reach
`FINISHED` — tracked separately as **#1897** and deliberately NOT fixed here:
it changes the live publish path of the one channel that currently posts
reliably, and it cannot be validated against the real Graph API from an agent
session (no credentials, no test posts), so it should land on its own with
attention rather than riding along in a reporting change.

*Measurement.* `postsToday` counted `social/posted/**` entries whose
`postedAt` fell on the current UTC date, but `growth-snapshot.yml` runs at
11:05 UTC and the entire queue is scheduled for 23:00–23:20 UTC. The day's
posts land ~12 hours after the snapshot meant to count them, so the number
was structurally near-always 0 — every snapshot from 08-08 on reads 0 while
the poster was shipping nightly. It also summed all platforms, so a totally
dark X was invisible behind Instagram's cadence: the one question the number
gets asked ("is X posting?") was the one it could not answer.

**Alternatives considered.** *Redden the run on any failed attempt, not just
permanent ones:* rejected — a half-hourly workflow that goes red on a
transient 429 trains everyone to ignore it, which is precisely the failure
mode being fixed. *Open a GitHub issue per failed post:* rejected for now as
duplicative — a red run plus a titled PR is already loud, and `watchdog.yml`
already watches run liveness. Revisit if a red run turns out not to reach
anyone. *Move `growth-snapshot.yml` to ~01:00 UTC so "today" lines up:*
rejected — it must run before the 12:45 UTC brief, and a rolling window is
invariant to scheduling instead of coupled to it.

**Open, needs Wyatt:** nobody has verified what the 403 window actually was.
The discriminating check is the X developer portal for the `@longlivetscom`
app — **User authentication settings → App permissions** must read *Read and
Write*, and the **Usage/limits** page shows whether the monthly post cap was
hit in that window. If permissions were flipped to Read-only, the access
token must be regenerated after fixing them (an existing token keeps the
scope it was minted with). Do not run this from an agent session — it is a
credential-surface action.

**Approved by:** proposed by the 2026-08-11 engineering session; Wyatt (CTO)
signs off by merging the PR. Engineering-health change, no product surface.

---

## 2026-08-11 — Stuck-PR detection watches every PR, not a list of bot branches; and re-runs stale CI under a hard cap

**Decision.** `watchdog.yml` gets one step, "PRs stuck on failing or missing
checks", replacing the never-merged 07-30 draft in PR #1629. It runs once a day
(not on the hourly trigger) and:

1. Examines **every open non-draft PR**, excluding only those labelled `hold`,
   `cie:escalate` or `founder-decision` — the same three `auto-merge-content.yml`
   treats as blocking.
2. Alerts on any such PR open >24h that has **any** failing check, or that has
   **no `build` check at all** on its head commit.
3. Re-runs a `build` that has been FAILING for >48h with no newer run, **capped
   at 2 re-runs per pass**, and only when the failing run is still on the PR's
   head commit.

**Why not a branch-prefix allowlist,** which is what the 07-30 draft used
(`vault/ content-shift/ depth/answerer content/rumor-desk content/stylist
claude/`): replayed against the live repo, it examined 2 of 27 open PRs and
alerted on neither. It missed #1642 (red 11 days, branch `fix/…`), #1762
(`build` green, `enable` red) and #1585 (no `build` check at all). An allowlist
of bot branch prefixes fails CLOSED — a renamed lane goes silently unmonitored,
which is the exact failure mode being fixed. Inverting to "everything except
what a human explicitly parked" cannot go stale that way, and the cost of the
other direction is a founder occasionally being told about their own red PR.

**Why the re-run is capped, and why it only fires on a red build.** This repo
hit 90% of included Actions minutes on 07-27 and a build freeze blocked every
merge on 07-30, so a monitor that burns the budget it protects is
self-defeating. Cost ceiling: 2 re-runs/day × ~2 billed minutes ≈ **4 min/day
worst case, ~0 expected** against ~1,400 min/cycle current usage. Three things
keep it there: daily not hourly; the hard per-pass cap; and re-running only a
`build` that is already FAILING and STALE — a green PR idling on human review is
never re-run (#1580 has been green and untouched 15 days; re-running it would be
pure waste). Re-running also makes the check fresh, so the same PR cannot be
re-run again for 48h — the cap is self-limiting, not just per-pass.

**Alternatives considered.** (a) A second, separate scheduled workflow for stale
CI — rejected, two mechanisms watching the same PRs would double the API cost and
drift apart. (b) Pushing an empty commit instead of `gh run rerun` — rejected,
it needs write access to other agents' branches and re-triggers CI + CodeQL +
auto-merge + Vercel rather than just the failed job. (c) Adding
`workflow_dispatch` to `ci.yml` so the missing-`build` case (#1585) could also be
repaired automatically — **not done**; it changes the semantics of the required
deploy gate (dispatch checks out the branch head, `pull_request` checks out the
merge ref), which is Wyatt's call, not a side effect of a watchdog PR. That case
alerts instead.

**Also corrected here:** `CLAUDE.md` § "Never babysit your own PR" told every
session that "the next scheduled run of that agent picks it up." It never did —
each runner branches fresh off `main` and never revisits. That single false
sentence is the root cause of PRs sitting red for 3, 5 and 15 days, and it is
still repeated verbatim in 13 `docs/agents/runner-prompts/*.md` files; those are
other agents' prompts and are left for their owners, but the detection above is
global so they are covered regardless.

**Approved by:** pending Wyatt. Nothing here merges anything or changes merge
authority; the only new privilege exercised is `gh run rerun`, under
`actions: write`, which `watchdog.yml` already held.

---

## 2026-08-11 — Vault Run phase 4 NOT executed; the Answerer was never starved, its lane was pointed at a drained queue

**Decision:** do **not** disable the six standalone content lane runners today,
and do **not** re-enable Lex. Land three reversible repo changes instead, and
record the preconditions that must clear before phase 4 runs.

**Why phase 4 was refused.** The consolidation is half-done — the orchestrator
(`trig_01EuLgUdMgbuqL51o3iWQfTL`) has run daily since 07-30 *alongside* the six
lanes it was meant to replace, so PR count went up, no minutes or tokens were
saved, and Rumor Desk — the highest privacy-liability lane, which auto-merges
unread — is now effectively daily (standalone cron `47 14 */2 * *` fires odd
days; orchestrator lane 4 is due even days). That is a real problem, but three
of four preconditions for fixing it by disabling the six were unmet:

1. **Phase 3.5 is unmerged** (PR #1629, open since 07-30). On `main` there is
   still no stuck-red-PR detection and no recovery path — `vault-run.md` still
   promises "TOMORROW's run picks it up", which is false. Consolidating makes
   this strictly worse: one red PR would strand all six lanes instead of one.
   #1585 (red since 07-28) and #1762 (open since 08-03) show it is live.
2. **The orchestrator misses ~25% of days** — no `vault/` PR *and no stranded
   branch* on 08-01, 08-02, 08-08. The standalone lanes covered those days.
3. **Trigger state could not be verified** — the `RemoteTrigger` tool was
   unavailable, so no trigger's `enabled` flag or `job_config` was ever read.
   An unverified disable is worse than none, especially given the documented
   full-replacement footgun that has already destroyed two triggers' prompts.

**The Answerer finding, which inverts the premise.** The lane was believed
"structurally starved" because Lex is disabled and open `curiosity-ledger`
issues have been 0 since ~07-29 — with the implied fix being "re-enable Lex or
stand the Answerer down". Both are wrong. The standalone Answerer is **not**
idle: it shipped #1732 (5 defining moments deepened) and #1827 (3 cross-link
throughlines) in August, drawing from **Karen's CIE depth rollups** — #1719
`content.depth-deficit` (26 items), #1720 `hot-thin-topic`, #1724
`crosslink-opportunity` (60 items). Karen's nightly scan is a deterministic
checker that keeps refilling those, so the supply is alive.

What was actually broken is `vault-lanes/2-answerer.md`: it gated solely on
`curiosity-ledger`, so lane 2 correctly found nothing and no-opped every day
while a 26-item backlog sat open. **The lane was reading the wrong queue.** It
has been repointed at the CIE rollups, with the drained legacy queues kept as
queue 1–2 and explicitly marked "empty is expected, not a stop condition", plus
a run-log requirement to report the open count of every queue checked — a bare
"nothing to do" is what hid this for two weeks.

**Re-enabling Lex is rejected**, not deferred. Lex generates *questions*; the
bottleneck is *answers*. It cost 12 cloud runs/day, and Karen's checker already
produces the same targeting deterministically and for free. Re-enabling it
would rebuild the exact token-burn pattern the 2026-07-25 audit removed, to
refill a queue that duplicates a cheaper supplier.

**Watchdog: both prefixes, not a swap.** The Content Shift liveness check keys
on the `content-shift/` branch prefix, so disabling that lane would make it
alarm every day — the known landmine. Rather than flip it to `vault/` (which
would leave the still-live standalone lane unmonitored and silently change what
is watched), it is now a `check_lane` helper called per lane: `vault/` at 36h
and `content-shift/` at 30h, with independent alert titles. Correct in both
states; phase 4 deletes one line. The 36h window is chosen to alarm on a single
missed Vault Run day — for a runner carrying all six lanes, a missed day is a
whole-day content outage, so it must page. **This check is expected to fire**
against the 08-01/02/08 gap pattern; that gap is the finding, not a false
positive.

**Alternatives considered:** (a) disable the six anyway and accept the risk —
rejected, it removes the only cover for a 25% miss rate and an unverified
disable cannot be safely rolled back; (b) disable only Rumor Desk, the genuine
liability — tempting and still the best single next step once #1629 lands, but
it needs verified trigger state to be reversible, which was unavailable;
(c) retarget the watchdog to `vault/` only — rejected as above.

**Approved by:** proposed by Wyatt's engineering agent; **phase 4 itself and
the Rumor Desk daily-cadence question need Wyatt's call.**

---

## 2026-08-11 — No Facebook crawler; groups are a LEAD channel, and fandom milestones get a `fandom` kind

**Decision (PENDING Wyatt's approval — this closes off a requested feature and
sets standing policy for a whole class of sourcing).** Three parts. Full
reasoning, sources, and the guardrail design:
`docs/proposals/2026-08-11-facebook-groups-signal.md`.

**1. We do not build a bot that reads Facebook groups — by any means.** Not via
the Graph API (impossible), and not via a logged-in crawler (possible, refused).

The API half is not a policy call, it is a fact: Meta removed the **Groups API
itself**, plus `publish_to_groups` and `groups_access_member_info`, from **all
API versions on 2024-04-22** — *including* "the ability for group admins to
install apps on the group, even if they have an admin or developer role on the
app" ([v19.0 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0)).
**Admin rights on a group therefore unlock nothing.** There is no App Review to
submit and no asset the founders could acquire. CrowdTangle (which did expose
group content) shut down 2024-08-14; its replacement is limited to academic and
nonprofit researchers, which we are not.

The crawler half *was* a live option and is refused on merits, not reflex:

- **Meta actions the account, not the script.** Enforcement cascades across
  linked personal accounts, Pages, and ad assets. That would cost us (a) the
  legitimate human read access the founders have in these groups today, and
  (b) the FB Page the social pipeline cross-posts to — risking the *outbound*
  channel to gain an inbound one. The stake is a founder's personal identity,
  and a burner account is worse (fake accounts were the aggravating fact in
  Meta v. Voyager Labs: permanent injunction plus payment).
- **Randomized timing is a countermeasure to the ~2015 detection stack.** It
  defeats rate heuristics; it does nothing against automation-framework
  fingerprinting (Selenium/Puppeteer detected on request #1), device
  fingerprinting, browser-tampering detection, or account-history anomalies.
  Beating those means anti-detect browsers and residential proxies — i.e. an
  explicit evasion program.
- **Decisively: almost nothing collected could ship.** Group posts are authored
  by private individuals, whom `privacy-redlines.md` puts on the Never-OK list,
  under the standing rule that **attribution does not launder a privacy
  violation**. Member posts, names, photos, screenshots, sighting reports,
  and health/sexuality chatter are all unpublishable. What survives is a
  *pointer to public reporting* — which the existing channels already reach.
  So the crawler is risk without payoff.

**2. Facebook groups are a LEAD channel, never a source.** A group may never be
cited by any moment, rumor, or milestone. Leads enter through the existing
`intake` door, which already rules that *"the drop is never the copy… leads
only… never paste-through, ever, from any source"*, and are re-sourced to named
public reporting or parked on `needs-sources`. Private individuals never enter
the repo at all — not the site, not a GitHub issue: no screenshots, no member
names/handles/photos, no verbatim member quotes. Naming a *group* is fine;
naming a *member* is not.

The recommended build is an **assisted intake** reusing
`.github/workflows/marjorie-inbox.yml` — the DKIM-verified, founder-only,
deterministic email→GitHub relay that already runs every 30 minutes on existing
secrets. A founder emails `intake: <one line>`; the relay opens an
`intake`-labeled issue; the fleet does the sourcing. **Not built in this PR** —
it modifies a running workflow and needs Wyatt's go-ahead.

**3. `MilestoneKind` gains `fandom`** (`'album' | 'tour' | 'life' | 'business'
| 'award' | 'fandom'`) for documented fan-**community** events. No new table,
field, or migration — consistent with the theory-weaving ruling that
fan-community material reuses existing structures. But the existing five kinds
all describe things *Taylor or her business* did, so a community event has no
honest home among them (`life` means her life). Deliberately **`fandom`, not
`facebook`**: a per-platform kind would put a vendor in the type system and need
a sibling every time the community moves platform.

**Why "strong presence in most eras" is not delivered as asked.** No Facebook
group milestone is currently authorable without fabricating something. Early
eras (Debut 2006, Fearless 2008) predate meaningful Facebook-group fandom, and
no outlet publishes group membership counts — a live count read off a page is an
observation, not a citation. **No milestone was invented and no seed content
shipped.** The mechanism ships; the content need is filed. The recommendation is
to read the ask as *fan-community* presence (Eras Tour seismic activity,
friendship bracelets, the Ticketmaster hearing, voter-registration spikes — all
aggregate, dated, and properly sourceable), which genuinely spans the eras.

**Bug fixed on the way:** `scripts/sync-longlive-content.mjs` validated
`milestone.kind` against a hardcoded array and **silently dropped** any
unrecognized kind — a marker vanished from the scrubber with no error and a
green build, the same "declined and misconfigured look identical" failure as the
auto-merge allowlist entry above. Now warns on stderr with the marker id, moment
slug, and bad kind. Deliberately still non-fatal: this script runs on every
content PR and must not break the pipeline for other desks.

**Alternatives considered:** (a) *Meta Content Library* — ineligible; applying
under a research framing we don't meet would be misrepresentation. (b) *Logged-
out public scraping only* — the one place the "color outside the lines" case has
real support, since Meta v. Bright Data held that logged-out public scraping did
not breach Meta's terms; rejected because the groups that matter are private,
which requires a login and lands in the Voyager fact pattern instead, and
because §2.4's privacy wall kills the output regardless. (c) *A `facebook`
MilestoneKind* — rejected, see above. (d) *Seeding example group milestones to
demonstrate the feature* — rejected outright: it would require inventing a
membership number or a date.

**Honest qualifiers recorded** so this isn't overstated: "anything worth
publishing leaks to public reporting within hours" is directionally supported
(36/36 authored rumors cite professional publishers; 0.26% of 1,161 typed
sources are fan-adjacent; the `RumorSourceTier` enum has no fan rung; and
several fandom-native claims — the Woodvale theory, a fan inventory bot, three
Deuxmoi items — reached us via mainstream pickup) but the *latency* is
unmeasured. And Reddit/Tumblr were excluded from ingestion on commercial-
licensing and deletion-obligation grounds, **not** because they'd add nothing.
The defensible claim is "the compliant channels already catch it," not "fan
communities are worthless as signal."

**Approved by:** _pending Wyatt (CTO)._ Product questions in the proposal's §7
are for Joey.

---

## 2026-08-11 — Delete the unmounted VaultReader UI; keep the `/vault/*` HTTP routes

**Decision.** Delete eight files in `apps/web` that exist only to serve a
component nothing renders, and keep the HTTP API they called.

**Deleted** (`VaultReader` and its exclusive dependency closure):
`components/VaultReader.tsx`, `components/MomentDetail.tsx`,
`components/TrackGuide.tsx`, `lib/useMoment.ts`, `lib/useTrackGuide.ts`,
`lib/theme.ts`, `lib/categoryBadges.ts`, `lib/categoryBadges.test.ts`.

`VaultReader` had **zero** importers — static, dynamic, or by name. Each of the
other seven has exactly one consumer, `VaultReader`, so all seven died with it.
`categoryBadges.test.ts` goes too: it tests only `categoryBadges.ts`, and
leaving it would break `npm run test`. Note the name collision —
`components/longlive/MomentDetail.tsx` and `components/longlive/TrackGuide.tsx`
are **live** and are different files.

**Kept deliberately:** `app/vault/tier0/route.ts`,
`app/vault/moment/[id]/route.ts`, `app/vault/album/[slug]/tracks/route.ts` and
`lib/vault.ts`. Three reasons, any one sufficient:

1. `/vault/tier0` has a live consumer — `scripts/check-tier0-budget.mjs:19`
   defaults to it, i.e. `npm run check:budget`, documented as an operator
   command at `docs/deploy.md:121`. (It is not in CI; CI runs the seed-based
   `check:budget:seed`.)
2. All three are shipped deliverables of record: roadmap W4.5 and W7, plus a
   `docs/decisions.md` entry for the tracks route. Retiring an API of record is
   a product/architecture call, not cleanup.
3. They are the convergence target both `docs/architecture.md` and
   `docs/longlive-experience.md` point at.

After this change `/vault/moment/[id]` and `/vault/album/[slug]/tracks` have no
in-repo consumer at all (their only callers were the deleted hooks). They are
kept on reasons 2 and 3; **flagging for Wyatt** that if convergence is not
happening, those two are the next honest deletion.

**Verified before deleting** — repo-wide, case-insensitive, across `apps/**`
(including `apps/mobile`), `packages/**`, `scripts/**`, `e2e/**`, `.github/**`,
`social/**`, `supabase/**` and every config file: no static import, no
`import()`/`require()`/`next/dynamic`/`React.lazy`, no bare-string reference, no
`next.config.mjs`/`vercel.json` rewrite, no Playwright spec (`e2e/vault.spec.ts`
drives the `longlive/` selectors, and its own comments record that the old
`VaultReader` selectors matched zero elements), no entry in
`.github/content-automerge-allowlist.txt`, and no codegen script
(`check:generated`, `check:content-inert`, `content:coverage` all scope to
`supabase/seed/**` or `apps/web/lib/longlive/**`). `apps/mobile` has its own
separate `lib/vault.ts` that talks to Supabase directly via `@swift2/core` and
never touches the web routes.

**Two things found on the way, not fixed here** (this diff is deliberately
confined to the dead files because another agent owns `apps/web`):

- `apps/web/lib/vault.ts:29,35,42` falls back to
  `https://swift2-web-nine.vercel.app` when Supabase env is absent — a
  deployment `docs/deploy.md:11-14` explicitly marks superseded, "do not cite
  either of these anymore". A Supabase-less deployment proxies `/vault/tier0`
  to a stale sandbox.
- `docs/roadmap.md:58` claims the two-tier API is "reused by web + Expo".
  Mobile does not call it; it goes straight to Supabase.

**Approved by:** pending Wyatt.

---

## 2026-08-11 — Moment sourcing becomes a hard gate, with two lists that can only shrink

**Decision:** `validate-content.mjs` now ERRORS, not warns, when a moment has
no source, and errors when a `relationship`/`business` moment has fewer than
two independent outlets. Both gates live in `scripts/lib/sourcing-gate.mjs`
with a grandfather list of the records that predate them: 1 moment
(`UNSOURCED_LEGACY`) and 25 (`SINGLE_OUTLET_LEGACY`). 44 of the 45 unsourced
moments were sourced first, in the same pass, so the gate went up against a
corpus that could survive it.

**Why:** typed records have hard-failed with no sources since the audit
(`checkCommon` → `err('no sources — every new-type record requires >= 1
source')`). Moments — the largest surface on the site and the one every reader
lands on — only ever got a `warn()`. `validate:content` prints ~100 warnings
and exits 0, so 45 unsourced moments passed CI green and auto-merged to
production on a site whose entire proposition is receipts. Separately, the
"two independent outlets for relationship and business claims" standard has
been written in `editorial-voice-and-pipeline.md` since that doc existed and
had **no implementation anywhere**. 143 of 164 records in those categories met
it anyway; 4 of the 21 that did not rest on Wikipedia alone, which the same
rubric says never satisfies a factual claim.

**Why a grandfather list rather than fixing everything or leaving it a warn:**
flipping the gate first would have red-lined the build and blocked every other
desk. Leaving it a warn is what produced the 45 in the first place — the whole
lesson here is that a warning does not hold a line. A list makes the rule bite
on all NEW content immediately while the residue is worked down in the open.
Two properties keep it from becoming amnesty: a listed record that HAS been
sourced is an error (delete the entry), and a listed key matching no record is
an error (the record was deleted or retitled). A vitest ceiling on each list's
size means adding an entry to make a build green fails the suite.

**Alternatives considered:** (a) fix all 45 and skip the list — attempted; one
is an unfalsifiable generalisation ("A run of TV performances… every major
stage") with no citable assertion, and inventing a source for it is the one
thing this work must never do; (b) exempt the whole legacy cohort by a flag on
the records — rejected, an in-record exemption is invisible at review time and
travels with copy-paste; (c) file the two-outlet checker instead of building it
— rejected, it shares the grandfather machinery exactly and 87% of the corpus
already passed, so the marginal cost was ~40 lines; (d) hard-fail the 4
Wikipedia-only business claims with no grandfathering — tempting, and they are
the priority follow-up, but a red build is a red build.

**Approved by:** pending Wyatt — this changes what CI rejects.

## 2026-08-11 — Reliability scores reach the vault; nothing displays them yet

**Decision:** `sourcesFrom()` (`scripts/lib/longlive-sync-shared.mjs`) now carries
each citation's `reliability_score` and `source_type` into the built vault as
`reliability` / `type`, and all five generator emit sites go through one new
`sourceLiteral()` so a citation field can never again be added to the
normalizer and dropped by four of the five serializers. **No UI renders either
field.** The seam is deliberate and this entry is the thing to read before
closing it.

**Why plumb it:** the 2026-07-08 audit §5 rubric is real, documented, and
enforced — `validate-content.mjs` rejects a score outside 1..5 — and editors
have scored ~2.1k citations against it. Every one was flattened to `{name,url}`
at build time. The app could not tell `grammy.com` from a fan wiki. That is a
month of editorial judgment thrown away by one line, and the fix is ten.

**Why NOT display it — the coverage is uneven, and a badge would lie.** Of 1,918
`moment.sources` citations, 1,161 (61%) carry a score and 757 do not; every one
of the 946 citations on typed records (releases/tours/theories/videos) does,
because `checkCommon` has required them since the audit. A reliability badge
rendered on the scored 61% and omitted on the rest does not read as "we scored
these"; it reads as "the unbadged ones are weaker," which is false — most are
pre-rubric citations from reputable outlets that nobody has gone back to score.
The failure mode is precisely the one the confidence banners were built to
avoid: a provenance signal that misleads by omission is worse than no signal.
**The gate to reopen this is coverage, not design:** when unscored moment
citations reach ~0, display becomes a design question worth having.

**And the visual language is already full.** A moment can carry a sub-confirmed
`ConfidenceBanner`, a "What's rumored" section with per-rumor status pills, and
per-image `reference`/`archival` badges. Those all answer *"how sure are we of
this claim?"* A per-citation reliability badge answers *"how good is this
link?"* — a quieter, more clerical question — and stacking a fourth trust
chrome on the same card dilutes the three that carry real weight. Today's
citation line is deliberately footnote-scale (10px, `opacity-80`, below a
rule), which is the correct altitude for it.

**Precedent:** rumors' `sourceTier` has been plumbed to the vault and typed in
`types.ts` since the rumor pipeline landed, is present on 36 vault entries, and
has never been rendered. That seam has cost nothing and is available the day
someone wants it. This is the same shape.

**Alternatives considered:** (a) render a 1–5 badge on every citation —
rejected, see coverage above; (b) render only for scores of 1–2 ("low-quality
source") — rejected, it is a scarlet letter on the 2s, which the rubric defines
as legitimate supplements (wikis, moderated forums) that the same rubric already
forbids from *standing alone*; enforcing that at build time is strictly better
than shaming it at render time; (c) sort citations by reliability so the best
source is listed first — genuinely tempting and cheap, but it silently reorders
the *first* source, and `ConfidenceBanner` attributes the sub-confirmed label to
`sources[0]` **by position** — so sorting would re-attribute banners across the
corpus. Rejected as an invisible content change riding along in a plumbing PR;
filed instead; (d) keep discarding it — rejected, it is the site's own stated
credibility standard.

**Approved by:** pending — Joey owns whether a reliability signal ever renders;
this PR only makes it available and argues for the wait.

## 2026-08-11 — Founder mail: `founder-task` means a human acts, and founder mail is digest-batched

**Decision:** (1) The `founder-task` label is reserved for "a human founder
must personally act, and the body is written for a non-coder" per the new
standard `docs/agents/founder-comms.md`; agent-to-agent coordination gets the
new `desk-coordination` label, which never mails anyone. (2) `tree-mail.yml`
no longer mails instantly per labelled issue: a 3-hourly sweep batches all
unmailed open `founder-task` issues into ONE email (exactly-once via the
machine-only `founder-mailed` label), and only Tree-authored artifacts carry
"Tree" subject lines — everything else is "Founder action needed".

**Why:** On 2026-08-11 a Wyatt-side deconfliction pass opened four
`founder-task` issues (#1955–#1958) in a burst. The mailer sent Joey four
near-simultaneous emails, each subject-lined as Tree (which had never run),
each full of agent jargon (merge matrices, "MERGEABLE/CLEAN"). Joey's report:
"too jargon heavy, very unclear what it wants me to do." The founder-mail
lane only works if a mail reliably means "you, personally, ~15 minutes,
plain instructions."

**Alternatives considered:** an author allowlist on the issue trigger
(rejected — the incident author was a legitimate identity, Wyatt's agent, so
it would not have prevented this, and it breaks as more desks legitimately
file founder tasks); time-window queries instead of a bookkeeping label
(rejected — boundary drift double- or zero-mails; a label is exactly-once
and inspectable); instant per-issue mail kept with dedupe only (rejected —
burst-noise was the minor half of the incident, but 3 h latency costs
nothing for "sometime this week" tasks).

**Approved:** Joey (reported the failure and set the bar: "I need simple
instructions"), implemented 2026-08-11.

## 2026-08-11 — One source of truth for content length caps; restore the 31 contexts a stale cap deleted

**Decision:** every content length cap now lives in `scripts/lib/content-caps.mjs`
and nowhere else. `validate-content.mjs`, `content-coverage.mjs` and
`content-engine/checkers/redlines.mjs` import it and hold zero cap literals.
`scripts/lib/content-caps.test.ts` parses the migration SQL and fails if the
table and the database disagree, and fails if any consumer re-types a cap
number. The 31 `moment.context` fields trimmed by commit `26e9a5b` are restored
to their pre-trim text.

**Why:** the same number was hand-written in four places. On 2026-07-22 Wyatt
raised `moment.context` 2000 -> 4000 (founder decision,
`supabase/migrations/20260722120000_moment_context_4000.sql`) because the 2000
ceiling had made the marquee pages come out byte-identical after a 91-ledger
depth push. Three of the four sites moved. `redlines.mjs` kept a flat
`FIELD_FAIL_CHARS = 2000` with no exemption, so Karen filed a P1 safety ticket
for every context between 2000 and 4000 — content that is deliberately that
long. PR #1727 cleared the ticket by deleting 30,562 characters across 31
moments (44 of the 47 lines its message claims were photo/generated lines; the
real count is 31 contexts, all in Showgirl/TTPD/Lover). That is a closed loop:
depth engine writes long -> stale checker calls it a violation -> fixer
truncates -> repeat. The pre-trim text was verified as pure deletion (every
character of each trimmed version appears verbatim in the original, so nothing
was improved along the way) and every pre-trim value is <= 3916 chars, well
inside the real 4000 cap.

**The two caps are different policies and stay separate.** The DB CHECK caps
are column widths — exceed one and the insert fails. The redlines/coverage
ceiling is an *anti-dump* heuristic: it is looking for pasted source text, a
copyright and safety concern. Those stay at 2000 for every field, because a
2000-char paste is a red line; `moment.context` alone is raised to 4000 because
it is our own editorial prose and length is not the dump signal for it. The
lyrics-block, verbatim-quote-span (>= 600) and private-data detectors apply to
it unchanged — those are the checks that actually catch a paste.

**Alternatives considered:** (a) just fix the 2000 in `redlines.mjs` — rejected,
it leaves four hand-written copies and the next raise desyncs again; (b) raise
every field to 4000 — rejected, it destroys the anti-dump intent for fields
that have no reason to be long; (c) generate the migrations from the JS table —
rejected, migrations are immutable history and must stay literal SQL, so the
test asserts parity instead.

**Approved by:** pending Wyatt — the restore reverses a merged content PR.
## 2026-08-11 — Clownbot: a fourth surface, with the refusal layer built OUTSIDE the persona prompt

**Decision (PENDING founder review on the posture question below).** Ship
Clownbot — a "clowning" theory-bot surface beside Eras, Threads and Mood —
with a deliberately unusual architecture: the model writes voice and nothing
else, and every boundary, receipt and number is enforced in deterministic
TypeScript around it.

**The architecture, and why it is expensive to reverse:**

1. **The refusal layer is independent of the persona prompt.**
   `clownbot-safety.ts` is pure, dependency-free TypeScript with two gates — an
   input screen that runs *before any spend*, and an output screen that runs
   over everything the model produced and discards the whole answer on a hit.
   Both work with no API key. Boundary enforcement therefore does not depend on
   a prompt holding, which is the property we actually need: tone-under-pressure
   and boundary judgement are exactly where a small model fails, and every
   failure here is a screenshot. Reversing this (moving boundaries into the
   prompt) would be cheap to type and very expensive to be wrong about.
2. **The model never searches the Vault.** Retrieval is deterministic and
   upstream; the model receives a fixed handful of receipts and may cite only
   ids from that set. It structurally cannot invent a receipt — the same
   guarantee that stops the Mood classifier inventing a song.
3. **Evidence and confidence are computed, never claimed.** The model proposes
   only a "delulu" rating. Evidence is derived from the receipts that survived
   id-validation, and confidence is derived from both and hard-capped at 85%.
   Clownbot is structurally incapable of telling a reader it is certain, which
   is the documented way fan-theory accounts lose community trust.
4. **Identity is structural, not a disclaimer.** It is branded as a clown, never
   speaks as Taylor (enforced in the deterministic layer and red-teamed with 20
   distinct impersonation attempts held as CI tests), and the surface carries no
   imagery of Taylor at all.

**Cost model (required by CLAUDE.md cost discipline).** Model:
`claude-haiku-4-5` ($1/MTok in, $5/MTok out). Per turn ≈ 2.2K input + ~350
output ≈ **$0.004**; a ~5-turn conversation ≈ **$0.02**. Daily cap 300 calls per
warm instance ≈ **$1.20/day/instance** ceiling, above which the route degrades
to a free deterministic receipts answer rather than failing. No prompt caching:
Haiku 4.5's minimum cacheable prefix is 4096 tokens and ours is ~1.5K, so a
`cache_control` marker would silently no-op — left off with a comment rather
than shipped as decoration. Swapping to `claude-sonnet-5` is a one-constant
change and roughly doubles cost; do it *and* add `cache_control` together.

**Alternatives considered.** (a) Boundaries in the system prompt only — cheaper,
and the failure mode is a screenshot; rejected. (b) A larger model to get
boundary judgement "for free" — 2–3× cost for a property we can get
deterministically at zero marginal cost; rejected. (c) Letting the model score
its own evidence — one fewer moving part, but it makes overpromising possible,
which is the one documented trust-killer; rejected.

**Open for the founders — this is a product-posture call, not an engineering
one.** The fandom is currently hostile to generative AI (#SwiftiesAgainstAI,
Oct 2025). This PR takes the position that the honest move is to be loudly,
structurally a bot with no AI imagery. The alternative postures (ship quietly;
or don't ship a bot into this fandom at all right now) are Joey's call, not
mine. See the PR body.

**Approved by:** pending (Joey on posture, Wyatt on architecture).

---

## 2026-08-11 — Product Definition of Done adopted: eight items gate the marketing push

**Decision:** Joey and Wyatt (in person, 2026-08-11) defined the short-term
product bar: no large marketing push until the eight items in
`docs/definition-of-done.md` are complete — landing-page rethink (scroll-first
+ unmistakable nav), End Game/Blank Spaces card differentiation, Clue
Web/Decode card differentiation, two new sections (Marketplace, Community), a
full site-wide link-liveness pass made permanent, complete chronological video
coverage with a Videos filter, a re-scoped "clown bot" (blocked on a fresh
founder decision — the #36 no-go stands until then), and an era/album
capitalization audit enforced by a checker. Wyatt reworks Marjorie's
dashboard/brief around this list. `docs/launch-readiness.md` remains the
historical gate record and now points to the new file.

**Why:** the original launch gates are mostly closed; the founders needed a
single agreed artifact for "what must be true before we drive real traffic,"
owned the same way launch-readiness was — statuses move with PR links, items
move only by founder decision.

**Approved by:** Joey + Wyatt (verbal; documented at Joey's direction)
## 2026-08-11 — Auto-merge widened to app code, gated by full CI (not human review)

**Decision:** Add app code — `apps/web/app/`, `apps/web/components/`,
`apps/web/lib/`, and `packages/` (plus their colocated tests) — to the content
auto-merge allowlist, so those PRs land the moment the required `build` check is
green, with **no human merge**. Keep specific paths HUMAN-ONLY via a new **deny
(`!`) mechanism** and the `NEVER_ALLOWLIST` bar.

**Why.** Wyatt, 2026-08-11: *"Remove [app code] from the exclusion list —
honestly we're not reviewing any code."* A human-merge gate that nobody actually
exercises is theater: it delays shipping and gives false assurance. The honest
replacement is a machine gate that always runs — **full required CI green** —
rather than a rubber stamp. "Full green" = the `build` required check, one job
that runs typecheck + lint + the entire vitest suite + validate:content +
check:generated + check:content-inert + check:automerge-allowlist +
check:content-ownership + check:no-downgrade + content:coverage + build +
check:budget:seed. GitHub native auto-merge blocks until that passes.

**What stays human-only, and why it is NOT about code review:**
- `.github/**`, `scripts/**`, `package.json`, lockfiles, config — the gate and
  what CI runs. A gate that can widen itself unreviewed is not a gate
  (`NEVER_ALLOWLIST`, unchanged). The auto-merge machinery
  (`auto-merge-content.yml`, `content-automerge-allowlist.txt`,
  `check-automerge-allowlist.mjs`, the NEVER list, the ruleset) can never
  auto-widen itself.
- `apps/web/app/api/**` — the request-handling / data layer. **Held because
  E2E is 100% red (#669):** app-code auto-merge currently has no behavioural
  regression net beyond unit + typecheck + build. That is adequate for view
  components and lib, thin for request handlers. **Chose option (a): hold the
  API routes** until #669 is green (then a one-line PR removes the deny). Not (b)
  "widen and accept the risk" — the API layer is where an un-caught regression
  actually hurts (data writes, external calls), and it is a small, well-bounded
  carve-out to hold.
- `apps/web/app/privacy/**`, `apps/web/app/terms/**`, and any legal lib — legal
  surfaces need counsel, not a code review.
- `supabase/migrations/**` — irreversible schema (already `NEVER_ALLOWLIST`).
- the rest of `apps/web/public/**` — bot-picked media gets human eyes
  (2026-07-28), except the checker-gated `apps/web/public/social/` carve-out.

**The deny mechanism.** The allowlist now supports `!prefix` deny lines that
always beat an allow. This lets a broad allow (`apps/web/app/`) flow while a
barred subtree (`apps/web/app/api/`) stays human. The self-amendment checker was
extended (`barredPrefixes` in `check-automerge-allowlist.mjs`): a broad allow
that overlaps a `NEVER_ALLOWLIST` bar is permitted **only** when a deny prefix
*fully covers* that barred area — a partial deny does not satisfy the bar, so
nothing slips through. Deny wins at runtime (the enable job checks deny before
allow) and is fail-safe: a denied path never auto-merges.

**Alternatives considered.** (1) Positive-listing only the safe subtrees, no
deny — fail-safe but a new page would need a human, which re-creates the theater
the founder is removing. Rejected. (2) Widening `apps/web/**` broadly and denying
carve-outs — rejected because it would sweep in `apps/web/public/**` (media) too;
we allow the three code subtrees explicitly instead. (3) Widening the API routes
now — rejected per the #669 reasoning above.

**Residual risk (honest).** App code auto-merges with **E2E red (#669)**, so
there is no full-journey regression net — only unit + typecheck + build. That
catches most regressions in view/lib code but can miss integration/routing/
hydration failures that only appear in a real browser. Mitigations: API routes
(the thinnest-covered layer) are held out; the #669 fix restores the net; and the
self-amendment paths (`.github`, `scripts`, workflows, allowlist, migrations)
remain structurally barred, so the worst case is a *product* regression that a
human can revert, not a compromise of the merge gate itself. Second residual: a
NEW sensitive product path added later under a broad allow would auto-merge
unless someone denies it — the deny/NEVER lists must be maintained; but that
class is bounded to product code, never the gate.

**Approved by:** Wyatt (CTO), 2026-08-11. Opened as its own PR, separate from the
content-ownership lock (#1959) it shares merge machinery with. Not merged by the
agent.

---

## 2026-08-11 — Merge-machinery consolidation (#1910 + #1941) and the a11y-lane refusal

**Decision:** Ship the two founder-approved merge-machinery PRs as a **single
reconciled branch** off current `main`, and **do NOT build an a11y auto-merge
lane yet** — the safety proof cannot be constructed today (below). This entry is
the reconciliation record; the two original decision entries it consolidates
follow immediately below, as authored.

**What was reconciled.**
1. **The self-amendment bar vs. the social carve-out.** #1910's `NEVER_ALLOWLIST`
   bars `apps/web/public/` outright; the social-image carve-out (already on
   `main`) allowlists `apps/web/public/social/`. Left as-is, `build` would fail —
   the committed allowlist would trip its own bar. Resolved with
   `NEVER_ALLOWLIST_EXCEPTIONS` in `scripts/check-automerge-allowlist.mjs`: a
   single, fail-closed narrowing that exempts **exactly** `apps/web/public/social/`
   and nothing broader or adjacent (an exception must lie *inside* the bar it
   narrows AND cover the entry; a broad `apps/web/public/` or a sibling
   `apps/web/public/socialite/` stays barred). Adding an exception is a
   `.github/`-barred change, so the narrowing list itself can never be
   auto-widened.
2. **#1902's allowlist restructure (already merged).** The single-source-of-truth
   allowlist file, its base-ref fetch, and the `check-automerge-allowlist.test.ts`
   social reconciliation were already on `main`. #1941's redundant re-additions
   (the `apps/web/public/social/` allowlist line and its own test edits) were
   dropped in favour of `main`'s versions — no re-inlined list, one source of
   truth preserved.
3. **The social-image fail-closed gate.** `main`'s workflow was fail-*open* for an
   image-only PR (allowlisted by path, validated by nothing). #1941's
   `has_drafts` gate is preserved and applied: a social image only auto-merges
   when it rides with a `social/queue/**.json` draft that `check-drafts.mjs`
   validated; `hold`/`SOCIAL_FREEZE` still block; the allowlist is still fetched
   from the base ref.
4. The dependency-downgrade guard, `check-work-ownership.mjs`, the `desk:*` /
   `review:*` taxonomy, the watchdog step, and both delegation docs are carried
   over intact.

**The a11y auto-merge lane — REFUSED for now, honestly.** #1941 called it "not
built"; this session confirmed it **cannot be made safe today**. A safe app-code
auto-merge needs four legs and every one is missing: (a) a **per-PR** a11y check —
today's `a11y.yml` runs axe/pa11y against **production** on a **schedule**,
non-blocking, and never sees a PR's diff; (b) a **behavioural-regression net** —
the E2E suite is 100% red against prod (#669); (c) a **path/diff fence** — there
is no `*.a11y.*` convention and no mechanical proof a `.tsx` change is
behaviour-preserving (an `aria`/spacing edit can still break layout or handlers,
so the `check-content-inert` analogy does not hold); (d) **trustworthy author
identity** — both GitHub accounts are shared by every agent, so "authored by
Austin" proves nothing. A loose lane that let arbitrary `.tsx` through would be
worse than the status quo, so none ships. The full gate design and the
mechanical acceptance test for each missing leg:
`docs/proposals/2026-08-11-a11y-auto-merge-lane.md`.

**Why one branch, not a 2-PR stack:** the bar↔carve-out interdependency (item 1)
is the whole risk. A stack would leave "whichever lands second must fix it" as a
live failure mode; consolidating removes it — the reconciled tree is green as a
unit or not at all.

**Approved by:** consolidation prepared by the CTO engineering session per
Wyatt's directive to stop approving routine merge machinery; the underlying
grants remain as marked in the two entries below. Merge is Wyatt's action.

---

## 2026-08-11 — Work ownership is state, not prose; and the self-amendment bar

**Decision (PENDING Wyatt's approval — this changes routing authority, merge
authority and two charters).** Answering Wyatt's two questions: how work gets
picked up without a founder, and how much PR review we can stop doing. Full
design: `docs/proposals/2026-08-11-autonomous-pickup-and-merge-delegation.md`.

**1. No "founder-bot".** Wyatt asked whether Marjorie should spin up a Fable
agent with permission to solve ~all issues. Recommendation: **no**, on four
grounds. (a) It answers the wrong question — sorting every currently-stuck item
by what blocked it, roughly none were blocked on "no agent was allowed": they
were blocked on a silently misconfigured gate (#1891/#1762), a red PR nobody
returns to (#1545/#1565/#1585), a review nobody ran (#1580/#1596/#1619), or
routing that existed only as a comment (#680). (b) "~all issues with few
exceptions" is a deny-list, and this repo already proved deny-lists fail at this
job — `check-content-inert.mjs` was rebuilt as a positive grammar precisely
because a name deny-list was defeated by `({}).constructor.constructor('…')()`.
(c) One privileged agent is a single arrival-rate limit with correlated failure
across every lane, which is the bottleneck we are removing, one layer down.
(d) It would run as `wjduvall-cmd` — the same identity as Wyatt's own approvals.

**2. Routing writes state.** A `desk:*` label taxonomy; an open issue is routed
iff it carries **exactly one** `desk:*` label. A routing comment is not routing.
Correction to the obvious design: the **assignee cannot carry the route** —
GitHub assignees must be collaborators, there are exactly two, and both are
shared by every agent. Label = route; assignee = claim lock (Austin's existing
meaning, 24h lease); `desk:founder` = a human owes an action.

**3. The fence complement gets a name.** `desk:unowned` is a first-class answer.
Reading every charter: `.github/**` (beyond Paul Blart's CI/security slice),
infra/deploy verification, legal prose, cross-desk chores and stale-PR
shepherding have no chartered owner, and nothing is chartered to notice that.
The complement is decomposed to the nearest existing owner rather than to a new
actor: `.github/**` → extend Paul Blart; stale/red PRs → a loop closure, not a
desk; dispatch → Marjorie writes labels instead of prose; legal → stays founders.

**4. Escalation ratchets instead of capping.** Operating model §5.5 caps an item
at **one nudge, ever**. That controls repetition when the thing worth controlling
is channel count — which is why an unstaffed item gets diagnosed, nudged once,
then reprinted in the brief for three weeks. Supersede with: one persistent
alert issue per condition (the `upsert-alert.sh` pattern that already fixed this
exact bug after #947/#1177/#1203/#1224), volume capped, memory unbounded.

**5. Merge delegation, by class, on mechanical proof.** Widen: `docs/**` minus
the governance set (a non-charter, non-decision, non-spec doc cannot change what
any agent may do — a checkable path property); dependabot **dev**-dependency
patch/minor into Marjorie's envelope (a bad dev dep breaks CI, which is the
failure we want; a bad production dep ships to users while CI stays green); and,
**blocked on #669**, Austin's a11y lane once a re-run of axe on the preview can
prove the ticket's own named violation is gone. Refuse permanently: legal prose,
migrations (`git revert` is not a rollback — undoing one is a new migration and
the data may be gone), `apps/web/public/**` media, and automated replies.

**6. THE SELF-AMENDMENT BAR — shipped in this PR, and the part that should not
wait.** `check-automerge-allowlist.mjs` says in its own header that it "cannot
judge whether a path *deserves* to be auto-mergeable — adding `apps/web/` to that
file would pass CI." For ordinary paths that is right. But one class differs in
kind: a PR touching the allowlist, a workflow, a checker, a charter, `CLAUDE.md`
or this file changes **what may merge with nobody looking, and what agents are
permitted to do**. Allowlisting one would let a bot PR widen its own authority
and land the widening unreviewed — self-ratifying. `NEVER_ALLOWLIST` now refuses
20 such prefixes outright, matched bidirectionally so both `docs/agents/` and a
broad `docs/` are rejected. **The mechanism that decides what merges without a
human must itself always need a human.** (Reconciliation note, this PR: the one
narrowing of that bar is `NEVER_ALLOWLIST_EXCEPTIONS`, exempting the
founder-approved `apps/web/public/social/` carve-out and nothing else.)

**What ships now and needs no approval:** the `desk:*` and
`review:not-run`/`review:contested` labels (inert until bootstrapped);
`scripts/check-work-ownership.mjs` + a daily `watchdog.yml` step (zero AI,
persistent alert, real email); `.github/work-ownership-budget.json`; and the
self-amendment bar. None of it grants authority to anything — it makes the
current state measurable and closes a hole a future grant could fall through.

**Known gaps, stated rather than engineered around.**
- **Founder provenance is decorative.** Two collaborators, both admin, both
  shared with every agent. The 2026-07-18 merge grant vested on "a
  founder-authored comment on brief #822" — from an account any agent can post
  from. **Recommended prerequisite to any further grant:** real personal GitHub
  accounts for Joey and Wyatt, bots demoted to `write`. This is a TX item.
- **`needs-human-review` conflates two opposite states.** Austin applies it when
  Codex *disagreed*; Content Shift when Codex was *unreachable*. Contested and
  unreviewed are not the same risk, and the 2026-07-18 standing grant merges the
  class assuming the benign one. Replacement labels ship here; making only
  `review:not-run` envelope-eligible is a charter change.
- **A budget can be raised to silence an alarm.** Nothing in the code prevents
  it. Mitigation is that it is a one-line visible diff in a file whose header
  says it is a policy act, and that the file cannot be auto-merged.
- **Bot-selected images fail on Instagram, not in CI.** The general rule this
  implies: automation is safe in proportion to how close the detector sits to
  the harm.

**Alternatives considered:** (a) build the founder-bot as asked — rejected,
above. (b) A founder-bot with a *tight* fence — collapses into this proposal
once you enumerate what it may touch, and adds a second account, making
provenance worse. (c) Keep prose routing and improve nudging — rejected for the
reason Joey rejected it on 2026-07-15 ("the bottleneck itself was the problem,
not its visibility"); three weeks of briefs restating one unstaffed item *is*
the improved-nudging outcome. (d) Assignee-only routing — rejected on mechanics.
(e) Zero-threshold alarms instead of a budget file — rejected: 138 items every
morning is how #947/#1177/#1203/#1224 were lost. (f) Have CI judge which paths
*deserve* auto-merge — rejected as over-reach, except for the one class where it
is not a policy call (the self-amendment bar).

**Who approved:** proposed by Claude; **needs Wyatt's sign-off** for items 2–5
(routing authority, charter amendments, merge-authority widening). Item 6 and the
measurement layer are shipped as safety ratchets and can stand on their own.

---

## 2026-08-11 — Merge-delegation execution: a downgrade guard now, class widenings on proof (PENDING Wyatt)

**Decision (PENDING Wyatt's approval):** Deliver the founder's "never merge
routine work again" as **"never merge *routine* work again, plus a permanent,
enumerated human residue."** Concretely: (1) **ship now, no judgement call** — a
dependency-downgrade guard (`scripts/check-no-downgrade.mjs`) wired into the
required `build` job that fails if any dependency's highest resolved version drops
below `main`, closing the #1903 merge-order regression class; and this plan
(`docs/proposals/2026-08-11-merge-delegation-execution.md`). (2) **Gate on
prerequisites** — the `docs/**` content widening depends on #1910's
`NEVER_ALLOWLIST` landing first (a bare `docs/` prefix would let a bot edit
`docs/decisions.md` unreviewed; the allowlist matcher can't express "docs except
governance" without it), so it is written up but NOT shipped. (3) **Move to a
separate vehicle** — Dependabot dev-dep patch/minor auto-merge belongs in its own
`dependabot[bot]`-keyed workflow gated on the new downgrade guard + `build` +
dev-only scope, NOT the content path allowlist (`package.json`/lockfiles are
correctly barred); recommended PENDING Wyatt because a malicious-but-passing
release is a real residual risk no CI check catches. (4) **Refuse as a path
widening** — the a11y lane is `.tsx` app code with no inertness proof; it needs a
dedicated a11y CI lane, not an allowlist line. (5) **Ship the social-image
carve-out (already founder-approved, not pending):** per the 2026-08-11 entry
"Auto-merge allowlist extended to `apps/web/public/social/**`" (Joey) and Wyatt's
directive to implement it, add `apps/web/public/social/` to
`.github/content-automerge-allowlist.txt`, reconcile the #1902 "Content auto-merge
scope" test (`scripts/check-automerge-allowlist.test.ts`) so that subtree is
permitted while the rest of `apps/web/public/**` stays refused, and add a
fail-closed gate to `auto-merge-content.yml` so a social image only auto-merges
when it rides with a queue draft that `scripts/social/check-drafts.mjs` actually
validated (an image-only PR is declined). This resolves the two same-day
"founder-approved" claims (Joey's image decision vs the #1902 scope entry, still
PENDING Wyatt) toward Joey, per Wyatt's 2026-08-11 direction. Only the `social/`
subtree is granted; base-ref fetch of the allowlist is preserved (a PR still
cannot widen its own gate). Reconciliation note (this PR): the #1910
`NEVER_ALLOWLIST` bar on `apps/web/public/` and this grant were both landed in the
same consolidated branch; the exemption is `NEVER_ALLOWLIST_EXCEPTIONS`
(social-only), so there is no longer a "whichever lands second" hazard, and the
social allowlist line + test reconciliation already present on `main` were used
rather than re-added.

**Permanent human residue (auto-merge refused forever):** app code, `.github/**`
workflows, the merge rules themselves (allowlists/checkers/`package.json`/
lockfiles/config), governance docs & charters, secrets, legal copy, schema
migrations, public media (outside the gated `social/` carve-out), and automated
replies to real people. This is the honest complement of the goal, not a "not
yet."

**Why:** #1903 proved the concrete gap — a lockfile regenerated from a stale base
silently reverted a security fix (`brace-expansion 5.0.9 → 5.0.7`) on `main` with
a green check (#1933 is the cleanup). Blind auto-merge is unsafe against
merge-order regressions until that class is fenced; the guard is that fence and it
serves the goal directly. The widenings, by contrast, are safe only as a function
of prerequisites (#1910's self-amendment bar; real per-agent identity for any
founder-attested exception) — shipping them ahead of those would re-open the
exact self-ratification hole #1910 closed. Provenance is still decorative (both
GitHub accounts are shared by every agent), so every widening here is justified by
**path + mechanism**, never by "who approved," which is the only kind that's safe
today.

**Alternatives considered:** (a) *Ship the `docs/**` widening now* — rejected:
unsafe without `NEVER_ALLOWLIST` on `main`; it would let a bot merge governance
docs. (b) *Auto-merge the a11y lane by path* — rejected: it's app code; a path
fence can't prove behavior. (c) *Route Dependabot through the content allowlist* —
rejected: lockfiles are barred for good reason (they swap what checks run). (d)
*An `npm audit`-based guard instead of version comparison* — the version check is
deterministic, offline, and directly names the regressed package; audit is
recommended as a complementary signal in the Dependabot workflow, not the primary
gate. (e) *Do nothing until identity is fixed* — rejected: the guard and the
path/mechanism widenings need no identity, so they shouldn't wait on it.

**Approved by:** PENDING Wyatt (CTO).

---

## 2026-08-11 — Tree: a standing social-media-manager agent, planning separated from drafting

**Decision:** Create **Tree** (`docs/agents/tree.md`), a standing agent whose
only job is social strategy. It runs **once a week** on Wyatt's account (Opus),
owns exactly one artifact — `social/calendar.md`, always covering the next 14
days — audits the previous week's posts against strategy and metrics, files a
weekly `founder-task` issue for the reach lane APIs can't touch, and never posts
anything. The daily Growth run stops inventing content and drafts what the
calendar says. The operating strategy it applies is a new file,
`docs/marketing/social-strategy.md`, which supersedes `growth-plan.md` §4-6 as
the posting strategy (growth-plan keeps listening, etiquette, UTM, and the
founder-action table). Posts stay **fully automated** — no approval gate is
being reintroduced.

**Why:** Founder-verified audit today: **12 of the last 14 posts open "did you
know"** — the pillar *name* from growth-plan §4 leaked into caption copy and the
drafting prompt's "see posted examples for voice" instruction turned it into a
copying loop. Every Instagram image was a generic era tile. **11 of 12 items in
`social/failed/` are X drafts** that failed with a generic 403 — first thought to
be duplicate-content rejections from near-copied IG siblings, **corrected
2026-08-11 later the same day**: the actual cause was X rejecting each one for
exceeding its real 280-character *weighted* length (all 11 measured 294-373
weighted characters; X counts an autolinked URL as exactly 23 characters
regardless of its real length), not sibling duplication — see
`scripts/social/check-drafts.mjs`'s `weightedTweetLength` and
`docs/marketing/social-strategy.md` §2's "Sibling rule + the X length rule".
And nothing planned around the three things Joey
actually wants: a coordinated push when a feature ships, a monthly re-teaching of
the six site threads (new followers keep arriving and nobody has ever explained
them), and a recurring beat for Mood. The missing piece was not a better prompt;
it was an artifact between "the pillars exist" and "draft something today". A
planning layer is also the cheapest thing in the fleet — one Opus session a
week — and it makes the daily run cheaper by removing the invention step.

**Alternatives considered:** (a) *Just fix the Growth prompt* — rejected, that
is what 2026-08-06 tried for the media half and the same run kept taking the
lazy default; strategy and execution in one 11:00 UTC session means the
strategist is always the person under time pressure. (b) *A daily Tree* —
rejected as pure token waste: a calendar covering 14 days on a weekly cadence
survives a missed run, which a daily planner's output would not need to.
(c) *Reintroduce a founder approval gate on posts* — rejected by Joey outright:
he has a full-time job and the site should mostly run itself; the answer to bad
posts is better planning plus code-level checks, not a human bottleneck.
(d) *Fold social planning into Marjorie* — rejected, she is chief of staff and
already the auditor; an agent auditing its own plan is the failure mode every
charter in this directory is written against.

**Approved by:** Joey

## 2026-08-11 — Social image posture: screenshots and cards first, vetted real photos allowed, clickability over caution

> **SUPERSEDED 2026-08-12** by "The Taylor-photo standard" at the top of this
> log. The ladder below is no longer in force — a real photograph of Taylor is
> now the default and era tiles and designed cards are out of the feed. The
> **rights bars in this entry still stand**; only the ordering changed. Kept
> for the record of what was tried and why it did not hold.

**Decision:** Social images come from a four-rung ladder, in order: (1) **site
screenshots** (`scripts/social/capture-screens.mjs`), (2) **designed cards**
(`scripts/social/render-card.mjs`), (3) **clearly-safe real photos** — only ones
already vetted into the Vault carrying a real photographer/outlet credit, or a
vetted asset under `apps/web/public/social/library/` — and (4) generic
`/eras/<id>.png` era tiles as a **last resort**, requiring an explicit
`mediaKind: "era-art"` field plus written justification. Bounded risk tolerance
on rung 3: no paparazzi or private-setting shots, no watermarked images, no fan
edits without the creator's permission, credit carried into the caption where
the format allows, designed cards never reproduce lyrics, and takedown-on-request
honoured without argument. **Clickability is priority #1** — a rights-clean but
boring tile is the failure we are correcting, not the safe default.

**Why:** The 2026-08-06 decision correctly demoted era tiles but left the
alternative as "go find a real photo", which is the most legally fraught and most
laborious option — so the runner kept defaulting back and the grid stayed a
repeating slideshow. Screenshots invert that: they are unambiguously ours, cost
nothing in rights, are trivially generated, and *show the product*, which is the
entire purpose of the account. Cards cover the text-forward posts screenshots
can't. Real photos stay available because some moments genuinely need the real
image, but the pool is restricted to what Karen's integrity engine has already
scanned rather than the open internet.

**Alternatives considered:** (a) *No real photos at all* — rejected by Joey; some
posts need the actual photograph and a blanket ban would flatten the account into
UI screenshots. (b) *Open photo sourcing with per-image human review* —
rejected, that reintroduces the approval gate Joey just removed and is the exact
bottleneck he asked us to design around. (c) *Keep era tiles as the default and
just add more of them* — rejected: 12 files can't carry a daily account, which is
what produced the repetition in the first place.

**Approved by:** Joey

## 2026-08-11 — Auto-merge allowlist extended to `apps/web/public/social/**`, gated by the draft checker

**Decision:** Add `apps/web/public/social/` to the allowed prefixes in
`.github/workflows/auto-merge-content.yml`, so a Growth drafting PR that commits
a screenshot, a designed card, or a vetted photo alongside its queue items lands
on green like a queue-only PR. The gate that replaces the human look is
`scripts/social/check-drafts.mjs`, which runs before the PR opens and enforces
the media rules (Instagram media required, era art only with an explicit
`mediaKind: "era-art"` justification, no banned openers, no opener-pattern reuse
inside 14 days, sibling copy >20% different). The `hold` label still blocks
auto-merge for anything a run wants a human to see, and `SOCIAL_FREEZE` remains
the total kill switch. (Implemented: `scripts/social/check-drafts.mjs` and the
workflow's `check-drafts` job landed in PR #1900. The allowlist entry itself
took two attempts — PR #1902 merged the same day with an unrelated allowlist
refactor whose own regression test briefly asserted the opposite of this
entry, so round 1's version of this change was dropped pending Wyatt's
sign-off; the "Approved by" line below records that sign-off and
`fix/social-image-automerge` lands the reinstated allowlist entry + per-file
constraints. Until that PR merges, image PRs keep waiting for a human merge,
which is the safe direction to fail.)

**Why:** This directly reverses the "alternatives considered" note in the
2026-08-06 entry, which rejected exactly this extension on the grounds that "a
bot-selected image landing on the live profile with zero human eyes on it is a
bigger risk than a caption is". Two things changed. First, the reasoning assumed
bot-selected *photographs*; the default image is now a screenshot of our own site
— there is no third-party rights question and nothing to review. Second, the
2026-08-06 posture was tested for five days and produced the opposite of its
intent: rather than a founder quickly merging photo PRs, the drafter avoided
committing images at all and kept using era tiles, because that was the only path
that auto-merged. A rule that makes the good behaviour slower than the bad
behaviour selects for the bad behaviour. And the premise that a human sees these
images is already false in the general case — captions ship unread since
2026-07-25.

**Alternatives considered:** (a) *Keep the human merge for images* — rejected for
the reason above: it is the friction that caused the failure it was meant to
prevent. (b) *Allow only `apps/web/public/social/library/`* (pre-vetted assets)
— appealing, but it blocks the screenshot path, which is the whole point, since
screenshots are generated per-post and can't be pre-vetted. (c) *Auto-merge
screenshots and cards but not photos* — rejected as unenforceable at the
workflow level: the allowlist sees paths, not provenance; the checker is the
right place for that distinction and already carries it.

**Approved by:** Joey; Wyatt (verbally, relayed by Joey 2026-08-11 evening —
resolves the same-day conflict with #1902's regression test)

---

## 2026-08-11 — Dependabot: bump `nanoid` + re-apply `brace-expansion`; ACCEPT `image-size` and `uuid` with documented reasoning

**Decision (PENDING Wyatt's approval).** Of the six open Dependabot alerts,
three are fixed here and two are accepted, not fixed (the sixth is a second
advisory on the same `image-size` version). Reachability was checked per
package (`docs/agents/paul-blart.md` step 1), not assumed from severity.

### Fixed: `brace-expansion` 5.0.7 → 5.0.9 — AND A PROCESS BUG BEHIND IT

Two high advisories (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895; both
unbounded-array DoS, `A:H` only). Straightforward: the requiring range is
`^5.0.5`, so `npm update brace-expansion` is the whole fix.

**The part worth Wyatt's attention is why it came back.** PR #1893 already
bumped this to 5.0.9 on 2026-08-11. PR #1903 (`social(images)`) then merged a
regenerated `package-lock.json` built from a base predating #1893, which
reverted the entry to 5.0.7 and re-opened both alerts (they were re-created at
16:57Z the same day). Nothing in CI noticed: no gate compares the lockfile
against known advisories, so a security bump can be silently undone by any PR
that happens to run `npm install`.

**Left for Wyatt** (not done here, it changes CI): add a lockfile-regression
gate — the cheapest version is `npm audit --audit-level=high` on the merge
result, or a check that no dependency version *decreases* relative to `main`.
Without one, this will recur; it is a property of the merge order, not of the
people involved.

### Fixed: `nanoid` 3.3.16 → 3.3.18 (GHSA-2v37-7h3g-55p8, high)

Lockfile-only bump, no `package.json` change — `postcss` asks for `^3.3.16`
and 3.3.18 already satisfies it, so `npm update nanoid` is the whole fix.
Build-time only (`postcss` ← `next` and `apps/web`); the vulnerable path is a
custom generator called with `size: 0`, which nothing in this repo does.

### Accepted: `image-size` (GHSA-w3rx-r6r6-pgpr + GHSA-5p2g-fcmc-qvqq, both high)

**There is no patched version — the advisories cover `<= 2.0.2`, which is
latest.** So this is a reachability decision, not a bump.

- **What pulls it in:** `image-size@1.2.1` ← `metro@0.84.4` ← `react-native` /
  `expo`, i.e. the **React Native bundler** in `apps/mobile`. It is listed
  under `dependencies` (which is why Dependabot labels the scope "runtime"),
  but metro is build tooling: it runs on a developer's machine or an EAS build
  server, never in a request path.
- **Not in the web app at all.** Nothing in `apps/web`, `packages/*` or
  `scripts/` imports `image-size` (only the lockfile mentions it). The website
  is Next.js; metro never runs for it. `npm run build` does not invoke it, and
  no CI workflow builds `apps/mobile`.
- **What metro uses it for:** reading the dimensions of image assets it is
  bundling. In this repo that input is `apps/mobile/assets/` — three PNGs we
  authored (`icon.png`, `adaptive-icon.png`, `splash.png`). There are **zero**
  `.icns`, `.jxl`, `.heic`, `.heif` or `.avif` files anywhere in the repo, and
  those are the only three parsers the advisories touch.
- **Impact if it did fire:** both are `C:N/I:N/A:H` — an infinite loop that
  hangs the Node process. Worst realistic case is a hung local or EAS build,
  not a production outage. There is no user-supplied image anywhere in the
  product; the app has no upload path.
- **Who could exploit it:** someone able to commit a crafted `.icns`/`.jxl`/
  `.heif` into `apps/mobile/assets/`. That is repo write access, which already
  implies arbitrary code execution in CI. The advisory adds nothing to that
  threat model.

**Verdict: accept, do not patch.** Pinning changes nothing (1.2.1 is already
the newest 1.x and 2.x is equally vulnerable); an `overrides` to 2.x would
break metro, whose range is `^1.0.2` and whose call site uses the 1.x default
export. Replacing the dependency means forking metro. Re-evaluate when either
(a) upstream ships a fix, or (b) `apps/mobile` gains any path that reads an
image the user supplied — at which point this becomes reachable and urgent.

### Accepted: `uuid` (GHSA-w5hq-g745-h8pq, medium)

- **What pulls it in:** `uuid@7.0.3` ← `xcode@3.0.1` ← `@expo/config-plugins`.
  It generates the object IDs inside an iOS `.pbxproj` during `expo prebuild`.
  Build-time, macOS-only, never shipped.
- **The repo's own UUIDs are unaffected.** The note that "the repo generates
  uuids for content rows" checks out, but those come from **Postgres
  `gen_random_uuid()`** in `supabase/migrations/**`, not from this package. No
  file in `apps/`, `packages/` or `scripts/` imports `uuid` at all — so there
  is no behaviour of the old version for anything to depend on.
- **The advised fix is not available to us.** The advisory wants `>= 11.1.1`;
  `xcode@3.0.1` declares `uuid: ^7.0.3`. Forcing 11.x via `overrides` would
  hand a CommonJS consumer an ESM-only package with a changed API — a likely
  broken `expo prebuild` traded for a medium-severity bounds check on
  `v3/v5/v6` with a caller-supplied `buf`, which `xcode` does not use.

**Verdict: accept.** It clears when Expo bumps `xcode`. Not worth an override.

**Alternatives considered:** `npm audit fix --force` (rejected — it would pull
unrelated majors across the Expo toolchain to satisfy two build-time DoS
advisories); `overrides` for both (rejected per the reasoning above);
suppressing the alerts (rejected — leave them visible, with this entry as the
answer when they resurface).

**Approved by:** pending Wyatt.

---

---

## 2026-08-11 — Security headers: a split CSP (enforce the safe half, report-only the rest) and a permissive `img-src`

**Decision (PENDING Wyatt's approval).** The app shipped with **no** security
response headers. It now sends HSTS, `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and **two** CSP
headers, defined in `apps/web/lib/security-headers.mjs`:

1. **`Content-Security-Policy` (enforcing)** — `frame-ancestors 'none'`,
   `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`. Nothing else.
2. **`Content-Security-Policy-Report-Only`** — the full resource policy
   (script/style/img/font/connect/frame/worker/manifest), reporting to
   `/api/csp-report`.

**Why split.** The site is embed-heavy and hotlinks images from ~500 distinct
third-party hosts, a set that grows with every content PR. A single enforcing
policy is a loaded gun pointed at content: the first new image host silently
blanks a photo, and nobody notices for a week. The split lets us have the
controls that *cannot* break a page today, while learning what the real site
loads before anything becomes fatal. The four enforced directives were chosen
because none of them governs loading a resource — a unit test asserts the
enforced policy contains no fetch directive at all, so no future content can be
broken by it. `frame-ancestors` has to be in the enforcing header specifically:
browsers ignore it in a report-only policy.

**Why `img-src` stays permissive (`'self' data: blob: https:`) even after the
flip.** An allowlist of ~500 hosts is a maintenance trap with a silent failure
mode, and it buys very little — an image URL is not a code-execution vector.
`https:` keeps the guarantee that actually matters (no plaintext image loads).
Being honest about this beats a policy that looks strict and gets widened in a
panic the first time a page goes blank.

**What `script-src` does and does not buy.** It carries `'unsafe-inline'`,
because Next's hydration bootstrap and the JSON-LD block are inline scripts
whose content changes every build. Removing it needs a per-request nonce, which
in the App Router means middleware, which opts every page out of static
generation — a bad trade on a 100% prerendered content site. So `script-src` is
a host allowlist, not an XSS control. Acceptable today because the app renders
no user-supplied HTML anywhere (feedback text goes to GitHub, never back into a
page). **If that ever changes, this directive needs the nonce.**

**Not done deliberately:** `preload` on HSTS (submitting to the browser preload
list is effectively irreversible — Wyatt's call, not a side effect of a headers
PR), and `upgrade-insecure-requests` (no http:// subresources exist to fix, and
content carries a few http:// source links to old archives we don't want to
risk rewriting).

**How to flip report-only → enforcing:** watch `/api/csp-report` across the era
reader, moment detail, Taylor's Version and Mood surfaces for a quiet period,
fold any legitimate host into the lists, then pass
`enforceResourcePolicy: true` from `next.config.mjs`.

**Alternatives considered:** (a) one enforcing policy from day one — rejected,
silent content breakage; (b) nonce-based `script-src` via middleware — rejected,
costs static generation for XSS protection the threat model doesn't need yet;
(c) a real `img-src` allowlist — rejected, unmaintainable at ~500 hosts.

**Approved by:** pending Wyatt.

---

## 2026-08-26 — Resource CSP flipped from Report-Only to enforcing (#1975)

**Decision.** `apps/web/next.config.mjs` now calls `securityHeaders({ ...,
enforceResourcePolicy: true })`. The resource directives
(`script-src`/`style-src`/`img-src`/`font-src`/`media-src`/`connect-src`/
`frame-src`/`worker-src`/`manifest-src`) that shipped as
`Content-Security-Policy-Report-Only` since #1935 (merged 2026-08-12) are now
sent as the single enforcing `Content-Security-Policy` header, merged with the
four directives (`frame-ancestors`/`base-uri`/`form-action`/`object-src`) that
were already enforcing.

**Why now.** The 2026-08-11 entry above set the bar: a quiet
`/api/csp-report` window plus every legitimate host folded in.
- Vercel production runtime logs (`swift2-web`, `prj_sn7u2Wn8TCFpVMGhVoBCpC6ImmsL`)
  for the trailing 24h (the plan's full retention window) show real traffic
  across `/`, `/vault/tier0`, `/vault/current/tloas`, `/vault/live-theories`,
  `/privacy`, `/terms`, `/opengraph-image`, `/_next/image`, `/api/mood`,
  `/api/clown` — 471 requests total — and **zero** hits to `/api/csp-report`
  and zero `warning`/`error`-level log lines. The report sink has been live
  14 days (since #1935); only the last day is queryable on the Pro log-
  retention plan, but a full day of real embed/image/API traffic reporting no
  violations is direct evidence, not an absence of instrumentation.
- Static check (`apps/web/lib/no-html-sink.test.ts`, added in #3174) asserts
  the only `dangerouslySetInnerHTML` in `app/`+`components/` is the static,
  hardcoded JSON-LD block in `app/layout.tsx` — the invariant the 2026-08-11
  entry's `script-src` reasoning depends on.
- No host-list changes were needed: `FRAME_SRC`, `VERCEL_ANALYTICS`, and the
  `'self'`-scoped `connect-src`/`img-src https:` policy already covered
  everything a manual pass over the embed components and `next/image` config
  found.

**What did not change.** `script-src` still carries `'unsafe-inline'` and is
still a host allowlist, not an XSS control, per the 2026-08-11 entry's
reasoning — enforcing it does not add nonce-based script protection. If the
app ever renders user-supplied HTML, that entry's nonce/middleware trade-off
needs revisiting.

**Verification:** `next build && next start`, loaded `/`, a moment/era
detail page and `/privacy` with Chrome devtools open — zero console CSP
errors, all embeds/images/fonts loaded. `npm test --workspace=@swift2/web
-- security-headers` and `npm run typecheck --workspace=@swift2/web` both
green.

**Approved by:** the owner (Decision Authority — non-product, technical
change, no new secrets/infra/spend).

---

## 2026-08-11 — Third-party embeds are click-to-load, without exception

**Decision (PENDING Wyatt's approval).** Every third-party embed on the site
mounts only after the reader opts in. YouTube (`MomentVideo`, `MoodSongCard`)
and Spotify (`EraMedia`) already worked this way; `MomentSocialPost`
(Instagram) and `SpotifyCompare` (two Spotify players side by side) did not,
and now do.

**Why:** an eager embed hands the visitor's IP, user-agent and referring URL to
Instagram/Spotify before the visitor has asked for anything. `loading="lazy"`
does not fix this — it defers the load, but any reader who scrolls to the
component still pays, and `SpotifyCompare`'s desktop layout puts both players
in the viewport together.

**Tension this resolves.** `MomentSocialPost` was deliberately made eager on
2026-07-21 on founder direction: *"can we see the post on our page? ... The
intent is to have a seamless flow in the app, not just push users over to
instagram."* That intent is preserved — the post still renders **inline, on our
page**, and the "Open on Instagram" link stays a secondary affordance. What
changed is that it costs one tap. **Wyatt should confirm he's happy with that
trade**, since it partially walks back his own direction.

**Approved by:** pending Wyatt.

---

## 2026-08-11 — Content auto-merge scope: one allowlist file, and a CI guard that fails when it drifts

**Decision (PENDING Wyatt's approval — this changes merge authority).** Three
changes to `.github/workflows/auto-merge-content.yml`:

1. **Widen the allowlist by three paths.** `theories.generated.ts`,
   `videos.generated.ts` and `song-moods.generated.ts` join
   `content-vault.generated.ts` and `tracks.generated.ts` as auto-mergeable.
2. **Move the allowlist out of the workflow** into
   `.github/content-automerge-allowlist.txt`, which the workflow fetches from
   `main` at run time via the API (never from the PR head, so a PR still cannot
   widen its own gate). One source of truth, no copy to fall behind.
3. **Guard it in CI.** `npm run check:automerge-allowlist` (new, in `build`)
   fails if any `apps/web/lib/longlive/*.generated.ts` is neither allowlisted
   nor on an explicit reasoned exclusion list, if any entry points at a path
   that no longer exists, or if the list gets re-inlined into the workflow.
   `scripts/lib/generated-content.mjs` is now the single manifest of generated
   artifacts, shared with `check:generated`.

**Why:** `apps/web/lib/longlive/` grew from two generated files to five; the
workflow's hand-typed list stayed at two. Every content PR touching theories,
videos or song moods hit the "non-content path" branch — which prints a line
and `exit 0`s, so the check reported SUCCESS. PRs #1891 and #1762 (a theory
seed plus its regenerated vault) sat open a week with nothing appearing wrong.
The three missing entries were the symptom; the defect was a duplicated list
that could desync with no signal.

**What this does and does not widen.** All five files are pure functions of
`supabase/seed/**` — each sync script writes its output wholesale from the
seeds, and `check:generated` already fails CI if any of them differs from a
fresh regeneration, so none can be hand-authored. A PR that regenerates one is
therefore exactly as reviewed as the seed edit that caused it, which was
already auto-mergeable. Nothing else moves: `apps/web/public/**` and all app
code still wait for a founder (see the 2026-07-28 entry — a bot-picked image
gets human eyes).

**Observability.** "Correctly declined" and "misconfigured" used to look
identical: one line in a log, exit 0. Declining stays exit 0 — a mixed
app-code PR legitimately is not auto-mergeable and must not fail its build —
but every run now writes a verdict to the job summary (`enabled` / `declined` /
`held` / `frozen` / `BROKEN GATE`), lists *every* offending path rather than
the first, and prints the allowlist that was actually in effect. A stale gate
is now visible in the summary of the PR it stranded. A gate that cannot be
read or does not parse is the one case that exits non-zero; `build` is the only
required check, so that goes red without blocking anything.

**Alternatives considered:** (a) just adding the three lines — rejected, it
fixes today's symptom and leaves the drift mechanism intact; (b) keeping the
list inline and having CI diff the workflow YAML against a manifest — honest,
but it detects duplication rather than removing it, and YAML-parsing a shell
heredoc in a checker is its own rot risk; (c) deriving the allowlist from the
sync scripts' outputs at run time — rejected, it would make the gate widen
itself automatically, and *what may merge unreviewed* must be an explicit human
edit. The chosen shape keeps the policy hand-written in one obvious file and
makes CI prove it stays complete.

**Known gap:** the guard proves the allowlist *covers* every generated
artifact. It cannot judge whether a path *deserves* to be auto-mergeable —
adding `apps/web/` to that file would pass CI. That is why the file carries a
merge-authority warning header and why this entry exists.

**Who approved:** proposed by Claude; **needs Wyatt's sign-off before merge**,
as a policy change rather than a config fix.

---

## 2026-08-11 — Queue exclusions are label-based and self-reporting, never hardcoded

**Decision:** No agent prompt may exclude work by issue number. Exclusions are
labels (`kevin-skip`, `cie:safety`, `cie:escalate`), every `kevin-skip` carries
a reason and a review date in a comment on the ticket, and a deterministic daily
sweep (`scripts/ops/unowned-sweep.mjs`) re-lists every parked ticket with its
age. Separately, any issue opened with zero labels is auto-stamped `needs-triage`,
which Kevin S3 now honours regardless of author.

**Why:** Kevin's Stream 1 prompt subtracted a hardcoded set
`{194,203,206,298,301,153,137,138}` from 2026-07-14 (introduced wholesale in the
cloud-routine migration #520 with no rationale, no expiry, no tracking ticket).
Those 8 tickets were unowned by construction — one was the PhotoDNA/NCMEC CSAM
ticket, and five were watermarked-image fixes of a class Kevin had already fixed
successfully elsewhere. Every scanner in the fleet pulls its queue with a filter,
and nobody owns the complement of a union of filters: the same audit found 17
open issues no scanner's filter reached at all. The individual tickets were never
the bug; the silent, permanent, unreviewable exclusion was.

**Alternatives considered:** (a) Just delete the 8 numbers — rejected, the next
agent adds nine more; nothing structural changes. (b) A `--check` CI gate that
fails `build` on any unlabeled issue — rejected, a human opening an issue must
never turn `main` red. (c) A new triage agent — rejected, this is a deterministic
set operation and CLAUDE.md rule 8 says codify it, not spend tokens on it.

**Approved by:** Wyatt (CTO) — pending PR review.

## 2026-08-11 — `needs-manual-a11y` gates the sign-off, not the build

**Decision:** The label means "the *pass criterion* cannot be asserted by axe or
a scripted probe." A fully-specified code fix is never blocked on
assistive-technology availability: it ships, and the AT confirmation happens on a
batched founder checklist (`docs/a11y-manual-queue.md`) run per milestone and
before go-live. #657/#660/#1206 lose the label; #834/#835 keep it for their
genuine residual but are buildable now.

**Why:** The queue stood at 5 open, 0 ever closed, since the label was created on
2026-07-15. All five were found by a scripted probe or a named axe rule and carry
an exact file, line and fix — none needed AT to know what to do. The label was
carrying three meanings at once ("AT needed to find it", "AT needed to confirm
it", and — as Austin's fence read it — "do not build it"), so five specified
fixes sat still for four weeks.

**Alternatives considered:** (a) Charter an agent to do AT testing — rejected,
emulating a screen reader and calling the result a pass is worse than an empty
queue because it is not obviously empty. (b) A standing weekly AT chore —
rejected, nobody will do it; batching per milestone amortises the expensive
setup against a moment that already commands attention.

**Approved by:** Wyatt (CTO) — pending PR review. Laura's charter edit included;
the matching one-line Austin charter change is handed to that charter's owner.
---


## 2026-08-06 — Instagram profile was a repeating slideshow: real-photo default, code-level guard

> **SUPERSEDED 2026-08-12** by "The Taylor-photo standard" at the top of this
> log. Demoting era art to a last resort was this entry's whole mechanism, and
> it did not hold — the last resort was taken 17 times out of 17. Era art is
> now banned from the feed outright. Kept as the first of the two failed
> demotions that argued for removal.

**Decision:** Fix the Growth desk's drafting instructions so Instagram posts
default to a real, dedicated photo of what the post is about, with generic
era-cover art (`/eras/<id>.png`) demoted to a last resort — plus a code-level
guard in `scripts/social/lib/queue.mjs`/`post-queue.mjs` that blocks a queue
item from posting if its only photo is era art already used in a recent
Instagram post, rather than relying on the instruction alone.

**Why:** Joey flagged the live profile as "very broken" from a screenshot
showing the same handful of images cycling. Investigation found every single
Instagram post ever made (17/17, back to the account's first real post) used
generic `/eras/<id>.png` era-cover art — never a real, specific photo — even
though real dedicated photos exist and are demonstrably usable (see
`apps/web/public/social/2026-07-17-electric-lady-*.png`, the one time this
was done right; nothing since replicated it). With only 12 distinct era-cover
files and the current/recent eras drawing disproportionate coverage, the
account's grid visibly repeated 2-3 images. Not a code crash — the posting
pipeline (`scripts/social/lib/platforms.mjs`) correctly sends whatever
`media` path a queue item specifies; the bug was the drafting runner always
taking the documented "safe default" instead of doing the real photo-sourcing
work. A prompt-only fix wouldn't have held (same lesson as the voice-checker
work the same week: a doc instruction is advisory, a real check is not), so
this pairs the runbook rewrite with an enforced code check.

**Also found, not fixed here (needs a human):** a documented 2026-07-17
duplicate-post incident (`docs/agents/growth.md`) left 2 duplicate Instagram
posts still live — Instagram's API has no delete endpoint
(`scripts/social/delete-media.mjs`), so removing them requires manually
deleting from the Instagram app. Flagging for Joey/Wyatt, not doing it
myself — deleting a live public post is exactly the kind of external,
hard-to-reverse action that needs a human's own hand on it.

**Alternatives considered:** loosening `auto-merge-content.yml`'s allowlist
to include `apps/web/public/**` so photo-sourcing PRs could auto-merge like
queue-only ones — rejected: a bot-selected image landing on the live profile
with zero human eyes on it is a bigger risk than a caption is, so those PRs
should keep waiting for a quick founder merge, same as any other code-adjacent
change.

**Who approved:** Claude, acting on Joey's direct bug report ("something is
very broken with our Instagram posting, please fix").

---

## 2026-07-25 — Cut agent token burn: auto-merge content, autopost social, no self-check-ins

**Decision:** Three linked changes, all approved by Wyatt (CTO) after an audit
of live cloud-routine spend:

1. **Agents never babysit their own PRs.** No `send_later` / self-check-in /
   Monitor re-arming. Every runner prompt now says: do the work, open the PR,
   exit. `docs/agents/runner-prompts/*.md` all carry a "Run discipline" block.
2. **Content PRs auto-merge on green.** New `.github/workflows/auto-merge-content.yml`
   enables GitHub-native auto-merge for PRs whose changed files are confined to
   `supabase/seed/`, `social/queue/`, `docs/audits/`, and the two generated vault
   files. Path-based, not branch-name-based. Escape hatches: a `hold` /
   `cie:escalate` / `founder-decision` label, or the `CONTENT_AUTOMERGE_FREEZE`
   repo variable.
3. **Social posts ship without per-item approval.** `isDue` in
   `scripts/social/lib/queue.mjs` no longer requires `approvedBy`/`approvedAt`.
   Growth charter rails 2 and 3 amended to match.

**Why:** An audit of the routine list found ~208 cloud sessions/day, of which
**~144 (≈69%) were agents re-reading their own unchanged PRs** — hourly loops
whose entire output was "still open, still green, re-arm in 1h". PR #1527 ran
that loop from 18:11Z hourly; #1528 for 8+ hours. Nothing in any prompt file
asked for this; the agents self-armed it. The root cause was not monitoring —
it was **merge latency**: all nine open PRs were green and clean, waiting on a
human. Auto-merge removes the thing they were waiting for at zero token cost,
and the discipline block stops the behaviour recurring. The social change is the
same argument applied to the queue: drafts were sitting approved-but-unshipped
for the same human-availability reason.

**What we are accepting:** content and social copy now reach longlivets.com and
the real @longlivetscom accounts with no human read. `build` (which runs
`validate:content`) still gates every merge, `SOCIAL_FREEZE` and
`CONTENT_AUTOMERGE_FREEZE` are instant no-PR kill switches, and the per-platform
caps are unchanged. But the mechanical checks do not cover judgment — notably
Rumor Desk's privacy redlines (security arrangements, health, minors), which are
prose rules no CI job can enforce. Wyatt was shown this specific exposure and
chose to include `content/rumor-desk-*` in auto-merge anyway. If a redline
violation ships, the fix is to add a deterministic checker for it in
`scripts/content-engine/`, not to restore a human gate that was not being
exercised in time to help.

**Alternatives considered:** (a) Keep human merge, just widen the check-in
interval — rejected: still pays a cold-boot cloud session per poll to learn
nothing, and leaves merge latency, the actual cause, in place. (b) Auto-merge by
branch-name prefix — rejected: a bot can name a branch anything, so a code change
on a `content/` branch would sail through; path allowlisting cannot be spoofed
that way. (c) Exclude Rumor Desk from auto-merge — recommended by Claude,
explicitly overruled by Wyatt.

**Approved by:** Wyatt (CTO)

---

## 2026-07-23 — Watchdog alerts weren't reaching anyone; Content Shift had no liveness check at all

**Decision:** Joey asked how to close the gap between "agents are instructed
to leave a memory trace when something goes wrong" and "that trace reliably
exists." Investigation, prompted by Content Shift and Marjorie's brief both
going silent for multiple days: `watchdog.yml` was already correctly firing
a "no Founders' Brief" alert every single day since 07-20 (#947, #1177,
#1203, #1224) — all four sat open, uncommented, because they only relied on
GitHub `@sffan15-sys` / `@wjduvall-cmd` mentions, which `brief-mailer.yml`'s
own header already documents don't reach the founders' real inboxes (bot
identities, not monitored accounts). Separately, Content Shift — a
Wyatt-account cloud routine with no GitHub Actions workflow file — was
entirely invisible to the existing cadence check, which only watches
Actions-native workflows; its own charter's "never exit silently" rule was
the only safety net, and it's LLM-prompt-compliance-dependent (the charter
itself documents this exact rule already regressing once before).

**Fix:** (1) every `watchdog-alert` issue now gets a real email via
`scripts/watchdog/send-mail.py` (extracted from `brief-mailer.yml`'s proven
SMTP path — no new credentials needed). (2) Alert issues are now persistent
— one evolving issue per condition (`scripts/watchdog/upsert-alert.sh`),
not a new disconnected one every day. (3) Added a Content Shift liveness
check to `watchdog.yml`: alerts if no PR titled `content(shift): ` has
landed in 30h (its cadence is 17:00/23:00 UTC, so this tolerates one missed
slot). Deliberately scoped to Content Shift only, not all cloud-routine
agents — extending the same check to Nils/Kevin/Karen/Laura/Paul
Blart/Austin/Growth is cheap if/when one of them is actually observed going
dark, not pre-built speculatively.

**Alternatives considered:** a formal per-agent `memory/` directory
(heavier, bigger surface area, not needed to close the acute gap); moving
memory-writes to the front of each agent's own run sequence instead of
detecting externally (still LLM-compliance-dependent, doesn't fix the
"alerts aren't seen" half of the problem on its own).

**Approved by:** Joey (requested directly; flagged for Wyatt's visibility
since it changes agent-fleet monitoring architecture he owns — not gated on
his sign-off, since this only touches this repo's own `.github/workflows/`
and doesn't touch his cloud-routine accounts).

## 2026-07-21 — Growth desk had no scheduled runner; the queue was empty by default, not broken

**Decision:** Joey asked why social media wasn't posting multiple times a day. Root cause: `social-poster.yml` (the shipping half) has run flawlessly every 30 minutes since 2026-07-17 — every run succeeds, because it correctly finds nothing to post. `social/queue/` has been empty since the Electric Lady post on 7/17. Marjorie already diagnosed this exact gap in issue #864 (2026-07-18): the Growth desk's charter (`docs/agents/growth.md`) describes a daily drafting cadence, but comparing against the runner registry (`docs/agents/runners.md`) — Marjorie, Austin, Nils, Content Shift, Kevin ×4, Karen, Paul Blart, and Laura all have scheduled cron routines; Growth had none. The charter existed; nobody was ever assigned the shift. The ticket sat open 3 days because the routine that would have picked it up didn't exist yet — a genuine chicken-and-egg gap, not a mislabeled founder blocker (which #864 itself already corrected once).

**Immediate unblock:** drafted 7 real, sourced queue items (4 content ideas × X/Instagram, one X-only) covering the "on this day" (a genuine dated match — the 2022 HAIM O2 Arena cameo), "era deep-cut" (folklore's 16-hour surprise drop), "did-you-know" (All Too Well 10-Minute Version's chart record), and "product peek" (the site's era timeline scrubber) pillars from `docs/marketing/growth-plan.md` §4. Every claim traces to real Vault content already sourced elsewhere in the repo. Written with `approvedBy`/`approvedAt` deliberately omitted — the poster ignores anything without both (`social/README.md`), so these sit inert until Joey approves each in Slack #social, per the charter's hard rail 2 (drafting is the desk's job; posting is never automatic).

**Structural fix:** added a "Growth — daily draft" row to `docs/agents/runners.md` + `runner-prompts/growth-draft.md`, on **Wyatt's account** (the standing "all scheduled agent spend runs on Wyatt's account" rule) at `0 11 * * *` UTC — one hour before Marjorie's morning brief assembles, so its Growth line reflects a same-morning queue instead of yesterday's. The runner drafts up to 4 new items/run (skipping when ≥8 are already awaiting approval, so it doesn't flood Slack #social faster than founders can triage), does the daily listening scan the charter calls for, and opens a PR for a human to merge — it never sets approval fields and never posts. This is a **spec**, not a live trigger: per `runners.md`'s own cutover process, Wyatt (or his session) still has to actually create the scheduled routine via `/schedule` or the RemoteTrigger API using this file's exact contents.

## 2026-07-20 — Photo-enrichment progress marker: comma-safe JSON, done-state recomputed live

**Decision:** The photo-enrichment worker (issue #762) tracked progress in a
`<!-- photo-done: k1,k2,... -->` HTML comment whose keys were joined by
**commas**. But most moment keys *contain* commas (e.g. `midnights|2024|2|A
record fourth Album of the Year Grammy, for Midnights`), so a split-on-comma
reader shredded them. Switched (Wyatt approved) to a **comma-safe JSON array**
marker, and moved the logic out of per-run prose into a tested module.

**How it works now** (`scripts/content-engine/lib/photo-marker.mjs` +
`scripts/content-engine/photo-queue.mjs`, unit-tested):
- The marker is `<!-- photo-done: ["key", ...] -->` — JSON, so commas/quotes/
  unicode inside keys are safe.
- The persisted marker records **only the subjective decisions**: sparse pages
  (<2 photos) a run reviewed and deliberately left at their editorial maximum.
- Whether any *other* page is done is **recomputed live from the corpus** each
  run (`isPhotoDone`: ≥2 photos, every photo has a `focalPoint`). Already-
  enriched pages therefore can never churn back into the queue.

**Why it mattered:** two failure modes were already happening. (1) **Churn** —
308 of the 449 pages the old marker called "remaining" already had ≥2 photos, so
recent hourly runs were mostly re-marking done pages. (2) **Silent corruption** —
comma-keys recorded by past runs survived only as their first fragment (the
`, for Midnights` tail split off and reordered away), so they re-queued forever.
Same class of bug as the 2026-07-20 duplicate-`focalPoint`-key incident: legal
to the parser, invisible until it isn't.

**Migration:** ran `photo-queue.mjs migrate` over the full #762 comment history —
recovered 369 recorded keys, kept 144 reviewed-sparse (dropped 225 that are
objectively done or stale); 224/697 moments are objectively done and now tracked
live. The rebuilt JSON marker is posted on #762.

**Alternatives considered:** newline-delimited body (also comma-safe, but JSON is
unambiguous and `JSON.parse` is a one-liner); keeping the format and having each
run substring-match whole keys (papers over the corruption without fixing the
churn). Rejected both.

**Follow-up for the founders (not done here):** the pinned PROTOCOL comment on
#762 should point runs at `photo-queue.mjs` and the JSON format; and since the
high-visibility queue is now essentially exhausted (what remains is low-
visibility 1-photo pages), consider winding the hourly cadence down to daily.

**Approved by:** Wyatt (CTO)

## 2026-07-20 — Fashion shopping links: offer a similar alternative instead of skipping unshoppable pieces

**Decision:** Joey asked for shop links across all fashion-tagged content — clothing and makeup, images included, not just what the text names. Scope check: 148 items carry `category: 'fashion'`; only 1 currently has `moment.products`. A large share are custom/couture/runway one-offs (the existing `content.fashion-products` checker already excludes these from its queue on purpose — "no product page exists"), which is a real dead end for an exact link. Joey's instruction: don't skip those — offer a similar alternative instead.

**Schema:** added `isAlternative?: boolean` + `altNote?: string` (<=200 chars, required when `isAlternative` is true) to `Product` (`apps/web/lib/longlive/types.ts`). No DB migration needed — `products` is seed-authored JSON with no Supabase table backing it. `validate-content.mjs` enforces the pairing (an alternative without a note explaining what's different is a hard error).

**UI:** `MomentDetail`'s "Shop the look" block gets a new "Similar style" pill (era-accent outlined, same treatment family as the existing "Sold out" pill) plus the note, on any product marked as an alternative. This was a deliberate call, not a formatting afterthought: presenting a stand-in silently as the literal garment would be misleading fans into thinking they can buy the exact thing she wore, which the whole no-fabrication standard this project holds everywhere else (photos, sources, video IDs) exists to prevent.

**Sourcing rule going forward:** try the exact piece first (verified retailer page, HTTP 200, real product). If it's genuinely unshoppable (custom/couture/discontinued and no resale listing), source a real, verified, currently-buyable alternative — same brand's closest current silhouette where possible, otherwise a comparable piece from an accessible brand — never a fabricated or unverified guess. If nothing genuinely similar exists either, skip the garment rather than force a weak match. Makeup gets the same treatment (brand + specific product, e.g., a lipstick shade), same verification bar.

**Scale note:** 148 items is a multi-session project, not a single pass — many moments carry 2-4 separate garments (a red-carpet look plus shoes plus a bag). Working it era by era, starting with `debut.mjs` (smallest file, earliest/foundational era), committing in batches the same way the top-100 career-events project did.

## 2026-07-20 — Significance needed a visual signal, not just a layout floor

**Decision:** Joey asked for a full audit of the top-100 career-events project: does the most-important content actually carry the most weight, and can a scrolling user *tell*? The honest answer was split.

**What was already working:** photo count scales for real — `significance: 'defining'` items average 6.2 photos, `'notable'` 2.3, unmarked items 1.3 (measured across the full 695-item corpus). `assignFeedTiers` (`lib/longlive/feed-tiers.ts`) already guarantees `'defining'` the full-bleed hero card and `'notable'` a floor at the `'media'` tier.

**What was broken:** that layout floor was invisible. `'media'` tier is literally the site's plain default look — a `'notable'` item rendered pixel-identical to any ordinary photo-bearing post that happened to land on the same tier by chance. `grep` confirmed `item.significance` was read in exactly one place in the entire component tree (`EraSection.tsx`'s tier assignment) — nothing rendered it as text, a badge, an icon, anything a scrolling user could actually register. Scrolling users had no way to tell a top-100 moment from routine content unless it was rare enough to earn the hero treatment outright.

**Fix:** a new `SignificanceBadge` component (`components/longlive/SignificanceBadge.tsx`) — a small icon+label pill, same visual grammar as the existing "Unconfirmed"/"Hidden clue" chips in `MomentMeta`. `'defining'` renders filled (reinforcing the hero card it already gets); `'notable'` renders outlined, one step down. Wired into both the feed card (`MomentMeta`, all tiers) and the moment-detail header (`MomentDetail.tsx`). Verified in-browser on desktop and mobile viewport, both card and detail contexts, no console errors — screenshots confirm it reads clearly while scrolling.

**A second, deeper gap found in the same audit:** the content-engine's `content.depth-deficit` checker (Wyatt's Curiosity Engine, 2026-07-18) — the thing that's actually supposed to enforce narrative/photo/source/cross-link depth on `'defining'` items — currently flags **39 of 39 `'defining'` items (100%)** as under its own bar, overwhelmingly on narrative word count (many sit at 100–200 words against a 260-word floor). This predates this session's content rounds (none of Tier 2/3 touched `'defining'` items) and its designed remediation path (Lex + the Answerer, run by the RemoteTrigger fleet) has only cleared 1 of 39 since the checker shipped. That's Wyatt's system and cadence to speed up or not — flagged to the founders rather than hand-written over by this session, which would risk duplicating or conflicting with fleet-owned PRs.

**Also fixed — the routing gap that let this happen twice:** `visibilityScore()` (`scripts/content-engine/lib/visibility.mjs`), which decides what counts as "high visibility" for `photo-sparsity` and other checkers, scored purely on era recency / category / title keywords — it had no idea `item.significance` existed. A `'defining'` or `'notable'` item could dodge every depth/photo checker in the engine just by not matching a keyword heuristic. Now `item.raw?.significance` being set unconditionally routes to `'high'` tier, so the checkers built to keep the most important pages the deepest actually see the pages the top-100 project marked as most important.

**Why not also chase full narrative depth for all 39 `'defining'` items in this pass:** that's the exact job the Curiosity Engine pipeline exists for (sourced research per item, not a mechanical word-count pad) — hand-writing 39 items now would either duplicate that fleet's queue or ship un-researched filler, both worse than surfacing the real number and letting the fleet (or an explicit follow-up session) work the queue properly.

## 2026-07-19 — Tier 3: positions 71–100, all `'notable'`, extra photo investment

**Decision:** Closes out the top-100 career-events project (`docs/content-ops/top-100-career-events.md`) with its final tier, positions 71–100 — 29 items marked `significance: 'notable'` (position 82 was skipped: confirmed a duplicate of the already-`'defining'` Miss Americana item). Same bar as Tier 2: each judged against the doc's own "would a fan remember this" test rather than applied mechanically; all 29 cleared it (real chart/venue/industry records, genuine cultural moments, or well-documented firsts) and none were force-fit to `'defining'`.

The 29 span: Billboard's youngest-ever Woman of the Year, the "This Sick Beat" trademark filing, the Seattle "Swift Quake," the MCG's 96,000-a-night shows, all four Wembley/masters/streaming/chart records that anchor TTPD's back half (Eight nights at Wembley, the $2B tour gross, the 7th AOTY nomination, the Hot 100 top-14 sweep, 7 more VMAs, the Eras Tour Book's print record), the Grammys-and-leaves-with-neither night, the Karlie Kloss road trip, the Times Square Harry Styles kiss, All Too Well's first solo piano performance, the first-ever Hot 100 No. 1, the Red Tour's country-touring record, reputation outselling the rest of the chart combined, the 23-AMA-wins record, the Rolling Stones attendance record, the LWYMMD YouTube record, the Katy Perry olive branch, breaking political silence on voter registration, the Fearless Tour's 30-second sellout opener, 11 weeks at No. 1, first woman to headline and sell out Gillette Stadium, CMA Entertainer of the Year at 19, hosting SNL, and the TLOAS-era cluster (the Grammy-eligibility miss by 34 days, the 4.002M debut week, the Luminate crown, the Songwriters Hall of Fame induction, the Vancouver finale stream, the NYT songwriters profile, and the 2025 Spotify record).

**Photo depth — the one deliberate change from Tier 2:** Joey asked explicitly for more photo investment on this pass than Tier 2 got ("especially pics"). Re-challenged every thin (1-photo) item with a fresh search rather than leaving Tier 2's lighter touch in place: added a second verified photo to the Swift Quake item (a fan-shot Lumen Field crowd photo via WWU News), added two verified Wikimedia Commons photos of the artists who beat Red at the 2014 Grammys to that item, and found a second, previously-unused Commons frame from the same June 5, 2010 show for the Gillette Stadium item (also fixed a photographer-credit typo — "Mealtedheadaches" → "Meltedheadaches" — introduced in an earlier pass on the same photographer's other Fearless Tour credits). Rejected one wrong-event photo outright (a Hollywood Reporter frame captioned "Billboard Woman of the Year 2011" that visual inspection showed was actually a different Billboard Music Awards event in Las Vegas). Every other thin item got a real, documented re-check — 2018 AMAs, the Toronto Eras Tour dates, Melbourne MCG, CMA 2009, the SNL monologue, the political-Instagram-post item — and stayed at 1–2 photos because Commons/press genuinely has no additional coverage of that exact moment (documented inline on each, same pattern as the 2026-07-18 photo-enrichment passes). Not every item needed the push: several (91, 96–98, etc.) already carried 2+ verified photos from earlier rounds.

**Delegation note:** ChatGPT/Codex remains exhausted (resets 2026-07-25); direct Claude research, same as every round since PR #865.

## 2026-07-19 — Tier 2 continuation: positions 51–70, all `'notable'`

**Decision:** Continues the top-100 career-events project (`docs/content-ops/top-100-career-events.md`) past PR #901's 41–50 batch into positions 51–70 — all 20 marked `significance: 'notable'`, none `'defining'`. Judged each against the doc's own caution ("some shouldn't be marked at all") rather than working the list mechanically; all 20 cleared a real "would a fan remember this" bar (chart/industry records, genuine cultural touchstones, or well-documented public firsts), so none were skipped, but none were force-fit to `'defining'` either — that tier stays reserved for Tier 0–1 (positions 1–40).

The 20: the All Too Well Grammy piano performance and its Short Film (both cross-linked to the already-`'defining'` 10-minute-version item), breaking political silence on voter registration, Artist of the Decade at the 2019 AMAs, the Nashville Songwriter-Artist of the Decade and BRITs Global Icon honors, the Eras Tour's Federal Reserve Beige Book mention, the TTPD 7th-AOTY-nomination record, the Eras Tour Book's print-sales record, the Joe Jonas 27-second-call breakup, the Harry Styles Times Square kiss, the Bad Blood video's Vevo record, the Apple Music open letter, the Spotify catalog pull, the Katy Perry olive branch, the Sun's original Joe Alwyn report (cross-linked to the already-`'defining'` breakup item — the relationship's bookends, not new private-life content), her first Vogue cover, the SNL hosting debut, the youngest-ever CMA Entertainer of the Year win, and Billboard's Woman of the Decade.

**Photo depth:** deliberately did NOT chase the 6+ photo floor here — that rule (set 2026-07-19, the entry above) was scoped to `'defining'` items specifically, where the feed's hero-card treatment demands real depth. `'notable'` items keep whatever real, verified photo count they already carry (mostly 1–2, same baseline as the rest of the unmarked corpus) rather than spending equivalent research effort on a lower-visibility tier.

**A caught mistake, for the record:** three `relatedIds` were hand-guessed instead of computed and came back truncated wrong (`...-longest-song-ev` instead of `...-longest-song-ever`; `...-billboard-music-awa` instead of `...-billboard-music-aw`) — caught immediately by `validate:content`'s dead-link check, not by inspection. Fixed by actually running the `slugify()` function against the real title rather than eyeballing a 60-character cutoff by memory.

**Delegation note:** ChatGPT/Codex remains exhausted (resets 2026-07-25); direct Claude research, same as every round since PR #865.

## 2026-07-19 — Resolving the theory-weaving conflict + bulking `'defining'` items to 6+ photos

**Decision:** Two follow-ups to rounds 1-3, both directed by Joey.

**1. Theory-weaving architecture.** `docs/content-ops/theory-weaving.md`
flagged an unresolved conflict: a proposed standard ("weave one sourced line
into a song's existing `moment.context`, no new schema") that contradicts
what's actually built — a dedicated `supabase/seed/theories/<era>.mjs`
table (`kind: theory | easter_egg`, required `confidence`/`outcome`,
`npm run db:seed:theories`, rendered via `theories.generated.ts`) already
seeded with 40 entries across 12 eras. Resolving it: **the seeded
`theories/<era>.mjs` system is authoritative** — it's the one actually
wired into the app. Where a `'defining'` content item's real-world event has
a genuine, already-documented match in that table, weave one sourced
summary sentence into the content item's own `moment.context` (satisfying
the original "the post itself explains it" intent) citing the same sources
already verified in the theory entry — the theory entry itself stays the
system of record, not duplicated wholesale.

The HARD BAN carried over unchanged and un-relaxed: no theory content about
relationships, private life, sexuality, family, or identity, ever, no
matter how well-documented. This excludes weaving theory content into any
of the wedding, engagement, Kelce-official, or Alwyn-breakup items — not a
gap, a guardrail.

Cross-referencing all 31 `'defining'` items (21 from rounds 1-2 + round 3's
10) against all 40 existing theory entries by topic, not by forcing a
match onto every item, found 7 genuine ones:

- Debut arrives → `liner-notes-hidden-messages` (the code tradition starts here)
- Speak Now arrives → `never-grow-up-liner-note-code`
- Fearless (Taylor's Version) first re-recorded #1 → `vault-track-anagram-reveal`
- The snake video that announced reputation → `snake-reclamation`
- reputation Stadium Tour opens → `snake-reclamation` (the Karyn-mascot payoff)
- TTPD's 2am secret-double-album reveal → `ttpd-spotify-library-eggs`
- The Life of a Showgirl arrives → `orange-era-clues`

The remaining ~24 are chart records, business/masters deals, or tour
grosses with no documented Easter-egg/theory attached — inventing one to
hit a count would be fabrication, not depth.

**2. Photo depth.** The original 10-defining-events plan aspired to 5-8
photos per item (matching the two original exemplars, msg-wedding and
showgirl-release-day, both 11+), but that bar wasn't actually enforced —
auditing all 31 found 15 items still at 1-2 photos. Joey's direction: all
`'defining'` items get more than 6 real, verified photos, no exceptions for
"already investigated, stays thin" — prior enrichment-pass comments citing
scarcity get re-challenged, not taken as final, since a harder second look
(different angle: press-kit stills, wire-service archives, official social
posts, not just Wikimedia Commons) usually finds more than an artificial
one-item photo ceiling assumed.

**Why now, not deferred further:** the founder review of round 3 (PR #865)
surfaced that "no artificial cap" (a standing rule since the original
10-defining-events plan) had drifted in practice into "no forcing," which
under-delivered relative to what defining-tier content is supposed to be.

**Delegation note:** ChatGPT/Codex remains exhausted (confirmed retested
this session, resets 2026-07-25) — this work is direct Claude research
again, same as round 3. A second, worktree-isolated Claude subagent is
running in parallel on the next 20 items (Tier 1 positions 32-40 + Tier 2
41-50 from `docs/content-ops/top-100-career-events.md`), following the same
6-photo floor and theory-matching discipline documented above.

## 2026-07-19 — Shoppable links: direct URLs in content, affiliate at one seam

**Decision:** Fashion moments can carry `moment.products` in the seed —
`[{ brand, item, retailer, url, price?, inStock? }]` — where `url` is always
the plain, direct retailer product-detail page and `retailer` is a bare
hostname. Monetization is structurally separated from content: the UI links
every product through ONE function, `buildShopUrl()` in
`apps/web/lib/longlive/shop.ts`, which today returns `url` unchanged. When
affiliate goes live (LTK/RewardStyle, Amazon Associates, Skimlinks), the
wrapping is injected inside that function, keyed by `retailer` — a
one-function code change with ZERO content re-authoring, because content
never stores affiliate URLs. `SHOP_DISCLOSURE` (the FTC line) lives next to
the seam, and shop links already ship `rel="nofollow sponsored noopener"`,
correct for both direct and paid links.

**Why:** Affiliate programs churn (deep-link formats, partner tags,
program membership), and hand-rewriting hundreds of seed URLs on every
change would be exactly the rework the cost-discipline rule bans. Storing
the neutral destination and wrapping at render keeps the vault static (no
per-user calls), keeps content PRs mergeable by non-coders, and makes the
affiliate flip reversible.

**Authoring rules (hard):** direct product-detail pages only — never a
search/category page, never a fabricated URL; verify each URL resolves
(HTTP 200) before committing; verified sold-out items get `inStock: false`
(rendered dimmed + labeled, kept for the fashion record).
`validate:content` enforces shape; the `content.product-gap` checker queues
fashion moments that name branded garments but carry no products.

**Alternatives considered:** (a) store affiliate URLs in content — rejected,
re-authoring on every program change + dead links if a program is dropped;
(b) per-retailer link components in the UI — rejected, spreads the seam
across components; (c) a redirect service (`/go/<id>`) — cleanest for
click-tracking but needs a runtime route + link registry; can be added
INSIDE `buildShopUrl()` later without content changes, so deferred.

**Approved by:** built to Wyatt's written directive (scheduled build task,
2026-07-19, which specified the schema, the buildShopUrl seam, the retailer
programs, and the pilot). Joey's product sign-off on the user-facing "Shop
the look" surface is PENDING — requested on the PR, which does not merge
without it. If Joey declines the surface, the data layer and seam keep
(they're invisible without the UI block); the MomentDetail block is the
only piece to revert.

## 2026-07-19 — The rumor tier: structural home for hot-but-thinly-sourced topics

**Decision:** Hot topics with little trustworthy sourcing (the MSG wedding is
the canonical case: no interior photos, no official statement, loud press
coverage) get a structural rumor treatment instead of either a thin page or
reported claims quietly reading as fact. Two data-model additions on the
content seed rows (`supabase/seed/content/**`), both piped through
`sync-longlive-content.mjs` into the static vault:

1. **Per-item `confidence`** — the existing 8 shared levels (mirrors
   `THEORY_CONFIDENCE`; no new enum values, so no shared-types or DB CHECK
   churn). The field existed on `ContentItem` but was never piped or
   rendered loudly; now anything below `CONFIRMED_TIER`
   (`official`/`confirmed_interview`) renders an unmissable banner in
   `MomentDetail` ("Reported — not confirmed" / "Rumor — unconfirmed" /
   "Debunked") naming the reporting outlet (the first `sources` entry —
   keep the reporting outlet first on sub-confirmed items). The qualifier
   travels to every surface: an "Unconfirmed" chip on the era-feed card and
   a `[reported — not confirmed]` marker in outbound share copy — the one
   surface no downstream banner can correct. Confirmed content is unchanged.
2. **`moment.rumors`** — attributed, dated press claims (`claim` +
   `reportedBy` + `reportedOn` + `status` + `url`, optional `note`) rendered
   in a visually distinct "What's rumored" section after the confirmed
   narrative (which gains a "What's confirmed" header). `status`
   (`unconfirmed`/`partially_confirmed`/`confirmed`/`debunked`) lets a
   resolved rumor stay on record honestly instead of being deleted.

Fail-closed everywhere: the generator drops an unattributed/undated rumor and
an unknown confidence; `validate:content` makes both hard errors (trim-aware,
real-calendar-date, both field placements) so a typo can't silently vanish
the label. Rumor claim/note prose feeds the content engine's corpus `texts`,
so redlines/claim-risk/agent review scan it like any other prose. A
deterministic `content.rumor-gap` checker (content engine, latest-news eras
only) flags high-visibility moments with <2 sources and no rumor treatment,
counting only entries the generator would actually ship. Pilot: the wedding
trio (`msg-wedding` rumors, `wedding-gown-dior-anderson` +
`watch-hill-bachelorette-weekend` banners). The 2026-07-04 hard ban carries
over verbatim into the rumors template: no sexuality/family/identity
speculation, ever — rumors are outlet-reported claims about public events.

**Why:** The theories system already keeps era-level speculation honest, but
it is era-scoped, carries the 2026-07-04 hard ban on private-life
speculation, and can't sit inside a moment's page — while the wedding-page
problem is exactly moment-scoped press claims. Reusing the shared confidence
vocabulary keeps one grading language across theories, tour shows, and
moments; a new "rumored" enum value was rejected because it would fork
`THEORY_CONFIDENCE` and require a DB CHECK migration for no expressive gain
(`reputable_reporting` + the banner IS "rumored" presentation). Rumor rules
stay strict editorial: attributed, dated, our words, estimates labeled,
nothing fabricated — rumors must never visually blend into confirmed facts.

**Alternatives considered:** era-level theory entries for wedding rumors
(wrong scope, banned subject matter); a standalone rumors dataset/surface
(new nav surface for little gain; rumors belong on the moment they orbit);
new enum values `rumored`/`speculation` (rejected above).

**DB note:** `confidence`/`rumors` are seed-file-only until a `month_item`/
`moment` migration — same standing follow-up as `slug`/`tags`/`threadIds`/
`significance` (the live site reads seed files first, 2026-07-17).

**Approved by:** pending — implemented on `feat/rumor-tier` for founder
review; the structural direction follows the standing "speculation never
renders as fact" rule (audit §5, 2026-07-04 brief).

---

## 2026-07-19 — Round 3: the next 10 career-defining events, plus a top-100 reference list

**Decision:** Before picking round 3, built `docs/content-ops/top-100-career-
events.md` — a ranked list of 100 real events already present in the seed
corpus, tiered (Tier 0: the 21 items already `'defining'` after rounds 1-2;
Tier 1: positions 22-40, `'defining'`-caliber; Tier 2: 41-70, `'notable'`-
caliber; Tier 3: 71-100, lower priority) so future rounds have a documented
queue instead of ad hoc picks, and so nobody mechanically works down the
whole list — the doc explicitly flags that doing so would dilute
`'defining'` until it stops meaning anything. Round 3 draws from Tier 1
positions 22-31:

1. The snake video that announced reputation (2017-08-21, `reputation.mjs`)
2. reputation Stadium Tour opens to a record crowd (2018-05-08,
   `reputation.mjs`)
3. She leaves Big Machine for Republic — and owns her masters going forward
   (2018-11-19, `reputation.mjs`)
4. folklore makes her the first woman to win Album of the Year three times
   (2021-03-14, `folklore.mjs`)
5. Red sells 1.2 million copies — the biggest week in a decade (2012-10-30,
   `red.mjs`; stands in for the era's arrival — no dedicated release-day
   item exists yet)
6. Lover: the first album she's ever owned (2019-08-23, `lover.mjs`)
7. Speak Now arrives, no co-writers allowed (2010-10-25, `speak-now.mjs`)
8. Time names her 2023 Person of the Year (2023-12-06, `midnights.mjs`)
9. Taylor and Joe Alwyn confirm their breakup after six years (2023-04-09,
   `midnights.mjs`)
10. All 12 tracks debut as the Hot 100's entire top 12 (2025-10-18,
    `the-life-of-a-showgirl.mjs`)

**Why these and not others:** each is either a historic chart/industry
record (3x AOTY, the Hot 100 top-12 sweep beating her own top-10 record), a
direct narrative hinge in the masters/label saga (leaving Big Machine for
Republic is the deal that made every album Lover-onward hers outright,
bracketed by the 2019 sale and the 2025 buyback already `'defining'`), the
visual/cultural launch of an era (the snake video), an album's own arrival
standing in where no dedicated release item exists (Red, Speak Now, Lover),
or a life event with direct downstream narrative consequences (the Alwyn
breakup precedes the Kelce era by five months). 5 of the 10 already had a
`MILESTONES` entry (Stadium Tour, folklore AOTY, Lover released, Speak Now
released, Hot 100 sweep); 4 new entries were added to close the rest
(`m-rep-0`, `m-rep-3`, `m-mid-2a`, `m-mid-3a`) — Red's item deliberately did
not get a new entry since `m-red-1` (Red released, 2012-10-22) already
marks the era's arrival on the scrubber, 8 days before the sales milestone
this item is keyed to.

Cross-linked to each other and to rounds 1-2's items via `relatedIds`,
including two reciprocal backlinks into pre-existing `'defining'` items from
earlier rounds: the Republic move → the masters buyback
(`tortured-poets.mjs`, round 2), and the folklore 3rd-AOTY win → the
Midnights 4th-AOTY win (round 2) is already bidirectional from that side.
`threadIds` opt-in used where it applies (`taylors-version` on the Republic
move and the Lover item; `the-proposal` already covered by the existing
Kelce-official/Alwyn-breakup link).

**Delegation note:** both parallel-work channels established in rounds 1-2
were exhausted going into round 3 — the Claude subagent pool hit its
monthly spend cap during round 2, and `ask-chatgpt.mjs`/`codex exec` (same
OpenAI account, separate billing) hit its own usage limit reviewing round
2's diff, not resetting until 2026-07-25. Round 3's mechanical fields
(`significance`, `relatedIds`, `threadIds`) were done directly rather than
delegated; photo-sourcing for round 3 follows the same direct-research path
once the mechanical baseline is verified and committed.

## 2026-07-18 — Standing grant: Marjorie merges held content-shift PRs herself

**Decision:** `needs-human-review` on a routine Content-desk PR (label
`content-shift`, seed/content files only) is advisory, not blocking.
Marjorie merges that class under her existing envelope — green required CI,
no changes-requested review, no founder hold, reversible by plain revert —
without a per-item founder ask. Post-merge audit (Karen's nightly scan +
Nils's walks) replaces the pre-merge human look; rollback duty unchanged.

**Why:** The label marks PRs whose authoring environment couldn't run Codex
review; founders were merging them unchanged as a formality (#769/#779/#782/
#790). Joey directed the change by email (2026-07-18 06:29 UTC) and, because
merge-authority grants can't vest by email, confirmed it natively the same
day: "Confirmed" on brief #822
(https://github.com/JW-Incorporated/swift2/issues/822#issuecomment-5011423323).

**Alternatives considered:** keep per-item founder merges (rejected —
founder bottleneck on a rubber-stamp class); drop the label (rejected — it
still records that pre-merge Codex review didn't run, which the audit desks
use).

**Approved by:** Joey (CEO) — founder-authored comment on brief #822.

## 2026-07-18 — MOBILE launch gate closed (founder device check)

**Decision:** The MOBILE gate (#634, founder-declared 2026-07-14) is 🟢:
Joey verified the new landing-page front door on his phone — "Checked on
mobile. Good to go." (#634, 2026-07-18 13:13 UTC). Second gate green after
SONGS; any regression reopens via a new ticket.

**Why recorded:** #634 was a founder-declared launch gate; its closure is
the go/no-go trail.

**Approved by:** Joey (CEO), on-device, on #634.

## 2026-07-19 — Round 2: the next 10 career-defining events

**Decision:** Follow-up to the first 10-event pass (same-day, separate PR
`content/ten-defining-events`, #849): Joey asked for the next 10 most
important events after that batch. Picked (again career-wide, keeping
`'defining'` rare):

1. Fearless (Taylor's Version) — first re-recorded album ever to hit #1
   (2021-04-18, `evermore.mjs`)
2. All Too Well (10 Minute Version) — longest song ever to hit #1
   (2021-11-22, `evermore.mjs`)
3. Midnights sweeps the entire Hot 100 top 10 (2022-11-05, `midnights.mjs`)
4. The Eras Tour presale breaks Ticketmaster, leads to a Senate hearing
   (2022-11-15, `midnights.mjs`)
5. A record 4th Album of the Year Grammy, for Midnights (2024-02-04,
   `midnights.mjs`)
6. Super Bowl LVIII appearance — the relationship's biggest mainstream
   crossover moment (2024-02-11, `midnights.mjs`)
7. TTPD's 2am reveal as a secret double album (2024-04-19,
   `tortured-poets.mjs`)
8. The Eras Tour's Vancouver finale — first tour ever to gross $2 billion
   (2024-12-08, `tortured-poets.mjs`)
9. The masters buyback — "All of the music I've ever made... now belongs...
   to me" (2025-05-30, `tortured-poets.mjs`)
10. The engagement announcement (2025-08-26, `the-life-of-a-showgirl.mjs`)

**Why these and not others:** each is a historic chart/industry record
(first re-recorded #1, longest #1 song, entire top 10, 4th AOTY, first
$2B tour), a genuine cultural/political flashpoint (the Ticketmaster
Senate hearing), a mainstream-crossover peak (Super Bowl LVIII), or a
direct narrative resolution of a round-1 event (the masters buyback closes
the Big Machine sale; the engagement is the direct precursor to the
wedding). 4 of the 10 already had a `MILESTONES` entry before this pass
(Hot 100 sweep, TTPD released, Eras Tour finale, engagement announced); 6
new entries were added to close the rest of the gap
(`m-ever-2`, `m-ever-3`, `m-mid-1c`, `m-mid-3b`, `m-mid-3c`, `m-ttpd-3`).

Cross-linked to each other and to round 1's items via `relatedIds` (e.g.
the masters buyback → the Big Machine sale and the first Taylor's Version
#1, closing that loop three items deep; the Super Bowl appearance → the
Kelce-official moment → the engagement → the wedding, the full relationship
arc across both rounds) and `threadIds` opt-ins (`taylors-version`,
`the-proposal`) matching round 1's pattern.

**Parallelization note:** since round 1 established the methodology
(mechanical fields done directly, photo-sourcing delegated to
`ask-chatgpt.mjs`, every candidate fact-checked with both curl and a real
browser `Image()` load before merging — see the 2026-07-18 entries below),
and this round's 10 items span 4 disjoint seed files with no shared lines,
the photo-sourcing step was split into 3 parallel background passes (one
per file group) instead of run serially, at Joey's request.

## 2026-07-18 — Content weighted by real-world significance, not incidental signals

**Decision:** Added `ContentItem.significance?: 'defining' | 'notable'`
(`apps/web/lib/longlive/types.ts`) as an explicit authoring judgment of how
major a real-world event was in Taylor's life. It now drives two things that
previously had no real-importance signal at all:

1. **Depth** — a `'defining'` item gets the same comprehensive-coverage
   exception `music` items already had (`docs/content-ops/editorial-voice-
   and-pipeline.md` § Length discipline), instead of the routine one-line
   cap.
2. **Feed prominence** — `lib/longlive/feed-tiers.ts`'s card-tier system
   (`hero`/`media`/`chip`/`text`) previously inferred "weight" only from
   incidental signals (a real photo, a video, body length) via a pacing
   algorithm designed to break visual monotony, not to reflect importance —
   a routine sighting with several photos could out-rank a defining event
   with fewer. `significance` is now authoritative where set: `'defining'`
   always renders full-bleed hero, bypassing the pacing throttle that
   otherwise spaces heroes out; `'notable'` gets a guaranteed floor tier.
   Items with no significance set (the vast majority) are governed by the
   existing heuristic, unchanged.

Also added a `MILESTONES` entry (`content.ts`) for the wedding
(2026-07-03), which was absent despite being exactly the kind of event that
list exists for — the era's milestone list had stopped at 2025-10-18.

**Schema:** `month_item.significance` column added
(`supabase/migrations/20260718150000_month_item_significance.sql`) for
parity, not yet wired into the sync script's Supabase read path — the live
site reads seed files first (2026-07-17 decision), so nothing consumes that
column today; a documented follow-up, not an oversight.

**Applied to real content this pass:** `msg-wedding` and `showgirl-release-
day` (`supabase/seed/content/the-life-of-a-showgirl.mjs`) are the first two
items marked `'defining'`. Reviewing the other 10 eras for their own
defining events (a breakup, an album release, a major life turn — every era
has a small number) is real content work, explicitly **not** done in this
pass — flagged as follow-up, not silently deferred.

**Why:** Joey and Wyatt discussed this directly (Slack, 2026-07-18) and
agreed importance should drive both depth and visual prominence — "Taylor's
wedding... should not only have 10x more content than any other post, it
should also be more visible when a user is scrolling." Investigated first
rather than building fresh: the codebase already had two independent,
partially-built mechanisms for exactly this (`CardTier`'s hero tier,
`MILESTONES`) that inferred importance incidentally instead of taking it as
input — extending both was more correct and far less code than a new system.

**Alternatives considered:** A numeric 1-10 importance scale (matching the
News/Current pipeline's `news_story.importance`, #468) — rejected for Vault
content specifically: that pipeline's scale feeds an algorithmic ranking
function, but Vault authoring is manual human judgment, and a coarse
two-value scale (plus "unset = routine") is easier to apply consistently
across ~350 items than calibrating a 1-10 judgment call per item, per
`depth-rubric.md`'s existing philosophy of small, discrete tiers over
continuous scores (see its own Wavetop/Active/Quiet rubric). Automating
`MILESTONES` sync from `significance: 'defining'` — deferred; both lists
are hand-curated today and keeping them in explicit sync is a small, real
authoring discipline, not yet worth the code to automate for two data points.

**Approved by:** Joey + Wyatt (Slack, 2026-07-18); implemented same-day per
Joey's direct instruction to build the architecture and apply it to real
content immediately, not just spec it.

---

## 2026-07-18 — News/Current pipeline (V2, #468): schema, cadence, cost cap — DRAFT, pending Wyatt

**Status: draft, built under Joey's explicit "go now, flag him after" direction
on #468** (ticket text: "V2... owner: Wyatt... never preempts V1"). Proceeding
on Joey's word, not silently overriding the ticket's own ownership note —
Wyatt's real review is still owed on the three items below, per the
architecture proposal's own §9 list of what needs his sign-off. Anything here
is one line to revert if he disagrees; nothing here touches the Vault's
runtime path.

**Decision (schema shape):** Adopt `docs/proposals/2026-07-07-news-pipeline-architecture.md`
§4 verbatim — `news_source`, `news_raw_item`, `news_story`, `news_story_source`,
`news_llm_usage`, all `news_`-prefixed, zero foreign keys in either direction
to Vault tables (`era`, `milestone`, `month_item`, `moment`, `track_note`), no
Vault query may join or read `news_*`. `news_story` / `news_story_source`
public-read RLS; `news_raw_item` / `news_source` / `news_llm_usage` service-role
only (pipeline internals, never exposed).

**Decision (cadence):** Hourly GitHub Actions cron, one-shot process (run a
full cycle, exit — no resident worker), `concurrency` group so cycles never
overlap. Matches the proposal's own recommendation (§6) and this session's
2026-07-18 cron-scheduling-contention fix (offset off `:00`/`:30`, the two
minutes already contended by this repo's two `*/30` workflows).

**Decision (cost cap + model vendor):** Model vendor is **OpenAI**, not the
proposal's original "Haiku-class" suggestion — a deliberate deviation, per
Joey's explicit 2026-07-18 instruction to leverage OpenAI tokens for this
build. Cost-cheap model tier (e.g. the `gpt-*-mini`/`nano` class current at
build time), hard daily cap of **100 LLM calls/day** across classify +
semantic-dedupe-assist + verify-flagging combined (durable counter in
`news_llm_usage`, in-process floor so the cap holds even if the DB is briefly
unreachable — Orbit's `claude_usage` pattern, renamed), **≤400 output
tokens/call**, one retry. Cap hit ⇒ deterministic `RuleBasedClassifier`
fallback and the semantic dedupe pass skips — **the pipeline is fully
functional with zero LLM calls**, degraded quality only. No LLM call ever in
a user-request path; all calls are inside the scheduled worker cycle.
**No `OPENAI_API_KEY` secret exists in this repo yet** (checked — neither an
OpenAI nor an Anthropic production API key is configured today) — that's a
founder TX item (new API key, likely new billing), not something built here.
Until it's added, the worker ships and runs **fully on the rule-based
fallback**; the LLM path is wired and ready, not gated behind a future code
change. Worst-case cost, once the key exists, is small multiples of Orbit's
own observed "order of $0.x/day" at a comparable call volume — Swift2's cap
is set *lower* than Orbit's ~200/day since this product is single-subject (no
multi-figure `channels` loop) and volume should track well under Orbit's.
Wyatt's call whether 100/day is the right starting number; it's a config
constant (`packages/shared/src/config.ts`), not a schema commitment — cheap
to retune.

**Why now, not "when scheduled" per the proposal's own §9:** Joey's direct
instruction, 2026-07-18 chat, after being told the ticket names this V2/
filler/Wyatt-owned and V1 is at 1/12 gates green — he chose "go now" over
looping Wyatt in first or waiting. Recorded here so the reasoning isn't lost,
not to relitigate his call.

**Alternatives considered:** Waiting for Wyatt's explicit pre-approval before
any schema/worker code (rejected by Joey's direct instruction — see above).
A lower/higher starting cap than 100/day (100 chosen as a round number
comfortably under Orbit's proven-safe ~200/day, adjustable by Wyatt).
Sub-hourly cadence (rejected per the proposal: cron floor considerations and
no evidence hourly is too slow for this content's news cycle; revisit with
real usage data if it turns out to be).

**Approved by:** Joey (product direction + explicit "go now" instruction,
2026-07-18 chat). **Wyatt's technical sign-off on the three decisions above
is still owed**, per the proposal's own §9 ("Wyatt: approve the `news_`
table shape + no-cross-world-FK rule... cadence... cap numbers/model") — this
entry is the artifact for that review, not a claim it already happened.

## 2026-07-17 — LongLive build sync reads repo seeds, not the Supabase DB

**Decision:** The four LongLive `prebuild` sync generators
(`scripts/sync-longlive-{content,tracks,theories,videos}.mjs`) read the
**repo's `supabase/seed/**` files** as their source of truth. The live-DB
read still exists but is opt-in only (`LONGLIVE_SYNC_SOURCE=db`, seeds as
fallback). The DB seeding commands (`db:seed:*`) remain the way to populate
Supabase for its own consumers (the Tier-0 API path, the future mobile app) —
but the shipped website no longer depends on them.

**Why:** The 2026-07-08 DB-first order failed in production: content PRs
merge seed-file changes, but nothing re-seeded the DB, so every deploy baked
in stale rows — the live site showed month-only dates for weeks after
day-precision fixes landed in the repo (#723, found investigating #682).
Seed files are what reviews approve and what `main` records; building from
them makes "merged = live on next deploy" true by construction, needs no
credentials in the build, and removes an entire class of silent drift.
Alternatives considered: a CI job that re-seeds on merge (rejected: needs a
production write secret in Actions plus deploy-ordering guarantees — the
seed job racing Vercel's build); a build-time staleness warning (rejected:
still relies on a human noticing and acting).

**Approved by:** Joey directed the fix and delegated the mechanism choice
(in-session, 2026-07-17: "make the call... pick the best thing and go").
Flagged for Wyatt's ratification as it reverses a documented architecture
choice; revert is one line per script if he disagrees.

## 2026-07-16 — Founders' main interface: a shared Slack channel

**Decision (Joey, on #673; shape asked for by Wyatt 2026-07-15):** Option A —
**Slack.** One shared channel where both founders talk to the org's agents
and all org traffic lands: Anthropic's first-party "Claude in Slack" app
(@-mention Claude in the channel) plus GitHub's Slack app subscribed to
`JW-Incorporated/swift2` (briefs, PRs, watchdog alerts). Wyatt creates the
channel and installs both apps — agents never create accounts. The email
mailer stays as delivery backup: once the channel is live this supersedes
the 2026-07-11 "briefs by email" decision as the founders' *primary*
interface. #479 (Twilio/SMS wait) is unchanged.

**Why:** Wyatt's ask was a group chat with both founders and the bots.
WhatsApp's official API can't put bots in group chats, so the shape only
exists on platforms with native group-bot support; Slack delivers it with
~30 minutes of founder setup, zero custom build, and $0 at 2-seat scale.

**Alternatives considered:** Telegram group + custom bridge (needs a build
slot that belongs to launch gates); WhatsApp via Twilio (1:1 threads only —
fails the group shape); status quo email + GitHub (remains the fallback
until Slack is live).

**Approved by:** Joey (comment on #673, 2026-07-16 13:22 UTC: "We're going
with slack. Prep everything"); Wyatt (original ask, 2026-07-15 session).

## 2026-07-16 — Founders talk to Marjorie by replying to her emails

**Decision (Joey):** Replying to a brief/delta email is now a real channel
to Marjorie. A deterministic Action (`marjorie-inbox.yml`) reads her Gmail
inbox every 30 minutes, verifies the reply comes from a founder address
with a passing DKIM signature, and relays it onto the brief issue as a
`📧 Reply from <founder>` comment; Marjorie answers at her next run and
her reply reaches the founder via the next mailed brief/delta.

**Authority boundary (the important part):** relayed email is
**conversation-grade, never decision-grade.** Decisions still trace only
to founder-authored GitHub artifacts (checkbox edits, native comments) —
email is spoofable in ways a GitHub login is not, so the high-blast-radius
set (spending, merge/deploy grants, charters, security) can never be
granted by email; Marjorie restates any emailed decision as a bank item
for native confirmation.

**Why:** Joey asked to talk to Marjorie directly; email reply is the
lowest-friction interface he already lives in. Zero AI in the relay; ~30
runs/day of seconds-long Actions time.

**Alternatives considered:** a live chat with Marjorie (rejected for now —
she is a twice-daily scheduled runner, not a resident service; a chat
implies a paid always-on session); founders commenting on GitHub (still
works, still the only decision-grade path).

**Approved by:** Joey (in-session, 2026-07-16).

## 2026-07-15 — Era Secrets: every era entry teaches the fan something new

**Decision (Joey, product call):** Integrate the "Era Secrets" concept —
full research + design in `docs/proposals/2026-07-15-era-secrets.md` —
into the site. Core thesis, Joey verbatim: *"if a fan can learn something
they didn't know, they will ascribe value to the website."* Approved
scope, content-first sequencing: (1) author per-era secrets pools +
liner-note-code eggs into the existing content waves; (2) the **Era
Secret card** — one sourced, obscure, daily-rotating fact as the first
thing inside every era; (3) the **Track Five pill** — the artist-confirmed
track-5 tradition as a badge + cross-era rail in every Track Guide; (4)
later: "How every era ends" thread and secrets-found progress counter.
No runtime LLM anywhere — secrets are seed data on a deterministic daily
rotation (runtime-cost rule upheld).

**Why:** The Track 5 insight generalizes: the catalog is full of
artist-confirmed, fandom-documented patterns (track-13 grandparent
tributes, liner-note codes and the 1989 inversion, the healing-closer
arc, "seven" at seven) that even engaged fans haven't all seen. Surfacing
one at era entry is the cheapest possible proof of the site's depth at
the exact moment a visitor forms their value judgment.

**Alternatives considered:** Quiz/gamification-first (deferred — progress
counter is phase 2); random-per-pageload rotation (rejected — daily
deterministic feels curated and costs nothing).

**Approved by:** Joey (in-session, 2026-07-15: "log them as decisions from
me to integrate into the site"); Marjorie owns run order + routing.

## 2026-07-15 — The "Choose an era" screen becomes the landing page

**Decision (Joey, product call):** The site's first screen is the era
chooser — the existing EraSelector grid design ("Choose an era · Twelve
chapters, newest first"), promoted from a pop-up overlay to a **real
landing page**: the **Long Live** wordmark at the top, the **Eras / Threads
toggle** prominent up there with it, then the era grid. Tapping an era (or
Threads) steps inside the experience as today.

**Why:** New visitors currently land mid-experience and don't know what the
site is — the era/threads switcher is invisible to them (#634, the MOBILE
launch gate). The chooser grid communicates the entire concept in one
glance: twelve eras, pick where to start. It solves first-visit
comprehension *inside* the product, without an explanatory landing page —
which Joey considers against the ethos of good web design and holds only as
the fallback if this doesn't work.

**Alternatives considered:** (a) two-row top nav with the eras/threads
toggle as a full-width second row — Joey's earlier idea, superseded by this
same-day; (b) an explanatory marketing landing page — rejected unless the
chooser-as-landing fails with real users.

**Implementation notes (not part of the decision):** needs real thinking on
returning-visitor behavior (skip straight to their era? show chooser with
"HERE" state?), back-gesture semantics from the chooser, and it naturally
advances SEO/discoverability (#653) by giving the site a real front door.
Tracked in the implementation ticket; this unblocks the MOBILE gate's
design-intent ask (#634).

**Approved by:** Joey (explicit in-session directive, 2026-07-15: "call it
a decision and ask the team to implement it").

## 2026-07-15 — Autonomy expansion: content merges + work self-assignment

**Decision:** Two founder bottlenecks are removed from the daily pipeline:

1. **Content PRs are inside Marjorie's merge envelope.** A PR from the
   Content desk (label `content-shift`, touching only seed/content files per
   that desk's fence) may be merged by Marjorie when the standard envelope
   conditions hold: green required CI, no changes-requested review, no
   founder hold. "Brand voice / public-facing copy" no longer blankets
   routine content work — Karen's nightly integrity scan and Nils's daily
   walks audit content AFTER it ships, and a content merge is a plain
   `git revert` away from undone.
2. **Work is self-assigned.** Marjorie (with Kevin's triage) routes open
   launch-gate and build work directly into desk queues, ranked by cost of
   delay, without waiting for a founder-granted "build slot." A routed item
   counts as greenlit for the receiving desk's queue check. Founders steer
   by veto/comment and by the brief, not by per-item assignment.

**What still requires a founder:** product design intent (what should it
look like / do for users), legal/policy, pricing, spending, auth/secrets/
security, charter changes, and anything a founder has explicitly held. The
decision bank continues to exist for exactly these.

**Why:** The 2026-07-15 pipeline diagnosis showed the org healthy but
stalled at founder gates: finished content PRs sat unmerged for days, four
launch gates went five consecutive briefs waiting for a founder-assigned
build slot, and the founder-facing email channel was down (typo'd
MARJORIE_EMAIL variable, fixed same day) — so the asks never even reached
an inbox. Joey's directive: the system merges content and assigns its own
work; founders monitor via the now-working briefs.

**Alternatives considered:** Keeping founder merges with better nudging —
rejected by Joey: the bottleneck itself was the problem, not its
visibility.

**Approved by:** Joey (explicit in-session directive, 2026-07-15: "I want
the system to merge content and self-assign work without me. We already
approve.")

## 2026-07-12 — Product name and domain: Long Live / longlivets.com

**Decision:** The product's public name is **Long Live**. The website
domain will be **longlivets.com** — Joey is purchasing it now; Wyatt will
get it wired up (DNS/hosting) soon after. This resolves the "name TBD"
placeholder in `CLAUDE.md` and unblocks social-account naming (#518) and
any other naming-dependent work.

**Why:** Joey's call — the shipped reader was already internally called
"Long Live," and this makes it the actual public/company brand rather than
just a feature name.

**Alternatives considered:** None recorded; a direct founder decision, not
a debated option set.

**Approved by:** Joey.

## 2026-07-12 — Absorbed improvements from Joey's external AI review (charters amended)

**Decision:** From the ChatGPT/Gemini assessments Joey commissioned, absorb
four improvements (rejecting prompt-over-charter authority, precondition
skipping, and unbounded in-session loops): (1) reporting-is-not-progress +
idle-reason discipline (a briefs-only day is a failed org day); (2)
empty-queue fallbacks — no desk idles while gates are red (Austin falls back
to launch-gate work; Content Shift flags supply gaps); (3) claim-lease
expiry (24h) + reviews bounded at two rounds with Marjorie as tiebreak for
reversible matters; (4) the completion model — a per-surface coverage
matrix in docs/launch-readiness.md judged against the DEPLOYED site (Nils
now walks the live prod URL; three consecutive clean passes close a
surface), plus a zero-AI daily prod smoke check in the watchdog, and Karen's
nightly wired as a registered runner. Merge/deploy autonomy stays on the
already-approved ladder behind #488 (inertness) + #496 (branch protection),
now prioritized to the top of Wyatt's queue.

**Why:** the external reviews' valid core — close the loop through
merge→deploy→verify, and never let coordination substitute for progress —
without adopting their mechanism (pasted prompts overriding charters), which
is the authority-laundering pattern the provenance design exists to resist.

**Approved by:** Joey (in session, 2026-07-12 — 'Go. Merge it too').

## 2026-07-11 — Build desk autonomous lane (Austin) — approved in direction, activation gated

**Decision:** The Build desk gains an autonomous lane: **Austin**
(`docs/agents/austin.md`), a chartered agent that implements eng tickets
Kevin's triage labels tractable — and only those that also pass the
reversibility criterion (entry below), a semantic change-type allowlist
(no migrations/deps/workflows/API-routes/governance-docs; tests never
weakened), diff bounds (≤5 files/≤150 lines), and founder-or-desk
authorship. Rails: atomic claim (assignment + revalidation), stop triggers
instead of invention, regression test per bug fix, mandatory Codex review
with **no self-rebuttal**, human merge of every PR (v1), 2-attempt ledger,
2 starts/day, WIP limit of 3 open PRs blocking new claims. Autonomy expands
only class-by-class by founder grant (the §5.4 gate) — Austin never merges,
same as every agent. Kevin's charter records the handoff; his
never-auto-code invariant is unchanged (his triage is intake, the founder's
merge click is authorization).

**Why:** #470 — a fully-specified two-line fix — sat unbuilt for hours
because executing the queued tractable backlog was no one's job (gap
analysis: `docs/reviews/2026-07-11-operating-model-gap-analysis.md`, G1).
Design + Codex round: `docs/proposals/2026-07-11-build-desk-autonomous-lane.md`.

**Alternatives considered:** let Kevin auto-code Stream 3 (rejected — his
charter's unattended-loop concern is sound, and mixing triage with
execution removes a check); humans-only forever (rejected — the gap is
structural, not a discipline lapse).

**Approved by:** Joey (direction + commissioning, 2026-07-11).
**Activation gated on:** brief ticks for activate/name/caps **plus two
preconditions from the gap analysis — G3 branch protection enabled and G10
kill switch documented.** Austin runs nothing until those land.

**Activated same day (Joey, #494):** bundle approved; G10 done; **G3 turned
out to be paywalled** (GitHub requires Pro/Team for protection on private
repos — the gap analysis wrongly called it a free toggle). Joey chose
**option C — waive G3 for now — with option A (upgrade the org to GitHub
Team, then enable the ruleset) explicitly wanted later**; the upgrade is
banked as a TX item. Until it lands, "never push main" remains
charter-enforced rather than mechanical — a known, founder-accepted gap.

## 2026-07-11 — Marjorie's T2 gate redefined: reversibility is the criterion

**Decision:** Going forward, if a decision is reversible within a reasonable
window, Marjorie (or the relevant desk) decides it unilaterally and reports
it — founders reverse it after the fact if they disagree. Brief user-visible
exposure before a founder catches and reverses something does **not**
disqualify it as reversible. This is a new, independent route into T1 for
decisions outside the non-ratchetable set (`docs/proposals/2026-07-11-agentic-operating-model.md`
§5.3: product direction/scope, brand voice/public posting, legal/policy,
pricing, spending, merge/deploy authority, charter changes) — that set
remains a hard floor, gated regardless of whether a specific instance seems
reversible, unaffected by this decision.

**Why:** #477 (choice of analytics vendor) got banked as a T2 founder
decision even though switching vendors later is cheap and easy — the
ticket's own text said so. The prior T2 definition mixed named categories
(spec approvals, product direction, policy changes) with "anything expensive
to reverse," so a genuinely-reversible instance still consumed founder
attention because of its category. Joey's directive: define risk by
reversibility, not category — "who cares if a few users see it? The
founders will catch it and reverse it with reasonable timing, and therefore
reasonable damage control."

**Alternatives considered:** Keep the ratchet as the only path to T1
(rejected — requires two identical founder answers before Marjorie can act,
which is slower than a founder just stating the general rule directly, as
happened here). Redefine T2 by category only, tuning which categories
qualify (rejected — reversibility is the actual test Joey stated; recasting
it as category-tuning would drift from what was actually decided).

**Not yet resolved — explicitly not decided either way:** whether this
applies retroactively to items already in the decision bank or already
answered. Joey: "I think I should apply retroactively but I don't know if I
fully understand the implications." Tracked on issue #482; not implemented
until resolved.

**Approved by:** Joey (founder), issue #482, 2026-07-11.

## 2026-07-11 — Agentic operating model v2 (desks, chief of staff, Founders' Brief)

**Decision:** Adopt the desk model: chartered, sandboxed agents
(`docs/agents/`) with artifact-only interfaces; a chief-of-staff agent
(**Marjorie**) that curates a decision bank (`founder-decision` label +
required template) into a **6:00 AM Founders' Brief + 8:00 PM changes-only
delta**; tiered interrupt authority (T0–T3 + TX) with a founder-approved-only
autonomy ratchet and a non-ratchetable strategic set; a non-LLM GitHub-Action
watchdog watching Marjorie; decision provenance only from founder-authored
artifacts. **Merge authority granted by both founders:** autonomous merging
is the standing goal, earned class-by-class behind a deterministic merge gate
(never an LLM), starting with content-fix PRs once a content-inertness check
exists in CI; deploys stay human. **T3 paging:** SMS primary once the
provider account exists (TX item), email until then and as backup. **Growth &
Community desk starts pre-launch** (launch campaign plan, listening baseline,
account-creation lead time); the /marketing command is retired for a standing
marketing agent. **Marjorie also wears the manager hat** (Joey, same day):
deterministic team telemetry (tokens/outcome, no-op run ratio, findings-per-
PR by agent, cycle time, rework, escaped defects) + monthly mini-retros and
end-of-project retros proposing team changes as banked decisions — quality
up, tokens down, every cycle, because this team builds the next app too.

**Why:** founder attention is the scarcest resource; today every agent
interrupts ad hoc and nobody owns the queue. Full design + two-round Codex
debate record: `docs/proposals/2026-07-11-agentic-operating-model.md`
(PR #472); launch-ops work tracked as roadmap L-track.

**Alternatives considered:** pure deterministic digest with no chief-of-staff
(largely adopted as Marjorie's v1 scope and the degraded mode); many always-on
role agents (rejected 2026-07-02, ceremony at 2-person scale); wait for V2
engine (rejected — interrupt tax and intake gap are today-problems).

**Approved by:** Joey (product) + Wyatt (CTO), 2026-07-11 — Wyatt's sign-off
relayed by Joey in session; PRs #472/#463 merged by founders same day.
CLAUDE.md's merge rule is amended only when the gate + CI preconditions ship.

## 2026-07-11 — Clarification: "V1 is Vault-only" defers the automated engine, not recent content

**Decision:** The 2026-07-03 "V1 scope is Vault only" decision (below) means
the **automated** ingestion/clustering/ranking/notification engine (the
News/Current pipeline in `docs/proposals/2026-07-07-news-pipeline-architecture.md`)
is deferred to V2 — not that the Vault excludes recent events. The Vault's
scope has always been "anything that has already happened," and recency
doesn't disqualify content: an event from last week is exactly as valid a
Vault item as an event from 2008, as long as it's sourced and authored
through the normal Vault pipeline (Karen, the editorial voice standard, the
sourcing bar) like everything else.

Until V2's automated engine ships, recent content is added **manually** —
Joey brings in subject matter (real, already-happened events) as they occur,
which gets distilled into short, sourced Vault moments the same way any
other era content is authored. This is expected to be a daily habit, not an
edge case.

**Why:** This ambiguity caused a real mistake (2026-07-11): three
manually-curated, already-happened news subjects were initially treated as
conflicting with "V1 is Vault-only," when the actual scope boundary is
specifically about the *automated engine*, not about content recency. See
`JW-Incorporated/swift2` issue #464 for the incident this clarifies.

**Approved by:** Joey

---

## 2026-07-11 — Persona author copy desk

**Decision:** Adopt four named persona authors (charters in
`docs/content-ops/personas/`) layered on the #449 house voice — Theo (music/
releases/dossiers), Loren (theories/eggs), Vera (fashion/sightings), Deb
(relationships/business/tour); names are Joey's to rename before bylines
ship. Category→author routing lives in `scripts/copy-desk/routing.mjs` with
explicit per-item seed overrides; authorship is **derived at sync time, never
stored in the DB** (persona slugs permanent, display names mutable); on-site
bylines + a meet-the-desk page with honest editorial-characters framing,
gated on Joey approving the disclosure wording. Karen gains per-persona voice
checks (deterministic checks gate; agent judgment advisory only), calibrated
against committed golden fixtures per charter.

**Why:** One anonymous voice reads like an aggregator (#462); personas make
authorship legible and voice maintainable, and deriving (not storing) the
author keeps renames/beat changes a one-file edit. Retro pass is cheap by
design: bylines come free from sync derivation; only voice-check failures get
rewritten.

**Alternatives considered:** replace the single #449 voice standard entirely
(rejected — personas are a dial within house rules, so #461 proceeds
unchanged); store `author` as a CHECK-constrained DB column (rejected in
Codex review — duplicates derived data, makes renames a migration).

**Ref:** `docs/specs/2026-07-11-persona-authors-copy-desk.md` (PR #463),
issue #462.

**Approved by:** Joey (product) + Wyatt (CTO), 2026-07-11 — Wyatt's sign-off
relayed by Joey in session.

## 2026-07-10 — Track dossier data model: grouped fields on TrackNote, one jsonb dossier column

**Decision:** The Track Guide overhaul (issue #440) extends `TrackNote` with
two grouped optional objects instead of ~20 flat fields: `facts`
(writers/producers/release/single status/themes — data the seed files already
authored but the seed runner's INSERT list dropped) and `dossier`
(why-it-matters, tiered meaning, explained connections, live highlights,
collaborator voices, required sources). DB-side, the facts get real columns
(queryable scalars) and the dossier is ONE `jsonb` column validated by the
sync generator, not a column per section. Cross-song linking uses a new
`song:<slug>` RelatedId namespace on the existing `RelatedId` convention —
not a parallel linking system — which requires track slugs to stay globally
unique (asserted in tests). Meaning tiers reuse the existing
confidence-pill visual language (accent = confirmed, solid = supported,
dashed = fan theory), not a new one.

**Why:** grouped fields keep `tracks.generated.ts` diffable and let the UI
render whole sections from one prop; a single validated jsonb column avoids
a migration per future dossier section while the shape is still evolving
(Phases 2–3 of #440 will add more); reusing `RelatedId` was an explicit
acceptance criterion on the ticket.

**Alternatives considered:** one flat interface with ~20 optional fields
(rejected by Joey on the ticket — "Grouped fields"); a full page instead of
the overlay (rejected — "Overlay"); extending the Clue Web motif system now
(deferred — blocked on #445's rebuild landing first, per Kevin's plan).

**Approved by:** Joey (product) on issue #440, 2026-07-10.

## 2026-07-10 — Threads content derives from tagged content items, not hand-authored arrays

**Decision:** The six Threads (`love-story`, `fashion`, `taylors-version`,
`easter-eggs`, `hidden-clues`, `the-proposal`) currently render from
hand-authored TypeScript arrays in `apps/web/lib/longlive/lenses.ts`
(`RELATIONSHIPS`, `RUNWAY_LOOKS`, `RERECORDS`, `PROPOSAL_BEATS`, `CLUE_PAIRS`,
`EGG_NODES`/`EGG_LINKS`), completely disconnected from
`supabase/seed/content/**` — the pipeline every Era moment flows through.
Going forward, thread membership is derived from **tags on content items**
(new items in `supabase/seed/content/**` get one or more thread tags at
authoring time) rather than a second, hand-maintained data source. A thread's
rendered list should be a query/selector over tagged content, not a separate
array that has to be remembered and kept in sync by hand.

**Rollout is two phases, not one landing:** phase 1 (2026-07-10, this PR) is
the derivation mechanism itself — `ContentItem.threadIds`, the
`contentForThread()` selector, real tagged data via the existing
Relationship/Fashion category defaults. **`ThreadsMode.tsx` still renders
from the old `lenses.ts` arrays as of this PR — the mechanism exists but
nothing consumes it yet.** Phase 2, done per-thread as each thread's UI
rework lands (tracked in `docs/threads-rework-2026-07-10.md`), is wiring the
actual rendered UI to `contentForThread()` and retiring the corresponding
old array. Don't read this decision as "Threads already render from tagged
content" until phase 2 closes per thread.

**Why:** Joey flagged that new content isn't naturally flowing into Threads —
e.g. real relationship/sighting content added to an era file has no path
into the Love Story thread unless someone remembers to also hand-edit
`lenses.ts`. That's a structural drift risk, not a one-off oversight: the
two data sources will keep diverging as content authoring continues weekly
(see `docs/roadmap.md` J7). Auto-deriving from tags means new tagged content
appears in the right thread automatically, the same guarantee Era moments
already have.

**What this does NOT change:** thread-specific narrative structure that
doesn't map to a single content item — e.g. Love Story's single/solo periods
between relationships, or the Clue Web's motif-trail groupings and node-link
graph — still needs dedicated schema beyond a tag on one item. Those get
first-class fields/tables of their own (not another parallel hand-authored
array); the tag-derivation decision applies to "which content items surface
in which thread," not to every piece of thread-specific presentation data.

**Alternatives considered:** (1) keep `lenses.ts` hand-authored, add a
process rule + CI lint flagging likely-missed cases — rejected as treating
the symptom, not the drift; (2) hybrid — ship the current thread reworks
against today's `lenses.ts` shape, migrate after launch — rejected because
every thread rework happening now is the natural point to build the tagged
shape once instead of building on the old shape and migrating twice.

**Approved by:** Joey (product), 2026-07-10.

## 2026-07-10 — Love Story thread uses real names, not the earlier non-identifying convention

**Decision:** `RELATIONSHIPS` in `lenses.ts` previously used deliberately
non-identifying labels ("The Debut Sweetheart," "The Fearless Actor") per a
naming convention set in an earlier session. The Love Story thread rework
switches to real names (Joe Jonas, Taylor Lautner, John Mayer, Jake
Gyllenhaal, Conor Kennedy, Harry Styles, Calvin Harris, Tom Hiddleston, Joe
Alwyn, Travis Kelce).

**Why:** The thread's entire premise — both the original product brief
("who each era was written about") and the v0 design built against it — is
answering "who was she with, when." A relationship thread that hides who
defeats its own purpose. All of these are widely-reported public
relationships between public figures (nothing private or contested), and
this app's photo/media policy (2026-07-09 entries above) already accepted a
more permissive posture than the caution the non-identifying convention
implied.

**Alternatives considered:** Keep non-identifying labels — rejected, makes
the shipped feature confusing/useless relative to what was actually asked
for and designed.

**Approved by:** Claude, acting on the explicit product brief for this
thread rework — flagging here rather than treating silently, since it
reverses a previously deliberate convention. Low-risk/easily reversible
(display strings, not data-model or infra), so implementing directly rather
than blocking on a synchronous approval; revert is a one-line diff if this
call is wrong.

## 2026-07-09 — Superseded same-day: full lyrics reproduction rejected in favor of per-song analysis + short quotes

**Decision:** The entry directly below this one ("Full song lyrics may be
reproduced on-site") is superseded after further discussion, the same day it
was written. We will NOT reproduce complete song lyrics anywhere in the app.

Instead, every song gets its own page (`TrackDetail`, reached from the Track
Guide) with real, researched discussion — why she wrote it, what it's about,
its place in the album/era — grounded with a FEW short illustrative quoted
lines, the way music journalism quotes a couplet. This is exactly the
existing "original words + links, never paste verbatim" rule already applied
everywhere else in the app; there was never a real reason to treat songs
differently.

**Why the reversal:** a licensing/API tangent (Musixmatch, Genius) was
explored and dropped — Joey correctly pointed out that's solving the wrong
problem. The actual work is research and writing (what the song means, why
it was written), same as every other content pass in this app, not a data
source to license.

**Implementation note (2026-07-09):** it turned out every seeded track
already carries real, sourced `summary`/`inspiration`/`easterEggs` fields
(written during an earlier content pass) that were never surfaced in the UI
at all — another instance of this app's recurring "plumbing, not writing"
gap. The `TrackDetail` page's discussion is auto-derived from those fields
where no hand-written `discussion` override exists, so all ~244 songs got
real per-song pages with zero new content-writing required for this pass.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Full song lyrics may be reproduced on-site (SUPERSEDED, see entry above)

**Decision:** Reproducing complete song lyrics (not just short quoted lines)
is allowed in the track guide / song-meaning sections, at the same risk
tolerance as the photo-rehosting decision below: a knowing acceptance of
copyright-infringement exposure rather than an oversight.

**The actual risk being accepted, stated plainly:** song lyrics are
copyrighted works; the NMPA and Genius have both pursued infringement claims
over unlicensed lyric reproduction, historically more aggressively than
photo agencies pursue paparazzi-photo rehosting. This is a **larger** legal
exposure than the photo decision, not an equivalent one, even though the
same "knowing acceptance" framing applies.

**What this does NOT change:** the no-fabrication rule; text elsewhere (event
summaries, moment bodies) still must be original words + links, never pasted
verbatim, per the 2026-07-08 media policy below.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Deuxmoi may be cited as a source, always explicitly labeled

**Decision:** Deuxmoi (an anonymous gossip/blind-item Instagram account that
publishes unverified reader-submitted tips, not a reported news outlet with
editorial standards) may be used as a source. It must always be labeled
transparently as "Source: Deuxmoi" — never disguised as or blended with
reputable-press citations — so users can see for themselves that a claim
traces back to an anonymous tip account rather than confirmed reporting.

**Why:** Some real information about Taylor Swift genuinely does surface
first through Deuxmoi before (or instead of) verified press pickup.
Transparency about the source, not exclusion of it, is the honesty
mechanism — consistent with the existing confidence-label system
(`official` / `confirmed_interview` / `reputable_reporting` / etc. in
`apps/web/lib/longlive/types.ts`); a Deuxmoi-sourced claim should carry a
low confidence label (`plausible` or below), never `confirmed` or `official`.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-09 — Hosting/rehosting real internet photos IS allowed — no rules against it

**Decision:** There is **no rule against hosting photos.** Any real photo may
appear on-site by **any** means — embedded via oEmbed, hotlinked, or
**copied/rehosted to our own CDN** — with a credit line where available. Every
prior ban or restriction on rehosting is **deleted**, including the one that
had stood in the "Media & content sourcing policy" entry below (dated
2026-07-08, which had called an earlier same-day reversal an "over-correction").
That ban text has been removed from that entry too, so the log no longer
contradicts itself. Confirmed directly by Joey and Wyatt.

**Why this needed resolving explicitly:** the two entries directly
contradicted each other, and — independent of which one was "supposed" to be
current — Wyatt's content team had already shipped multiple merged PRs
rehosting real photos under what their own commit messages called "the
relaxed image policy" (e.g. `content/showgirl-marquee-photos`,
`content/red-photos`). Docs and shipped code disagreed; per CLAUDE.md's
"disagreements surface, not settle" rule, this was raised to Joey rather than
silently picked.

**What stands, unchanged from the 2026-07-08 entry below:** the no-fabrication
rule, the reference/comparable-image honesty-labeling requirement (never
present a stand-in as the real photo), and the monetization IP-counsel gate.
oEmbed is still the *preferred* path for social-post embeds (no hosting cost),
but is no longer the only way images may appear on-site.

**Approved by:** Joey (product), 2026-07-09.

## 2026-07-08 — LongLive content synced from Supabase at build time, not runtime (SUPERSEDED 2026-07-17: build reads repo seeds; DB read is opt-in)

**Decision:** `apps/web/lib/longlive/content-vault.generated.ts` (the
generated half of the LongLive UI's content layer) is now produced by
`scripts/sync-longlive-content.mjs` running as a Next.js `prebuild` step.
That script tries the **live Supabase `month_item` table first** (same
public/RLS-read `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` env as the dormant
`VaultReader` path) and **falls back to the local `supabase/seed/content/**`
seed files** when Supabase isn't configured or the fetch fails (local dev
without secrets, CI, or before the DB is seeded).

**Why:** Earlier today the generated file was produced by a manual,
human-remembered script run against local seed files only — content changes
required someone to re-run it and commit the output, with no connection to
the actual Supabase database the seed files are meant to populate. This
closes that gap: seed the DB (`npm run db:seed:content`) → redeploy → the
build reads fresh data automatically. It stays a **build-time** read, not a
live per-request one — consistent with `CLAUDE.md`'s cost-discipline rule
("keep the Vault static, no per-user DB calls in the request path") and
`docs/architecture.md`'s Tier-0-static design. The fallback keeps local dev
and CI working without provisioning secrets everywhere.

**Alternatives considered:** wire live client-side/server-component Supabase
reads into the LongLive UI directly (rejected for now — a much larger,
riskier refactor across ~15 components that currently import static data
synchronously; also reintroduces runtime DB dependency the static design
deliberately avoids. Real architectural convergence, tracked as future work
in `docs/longlive-experience.md` §9, not done today); keep the manual-only
sync script (rejected — doesn't fix the actual problem, which is that
content updates require a human to remember a step).

**Not yet done:** Tier-1 `moment.context` (long-form body text) isn't fetched
in the live path — 400+ individual queries at build time was judged not
worth it right now; live-synced items fall back to the snippet as body, same
as any seed item without `moment.context`. The videos/theories/tours/
releases seed pipelines are still unsynced entirely (tracked in
`docs/longlive-experience.md` §9).

**Approved by:** Joey, in this session — explicit "go for it" on architecture
integration #1 from the Supabase review.

## 2026-07-08 — Media & content sourcing policy

**Decision:** Replace the inherited blanket "never store article bodies or
rehost images — metadata only" rule with a **three-part policy** that makes
goal #7 (a rich, self-contained on-site experience — users never click out)
achievable while confining the real legal exposure. (Refines and supersedes the
blunt same-day "just reverse it / allow rehosting" note — that over-corrected.)

1. **Text — relaxed.** We write **original summaries of events in our own
   words** and link to sources. Facts aren't copyrightable; expression is. We
   **never paste article bodies, lyrics, or official statements verbatim.** The
   no-fabrication rule still applies (summaries must be real + sourced).
   Low-risk; unblocked.

2. **Images — no hosting restriction (see the 2026-07-09 entry above).** Any
   real photo may appear on-site by **any** means — embedded via oEmbed,
   hotlinked, or **copied/rehosted to our own CDN** — with a credit line where
   available. There is **no ban on rehosting** (the clause that used to sit here
   banning "arbitrary internet photos" is **deleted**). oEmbed remains a
   convenient path for social posts, not a requirement. The only image rules
   that remain are content-integrity, not hosting: **no AI-generated fakes,**
   and **clearly label any reference/comparable stand-in** so it's never
   presented as the real thing.

3. **Monetization gate.** The affiliate/fashion (commercial) layer shifts us
   from editorial toward commercial and raises **right-of-publicity /
   false-endorsement** questions. **Nothing monetized ships without external
   IP-counsel review,** and the **UNOFFICIAL fan-project disclaimer stays
   prominent.**

**Why:** The inherited blanket "metadata only" ban made the product impossible
(goal #7 needs on-site media). The image half of this policy has since been
fully opened up — see the 2026-07-09 "no rules against hosting" entry above,
which is the current word: hosting/rehosting real photos (paparazzi, press,
agency) is allowed, with credit; only AI fakes and mislabeled stand-ins are
barred.

**Must go to a real lawyer before we monetize (explicit):**
- Any monetization / affiliate / commercial feature → external IP counsel
  (right-of-publicity, false endorsement, FTC affiliate-disclosure).
- Before accepting any **fan submissions / UGC** → register a **DMCA agent** +
  takedown workflow (safe-harbor).
- Editorial-imagery **licensing scope** confirmed before hosting licensed assets.

**Technical implications:**
- **oEmbed content model:** store provider + canonical post URL (+ cached
  oEmbed HTML/metadata with attribution + fetched-at); render via provider
  embed; respect provider ToS/rate limits; graceful fallback when a post is
  deleted. oEmbed is an **external dependency**, so treat social embeds as
  current/ephemeral and prefer licensed **owned** assets for permanent/hero
  imagery.
- **Caching + attribution** kept with every asset (credit = attribution, not a
  license).
- Owned/licensed media stays **off the Tier 0 payload budget**.

**Unchanged:** no-fabrication rule; Tier 0 payload budget; UNOFFICIAL stance;
RLS. Point-in-time references in `docs/specs/`, `docs/proposals/`,
`docs/marketing/`, and the `packages/shared/src/vault-types.ts` comments predate
this entry and are superseded by it; they'll be updated when the media pipeline
lands.

**CTO agent's evaluation (surfaced, not rubber-stamped):** agree with all three
parts. One caveat, not a disagreement — oEmbed's external dependency means
deleted source posts break embeds, so license/own anything that must persist.

**Approved by:** Wyatt (CTO). Product direction from Joey.

## 2026-07-08 — Web app upgraded to Next 16 / React 19 / Tailwind 4 (retroactive)

**Decision:** `apps/web` moved from Next 14.2 / React 18.3 / Tailwind 3 to
Next 16.0 / React 19.2 / Tailwind 4.3, plus a set of Radix UI primitives
(dialog, slider, slot, toggle-group, tooltip, visually-hidden), as part of the
LongLive front-end rewrite (PR #73, branch `dev-script-not-seen`).

**Why documented after the fact:** this shipped inside v0's (Vercel's AI
builder) large front-end rewrite rather than as a standalone decision, so it
wasn't logged before implementation as the workflow rules require. By the
time it surfaced in codex review, the app was already built, tested, and
merge-ready against the new stack — reverting the framework bump would mean
reverting the entire rewrite, not a small change. The versions typecheck,
lint, and test clean, and the app runs correctly on them, so we're recording
the decision now rather than unwinding working code to backfill process.

**Alternatives considered:** revert to Next 14/React 18 and re-port the
LongLive components (rejected: throws away a full day of tested, reviewed
work over a paperwork gap, not a functional problem); keep both versions
side by side per-workspace (rejected: `apps/web` is a single Next app, there
is no per-route framework split to make this meaningful).

**Approved by:** Joey (product), retroactively, given the rewrite was already
built end-to-end and passing review. **Process note for future sessions:**
framework/major-version bumps must get a decisions.md entry BEFORE
implementation per `CLAUDE.md` rule 6 — this entry exists to close that gap
for this specific change, not to establish after-the-fact logging as normal
practice.

---

## 2026-07-07 — DRAFT: Mood→Song bot ships on a deterministic matcher, no LLM

**Status: DRAFT — pending Wyatt (architecture/cost) and Joey (product). Not
approved; do not build the serving/UI layer against this yet.**

**Decision:** The post-v1 Mood→Song bot's core is an **authored mood taxonomy
+ authored weighted mood↔song tags + a pure deterministic matcher** — chips
and a synonym-lexicon free-text matcher, running client-side over a small
static, CDN-cached payload (Vault-world data, off the Tier-0 budget). **Zero
LLM calls anywhere in the feature**, request path or worker. The only
sanctioned future LLM role is an *offline, capped, worker-side* lexicon miner
that proposes taxonomy improvements as PRs. Request-path classification (even
capped) stays banned unless Wyatt amends the standing no-request-path-LLM
rule via a new entry. Cost model (required per CLAUDE.md before ship): LLM
$0/month; marginal cost per interaction $0; interaction latency <1 ms after a
~15–40 KB gz payload load; availability independent of any AI vendor.

**Why:** The mood↔song mapping over a ~250-song catalog is editorial data,
not intelligence — authoring it once beats paying a model to improvise it per
request forever, and the deterministic version is instant, explainable, and
cannot hallucinate songs. Free text only needs mapping onto a closed set of
~10–25 moods, which a synonym lexicon covers for the head of real inputs,
with starter chips as a total fallback.

**Alternatives considered:** Request-path capped LLM classification
(rejected: violates the letter of the standing rule for marginal quality on a
closed-set problem — documented as option (c) in the proposal so the choice
is conscious); generative "DJ" chat (rejected: open-ended per-user
generation, the exact anti-pattern); embeddings over lyrics (rejected:
net-new infra + rights questions, for a problem curation solves better).

**Ref:** `docs/proposals/2026-07-07-chatbots-architecture.md` §3, §5. Matching
engine + validators + strawman landed in `packages/shared/src/mood/`
(subpath-only export, nothing imports it).

**Approved by:** _pending Wyatt (boundary + data home) and Joey (taxonomy,
bot priority)_

## 2026-07-07 — DRAFT: Clownbot is worker-side pre-generation over News+Vault; blocked on the news pipeline

**Status: DRAFT — pending Wyatt and Joey. Explicitly BLOCKED on: news
pipeline built + running, v1 shipped, and issue #36's decision gate. Do not
build.**

**Decision:** Clownbot (rumor/Easter-egg ideation persona, GitHub issue #36)
is a **serving/ideation layer, not a chat engine**: a scheduled worker stage
after each news-pipeline cycle pre-generates a bounded pool of speculation
"takes" from already-verified-and-labeled `news_story` rows plus Vault lore;
users browse/retrieve the pool via a chat-costumed board with button inputs
(no free-text box). **Zero LLM calls in any user-request path.** Generation:
Haiku-class, hard global cap ≤30 calls/day on a durable counter (news
pipeline's capped-client pattern, per-feature cap rows), ≤400 output
tokens/take; worst case <$3/month. Fallback: cap hit ⇒ pool doesn't grow;
serving never degrades. Safety is rule-based and deterministic, not
model-trusted: schema-enforced `speculation` labeling on every take, required
receipts (takes citing no sourced story are dropped pre-insert), a hard topic
blocklist (health, pregnancy, sexuality, family/minors, legal wrongdoing,
private individuals; relationship-existence speculation banned outright),
per-take unpublish + whole-bot kill switch, and (pending Joey) an
approve-before-publish queue. The full community theory board from issue #36
(accounts, submissions, novelty scoring, notifications) remains
NOT recommended — unchanged.

**Why:** Gossip content is the highest defamation/misinfo-risk surface the
product could ship (`vision.md` requires speculation be labeled, never
asserted; feature-brief 2026-07-04 documents live public sensitivity to AI
content about Taylor). Pre-generation over pipeline-verified sources keeps
every take receipt-backed and human-killable, keeps cost fixed and capped
regardless of user count, and honors the no-request-path-LLM rule instead of
carving exceptions for the riskiest feature.

**Alternatives considered:** Interactive generative chat (rejected: per-user
request-path LLM, unbounded cost, prompt-injection + defamation surface);
building the rumor corpus inside Clownbot (rejected: duplicates the news
pipeline without its verify stage — the one thing that makes gossip
survivable); shelving with no design (rejected: issue #36 explicitly asks for
a decision artifact).

**Ref:** `docs/proposals/2026-07-07-chatbots-architecture.md` §2, §4;
`docs/proposals/2026-07-07-news-pipeline-architecture.md` (branch
`docs/news-architecture`).

**Reconciliation note (2026-07-17, added when this entry landed):** the
2026-07-10 egg-threads clowning rework (Mastermind + Invisible Strings,
`docs/proposals/2026-07-10-egg-threads-clowning-rework.md`) now serves the
"clown on open cases" need with *authored* case files — no generation, no
LLM. Clownbot remains the future *generated-speculation* layer on top of the
news pipeline; if it is ever activated, its takes should surface through the
Mastermind open-case surface rather than a separate board, and this entry's
UX sketch is superseded to that extent.

**Approved by:** _pending Wyatt (caps, bot_ table group) and Joey
(hide-vs-label rumors, moderation model, topic lines)_

## 2026-07-07 — News data model: `news_`-prefixed two-tier schema, zero coupling to Vault (DRAFT)

**Status: DRAFT — needs Wyatt's approval before any migration is written.
Nothing is implemented against this entry; it exists so the expensive-to-
reverse shape is reviewed before news work is ever scheduled.**

**Decision (proposed):** When the post-v1 News/Current world is built, its
schema is a two-tier model adapted from Orbit's production pipeline —
`news_raw_item` (every ingested item; many) collapsing into `news_story` (the
deduplicated unit users read; few), plus `news_source` (config rows, with a
credibility `tier`), `news_story_source` (audit trail / "reported by N"),
and `news_llm_usage` (durable daily LLM-call cap counter). All news tables
carry the **`news_` prefix**; **no foreign keys in either direction** between
`news_*` and Vault tables; raw/internal tables get **no public RLS policies**
(worker-only), stories are public-read like the Vault. Orbit's multi-figure
`channels` concept is dropped — Swift2 is single-subject; search terms become
worker config. Stories carry `verification_status` so the "hide vs. label
fake stories" product choice stays a serving-time filter, not a schema change.

**Why:** The raw→story split is what makes dedup, "N sources" credibility,
and classify-once cost control possible, and it's proven in Orbit. The prefix
+ no-FK rule makes the 2026-07-02 "separate data worlds" decision mechanically
enforceable rather than conventional. Deciding the shape now is cheap;
re-shaping deployed news tables later is not.

**Alternatives considered:** Single flat `news_story` table with a jsonb
source list (rejected: loses per-item dedup keys and ingest idempotency);
reusing Orbit's schema verbatim incl. `channels` (rejected: multi-figure
indirection with no product behind it); schema-per-world Postgres schemas
(viable, but a prefix is simpler and matches existing table style).

**Ref:** `docs/proposals/2026-07-07-news-pipeline-architecture.md` (§4, §5).

**Approved by:** _pending Wyatt_ — do not migrate before sign-off.

---

## 2026-07-04 — Persistent glass era-rail replaces the peek-strip summon

**Decision:** Drop the summon affordance entirely. The prior design (see the next
entry) had a thin **peek strip** at the top that you grabbed to expand into the
scrubber, plus overscroll-to-summon at the scroll top. Both are removed. In their
place: a **persistent, always-visible era rail** pinned to the right edge — a
glassmorphic capsule with one colour dot per era (the whole timeline visible at a
glance), the active dot enlarged, drag/tap to jump, and a magnified album
"bubble" while dragging. The continuous-stacked-timeline + scroll-spy + two-way
coupling decision below is UNCHANGED; only the *navigator affordance* changed.

**Why:** On-device testing (Wyatt, real phone) found the peek strip scrolled
**off the top of the screen and was unreachable**, and it wasn't obvious which
era each position mapped to. An always-present rail showing every era colour is
reachable at any scroll position and makes the destinations legible without a
summon gesture — which also removes the overscroll-vs-scroll-up ambiguity the
superseded entry was carefully working around.

**Alternatives considered:** Keep the peek strip but make it position-fixed
(rejected: still a hidden-until-grabbed control, and a fixed bar over a
continuous scroller competes with content); bottom-edge scrubber (rejected:
collides with mobile browser chrome / home indicator). Implementation notes and
the interaction-lag fixes from a Fable review are in PR #23.

**Approved by:** Wyatt (CTO) — from direct device testing.

## 2026-07-04 — Continuous stacked timeline over per-era paging (scrubber summon)

**Decision:** The Vault reader is one continuous vertical scroller with all eras
stacked (scroll-spy drives the era indicator + theme), not a per-era paged view.
Consequence for the summon affordance: the **peek strip is always visible and
grab-to-expand is the primary summon** (works from any era); **overscroll-to-
summon fires only at the global scroll top.** A per-era overscroll trigger is
deliberately NOT implemented — in a continuous scroller it would collide with
scrolling up into the previous era, which the architecture spec forbids
("never fights normal vertical scroll").

**Why:** Joey's spec is era-snap horizontal scrubber + vertical month scroll; a
continuous stack makes scrubbing and scroll-spy two-way coupling natural and
keeps months reachable by plain scrolling. The spec's "overscroll at the top of
an era" language predates the continuous-stack choice and assumed paging. The
always-present grab strip covers summon everywhere, so nothing is lost.

**Alternatives considered:** Per-era paged scroller with rubber-band overscroll
per era (rejected: heavier, and re-introduces a network/scroll-position seam
between eras); per-era overscroll detection in the continuous scroller (rejected:
fights scroll-up-to-previous-era). Flagged by a Codex review of the reader.

**Approved by:** _pending Wyatt/Joey_ (documented divergence from the spec's
per-era overscroll wording; primary grab-summon unaffected)

## 2026-07-04 — Ship-readiness bar: wavetop everywhere + 2 flagship eras deep, then weekly post-launch drops

**Decision:** v1's content ship bar is revised from wavetop-only (all 11 eras,
met by #38) to: wavetop-only stays the floor for all 11 eras, **plus Midnights
and Tortured Poets must reach Active-tier depth** (the framework's 3-tier rubric
applied beyond just milestone months) **before public launch**, weighted toward
`relationship`, `sighting`, and `fashion` — the categories currently at 0, 2,
and 11 items respectively, against `vision.md`'s explicit promise to cover
sightings, fashion, and relationships. The remaining 9 eras ship at the wavetop
floor and are deepened on a **public weekly cadence after launch** ("era
drops"), each announced externally.

**Why:** Joey challenged the wavetop-only bar on retention grounds — v1 has no
notifications or news feed (2026-07-03 decision below), so unexplored content
depth is the app's only mechanic for bringing a lapsed user back, and a
100-item archive is exhaustible in a single session. Full depth across all 11
eras before launch (~350 items, a ~3.5x jump concentrated in the
slowest-to-source categories) was rejected: it defers all launch value behind
one large authoring push with nothing shippable in between, and compounds
already-open quality debt (`docs/marketing/content-review-2026-07-04.md`)
rather than fixing it first. Two flagship eras deepened pre-launch, with the
rest on a weekly cadence, ships incrementally like every other track in this
project and gives the founders a recurring reason to post externally instead
of one launch mention.

**The retention logic's real dependency, stated explicitly so it isn't
glossed over:** with no in-app notification system, the weekly-drop cadence
only produces retention if it is **publicly announced** (external/social
posts naming what changed) — a silently-deepened backend is retention-
equivalent to shipping nothing extra. This makes the cadence a marketing-
operations commitment on Joey, not just a content-authoring schedule. If that
weekly commitment can't be sustained, this option collapses to the old
wavetop-only bar's retention profile with extra pre-launch authoring cost and
no offsetting benefit.

**Alternatives considered:** (A) Keep the wavetop-only bar as the sole ship
floor — rejected as the weakest retention story of the three, not because it's
wrong on effort/speed grounds. (B) Full curated depth across all 11 eras before
launch — rejected per the sizing above, not because it's technically
infeasible (a payload-budget objection in the prior framework doc doesn't
hold: 100 items measures at 0.6% of the 2MB gzipped Tier-0 budget, per
`docs/roadmap.md` W6 — real cost is authoring time and quality risk, not
payload).

**Update, same day — Joey asked why not front-load full depth with more AI
effort, since Max's constraint is a rate-limit window, not dollars, and
tokens are cheap. Correct on one point, not on two others (see
`docs/marketing/ship-readiness-review-2026-07-04.md` addendum):** the "B
defers everything behind one 11-era batch" reasoning above was wrong — each
era is an independently owned/shippable seed file
(`supabase/seed/content/<era>.mjs`), so full-depth authoring can run in
**parallel across eras beyond the two named here**, with each era shipping
full-depth the moment it individually clears Codex review + Joey's spot-check,
rather than waiting on all 11 together. **This is additive to the gate below,
not a replacement for it** — Midnights + Tortured Poets at Active-tier depth
remain the fixed minimum that blocks launch; any additional eras that clear
review in time ship deep too, reducing (not eliminating) reliance on the
post-launch weekly-drop plan for whatever's left. What tokens still can't buy:
real sources for months where nothing public happened (no padding, no
fabrication, ever — unchanged), and Joey's own spot-check time, which is the
one step in the pipeline that scales with his hours, not compute. Nobody has
timed that review step yet — doing so on the next batch is the actual
constraint on how many eras "parallel effort" can realistically clear before
launch, not token budget.

**Ref:** `docs/marketing/ship-readiness-review-2026-07-04.md` (Codex
adversarial-review round included), superseding the ship-readiness bar in
`docs/marketing/content-framework-2026-07-03.md`.

**Approved by:** Pending Joey sign-off on this PR — this is the marketing
dept's recommendation, not yet a confirmed product decision.

## 2026-07-04 — Song track guide is a separate, non-month-scoped shape

**Decision:** Full song-catalog coverage lives in a new `track_note` table
(per-album song notes: `era_slug`, `track_title`, `track_number`, `note`,
`source_url`, `sources[]`), **not** as `month_item` rows. It is reached from the
album/era and served **on demand** per album (`GET /vault/album/[slug]/tracks`),
like Tier 1 moments — deliberately kept **off the Tier 0 timeline payload**.
Same discipline as the rest of the Vault: short sourced note (≤400 chars, DB
CHECK), links only, no fabrication, RLS public-read, authored via repo seed
files (`supabase/seed/tracks/*.mjs`, `npm run db:seed:tracks`).

**Why:** Content approved full-catalog song annotation (Taylor's catalog is
unusually well-documented). Songs currently only become content as month-scoped
`month_item` rows, capped at 1–2 standout tracks/album to respect the
wavetop-month depth ceiling (5–8 items/month) and the Tier-0 payload budget gate
(W6, ≤2MB gz, CI-enforced). Midnights (13 tracks) and TTPD (31 w/ Anthology)
would blow both immediately. A separate album-scoped shape gives unlimited song
coverage without touching the timeline payload.

**Alternatives considered:** Extend `moment` with nullable month linkage + a
discriminator (rejected: `moment` is 1:1 and month-scoped; overloading it
muddies the timeline model). Bundle track guides into Tier 0 (rejected: that is
exactly the payload the budget gate protects). Keep cramming songs into
`month_item` (rejected: breaks both limits, needs migration later).

**Knock-on:** the staged Orbit song port (`candidates/00-orbit.mjs`, 218 songs
as `month_item` rows) is the anti-pattern this replaces — those should be
re-mapped to `track_note`s or dropped, and must not be seeded as month items.

**Ref:** `docs/proposals/2026-07-04-song-track-guide-content-shape.md`,
`docs/marketing/feature-brief-2026-07-04.md` (Addendum).

**Approved by:** Wyatt (CTO)

## 2026-07-03 — V1 scope is Vault (time machine) only

**Decision:** v1 ships the Vault/era-scrubber time-travel experience and
nothing else. Features 2–8 from the 2026-07-02 marketing brief (news feed,
notification onboarding, source-credibility tagging, collections, live
event companion) are not scheduled — not ruled out, just out of v1 entirely.
This narrows the brief's "ship #1, then #2, then #3" sequence down to #1
alone. Engineering spec: `docs/specs/2026-07-03-vault-mvp-v1-spec.md`.

**Why:** Product direction from Joey — focus the first release on the one
feature nobody else can clone quickly, rather than bundling in the
notification/news pillars before the Vault itself has shipped.

**Alternatives considered:** The brief's original 3-feature sequence
(rejected for v1: defers a shippable release behind two additional builds
that aren't needed to prove the core mechanic). Bundling notification
onboarding with the Vault as one release (the brief's still-open A/B
question — moot now, since notifications aren't in v1 at all).

**Approved by:** Joey

## 2026-07-02 — Cost strategy: two bills, and codify repetition

**Decision:** Manage build cost and runtime cost separately. Build: we run both
Max (scarce resource = rate-limit window; sequence heavy jobs around refreshes,
grip-and-rip within a window) and API (scarce resource = dollars; use a Console
spend cap + alerts, not manual tracking). Runtime: keep the Vault static, any
product LLM call is worker-side/capped/fallback, never in a user path. Standing
rule (now CLAUDE.md workflow rule 8): if an AI does the same procedural task
twice, or foresees it recurring >2×, it writes and commits reusable code for it
instead of re-executing token-by-token.

**Why:** Repeated manual execution costs tokens linearly and drifts; codifying
it is O(1) and deterministic. The biggest build-cost sink is rework, addressed
by spec-before-code + small PRs. A hand-kept spend spreadsheet is stale on
arrival; Console caps/alerts aren't.

**Alternatives considered:** Manual Excel bill-tracking (rejected: stale,
redundant with Console on API and meaningless on flat-rate Max). Pay-everything
-up-front with no discipline (rejected: fine for dollars, but ignores rework and
rate-limit throughput, the actual constraints).

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Reuse Orbit's stack, separate backend

**Decision:** Adopt the sibling project Orbit's stack topology wholesale —
TypeScript, Next.js (App Router) on Vercel for web, Expo/React Native for
mobile, Supabase for DB/auth/storage, npm-workspace monorepo with
`packages/shared` (portable domain, no I/O) + `packages/core` (data access).
Reuse Orbit's *code patterns and layout*, but stand up a **new, isolated
Supabase project** — do NOT share Orbit's backend, data, or quota.

**Why:** Orbit already runs this exact shape of problem in production; a
two-person AI-first team can't afford novel infra. Isolating the backend keeps
two products' prod data, cost, and blast radius separate (Orbit's own rules are
strict about a single shared backend).

**Alternatives considered:** (a) Green-field stack selection — rejected, no
upside over a proven one we operate daily. (b) Literally share Orbit's Supabase
project — rejected, entangles two products' data and quota; Wyatt can flip this
if Swift2 turns out to be an Orbit evolution rather than a distinct product.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Vault and News are separate data worlds

**Decision:** Curated Vault content (eras, milestones, fashion) and live
News/Current content live in separate tables and separate app surfaces. Vault
is authored/versioned in the repo, static between deploys, CDN-cached; News is
volatile and pipeline-driven.

**Why:** They have opposite freshness/caching needs; coupling would force the
Vault to inherit the feed's volatility for no benefit.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Era-scrubber gesture layer is per-platform

**Decision:** The Vault timeline scrubber is built as the app's reference
workload with a hard 60fps budget. Its data model, ordering, and snap math live
in shared packages, but the gesture recognizer + animated timeline are
implemented **twice** — web (Pointer Events + CSS transforms + rAF) and native
(Reanimated worklets + Gesture Handler on the UI thread). v1 snaps to **era
boundaries only**; milestones (wavetops: album releases + tours) are anchors,
not snap targets.

**Why:** "Smooth and low-latency" is the feature. A shared abstraction over two
very different animation runtimes would risk the frame budget and cost more than
it saves. Per-frame React state is banned on both platforms.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Adopt dual-AI operating model

**Decision:** Claude Code is the hub (planning + building); Codex runs inside
it via the official plugin (reviewing + delegated tasks). Roles are modes
defined in CLAUDE.md, not separate agents. QA is automated tests + CI, not an
AI role.

**Why:** Cross-provider review catches issues self-review can't; one-session
workflow avoids copy-paste overhead; lean docs over an 11-file process that
would go stale.

**Alternatives considered:** Separate PM/Engineer/Reviewer/QA AI agents
(rejected: ceremony without benefit at 2-person scale, unaffordable on
current plans).

**Approved by:** Joey

## 2026-07-02 — Repo is the source of truth

**Decision:** All knowledge lives in Git. Nothing important exists only in an
AI conversation. Core docs: CLAUDE.md, AGENTS.md, docs/vision.md,
docs/architecture.md, docs/decisions.md. New docs added only when their
absence causes real pain.

**Why:** Docs nobody maintains are worse than none; agents act on stale info.

## 2026-08-15 — No rehosted third-party press photos, going forward; the Getty preview comps are gone from the served site

**Decision:** the product no longer rehosts unlicensed third-party press
photography as binary files under `apps/web/public/social/**`. Going forward,
any editorial photograph of Taylor comes from one of two sources: (1) a
properly licensed/CC-cleared image, credited and — where the license permits —
rehosted locally, the same way `apps/web/lib/longlive/content-vault.generated.ts`
already sources and license-captures Wikimedia and press imagery for the
Vault; or (2) a hotlink to the source's own hosted URL, always with visible
credit, never rehosted without a checked license. What is retired is the
practice this repo had been running under the 2026-08-13 "knowing acceptance
of infringement exposure" entry above: rehosting Getty's unauthenticated
preview-comp thumbnails as local binaries and shipping them as our own asset.
That acceptance is not revoked as a historical record of what was approved and
why — it stands, unedited, above — but it no longer describes current
practice.

**What changed on this date:** the 12 Getty preview-comp images described in
the 2026-08-13 entry above (`apps/web/public/social/library/photos/*.jpg`)
were removed from HEAD. `social/posted/**` records that already shipped with
one of these images keep their historical media path unchanged — they are an
append-only ledger of what was actually posted, not a live index of files that
must keep existing. Queued-but-unposted drafts referencing a removed photo
were fixed in place (image-only carousels fell back to their remaining
site-screen slide; image-less-capable X drafts had their media field cleared
entirely; the one Instagram draft with no non-photo fallback was retired to
`social/failed/` by hand, matching this repo's existing retirement pattern).
One image already in that same directory, `taylor-lover-eras-minneapolis-2023.jpg`,
is not a Getty preview comp — it is CC BY 2.0 (Michael Hicks, via Wikimedia
Commons), already credited and sourced under the model this policy asks for —
and was left in place and unchanged.

**Why:** the exposure the 2026-08-13 entry knowingly accepted was never free;
it was a bet the founders chose to hold rather than eliminate. The owner has
now decided to stop making that bet going forward. Hotlinking with credit (or
using cleared, license-captured images) gets the same visual coverage without
asserting rights the product hasn't licensed.

**Scope:** forward-looking only. This entry does not rewrite git history, does
not retract the 2026-08-13 approval as a record of what was decided and by
whom, and does not touch `social/posted/**`'s historical media references.
Editorial-imagery licensing at large is still the 2026-07-09 entry's open
question for IP counsel; this entry only closes the social-library rehosting
practice going forward.

**Approved by:** Joey

## 2026-08-15 — Merch cards need a real product photo, not a paparazzi shot of Taylor wearing it

**Problem:** `merchItemImage()` (`apps/web/lib/longlive/merch-filters.ts`) derived
every merch card's image from the source moment's photo for 150 of 156
products (the other 6 fell to a brand-initial monogram) — a shopper sees a
picture of Taylor at an event, not the item they're about to buy.

**Schema:** added `imageUrl?: string` to `Product`
(`apps/web/lib/longlive/types.ts`) — a direct https URL to the retailer's own
product photo, hotlinked (never downloaded/re-hosted — copyright), typically
captured from a Shopify `/products/<handle>.json` response's `images[0].src`.
Fully optional; nothing breaks for products without one.

**Fallback honesty:** when `imageUrl` is absent, the card still shows the
moment photo rather than going straight to the monogram, but now visibly
labels it as the look, not the product — the same "never imply something
untrue" principle behind the 2026-07-20 "We found something similar" alt-piece
label above. The monogram tile only appears when neither image exists.

**Capture mechanism:** extended the existing
`scripts/content-engine/product-liveness.mjs` liveness pass (not a second
script) — for a `/products/<handle>` URL it also fetches `<url>.json` and
captures `images[0].src` when Shopify's product JSON parses. A `.json` 404 is
ambiguous (not-Shopify vs delisted) and is reported as such, never conflated.

**Approved by:** Joey (item #7, 2026-08-15 punch list)

**Approved by:** Joey

## 2026-08-23 — Knowledge engine kickoff: architecture decisions logged before build (proposal §10)

**Context:** `docs/proposals/2026-08-23-knowledge-engine.md` (Fable), overnight
autonomous build authorized directly by Joey. Rule 6 requires expensive-to-
reverse decisions logged before implementation. Corrected against actual repo
state first (a ground-truth audit found several of the proposal's claimed
file paths don't exist as described — see the "corrections" bullet below).

**Decisions ratified/made (proposal §10 items 1, 3, 4, 8; item 6 partial):**

1. **Current tier is a first-class, reader-visible Supabase store**, read at
   request time via Next.js ISR for the current era only; the Vault stays
   static/CDN-cached exactly as `architecture.md` requires. One new store
   (`current_item`, `fan_signal`, `live_theory`, `symbol_activity`,
   `knowledge_doc`), two tiers (`vault`/`current`), every surface (site, mobile
   via `packages/core`, Clownbot) reads the same tables.
2. **Ingestion runs on GitHub Actions with API keys, never a Claude routine.**
   The extract stage (structured, our-words summarization of a clustered
   story) runs on **Anthropic (Haiku 4.5)**, matching Clownbot's existing
   vendor (`apps/web/lib/longlive/clown-client.ts` already calls
   `api.anthropic.com`) rather than adding a second vendor. This is additive,
   not a replacement — `apps/worker/src/classify/openai-client.ts` (OpenAI,
   the existing raw-item relevance classifier) is untouched; extract is a new
   downstream stage on the clustered output.
3. **Google News**: ratifying Joey's 2026-08-23 call already recorded in the
   proposal body (§4.2) — drop it as primary, replace with publisher tag
   feeds (free, citable, backbone) + official-surface diffs (free,
   deterministic) as the immediate build; a licensed recall API (GNews or
   Perigon, real monthly cost) is parked pending Joey's pick
   (`HUMAN-ACTIONS.md` #12). Google News stays running unmodified until the
   replacement's one-week shadow recall test passes 95%.
4. **Fan-platform posture**: Bluesky (free, no key) and Reddit-via-RSS
   (free, interim, disclosed — §4.4's posture, already a founder call in the
   proposal body) build now; Tumblr waits on a free-but-account-gated API key
   (`HUMAN-ACTIONS.md` #12); X stays pay-per-use and capped, built later once
   budget is set; TikTok never; every fan source aggregate-only, hashed
   author, no comment bodies beyond what a public RSS already exposes.
6. **Clownbot conversation persistence** (retention 180d, no IPs, Supabase
   anonymous auth): schema and code land now, but the write path stays
   feature-flagged off until "Allow anonymous sign-ins" is toggled in the
   Supabase dashboard (`HUMAN-ACTIONS.md` #12 item 5) — an agent can't reach
   that toggle.
8. **"Freshness on Actions, judgment on routines"** is now a standing rule —
   added to `CLAUDE.md` § Cost discipline in the same change that makes this
   decision. A routine going dark (as the Content Shift/Rumor Desk migration
   already has, per the proposal's diagnosis) must never make the site stale.

**Deferred, logged but not decided** (both are proposal §10 item 7 and part
of item 3 — real recurring cost, need Joey's pick): embedding vendor (Voyage
vs. OpenAI) and the licensed news API (GNews vs. Perigon vs. accept the risk).
`HUMAN-ACTIONS.md` #12 carries both. Until an embedding vendor is chosen,
`knowledge_doc.embedding` stays null and retrieval is FTS-only (`tsv` column)
— degraded, not broken.

**Corrections to the proposal's claimed current state**, found by a
ground-truth audit before writing PLAN.md (so PLAN.md reflects reality, not
the proposal's guesses): `packages/shared/src/redline.ts` does not exist —
the real screening code is `apps/web/lib/longlive/clown-safety.ts` +
`clown-blocklist.ts`, already wired into `apps/api/clown/route.ts` (the
proposal's audit items 0a/0b were already resolved, not open gaps).
`scripts/sync-clown-knowledge.mjs` doesn't exist (greenfield, not a rename).
`packages/core/src/knowledge/` doesn't exist yet (greenfield). No
`ANTHROPIC_API_KEY` repo secret exists for the worker (`gh secret list`
confirmed) — blocks a live extract-stage run until added
(`HUMAN-ACTIONS.md` #13). No pgvector precedent anywhere in
`supabase/migrations/` — genuinely greenfield, `create extension vector`
untested in this project. `apps/mobile` reads Supabase live via
`@swift2/core`; `apps/web` reads the generated Vault TS — the "one engine
feeds every surface" goal is true going forward for the *Current* tier (both
read the same new tables) but does not retroactively unify how the Vault
itself is read by web vs. mobile; that's a larger, separate migration, out of
scope here.

**Not decided here, explicitly deferred to a human session per the proposal's
own rule (§9 issue 5):** the `technique` table's actual content
(`techniques.mjs` seed, 7–10 records) — the proposal states this must be
"written in a frontier-model session with a human — not an autonomous run."
Overnight work builds the schema, the sync scaffolding, and the coverage
audit script; it does not author technique records claiming a stylistic
pattern without Joey (or Wyatt) in the loop to check them against the actual
corpus.

**Approved by:** Joey (direct instruction to build the full proposal
overnight, 2026-08-23 22:01 PDT); architecture calls within it made under
existing Decision Authority (CLAUDE.md: AI may write code, refactor,
document decisions for non-money, non-infra-credential calls without asking).

---

## 2026-08-24 — Watchdog alarm remediation: six alerts fixed at the architecture level

Six watchdog/brief-mailer alerts fired at once (Joey forwarded them). Root-caused
and fixed persistently so each stops re-firing, rather than muting:

1. **Knowledge-engine current-tier "stale" (freshness check crashed).**
   `scripts/knowledge-freshness.mjs` imported the worker's `@supabase/supabase-js`
   client at module load, but `watchdog.yml` runs it with no `npm ci` (it is
   deliberately dependency-free) → `ERR_MODULE_NOT_FOUND` crash reported as
   exit 1 → false daily page. Rewrote it to query PostgREST via the built-in
   `fetch` — zero third-party deps — and to exit 2 (skip, not alarm) when the
   `knowledge_doc` table is absent (pre-migration) or creds are unset.

2. **news-worker failing every 4h (email 6) + current tier genuinely empty
   (email 1's real cause).** The worker crashed (exit 1) on schema-cache errors
   for columns/tables from unapplied knowledge-engine migrations
   (`resolved_tier`, `symbol_lexicon`, `news_story.extracted_at`). Applying
   those needs `SUPABASE_DB_URL` (a direct Postgres connection), which is not a
   repo secret and cannot be added by an agent (guard-denied) — it stays
   HUMAN-ACTIONS #14 (Wyatt, `npm run db:migrate`). To stop the daily CI noise
   while that is pending, `apps/worker/src/index.ts` now treats
   `/schema cache|does not exist/` errors as a degraded no-op (job stays green,
   matching the worker's "zero sources = no-op usefully" design) while genuine
   errors still fail. Those PostgREST codes fire only when an object is truly
   absent, so once migrated the same calls succeed and real failures resurface —
   no masking.

3. **Content Shift lane liveness alarm (email 3).** The standalone Content Shift
   cloud routine was deleted when it was folded into the Vault Run
   (HUMAN-ACTIONS #11 / PR #2289), so `content-shift/*` branches can no longer
   appear and the `check_lane "content-shift/"` in watchdog.yml alarmed daily.
   Deleted that one line — the exact migration the check's own comment
   prescribed for this moment. The `vault/` lane check stays.

4. **Karen / CIE stale 255h (email 4) — the architecture fix.** Karen ran only
   as a Wyatt-account Claude routine and went dark 10+ days unseen. Per CLAUDE.md
   "Freshness on Actions, judgment on routines," the deterministic half (detect
   + file tickets) moved to a new GitHub Action `.github/workflows/cie-scan.yml`
   (`run.mjs all --no-images --create`, twice weekly, zero LLM, `GITHUB_TOKEN` +
   `SOCIAL_POSTER_PAT` to land the report PR on protected `main` — same pattern
   as growth-snapshot.yml). CIE report freshness no longer depends on a founder's
   Claude login; the routine is now needed only for the AI `Karen Deep` review.

5. **PR #2175 stuck on `build` 8 days (email 5).** Its branch was 52 commits
   behind with a stale generated vault (`check:generated` red). Re-applied its
   four context-field trims cleanly on current `main` (#3160, green) and closed
   #2175 as superseded.

6. **"FB group export never closed" (email 2) — false positive.** watchdog.yml's
   skip-guard `grep -q "slug:"` matched the `{ slug: 'example-group-slug' }`
   EXAMPLE in a doc comment, so it never took the intended skip branch while
   `FB_GROUPS_CHECKLIST` is `[]` (HUMAN-ACTIONS #16 still open). Replaced it with
   a real array-length check via `node -e` (import the module), and the skip
   branch now closes any standing alert so the pre-configuration state self-heals.

Approved under existing Decision Authority (CLAUDE.md: AI may write code,
refactor, fix CI/workflows, document decisions for non-money, non-credential
calls). The one credential-gated piece — applying the DB migrations — remains
HUMAN-ACTIONS #14 (Wyatt); the worker/freshness degrade above is what stops the
alarms in the meantime without masking a real regression.

## 2026-08-25 — Reversed: Reddit fan-source posture now includes comment bodies

**Context:** the 2026-08-23 knowledge-engine kickoff entry (item 4, above)
set Reddit-via-RSS to aggregate-only, hashed author, no comment bodies
beyond what a public RSS already exposes — the most conservative posture
available at build time, deliberately narrow pending a real product call.
That call has now been made.

**Decision:** Reddit comment bodies (not just post titles/selftext) are now
in scope for the fan-signal/theory-detection pipeline. Joey's reasoning,
verbatim: "that's public info, reddit people WANT their info public, that's
the entire idea behind the site. I am an avid redditor and moderator, this
is fact." Joey personally moderates Reddit communities and is speaking from
direct standing in that community, not a guess — the prior posture's caution
was appropriate given the alternative was pure speculation about Reddit
users' expectations at build time.

**Scope, still to be engineered:** comment threads (not just post bodies) on
relevant subreddits become a real extract-stage input, specifically for
detecting Easter-egg/theory/new-song discussion signal — the exact gap
flagged in the 2026-08-25 architect (Fable) review dispatched this session.
Hashed-author convention and every other privacy safeguard from the 2026-08-23
entry stay in force (this reverses ONLY the no-comment-bodies clause, nothing
else in item 4). Which subreddits, comment-depth/volume caps, and how this
interacts with the parked Reddit Data API request (`HUMAN-ACTIONS.md` #12
item... — see that file for current status) are engineering-scope questions
for whoever implements this, not re-opened by this entry.

**Approved by:** Joey, in chat, 2026-08-25 06:38 PDT.

## 2026-08-25 — Detection-triggered social auto-post: confirmed live, not staged; email on every send

**Context:** the "auto-stage social posts on official-upload detection"
recommendation (2026-08-25 architect review + Joey's earlier "I want both,
auto-stage and notify") ran into a real finding during implementation: this
repo's social queue has had NO per-item founder-approval gate since
2026-07-25 (`social/README.md`, `scripts/social/lib/queue.mjs`) — a file
dropped in `social/queue/` with a near-term `scheduledAt` posts live on the
next `social-poster.yml` cycle, no human review. "Auto-stage" as a
safe-sounding middle ground doesn't exist in the current pipeline.

**Decision:** Joey confirmed directly — no review gate wanted. Detection-
triggered posts (official YouTube uploads, etc.) go straight into the
existing queue mechanism exactly like every other social draft and post
automatically on their scheduled time, same as today's Content Shift
drafts. No new approval step, no new safety gate.

**Also decided:** an email notification fires on every social post that
actually goes out (not just failures — see the separate `social-poster.yml`
failure-alert fix landing the same night), with a link to each platform the
post reached. Joey's words: "I dont mind more emails for social" — this is
an explicit, deliberate exception to the 2026-08-23 1-2/day founder-email
cap, scoped only to social-post notifications.

**Approved by:** Joey, in chat, 2026-08-25 06:49 PDT.

## 2026-08-25 — X + Instagram pairing is mandatory for every social campaign

**Context:** the Grammy Museum Icon Sessions campaign surfaced the actual
delivery gap: its queue item targeted X only, even though Joey expected the
campaign to reach X, Instagram, and Facebook together. The poster has no
single “post everywhere” item type. An `x` item reaches only X; an
`instagram` item reaches Instagram and then uses the existing
`FB_PAGE_ID`/`IG_ACCESS_TOKEN` cross-post path to reach Facebook. The posted
history confirmed this was not an isolated miss: most campaigns had been
authored for only one platform, with an Instagram sibling added only when a
drafter happened to remember.

**Decision:** every real social campaign is authored as a pair in the same
change: one queue item with `platform: "x"` and one with
`platform: "instagram"`, both carrying the same story-unique `campaign`
value. The two bodies remain platform-native rather than copies. Facebook is
covered by the Instagram item’s existing automatic cross-post, so no separate
Facebook queue item is drafted. A genuinely unsuitable format may be
single-platform only when its `why` contains an explicit
`Single-platform exception: <specific human-readable reason>` note; omission,
missing media, or convenience is not an exception. Historical gaps are
reported, not automatically backfilled.

**Approved by:** Joey, in chat, 2026-08-25.

## 2026-08-25 — social-ledger unprotected branch: dedupe correctness no longer depends on a PR merging (issue #2040)

**Context:** two incidents (2026-07-17, 2026-08-11/12, issue #2031) shared
one structural cause — the poster's source of truth for "what already
posted" is `social/posted/` on `main`, and writing to it required a
throwaway-branch PR to merge. Any failure of that merge (allowlist gap,
disarm guard, a conflicting state PR, a required check that never ran) left
the ledger silently stale, and posting on a stale ledger manufactures live
duplicates Instagram/Facebook cannot delete after the fact. PR #2039
mitigated this (state PRs auto-merge again; the poster fails closed while
one is open) but did not remove the dependency itself. The stakes rose the
same night this fix landed: Joey confirmed social posting has NO human
review gate at all any more (see the entry immediately above) — this ledger
is now the last real safety net against a live duplicate, with a
post-notification email the only other signal.

**Decision:** implemented Option A from issue #2040 — a dedicated
UNPROTECTED branch, `social-ledger`, that `social-poster.yml` pushes to
directly with a plain `git push` (no PR, no required check; confirmed via
the repo's rulesets API that `protect-main` scopes to `refs/heads/main`
only, so this branch is untouched by it). Each run:

1. Overlays `social-ledger`'s `social/queue|posted|failed` onto the main
   checkout ADDITIVELY (`git archive | tar -x` — writes files the ledger
   has, never deletes a file main already has), so post-queue.mjs always
   sees the union of what main knows and what this job has ever posted.
2. Posts as before, then immediately pushes the updated ledger straight to
   `social-ledger` — a plain fast-forward, each commit parented on the
   branch's own previous tip, no `--force`. If this push fails, the run
   goes red in THAT run, not silently three runs later.
3. Still opens the existing throwaway-branch auto-merge PR into `main`
   (issue #2031's mechanism, unchanged), but that PR is now VISIBILITY-only
   — folding the ledger back into `main` for humans and for
   check-drafts.mjs's recent-history heuristics, not a correctness
   dependency. A stuck fold-back PR is a staleness-on-main problem now, not
   a duplicate-post risk.

Rejected Option B (treat platform APIs as the dedupe source of truth at
post time) per the issue's own recommendation: it adds a network call and
X's lookup limits on every run for a check the repo-side ledger already
does deterministically and offline; Option A also let the existing
fold-back-PR/allowlist/append-only mechanics from PR #2039 be reused almost
unchanged instead of replaced.

**Why this is the durable fix, not another mitigation:** every prior fix in
this class (the PAT fix, the allowlist fix, PR #2039's fail-closed guard)
still had "did the merge into `main` succeed" somewhere on the critical
path. This one doesn't — the write that correctness depends on is a direct,
unprotected `git push`, and the PR path left in the workflow is provably
non-load-bearing (verified locally: a simulated stuck/unmerged fold-back PR
still let a second run correctly detect the duplicate via the ledger
branch alone).

**Approved by:** Joey directed this fix directly in the same session that
confirmed no human review gate remains on social posting (context above),
explicitly as a design task with engineering judgment on the approach. The
issue itself flagged "needs a small spec + Wyatt's call" at filing time;
that predates both the no-review-gate confirmation and the 2026-08-22
loosening of AI decision authority to include merge/push. This entry is
that spec, filed with the implementing PR per CLAUDE.md rule 6 — Wyatt has
not separately reviewed the design; flag for his attention if he wants to
revisit the Option A vs. B call.

## 2026-08-31 — Tier-2 optimization T-13/T-14: two live triggers disabled by founder

Following Fable's Tier-2 cost/benefit analysis (`docs/TIER2-OPTIMIZATION.md`),
Joey disabled two live claude.ai scheduled routines directly in the routines
UI, since only an operator-authenticated session can flip a live trigger
(no repo-side RemoteTrigger access exists in any worker sandbox):

1. **Marjorie — 8 PM Evening Delta** (`trig_01L2EG5veWBQwMowaykXAi6B`, T-13).
   Disabled as a warm spare — prompt preserved at
   `docs/agents/runner-prompts/marjorie-delta.md`, trigger config not
   deleted, reversible by re-enabling in the routines UI.
2. **swift2 Getty purge — GitHub GC watch** (`trig_018QuJozjMr1bYMPcqgKUmvL`,
   T-14). Disabled after independently re-confirming the purge it watchdogs
   is complete (zero `media.gettyimages.com` references anywhere in the
   repo; PR #3246, merged 2026-08-25, retired the last live comp URLs).
   This trigger had no prompt file, so its full `job_config` (schedule,
   sources, model) was not captured before disable — not recoverable from
   this repo if ever needed again; a fresh watchdog would need to be
   authored from scratch.

`docs/agents/runners.md`'s live trigger table updated to reflect both as
disabled (⛔, not removed). Fleet count corrected: 23 Swift2 routines total,
21 enabled in the standing fleet (Lex depth and Marjorie's delta both
paused).

## 2026-09-01 — T-20 Phase 1: attribution-trailer sync to all 24 live Tier-2 routines complete

Per HUMAN-ACTIONS.md item #37, synced every live routine's inline
`job_config` prompt to its current `docs/agents/runner-prompts/` file
content (never a partial PUT — `get` the trigger, replace only the
`prompt` field in the full returned `job_config`, PUT the whole object
back). 21 of the 24 tracked routines carry a live prompt and were
re-synced; the remaining 3 were out of scope by design (Karen Deep review
and the Notification-quality desk are approved but not yet created; News
Triage's recall-check trigger was created fresh, already carrying the
trailer, under item #36 the same session).

Every re-synced routine now includes the `## Attribution trailer (T-20
Phase 1)` section verbatim, so every PR/issue it opens from here forward
carries a `Tier-2: <routine name>` line — the input Phase 2's daily
per-routine telemetry rollup in Marjorie's Founders' Brief will read.
**This date starts the "season for a few days of real PRs" clock** —
Phase 2 should not be built to read real counts before a few days of
post-sync output exist.

Two routines kept a deliberate divergence from their file beyond the
trailer itself, both judgment calls, not oversights:
- **Kevin — S3 comment radar**: the repo file's cadence description does
  not match the trigger's real twice-daily (`23 1,13 * * *`) schedule; the
  live prompt's cadence text already correctly described the real
  schedule. Resynced the trailer only, left the (correct) live cadence
  text as-is, and flagged the file itself as needing a fix — inverted from
  the usual "file is truth" default, and worth fixing in the file so a
  future full resync doesn't regress it.
- **The Vault Run**: its live prompt is deliberately a short pointer, not
  the full ~12KB orchestrator-contract file — the file's own text warns
  against baking that much undocumented instruction inline. Appended only
  the trailer.

**Marjorie — 8 PM Evening Delta** was re-synced (its file-sourced prompt
now carries the trailer too) but left `enabled: false`, unchanged from its
T-13 disable (see the 2026-08-31 entry above).

Commented on kanban card `t_017c1e5b` with this same completion date so
Phase 2 work knows when it's safe to start reading real per-routine
output counts.

**Follow-ups surfaced, not part of this item, not actioned:** the 4
MCP connectors auto-attached to the new recall-check trigger on creation
(item #36) still need manual removal via the routines UI; Laura's live
`cron_expression` (`20 18 * * *`) differs from this file's table
(`20 18 * * 2,5`); Austin's live model may not yet match the
`claude-opus-4-8` 2-week trial the table already records as decided
(D5=A) — worth a live re-check; Karen's pending rename is tracked
separately as issue #3616.

## 2026-09-05 — The mobile app ships the website in a native shell (WebView), native port deferred

**Decision (Wyatt, owner, in session 2026-09-05 — final; Joey informed via #531):**
`apps/mobile` renders **www.longlivets.com in a full-screen WebView**
(`components/SiteShell.tsx`) and keeps everything built natively around it:
device registry, opt-in push registration, the bell → notification settings,
the inbox, and notification deep links (which now navigate the WebView to the
matching site URL). The native Vault navigator (`VaultNavigator.tsx`,
`EraTimeline.tsx`) stays in the tree unmounted as the long-term port target.

**Why:** the first TestFlight build (v1.0.0 build 3, 2026-09-05) exposed that
the two apps had diverged completely. The website is the self-contained
experience layer under `apps/web/lib/longlive` (~64k lines, 99 components,
generated in-repo content — see `docs/longlive-experience.md`); the native
app was the ~2k-line Supabase "Vault" MVP that `docs/architecture.md` intended
the web to converge on, which never happened. Porting the site to React
Native is weeks of work; a shell ships the real product today and every web
deploy reaches the app instantly. Reversible: a later build can swap the
shell for native screens one at a time.

**Accepted risk:** App Store guideline 4.2 (minimum functionality) rejects
"repackaged websites". The native push/settings/inbox surface, deep links,
and in-app offline handling are the defense. If App Review rejects on 4.2,
the fallback is to re-mount `VaultNavigator` as an additional native tab
rather than argue.

**Consequences:** the `/privacy` mobile section and both stores' data-safety
answers now inherit the website's collection (feedback text, mood/Clownbot
text to the Claude API, Vercel Web Analytics, Clownbot cookie) on top of the
device id + push token — App Privacy label becomes Identifiers (Device ID,
User ID), User Content, Usage Data, all not linked, no tracking.
`apps/mobile/lib/vault.ts` and `@swift2/core` are no longer called from
the mounted app; `architecture.md`'s "reuse packages/* unchanged" holds only
for the deferred native port.

## 2026-09-05 — Convergence decisions D1–D4 ratified: one content bundle, two renderers on one core, progressive native port, EAS Update

**Decided by:** Wyatt (owner), in session, 2026-09-05 — final, not pending
Joey's confirmation. Joey informed via issue #531. Spec:
`docs/specs/2026-09-05-one-source-three-surfaces.md` (now marked ratified).

- **D1 — Content source of truth = git seeds → published, versioned bundle.**
  Authoring stays in `supabase/seed/**` (the content agents are untouched);
  `scripts/build-content-bundle.mjs` publishes a hashed JSON bundle on every
  merge that web, iOS and Android all read through `packages/content`.
  Supabase keeps only dynamic data (devices, prefs, notification events,
  clown memory). *Rejected:* Supabase as the runtime content source — it
  re-creates the stale-production failure of #723/#725 and puts a DB call in
  every page load.
- **D2 — Two renderers, one headless core.** Next.js stays for the web,
  React Native for mobile; both consume `packages/experience`. *Rejected:*
  a universal react-native-web app — a full rewrite of a working 64k-line
  site with weaker SEO and performance.
- **D3 — Progressive native port, route by route, behind flags, with the
  WebView shell as fallback** until the last route lands. *Rejected:*
  big-bang rewrite behind the shell (months with nothing shipping).
- **D4 — EAS Update for JS-only mobile changes**, fingerprint runtime
  policy; store builds only when native code changes. *Rejected:* store
  builds only (the app would lag the web by days on every change).

**Why now:** the WebView shell (entry above) is a stop-gap; without these
four calls no Phase 1+ card in the spec was Ready. All phases are unblocked.

## 2026-09-05 — Mobile release train: iOS and Android ship as one unit, from EAS, never from a laptop

**Decided by:** Wyatt (owner), in session, 2026-09-05 — "I don't want one to
ever fall behind the other or we accidentally only push out fixes to half
of our users." Runbook: `docs/mobile-release.md`.

**What:** every merge to `main` touching `apps/mobile/**` or
`packages/**` triggers `apps/mobile/.eas/workflows/release.yml` (an EAS
Workflow, kicked off by `.github/workflows/mobile-release.yml`). EAS
fingerprints the commit's native layer for each platform; platforms whose
fingerprint already has a production build get ONE over-the-air update
group (both platforms in one job); platforms without one get a store build,
and **neither platform is submitted until both builds succeed**. An
independent check, `scripts/mobile/check-parity.mjs` (run by
`.github/workflows/mobile-parity.yml` every 6h and after every train),
raises one persistent alert issue if the platforms' latest builds or
updates diverge (`STRANDED_OTA`, `SPLIT_UPDATE`, `VERSION_SKEW`,
`BUILD_LAG`) or if it cannot run.

**Why now:** the 2026-09-05 manual builds of `main` failed on both platforms
in `CONFIGURE_EXPO_UPDATES` with a runtime-version mismatch — the
fingerprint computed on a Windows checkout of this monorepo differs from the
one EAS computes (hoisting paths for `@expo/config-plugins`). A laptop in the
loop is therefore not just a process risk but a correctness bug: a build
that did slip through would never match an OTA update. Separately, the Play
internal track was still on the 2026-08-30 bundle while iOS had moved to
build 4 — exactly the half-shipped state this rules out.

**Supersedes:** `.github/workflows/eas-update.yml` (OS-040), which
published per-platform, unconditionally, with no store-build path — removed.
The `production-local` iOS profile (PR #3809) becomes a stop-gap to retire
once HUMAN-ACTIONS #45 moves the iOS credentials into EAS.

**Human prerequisites (filed):** #44 `EXPO_TOKEN` repo secret; #45 iOS
credentials + ASC key into EAS; #46 Google Play service-account key into
EAS. Until all three exist the train fails loudly on both platforms rather
than shipping one.

**Alternatives rejected:** GitHub Actions running `eas build` per platform
with base64 secrets (puts signing material in a second secret store and
keeps the runner's fingerprint in play); keeping manual `eas build` +
manual Play upload (the failure mode this replaces).
