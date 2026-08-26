# The Content Shift — the desk that actually writes

**Charter v1 — ACTIVE (Joey's directive, 2026-07-11).** The gap this closes:
#464–467 were *decided* into authorable work and then sat, because authoring
had no cadence — every content session was human-started. The Content Shift
is the standing writer: every run picks up the highest-priority authorable
work and ships it through the full pipeline. (It is the interim, chartered
form of the copy-desk's persona lane — when persona charters land (#462
Phase 1), shifts author *as* the routed persona; until then, house voice.)

## Era placement is by real-world date, never by subject (all content, all steps)

**Universal rule, not scoped to one queue source:** whatever you are
authoring — a moment, a video row, a theory, a current-tier promotion, a
rumor entry — the era it lands in is decided SOLELY by the real-world date
of the event/content itself. Never by which era's catalog the subject
matter, songs, or people referenced belong to. This applies at every step
below and to every seed type (`content`, `videos`, `theories`) and every
upstream source (Intake, YouTube-appearance intake, current-tier
promotions, rumor-desk).

The case that surfaced this as a gap: "The Icon Sessions at the Grammy
Museum," a real August 2026 performance during The Life of a Showgirl era,
was filed under `folklore.mjs` because the medley performed included
"august," a folklore song. Wrong — the event happened 2026-08-24, inside
`the-life-of-a-showgirl`'s date range, so it belongs in
`the-life-of-a-showgirl.mjs` regardless of which eras the songs performed
come from (fixed; see `docs/decisions.md` 2026-08-25). Compare the real
date against the ranges in `supabase/seed/eras-data.mjs` and author into
that era's file — always, even when every song/subject in the piece is
from a different era's catalog.

## Queue priority (deterministic, checked in order)

0. **Current-tier promotions** (`current_item` rows, added 2026-08-23 —
   knowledge engine Stage 8, proposal §6). Query: `current_item` where
   `status` in (`reported`, `confirmed`) and `source_tier` in (`official`,
   `established`) and `promoted_to` is null and `heat >= 0.5`, ordered by
   `heat` descending. Checked FIRST, ahead of Intake — the row already
   carries our-words copy, publisher sources, tags, a `social_post`/
   `image_url`, and a redline pass from the extract stage, so it is the
   fastest, cheapest-to-verify path from ingestion to the Vault. See
   "Current-tier promotion" below for the run mechanics and the throughput
   rule that replaces the 2-item cap for this source only.
1. **Intake** (`intake` label) with sources attached or findable — Joey's
   daily drops. Same-day is the target.
2. **Experience tickets** (`experience`, Nils) in severity order — thin
   periods, missing narratives, depth gaps.
