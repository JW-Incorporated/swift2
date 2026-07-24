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
- Past-tense, venue-level public appearances and **stays** ("was at Arrowhead
  on Oct 12"; "stayed at the Ocean House resort in June, since departed"). A
  **public accommodation she has already left** — hotel, resort, inn,
  restaurant, venue — is fine at venue level: it's transient, she's gone, and
  naming it lets Swifties visit a public place without exposing where she lives
  or where she'll be next (2026-07-24, Wyatt). This is distinct from her
  residence (see the matrix — a home never gets this treatment).
- City/state-level references to widely-reported *residences* in *historical*
  framing ("the Rhode Island house", "her Nashville years") are fine — but a
  residence is capped there and never gets venue- or street-level detail.
- Professional and business facts: releases, charts, deals, tours as reported.
- Rumors and theories **about public-facing matters**: unannounced music,
  re-recordings, tour speculation, award chances, symbolism/easter eggs, and
  relationship matters *at the level the principals have made public*.
- Family facts the family itself made public (e.g. a diagnosis Taylor
  disclosed in an interview) — cited to that disclosure, not to leaks.

## 🚫 Never OK — attribution does not launder a privacy violation

Even if a real outlet reported it, even clearly labeled as a rumor, we do not
publish:

1. **Location — see the specificity matrix below.** Rewritten 2026-07-20
   (Wyatt). The old rule banned anything forward-looking outright, which was
   the wrong axis: an announced tour date is future *and* venue-specific *and*
   entirely fine, while "she was at <address> last night" is past tense and far
   more dangerous. What matters is **how precisely you could find her, weighted
   by how official the information is** — not what tense it is in.

   **The ladder:** `L0` country/state/region/county/metro · `L1` a named city ·
   `L2` a named venue, hotel, restaurant, business · `L3` street address, unit,
   coordinates.

   | Provenance | Max |
   |---|---|
   | Officially announced (Taylor, her team, the venue, the promoter) | **L2** |
   | Documented past event, reported by a real outlet | **L2** |
   | Speculation / rumor / forward-looking and unannounced | **L0** |
   | Her home or residence, even when confirmed | **L1** |

   **`L3` is never publishable at any provenance in any tense.**

   **Residence vs. a place she stayed (2026-07-24, Wyatt).** The residence cap
   (`L1`) is about her *home* — a permanent place she returns to, where naming
   the venue or street creates a standing doxxing and security risk. A **public
   accommodation she has already left** — a hotel or resort from a past,
   concluded trip — is *not* a residence: it's transient, the risk departed with
   her, and it takes the ordinary documented-past-event treatment (`L2`). Name
   the resort she stayed at last month; never name the street her house is on.
   *The Watch Hill test:* the Ocean House resort (public, past, she's gone) is
   fine to name; her own estate there is `L1` — "Watch Hill", never the street,
   never its security detail.

   ✅ "reportedly heading to the Caribbean" · "plays Wembley on 14 August" ·
   "photographed leaving Zuma on Tuesday" · "stayed at the Ocean House resort in
   June, since departed" · "has kept a place in Nashville"
   ❌ "expected at the Bowery Hotel this weekend" (L2 speculation) ·
   "her Cornelia Street place" (residence, L1 cap) · any street address.

   **Travel:** the *fact* of travel at L0 is fine ("reportedly heading to the
   Caribbean"). Never, at any provenance: flight or tail numbers, airports,
   terminals, gates, specific departure/arrival dates or times, tracking
   services, "usual route", private-aviation logs. The line is between *she is
   somewhere in the world* and *here is how to be standing where she lands*.

   **Real-time location** ("is right now at…") remains banned outright.

   Full reasoning and worked examples: `docs/content-ops/rumor-pipeline.md`.
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
5. **A claim with no truth value is not a rumor** (2026-07-20). "X joked that
   he wasn't invited" can never resolve true or false, so the lifecycle can
   never retire it and it would sit in the Vault forever. Reaction quotes and
   "fans are saying" pieces stay out; adjudicable claims come in. See
   `rumor-pipeline.md`.
6. **Unresolved is a state, not a resting place** (2026-07-20). A claim that
   was reported, never confirmed, never denied, and has gone quiet gets
   `faded` — "reported in July, never confirmed or denied". Leaving it
   `unconfirmed` forever implies it is still live, which is a lie of omission.

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
