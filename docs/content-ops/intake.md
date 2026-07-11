# Content intake — the single door for new Taylor events

Closes the process gap flagged on #464 (Joey drops real subject matter daily;
until the V2 engine ships, intake is manual — this defines it). Scope rule
(decision, 2026-07-11): the Vault covers **anything that has already
happened** — recency never disqualifies; what's deferred to V2 is the
*automated* pipeline, not recent content.

## The flow

```
drop → triage → route → author → check → ship
```

1. **Drop.** Anyone (today: Joey; later: the V2 engine) files an `intake`
   issue via the form. Rough is fine; a link-less drop is fine to file.
2. **Triage** (content session, same day): is it real and already-happened?
   Find real sources — the sourcing bar is unchanged (≥1 source per item;
   `relationship`/`business` need two independent outlets; Deuxmoi only as
   labeled low-confidence). No sources found → comment what was searched,
   leave open with `needs-sources`; never author unsourced.
3. **Route.** Split the event into one item per category (per
   `depth-rubric.md`), and stamp each with its author from the copy-desk
   routing table (`docs/specs/2026-07-11-persona-authors-copy-desk.md` §3;
   `scripts/copy-desk/routing.mjs` once built — until then, the beat table:
   music/release/video → Theo, theories/eggs → Loren, fashion/sighting →
   Vera, relationship/business/tour → Deb).
4. **Author.** The assigned persona drafts against its charter + house voice
   (`editorial-voice-and-pipeline.md`) into the era seed file, as normal
   month items / moments — short, sourced, hotlinked. Full articles are
   never the output (that was #464's core finding).
5. **Check.** `npm run validate:content` + Karen + Codex review, the normal
   pipeline. Nothing special because it's recent.
6. **Ship.** Content PR merges; the intake issue closes via `Closes #`.
   The evening brief's delta lists what shipped.

## Rules of the door

- **One door.** Events do not arrive via chat, DMs, or ad-hoc ticket shapes;
  if one does, whoever sees it files the intake issue and points back.
- **The drop is not the copy.** Attached drafts (e.g. ChatGPT articles) are
  treated as *leads*: facts get re-verified against real sources and
  re-written in-voice by the assigned persona. Never paste-through.
- **Same-day triage** is the desk's target while drops are daily; the brief's
  Health section flags intake items older than 48h untriaged.
