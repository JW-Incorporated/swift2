# Definition of Done — what the daily brief's estimator measures against

**Owner: Joey (the definition) · ops (this file).** Everything the Founders'
Brief says about "how far away are we" is measured against the criteria named
below.

---

## The definition

> **Joey defined it — 2026-08-11, the same day this file was created.** The
> product Definition of Done is the eight-item bar in
> [`docs/definition-of-done.md`](../definition-of-done.md) (#1953): all eight
> items complete before any large marketing push. That file is the successor
> bar to the launch-readiness gates, and it says so.

When this file was drafted (earlier that same day), the definition did not
exist yet — Wyatt's framing was *"done will be defined by Joey and loosely
means the website is fully built and the founders can ignore it."* #1953
answered the open question. What remains for the estimator is mechanical: the
eight-item bar has no per-item git history yet the way `launch-readiness.md`'s
status column does, so a velocity series over it will only exist after its
status table has accumulated some edits. Until the estimator is repointed
(see "If you change the definition" below), it measures the historical proxy.

---

## The working proxy the estimator still measures

**Done = every gate in [`docs/launch-readiness.md`](../launch-readiness.md)
is 🟢.** Twelve gates: DEPTH, VOICE, WORTHY, SONGS, SCAN, ERRORS, ALARMS,
LEGAL, BACKUPS, PLUMBING, CAMPAIGN, MOBILE.

This proxy was not invented for this file. It is the gate list the founders
already approved on 2026-07-11, and `docs/launch-readiness.md` already says
"What done looks like: every row 🟢, then a founders' go/no-go." All this file
does is name it as the thing the estimator measures, and mark clearly that it
is a stand-in for the real bar in `docs/definition-of-done.md`.

The brief prints a one-line pointer in **every single brief** naming the
gates as the proxy and `docs/definition-of-done.md` as the successor bar.
That is deliberate. A proxy that quietly becomes the real definition because
nobody noticed it was a proxy is the failure mode.

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

**If you change the definition — including repointing at the eight-item bar
in `docs/definition-of-done.md` — the estimator does not need rewriting** —
it needs its input changed. Point `GATES` in
`scripts/marjorie/gate-history.mjs` at whatever the new checkable criteria are,
and everything downstream (velocity, confidence, the brief) follows. The
eight-item bar becomes measurable the same way the gates are once its status
table has a few weeks of edits in git history behind it.

## What this deliberately does not do

- **It does not ask an LLM for the estimate.** A model asked "how long until
  we're done?" will produce a fluent, confident, unfalsifiable number. The
  2026-08-11 rebuild exists because the brief had been doing the LLM version of
  exactly that for a month.
- **It does not smooth over a bad answer.** "No defensible estimate" is a
  supported output and is printed when it is true.
