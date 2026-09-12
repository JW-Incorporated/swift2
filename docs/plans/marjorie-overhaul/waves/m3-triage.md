# Wave M3 — Submissions triage

Paste everything below this line into a fresh **Sonnet** session in Swift2. Prerequisites: M1 merged and proven; no Tree wave and no M2 session open in this checkout.

---

You are executing Wave M3 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180). Read `PLAN.md`, then `docs/specs/marjorie-overhaul/s1-triage.md` in full — the source of truth — and skim `apps/web/app/api/feedback/route.ts`, `apps/web/app/api/intake/route.ts`, `apps/web/lib/longlive/submit-link.ts` for the title prefixes each producer writes. Up to 6 concurrent subagents; `executor` per task in its own worktree outside `Documents\Claude\Projects\`; you confirm real CI yourself, merge, exit.

**Hard rules carried in:** the M1 list (`waves/m1-comms.md`). In addition: `routine-marjorie-triage.yml` never edits product code or content; **spam is the only class she may close autonomously**, and never silently (label + one-line comment); the `intake` label has three producers so selection is by title prefix with `startsWith` in code, never GitHub search (it strips brackets); `desk:*` labels do not exist live — do not use them; a founder overrules with the one-reply vocabulary in the spec and her classification is never authority-bearing. Codex review on the routine and on `submissions.mjs`.

## Tasks

- **Labels first** — `scripts/marjorie/bootstrap-labels.mjs` adds `spam`, `marjorie-triaged`, `marjorie-filed`, `link-submission`, **and `founder-decision`** (the spec originally listed it as live; it is not — verify with `gh label list` and create it). Run the bootstrap once for real, paste the resulting `gh label list` lines.
- **S1 routine** — `routine-marjorie-triage.yml` (via `routine-template.yml`, Sonnet, `allowed_tools` scoped to `gh issue`, Read/Grep and `post-or-mail.mjs`), `docs/agents/runner-prompts/marjorie-triage.md` (five classes, the build-desk issue template with acceptance criteria and the reporter's words quoted, the roadmap-request paragraph, the needs-founder in-channel question with a 7-day nudge, the overrule vocabulary), `scripts/marjorie/lib/submissions.mjs` extended with the prefix selector and counts plus boundary tests. Update `docs/agents/README.md` § Labels the desks own.
- **Brief hook** — the C2 brief's "Since yesterday" submissions count must read the new `marjorie-triaged` state so triaged items stop counting as new; one-line change in `lib/submissions.mjs`, covered by a test.

## Done means

Three synthetic issues filed by you with the real producers' title prefixes: one bug with evidence → a build-desk issue with acceptance criteria and the quote, linked both ways; one needs-founder → an in-channel question with a recommendation and the `founder-decision` label; one spam → closed with label and comment; nothing else auto-closed. Cite issue numbers and the run URL on #4180. `MAP.md` rows. Tick M3 on #4180, update `STATE.md`, stop.
