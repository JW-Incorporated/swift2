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
| CI hard-fail | `scripts/content-coverage.mjs` PRIVATE_DATA_PATTERNS (addresses, flight tracking, real-time whereabouts) | A violating seed **cannot merge** |
| CI hard-fail | `scripts/validate-content.mjs` — the **structural** rumor gate: `locationSpecificity` above `region` on an *unresolved* rumor is an ERROR; resolved claims must carry the citation that settled them | A violating seed **cannot merge**. Arguably the strongest layer, and this table forgot it until 2026-08-11 |
| CI hard-fail | `scripts/validate-content.mjs` ← `scripts/lib/rumor-redlines.mjs` **blocking** rules RR2/RR3/RR4 (source-tier laundering, absent tier, redline category asserted at speculative provenance) | A violating seed **cannot merge** |
| Karen nightly | `safety.redline` checker — same hard patterns → auto-filed P0 | Catches what lands anyway |
| Karen nightly | `safety.rumor-redline` checker — **all** rumor-redline rules including advisory RR1 → auto-filed P0/P1 | Catches what is already live |
| Agent review | `redlines.candidates()` routes *speculation-adjacent terms* (pregnancy/medical, sexuality, home/estate references, security detail) to the safety agent pass | A keyword hit never auto-accuses — existing corpus legitimately contains e.g. the disclosed cancer diagnosis; an agent classifies with this file as the rubric |
| Bot prompts | Every content-writing routine cites this file and treats Never-OK as absolute | Prevention at the source |

Deterministic patterns are deliberately **narrow** (zero false positives on
the 2026-07-19 corpus); the candidates route is deliberately **broad** (catch
everything, judge with context). When in doubt: don't publish, file a ticket.

### The Rumor Desk redline rules (2026-08-11)

Added to pay the debt the 2026-07-25 content auto-merge decision record named:
rumor content now reaches longlivets.com with no human read, and the record
prescribed *"add a deterministic checker for it in `scripts/content-engine/`"*
as the remedy for exactly that. Rules live once, in
`scripts/lib/rumor-redlines.mjs`, and bind in two places.

| Rule | Fires on | Binding |
|---|---|---|
| **RR1** | An unresolved rumor on a `sighting` moment with no `locationSpecificity` declared | Advisory (Karen P0) |
| **RR2** | `reportedBy`'s *primary* source is a blind-item account but `sourceTier` claims better than `social` | **Blocks** |
| **RR3** | `sourceTier` absent — fail closed, since it is the gate RR4 tests | **Blocks** |
| **RR4** | A redline-category phrase in `claim` on a rumor that is *both* unresolved *and* not `official` tier | **Blocks** |

**Why RR4 is allowed to read prose when `candidates()` is not.** A term alone
proves nothing — "diagnosis" is Always-OK when Taylor disclosed it and Never-OK
when a tabloid guessed it. But every Always-OK exception in this file requires
*official provenance or a resolved claim carrying its citation*. So a
redline-category term on a claim that is both unresolved and not official-tier
**cannot be the exception, whatever it means**. The term names the category; the
provenance structure decides admissibility. Neither half accuses on its own.
RR4 reads `claim` and never `note`, because `note` is our commentary — it is
where an author writes *"no address, no security detail"* to explain why an
entry is clean, and a checker that reads it flags entries for saying they are
safe. That was a real false positive on the live corpus, not a hypothetical.

**RR1 is advisory on purpose.** Its remedy is a content judgment (coarsen the
claim, or argue the Ocean House principle applies), and hard-failing a judgment
call is how a checker becomes noise.

### What is still NOT guarded — residual risk, written down

These are known gaps, not oversights. Nothing deterministic covers them; they
rely on the agent-review layer and on bot prompts.

1. **A declared `locationSpecificity` is never verified against the prose.**
   RR1 forces the field to exist so the matrix gate can run, but an author who
   declares `region` on a claim that names a venue defeats both. Verifying a
   declaration against free text is semantics.
2. **Residence precision.** A residence is capped at `L1` *regardless of
   provenance* — the one cap no structural gate enforces, since
   `locationSpecificity: 'venue'` cannot distinguish her house from a
   restaurant. A rule was written and **rejected**: every pattern that caught
   "the Watch Hill estate" also caught "the Ocean House resort", which this
   file expressly blesses. Covered only by `candidates()` → agent, and by
   `content-coverage.mjs` at street level (`L3`).
3. **Private individuals.** Distinguishing a public figure in a public-facing
   role from a private person is name-level world knowledge. Agent layer only.
4. **Which proposition inside an entry is the unresolved one.** `status` is a
   property of the whole rumor, but the location cap applies to the location
   claim. An entry whose *sighting* is documented and whose *conclusion* is
   speculative reads as fully speculative to every mechanical rule.
5. **Redline material phrased without any listed phrase.** RR4 matches a closed
   list. Paraphrase defeats it. It is a tripwire, not a classifier.
6. **`note` prose is unscreened by RR4** (deliberately — see above). It reaches
   `candidates()` and the agent pass, which is advisory.
