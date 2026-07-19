# Privacy Redlines — what Long Live will and will not publish

**Status:** v1, 2026-07-19 (Wyatt's directive, raised against the rumor system:
"rumors get close to violating some Taylor privacy stuff we want to preserve,
such as doxxing"). This is the single source of truth for content privacy.
Every content-writing bot's prompt cites this file; the enforcement layers
below implement it. If a rule here conflicts with anything else — including
"a real outlet reported it" — **this file wins**.

## The one-sentence policy

We cover what's reported about her public life; we never help anyone locate,
diagnose, or expose her or the people around her.

## ✅ Always OK

- What Taylor or her team have published themselves (posts, statements,
  releases, documentaries).
- What named, reputable outlets have reported — attributed and dated.
- Past-tense, venue-level public appearances ("was at Arrowhead on Oct 12").
  City/state-level references to widely-reported properties in *historical*
  framing ("the Rhode Island house", "her Nashville years") are fine.
- Professional and business facts: releases, charts, deals, tours as reported.
- Rumors and theories **about public-facing matters**: unannounced music,
  re-recordings, tour speculation, award chances, symbolism/easter eggs, and
  relationship matters *at the level the principals have made public*.
- Family facts the family itself made public (e.g. a diagnosis Taylor
  disclosed in an interview) — cited to that disclosure, not to leaks.

## 🚫 Never OK — attribution does not launder a privacy violation

Even if a real outlet reported it, even clearly labeled as a rumor, we do not
publish:

1. **Location-that-enables-finding-her:** street addresses; neighborhood-level
   home locations; *future or planned* whereabouts ("expected at…",
   "reportedly staying at…"); travel patterns; flight tracking / tail numbers;
   real-time location.
2. **Security arrangements:** anything about her security detail, routes,
   protocols, or vulnerabilities.
3. **Body and health speculation:** pregnancy rumors, medical/diagnosis
   speculation, mental-health speculation. (Health facts she disclosed
   herself are the Always-OK exception above.)
4. **Sexuality speculation** about her or anyone in her orbit.
5. **Private individuals' private lives:** family, friends, staff, and vendors
   (the goldsmith, stylists) appear only in their public-facing roles. Nothing
   about minors beyond family facts the family published.
6. **Leaked / hacked / stolen material as sourcing:** no "leaked guest list",
   no hacked photos, no stolen documents — regardless of who republished them.
   (Documented *history about* a leak — the 2016 Kimye call — is reporting on
   a public controversy, not trafficking in the leak, and stays OK.)
7. **Legal accusations** not in court records or major-outlet news reporting.

## The rumor-specific rules (Rumor Desk, Lex, the Answerer, Content Shift)

1. **We never originate** — every rumor we carry was already reported, and we
   name who reported it, with a date.
2. **We never amplify Never-OK material** — the list above is checked *before*
   attribution is even considered.
3. **Rumors live only in rumor-labeled containers** (`rumored` confidence /
   rumor sections) — never woven into confirmed narrative.
4. When a rumor resolves, the Rumor Desk promotes (with the confirming
   citation) or retires (with the debunking one) — a stale rumor is a bug.

## Enforcement layers (defense in depth)

| Layer | What | Mode |
|---|---|---|
| CI hard-fail | `scripts/content-coverage.mjs` PRIVATE_DATA_PATTERNS (addresses, flight tracking, real-time + future whereabouts) | A violating seed **cannot merge** |
| Karen nightly | `safety.redline` checker — same hard patterns → auto-filed P0 | Catches what lands anyway |
| Agent review | `redlines.candidates()` routes *speculation-adjacent terms* (pregnancy/medical, sexuality, home/estate references, security detail) to the safety agent pass | A keyword hit never auto-accuses — existing corpus legitimately contains e.g. the disclosed cancer diagnosis; an agent classifies with this file as the rubric |
| Bot prompts | Every content-writing routine cites this file and treats Never-OK as absolute | Prevention at the source |

Deterministic patterns are deliberately **narrow** (zero false positives on
the 2026-07-19 corpus); the candidates route is deliberately **broad** (catch
everything, judge with context). When in doubt: don't publish, file a ticket.
