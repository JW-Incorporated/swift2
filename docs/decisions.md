# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

---

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

## 2026-08-06 — Instagram profile was a repeating slideshow: real-photo default, code-level guard

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

**Approved by:** Joey
