# The desks — agent charters

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

## Roster

| Charter | Agent | Status |
|---|---|---|
| [`marjorie.md`](marjorie.md) | Chief of staff + manager | Phase 1 — active |
| `../kevin.md` | Ticket ops (moves here in Phase 2) | Active on Wyatt's side |
| *(Phase 2)* | Karen (Integrity), v0, delegation scripts | Charters pending |
| *(Phase 1, copy desk)* | Theo, Loren, Vera, Deb — `docs/content-ops/personas/` | Spec approved (#463) |
| *(Phase 3)* | Growth & Community, Watch | Pre-launch |

## Labels the desks own

| Label | Owner | Meaning |
|---|---|---|
| `founder-decision` | Marjorie (bank) | Needs a founder answer; filed via the issue form |
| `founders-brief` | Marjorie | The daily brief issues |
| `watchdog-alert` | watchdog Action | A cadence failed loudly |
| `intake` | Content desk | A real-world event dropped for authoring |
| `cie`, `cie:*` | Karen | Content-integrity findings |
| `kevin-triage`, `kevin-radar`, `user-feedback`, `kevin-digest` | Kevin | Ticket-ops streams |
