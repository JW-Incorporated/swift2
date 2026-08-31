# The desks — agent charters

**Looking for "what runs automatically and why"?** Start at
[`../AUTOMATION.md`](../AUTOMATION.md) — the one-page index of every scheduled
routine across all three tiers (GitHub Actions, the desk routines chartered
here, and the product's own cron). This directory is the detail layer beneath
it: one charter per desk.

Operating model: `docs/proposals/2026-07-11-agentic-operating-model.md`
(approved 2026-07-11, decision entry in `docs/decisions.md`). Executive
overview lives with the founders; this directory is the runtime truth.

Every agent that runs on a schedule or acts on shared state gets a charter
here. A charter is a **runtime contract**: the session/service that runs the
agent loads it and follows it exactly. Charter changes are founder-approved
PRs — no agent may edit any charter, including its own.

## Charter sections (Kevin's doc is the original template)

1. Mission + current-version scope
2. Cadence (when it runs, what each run does, who runs it)
3. Hard invariants ("never violate" — safety properties, not conveniences)
4. Mutation rights (exactly which artifacts it may create/edit/close)
5. Audited by (who checks it — never itself)
6. Budget (per-run and standing token/spend expectations)
7. Migrating to a service (the contract any port must honor)

Plus, for every agent: **one checkout per agent** (own worktree/clone,
verify branch before any git op) and **artifact-only interfaces** (agents
communicate via issues/PRs/docs with their labels, never by editing another
agent's outputs).

## Shared checkout guardrail — the how-to

`CLAUDE.md` § Agent shell discipline: any agent that will create branches or
commit works in its own worktree, never in this shared checkout. Two agents
sharing this working directory flipped HEAD under each other twice in one
session (2026-08-13) before `.claude/hooks/guard.sh` started enforcing it —
the hook denies a branch-changing command (`git checkout`, `git switch`,
`git branch -m/-M/-f`) whenever a different session's lock
(`.git/claude-session.lock`) is still fresh.

To get your own checkout, from the main repo directory:

```
git worktree add "C:\Users\<you>\AppData\Local\Temp\claude-worktrees\<branch-name>" -b <branch-name>
```

- **Location: outside `Documents\Claude\Projects\`.** Under the system temp
  dir (`%TEMP%\claude-worktrees\<branch-name>`), never inside the Projects
  folder — a worktree created there is still a separate checkout, but keeping
  scratch checkouts out of `Documents\Claude\Projects\` keeps that tree to
  the repos humans actually browse.
- **`<branch-name>`** should match the branch you're about to create (`git
  worktree add` can create the branch for you with `-b`, as above, or check
  out an existing one by dropping `-b`).
- **Cleanup when done:** from the main repo directory,
  `git worktree remove "C:\Users\<you>\AppData\Local\Temp\claude-worktrees\<branch-name>"`
  (add `--force` only if you're certain nothing there is uncommitted and
  wanted — never as a reflex). Merged/abandoned branches can be deleted
  normally with `git branch -d <branch-name>` afterward.
- Read-only agents (searching, reading, no git writes) don't need any of
  this and may share the main checkout freely.

## Roster

| Charter | Agent | Status |
|---|---|---|
| [`marjorie.md`](marjorie.md) | Chief of staff + manager | Phase 1 — active |
| [`austin.md`](austin.md) | Build desk autonomous lane | **Active** (2026-07-11, #494; G3 waived pending the Team-plan upgrade) |
| [`nils.md`](nils.md) | The critic — walks the site daily, tickets what's unworthy | **Active** (2026-07-11, Joey directive) |
| [`content-shift.md`](content-shift.md) | The standing writer — authors intake + experience + depth tickets | **Active** (2026-07-11, Joey directive) |
| [`tree.md`](tree.md) | Social media manager — plans `social/calendar.md` weekly; Growth drafts it, the poster ships it | **Active** (2026-08-11, Joey directive) — routine is a pending Wyatt-side paste, see [`runners.md`](runners.md) |
| `../kevin.md` | Ticket ops (moves here in Phase 2) | Active on Wyatt's side |
| *(Phase 2)* | Karen (Integrity), v0, delegation scripts | Charters pending |
| *(Phase 1, copy desk)* | Theo, Loren, Vera, Deb — `docs/content-ops/personas/` | Spec approved (#463) |
| *(Phase 3)* | Growth & Community, Watch | Pre-launch |

## The kill switch — pausing the org (gap analysis G10)

To stop all autonomous activity **right now**:

1. **Scheduled agents:** disable every routine at
   <https://claude.ai/code/routines> (Marjorie's 6 AM / 8 PM runs, any Austin
   runner). Disabling is instant and reversible; no work is lost — all state
   lives in GitHub artifacts.
2. **Session crons on founder machines** (Kevin, on Wyatt's side): stop the
   session/scheduler task on that machine.
3. **What keeps running on purpose:** the watchdog and CI are dumb GitHub
   Actions — they only observe and alert. To silence even those, disable the
   workflows under the repo's Actions tab.
4. **Freezing one desk only:** disable just its routine; its queue simply
   accumulates (labels keep working) and the brief's Health section shows
   the stopped cadence.
5. **Degraded mode is always available:** the decision bank is plain labeled
   issues — founders can read and answer everything with every agent off.

## Labels the desks own

| Label | Owner | Meaning |
|---|---|---|
| `founder-decision` | Marjorie (bank) | Needs a founder answer; filed via the issue form. Body follows [`founder-comms.md`](founder-comms.md) |
| `founder-task` | Any desk (Tree is the standing filer) | **A human founder must personally act**, and the body is written for a non-coder per [`founder-comms.md`](founder-comms.md). The body gets **emailed verbatim** by `tree-mail.yml`'s digest sweep — never apply this to agent-coordination work (that's `desk-coordination`). Misuse caused the 2026-08-11 four-email incident (#1955–#1958) |
| `desk-coordination` | Any desk | Agent-to-agent coordination artifact (merge sequencing, file claims, fleet scheduling). Mails **no one**; a human never needs to read it to act |
| `founder-mailed` | `tree-mail.yml` (machine-only) | Bookkeeping: the founder-task digest already emailed this issue. Never apply or remove by hand |
| `founders-brief` | Marjorie | The daily brief issues |
| `watchdog-alert` | watchdog Action | A cadence failed loudly |
| `intake` | Content desk | A real-world event dropped for authoring |
| `cie`, `cie:*` | Karen | Content-integrity findings |
| `kevin-triage`, `kevin-radar`, `user-feedback`, `kevin-digest` | Kevin | Ticket-ops streams |

Anything written for a founder's inbox — `founder-task` and `founder-decision`
bodies, or any email — must follow the founder-readability standard in
[`founder-comms.md`](founder-comms.md): lead with numbered plain-language
steps + links, no repo jargon, the "why" in one sentence at the end.
