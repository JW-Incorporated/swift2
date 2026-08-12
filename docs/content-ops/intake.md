# Content intake — the single door for new Taylor events

Closes the process gap flagged on #464 (Joey drops real subject matter daily;
until the V2 engine ships, intake is manual — this defines it). Scope rule
(decision, 2026-07-11): the Vault covers **anything that has already
happened** — recency never disqualifies; what's deferred to V2 is the
*automated* pipeline, not recent content.

**Update (2026-07-18):** "later: the V2 engine" below is no longer
hypothetical — the News/Current pipeline exists (`apps/worker`, issue #468)
and is designed to feed this exact door once it's live (repo secrets +
seeded sources still pending, `docs/decisions.md`). It does **not** and will
**not** write directly to the Vault: a `news_story` row it produces is a
*drop*, same as anything Joey files by hand — it still goes through triage,
authoring, and check below. See "Where the V2 engine fits" at the bottom.

## New content's address: the current, ongoing era

**Anything new lands in whichever era is current/ongoing right now** — there
is always a place for it, by construction, because the current era never
"closes." As of 2026-07-18 that's `the-life-of-a-showgirl`
(`supabase/seed/content/the-life-of-a-showgirl.mjs`); when a new era begins,
this line updates to name the new one — new content follows the era
forward, it doesn't need a new surface built for it. (This is why #464's
three drafts turned out to already have a natural home: they're exactly
this — new events, distilled into the current era, same as any other
month item.)

## The flow

```
drop → triage → route → author → check → ship
```

1. **Drop.** Anyone or anything (today: Joey by hand; the `appearance-discovery`
   workflow daily; once live: the V2 engine's qualifying `news_story` rows too)
   files an `intake` issue via the form. Rough is fine; a link-less drop is fine
   to file.
2. **Triage** (content session, same day). **Amended 2026-07-20 (Wyatt) — the
   bar is no longer "is it true enough to publish".** Most Taylor news arrives
   as noise and only settles into fact weeks later, so the old bar meant the
   Vault could not cover the present tense at all. The new bar:

   > **Is this a claim we can later adjudicate, from someone we can name?**

   - **Confirmed and already-happened** → author it as fact. Sourcing bar
     unchanged: ≥1 source; `relationship`/`business` need two independent
     outlets.
   - **Reported but unsettled** → **admit it as a rumor** rather than reject
     it. It goes in a `rumors` entry with its outlet, date, `sourceTier` and
     `status: 'unconfirmed'`, inside the rumor container — never woven into
     confirmed narrative. The lifecycle resolves it later.
   - **Not adjudicable** → still refused. "X joked that he wasn't invited" has
     no truth value, so nothing can ever retire it and it would sit in the
     Vault forever. Reaction quotes and "fans are saying" pieces stay out.
   - **Redline material** → refused regardless of how well sourced, per
     `privacy-redlines.md`. Note the location rule was re-cut on 2026-07-20:
     specificity is capped by provenance (speculation → region level), not by
     tense.

   No sources found → comment what was searched, leave open with
   `needs-sources`; never author unsourced. Full design:
   `docs/content-ops/rumor-pipeline.md`.
3. **Route.** Split the event into one item per category (per
   `depth-rubric.md`), and stamp each with its author from the copy-desk
   routing table (`docs/specs/2026-07-11-persona-authors-copy-desk.md` §3;
   `scripts/copy-desk/routing.mjs` once built — until then, the beat table:
   music/release/video → Theo, theories/eggs → Loren, fashion/sighting →
   Vera, relationship/business/tour → Deb).
4. **Author.** The assigned persona drafts against its charter + house voice
   (`editorial-voice-and-pipeline.md`) into **the current era's seed file**
   (see above), as normal month items / moments — short, sourced,
   hotlinked, **and with a picture** (amended 2026-07-24: photos belong in
   ingestion, not a later backfill). Each authored moment ships with a
   verified `photos` entry OR an `moment.socialPost` Instagram embed when the
   item is about a post — Instagram is a first-class content source here. The
   sourcing/verification bar and the two routes are in the Content Shift
   charter step 3b (`docs/agents/content-shift.md`); the `photo-sparsity` and
   `social-post-missing` checkers are the fallback, not the primary path.
   Full articles are never the output (that was #464's core finding).
5. **Check.** `npm run validate:content` + Karen + Codex review, the normal
   pipeline. Nothing special because it's recent.
6. **Ship.** Content PR merges; the intake issue closes via `Closes #`.
   The evening brief's delta lists what shipped.

## Rules of the door

- **One door.** Events do not arrive via chat, DMs, or ad-hoc ticket shapes;
  if one does, whoever sees it files the intake issue and points back.
- **The drop is never the copy — regardless of who or what drafted it.**
  Attached drafts (a ChatGPT article, a Claude draft, a `news_story` the V2
  engine assembled, anything) are treated as *leads only*: every fact gets
  re-verified against real sources and re-written in fan-editor voice by the
  assigned persona before it ships. There is no fast path that skips
  triage/author/check because the draft "already sounds finished" or came
  with a high `verification_status` — a well-sourced-looking draft still
  gets the same re-verification as a rough one. Never paste-through, ever,
  from any source.
- **Same-day triage** is the desk's target while drops are daily; the brief's
  Health section flags intake items older than 48h untriaged.
- **Machine-filed drops get extra rules, not fewer.** `appearance-discovery`
  (`.github/workflows/appearance-discovery.yml`) files `intake: YouTube
  appearance — …` issues from curated channel RSS feeds, deterministically and
  with zero LLM. Detection is a keyword on a video title; nobody watched the
  video. Handling rules — oEmbed verification, dating by the event not the
  upload, and enriching an existing moment rather than duplicating it — are in
  `docs/agents/content-shift.md` § "YouTube appearance intake".

## Where the V2 engine fits (added 2026-07-18)

The News/Current worker (`apps/worker`, `docs/proposals/2026-07-07-news-
pipeline-architecture.md`) ingests, dedupes, and rules-first-verifies
candidate stories into its own `news_story` table — a separate data world
from the Vault by hard rule (`docs/decisions.md`, 2026-07-02), never
directly joined or exposed. It is a **triage assistant**, not a publisher:
its `verification_status` (official/corroborated/single_source/rumor/
disputed/debunked) helps a human or content session decide what's worth
turning into an intake drop, exactly like Joey eyeballing the news does
today — it doesn't change what happens once something *is* dropped. The
same voice, sourcing bar, no-fabrication rule, and Codex review apply
whether the lead came from Joey, ChatGPT, Claude, or the engine.
