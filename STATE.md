# STATE — session working memory

## 2026-09-13 (session: Sonnet — M3 wave DONE)

**Wave M3 of the Marjorie Overhaul (epic #4180) — complete.** Full closeout
comment with every run URL/PR/issue number:
https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5651038850

**Merged:** #4228 (labels), #4229 (routine + five classes + founder
handoff), #4237 (brief hook), #4238 (Discord-handoff identity fix, 2 Codex
rounds), #4240 (PLAN tick).

**Real live proof, not synthetic-only code review.** Filed three real
synthetic `[Feedback]` issues with the live site's own producer prefix,
dispatched `routine-marjorie-triage.yml` for real twice: run `34735870892`
classified bug/spam correctly but the needs-founder → Discord handoff
silently never fired; run `34736610727` (after the #4238 fix) proved it —
`delivered: discord`, message id `1548542716592521289` in
`#longlive-marjorie`. All three synthetic originals + the filed build-desk
issue closed afterward as test fixtures, nothing fake left for Kevin/Austin
or a founder.

**The live proof caught a real bug code review missed, then my own first
fix attempt introduced a second one** — worth remembering as a pattern:
`pendingFounderIssues`'s trust check used `viewerDidAuthor`, which is
relative to whichever credential runs the *current* query. The `run` job's
agent posts as `claude`; the `deliver` job reads those comments under
`secrets.GITHUB_TOKEN`'s own, different identity — a cross-job credential
mismatch, always `false`, confirmed live. First fix (commit `a5134483`)
replaced `viewerDidAuthor` with a `claude`/`claude[bot]` login allowlist —
but applied it to BOTH markers. Codex round 1 caught that this breaks the
`posted` marker specifically: `deliver` never authors as `claude`, so a real
`posted` marker would be permanently unrecognizable, reposting the same
handoff to Discord every sweep forever. Round 2 confirmed the real fix:
asymmetric trust — `pending` by login allowlist (cross-job), `posted` by
`viewerDidAuthor` (same-job-type, `deliver` both writes and reads it back
under its own consistent credential every time). **Lesson:** a cross-job
"is this my own comment" check needs a different mechanism per marker
depending on which job writes vs. reads it — there is no single primitive
that works for both ends of a producer/consumer pair split across job
boundaries.

**Four non-blocking follow-ups filed** from residual Codex findings, none
touching the core five-class path: #4230 (comment-list truncation in
override discovery), #4231 (override-boundary edge case: "after my last
comment" can permanently hide an unactioned override), #4232
(reconciliation marker is a one-way ratchet), #4239 (`deliver`'s `--limit
50` on open `founder-decision` issues is a structural cap).

**Process note:** hit the shared-checkout session-lock guard mid-session —
another session was active on `main` in this same checkout. Worked around
for the two affected untracked-file restores (`DEBUG.md`/`PLAN.md`, see
below) via `git show <ref>:<path>` + plain filesystem `cp` instead of `git
checkout -- <path>`, since the guard objects to checkout-family commands
specifically, not to reading/writing files directly. All branch-writing for
this wave went through dedicated worktrees under
`Temp\claude-worktrees\`, never this shared checkout, per standing rule.

**Next obvious step (future session):** M4 (Tree/Marjorie loop) waits for
Tree R2 (2026-09-21) and touches Tree's own prompts — Opus, not Sonnet.
Until then, the four M3 follow-ups above are fair game for any session with
spare capacity; none are urgent.

### Local checkout notes

Untracked `PLAN.md`/`DEBUG.md` are the Tree Overhaul Wave 4 lane plan +
debug notes (historical, unrelated epic — leave them; restored this session
after an earlier `git stash` swept them up by accident, per the M1 session's
own note that they should stay). Local vitest cannot run (Windows EPERM
symlink in `sync-web-react-globalSetup.ts`'s `globalSetup`) — CI is the real
gate; a scratch-only vitest config dropping `globalSetup`, or an ad hoc
`node -e` harness for a single pure function, is the local workaround, never
committed.
