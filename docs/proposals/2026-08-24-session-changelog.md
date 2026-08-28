# Session changelog — 2026-08-24 through 2026-08-25 (early morning)

Covers everything closed on GitHub in this window: 930 closed issues total, of
which 85 are described individually below because they carried a real
substantive label (`bug`, `security`, `a11y*`, `experience`/`exp:*`,
`enhancement`, `growth`, `founder-decision`, `content`, `user-feedback`,
`documentation`, `deployment`, or `duplicate`). Automated snapshot/triage
noise (`needs-triage`, `intake`, `watchdog-alert`, `kevin-digest`, etc. with
no other substantive label) is excluded. 793 automated Content Integrity
Engine image-check issues and 32 other automated CIE findings are summarized
separately below rather than listed individually. Dependabot PRs are
excluded throughout.

---

## Automated cleanup: Content Integrity Engine (825 issues, summarized)

**`cie:image` — 793 issues closed.** This is almost entirely one systemic
false-positive: a transient-failure bug in the `image.liveness` checker (root
incident documented in #613 — an egress-proxy CONNECT-tunnel block on
2026-07-13 alone mis-flagged 80 images as broken with HTTP 403) that kept
re-flagging live, correctly-hosted images as "broken" or "fetch failed" on
every nightly run until the checker itself was hardened in PR #3213. A
sampled cross-section (18 issues spread across the full number range,
including all 5 non-generic "watermarked collage"/"JUST JARED watermark"
titles in the set) found every one closed the same way: re-verified live via
the repo's own `probe()` — HTTP 200/206, correct content-type and
dimensions — and marked a stale false positive, several with an explicit
"precedent: #611" citation back to the origin incident. That is not the whole
picture, though: a number of image-liveness issues in this cluster were
resolved via dedicated content-fix PRs (e.g. #3214 "repair five TTPD images,"
#3197 "replace rotted TTPD images," #3223 "resolve five stale image-liveness
findings") that did find and repair genuinely rotted Wikimedia/publisher
image links rather than just re-verifying them — so a real minority of the
793 did trigger an actual broken-image repair, not just a re-verify-and-close.

**`cie` (non-`cie:image`) — 32 issues closed.** A mixed bag of automated
findings: rollup tickets for `content.rumor-lifecycle` (stale "not confirmed"
banners that needed a fresh source re-check — several were resolved with
real new sourcing, and a couple were promoted from "reported" to genuinely
confirmed after a live web-search re-check, e.g. PRs #3186/#3187/#3189/#3238),
`content.image-overuse` and `content.social-post-missing` rollups (real
follow-up content work, e.g. PR #3252 replacing repeated album-cover
placeholder images), and one reclassification finding (#1915) where a
"safety redline" label was found to be misapplied to an ordinary long-field
formatting issue and the mislabel itself became the fix (see #1920 below).
One entry in the sample (#613) is the incident write-up for the whole
`cie:image` false-positive wave rather than a single finding.

---

## Security (7 items)

**#1972 — Auto-merge deny-list missing the request/data layer (P0)**
A red-team finding (2026-08-12) that the 2026-08-11 widening of content
auto-merge to app code left the request/data-layer route handlers without
the deliberate human-review carve-out the founders had kept.
Already fixed same-day by PR #1982, which added the `guard-code` job
(`scripts/automerge-content-guard.mjs`); the issue only stayed open because
that PR's body never used a GitHub closing keyword — closed here as
bookkeeping, not new work.

**#1969 — App-code auto-merge sits behind a soft-only content-lane boundary**
The path allowlist alone couldn't stop a content-lane identity (or an
injected/compromised agent riding one) from getting app-code edits
auto-merged from any branch, as long as the files fell inside the allowlist.
Fixed by PR #3182, which adds a branch/author gate to
`auto-merge-content.yml` and hardens env-secret detection in the same pass.

**#3180 — Auto-merge guard misses destructured `process.env` reads**
`automerge-content-guard.mjs`'s secret-read detection only matched the
literal `process.env.NAME` string, so `const { KEY } = process.env` and the
`node:process` import-alias form sailed through undetected. Fixed in the
same PR as #1969 (#3182), since both touch the same trust boundary.

**#1965 — `sourceTier` is self-declared with no reputable-source allowlist**
A rumor's `sourceTier` (official/established/tabloid/social) was
self-declared by whatever content lane authored it, with only an
enum-membership check — laundering fabrications and, worse, an unverified
`official` tier disabled RR4, the one hard-blocking redline gate. Fixed by
PR #3171, adding a real allowlist behind the `sourceTier` claim.

**#1968 — Image/oEmbed vision-confirm spoofable; image-host allowlist advisory not blocking**
The photo-enrichment pipeline's image-host allowlist was advisory rather
than a merge gate, so an attacker-controlled page could spoof the
vision-confirm step. Fixed by PR #3174, which makes the allowlist an actual
merge-blocking gate (a related CSP report-only→enforcing flip was
deliberately left out of this PR as a separate decision).

**#1973 — Feedback rate limit trivially bypassable**
`apps/web/app/api/feedback/route.ts`'s rate limit keyed off the
client-supplied, client-rotatable leftmost `X-Forwarded-For` value —
unlimited anonymous GitHub issue creation. Fixed by PR #3168, which switches
to the Vercel-set IP header.

**#1974 — Feedback issue body: markdown link/image injection**
`defangGitHub()` only neutralized `@`/`#` autolinks, leaving markdown
link/image injection open in free-text feedback bodies. Fixed in the same
PR as #1973 (#3168), which fences the injection surface.

## Accessibility (7 items)

**#729 — Overlay content sits outside any landmark (axe `region`)**
The eras-menu overlay, share sheet, and moment-detail view rendered content
outside any ARIA landmark, so screen-reader users navigating by landmark
missed it entirely. Fixed by PR #3173, giving the share sheet real
`role="dialog"`/`aria-modal`/labelled-name semantics.

**#657 — MomentDetail and EraSelector overlays aren't real modal dialogs**
Keyboard focus could escape a supposedly-modal overlay into the hidden page
behind it (WCAG 2.4.3/4.1.2/1.3.2). A later re-walk found the "Search overlay
is a clean reference" assumption from the original filing was itself wrong —
Search had the same defect. Fixed by PR #3176, which added a shared
`useFocusTrap` hook and wired it onto MomentDetail and EraSelector.

**#3177 — Extend the focus-trap fix to the 5 remaining overlays**
Follow-up to #657: TrackGuide, TheoryGuide, ShareSheet, the feedback panel,
and SearchOverlay still had the same escaping-focus defect. Fixed by
PR #3183, reusing the shared `useFocusTrap` hook from #657's fix.

**#659 — Color-contrast failures on small theme-tinted text**
Three measured WCAG 1.4.3 failures (content-tag pill 4.42:1, band label
2.18:1, clue glint 2.02:1), plus an escalation from a later 12-theme sweep
that found one more low-contrast instance. Fixed as part of a batched P2
pass, PR #3178.

**#834 — Photo lightbox zoom is pointer-only, no keyboard zoom/pan**
The full-screen photo lightbox shipped with mouse/touch zoom only, with no
keyboard equivalent (WCAG 2.1.1/2.5.7). Fixed in the same batched pass as
#659 (PR #3178), which adds keyboard zoom/pan to the lightbox.

**#835 — Feedback form outcomes are silent to screen readers**
No live region announced success/error on the feedback form, and the
textarea was named only by its placeholder (WCAG 4.1.3). Fixed in the same
batched pass as #659/#834 (PR #3178).

**#1991 — Mobile nav and tap-target friction (4 findings)**
A first-time mobile-user pass found an icon-only, unlabeled mode toggle
below `sm`, ~28px/11px toggle tabs, `text-xs` receipt links, and a Mood
auto-scroll that stranded the text input off-screen. Fixed by PR #3175,
which resolves three of the four cleanly and partially addresses the fourth
(documented in the PR).

## AI surfaces — Clownbot & Mood (16 items)

**#1995 / #1992 — Production served both AI surfaces permanently degraded**
Every live `/api/clownbot` and `/api/mood` request was returning the
canned "writing hand off duty" / keyword-only response with no
observability, traced to a missing `ANTHROPIC_API_KEY` in production. Fixed
2026-08-24 by adding the key as a real deployment secret; verified live
against `www.longlivets.com` directly (`source:"model"`, `degraded:false`)
before closing both duplicate reports of the same root cause.

**#1994 — Clownbot's single-longest-term retrieval fallback surfaced junk receipts**
The AND-across-all-terms-then-fall-back-to-longest-single-term retriever
routinely pulled the least informative term (e.g. a Pride-parade receipt for
a reputation-TV question). Closed as stale/resolved — the entire
`clownbot-receipts.ts` mechanism this issue names no longer exists,
replaced by `clown-retrieve.ts`'s corpus-search retriever in the
2026-08-14 Clownbot rebuild (PR #2087/#2103).

**#1990 — 3 of Clownbot's own suggested-prompt chips dead-ended**
Tapping several authored chips returned the "nothing in the vault" refusal.
Closed as stale/resolved by the same 2026-08-14 rebuild — chips are now
`BoardItem`s with an authored `prompt` field, and the specific dead-ends no
longer reproduce.

**#1993 — "Give me YOUR best theory" was structurally unanswerable**
The route discarded the model's own take whenever retrieval found zero
receipts, so the bot's marquee "bring your own theories" pitch couldn't
answer its most natural prompt. Closed as stale/resolved — the single-shot
compose-or-discard pipeline this issue traces no longer exists in the
current route.

**#1996 — Clownbot's canonical theory-name registry mislabeled takes**
"Debutation" got slapped on unrelated takes and "The Machine Question" was
unreachable, because names were chosen by registry order rather than
evidence. Fixed by PR #3192, which scores canonical-name candidates by the
dominant cited receipt.

**#1997 — Clownbot's rumor shelf was thin exactly when the fandom was loudest**
8 lore items total, 0 marked live, and the refresh loop had never fired.
Fixed in the same PR as #1996 (#3192), which gives the rumor shelf a real
scheduled owner and refreshes it with currently-verified items.

**#1998 — Clownbot's "51 called, 3 clowned" ledger read as a brag, not a confession**
The confirmed-outcomes count was padded with easter eggs and "common
readings," undermining the ledger's own stated pitch of showing losses
honestly. Fixed by PR #3195, which counts only genuinely confirmed
easter eggs.

**#1999 — Mood's degraded fallback didn't speak Swiftie**
Core fandom idiom ("villain era," "hyped for the drop") returned "I
couldn't quite catch a feeling." Fixed in the same PR as #1998 (#3195),
teaching the keyword fallback more fandom-specific language.

**#2000 — Mood picks resolved single-axis ties alphabetically**
"Nervous about TS12" mapped to five tied songs broken by slug order
(reading as grief), and the "feral about a bridge" flagship chip had
drifted from its documented tuning. Fixed in the same PR as #1998/#1999
(#3195), replacing alphabetical tie-breaking with catalogue-informed ranking.

**#1985 — Mood answered "I just want to feel less alone" with crush/desire songs**
A heartbroken-fan persona test got August/Cruel Summer/Dress-type songs for
a loneliness prompt. Already fixed and merged by PR #2005 ("grief-gate the
canon"); the merge just hadn't triggered auto-close.

**#1986 — Mood's keyword lexicon missed the core breakup script**
Rumination/self-blame phrasing and present-tense "leaves you" both returned
"unclear." Already fixed by the same PR #2005; closed as a bookkeeping fix.

**#1988 — Mood's keyword path failed the casual register**
Low-effort inputs ("meh," "bored," "idk," "just got a promotion!!") got a
shrug, while "stressed about work" over-matched to grief songs. Already
fixed by the same PR #2005; closed as a bookkeeping fix.

**#1981 — Mood's keyword path over-refused hyperbole**
"This is killing me" / "I could die of embarrassment" tripped the crisis
gate and returned zero songs. Fixed by PR #2002, which adds fallback
vectors for hyperbolic idiom while preserving the real crisis-check boundary.

**#1987 — Clownbot is jargon-walled for casual fans**
"Clowning," "delulu," and "egg" were never explained, 8 of 9 prompt chips
assumed deep lore, and asking "what is clowning?" dead-ended. Fixed by
PR #3199, which teaches Clownbot to explain its own jargon and adds
newcomer-friendly prefills.

**#3253 — Clownbot memory/prediction writes could silently fail or half-persist**
A retroactive Codex review found fire-and-forget `void ... .catch(() => {})`
writes with no completion guarantee, so a conversation turn could
half-persist. Fixed by PR #3263, which keeps the response stream open until
memory/prediction writes finish and writes the turn atomically.

## Content & story depth — era timelines (17 items)

**#1855 — Curated-vs-curated duplicate moments (Showgirl Rock Hall ×2, 2 Midnights pairs)**
Three duplicate pairs shared identical photos across curated moments. Two
of three were already fixed under the earlier #616 dedup pass; the last
live duplicate (a Sept. 24 Chiefs game card) was fixed by PR #3188.

**#1856 — "The Songs" chips under Blank Spaces/End Game relationships were dead text**
Song chips listed under relationship entries (Gyllenhaal, Alwyn, Kelce)
weren't tappable and didn't reach the actual track page. Fixed by PR #3190,
wiring 38 guide-backed song chips to their real Track Guide pages.

**#1141 — evermore was systematically under-told vs. sister album folklore**
No native "defining" surprise-drop beat, and four standard tracks (ivy,
dorothea, long story short, closure) had no story at all. Fixed across two
passes — PR #1740 authored the missing surprise-drop beat, and PR #3196
closed the remaining sourcing gaps for the four tracks.

**#828 — Lover era opened mid-story, skipping its own ignition beat**
The timeline started at the June 2019 masters sale instead of the April
2019 pastel turn / "ME!" release that actually opens the era. Fixed across
two passes — PR #1625 authored the new opening beat, PR #3198 added direct
claim-level sourcing to it.

**#651 — Blank Spaces "Married" resolution banner never rendered**
An id mismatch (`entry.id === 'kelce'` vs. the real `'rel-kelce'` id) meant
the wedding-resolution banner silently never showed, and a re-audit found a
second matching location the original fix spec had missed. Fixed by
PR #3202.

**#720 — Speak Now milestone dated before the album's own release**
The million-copies milestone and several other items carried fabricated
pre-release dates; a fresh verification found two of the originally-named
items were actually correctly dated already. Fixed across PRs #1646/#2244
(song-origin dates) and #3204 (debut's conflicting "Our Song" #1 date).

**#615 — Engagement story stated the debunked proposal location in 2 of 4 tellings**
"Lee's Summit, Missouri" (Ed Kelce's on-air misspeak, corrected by KCUR the
next day) still appeared as fact in two curated tellings while a third
correctly said Leawood, Kansas — a live self-contradiction across surfaces.
Fixed by PR #3205.

**#696 — 8 of 12 era timelines stacked 8–17 same-day cards into a scrubber wall**
Release-day pileups (folklore 17 cards, TTPD 15, evermore 13, midnights 12
on their respective release dates) broke the "descend day by day" promise
of the timeline scrubber. Fixed by PR #3224, collapsing same-day track
stories into one expandable "release day, track by track" card.

**#616 — Curated and vault-synced content duplicated the same moment**
Hand-curated items and vault-synced retellings described the same events
under different ids in ~9 of 11 eras, both rendering. Already fixed by
PR #1618; closed here because the merge didn't trigger auto-close.

**#743 — Fearless era imagery was low-quality**
Album-cover thumbnails standing in for life-moment photos, plus watermarked
Getty comps. Fixed by PR #3237, replacing the remaining low-quality Fearless
images with probed, unwatermarked photos.

**#1553 — Blank Spaces solo periods were one-line captions for multi-year stretches**
`single-2013` (26 pivotal months — the Red→1989 pivot) got 13 words. Fixed
by PR #3194, expanding five thin solo periods into sourced multi-sentence
stories.

**#719 — Fearless's Kanye story stopped halfway, missing the Beyoncé/Obama aftermath**
No aftermath beat, no album-release event beat, and the TV re-release was
absent from every Fearless surface but the title. Fixed across two passes —
PR #1594 folded in the Obama/Beyoncé aftermath, PR #3217 added the release-day
chart item and a Fearless (TV) cross-link.

**#460 — Theories & eggs section read thin (content gap, not a bug)**
Per-era theory/egg counts were sparse enough to look broken. Re-verified
against fresh `main`: counts have grown substantially since filing (e.g.
evermore 1→7, 1989 1→6) — closed as already resolved with no code change
needed.

**#770 — User feedback: TTPD and The Life of a Showgirl content "overlap"**
A real in-app feedback report. Re-checked against the current corpus: zero
shared primary source URLs between the two eras; the apparent overlaps are
connected-but-distinct dated events (separate chart records, separate
Chiefs appearances) that already cross-link each other. Closed as
not-a-bug.

**#645 — "our songs still aren't good"**
Closed as a confirmed duplicate of #440, the tracker epic for the ongoing
Track Guide content overhaul, which has landed several content waves since
(Speak Now, debut, and further eras).

**#461 — Site-wide voice violation: content called her "Swift" more than "Taylor"**
A full-corpus check found bare "Swift" outnumbering "Taylor" everywhere,
not just the specific file a founder flagged. Verified as fully resolved
with no PR needed — a full `check:voice --all` run over 1,182 items found
zero remaining voice violations.

**#617 — End Game thread had zero beats between the proposal and the wedding**
An 11-month gap sat untold in the marquee proposal→wedding thread. Verified
already fixed by PR #2244 (merged 2026-08-19, an ancestor of the branch
checked); the timeline now has the intermediate beats. Closed as a
bookkeeping fix.

## Content & story depth — track pages and navigation (9 items)

**#459 — Track Guide theme pills looked clickable but did nothing**
Rounded-pill styling visually matched the app's real clickable filter
chips, misleading users. Fixed by PR #2412, which de-styles the theme tags
into a plain label/value row rather than building out a click-through
taxonomy.

**#773 — Track pages had no top-level nav; the close button was hard to find**
Fixed by PR #3191, which keeps the Long Live wordmark and current-era
control pinned at the top of track guides and individual song pages.

**#774 — No way to move between tracks without backing out to the guide**
A founder ask for smooth next/previous navigation. Fixed by PR #3270,
adding swipe-left/right on mobile and always-visible gutter chevrons on
desktop.

**#458 — Track Guide facts card redundantly repeated the album name; fields were inconsistent**
The "Released" row read e.g. "The Tortured Poets Department · [date]"
instead of just the date, and field coverage varied across songs. Fixed
across two earlier PRs (#633 fixed the redundant row, #452 shipped facts
data for all 244 songs); a fresh audit confirmed all 244 tracks now carry
complete facts data.

**#652 — Search results couldn't reach the actual song, video, or thread**
Song results dead-ended, video results dumped on the era page, and threads
weren't searchable at all. Fixed by PR #3212, so song/video/thread results
now navigate to their real destination.

**#655 — Crossings overlay thread dots weren't tappable**
The overlay invited "tap a crossing" but its dots were `aria-hidden`
hover-only spans, dead on mobile, and named moments in plain text with no
link out. Fixed by PR #3209.

**#721 — 20 video-library cards had no playable video (`youtubeId: null`)**
The original filing undercounted the scope — a re-scan found 20 of 65 video
cards were null, not 4 — plus a misfiled "Change" video and two entirely
missing music videos. Fixed by PR #3211, which corrects the misfiling and
adds the two missing videos (the remainder of the null-id backlog is
tracked separately per the re-scan's broadened scope).

**#746 — Site-wide image cropping ignored faces/subjects, centering on middle pixels**
A founder requirement that all images crop around the actual subject. Fixed
by PR #3193, extending existing per-photo focal points to survive every
crop surface (thread cross-links, share cards, galleries).

**#771 — Missing YouTube embeds on track pages**
Track pages needed an embedded player so fans could play the song directly.
Fixed by PR #3169, which adds a regression test proving the coverage from
an earlier fix (#780) actually holds site-wide.

## New features / enhancements (8 items)

**#441 — Karen (the content-integrity engine) had no check for content depth or cross-links**
It could catch dead links and safety issues but had no mechanism for thin
content or missing cross-links. Closed as stale — all three requested
checkers (depth-deficit, photo-sparsity, crosslink-opportunity) already
exist and run on every pass; none had used a closing keyword, so this was
ticket-hygiene drift rather than a real gap.

**#915 — News clustering: measured the similarity threshold before touching it**
A follow-up investigation recorded that lowering `SIMILARITY_THRESHOLD`
(the obvious-looking fix for duplicate-story clustering) would have been
wrong, based on real measurement. Fixed by PR #3181, adding regression
coverage for the measurement rather than changing the threshold.

**#842 — Content-significance weighting: architecture shipped, retroactive tagging was follow-up**
Tracked whether the "defining"/"notable" significance tagging got applied
retroactively across older eras. Closed — the full retroactive pass (20
career-defining events tagged) completed the day after filing, across
several rounds that just weren't linked back to this ticket.

**#1017 — Feed card size should track article substance, not just recency**
A founder architecture spec: short articles should render smaller, "meaty"
ones larger. Closed as already resolved — both halves (a composite
`substanceScore` and the `assignFeedTiers` consumer) are merged on `main`.

**#955 — Backlog: search button, shop index page, makeup coverage**
Three queued asks from a founder session. Fixed by PR #3240 (Stylist queue
now sources named makeup products/shades); the search and hero-zoom items
were found already shipped and were verified directly in the browser.

**#480 — Kevin's Stream 2/3 digests should post as Founders' Brief sections, not separate issues**
Per the approved operating model, founders should read one daily artifact.
Fixed by PR #3241, which posts Kevin's digests as comments on the day's
`founders-brief` issue instead of standalone issues.

**#634 — Mobile navigation needed an overhaul (release-blocking)**
Top-bar element crowding on mobile. Closed as already resolved — the
Eras/Threads toggle redesign (PR #683) and mobile launch-readiness gate
(PR #863) both landed, and the founder confirmed it directly on a real
device.

**#511 — Refactor the one remaining content-inertness allowlist exception**
`the-life-of-a-showgirl.mjs` was the sole file with a member/element-access
exception to the content-inertness security grammar. Implemented by
PR #3184, which found the premise had gone stale (10 more files had picked
up the same exception shape) and inlined all 11 rather than just the one.

## Growth & social (4 items)

**#1911 — 11 X posts died silently since 07-21 on an apparent credential fault**
Filed as a 403 token-permission problem requiring a founder to re-issue
credentials. Closed as stale — the real root cause was a misdiagnosis: the
poster was hitting X's 280 weighted-character limit on long URLs, not a bad
token. Already fixed same-day it was filed, by PR #1937; X has posted
successfully since.

**#2218 — Instagram photo corpus collapsed to 1 usable photo**
The 2026-08-15 third-party image policy removed Getty preview comps,
leaving only one license-clean photo and most upcoming IG slots unfillable.
Fixed by PR #3254, adding 3 real CC BY 2.0 Eras Tour photos rehosted from
Wikimedia Commons.

**#3273 — One of the 4 newly-cleared IG photos was mislabeled**
`taylor-folklore-eras-inglewood-2023.jpg` (added by #2218's fix) actually
showed the Speak Now caped-gown look, not folklore — would have shipped a
wrong era-to-image pairing on a folklore post. Fixed by PR #3276, which
removes the file (no accurate substitute with Taylor visible was found); a
follow-up audit of the other 3 corpus files found them correctly labeled.

**#864 — Instagram draft queue was found completely empty**
A founder report that #social on Slack showed nothing to approve. Closed —
both underlying asks (draft the launch-week queue, and a daily scheduled
drafting runner) were already done by earlier work (PR #1153, merged
2026-07-21) that just hadn't been reconciled back to this ticket.

## Legal / licensing (1 item)

**#935 — 17 distinct Getty comp URLs hotlinked across 4 era files, licensing undecided**
Flagged for a founder decision rather than letting unlicensed hotlinks
accumulate. Resolved: the founder's chat decision (recorded in
`HUMAN-ACTIONS.md` #19) was "retire and replace with real," carried out by
PR #3232 (replaced the watermarked comps) and PR #3246 (retired the
remaining Getty comp URLs from seed content entirely).

## Mobile platform (1 item)

**#530 — Android app: engineering done, execute the Play Store go-live checklist**
Substantial engineering already existed in two stale draft PRs (#42, #67)
including a full shipping-checklist runbook. Closed — the founder confirmed
a real-device pass on Android directly (2026-08-24); next step is Play
Store submission per the existing checklist.

## Process, CI & infrastructure (14 items)

**#2074 — `guard-code` step could never emit its verdict under `set -e`**
The auto-merge workflow's guard step assumed it ran without `set -e`, but
GitHub Actions runs `run:` blocks under `bash -e` by default, killing the
step before it could emit a verdict on a real decline. Closed as already
fixed — the same root cause as #2113, fixed by commit 90a11b4d (PR #2139)
which was already on `main`; this issue was filed a day before #2113's fix.

**#618 — SessionStart hook used Windows-only syntax, littering a stray file on Linux runners**
`2>nul & exit 0` created a literal file named `nul` on every Linux/cloud
session. Fixed by PR #3167, making the redirect POSIX-portable.

**#489 — CIE same-date run reports overwrote each other**
Multiple Content Integrity Engine runs on one UTC day clobbered the same
audit-report filename. Fixed by PR #3170, alongside #487's fingerprint fix.

**#487 — CIE issue fingerprints weren't stable, and dedupe wasn't hardened against GitHub search lag**
Reslicing/rewording around the same defect minted a new fingerprint and
filed a duplicate issue; a further defect (a dedupe function permanently
suppressing regressions) was documented as a deliberate handoff rather than
touched directly, to avoid two agents editing the same function. Fixed by
PR #3170.

**#2031 — Instagram posted the same item 3× with an off-standards image**
A safety gate tightened that week silently blocked the "already posted"
ledger write, so each run thought the post was still pending. Re-verified
2026-08-24: both root causes (allowlist gap, stale-ledger race) were
already fixed by #2039, confirmed present on `main` with passing regression
tests.

**#1897 — Instagram published before its media container finished processing**
A race in `postToInstagram` cost one real post (the "scarf is a metaphor"
deep cut). Re-verified as already fixed by #1924, which added
`waitForContainerReady` polling with a bounded timeout.

**#1641 — CI `build` was red on `main` for 24+ hours, freezing all merges**
An environment issue (not content) starting at a specific squash-merge.
Closed as stale/confirmed resolved — `main`'s CI runs were all green at
close time.

**#1606 — `assemble-brief.mjs` couldn't run in the Marjorie sandbox (proxy blocks GitHub search API)**
Three consecutive morning brief runs had failed. Closed — the same defect
was diagnosed one layer deeper and fixed under successor issue #1869, plus
a proxy-transport fix in #2008; current code no longer uses the blocked
search-API namespace.

**#529 — Verify Content Shift's 2×/day authoring cadence was actually wired**
Closed as premise-obsolete — Content Shift no longer exists as a standalone
routine; it was folded into the Vault Run's lane structure per an
2026-08-23 decision, so there's no separate cadence left to verify.

**#1241 — Depth-fleet restore to full cadence failed (0/30 triggers enabled)**
Closed as premise-obsolete — the 30-shard architecture this issue describes
no longer exists; both fleets were consolidated to a single instance per
lane in a later migration (#2258).

**#1920 — CIE's `cie:safety` label was applied by checker-name prefix, catching benign formatting findings**
Once Kevin correctly started refusing to auto-fix anything labeled
`cie:safety`, the mislabel permanently parked ordinary formatting tickets
(e.g. "field is over 2000 chars") in the founder-escalation queue. Fixed by
PR #3172, gating the label on actual severity instead of checker-name prefix.

**#522 — longlivets.com served a stale build (Vercel multi-project reconciliation)**
Production was pinned to an old deployment on a project that had stopped
advancing. Closed as verified-resolved — fixed same-day (2026-07-12) by
consolidating onto one Vercel team/project with `www.longlivets.com` as
canonical; the issue itself just was never closed at the time.

**#3255 — Watchdog could pick the wrong CIE report on a same-day rerun**
A retroactive Codex review found the watchdog's report-selection used a
plain lexical sort that breaks on same-day timestamped filenames, and it
never alerted when the reports directory was empty. Fixed by PR #3262.

**#3256 — Era-reader "return point" could be discarded by an unrelated back navigation**
A retroactive Codex review found the LIFO return-point stack would
incorrectly consume/discard a doorway's saved position on any back
navigation, not just the matching one. Fixed by PR #3265, which only
consumes a return point whose mode and era match.

## User feedback: not actionable (1 item)

**#1898 — "You're a doofus"**
An in-app feedback submission with no accompanying complaint or bug report
beyond the message itself. Triaged and closed as noise — the feedback
channel captured it correctly, but there was no actionable signal in it.
