# WP2.1 executor briefs (A–D): draft for the PM

Sources: PLAN.md §WP2.1 (lines 306-325), §WP2.2, §WP2.4–2.13, Calls C1–C6, X1–X4;
OPERATING-MODE.md §7, §9; PROGRESS.md 16:55 prep research.

## PM ruling C (2026-10-03 02:26, from the font spike) - supersedes C font-loading steps
Spike result: in the Expo DOM export, CSS url() fonts and JS-imported .woff2 both 404 (not emitted / path mismatch); data-URI @font-face works (part-1 precedent shared-ui-test.css:3-8); file:// fonts load fine in Chromium/WebKit when present. RULING: ONE generator script (packages/ui/scripts/build-fonts.mjs) produces the font CSS from the SAME latin-subset WOFF2 files: web = url() to self-hosted woff2 (apps/web/public or packages/ui assets) + preload Inter/Playfair; DOM host = data-URI @font-face (~270 KB woff2 / ~360 KB base64). Same bytes both sides = pixel parity. Do NOT use url()/asset imports in the DOM host. OTA size baseline bump is EXPECTED here - state the measured delta and this reason in the PR body (G1 condition 3). Add a test that the DOM CSS and web CSS reference the same font file hashes. Close the /eras/*.png parity allowlist in C or D (G1 condition 2). Peer react ^19 (02:24 ruling).

