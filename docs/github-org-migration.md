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
- **Cost — read before Part E:** The **GitHub org is free** (GitHub Free =
  unlimited private repos + collaborators). **Vercel is the catch:** Vercel's
  free **Hobby** plan **cannot auto-deploy a *private* repo owned by an
  organization**, and Hobby has no team members. So push-to-deploy from this
  (private) org repo means **Vercel Pro (~$20/member/month)**. Three ways to
  handle it, decide before Part E:
  1. **Vercel Pro** — pay it; cleanest, gives auto-deploy + previews + both
     founders on the team.
  2. **Make the repo public** — then Hobby's Git integration works for free
     (only do this if you're OK with the code being public).
  3. **Stay on CLI deploys** (`docs/deploy.md` Path A) — free on Hobby even for
     a private repo (the CLI uploads the code, it doesn't connect the repo), but
     **no auto-deploy on push** — someone runs `vercel --prod` to ship.
- **Reversible?** The **repo transfer** is non-destructive and GitHub redirects
  the old repo URL. An **org rename** is messier — git remotes redirect, but old
  web/profile URLs 404 and the freed name becomes claimable by anyone — so treat
  the org name as sticky (see below).

Steps are tagged **[J]** (Joey — current repo owner), **[W]** (Wyatt — CTO), or
**[both]**. Do them in order.

---

## Before you start

- [ ] **[both]** Agree an **org name**. Renaming an org later is possible but not
  clean (old URLs 404 and the old name is claimable by anyone), so pick something
  you're comfortable keeping — a neutral placeholder like `swift2-app` is fine
  since it needn't match the eventual product brand.
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

## Part D — Re-check repo settings after the transfer  **[W]**

Most things — issues, PRs, stars, **secrets, webhooks, deploy keys** — carry over
with a transfer. A couple are still worth confirming:

- [ ] **Actions secrets** (Settings → Secrets and variables → Actions): these
  **remain** after a transfer (GitHub does not wipe them), so there's nothing to
  re-add. *For the record, CI (`.github/workflows/ci.yml`) uses **no** secrets
  today — budget/content checks run from seed files — so this tab should simply
  be empty. Confirm CI is green on the next push regardless.*
- [ ] **Branch protection on `main`** (Settings → Branches): re-add if it existed
  (recommended baseline: require a PR before merging). If it never existed, this
  is a good moment to add it.
- [ ] **Collaborators** (Settings → Collaborators): both founders are now Org
  Owners with full access, so remove any now-redundant personal collaborator
  invites from the pre-transfer setup.

## Part E — Deploy from a Vercel Team

Now that the repo is in the org, **either founder** can connect Vercel.

7. **[W]** In Vercel, create a **Team** and pick the plan per the **Cost** note
   near the top: auto-deploy from this **private org repo needs Pro**
   (~$20/member/mo) — Hobby won't even list a private org repo, and Hobby has no
   team members. Then invite Joey (Team → Settings → Members). *(If instead you
   chose "make the repo public" or "CLI-only" from the Cost note, skip the
   Team/Pro step — public repos deploy on free Hobby, and CLI deploys follow
   `docs/deploy.md` Path A.)*
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
