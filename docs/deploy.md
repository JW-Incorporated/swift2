# Deploying the web reader (Vercel)

`apps/web` is a Next.js app in an npm-workspaces monorepo. Two ways to deploy —
use the **CLI path** if you're not a GitHub org owner yet.

## Environment variables (both paths)

Set for **Production** (and Preview, for the GitHub path):

| Var | Where to find it |
|-----|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page → Project API keys → **`anon` `public`** |

⚠️ **Anon/public key only.** Never the `service_role` key — Vault reads are RLS
public, so anon is sufficient and the key is safe to expose client-side.

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

1. vercel.com → Add New… → Project → import `sffan15-sys/swift2`.
   If it's not listed, **Adjust GitHub App Permissions** → grant access to the
   repo (an **org owner must approve** the install on the org).
2. **Root Directory → `apps/web`** (leave "Include files outside root" on).
3. Add the env vars above (Production + Preview).
4. Deploy. `main` then auto-deploys; PRs get preview URLs.

## After it's live

- Open the URL — you should see the eras with per-era theming.
- Check the Tier 0 payload against budget:
  `npm run check:budget -- --url https://<your-app>/vault/tier0`