## FABLE REQUIRED (2026-10-02 19:00) — apply to the briefs before launch
1. B: `apiFetch: ApiFetch` imported from `@swift2/content` (WP0.3b `(req: ApiRequest) => Promise<ApiResponse>`) — NOT `(path, init?: RequestInit) => Promise<Response>`.
2. B: shared primitive types (`Insets`, `SharePayload`, `HapticKind`, `NotificationPrefs`/`NotificationStatus`) in `packages/ui/src/host/types.ts`; WP2.3-A imports them (one definition).
3. B (WP2.2 carry gate, ACCEPTANCE): web adapter built inside the provider component (`useMemo`; any router hook called there); `Link`/`Image` are module-level components with stable identity; no module-global singleton.
4. B: `env.turnstileSiteKey: string | null` (Turnstile won't verify on a null origin; HOST-ADAPTER.md lists it).
OPTIONAL adopted: C adds `<link rel=preload>` for Inter + Playfair; HOST-ADAPTER.md documents that next/image `fill` inline styles must be replicated by the app Image for pixel parity.
Timing: all of WP2.1 may proceed before G0 (C step 1 is itself G0 evidence) — but only after G1 lands.

## PM rulings (2026-10-02 18:57) — supersede the open questions below
1. `react` peer `^18 || ^19`; common APIs only (no use(), ref-as-prop, <form action>); typecheck against web's React 18 types. 2. Drop useRouter → navigate + onBack. 3. X3 list = packages/ui/HOST-ADAPTER.md inside B. 4. D: executor builds the domain table itself and reports it in the PR body; no PM pre-approval. 5. `<PARITY_WORKFLOW>` = `.github/workflows/parity.yml` (`gh workflow run parity.yml --ref <branch>`); `<FINGERPRINT_CMD>` = `npx @expo/fingerprint fingerprint:generate` in apps/mobile (compare with origin/main, same environment). Every Land line: never --delete-branch a branch with open child PRs.

## Open questions for the PM (decide before dispatch)

1. **React 18 (web) vs React 19 (DOM host / Expo).** `packages/ui` declares
   `react` as a peerDependency. What range: `^18 || ^19`? And may package code
   use only APIs common to both (no `use()`, no ref-as-prop, no
   `<form action>`)? Briefs A and B assume **both, common API only**, plus a
   lint/type check against the web's React 18 types.
2. **PLAN lists `useRouter`; the research says the reader has no `useRouter`.**
   Brief B replaces it with `navigate(path)` + `onBack` and drops `useRouter`.
   Is that OK, given it changes PLAN wording?
3. **Where does X3 (web-only side-effect list) live?** The prep research split
   it into a separate "E". These briefs put it in **B** as a doc table
   (`packages/ui/HOST-ADAPTER.md`), since the adapter has to list each one.
   Confirm, or spin out E.
4. **D's per-domain file lists aren't in the research.** It gave counts only
   (16 `next/image` + 3 `next/link` files). D's first step greps and buckets
   them under the WP2.4–2.13 slice domains below. Should the PM approve that
   bucketing before D1 starts, or let the executor proceed?
5. **Land rule vs §9 template.** §9 says "set auto-merge". These briefs follow
   your override: **no auto-merge**, and the PM merges. Also needed: the exact
   parity workflow file name/inputs (WP1.1/1.1c, e.g. the one behind dispatch
   run 37081334650) and the fingerprint command WP1.1c used. Both are written
   below as `<PARITY_WORKFLOW>` and `<FINGERPRINT_CMD>`. Fill them in before
   dispatch.

Stack: **A** → base `main`. **B** stacks on A. **C** stacks on A (it doesn't
need B). **D1..Dn** stack on B, one per domain, each based on the previous D or
on B. Merge order: A, then B and C, then D in order. Before merging any parent,
retarget its children to the parent's base. **Never `--delete-branch` a branch
that has child PRs open.**

---

## Shared block: Repo rules (OPERATING-MODE.md §7, pasted into every brief)

```
Repo rules:
- Branch and worktree: work on a branch in your own worktree outside
  Documents\Claude\Projects\, and verify the branch before every commit.
  Never commit to main or force-push. Never use git restore / reset --hard /
  clean / checkout -- or --no-verify.
- Shell: one simple command per Bash call. Prefer node -e over python.
  Filter command output at the source (| tail -30).
- Never touch scripts/social/** or social/queue/**. Never merge a
  social-draft PR. Never send social work to Codex.
- Gates:
  - Typecheck: npm run typecheck.
  - Lint: npm run lint. Run the exact CI command, not per-file eslint.
  - Tests: narrow npx vitest run <path> while iterating; full npm run test
    once at the end.
  - Mobile bundle check (when apps/mobile changes):
    npx expo export --platform ios and npx expo export --platform android.
- Editing: surgical edits only, no reformatting of untouched code, and keep
  files under 300 lines. Update MAP.md when files are added, moved or deleted.
- Definition of done: acceptance criteria met; all tests pass; review clean;
  works on mobile and desktop web; docs updated in the same PR; no secrets.
- Device verification: a UI change isn't verified until it's seen in a
  browser at phone and desktop widths, and on device for app changes. A green
  suite is not evidence.
- Native changes are expensive: any change to apps/mobile native dependencies
  or config changes the fingerprint, which triggers new store builds on both
  platforms. Only make one if the WP says so.
```

## Shared block: Land (every brief; `<BASE>` set per brief)

```
Land: open a PR against <BASE> (body: 1–2 sentence TL;DR, then ---, then
detail; refs #4788). Do NOT set auto-merge and do NOT merge; the PM merges
after review. Never --delete-branch a branch that has child PRs: retarget the
children to its base first. Do not wait on CI; report and exit.
```

---

## Brief A: skeleton and workspace wiring

```
WP 2.1-A: packages/ui skeleton + workspace wiring. Programme: One UI
(docs/plans/one-ui/PLAN.md §WP2.1).
Goal: an empty, source-shipped @swift2/ui package that apps/web and the
apps/mobile DOM host both compile and style, with Tailwind seeing its classes
and lint forbidding next/* and react-native* inside it.
Touch set: packages/ui/** (new); root package.json workspaces (only if
packages/* isn't already globbed); apps/web/package.json (add dep);
apps/web/next.config.mjs (transpilePackages); apps/web/app/globals.css (one
@source line); the DOM host CSS entry under apps/mobile/dom/** (one @source
line, plus the dep in apps/mobile/package.json if the DOM host resolves
through it); the ESLint config; MAP.md; package-lock.json. Touching anything
else = stop and report.
Do:
  1. Create packages/ui: package.json (name @swift2/ui, private, "main"/
     "exports" pointing at src/index.ts, TS source shipped with no build step,
     react as a peerDependency per the PM's answer on React 18/19),
     tsconfig.json extending the repo base, src/index.ts exporting one trivial
     placeholder (e.g. a `UI_PACKAGE_VERSION` const) so imports resolve.
  2. Add "@swift2/ui": "*" to apps/web (and to apps/mobile if the DOM host
     resolves through it). Run npm install --silent once.
  3. apps/web/next.config.mjs: add "@swift2/ui" to transpilePackages (append,
     don't reorder).
  4. Metro already watches the workspace. Confirm it: don't edit
     metro.config.js. If an expo export can't resolve @swift2/ui, stop and
     report (a Metro change counts as a native-adjacent change).
  5. Tailwind v4: add `@source "<relative path>/packages/ui/src";` to BOTH
     apps/web/app/globals.css AND the DOM host CSS. Without this, utilities
     used only in the package are silently dropped. Prove it: put a
     package-only utility class on the placeholder, check it appears in the
     web build CSS and the DOM export CSS, then remove the proof class.
  6. ESLint: an override for packages/ui/** with no-restricted-imports
     banning patterns "next", "next/*", "react-native", "react-native-*",
     "react-native/*", each with a message pointing to useHost(). Add a lint
     self-test (a fixture file, or a RuleTester vitest test) proving a next/*
     import in packages/ui errors.
  7. MAP.md: add packages/ui (purpose, "no next/*, no react-native*", the
     host adapter arriving in WP2.1-B).
Acceptance: typecheck, lint and tests pass; @swift2/ui imports from apps/web
and the DOM host; the lint ban is proven by a test; the native fingerprint is
unchanged; no visual change on the web (parity zero diff); MAP.md updated.
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npx vitest run <the lint self-test path>
  npm run test        (once, at the end)
  npm run build --workspace=@swift2/web    (Tailwind proof, step 5)
  npx expo export --platform ios     (from apps/mobile)
  npx expo export --platform android (from apps/mobile)
  <FINGERPRINT_CMD>: compare to the main base hash, which must match
  gh workflow run <PARITY_WORKFLOW> --ref <branch>: must be zero diff
<Repo rules block>
<Land block, BASE = main>
Return ≤ 300 words: what changed, verification results, PR URL, open risks.
```

---

## Brief B: HostAdapter, useHost(), web adapter, X3 list

```
WP 2.1-B: HostAdapter interface + useHost() + web adapter. Programme: One UI
(docs/plans/one-ui/PLAN.md §WP2.1; X1, X3).
Goal: packages/ui code reaches every host capability through a typed
HostAdapter provided by React context. The web implementation behaves
identically to today.
Touch set: packages/ui/src/host/** (new); packages/ui/src/index.ts (exports);
packages/ui/HOST-ADAPTER.md (new, the X3 list); apps/web/lib/host-adapter*
(new: web adapter + provider mount); the ONE apps/web layout/provider file
that mounts <HostProvider> (name it in the PR); tests next to each; MAP.md.
Do NOT migrate call sites (that's WP2.1-D). Touching anything else = stop and
report.
Do:
  1. packages/ui/src/host/types.ts: the HostAdapter interface. NOW (what
     WP2.4+ and D need first):
       - Link: component (href, children, className, prefetch?, external?)
       - Image: component (src, alt, width/height | fill, sizes?, priority?,
         className). `fill` needs wrapper CSS (position:relative parent):
         document this in the type's JSDoc.
       - navigate(path: string, opts?: { replace?: boolean })
       - onBack(handler: () => boolean): unsubscribe. Replaces
         useBackDismiss's popstate wiring later; the web impl wraps popstate.
       - apiFetch(path: string, init?: RequestInit): Promise<Response> (X1;
         web = same-origin fetch; the contract is the one WP0.3b defined).
       - storage: { local, session }, each get/set/remove (string values).
       - env: { turnstileSiteKey: string; origin: string }
       - insets: { top, right, bottom, left } (web: zeros, or read
         --safe-* / env()). Package CSS uses `var(--safe-*, env(...))`.
     LATER (declare as optional members marked `/** @later WP2.x */`, web impl
     may be a no-op or simple impl; don't build native behavior):
       - lazy (WP2.4/2.5), share (2.5), haptic (web no-op), openExternal
         (2.5), notifications.{status,request,register,updatePrefs} (2.12).
     Follow the PM's answer on `useRouter` (proposal: omit; navigate + onBack
     cover it).
  2. packages/ui/src/host/context.tsx: HostContext, <HostProvider
     adapter>, useHost(). useHost() outside a provider throws a clear error.
  3. apps/web/lib/host-adapter.ts(x): the web adapter. Link → next/link,
     Image → next/image (next/* imports are legal HERE, not in the package),
     navigate → next/navigation router (or location for non-app-router
     callers; state which), onBack → popstate, apiFetch → fetch, storage →
     window.localStorage/sessionStorage with try/catch (SSR-safe), env from
     the existing public env vars (reuse the names already in use, never new
     secrets), haptic no-op.
  4. Mount <HostProvider adapter={webAdapter}> once, high enough in the web
     tree to cover the reader. No call site changes behavior.
  5. packages/ui/HOST-ADAPTER.md: the X3 table. Each web-only side effect
     (@vercel/analytics, the web push/notification UI, next/image
     optimisation, service worker, localStorage/sessionStorage assumptions,
     popstate/back, Turnstile) → the adapter member or "off in app" → owning
     WP.
  6. Tests (vitest + RTL): useHost throws without a provider; the provider
     passes the adapter through; web adapter apiFetch is same-origin; storage
     survives a throwing localStorage; onBack unsubscribe works; Link/Image
     render next/link and next/image output (mock next/* as the existing tests
     do).
  7. MAP.md: packages/ui/src/host, apps/web/lib/host-adapter*.
Acceptance: typecheck, lint and tests pass; the lint ban still holds (no
next/* in packages/ui); web parity zero diff; the X3 list is complete; MAP.md
updated.
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npx vitest run packages/ui/src/host apps/web/lib/host-adapter
  npm run test        (once, at the end)
  gh workflow run <PARITY_WORKFLOW> --ref <branch>: must be zero diff
  <FINGERPRINT_CMD>: unchanged vs base
  Browser check: the reader at phone (390px) and desktop (1280px), plus one
  feedback submit (apiFetch path) in the dev server.
<Repo rules block>
<Land block, BASE = the WP2.1-A branch (stacked)>
Return ≤ 300 words: what changed, verification results, PR URL, open risks.
```

---

## Brief C: self-hosted fonts + parity re-baseline

```
WP 2.1-C: self-host reader fonts in packages/ui. Programme: One UI
(docs/plans/one-ui/PLAN.md §WP2.1 "Fonts").
Goal: web and the app's DOM host load the same font files from packages/ui
through @font-face, under the SAME --font-* CSS variable names, so
theme.ts/globals.css consumers don't change.
Touch set: packages/ui/fonts/*.woff2 (new); packages/ui/fonts/fonts.css (new);
apps/web/app/layout.tsx (remove the next/font/google usage at lines ~10-41,
import fonts.css); apps/web/next.config.mjs (CSP font-src only if needed);
the DOM host CSS entry (import fonts.css); parity baseline files the sanctioned
dispatch regenerates; MAP.md. Do NOT touch lib/longlive/share-fonts/** (the
OG card), theme.ts, or the --font-* consumers. Touching anything else = stop
and report.
Do:
  1. FIRST, before any other change: prove the DOM host resolves @font-face
     URLs. Add a throwaway fonts.css with one family pointing at a woff2 in
     packages/ui/fonts, import it from the DOM host CSS, run
     npx expo export --platform ios, and confirm the exported bundle contains
     the font asset and the CSS url() points to it (inspect dist output). If
     it doesn't resolve, STOP: revert nothing, commit nothing, report what you
     saw and the export output. This is the open risk from prep research.
  2. Fetch the 5 families' woff2 files (OFL): Inter (variable), Playfair
     Display (variable), Special Elite 400, Dancing Script (variable), Bodoni
     Moda 400/600/800 ± italic (merch only). Latin subset, matching the
     weights/styles/subsets layout.tsx requests today. Add each license file
     (OFL.txt) next to the fonts.
  3. fonts.css: @font-face per file (font-display: swap, same as next/font's
     default), then :root { --font-<x>: '<Family>', <the fallback stack
     next/font produced> } using EXACTLY the existing variable names from
     layout.tsx.
  4. apps/web/app/layout.tsx: remove the next/font/google imports and the
     variable classNames on <html>/<body>; import @swift2/ui/fonts/fonts.css.
     Surgical diff only.
  5. CSP: if font-src doesn't already allow 'self', update it in
     next.config.mjs (font-src only).
  6. Visually check phone + desktop widths in a browser: every family
     renders (reader, merch Bodoni, Special Elite, Dancing Script); no FOIT;
     no 404 in the network panel.
  7. Re-baseline parity through the sanctioned dispatch (don't regenerate
     baselines locally by hand): gh workflow run <PARITY_WORKFLOW> --ref
     <branch> with the update-baseline input, commit its output. The diff
     before re-baseline must be glyph-metric only; attach 2–3 example diffs
     in the PR body.
  8. MAP.md: packages/ui/fonts.
Acceptance: typecheck, lint and tests pass; no next/font/google left for the
5 reader families; --font-* names unchanged; share-fonts untouched; parity
diff zero apart from the documented font re-baseline; the DOM host export
includes the fonts; native fingerprint unchanged; MAP.md updated.
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npm run test        (once, at the end)
  npm run build --workspace=@swift2/web
  npx expo export --platform ios     (from apps/mobile)
  npx expo export --platform android (from apps/mobile)
  <FINGERPRINT_CMD>: unchanged vs base
  gh workflow run <PARITY_WORKFLOW> --ref <branch>: before (font-only diff)
  and after the re-baseline (zero diff)
<Repo rules block>
<Land block, BASE = the WP2.1-A branch (stacked; not B)>
Return ≤ 300 words: step 1 result first, then what changed, verification
results, PR URL, open risks.
```

---

## Brief D: next/* call-site refactor (one PR per domain, ≤ 400 lines each)

Domains are the WP2.4–2.13 slices, so each D PR pre-clears its slice's move.
Expected buckets for the 16 `next/image` + 3 `next/link` files (D0 confirms):

| PR | Domain (slice) |
|---|---|
| D1 | Shell chrome + era stream (2.4) |
| D2 | Moment detail + embeds (2.5) |
| D3 | Threads + track guide/song (2.6, 2.7) |
| D4 | Search + merch (2.8, 2.9) |
| D5 | Community, Clownbot, notifications, legal (2.10–2.13) |

Merge adjacent buckets that are small; split any that exceed ~400 lines.

```
WP 2.1-D<n>: route <domain> next/image + next/link call sites through
useHost(). Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.1; prepares
§WP2.4–2.13).
Goal: components in <domain> import no next/* for images and links. They use
useHost().Image / useHost().Link, with zero visual change.
Touch set: ONLY the files listed for this domain:
  <file list from D0>
plus their tests. Do not move files into packages/ui (that's WP2.4+). Do not
touch next/navigation, next/font, server components' next/* (metadata,
headers), or apps/web/lib/host-adapter* (if the adapter is missing a prop,
stop and report). Touching anything else = stop and report.
D0 (first D brief only, read-only, no commit): run
  rg -l "from ['\"]next/(image|link)['\"]" apps/web/components apps/web/app
  apps/web/lib
then bucket each hit under the domains above and report the table to the PM
before editing. Expected: 16 image + 3 link files.
Do:
  1. Per file, replace `import Image from 'next/image'` / `import Link from
     'next/link'` with `const { Image, Link } = useHost()` (import useHost
     from @swift2/ui). Keep every prop. `fill` images keep their
     position:relative parent.
  2. Server components can't use hooks. If a file is a server component,
     leave it alone and list it in the PR body.
  3. Update or extend the file's tests to render under <HostProvider> (add a
     shared test helper only if one doesn't exist yet. B may have added it).
  4. Diff ≤ ~400 lines. If it's over, stop and split.
Acceptance: typecheck, lint and tests pass; zero next/image or next/link
imports left in this domain's client components; web parity zero diff; web
e2e green.
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npx vitest run <domain test paths>
  npm run test        (once, at the end)
  rg -c "from ['\"]next/(image|link)['\"]" <domain files>: expect 0
  gh workflow run <PARITY_WORKFLOW> --ref <branch>: must be zero diff
  Browser check at phone (390px) and desktop (1280px): the domain's images
  load (including hotlinked ones), and links navigate client-side.
<Repo rules block>
<Land block, BASE = the WP2.1-B branch for D1, else the previous D branch>
Return ≤ 300 words: what changed, verification results, PR URL, open risks
(list any server-component files skipped).
```
