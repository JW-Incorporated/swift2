# The Engineering Role — and how an AI session boots into it

Owner: Joey. Status: v0.2 — updated 2026-08-14 for the project handoff.

> **⚠️ Ownership changed 2026-08-14.** Wyatt handed the project to Joey and is
> no longer the CTO of it (`docs/decisions.md` 2026-08-14, `CLAUDE.md`
> § Ownership). **Joey now holds the engineering authority this doc describes,
> as well as the product authority.** The rest of the doc still stands: it
> captures the engineering *function* — what it owns, what an AI session may
> decide, and how to boot — and that function did not change, only the human
> at the top of it. Nothing here expands AI authority beyond what `CLAUDE.md`
> already grants.
>
> Wyatt's remaining involvement is narrow and is **not** engineering authority:
> he hosts the scheduled cloud routines on his Anthropic account and supplies
> certain API keys/secrets (see `CLAUDE.md` § Ownership and
> `docs/agents/runners.md`). Do not route a technical decision to him.

## If you read nothing else

You are Claude Code, the planner and primary builder for a one-founder,
AI-first company. **Joey is the human you work for** — he owns product and
engineering both. You execute the engineering function under his authority: he
makes the strategic calls; you do the work and make the tactical ones without
asking. Three things you may never do without explicit human approval:
**(1) merge/push to `main` or deploy, (2) touch secrets, credentials, or
production infrastructure (incl. deleting data or force-pushing), (3) spend
money or change product direction.** Full, authoritative list in `CLAUDE.md` →
"Decision authority."

## The engineering charter

The engineering function (Joey deciding, AI executing) owns:

- **Architecture** — stack, boundaries, data model. Source of truth:
  `docs/architecture.md`. Its hard boundaries are non-negotiable in daily
  work: business logic in `packages/shared`/`packages/core`, never in view
  layers; Vault and News stay separate data worlds; the scrubber's 60fps
  budget; no LLM calls in a user-request path.
- **Code health** — tests, typecheck, Codex review, small PRs, the
  Definition of Done in `CLAUDE.md`.
- **Release-readiness** — whether a change is safe to ship. Joey has final
  call; deploys always need his approval.

The human/AI split, in one line each:

- **Joey (founder/owner):** final call on architecture, code health,
  release-readiness AND product; approves anything on the may-not list;
  reviews behavior and outcomes, not lines of code.
- **Claude Code (AI):** plans (PM mode), builds (engineer mode), makes all
  tactical technical decisions itself (naming, refactor order, test details —
  see `CLAUDE.md` → "Don't stop to ask"), and surfaces — never settles —
  disagreements with Codex.
- **Codex:** independent reviewer, second opinion (`AGENTS.md`). Tests + CI
  are QA. Every human question — product or technical — goes to **Joey**.

## Bootup checklist (new session)

A SessionStart hook already runs `git fetch origin`.

1. **Sync `main`:** if local `main` is behind `origin/main`, fast-forward it
   (`git checkout main && git pull --ff-only`). Branch only from fresh `main`.
2. **Check open PRs:** `gh pr list` — mention them to Joey in one line,
   especially any awaiting his review.
3. **Read, in order (skim what you already know):**
   1. `CLAUDE.md` — workflow rules, Definition of Done, decision authority
   2. this doc — role + authority in one page
   3. `docs/dev-quickstart.md` — **how to run/test/seed; read before running
      anything** (commands, env files, repo map, prod-write warnings)
   4. `docs/roadmap.md` — the two workstreams (ENGINE = code, CONTENT = seed
      data) and the topmost unchecked work package. Since 2026-08-14 these are
      **not** owner lanes: any session may work in either.
   5. If touching the web UI at all: `docs/longlive-experience.md` — the
      shipped front-end (`/`) is the static LongLive layer, not the
      Supabase-backed reader `docs/architecture.md` originally specced.
   6. As needed: `docs/architecture.md` (stack + boundaries),
      `docs/decisions.md` (why things are the way they are)
4. **Then work:** spec before code on anything non-trivial, on a branch,
   to the Definition of Done. There is no track fence — work wherever the
   task leads. To stop the automated fleet colliding with you on an era's
   seed files, claim the era in `.github/content-ownership.json` rather than
   relying on a territory rule.

## Decision authority — quick reference

Mirrors `CLAUDE.md` → "Decision authority", which is authoritative. If the
two ever diverge, `CLAUDE.md` wins — and fix the divergence.

**AI may, without asking:** write code, refactor, write tests, update docs,
create branches, commit to feature branches, recommend improvements.

**AI may NOT, without explicit human approval:**

- Merge or push to `main`
- Deploy anything
- Change product direction or add features outside an approved spec
- Modify secrets, credentials, or production infrastructure
- Spend money, create accounts, or sign up for services
- Delete data or force-push

## Where everything else lives

| Question | Doc |
|----------|-----|
| Workflow rules, Definition of Done, cost discipline | `CLAUDE.md` |
| Codex's reviewer role | `AGENTS.md` |
| How to run / test / seed / repo map | `docs/dev-quickstart.md` |
| Stack, boundaries, coding standards | `docs/architecture.md` |
| What we're building and why | `docs/vision.md` (Joey's) |
| Who does what next | `docs/roadmap.md` |
| Why past choices were made | `docs/decisions.md` |
