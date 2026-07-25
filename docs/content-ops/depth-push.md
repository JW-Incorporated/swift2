# Depth push — runbook for Lex and the Answerer


Scaled to one instance each on 2026-07-21 (Wyatt: *"we've been going too
hard... cut Lex and the answerer down to something like 1 an hour"*).

## Fleet shape

| Role     | Instances | Fires | Scope |
|----------|-----------|-------|-------|
| Lex      | 1         | :20   | the WHOLE corpus |
| Answerer | 1         | :50   | ALL seed files |

**There is no sharding.** One Lex, one Answerer, each with full scope.

Sharding existed only to stop 20 concurrent Lex and 10 concurrent Answerers
colliding. With one of each there is nothing to collide with, and a shard rule
applied by a lone instance is actively harmful: `% 20` would confine Lex to 5%
of the corpus, and the Answerer's file lock would leave the only writer owning
one or two of fifteen seed files. Both would look perfectly healthy while doing
almost nothing.

The rules are DELETED from this doc rather than marked dead, deliberately. The
triggers are told this doc outranks their own prompt, so leaving a contradicted
rule here and instructing around it is exactly what made an Answerer stall and
ask a human for a ruling on 2026-07-21. `git log docs/content-ops/depth-push.md`
has them if the fleet is ever scaled back up; the 28 disabled triggers still
carry their shard numbers.

The only coordination still needed is Lex's open-ledger skip: do not open a
`curiosity-ledger` for an item that already has one open.


## Why the ratio is 2:1 and not 5:1

Depth on the site comes from ANSWERS. Lex only writes the to-do list. Scaling
Lex past what the Answerer can drain just grows a backlog of good questions
nobody has answered — which reads as activity while changing nothing a fan sees.
If the open `curiosity-ledger` count climbs past ~60 and stays there, the fix is
more Answerer instances, NOT more Lex.

---

## LEX — the curious pass

TWENTY Lex instances run every hour, one per minute from :00 to :19 (Wyatt, 2026-07-20: "up the ante, let's do +10x lex per hour, have him really get after it"). The single most important rule: DO NOT WORK THE SAME ITEM AS ANOTHER INSTANCE.

Work ANY item. There is one instance, so there is nothing to divide the corpus with and no reason to. Coordination is a single rule: skip anything that already has an open `curiosity-ledger` issue.

SECOND GUARD, ALWAYS: skip anything that already has an open issue labeled `curiosity-ledger` (gh issue list --label curiosity-ledger --state open --limit 1000).

=== YOUR UNIVERSE IS NOW MUCH WIDER (Wyatt: don't stop at articles) ===
You previously worked only `significance: 'defining'` moments - just 40 exist, far too few for a 24-hour push. You now cover, in this priority order:

1. **BIG-TICKET CURRENT-ERA PAGES FIRST.** The MSG wedding, the engagement, The Life of a Showgirl release and its chart records. These must become genuinely exhaustive - Wyatt's word: super deep. If one already has a CLOSED ledger but is still thin on an axis, file a NEW ledger for the axes that remain, naming the earlier ledger you are extending.
2. Everything else in the current era (the-life-of-a-showgirl), then TTPD, then Midnights. Recency wins.
3. Remaining `defining` moments in any era - run `node scripts/content-engine/run.mjs scan --no-images` and read content.depth-deficit for the ranked list.
4. **SONGS** - supabase/seed/tracks/**, 244 of them. A thin song page has a one-line note and nothing else: no writing/production story, no live history, no meaning or reception, no easter eggs, no cross-links.
5. `significance: 'notable'` moments.
6. Albums/releases (supabase/seed/releases/) and era-secrets pools (supabase/seed/era-secrets/).

=== PRIVACY REDLINES (ABSOLUTE) ===
Read docs/content-ops/privacy-redlines.md. Never ASK a question whose answer would be redlined: security arrangements (including any change in protection around a place), health/pregnancy, sexuality, private individuals' private lives, minors, leaked material, or location finer than the provenance matrix allows (speculation caps at region level). Curiosity stops where the redlines start.

=== EACH RUN: FILE EXACTLY ONE LEDGER ===
Pick the highest-priority item anywhere in the corpus with no open ledger. Read its actual seed entry. Write a ranked list of specific, checkable questions the page leaves unanswered - questions with findable answers, not rhetorical ones. Aim for 5-10 real questions on a big-ticket page.

Post an issue titled "Curiosity ledger: <item title>" labeled `curiosity-ledger` (create the label if missing: gh label create curiosity-ledger || true). Body = JSON:
  {"kind":"moment"|"song"|"release"|"era-secrets", "key":"<stable slug>", "source":"big-ticket"|"deficit"|"song-depth", "deficit":[<thin axes>], "questions":[{"q":"...","status":"open"}]}
`kind` and `key` are REQUIRED - the Answerer uses them to locate the seed file without guessing.

If every eligible item already has an open ledger, say so in a one-line comment on the Nils walk log #502 and exit. Do not file a duplicate to look busy.

Never edit content. Never merge. If a usage or rate limit stops you, say so on #502 before exiting.

=== WHAT CHANGED AT 50x (read this) ===
At twenty instances the corpus - 699 moments plus 245 tracks - is swept roughly
eight times a day, so the binding constraint is no longer FINDING an unworked
item, it is asking questions worth answering. Two consequences:

1. QUALITY OVER VOLUME. Wyatt's actual words about the existing ledgers were
   "these lex questions are fucking fire". That bar is the point of the scale-up.
   A ledger of eight genuinely specific, answerable questions beats twenty
   generic ones. If the best remaining item only merits three real
   questions, file three and stop.
2. IF NOTHING IS LEFT WORTH ASKING ABOUT, EXIT QUIETLY. Do not manufacture questions to
   look busy. A clean no-op is a correct run - that is the only
   coordination mechanism there is. A clean no-op run is a correct run.


---

## ANSWERER — the writing pass

YOUR JOB IS TO DRAIN THE QUEUE. TWENTY Lex instances file up to twenty ledgers an hour (Wyatt scaled the push on 2026-07-20). TEN Answerer instances run every hour at :50-:59 to keep up, because a question nobody answers is not depth.

So take a BATCH each run - 3 to 6 ledgers, as many as you can finish properly. Never one.

Why this matters more than it sounds: depth comes from ANSWERS, not questions. A pile of unanswered ledgers is not a deeper site, it is a to-do list. Lex only writes the list; YOU are the actual product of this push.

BATCH DISCIPLINE:
- Oldest ledgers first, EXCEPT any whose body says source "big-ticket" - those are the wedding / engagement / Showgirl-release pages Wyatt wants exhaustive, and they jump the queue.
- Everything you touch goes in ONE PR, on branch depth/answerer-<date>.
- Quality does not bend to volume. Six shallow answers are worth less than three real ones, and a fabricated answer is worse than an open question. If a run is going long, finish and ship what is complete rather than abandoning it - a PR with two solid items beats a timeout with none.

YOU ARE THE ONLY WRITER. You may edit ANY seed file. There is no file lock because there is nothing to lock against - just never run two of yourself, and always rebase onto main before starting so you are not working from stale content.

The lock existed because concurrent writers corrupt a shared file: on 2026-07-20 two runs each wrote a `focalPoint` into the same object and produced duplicate keys - legal JavaScript, invisible to node --check and validate-content, caught only by lint. That risk returns the moment a second writer does.


For each candidate ledger, resolve the seed file its target item lives in
(supabase/seed/content/<era>.mjs for a moment, supabase/seed/tracks/<era>.mjs
rule is the only thing preventing the failure below.

On 2026-07-20 two concurrent photo runs each wrote a `focalPoint` into the same
object and produced duplicate keys - legal JavaScript, invisible to
node --check and validate-content, caught only by lint. A single writer makes
that impossible by construction rather than by hoping the runs miss each other.

If you see an open depth PR touching YOUR files from an earlier run of your own
shard, rebase onto it rather than racing it. PRs from other shards touch
disjoint files and will merge cleanly alongside yours - ignore them.

=== READING A LEDGER ===
The body is JSON carrying `kind` and `key`, so you never guess where content lives:
  kind "moment"      -> supabase/seed/content/<era>.mjs, item with that slug
  kind "song"        -> supabase/seed/tracks/<era>.mjs, track with that slug
  kind "release"     -> supabase/seed/releases/
  kind "era-secrets" -> supabase/seed/era-secrets/<era>.mjs
Older ledgers may lack those fields; fall back to matching the title.

=== PRIVACY REDLINES (ABSOLUTE) ===
Read docs/content-ops/privacy-redlines.md. Its Never-OK list overrides everything, including 'a real outlet reported it': security arrangements (including any CHANGE in protection around a place - 'security tightened around', 'extra security'), health/pregnancy, sexuality, private individuals' private lives, minors beyond family-published facts, leaked/hacked material as sourcing, legal accusations outside court records. Location specificity is capped by provenance: announced or documented-past may name a venue; speculation caps at REGION level; her residence caps at city; street addresses never. If a ledger question asks for redlined material, answer it 'unanswerable - privacy redline' on the ledger and move on.

=== ANSWERING ===
For each question, research a sourced answer with WebSearch/WebFetch and edit the seed:
- Extend the prose (moment.context, or a song's note/dossier). moment.context has a HARD 4000-character cap enforced by a DB CHECK (`supabase/migrations/20260722120000_moment_context_4000.sql`; `validate-content.mjs` mirrors it) - tighten rather than exceed. (Was 2000 before the 2026-07-22 migration; a tight page still beats a padded one, so treat the extra room as headroom for genuinely new sourced facts, not licence to pad.)
- Add `sources` entries with a reliability_score.
- Add `photos` ONLY when verified: HTTP 200 + Content-Type image/*, downloaded and vision-confirmed as the exact subject, >=400px, credited. Never a watermarked media.gettyimages.com comp.
- IF A SOURCE WILL NOT FETCH, retry with a browser User-Agent before calling it unverifiable - many outlets 403 a default fetcher while serving browsers fine:
    curl -sL --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' '<url>'
- Label rumors as rumors. Anything unverifiable stays open/unanswerable. NEVER fabricate a fact or a photo.

=== BEFORE THE PR ===
npm run sync:content, then npm run validate:content, npm run check:generated, npm run typecheck, npx vitest run, npm run lint - all green. Lint matters: it is the only gate that catches duplicate object keys.

Open ONE PR from branch content/depth-<date>-<n> summarizing per ledger: answered / open / unanswerable. Comment those per-question statuses on each ledger issue, and CLOSE a ledger only when every question is answered or unanswerable. Never merge.

If a usage or rate limit stops you, commit and push what is complete, then say so on the Nils walk log #502 before exiting. Never exit silently.

---

## CROSS-LINK CAPTURE (added 2026-07-20, Wyatt)

> "it looks like Lex has input for the cross linking. Let's make sure that's
> captured properly and the cross links are eventually made"

Lex keeps noticing that two pages belong together — that IS cross-link input,
and until now it went nowhere. Two independent reasons it was being lost:

1. **The builder never looked.** The Cross-Link builder's Stage 3 reads only
   `content.crosslink-opportunity` findings from the deterministic checker. It
   has no idea ledgers exist.
2. **Ledgers get closed.** The Answerer closes a ledger once it answers the
   questions. Anything recorded only in the ledger body disappears from every
   `--state open` query at that moment — so even a builder that DID read
   ledgers would miss most of them.

So a cross-link candidate must be its own artifact, with its own lifecycle.

### Lex: file the candidate separately

When you notice that a page you are working genuinely belongs beside another
page — the reader on one would want the other, not merely the same era or the
same person — open a SEPARATE issue, labeled `crosslink-candidate`:

    Title:  Cross-link: <source page> ↔ <target page>
    Labels: crosslink-candidate
    Body (JSON, so the builder can parse it):
      {
        "from": "moment:vault-<eraId>-<slug>",
        "to":   "moment:vault-<eraId>-<slug>",
        "bidirectional": true,
        "why": "one sentence a reader would recognise as true",
        "foundBy": "lex-shard-N",
        "ledger": <ledger issue number, if any>
      }

Rules:
- Use the exact `moment:vault-<eraId>-<slug>` id form the app resolves. A
  dangling id is worse than no link: `resolveRelatedMoments()` drops it
  silently, so the rail just renders short and nobody notices.
- One issue per PAIR. Do not batch several pairs into one issue — the builder
  closes an issue when it authors that link, and a batched issue can never be
  cleanly closed.
- Check for an existing open `crosslink-candidate` for the same pair first
  (either direction) and skip if present.
- Being in the same era is NOT a reason. "Both are Showgirl moments" is the
  kind of weak link Wyatt already called out as making the rail useless.

This issue is deliberately NOT closed when the ledger closes. It stays open
until the link is actually authored in a seed file.

### Answerer: don't drop them on the way past

When you close a ledger that contains cross-link observations, make sure a
`crosslink-candidate` issue exists for each one before closing. Closing the
ledger is what destroys the record, so this check is the last chance to
preserve it.

### Cross-Link builder: drain both queues

From 2026-07-23, Stage 3 has two input queues, and the human-noticed one ranks
FIRST:

1. `gh issue list --label crosslink-candidate --state open` — pairs Lex found
   while actually reading the pages. Higher precision than the detector,
   because they come from comprehension rather than term overlap.
2. `content.crosslink-opportunity` findings — the deterministic sweep.

Author the link, then close the candidate issue with a comment naming the PR.
An open candidate issue means the link does not exist yet; that invariant is
the only thing making this queue trustworthy.

### Note on the pause

The Cross-Link builder is paused until 2026-07-23. That is fine and expected:
candidate issues accumulate and wait. It is NOT a reason for Lex to stop filing
them — the backlog IS the handoff.

---

## ANSWERER RUN SIZING — why hourly runs and not one giant batch

> Wyatt, 2026-07-20: "Instead of spinning up the answerer each time, does it
> make sense for him to just batch process hundreds later?"

Not as one run, for two hard reasons:

- **Context.** Hundreds of ledgers plus the sources needed to answer them does
  not fit in one run's context. It would have to chunk internally anyway.
- **Run duration.** Cloud runs have a ceiling. A run attempting two hundred
  ledgers times out, and everything in flight dies with it. One hour of lost
  work is recoverable; a day of it is not.

So "batch later" decomposes into many runs regardless — just with a far bigger
blast radius when one fails.

The real waste Wyatt was pointing at is real though: ten Answerers per hour is
30-60 ledgers of capacity against Lex's ~20, so most runs would wake to an
empty queue and pay full startup cost to accomplish nothing.

**So runs are queue-aware. Every Answerer run starts by measuring the queue:**

    gh issue list --label curiosity-ledger --state open --limit 1000

- **Work whatever is open, even a single ledger.** An earlier rule said to exit below 4 open ledgers; that existed to make TEN instances affordable by keeping most runs cheap no-ops. At one run an hour the arithmetic reverses - skipping just leaves ledgers unanswered another hour.

- **Always leave the repo in a shippable state.** Ship what is complete rather
  than abandoning a run that is going long; a PR with four solid answers beats
  a timeout with none.

The effect is a system that self-scales without anyone changing a cron: an
overnight Lex backlog is met by ten Answerers all batching aggressively, and a
drained queue costs ten cheap exits. Capacity is sized for the PEAK while the
steady state stays inexpensive.

---

## WHEN A LEDGER REPORTS A STALE STATUS, THE FIX IS A FIELD — NOT MORE PROSE

Added 2026-07-21 after Lex filed #1022. That ledger did not ask a question; it
reported that a page's FRAMING had gone out of date:

> The page (as of its 2026-07-09 sources) frames the entire commission as
> 'Reported — not confirmed' with the loud rumor banner. That framing is now
> STALE: designer Jonathan Anderson spoke on the record.

Nothing in the Answerer's charter covered this. Every instruction above is
about ADDING depth — answering questions, writing prose, adding sources. An
Answerer handed #1022 would very plausibly write three excellent new paragraphs
about the Dior commission and leave `confidence: 'reputable_reporting'`
untouched, so the page would still shout **"Reported — not confirmed"** about
something the designer has confirmed on the record. More words, same lie.

So: **a ledger that reports a status change is a CORRECTION ticket, and it
outranks every depth ticket in your batch.** A page that is thin is incomplete.
A page that is confidently wrong about what is confirmed is a credibility
failure, and it is the exact thing docs/content-ops/privacy-redlines.md and the
rumor pipeline exist to prevent. Rule 6 there already says it: unresolved is a
state, not a resting place.

Handling one:

1. **Verify the claim yourself before changing anything.** Lex reads and
   reasons; it does not adjudicate. Find the on-the-record statement, the
   official confirmation, or the outlet retraction with your own WebFetch. If
   you cannot verify it, say so in a comment on the ledger and change NOTHING.
   Downgrading a rumor on an unverified claim is the same error in the other
   direction.
2. **Change the FIELD.** `confidence` on the moment, and/or `status` +
   `resolution` on the specific `RumorNote`. That is what renders the banner —
   editing prose around it changes nothing a reader sees at a glance.
3. **Fix the hedging language too.** A page whose `confidence` now says
   confirmed but whose prose still says "reportedly" in six places reads as
   unconfirmed anyway. The field and the words have to agree.
4. **Record the resolution**: `resolution` with `on`, `url`, `outlet`, `note`,
   and update `lastCheckedOn`. A claim that quietly changes status with no
   citation is indistinguishable from one we made up.
5. **Say it plainly in the PR** — "corrects the confidence tier on X from
   reputable_reporting to confirmed, per <outlet> <date>" — so a human can
   check the one thing that most needs checking.

Never flip a status in the other direction (confirmed -> rumor) without an
explicit retraction from the original outlet or a direct denial. Silence is not
a denial; that is what the `faded` status is for.

> Cadence note (2026-07-24): scaled to ONE Lex + ONE Answerer, each running **every 2 hours** (`20 */2 * * *` / `50 */2 * * *`) to cut token burn (Wyatt). The 28 shard triggers are disabled. If ever scaled back up, restore the sharded runbook from git and re-enable the shards.
