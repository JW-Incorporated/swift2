# Deploying the web reader (Vercel)

## The one URL that matters

**https://swift2-ten.vercel.app/** is the real, shared production deployment
(Joey's Vercel account/project). This is the only URL to use for QA, status
checks, or "is it live" questions — verify against this doc if a PR comment
or chat message claims a different URL, rather than trusting it at face
value.

**https://swift2-web-nine.vercel.app/** is a *separate*, personal Vercel
project (Wyatt's account) used only when v0 is doing UX exploration work. It
is not the product, is not kept in sync with `main`, and should never be
cited as "the live site."

The `Vercel – swift2` GitHub check failing with "Git author must have access"
on PRs authored as `wjduvall-cmd` is a known, harmless cross-account quirk —
Wyatt's commits don't have push-deploy access to Joey's personal Vercel
project, but this doesn't block `main`'s actual production deploys or mean
the code is broken.

`apps/web` is a Next.js app in an npm-workspaces monorepo. Two ways to deploy —
use the **CLI path** if you're not a GitHub org owner yet.

## Environment variables (both paths)

Set for **Production** (and Preview, for the GitHub path):

| Var | Where to find it |
|-----|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page → Project API keys → **`anon` `public`** |
| `GITHUB_FEEDBACK_TOKEN` | **Feedback button only** — a GitHub token with `issues:write` on the repo (fine-grained PAT scoped to `JW-Incorporated/swift2` → Issues: Read & write, or a GitHub App installation token). Server-side only; never `NEXT_PUBLIC_`. |
| `FEEDBACK_REPO` *(optional)* | Repo the feedback button files issues into. Defaults to `JW-Incorporated/swift2`. |

⚠️ **Anon/public key only.** Never the `service_role` key — Vault reads are RLS
public, so anon is sufficient and the key is safe to expose client-side.

🔒 **`GITHUB_FEEDBACK_TOKEN` is a server secret.** The `/api/feedback` route (a
serverless function) uses it to file a GitHub issue per submission; the token is
never sent to the browser. Without it, the feedback button degrades gracefully
(it returns a friendly "not wired up yet" message instead of erroring), so
Preview/local builds don't need it. Scope the token as narrowly as possible
(Issues: write only) and rotate if leaked. **The route deliberately does NOT
fall back to a generic `GITHUB_TOKEN`** — this endpoint is public and
unauthenticated, so it must run on this narrowly-scoped token or not at all
(if only a broad `GITHUB_TOKEN` is present, the button stays in the graceful
degraded state rather than borrowing those wider permissions).

## Path A — CLI (no GitHub org ownership required)

Linking the GitHub repo needs an **org owner** to approve Vercel's GitHub app.
Until that happens, deploy straight from your machine — the CLI uploads the repo
and builds in the cloud, no repo connection:

```bash
npm i -g vercel
vercel login            # email login
vercel link             # from repo ROOT — creates a project, no repo connection
```

Then in **vercel.com → this project → Settings → Root Directory**, set it to
`apps/web` (so Vercel builds the web app and installs workspaces from the root).
Add the env vars and deploy:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL         # paste, choose Production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY    # paste, choose Production
vercel --prod                                   # prints the live URL
```

Re-run `vercel --prod` to ship a new version. (No auto-deploy on push in this
mode — that's what Path B adds once the app is linked.)

## Path B — GitHub integration (once an org owner can approve)

1. vercel.com → Add New… → Project → import `JW-Incorporated/swift2`.
   If it's not listed, **Adjust GitHub App Permissions** → grant access to the
   repo (an **org owner must approve** the install on the org).
2. **Root Directory → `apps/web`** (leave "Include files outside root" on).
3. Add the env vars above (Production + Preview).
4. Deploy. `main` then auto-deploys; PRs get preview URLs.

## After it's live

- Open the URL — you should see the eras with per-era theming.
- Check the Tier 0 payload against budget:
  `npm run check:budget -- --url https://<your-app>/vault/tier0`
