# Definition of Done — the thing the daily brief measures against

**Owner: Joey.** This file holds one sentence, and it is the most important
sentence in the repo. Everything the Founders' Brief says about "how far
away are we" is measured against whatever is written below.

---

## The definition

> **[JOEY: replace this block with your definition of "done".]**
>
> Wyatt's framing when this file was created (2026-08-11): *"done will be
> defined by Joey and loosely means the website is fully built and the
> founders can ignore it."*
>
> The definition needs to be checkable. Some questions it should answer,
> because the estimator has to turn it into a number:
>
> - Is "done" the same as "launchable", or is there a bar past launch?
> - Does "the founders can ignore it" mean *zero* founder actions, or zero
>   *recurring* ones? (Today the brief still needs you for legal sign-off and
>   for anything requiring a login only you have.)
> - Which of the 12 gates below are genuinely required for done, and are any
>   of them not?
> - Is there anything required for done that is **not** on that list? If so it
>   needs a gate, and gates are added by founder decision only
>   (`docs/launch-readiness.md`'s own rule).

---

## The working proxy, until that block is filled in

**Done = every gate in [`docs/launch-readiness.md`](../launch-readiness.md)
is 🟢.** Twelve gates: DEPTH, VOICE, WORTHY, SONGS, SCAN, ERRORS, ALARMS,
LEGAL, BACKUPS, PLUMBING, CAMPAIGN, MOBILE.

This proxy was not invented for this file. It is the gate list the founders
already approved on 2026-07-11, and `docs/launch-readiness.md` already says
"What done looks like: every row 🟢, then a founders' go/no-go." All this file
does is name it as the thing the estimator measures, and mark clearly that it
is a stand-in for a definition only Joey can give.

The brief prints the `[JOEY: …]` placeholder in **every single brief** until
this file is filled in. That is deliberate. A proxy that quietly becomes the
real definition because nobody noticed it was a proxy is the failure mode.

## How the proxy is turned into a number

`scripts/marjorie/done-estimator.mjs` — the full method is documented at the
top of that file. In short:

| Step | What happens |
|---|---|
| Measure remaining | Gate-points: 🔴 = 0, 🟡 = 0.5, 🟢 = 1.0. Done = 12.0. Partial credit exists because only three gates have ever gone fully green, and three events cannot support an estimate. |
| Measure velocity | Gate-points/day over three trailing windows (14 / 28 / 56 days), reconstructed from the git history of `launch-readiness.md`. Three windows disagreeing *is* the error bar. |
| Separate idle work | A gate with no ticket activity and no PR is excluded from the trajectory entirely and named. Velocity earned on staffed gates says nothing about unstaffed ones. |
| Grade confidence | From sample size and window spread. Capped at `low` whenever anything is idle. At `low`, only a week band is printed — never a day count. At `none`, no number at all. |
| Refuse when idle dominates | If idle points are ≥ half of what remains, the brief says "not on a trajectory" and gives no ETA. |

**If you change the definition above, the estimator does not need rewriting** —
it needs its input changed. Point `GATES` in
`scripts/marjorie/gate-history.mjs` at whatever the new checkable criteria are,
and everything downstream (velocity, confidence, the brief) follows.

## What this deliberately does not do

- **It does not ask an LLM for the estimate.** A model asked "how long until
  we're done?" will produce a fluent, confident, unfalsifiable number. The
  2026-08-11 rebuild exists because the brief had been doing the LLM version of
  exactly that for a month.
- **It does not smooth over a bad answer.** "No defensible estimate" is a
  supported output and is printed when it is true.
