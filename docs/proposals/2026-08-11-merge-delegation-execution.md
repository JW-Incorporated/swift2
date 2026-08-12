# Merge-delegation execution: "never merge routine work again"

**Status:** PROPOSAL — decision entry in `docs/decisions.md` marked *PENDING Wyatt*.
**Author:** CTO engineering session, 2026-08-11.
**Builds on:** PR #1910 (`docs/autonomy-expansion`) — the routing taxonomy, the
`review:not-run` / `review:contested` split, `NEVER_ALLOWLIST`, and
`scripts/check-work-ownership.mjs`. **Read #1910 first; this doc is the execution
layer on top of its framework.** Where #1910 answered "should we build a
founder-bot" (no) and "what is the shape of a safe grant" (an artifact class with
a mechanical inertness proof), this doc does the category-by-category accounting,
ships the one guard that needs no judgement call, and sequences the open-PR
residue.

---

## 0. The goal, stated honestly

The founder wants to stop merging routine work. The wrong reading is "give agents
merge rights." The right reading — and the one #1910 already argued — is: **make
each *class* of merge safe to happen with no human, on mechanical proof, and be
honest about the residue that must stay human.** "Never merge again" ships as
**"never merge *routine* work again, and here is the small set that isn't
routine."**

Two things make a class safe to auto-merge:

1. **A path fence** — the change only touches paths that cannot, by
   construction, execute code or change the merge rules. This is what
   `auto-merge-content.yml` + `.github/content-automerge-allowlist.txt` already
   do, and what `check-content-inert.mjs` *proves* for seed files.
2. **A regression fence** — nothing about the *order* PRs land in can silently
   undo a fix. This is the gap #1903 blew open, and the one concrete thing this
   PR closes (§3).

Neither fence is about identity. That matters, because provenance in this repo is
currently decorative (§5).

---

## 1. The category table

For each class: where it merges today, the harm if it auto-merged blindly, the
mechanical gate that could stand in for a human read, and the recommendation.

