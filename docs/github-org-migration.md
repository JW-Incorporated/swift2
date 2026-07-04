# Runbook: move Swift2 into a company GitHub Org (+ Vercel Team)

**Goal:** get the repo off a founder's *personal* GitHub account and into a
**GitHub Organization both founders own**, then deploy from a **Vercel Team**.
After this, either founder can manage code + deploys and **neither is ever the
gatekeeper** — which is what unblocks push-to-deploy (see `docs/deploy.md` Path B).

**Why this matters (the short version):** today `Swift2` lives under
`sffan15-sys` — Joey's *personal* account. GitHub only lets the **account owner**
authorize apps (like Vercel) on a personal repo, so Wyatt (a collaborator) is
blocked from wiring up integrations. Company assets shouldn't hang off one
person's personal identity. See the decision-log entry dated 2026-07-04.

- **Time:** ~15 minutes.
- **Cost:** $0 (GitHub Free org = unlimited private repos + collaborators;
  Vercel Hobby/Free is fine until real traffic).
- **Reversible?** Yes — org renames and repo transfers are non-destructive and
  GitHub keeps redirects from the old URL.

Steps are tagged **[J]** (Joey — current repo owner), **[W]** (Wyatt — CTO), or
**[both]**. Do them in order.

---

## Before you start

- [ ] **[both]** Agree an **org name**. The product name is still TBD and GitHub
  lets you rename an org later (with URL redirects), so don't block on branding —
  pick a neutral placeholder (e.g. `swift2-app`) and move on.
- [ ] **[both]** Each be signed in to your own GitHub account in the browser.

## Part A — Create the Org and make both founders Owners

1. **[W or J]** Go to **github.com/account/organizations/new** → choose the
   **Free** plan → set the org name → finish. (Skip the "invite members" screen
   for now; next step handles it.)
2. **[creator]** Org → **Settings → People → Invite member** → add the *other*
   founder → **Role: Owner**.
3. **[other founder]** Accept the emailed invite. Confirm both accounts show
   **Owner** under Org → People.

> Both Owners = the whole point. Either founder can now authorize apps, manage
> settings, and connect Vercel without waiting on the other.

## Part B — Transfer the repo into the Org  **[J]**

Only Joey can do this (he owns the source repo).

4. **[J]** Go to **github.com/sffan15-sys/Swift2 → Settings → General**, scroll to
   the **Danger Zone → Transfer ownership**.
5. **[J]** New owner's name = **`<ORG>`** (the org from Part A). Type the repo
   name to confirm → **I understand, transfer this repository**.
   - This **preserves** issues, PRs, history, and stars, and **redirects** the
     old `sffan15-sys/Swift2` URL to the new one.
6. **[J]** Confirm the repo now loads at **github.com/`<ORG>`/Swift2**.

## Part C — Point every local clone at the new URL  **[both]**

Each founder, in **each** local clone of the repo, run:

```bash
git remote set-url origin https://github.com/<ORG>/Swift2.git
git remote -v          # verify both fetch/push show the new URL
git fetch origin       # confirm it works
```

(The old URL still redirects, but set it explicitly so tooling isn't relying on
a redirect.)

## Part D — Re-check settings that don't survive a transfer  **[W]**

A transfer drops a few security-scoped things. Verify/re-add:

- [ ] **Actions secrets** (Settings → Secrets and variables → Actions): GitHub
  **removes repo secrets on transfer**. Re-add any that existed.
  *Current status: CI (`.github/workflows/ci.yml`) uses **no** secrets today —
  budget/content checks run from seed files — so there should be nothing to
  re-add. Confirm the tab is empty and CI is green on the next push.*
- [ ] **Branch protection on `main`** (Settings → Branches): re-add if it existed
  (recommended baseline: require a PR before merging). If it never existed, this
  is a good moment to add it.
- [ ] **Collaborators** (Settings → Collaborators): both founders are now Org
  Owners with full access, so remove any now-redundant personal collaborator
  invites from the pre-transfer setup.

## Part E — Deploy from a Vercel Team

Now that the repo is in the org, **either founder** can connect Vercel.

7. **[W]** In Vercel, create a **Team** (account switcher → **Create Team** →
   Hobby/Free), then invite Joey (Team → Settings → Members).
8. **[W or J]** Follow **`docs/deploy.md` → Path B (GitHub integration)** to
   import `<ORG>/Swift2`. Key settings (also in that doc):
   - **Authorize the Vercel GitHub App on the `<ORG>`** when prompted — either
     Owner can now approve this (the thing that was blocked before).
   - **Root Directory → `apps/web`** (monorepo; Vercel installs the npm
     workspaces from the repo root and builds the web app).
   - **Environment variables** — the two **public** values from
     `apps/web/.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *(the app also accepts
       `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a fallback — either works)*
     - ⚠️ Never add the worker's `SUPABASE_DB_URL` or any `service_role` key —
       the web app never uses them and they must not reach the browser.
   - Add the env vars to **both Production and Preview**, then **Deploy**.

## Verify it works

- [ ] Open a throwaway PR (or push a small commit to a branch) → a Vercel
  **Preview** check appears and builds green, with a preview URL.
- [ ] Merge to `main` → the **Production** deploy updates automatically.
- [ ] Open the production URL → the reader loads **with era data** (proves the
  env vars are wired correctly). Optionally check the payload budget:
  `npm run check:budget -- --url https://<your-app>/vault/tier0`.

## Notes

- The manual Vercel CLI login done earlier (Wyatt's personal account) created
  **no project** — nothing to clean up. You can ignore it or `vercel logout`.
- **Later "serious company" hardening** (not needed now, listed so it's on
  record): a shared Google Workspace identity that *owns* the org / Vercel team /
  domain (so nothing hangs off personal gmail), org-wide 2FA enforcement, a
  Vercel spend cap, and `CODEOWNERS` + branch protection on `main`. The org is
  the container all of these hang off — which is why it's the one high-leverage
  move to make early.
