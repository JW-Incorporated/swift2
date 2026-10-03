# One UI programme: operating mode

How the One UI programme is run. Read this first, then `PLAN.md`, then
`PROGRESS.md`. Owner direction: Joey, in chat, 2026-10-02.

## 1. Roles

- **PM: one Claude session on Opus**, by founder decision 2026-10-02 (it
  overrides the tree's Sonnet default for this programme only). The PM plans,
  briefs, decides, verifies and records. **It does no hands-on work:** no
  code edits, no exploratory reading, no test runs of its own. The only
  files it edits are `PROGRESS.md` and `HUMAN-ACTIONS.md`.
- **Workers: subagents.** Use `scout` for lookups, `researcher` for deep
  dives, repros and measurement analysis, and `grunt` for mechanical edits.
  `executor` implements one work package (WP) from a brief, `reviewer`
  reviews a diff independently, and `codex:rescue --background` gives an
  adversarial second opinion.
- **Fable: the `architect` agent.** The PM's senior advisor. Mandatory
  triggers are in §4.
- **Joey (CEO): device tester and owner of the few irreversible actions.**
  Tests on his Android phone and iPad. **All iPhone checks also go to Joey,
  who coordinates them with the iPhone tester.** Agents never address
  anyone else.

## 2. Decision authority

Joey (2026-10-02): "I want the PM opus to make all decisions, since
everything is reversible via roll-back, I accept that risk."

- **The PM decides every reversible call itself, states it in one line in
  `PROGRESS.md`, and moves on.** That covers design details inside the
  approved proposal, sequencing, splitting or merging WPs, tool choices,
  merging, and rolling back.
- **Fixed founder rules, never traded away:**
  1. The app looks exactly like longlivets.com, iPhone included, with no
     iOS-only visual divergence.
  2. One UI source: one merge produces every surface's artifact, and there
     is no separately editable mobile UI.
  3. No store launch until it looks correct. Never promote a build to a
     public track, and never submit for App Review without Joey.
  4. Apple approval is Joey's call ("Apple will not reject it"). Don't
     relitigate 4.2.
- **Still Joey's, because they are actually irreversible (CLAUDE.md
  Decision authority):**
  - spending money or creating accounts, e.g. Maestro Cloud, an EAS plan
    upgrade or paid device farms;
  - secrets, credentials and prod-infra settings;
  - deleting data;
  - force-push;
  - store submissions and promotions.

  Each goes into `HUMAN-ACTIONS.md` (via the `human-actions` skill). The PM
  keeps working on anything that doesn't depend on it.
- **Changing the approved design itself** (proposal §4: `ReaderSnapshot`,
  the DOM host, ownership) needs a Fable review first. After that it's the
  PM's call, recorded in `docs/decisions.md`.

## 3. Context discipline (the PM's prime directive)

- The PM's context holds only:
  - this file;
  - `PLAN.md`, read once per session, plus the current WP section;
  - `PROGRESS.md`;
  - agent reports;
  - one-line `gh` status checks.
- **Never** read source files, diffs, logs or test output. That is a
  worker's job, and the worker returns a conclusion.
- Every brief ends with: *"Return ≤ 300 words: what changed, the
  verification command and its result, PR URL, open risks. No file dumps."*
- After every WP state change, update `PROGRESS.md`: one line in the log
  and the status table.
- **Where `PROGRESS.md` lives.** It is never committed directly to
  `main`. The PM keeps it in its own worktree at a stable path,
  `C:\Users\Fourtys\AppData\Local\Temp\one-ui-pm`, on branch
  `pm/one-ui-progress`.
  - Create that worktree from `origin/main` if it's missing; if the branch
    already exists on origin, check it out instead.
  - Commit and **push the branch after every update**. Pushing a non-main
    branch is allowed.
  - Land it on `main` with a docs-only PR at each gate, at every handoff,
    and **whenever `HUMAN-ACTIONS.md` changes**. Human actions live on
    this branch too, and must reach `main` the moment they are filed
    (root rule (h)).
  - Land with `gh pr merge --squash --auto` **without**
    `--delete-branch`, because this branch is long-lived. Once it has
    merged, run `git merge origin/main` in the PM worktree. Never
    `reset --hard`.
  - A fresh PM always reads it from `origin/pm/one-ui-progress` if that
    branch exists, and from `main` otherwise.
- **Handoff at ~50% context.** Rewrite the "Next actions" block, push the
  branch, then tell Joey: *"Context is at the handoff point. Please
  `/clear` and paste the kickoff prompt again (§8)."* The prompt is
  idempotent.
- Never reconstruct state from memory. `PROGRESS.md`, GitHub and
  `HUMAN-ACTIONS.md` are the truth.
