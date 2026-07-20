# The rumor pipeline — carrying the chaos honestly

**Status: architecture, 2026-07-20 (Wyatt's directive).** Supersedes the
"no gossip" posture in `intake.md`'s filing bar. Read alongside
`privacy-redlines.md`, which this document does not weaken — it re-cuts one
rule (location) along a better axis and leaves the rest absolute.

## The problem

Most Taylor news arrives as noise. A claim surfaces on a Tuesday from one
tabloid, gets picked up, contradicted, half-confirmed, and only weeks later
settles into fact — or quietly evaporates. Our pipeline rejected all of it at
the door, which meant the Vault was structurally incapable of covering the
present tense. We were only ever a history site pretending to be a news site.

Wyatt's call: **bring the chaos in, label it honestly, and let the bots resolve
it over time.** The editorial guarantee stops being "everything here is true"
and becomes "**everything here is labeled with how well we know it**." That is
a stronger promise, and an achievable one.

## The core inversion

Old bar: *is this true enough to publish?* → most current news fails → nothing ships.

New bar: **is this a claim we can later adjudicate, from someone we can name?**
→ it ships, wearing its confidence → the lifecycle resolves it.

This only works if two things hold, and both are enforced in code:

1. **Nothing unlabeled.** A rumor that renders like a fact is a bug, not a
   near-miss. The dashed-border rumor container and the confidence banner are
   load-bearing UI, not decoration.
2. **Nothing left hanging.** An unresolved rumor from six weeks ago is not
   "current" — it is rot. The lifecycle must have an honest terminal state for
   claims that never resolve, or the site fills with permanent maybes.

## Location: specificity scales with provenance, not with tense

The old rule keyed on tense — anything forward-looking was banned. That is the
wrong axis, and it was both too strict and too loose:

- **Too strict:** an announced tour date is future, venue-specific, and
  completely fine, because *she published it*. The old regex banned
  "will be at" outright.
- **Too loose in principle:** "she was at <exact address> last night" is past
  tense and far more dangerous than "she'll be in the Bahamas next month."

What actually matters is **how precisely you could find her, weighted by how
official the information is**. So:

### The ladder

| Level | Granularity | Example |
|---|---|---|
| **L0** | country / state / region / county / metro | "the Bahamas", "upstate New York", "the Kansas City area" |
| **L1** | a named city or town | "Nashville" |
| **L2** | a named venue, hotel, restaurant, business | "Arrowhead Stadium", "the Bowery Hotel" |
| **L3** | street address, unit, coordinates | — |

### The matrix

| Provenance | Max specificity |
|---|---|
| **Officially announced** (Taylor, her team, the venue, the promoter) | **L2** |
| **Documented past event** (it happened; reported by a real outlet) | **L2** |
| **Speculation / rumor / anything forward-looking and unannounced** | **L0** |
| **Her home or residence** — even when confirmed | **L1** |

**L3 is never publishable, at any provenance, in any tense.** Neither is
anything in the always-banned list below.

Worked examples:

- ✅ "Reportedly heading to the Caribbean after the tour" — L0 speculation.
- ✅ "Plays Wembley on 14 August" — L2, officially announced.
- ✅ "Was photographed leaving Zuma in Manhattan on Tuesday" — L2, documented past.
- ✅ "Has kept a place in Nashville for years" — L1 residence.
- ❌ "Expected at the Bowery Hotel this weekend" — L2 speculation. Cut to L0 or drop.
- ❌ "Her Cornelia Street place" — L2 residence.
- ❌ Any street address, ever.

### Travel

Allowed: the fact of travel at **L0** — "reportedly heading to the Caribbean".

Never, at any provenance: flight numbers, tail numbers, airport or terminal or
gate references, specific departure/arrival dates or times, tracking services,
"usual route", private-aviation logs. The distinction is between *she is
somewhere in the world* and *here is how to be standing where she lands*.

### Unchanged and still absolute

Security arrangements; body, health and pregnancy speculation; sexuality
speculation; private individuals and minors; leaked/hacked material as
sourcing; legal accusations outside court records or major-outlet reporting.
**Relaxing the location rule relaxes nothing else.** See `privacy-redlines.md`.

## What we admit, and what we still refuse

Admit a claim when **all** hold:

1. It is about Taylor or her work.
2. **It has a truth value** — it can be adjudicated later. This is the load-
   bearing filter and it is what keeps "bring in the chaos" from becoming
   "bring in everything."
3. It is attributable: a named outlet and a date. We never originate.
4. It passes the location matrix and every other redline.

**Still refused:**

- **Non-claims.** "Shaq joked that he wasn't invited" is not gossip, it is
  chatter — there is no future in which it resolves true or false, so the
  lifecycle can never retire it and it would sit in the Vault forever. Reaction
  quotes, listicles, and "fans are saying" pieces with no underlying assertion
  stay out. *(This is an editorial judgment, not a founder directive — flagged
  for review. If the intent is genuinely to carry chatter too, the fix is a
  separate low-weight `chatter` container that never enters the lifecycle,
  not loosening this filter.)*
- Third parties' private lives, however widely reported.
- Anything unattributable.

## Status lifecycle

```
                    ┌──────────────► confirmed  (citation required)
                    │
  unconfirmed ──────┼──────────────► partially_confirmed
       │            │
       │            └──────────────► debunked   (citation required)
       │
       └── 45d, no movement ───────► faded
```

`faded` is new and it is the point of the whole design. A claim that was
reported, never confirmed, never denied, and has gone quiet is a real and
common outcome. Saying so — "reported in July, never confirmed or denied" — is
honest. Leaving it as `unconfirmed` forever implies it is still live, which is
a lie of omission, and it is how a rumor site rots into a conspiracy board.

Every transition out of `unconfirmed` requires a **citation**, except `faded`,
which requires only a documented re-check that found nothing.

## Data model

`RumorNote` gains:

| Field | Why |
|---|---|
| `lastCheckedOn` | When a lifecycle pass last looked. Without it we cannot tell "still true" from "never audited" — the distinction the whole system rests on. |
| `resolution` | `{ on, url, outlet, note }` — provenance for confirmed/debunked. A promotion without a citation is just an opinion. |
| `sourceTier` | `official \| established \| tabloid \| social`. Drives how loudly we present it; a Deuxmoi blind item and a Reuters report are not the same claim. |
| `locationSpecificity` | `region \| city \| venue`, declared when a claim carries location, so the matrix is machine-checkable rather than vibes. |

## Enforcement (defense in depth, unchanged shape)

| Layer | Change |
|---|---|
| CI hard-fail (`content-coverage.mjs`) | Drop the blunt tense-based pattern; add specificity-shaped patterns (address, airport/flight/gate, tracking, residence+venue) |
| Karen (`checkers/redlines.mjs`) | Same pattern set, same reasoning |
| New checker (`rumor-lifecycle.mjs`) | Surfaces the queue: never-checked, stale, overdue, matrix violations |
| Rumor Desk | Works that queue instead of an ad-hoc batch |
| Bot prompts | Cite the matrix rather than "no forward-looking location" |

Deterministic patterns stay **narrow** (they hard-fail CI, so a false positive
blocks a merge). The judgment calls — is this venue-level speculation? is this
a claim or chatter? — route to the agent pass, which has this file as its
rubric. That split is why we can relax a rule without lowering the floor.
