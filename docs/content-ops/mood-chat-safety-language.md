# Mood chat — proposed user-facing language (AWAITING FOUNDER APPROVAL)

**Status:** DRAFT, 2026-07-19. Wyatt asked for proposed wording on the cases
I flagged as needing a human call. **Nothing here ships until Wyatt and Joey
approve it** — this is a duty-of-care and editorial decision, not an
engineering one. Approve, edit, or reject per block below.

The feature: a reader describes how they're feeling; we reply with Taylor
songs that match. A "tell me how you're feeling" box on a Taylor Swift site
**will** receive real distress, some of it from teenagers. That is not a
hypothetical edge case — it is a predictable Tuesday.

---

## Block 1 — Crisis response (the one I most want signed off)

**Trigger:** input suggesting self-harm, suicidal ideation, or acute crisis.
**Behavior:** we do NOT return a playlist. A song is the wrong answer to "I
want to die." We show this instead, and nothing else.

> **I'm really glad you told me.**
>
> I'm a music recommender — I'm not equipped for what you're carrying right
> now, and you deserve better than a playlist for it.
>
> If you're in the US, you can call or text **988** (Suicide & Crisis
> Lifeline) any time, or text **HOME to 741741** for the Crisis Text Line.
> Outside the US: **findahelpline.com** lists free services by country.
>
> If you're in immediate danger, please call your local emergency number.
>
> The songs will still be here whenever you want them.

*Notes for approval:* deliberately does not diagnose, does not say "seek
professional help" (cold), does not moralize, and does not pretend to be a
person. The last line matters — it leaves the door open without minimizing.

---

## Block 2 — Heavy-but-not-crisis moods

**Trigger:** genuine sadness, grief, heartbreak, loneliness — the normal
heavy stuff this feature exists for. **Behavior:** recommend normally, with
one added line above the songs.

> Sitting with something heavy? These are the ones that tend to sit with you
> rather than try to fix it.

*Notes:* no resources dump — that would pathologize ordinary sadness and is
exactly the over-reaction that makes people stop using a thing. The
distinction from Block 1 is real risk, not sad mood.

---

## Block 3 — The standing disclaimer (always visible near the input)

> A fan project, not a therapist — just someone with strong opinions about
> which song fits. Tell me as much or as little as you like; **what you type
> isn't saved.**

*Notes:* sets expectations, and the privacy promise is load-bearing — see
Block 5. Only include the "isn't saved" clause if engineering actually
honors it (it will; we log the derived mood vector, never the raw text).

---

## Block 4 — Minors

The legal pages (#800, launch-readiness LEGAL row) are still unwritten and
list minors as an open item. This feature makes that gate load-bearing: a
distress box used by teenagers is exactly what those pages need to cover.

**Proposed:** no age gate on the feature itself (an age gate on a fan site
is trivially bypassed and creates a false sense of compliance), but the
privacy policy must state plainly that mood text is not stored, not
profiled, and not used for advertising, and the crisis path must be live
before launch. **Flagging for Joey specifically:** if we ever add accounts
or persistence here, this becomes a COPPA-adjacent question and needs
counsel, not us.

---

## Block 5 — What we store (engineering commitment, stated for approval)

- **Never stored:** the reader's raw text. Not in logs, not in analytics,
  not in error traces.
- **Stored:** the derived mood vector (e.g. `{heartbreak: 0.8, anger: 0.3}`)
  and which songs we returned, for tuning quality.
- **Rationale:** emotional disclosures are the most sensitive data this site
  would ever touch, and we cannot leak what we never wrote down. This also
  keeps Block 3's promise honest.

---

## Block 6 — Refusals / out-of-scope

**Trigger:** requests for medical, legal, or relationship advice; attempts
to use the bot as a general chatbot.

> That's outside what I can help with — I only really know one thing, which
> is which Taylor song fits a feeling. Want to try me on that?

*Notes:* short, warm, no lecture. Keeps the bot in its lane, which is also
the cheapest lane.

---

## Approval

- [ ] **Wyatt** — approve / edit
- [ ] **Joey** — approve / edit (Block 4 especially)

Ship blocker: Block 1 must be approved and implemented before the feature is
publicly reachable.