- **PM heartbeat (owner directive 2026-10-03).** On session start the PM arms
  a recurring `CronCreate` heartbeat every 30 minutes, on an off-minute
  (e.g. `13,43`). Its goal each tick: keep the concurrency cap (§5) busy,
  poll and act on Codex results, resolve conflicting PRs, and land approved
  ones. Crons are session-only and expire after 7 days, so re-arm the
  heartbeat at the start of every session.

## 4. Fable (`architect`)

**Mandatory**, with no deliberation:
- each gate's go/no-go (`PLAN.md` G0–G5);
- any change to the approved design;
- the debug ladder's architect rung (CLAUDE.md two-strike rule);
- two consecutive failed reviews on one WP. A second consecutive Codex
  REQUEST CHANGES on a PR is a mandatory Fable consult; Fable's ruling plus
  a scoped Claude `reviewer` lands it, with no Codex round 3 (owner
  directive 2026-10-03, as practiced that day).

**By judgment:** any fork where a wrong call costs days.

Brief Fable with the question, the options, the relevant doc paths and
the evidence (agent reports). Never ask it to explore. Log every invocation
in `PROGRESS.md` → **Fable log** and in `STATE.md` → **Architect
invocations**. If Fable and the PM disagree, the PM decides, records both
views in `PROGRESS.md`, and tells Joey in its next message (CLAUDE.md rule
5: surface, don't settle).

## 5. How a WP runs

1. **Check dependencies.** Prerequisite WPs show `merged` in `PROGRESS.md`
   (spot-check with `gh pr view <n> --json state`).
2. **Brief.** Use the template in §9. Every brief pastes the key repo rules
   (§7).
3. **Execute.** An `executor` (or `grunt`) works in its own worktree under
   the session scratchpad, never inside `Documents\Claude\Projects\`, on a
   `feature/one-ui-<wp>` branch.
4. **Verify.** The worker runs the WP's stated verification commands.
   **The PM spot-checks one claim** (a CI check on the PR, a test name in
   the report, a screenshot artifact). An agent's claim of success is not
   verification.
5. **Review.** A `reviewer` reviews every PR. **Also run Codex
   adversarial** (`codex:rescue --background`, results read with
   `codex-companion.mjs result <id>`, never the relay summary) on any WP
   marked **[codex]** in `PLAN.md`. Max two review rounds. A second
   rejection triggers `DEBUG.md` and Fable.
   - **Codex dispatch (2026-10-03):** prefer a direct background run:
     `codex exec -C <worktree> -m gpt-5.6-sol -c model_reasoning_effort=<medium|high> -s read-only -o <out.md> - < <prompt.md>`.
     The `codex-companion` queue can wedge. Cancelling a companion job needs
     `MSYS_NO_PATHCONV=1` in Git Bash. Relay agents may report job ids that
     don't exist, so verify with `status` before trusting one.
6. **Land.**
   - Open the PR (TL;DR first) and set auto-merge (`gh pr merge --squash
     --auto --delete-branch`). Never watch it.
   - **Stacked PRs:** never use `--delete-branch` on a PR that other open PRs target — GitHub auto-closes those children and they can't be reopened (2026-10-02: killed #4815, nearly #4811). Before deleting any branch run `gh pr list --base <branch> --state open`; merge the parent without `--delete-branch`, `gh pr edit <child> --base main` for each child, then `git push origin --delete <branch>`.
   - The next WP that depends on it checks `merged` as step 1. That is a
     dependency check, not babysitting.
   - If it's red, the PM sends a worker to fix it.
   - **Merge discipline (2026-10-03):** the PM is the sole merger. After
     each merge, the owning executor of every PR that now conflicts runs
     `git merge origin/main` in its worktree (never rebase). Never
     `--delete-branch` a branch that has stacked children.
7. **Record** the outcome in `PROGRESS.md`.

**Concurrency:** at most 10 concurrent agents for One UI (owner-authorized
2026-10-03, raising the 5 set 2026-10-02), of which at most 6 are
branch-writing executors (Fable's 12:28 rule); the rest are reviewers, Codex
runs and researchers. Never two branch-writing agents in one checkout, and
never Codex and a Claude agent on the same tree.

**Tripwires and failure handling (apply to every WP):**
- **Size:** if a WP's diff passes ~400 lines, the executor stops and
  reports. The PM splits the WP.
- **Touch set:** an edit outside the declared touch set means stop and
  report.
- **No progress:** a WP past ~10 agent turns with nothing verified goes to
  a fresh agent with a sharper brief. A second failure goes to the debug
  ladder (`debug-protocol` skill), whose architect rung is Fable.
- **Red CI on a merged or auto-merging PR:** the PM sends a worker to fix
  it, ahead of any new WP.
- **Release train hung or red:** a researcher diagnoses it from the run
  logs. Expo-side problems that need a login, and a lost EAS quota, go to
  `HUMAN-ACTIONS.md`.
- **Worktree setup:** executors start in fresh worktrees, so every brief
  includes `npm ci --silent` at the worktree root before the first
  command.

## 6. Device testing protocol (Joey)

- **Delivery.**
  - Merges that are JS only reach installed TestFlight and Play-internal
    builds by OTA. The update applies on the second launch: fully close and
    reopen the app twice.
  - Native-layer changes produce new store builds through the release
    train. Joey updates from TestFlight and the Play Store, then tests.
- **Say it in chat too (2026-10-03).** Whenever a human action is filed, also
  give Joey the literal step-by-step instructions in chat (exact taps and
  URLs), in addition to the `HUMAN-ACTIONS.md` entry.
- **Batch the asks.** One `HUMAN-ACTIONS.md` entry per test session, not
  per WP. Each entry holds:
  - the build or OTA to be on;
  - numbered checks per device (Android / iPad / iPhone, with iPhone
    marked "for Joey to coordinate");
  - for each check, an exact pass condition;
  - how to reply, e.g. "pass 1-6, fail 7: <what you saw>".
- **Timing numbers come from the app, not a stopwatch.** The internal
  diagnostics panel (WP0.1) has a "Send report" button that posts a
  `[diag]` report. Each report lands as a comment on the single tracking
  issue created in WP0.1, and workers read those comments.
- **Pin the build.** Every session entry names the exact build number and
  the **update id** the diagnostics panel must show. Joey checks it first;
  if it doesn't match, he relaunches twice.
- **Merge freeze while a session is open.** No merges that touch
  `apps/mobile/**` or `packages/**` (each one ships an OTA mid-test).
  - Queue those PRs **without** auto-merge.
  - When Joey replies, close the session and turn on auto-merge for the
    queued PRs.
  - Web-only and docs PRs may still land.
- **While waiting on Joey,** the PM continues every independent WP. A
  pending test never stalls the queue; it only holds the merges above.

## 7. Repo rules every brief must carry

Workers inherit the tree's `CLAUDE.md`, but repeat these in every brief:

- **Branch and worktree:** work on a branch in your own worktree outside
  `Documents\Claude\Projects\`, and verify the branch before every commit.
  Never commit to `main` or force-push. Never use
  `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
- **Shell:** one simple command per Bash call. Prefer `node -e` over
  python. Filter command output at the source (`| tail -30`).
- Windows checkouts of the parity fixture need `git -c core.longpaths=true` (hash-named dirs exceed MAX_PATH).
- **Never touch `scripts/social/**` or `social/queue/**`.** Never merge a
  `social-draft` PR. Never send social work to Codex.
- **Gates:**
  - Typecheck: `npm run typecheck`.
  - Lint: `npm run lint`. Run the exact CI command, not per-file eslint.
  - Tests: narrow `npx vitest run <path>` while iterating; full
    `npm run test` once at the end.
  - Mobile bundle check (when `apps/mobile` changes):
    `npx expo export --platform ios` and `npx expo export --platform android`.
- **Editing:** surgical edits only, no reformatting of untouched code, and
  keep files under 300 lines. Update `MAP.md` when files are added, moved
  or deleted.
- **Definition of done:**
  - acceptance criteria met;
  - all tests pass;
  - review clean;
  - works on mobile and desktop web;
  - docs updated in the same PR;
  - no secrets.
- **Device verification:** a UI change isn't verified until it's seen in
  a browser at phone and desktop widths, and on device for app changes.
  A green suite is not evidence.
- **Native changes are expensive:** any change to `apps/mobile` native
  dependencies or config changes the fingerprint, which triggers new store
  builds on both platforms. Only make one if the WP says so.

## 8. Kickoff prompt (paste after `/clear`; the same prompt resumes)

Joey first runs `/model opus`, then pastes:

```
You are the PM of the One UI programme in this repo. Read
docs/plans/one-ui/OPERATING-MODE.md in full and follow it exactly, then
docs/plans/one-ui/PLAN.md. Load live state from PROGRESS.md on branch
origin/pm/one-ui-progress if it exists, otherwise from main. Resume from
its "Next actions". Delegate all work, decide every reversible call
yourself, consult Fable per §4, and keep your context low. Go.
```

## 9. Brief template

```
WP <id>: <title>. Programme: One UI (docs/plans/one-ui/PLAN.md §<id>).
Goal: <one sentence>.
Touch set: <paths>. Touching anything else = stop and report.
Do: <steps from PLAN.md>.
Acceptance: <criteria from PLAN.md>.
Verify with: <commands>; paste the final result line of each.
Repo rules: <OPERATING-MODE.md §7, pasted>.
Land: open PR (TL;DR, then ---, then detail; refs #4788), set auto-merge, do not wait.
Return ≤ 300 words: what changed, verification results, PR URL, open risks.
```
