# Vault Run lanes

One file per lane. The orchestrator (`../vault-run.md`) reads these and executes
them in order inside a single session. See `../../vault-run-plan.md` for why.

## The lane contract — what the orchestrator gives you, and what it does not

**The orchestrator owns all of this. No lane file should repeat it:**

- The clone and the branch (`vault/<date>`).
- `npm run sync:content` and the full gate (`validate:content`,
  `check:generated`, `typecheck`, `vitest`, `lint`) — run ONCE after all lanes,
  not per lane.
- `git commit` — the orchestrator commits after each lane, so one lane is one
  revertable commit.
- The single PR at the end.
- Run discipline: no `send_later`, no self-check-ins, no PR babysitting. See
  `CLAUDE.md` § "Never babysit your own PR".

**Each lane file owns only:**

- What that lane's work IS, and its queue/source of truth.
- Its verification bar and its hard limits.
- Its per-run cap.
- Its own hard-won protocol details.

## Why these files exist at all

These six prompts previously lived ONLY inside their cloud triggers. The rule in
`../../runners.md` — "the repo file is the source of truth, and a trigger whose
inline prompt drifts from its file is a bug" — was therefore vacuously true for
exactly the agents that drifted worst. A 2026-07-25 audit found nine such
runners. Extracting them is half the point of the Vault Run.

**So: edit the lane file, never only the trigger.**

## Editing rules

- Protocol details in here are load-bearing and were usually written after
  something broke. The `focalPoint` field-order rule prevented a silent
  duplicate-key corruption; the oEmbed `author_name` check caught a fan
  re-upload being passed off as official. Do not "tidy" them away.
- A lane that has nothing to do must exit in seconds and say so. A silent no-op
  is indistinguishable from a broken lane.
- Content lanes are READ-ONLY on `docs/`, `scripts/`, `apps/` (except the two
  generated vault files) and `.github/`. Only Austin touches app code.