| Class | Current merge path | Harm if auto-merged blindly | Mechanical gate that substitutes for a human read | Recommendation |
|---|---|---|---|---|
| **Seed content** (`supabase/seed/**`) | Auto-merges today (allowlisted) | A seed file runs on import (Karen, validators) — could read a secret or exec | `check-content-inert.mjs` — a **positive AST grammar** proving the file can only build a constant (#488). Plus `validate:content`, `check:budget:seed` | **Keep auto-merge.** This is the model everything else is judged against. Precedent: 2026-07-18 seed grant. |
| **Generated vault** (`apps/web/lib/longlive/*.generated.ts`) | Auto-merges today (allowlisted) | A hand-edited "generated" file could carry arbitrary TS into the bundle | `check:generated` proves each file is byte-identical to what its sync script emits from the seeds; `check-automerge-allowlist.mjs` proves every generated file is listed-or-excluded | **Keep auto-merge.** As reviewed as the seed edit that caused it. Precedent: 2026-08-11 generated-files widening (#1902). |
| **Social queue drafts** (`social/queue/**`) | Auto-merges today, gated by `check-drafts.mjs` | A low-quality/duplicate/near-403 draft posts publicly | `scripts/social/check-drafts.mjs` (media required, no banned openers, sibling-copy divergence, era-art justification) | **Keep auto-merge.** Precedent: 2026-07-25 social autopost. |
| **Social images** (`apps/web/public/social/**`) | **Now auto-merges** (this PR), gated by `check-drafts.mjs` + a fail-closed no-draft gate | A bot-picked image with a rights problem, or an unchecked image-only PR, lands on a public surface | `scripts/social/check-drafts.mjs` validates every image a draft references; the workflow's `has_social_media` gate DECLINES any social image not accompanied by a validated draft | **Widen — SHIPPED here** per docs/decisions.md 2026-08-11 (Joey) + Wyatt's directive, reconciling the #1902 scope entry. Only the `social/` subtree; the rest of `apps/web/public/**` stays human. |
| **Docs — non-governance** (narrative docs, NOT the governance set) | Human merge | A governance doc (decisions/charters/CLAUDE.md) edited under cover of "docs" silently changes the rules | Path fence: allowlist a doc prefix **only** if `NEVER_ALLOWLIST` bars every governance path, and docs are inert (Markdown, not executed) | **Widen — AFTER #1910 lands** (its `NEVER_ALLOWLIST` is the precondition). Cannot be a bare `docs/` prefix; see §2. |
| **a11y-lane fixes** (Austin's `#701/#703/#727` class) | Human merge | a11y PRs are **`.tsx` app code** — they change runtime behavior | *None today.* There is no `*.a11y.*` file convention, and no inertness proof for a React component. An axe/a11y CI lane would gate *correctness*, not *inertness* | **REFUSE as a path widening.** It is app code (§2). Build a dedicated a11y CI lane instead; revisit as its own class. |
| **Dev-dependency patch/minor** (Dependabot) | Human merge | A malicious/broken patch release lands in the toolchain; a stale lockfile reverts a fix (#1903) | `check:no-downgrade` (§3, **shipped here**) + `build` green + semver-range check + dev-only scope. Note: supply-chain risk (a malicious-but-passing release) is *not* caught by any CI check | **Widen via a SEPARATE workflow, not the content allowlist** (`package.json`/lockfiles are correctly barred). Unblocked by the guard this PR ships; recommend PENDING Wyatt (§2). |
| **App code** (`apps/web/**`, `packages/**`, `apps/worker/**`) | Human merge | Arbitrary behavior/security change ships to users | Tests + typecheck + build prove it *builds*, never that it's *correct or intended* | **REFUSE.** No mechanical gate substitutes for reading app code. Stays human. |
| **Workflows / CI** (`.github/**`) | Human merge | A workflow that can merge workflow files is a **self-modifying permission system** | — (any gate lives in `.github/` too, so it could be edited in the same PR) | **REFUSE, permanently.** In `NEVER_ALLOWLIST`. The gate cannot be allowed to widen itself. |
| **Charters** (`docs/agents/**`) | Human merge | An agent rewrites its own mandate | — (`docs/agents/README.md`: "no agent may edit any charter, including its own") | **REFUSE, permanently.** In `NEVER_ALLOWLIST`. |
| **Secrets / credentials** | Human merge (+ CLAUDE.md ban) | Credential exfiltration or rotation-by-bot | Secret-scanning blocks *committing* a secret; it cannot judge an *intended* secrets change | **REFUSE, permanently.** Decision-authority item in CLAUDE.md. |
| **Legal copy** (`apps/web/**/legal`, privacy/terms, `docs/content-ops/privacy-redlines.md`) | Human merge (needs counsel) | Legally-binding text ships unreviewed; a redline that "overrides everything" is edited | — (correctness is a legal judgement, not a CI check) | **REFUSE, permanently.** #800 is explicitly "needs counsel." |
| **Governance docs** (`CLAUDE.md`, `AGENTS.md`, `docs/decisions.md`, `docs/cto-role.md`, `docs/architecture.md`, `docs/proposals/**`, `docs/specs/**`, `docs/launch-readiness.md`) | Human merge | The rules-of-the-rules change themselves unreviewed — self-ratifying | — | **REFUSE, permanently.** In `NEVER_ALLOWLIST`. |
| **Migrations** (`supabase/migrations/**`) | Human merge | A schema change is **not** revertable by `git revert`; data may already be gone | — (irreversible by nature) | **REFUSE, permanently.** In `NEVER_ALLOWLIST`. |
| **Public media** (`apps/web/public/**`, EXCEPT the `social/` carve-out) | Human merge | A bot-picked image with a rights problem reaches a public surface | — (rights/appropriateness is human judgement) | **REFUSE for non-social public media** (decisions.md 2026-07-28). The two same-day "founder-approved" claims are now **resolved toward Joey** by Wyatt's 2026-08-11 directive: the `social/` subtree is granted (row above, gated by `check-drafts.mjs`); everything else under `apps/web/public/**` stays human. |

### What I would REFUSE to auto-merge, and why (the load-bearing list)

- **`.github/**` (workflows, this allowlist, Dependabot config, CODEOWNERS).** A
  workflow that can merge workflow files is a permission system that can rewrite
  its own permissions. There is no gate for this because *the gate is also here.*
- **Anything that changes the merge rules or agent permissions** — the allowlist
  files, the checker scripts (`scripts/**`), `package.json`, lockfiles, tsconfig,
  vitest config, `.gitignore`. One mistaken line is self-ratifying.
- **Governance docs & charters** (`docs/decisions.md`, `docs/agents/**`,
  `CLAUDE.md`, `AGENTS.md`, `docs/cto-role.md`, `docs/proposals/**`, …).
- **Secrets, legal copy, migrations, public media, and automated replies to real
  people.**

These are not "not yet." They are the residue that makes "never merge routine
work" *true*: the non-routine set, permanently human, enumerated so the promise
is honest.

---

## 2. Which widenings ship, and which are gated — with the proof for each

The brief listed three "strong candidates": `docs/**`, the a11y lane, and
Dependabot dev-deps. I verified each. The honest outcome is that **their safety
is a function of prerequisites that do not yet exist on `main`**, so shipping
them onto bare `main` today would be *unsafe*, not safe. Here is the accounting.

### 2a. `docs/**` non-governance — **GATED on #1910, not shipped here**

- **Why it's safe *in principle*:** Markdown is inert — it isn't executed by any
  runner, so the `check-content-inert` class of risk doesn't apply.
- **Why it is NOT safe to ship today:** The `docs/` tree mixes narrative content
  (`docs/audits/`, `docs/reviews/`, `docs/briefs/`) with **governance**
  (`docs/decisions.md`, `docs/agents/**`, `docs/cto-role.md`,
  `docs/architecture.md`, `docs/proposals/**`, `docs/specs/**`,
  `docs/launch-readiness.md`, `docs/content-ops/privacy-redlines.md`). A bare
  `docs/` prefix in the allowlist would let a bot PR edit `docs/decisions.md` and
  land it unreviewed — the exact self-ratifying hole `NEVER_ALLOWLIST` exists to
  close. The allowlist matcher is a literal `startsWith`, so it **cannot express
  "docs except governance"** on its own; the exclusion has to come from
  `NEVER_ALLOWLIST`, which is **only present once #1910 merges.**
- **Recommendation:** After #1910 lands, add specific *content* doc prefixes
  (candidates: `docs/reviews/`, `docs/briefs/` — each verified against
  `NEVER_ALLOWLIST` by `check-automerge-allowlist.mjs`, which already refuses any
  entry that overlaps a barred prefix). **Do not add a bare `docs/`.** This is a
  one-line-per-prefix change once its precondition exists; it is written up here
  rather than shipped so it can't land ahead of its guard.

### 2b. a11y lane — **REFUSED as a path widening**

a11y fixes (#701/#703/#727, Austin's lane) edit `.tsx` components and app routes
— confirmed: there is no `*.a11y.*` file in the repo, so there is no path a fence
could target, and the changes are runtime app code. **Auto-merging app code is on
the permanent refuse list.** The right mechanism is a dedicated a11y CI lane (axe
assertions on the affected surfaces) that gates *correctness* — that is a build,
not an allowlist line, and it's a proper follow-up. Until then these are human
merges (and small ones — see the residue, §4).

### 2c. Dependabot dev-dependency patch/minor — **separate workflow, PENDING Wyatt; unblocked by §3**

- **Why the content allowlist is the wrong vehicle:** a Dependabot PR touches
  `package.json` and `package-lock.json`, both correctly in `NEVER_ALLOWLIST`
  (a lockfile edit can swap what any check executes). It must **not** go through
  the content path fence.
- **The right vehicle:** a small dedicated workflow keyed on
  `github.actor == 'dependabot[bot]'` that enables auto-merge only when **all**
  hold: (1) update type is `patch` or `minor` (from Dependabot's metadata), (2)
  the dependency is a **dev** dependency (not shipped to users), (3) `build` is
  green, and (4) **`check:no-downgrade` is green** — the guard this PR ships,
  which is the piece that makes it safe against the #1903 merge-order class.
- **The residual risk I will not paper over:** no CI check catches a
  *malicious-but-passing* dependency release (a supply-chain attack). Patch/minor
  + dev-only + audit narrows it; it does not eliminate it. That is why I mark this
  **PENDING Wyatt** rather than auto-enabling it — it is a genuine risk-tolerance
  call, not a mechanical one.

### 2d. What this PR **does** ship

- **The dependency-downgrade guard (§3)** — pure mechanism, proven-needed,
  proven against the real #1903 regression, wired into the required `build` job.
- **The social-image carve-out (§2e)** — a founder-approved widening
  (docs/decisions.md 2026-08-11, Joey; Wyatt's implement directive), reconciling
  the #1902 "Content auto-merge scope" entry toward Joey's image decision.
- **This design doc + the `docs/decisions.md` entry** (PENDING Wyatt on the
  guard/plan; the social carve-out is already founder-approved).

The guard is the highest-leverage thing here: it is the regression fence that
makes *every* auto-merge class — the ones that exist today and the dependency
class we want next — safe against the merge-order failure that actually bit us.

### 2e. Social-image carve-out (`apps/web/public/social/**`) — SHIPPED

Founder-approved (docs/decisions.md 2026-08-11, "Auto-merge allowlist extended to
`apps/web/public/social/**`", Joey), implemented here per Wyatt's 2026-08-11
directive. This is the ONE exception to "bot-picked media gets human eyes"
(2026-07-28), justified because the default social image is now a **screenshot of
our own site** — no third-party rights question — and the pre-2026-08-11 friction
(image PRs waiting on a human) had selected *against* good images. What ships:

- **`apps/web/public/social/` added to `.github/content-automerge-allowlist.txt`**
  — only the `social/` subtree, never the rest of `apps/web/public/**`. The
  base-ref fetch is untouched: the workflow still reads the allowlist from `main`
  via API, so a PR cannot widen its own gate.
- **`scripts/check-automerge-allowlist.test.ts` reconciled** — the #1902 test that
  asserted `apps/web/public/social/*.png` must NOT auto-merge now asserts it IS
  covered, while a **non-social** public image (`apps/web/public/eras/*.png`,
  `og-image.png`) still is NOT. The checker's real job (generated-file drift +
  re-inline detection) is unchanged.
- **A fail-closed gate in `auto-merge-content.yml`.** `check-drafts.mjs` is the
  human-look replacement, but it only runs when a PR also changes a
  `social/queue/**.json` draft. So an **image-only** PR would otherwise be
  allowlisted-by-path yet **validated by nothing** — a fail-*open* hole. The
  `enable` job now reads check-drafts' `has_drafts` output and **DECLINES any PR
  that commits a social image without an accompanying validated draft.** With a
  draft present, check-drafts is a hard `needs:` of `enable`, so a failing draft
  check already skips auto-merge. `hold` / `cie:escalate` / `founder-decision`
  labels and `CONTENT_AUTOMERGE_FREEZE` still block, unchanged.
- **Known residual (documented, not closed here):** an image committed alongside a
  *passing* draft that does not itself reference that image (an orphan-within-a-
  draft-PR) is not individually validated. It is low-risk — an unreferenced image
  is not posted until some future draft references it, and that draft's own
  check-drafts run validates the path — but a stricter "every committed social
  image must be referenced by a passing draft" check is a reasonable follow-up.

**Interaction with #1910 (must be reconciled at merge time).** #1910's
`NEVER_ALLOWLIST` bars `apps/web/public/` outright. Once #1910 lands, the
`check-automerge-allowlist.mjs` `overlaps()` rule would flag this PR's
`apps/web/public/social/` allowlist entry as touching a barred prefix and fail
`build`. Whichever of {#1910, this PR} merges second must narrow #1910's
`apps/web/public/` bar to exempt the granted `apps/web/public/social/` subtree
(keep the bar, let the more-specific granted prefix through). This is the same
"make the two mechanisms agree" reconciliation one layer up — called out here so
it isn't discovered as a red `build` after the fact.

---

## 3. The dependency-downgrade guard (`scripts/check-no-downgrade.mjs`)

**The bug it exists for.** On 2026-08-11, PR #1903 branched from a base that
predated #1893's `brace-expansion 5.0.7 → 5.0.9` security bump, regenerated
`package-lock.json` from that stale tree, and squash-merged — silently rewriting
`brace-expansion` back to `5.0.7` on `main`, re-opening the CVE, with a green
check and nobody looking (#1933 is the cleanup). A per-PR diff check can't catch
this: #1903's diff was internally consistent. **The regression exists only
relative to what `main` grew to while the PR sat open** — i.e. it is a
merge-order regression, exactly the class that makes blind auto-merge dangerous.

**What the guard does.** It parses the head `package-lock.json` and the base
branch's `package-lock.json` (fetched from the **live** base at build time, not
the PR's stale base), maps each dependency name to its **highest** resolved
version on each side, and **fails `build` if any name's highest version
decreased.** New packages and fully-removed packages are ignored; only a genuine
decrease of something present on both sides trips it. Intentional downgrades go
in `.github/dependency-downgrade-allowlist.json` with a reason and approver —
and because that file is under `.github/` (barred by `NEVER_ALLOWLIST`), a
downgrade exception **always gets a human**, by construction.

**Wired into `build`** (`.github/workflows/ci.yml`), after
`check:automerge-allowlist`:

```yaml
- name: Guard against dependency downgrades vs main
  run: |
    git fetch --no-tags --depth=1 origin main
    npm run check:no-downgrade -- --base-ref FETCH_HEAD
```

Fetching the base at build time is the crux: combined with "require branches up
to date before merging," a stale lockfile is re-evaluated against current `main`
before it can land, so the #1903 revert would fail `build` instead of merging.

**Tested against the real #1903 regression.** `scripts/check-no-downgrade.test.ts`
carries the actual versions from that merge (`git 490752f..8a11310`):
`brace-expansion 5.0.9 → 5.0.7` is flagged, while `@supabase/supabase-js
2.112.2 → 2.112.3` in the same PR (an *increase*) does not mask it. Run live
against the two real lockfiles extracted from history, the guard exits 1 and
prints `✗ brace-expansion: 5.0.9 -> 5.0.7`; run against the current tree it exits
0 (no false positives). Exit codes are 0 (clean) / 1 (downgrade) / 2 (broken
gate — unreadable/unparseable lockfile or allowlist), so "the check broke" can
never be reported as "nothing regressed."

---

## 4. The open-PR residue and a merge-order sequence

There are ~35 open PRs. Under the *current* content allowlist (and even under the
§2 widenings, which are gated), **most are not auto-mergeable** because they touch
`scripts/**`, `apps/web/**`, `.github/**`, or `package.json` — sampled paths
confirm it (#1932 → `apps/web/lib` + `scripts`; #1924 → `.github/workflows` +
`package.json`; #1908 → `scripts/content-engine` + seed). So the residue is a
human batch. The point of a good sequence is to make it **one batch, in an order
that dodges the two known conflict clusters**, after which the widened auto-merge
keeps future work self-clearing.

### Known conflict clusters (from the brief, confirmed against the PR list)

- **`.github/workflows/watchdog.yml`:** #1629, #1904, #1922, #1910, #1642.
  **Foundational: #1629** (Vault Run phase 3.5 — content PRs stuck red now alert
  and retry). Everything else that edits watchdog should rebase on it.
- **`docs/agents/runners.md`:** #1922, #1904, #1887 (#1899 already merged as
  490752f — drop it from the cluster).

### Recommended sequence (one batch, conflict-avoiding)

**Wave 0 — the framework this plan stands on (merge first):**
1. **#1910** — `NEVER_ALLOWLIST` + work-ownership check. *Precondition for the
   §2a docs widening and for the self-amendment bar every later grant relies on.*
2. **This PR** — the downgrade guard + category plan. Independent of #1910 for
   its code; sequenced here so the guard protects every subsequent lockfile-
   touching merge in the batch.

**Wave 1 — the watchdog foundation, in dependency order (each rebased on the
prior to avoid the `watchdog.yml` conflict):**
3. **#1629** (foundational watchdog change) → 4. **#1642** (CI actions pin) →
5. **#1904** (vault-run phase 4, watchdog + runners.md) → 6. **#1922**
(karen filing, watchdog + runners.md). Merging these in this order means each
later PR resolves `watchdog.yml`/`runners.md` against an already-updated base
once, instead of N pairwise conflicts.

**Wave 2 — independent green PRs (no shared-file conflicts; any order):**
the confirmed-`CLEAN` set first — **#1934** (sourcing integrity), **#1932**
(reliability plumbing), **#1924** (social pipeline robustness) — then the
remaining app/docs PRs (#1919, #1921, #1923, #1925, #1926, #1927, #1928, #1929,
#1930, #1931, #1905, #1907, #1888, #1889, #1890). #1933 (Dependabot nanoid +
brace-expansion re-fix) should merge here and will now be *protected by the guard
from Wave 0* — it's the corrective for #1903.

**Wave 3 — content PRs stranded by a mixed path:** #1585 (paths:
`apps/web/lib/longlive/` + `docs/audits/engine/` + `supabase/seed/content/` — all
content-adjacent, so if it's stuck it's on a non-generated `lib/longlive` file or
red CI, *not* `public/`; worth a look — it may already qualify), #1618, #1762,
#1908 (seed + `scripts/content-engine`). Where these are pure `supabase/seed/**`
(and generated vault), they auto-merge today; where they also touch `scripts/**`,
split the content commit out so the content half self-clears and only the script
half needs a human.

**Wave 4 — the a11y lane** (#1619, #1596, #1580, #1571-adjacent): small `.tsx`
fixes, human-merged until the a11y CI lane (§2b) exists.

After Wave 0–1 land, the recurring future work (seed, generated vault, social
queue, and — once approved — content docs and dev-deps) self-clears, and the
residue shrinks to app code, workflows, charters, legal, and migrations: the
permanent-human set.

*(Exact per-PR path classification should be re-confirmed at merge time; the
GitHub API was intermittently timing out from this session, so a few file lists
in Wave 2/3 are inferred from titles/branches rather than fetched.)*

---

## 5. The identity prerequisite

#1910 found that **founder provenance is decorative**: both GitHub accounts are
shared by every agent (2 collaborators, both admin, both used by every runner),
so any grant keyed to "a founder approved it" is currently unsafe — a bot can
post from the same account a founder approves from.

**Which widenings depend on real per-agent identity, and which don't:**

| Widening | Depends on real identity? | Why |
|---|---|---|
| Seed / generated / social-queue auto-merge (existing) | **No** | Safety is **path + inertness**, not "who." A bot can name a branch anything; it can't make app code look like a seed file. |
| **The downgrade guard (this PR)** | **No** | Pure mechanism over two lockfiles. No identity anywhere. |
| Content-docs widening (§2a) | **No** | Path + inertness again, gated by `NEVER_ALLOWLIST`, not by who authored it. |
| Dependabot dev-dep auto-merge (§2c) | **Partially** | The `dependabot[bot]` actor check is a real identity signal *from GitHub*, which is trustworthy (it's GitHub's, not ours). But any "a founder waved this specific bump" exception is **unsafe until real accounts exist.** |
| Anything keyed to "a founder approved" (the 2026-07-18 grant's model) | **Yes** | Vested on a comment from an account any agent can post from. **Hard prerequisite** to further identity-based grants: real personal accounts for Joey/Wyatt; demote the bots to `write`. |

**Net:** every widening this PR ships or recommends via *path + mechanism* is safe
without identity. Only *identity-based* grants (founder-attested exceptions) must
wait for real accounts.

---

## 6. What must stay human — forever

So that "never merge routine work again" is an honest promise, here is the set
that is **not** routine and does not get a mechanical stand-in, now or later:

1. **App code** — no gate proves intent or correctness, only that it builds.
2. **`.github/**` workflows & CI** — the gate cannot be allowed to widen itself.
3. **The merge rules themselves** — allowlists, checker scripts, `package.json`,
   lockfiles, config. Self-ratifying if they could merge themselves.
4. **Governance docs & charters** — `CLAUDE.md`, `AGENTS.md`,
   `docs/decisions.md`, `docs/cto-role.md`, `docs/agents/**`, proposals, specs,
   launch-readiness.
5. **Secrets & credentials.**
6. **Legal copy** — needs counsel.
7. **Schema migrations** — irreversible; `git revert` is not a rollback.
8. **Public media** (outside the gated `social/` carve-out) — rights/judgement.
9. **Automated replies to real people.**

Everything else — seed, generated vault, social drafts, and (pending approvals)
content docs and dev-dependency bumps — self-clears on mechanical proof. That is
the promise, delivered as far as it can honestly go.