3. **Launch-gate content work** — J3.5 rubric gaps (DEPTH), era depth batches
   (J3.5b), dossier waves (#440 phases, WORTHY).
4. Karen's `cie:fact` tickets when Kevin's stream is backed up (never his
   image protocol — that stays Kevin's). *Boundary clarified 2026-07-24:*
   Kevin's image protocol is for FIXING images Karen flagged on existing
   content; sourcing a picture for a moment YOU are authoring (step 3b) is
   yours and does not touch Kevin's lane.

## The run

1. Deterministic queue check (gh only); exit fast if empty.
2. Take the top item. **Research first:** real sources to the bar
   (≥1; two independent outlets for relationship/business; Deuxmoi only
   labeled low-confidence). No sources found → comment what was searched,
   label `needs-sources`, take the next item. **Never author unsourced.**
3. Write per the standards stack: `editorial-voice-and-pipeline.md`
   (fan-editor voice, Taylor-not-Swift, no AI-tells), `depth-rubric.md`
   (right-sized months), `song-annotation-standard.md` (tracks/dossiers),
   length caps. Seed files only (`supabase/seed/**`) — never UI code.
3b. **Ship it with a picture (amended 2026-07-24, Wyatt: photos belong in
   ingestion, not a later backfill).** Every moment you author lands with a
   visual, sourced now — not deferred to Photo Enrichment. Two routes:
   - **Instagram is a first-class content source.** If the item is ABOUT an
     Instagram post (announcement, endorsement, the photo it centers on),
     attach `moment.socialPost = { platform:'instagram', shortcode, label,
     postedOn }`, verified by loading `instagram.com/p/<shortcode>/embed` and
     confirming the account is `taylorswift` and the image matches the story.
     It renders inline via `MomentSocialPost` — the reader stays in the app.
   - **Otherwise a real photo:** >=1 verified `photos` entry on an allowlisted
     reusable host (e.g. `upload.wikimedia.org`) — `curl` HTTP 200 +
     `Content-Type: image/*`, downloaded and vision-confirmed as the exact
     subject, >=400px, credited. Never a watermarked `media.gettyimages.com`
     comp; never a signed/expiring CDN url (Instagram's included — embed
     those, don't hotlink).
   - Only if nothing verifiable exists: ship the text, note it in the ledger,
     and let the `photo-sparsity` / `social-post-missing` checkers route it to
     Photo Enrichment. A picture is the default, the gap the exception.
4. Validate: `npm run validate:content` zero errors + `node --check` per
   edited file + full test suite.
5. **Codex review, no self-rebuttal** (same rule as Austin) — **but
   DEGRADABLE, amended 2026-07-19.** If the Codex companion is not available
   in this environment, label the PR `needs-human-review`, say so in the PR
   body, and **continue to step 6**. Codex being unreachable must never stop
   the work from shipping to review.

   *Why this changed:* the previous wording ("mandatory") had no escape
   hatch, and because the charter outranks the runtime prompt, it overrode
   the prompt's degrade path. Codex is in fact unreachable from the cloud
   environment — every photo-enrichment PR carries `needs-human-review` for
   exactly this reason. So the shift could research and author an item, hit
   this step, and abort with the work discarded. Combined with the ledger
   comment sitting at step 7 (after the PR), an abort here left NO trace
   anywhere: no branch, no PR, no comment. Three consecutive runs on
   2026-07-19 did precisely that against a non-empty queue.
6. PR labeled `content-shift`, `Closes #<n>`, TL;DR format. **Human merge**
   — founders or an in-session pass; the shift never merges.
7. Ledger comment on the source ticket (what shipped, what was dropped and
   why — e.g. an unverifiable claim cut per the no-fabrication rule).
8. **Never exit silently (amended 2026-07-19).** If a run ends WITHOUT
   opening a PR — empty queue, an aborted item, a tool or environment
   failure, anything — say so before exiting: comment on the ticket you were
   working, or on the newest open `intake` issue, or on the Nils walk log
   (#502) if there is no ticket. A run that fails quietly is
   indistinguishable from a quiet news day, which is how the Vault sat at
   2026-07-10 for nine days with a green fleet.

## YouTube appearance intake (added 2026-08-12)

`appearance-discovery` (`.github/workflows/appearance-discovery.yml`) files
`intake` issues automatically from the RSS feeds of a curated channel list
(`scripts/appearance-discovery/channels.mjs`). They look like any other intake
item — title `intake: YouTube appearance — <channel>: "<title>"` — and enter the
queue at priority 1 like the rest. These extra rules apply to them, and only to
them.

**The detection is deterministic and UNVERIFIED.** Nobody watched the video. A
keyword matched a title. The drop is never the copy (rules of the door,
`docs/content-ops/intake.md`) applies with full force: the issue is a lead, and
a lead can be wrong about what the video even is.

1. **Verify the video exists and is what the title claims.** Fetch
   `https://www.youtube.com/oembed?url=<watch url>&format=json`. A non-200 means
   the video is private, deleted, or region-blocked — comment that and close;
   never cite a URL you could not load. Check the returned `title` and
   `author_name` still match the issue; a channel can retitle a video between
   detection and triage.
2. **Place it by published date, not by vibe.** Compare the published date
   against the era ranges in `supabase/seed/eras-data.mjs` and author into that
   era's file. This is the one case where the "new content lands in the current
   era" default does NOT automatically apply: the feed can surface an upload
   about an older era (an anniversary cut, a re-release, a vault clip), and the
   *event's* date governs, not the upload date.
3. **ENRICH before you create — this is the important one.** Most detected
   videos are coverage of a moment the Vault already has (an awards
   performance, an album announcement). Search the target era file for the
   moment first. If it exists, add the video to that moment's `sources` (and,
   where the video IS the artifact, consider `moment.socialPost`/photos per step
   3b) and ship that as the change. Do NOT author a second moment for an event
   already covered — that is how the same night ends up on the page twice, and
   the discovery lane will surface the same event from several channels on
   purpose (GMA and TODAY both cover one announcement).
4. **Category defaults to `music`** unless the item is plainly something else
   from the allowed set (`sighting`, `fashion`, `relationship`, `tour`,
   `business`, `music`, `release`, `video`).
5. **A `videos/<era>.mjs` entry is the exception, not the rule.** Only an
   official performance, documentary, or film — from the official channel or the
   rights-holder's channel — may become a `videos` row, and only when it fits
   the existing kind enum (`music_video`, `lyric_video`, `short_film`,
   `tour_film`, `documentary`, `performance`). Do not invent a kind, and do not
   widen the enum to fit a video: if it does not fit, it is a moment source, not
   a video row.
6. **A fan re-upload is NEVER a `videos` `officialUrl`.** Talk-show and awards
   channels re-post clips they own, which is fine; a fan channel mirroring a
   performance is not, and those links rot or get struck. If the only URL is a
   re-upload, cite it as a moment source at most, never as the official video.
7. **Not every detected video is content.** A title can match and still be
   nothing worth a Vault item (a listicle, a passing mention, a reaction
   segment). Close it with a one-line reason. Refusing is a normal outcome here
   and costs nothing; the filter deliberately favors precision but is still just
   keywords on a title.

## Current-tier promotion (added 2026-08-23, knowledge engine Stage 8)

Queue source (0) rows come from the knowledge engine's Actions-run ingest/
extract pipeline (`apps/worker/src/extract/`), not from a human or another
routine — the research, our-words summarization, source citations, and
redline pass already happened upstream, deterministically, before the row
ever reaches this queue. **The agent's job on one of these rows is narrower
than steps 2-3 above, not the same research-then-write loop:**

1. **Verify** — sanity-check the row's `sources`, `tags`, and copy against
   the linked publisher URL(s), the way you would any other fact; the
   upstream redline pass and source-tier filter (`official`/`established`
   only) mean this is a confirmation pass, not a from-scratch source hunt.
2. **Place** — same era-by-date rules as the rest of this charter (the
   current era by default; an older era only when the row's `observed_on`
   documents a past event, same reasoning as the YouTube-appearance rule
   above).
3. **Set confidence** per the standard `Confidence` scale (`types.ts`).
4. **Author the seed row** — `slug`, `year`/`month`/`day`, `sources` — same
   seed-file discipline as every other item (step 3 above): fan-editor
   voice, no fabrication, a picture per step 3b when one is verifiable.
5. **Set `promoted_to`** on the source `current_item` row to the new seed
   slug, so it stops being re-offered by this query and the site's dashed
   "Live" treatment yields to the promoted Vault entry.

Same PR path, same auto-merge, same gates as every other item this charter
authors — this is not a new workflow, just a new, cheaper queue source
feeding the existing one.

**Throughput for this source only:** the flat "≤2 items/run" cap under
Throttles below does not apply here. That cap exists to bound the cost of
*researching* an item, and for queue source (0) that research already
happened upstream, deterministically, before the row reached this queue.
Instead: the query's own `heat >= 0.5` floor (the extract stage's own
screening threshold, proposal §6) plus a WIP limit of 5 — no more than 5
`current_item` rows may be claimed (a branch/PR open against them,
`promoted_to` still null) at once. The limit counts `current_item` rows,
not `content-shift`-labeled PRs — the 2026-07-19 removal of a PR-count WIP
limit (below, under Throttles) doesn't apply here: that limit broke because
the `content-shift` label is shared with the unrelated photo-enrichment
bot's PRs, inflating the count with work this charter never did. Counting
rows in this new table sidesteps that collision entirely.

## Diagnosed failure history (2026-07-19/20) — read before debugging this again

**The shift has never opened a pull request.** Not once, across its whole
life. That was not obvious for days because the symptom looked like idleness.

What actually happened: it researched, authored, committed and PUSHED real
work — `content-shift/2026-07-15-pm` (Grammys AATW payoff, Swiftkirchen) and
`content-shift/2026-07-17-pm` (debut origin beats, folklore/evermore secrets
pools, 463 lines) — and then failed at PR creation and exited. Because the
ledger comment was step 7, *after* the PR, a failure at step 6 left no trace
anywhere: no PR, no comment, and branches nobody was looking at. Both branches
sat for days and were eventually superseded by other routines re-authoring the
same items, so the work was wasted twice over.

The one configuration difference between this routine and every routine that
does successfully open PRs (Photo Enrichment, The Answerer, Cross-Link, Mood
Chat) was that **this trigger had no MCP connections** — specifically it was
missing `Claude_Code_Remote`. Attached 2026-07-20.

Two lessons that outlive this bug:

1. **A pushed branch with no PR is a failed run, not a quiet one.** If you are
   debugging silence here, list `content-shift/*` branches on the remote FIRST
   and check whether each has a PR. Stranded branches are the tell.
2. Three separate hypotheses looked right and were not (WIP limit, prompt
   overload, the Codex gate). What settled it was noticing the routine had
   *never* succeeded, which reframed it from a regression to a config gap.
   Check "did this ever work?" before "what changed?"

## Throttles

≤2 items authored per run **from queue sources 1–4** (quality over volume —
these require real research each run); per-run token budget; never touches
an item a human is visibly working. Queue source (0) (current-tier
promotions) runs under its own heat threshold + WIP limit instead — see
"Current-tier promotion" above; that 2-item cap was protecting research
cost, and source (0)'s research already happened upstream.

**Removed 2026-07-19 (Wyatt): the "≥3 open `content-shift` PRs blocks new
runs" WIP limit.** It borrowed Austin's pattern, but it does not transfer:
Austin's PRs are all Austin's, whereas the `content-shift` LABEL is applied
by other routines too — the hourly photo-enrichment worker labels every one
of its PRs `content-shift`, and it is prolific enough to keep 3+ open around
the clock. So an unrelated bot could silently starve the authoring bot
indefinitely, and the failure is invisible: the run exits clean, writes no
ledger comment, and nothing reports that authoring was skipped. Throughput
is already bounded by ≤2 items/run and the twice-daily cadence; a WIP limit
on top of that only adds a way to stall. Merge-queue pressure is a founder
concern, not a reason for the writer to stop writing.

## Hard invariants

1. Seed/content files only — never app code, scripts, workflows, docs
   outside `docs/content-ops/` notes.
2. No fabrication, ever: every fact traces to a verified source or the
   detail is cut. Recency never lowers the bar.
3. Voice: Taylor in running prose; bare "Swift" only in formal contexts.
4. Never merges, never closes tickets directly, never weakens validation.
5. One checkout; comments/labels only on others' artifacts; latest human
   comment wins — always read ticket comments first.

## Cadence

Twice daily, 10:00 AM + 4:00 PM PT. Model: Fable.

## Audited by

Karen (every shift-authored item is scanned like all content), Codex
(per-PR), Nils (if shift output is thin, he files on it like anything
else), manager-hat telemetry (items shipped/run, rework rate).

## Migrating to a service

GitHub is the store; enforce queue order, caps, and invariants in code;
token scoped to contents+PR+issues.

## Amendments (2026-07-12, founder-approved)

1. **Claim-lease expiry:** same 24h rule as Austin's charter.
2. **Idle discipline:** an empty-queue exit must state which queues were
   checked; if all three priorities are empty AND launch gates DEPTH/WORTHY are
   not green, that is itself a finding — comment it on the walk log so Nils
   and Marjorie see the supply gap.
3. **Review rounds bounded at two**, then Marjorie's tiebreak.
