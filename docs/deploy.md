# Deploying the web reader (Vercel)

## The one URL that matters

**https://www.longlivets.com/** (also reachable via https://longlivets.com/,
which redirects) is the real, shared production deployment — verified live
2026-07-12. As of that date the project runs entirely on **Wyatt's Vercel
team**, with Joey added as a team member; Joey's own personal Vercel account
was downgraded to Hobby and is no longer in the deploy path at all.

**Superseded — do not cite either of these anymore:** `swift2-ten.vercel.app`
(Joey's old personal project) and `swift2-web-nine.vercel.app` (Wyatt's old
personal sandbox, used for v0 UX exploration) were both pre-2026-07-12
arrangements. Neither is the current production URL.

The historical `Vercel – swift2` GitHub check failing with "Git author must
have access" on PRs authored as `wjduvall-cmd` was a cross-account quirk from
when Joey's and Wyatt's commits belonged to different Vercel teams. Now that
both identities are on one team, this should no longer occur — if it does
resurface, that's a real regression worth investigating, not the old known-
harmless case.

**2026-07-23 incident — a stray `Vercel – longlive` check:** Joey created a
new project named `longlive` under his personal account
(`sffan15-4353s-projects`) via the Vercel dashboard. Because that flow
auto-connects to GitHub, it immediately started appearing as a required-
looking check on every open PR — including one that had nothing to do with
deployment — and failed every build, because the project was left on the
dashboard's defaults (Framework Preset `Other`, Root Directory `.`) instead
of `Next.js` + `apps/web` as this doc requires. It was **not** connected to
`longlivets.com` and never affected production. Resolved same day by running
`vercel git disconnect` against that project (see Path A above for the CLI
link step; disconnect from a scratch directory, not this repo, so no stray
`.vercel/project.json` gets left in the working tree).
**The lesson for next time:** if a new `Vercel – <name>` check appears on a
PR that nobody expected, check here first — the only Vercel check that
should ever gate a merge is the one deploying to the URL in "The one URL
that matters" above. Anything else is very likely someone's new personal
project that just got auto-wired to the repo, not a real blocker; confirm
with the project owner what it's for before treating its failure as
either "ignore it" or "fix the deploy" — do not guess.

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
| `ANTHROPIC_API_KEY` *(optional)* | **Mood Chat only** — the key the `/api/mood` classify call spends against (model `claude-sonnet-5`). Server-side only; never `NEXT_PUBLIC_`. Absent, the route degrades to a free deterministic keyword matcher and still returns real songs (never 500). |

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

💸 **`ANTHROPIC_API_KEY` is a metered secret.** The `/api/mood` route is the
ONE module that spends money (mirrors the worker's classify discipline): a
single Sonnet classify call turns a reader's words into a mood vector, then
matching is pure TypeScript. Spend is bounded by a per-instance daily call cap
**and** a per-IP rate limit; over either, the route falls back to the free
keyword matcher and still returns real songs. Set a Console spend cap on the
key as the real ceiling. The reader's raw text is never logged — only the
derived mood vector + the returned song slugs (safety doc, Block 5). Crisis
detection runs deterministically *before* any spend, so it works even with no
key set.

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

---

# Deploying the mobile app (EAS)

## Store builds vs. EAS Update

Two release paths, pick based on what changed:

| Change touches | Release path | Turnaround |
| --- | --- | --- |
| Only JS/TS (screens, logic, `packages/**` consumed by mobile) | **EAS Update** (OTA) | Minutes — no App/Play Store review |
| Native code (new native module, Expo config plugin, `app.json`'s `ios`/`android` blocks, SDK bump) | **EAS Build** + store submit | Days — App Store/Play review |

This is decided automatically at publish time, not by a human judgment
call: `apps/mobile/app.json` sets `runtimeVersion: { policy: "fingerprint" }`,
so every build's install computes a fingerprint from its actual native
dependency tree, and a running app only ever accepts an OTA update whose
fingerprint matches the build it shipped with (OS-040, One Source spec §4
D4). A JS-only change publishes under the same fingerprint and reaches
every existing install immediately; a native change publishes under a new
fingerprint that no existing install matches, so it's a silent no-op there
until the next store build carries it — you cannot "OTA a native change"
by mistake.

## Publishing an EAS Update by hand

```bash
cd apps/mobile
eas update --channel production --message "what changed"
```

`preview` is the internal-testing channel (matches the `preview` build
profile in `eas.json`); `production` is what TestFlight/App Store/Play
production builds are wired to via `eas.json`'s `build.<profile>.channel`.

## Automatic EAS Update on merge

`.github/workflows/eas-update.yml` runs on every push to `main` that
touches `apps/mobile/**` or `packages/**`: it publishes to the `production`
channel unconditionally (the fingerprint policy above is what makes that
safe — see the workflow's own comment). It needs an `EXPO_TOKEN` repo
secret (an Expo access token scoped to this project; generate one at
expo.dev → account settings → Access Tokens) — **filed as a
`HUMAN-ACTIONS.md` item**, since only a founder can create/paste that
secret via `gh secret set`.

## First-time setup checklist

1. `eas.json` already defines `build` profiles (`development`, `preview`,
   `production`) and now a `channel` per profile — a build only ever
   receives updates published to its own channel.
2. `apps/mobile/app.json` sets `updates.url` to this project's EAS Update
   URL and `runtimeVersion.policy: "fingerprint"` — both required for any
   of the above to work; don't hand-set a static `runtimeVersion` string,
   it defeats the safety property this whole scheme relies on.
3. A store build must be created (`eas build --profile production`) with
   these fields present before its installs can receive OTA updates at
   all — OS-040 wires the *mechanism*, not a placeholder store build (that
   waits on OS-004's TestFlight device + push credentials human action).

