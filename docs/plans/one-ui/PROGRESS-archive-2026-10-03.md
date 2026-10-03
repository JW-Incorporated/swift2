# One UI PROGRESS archive — session log 2026-10-02 16:10 → 2026-10-03 05:41 (moved verbatim)

**CHECKPOINT 2026-10-02 16:10 PDT (new PM session) — read this first; the
14:56 block below still holds for the post-S1 landing order.** Freeze ON;
#4791 has 0 `[diag]` reports. #4817 MERGED. Prior session's Codex job ids are
gone (companion state is per-session) → #4819 Codex r1 RE-RUN = job
`task-murktwfp-vpt722` (worktree scratchpad `cx-4819`). #4822: Codex r1 +
reviewer r1 (incl. fingerprint reconciliation) launched 16:09 (worktree
`cx-4822`). NEXT: #4819 one fix round (reviewer r1 + Codex r1 findings) →
scoped reviewer; #4822 fix round if needed → Fable design-fidelity; WP1.1c
part-2 brief (stack on wp0.5b) → Fable brief review (structural a-vs-b gate
deviation). Housekeeping: fold log lines 45–431 below into ≤10 summary lines
(file is >500 lines vs the ~200 cap).
**16:15:** #4822 r1: reviewer + Codex (`task-murku2go-hxy9gw`) both REQUEST
CHANGES → fix round 1 executor (wt `wt-wp05b`): baked-content proof covers all
`*.generated.ts` + ≥3 sentinels + videos.ts; insets 4 sides actually applied in
CSS; probe `adapter`; Android back not swallowed pre-ready; placeholder counts
via events; docs. **PM override (recorded):** Codex P1 "iOS <script src>
fallback absent" → spike keeps it PROBE-ONLY; real fallback only if S4 shows
iOS fetch+XHR fail (Fable 14:31 "fallback not built now"). Bundle-check CI
wiring → WP1.1c part 2. Fingerprint: reviewer — no native inputs in diff,
inert; 3603a03f vs dcf1ea59 = measurement env. #4819 r1: Codex
(`task-murktwfp-vpt722`) P1 main-ref baseline regen allowed, P2 trigger paths
→ fix round 1 executor (wt `wt-wp11c`) with reviewer r1 items. Fable reviewed
part-2 brief → B (Fable log).
**16:24:** #4819 fix r1 dc79e754 (main-ref regen refused pre-checkout;
filter widened; fingerprint dcf1ea59 line in body+docs); PM spot-check: run
37077115019 pull_request = success on dc79e754. Scoped reviewer r2 = APPROVE
→ **#4819 APPROVED**, held: lands after #4811 (add as step 6b below: retarget
to main after #4811, then auto-merge). WP1.1 stays PARTIAL until part 2.
**16:52:** Owner raised agent cap 3→5 (root CLAUDE.md commit 68e028d, local-only
repo; Swift2 hook + OPERATING-MODE §5 via grunt PR). #4822 r2: scoped
reviewer = all 6 resolved, one nit (wp0.5.md:3 fingerprint 3603a03f → dcf1ea59)
→ PM: approve-with-nit; Codex r2 `task-murlnx3a-vf2h2l` pending. WP1.1c part 2
executor launched (wt `wt-wp11c2`, branch feature/one-ui-wp1.1c-2, base wp0.5b
merged with wp1.1c). Read-only pre-research launched: WP2.1, WP2.3.
**16:54:** WP2.3 prep back. Protocol: envelope {v,id,kind cmd|res|evt,type,
payload,ts}; typed union in packages/ui/src/bridge; native declares {min,max},
DOM sends v in ready → out of range = pre-ready error → watchdog strike; unknown
type → error 'unsupported' (add-only); every cmd one res, 8s default timeout,
api cancellable; pre-ready commands queue (notification-tap nav held till
ready). Replace backTick-style counters with a seq event queue. **/api sites = 9
fetches / 7–8 endpoints** (ClownChat:168, CurrentItemDetail:65,
FeedbackButton:159, MoodChat:63, SubmitLinkForm:122, WebNotificationSettings
:96,:113, web-push-client:110,:150) — PLAN says 7, reconcile in WP2.3 brief.
Split A types · B host dispatcher+watchdog · C DOM client+contract test · D
navigate/openExternal/share/haptic/insets/back · E notifications+tap queue ·
F api proxy (needs WP0.3b merged). No auth/session in the bridge.
**16:55:** WP2.1 prep back. Fonts: 5 next/font families in apps/web
layout.tsx:10-41 (Inter var, Playfair var, Special Elite 400, Dancing Script
var, Bodoni Moda 400/600/800 ±italic — merch only) → packages/ui
fonts/*.woff2 + fonts.css defining the SAME --font-* vars (theme.ts/globals.css
unchanged); leave lib/longlive/share-fonts/ (OG card) alone; open: DOM host
@font-face URL resolution. HostAdapter via context `useHost()`: Link, Image
(16 next/image files, `fill` needs wrapper CSS), lazy, navigate, onBack
(replaces useBackDismiss popstate), apiFetch, storage(local|session), share,
haptic (web no-op), openExternal, notifications, insets, env{turnstileSiteKey,
origin}. Reader has no useRouter. Traps: Tailwind v4 needs `@source
packages/ui/src` in BOTH globals.css and DOM CSS (else utilities silently
dropped); safe-area → `var(--safe-*, env(...))` in the package (kills the
spike's !important overrides); ESLint ban next/* + react-native* in
packages/ui. Split A skeleton+wiring ~150 · B adapter+web adapter ~300 · C
fonts+re-baseline · D next/* call-site refactor (split by domain) · E X3 list.
**17:20:** WP1.1c part 2 → **#4827** (base wp0.5b; head c7355a8f; includes
part 1 merged). PM spot-check: dispatch run 37081334650 success on c7355a8f,
3m41s. Suite 8182; fingerprint dcf1ea59. Declared deviations under review:
baselines from REAL synced content (PM concern: daily content PRs → red), 
bypassCSP, external images → grey PNG, (b) serves /eras/*.png from web public.
Codex r1 `task-murncc9n-9q975l` + reviewer r1 launched (part-2 commits only).
**WP1.2** executor launched (wt `wt-wp12`, branch feature/one-ui-wp1.2 stacked
on wp1.1c-2; axe baseline + negative spec; root devDep @axe-core/playwright).
**17:22:** #4827 reviewer r1 = REQUEST CHANGES: High baselines from live
content (→ commit frozen fixture), Med phone a-item==b-item PNGs (insets not
exercised in b-item), Med fingerprint not compared vs wp0.5b base; accepted
deviations bypassCSP / grey PNG / /eras from web public / index.web.tsx delete.
Bundle with Codex r1 into one fix round.
**17:28: S1 CLOSED — owner (Joey, chat): "just use the feedback from my phone
for now and move on at risk."** 2 Android [diag] reports on #4791; iPad
pending a TestFlight invite (Joey). **Merge freeze OFF.** Landed: #4796
(WP0.3b), #4813 (WP0.2 A), #4799 (WP0.4 native → store builds, c541c2bc).
GitHub did NOT auto-retarget stacked PRs when bases were deleted → two restack
executors: loader chain #4815→#4816; DOM chain #4811→#4818+#4819→#4822 (#4827
only retargeted to main, not merged). TODO next free slot: size-baseline bump
PR (+11.6%, after #4799); researcher on S1 reports → WP0.2 D decision;
release-train check for the #4799 store builds.
**17:37:** #4827 Codex r1 (`task-murncc9n-9q975l`) REQUEST CHANGES (P1 live
fixture; P1 grey-PNG images; P1 b asset fallback to web public; P1 triggers
miss packages/sync; P2 a-hash not runtime; P2 bypassCSP global; P3 diag). PM:
fix all except KEEP grey-PNG stub (X2 is device-owned) + assert a/b image-URL
sets identical. Fix round 1 executor launched (10 items). Round 2 = last
review round (rule 3). WP1.2 → **#4828** (base wp1.1c-2; dispatch 37082405671
green, PM verified; empty baselines = no serious/critical anywhere). Reviewer
r1: no blockers (Low: assert axe `passes`>0; lockfile rn-web sync note);
Codex r1 `task-murnv3l2-3dvkaa` running.
**17:45:** #4829 (replaces auto-closed #4815) MERGED; #4816 merge-resolution
reviewed (all invariants kept) → auto-merge set. S1 analysis (n=2, Pixel 10
Pro, warm only): warm load-total 1.56/2.39 s vs ≤1 s target; pointer ≈63% of
load-total; **diag marks broken: every at:=600000, point marks 0.0 →
launch→first-era unmeasurable; no per-file hash/parse/write marks.** → WP0.1b
(debug protocol strike 1: wrong clock origin + server 600000 clamp) researcher
launched. S2 must wait for WP0.1b. No WP0.2 D evidence yet. Release train run
37082264743 (#4799 store builds) in EAS wait at 15 min — normal; superseded runs
cancelled by concurrency (fine if the last main run completes — check).
Size-baseline bump grunt launched.
**17:52:** Strike 1 CONFIRMED (no T0; raw Hermes clock; clamp is CLIENT-side
diagnostics.ts:117; point marks shown by duration). WP0.1b → **#4833** (T0 at
collector creation, imported early in index.ts; point marks by at:; loader
already emits hash/parse/validate/disk-write; fingerprint 473eab6c unchanged =
main's post-#4799 value). Reviewer r1 APPROVE; Codex r1 `task-murof6pl-nys0wf`
pending. Size baseline → #4831 (+11.7% both platforms; auto-merge set). #4828
Codex r1 = REQUEST CHANGES (P2 baseline key lacks impact; P3 doc) → small fix
round launched (+ reviewer Low: assert axe passes>0).
**17:54:** DOM restack: **#4811, #4818, #4819 MERGED** (#4811 had been
auto-closed; worker recreated feature/one-ui-wp0.4 at 39a129b0, reopened,
retargeted, deleted again). Fingerprints = main 473eab6c. 0.5a/1.1c branches
deleted. #4822 retargeted to main, NOT landed: **entry collision** — #4822's
apps/mobile/index.web.ts (ReaderSpike) vs main's index.web.tsx (part-1 parity
entry, #4819); Metro prefers .ts → would swap main's harness to a page its
baselines don't match. **PM call:** land as a pair after #4827 approval —
(1) merge #4827 into feature/one-ui-wp0.5b (its resolution deletes
index.web.tsx + re-baselines on spike routes), (2) merge origin/main into
wp0.5b keeping index.web.ts / deleting index.web.tsx, (3) #4822 → main
(squash; then retarget #4828 to main before deleting wp0.5b/wp1.1c-2).
**18:55: RELEASE TRAIN RED since #4799** (runs 37082264743, 37083549530,
37083852380): EAS `Build iOS (store)` RUN_FASTLANE — profile "LongLive App
Store 2026-09-05" lacks Associated Domains (entitlement added by #4799).
Play submit skipped (gated on whole EAS run); publish_update_* gated on a store
build for the new fingerprint → **no OTA since c541c2bc, and post-#4799 JS
targets the new runtime anyway → devices need the new store builds.** Filed
**HA #96** (Joey: enable Associated Domains on ai.jwlabs.longlive, regenerate
profile via `eas credentials`). PM: decouple Android submit from iOS failure
(workflow change, reversible) so S2 can run on Android. Docs PR #4834
(stacked-PR rule) + issues #4835 (prune fixture) #4836 (MAX_PATH) filed.
WP2.1 brief drafted (scratch brief-wp21.md; 5 open Qs).
**18:59:** HA #96 landing via #4837 (PM-branch PR, auto-merge, no delete).
Release fix → **#4838** (wait continue-on-error; Android locate+Play-internal
submit if build_android SUCCESS; final step fails run if EAS not success).
Risk: 'SUCCESS' string unverified (fail-safe skip) → reviewer verifying from
run logs + Codex r1. WP2.1 + WP2.3 briefs: PM rulings written into scratch
brief-wp21.md / brief-wp23.md (react ^18||^19 common APIs; drop useRouter;
X3 in B; bridge version = JS const; /api/clown excluded from F; device
endpoints via E; F extends CORS to /vault/live + share-card; ApiFetch gets
optional AbortSignal; WP2.3 D after #4822). Fable reviewing both brief sets.
**19:01:** #4827 Codex r2 APPROVE (+ reviewer r2 APPROVE) → **#4827
APPROVED**. Landing executor launched: merge #4827 into wp0.5b (no delete) →
#4828 base → wp0.5b → merge main into wp0.5b (keep index.web.ts, delete
index.web.tsx; fingerprint must equal main; parity dispatch green) → #4822 →
main → #4828 → main → delete wp0.5b/wp1.1c-2 once childless. #4838 reviewer:
EAS status string UNVERIFIABLE from logs (step summary not in API); fail-safe;
fix round after Codex r1 (`task-murquos8-drekre`): verify via eas-cli npm
package's GraphQL types + log parsed status. Fable G2 brief review adopted
(Fable log); briefs copied to docs/plans/one-ui/briefs/. **G1 gate (Fable,
mandatory) after #4827+#4828 land.**
**19:26:** **#4822, #4827, #4828 MERGED** (WP0.5b + WP1.1c p2 + WP1.2 on main;
branches deleted childless). Fingerprint main 473eab6c unchanged. **PM-noted
deviation:** executor bumped the OTA size baseline +61% on wp0.5b (ReaderSpike
pulls the web reader into the DOM bundle) — accepted for the spike, but it's
a **G0 input** (every OTA now carries the spike bundle). Post-landing: main
"Mobile parity check" RED at 4084510a → researcher diagnosing (also #4837
build/build-full red). #4833 CONFLICTING after #4822 (DiagnosticsPanel) →
executor merging main. G1 gate waits on parity green on main.
**19:33:** Red "Mobile parity check" on main = store-version divergence
workflow (iOS build can't sign) → same root cause as HA #96, not the harness.
#4837 red = my HA number collided with reserved #89 (weekly-review test) →
renumbered **HA #96** (allocator must read ledger `- #N ·` lines too; true
max was 95). #4833 merged main (9e31827a; both panels' intents kept) →
auto-merge still set. #4838 Codex r1: P2 regex `\$` bug (Android always
skipped), P2 build not tied to the run's build_android job, P3 resubmit
idempotency (pre-existing → doc note) → fix round launched. Parity harness
never ran on main (PR/dispatch only) → dispatched run 37090052458 on main →
if green: **Fable G1 go/no-go**.
**02:10 (10-03) — owner: "keep going… run all night… parallel agents".**
Parity on main 37090052458 = SUCCESS. #4833 (WP0.1b) + #4837 (HA #96 on main)
MERGED. Release train still red (iOS signing; HA #96 open). #4838 Codex r2 =
REQUEST CHANGES (P1 commit-hash binding fails open; P2 id not validated) →
2nd consecutive → Fable (mandatory) + fix round 2 in parallel. Launched:
Fable = G1 go/no-go + #4838 ruling; #4838 fix r2; WP2.2 brief draft (→
docs/plans/one-ui/briefs/brief-wp22.md); #4835/#4836 fixture prune executor.
NIGHT PLAN: on G1 GO → WP2.1-A executor (briefs/brief-wp21.md), then 2.1-B
(stacked), 2.1-C (fonts; step 1 = DOM @font-face resolution = G0 evidence),
2.3-A after 2.1-B; WP2.2 after its brief + Fable review. Keep ≤5 workers.
**02:16:** #4838 fix r2 5334b44a (scripts/release/select-android-build.mjs +
20 vitest; UUID evidence eas-cli ArchiveSource.js:411) → scoped reviewer
APPROVE; grunt added "red if Android selection ≠ success" (c64db4df) + set
auto-merge → **PM caught false-red: every OTA-only release (build_android
skipped/absent) would go red** → auto-merge DISABLED; fix: distinct `skipped`
result, red only on unknown/not_success/no_build. Parity-gate always-run job
(G1 condition 1) executor launched.
**02:19:** #4838 c30a9d0a (`skipped` for absent/SKIPPED; eas-cli enum
ACTION_REQUIRED/CANCELED/FAILURE/IN_PROGRESS/NEW/PENDING_CANCEL/SKIPPED/SUCCESS)
+ prettier c27161c2 → scoped reviewer APPROVE → **auto-merge set**. **#4840
MERGED** (parity always runs on PRs; `parity-gate` job = the check to mark
required before the first WP2.4 slice — branch-protection step pending; PM
skipped Codex: CI plumbing, reviewer covered pinning/perms/gate). WP2.2 brief
→ docs/plans/one-ui/briefs/brief-wp22.md (A purity · B context+provider in
packages/ui after 2.1-A · C1–C3 callers · D ESLint ban); PM rulings written;
Fable reviewing. Spike launched: DOM-host @font-face from bundled assets
(WP2.1-C step 1 = G0 evidence).
**02:24:** WP2.1-A → **#4841** (packages/ui skeleton; transpilePackages +
@source in web globals.css and DOM reader-spike.css; ESLint ban + test;
fingerprint 473eab6c unchanged; parity 37112663539 green; suite 8240).
**PM ruling:** web is React 19.2 too (research said 18) → packages/ui peer
`^19`, drop React-18 typing requirement (amends 2.1 rulings Q1). /eras
allowlist closure → 2.1-C or D. Reviewer + Codex r1 launched. WP2.2-A running
in parallel.
**02:26:** #4841 reviewer r1 REQUEST CHANGES (peer ^19; @source missing in
apps/mobile/dom/shared-ui-test.css; prettier drift unverified) → bundle with
Codex r1. WP2.1-B launched (stacked on wp2.1a). **Font spike (G0 evidence):**
DOM export drops url()/imported woff2 (404); data-URI @font-face works →
PM ruling C: one generator, web url()+preload, DOM data-URI (~360 KB base64,
OTA bump reason recorded), same bytes both sides (ruling in brief-wp21.md).
**S4 additions:** data-URI faces `loaded` on iOS+Android; no FOUT before
onReady; variable-axis weights render in WKWebView + Android WebView; 360 KB
font CSS doesn't slow DOM cold start.
**02:30:** #4842 (fixture prune 8.3→2.9 MB; content/frozen/; closes #4835
#4836) reviewer APPROVE → auto-merge set. **Harness hole found:** #4827's
iphone-15 b-home baseline was captured BEFORE the hero image painted (old
40 KB = no photo; new 81 KB = correct, matches pixel-7) — helpers.ts:~39
waits only for __ready. = G1 condition 4 (flake) → executor fixing now
(wait for img load+decode + CSS backgrounds, broken image fails loudly,
negative delayed-image spec, two green verification runs). WP2.1-C launched
(stacked on wp2.1a; generator + data-URI DOM fonts).
**02:32:** WP2.1-B → **#4844** (base wp2.1a; HostAdapter types + HostProvider
in apps/web layout; suite 8252; parity 37113287859 pending) → reviewer r1
launched (Codex next slot). #4841 Codex r1 (`task-mus6qiwu-zu39g1`): P2 package
never resolved by either host; P2 lint ban only static imports; P3 fingerprint
unproven → fix round 1 launched with reviewer items (peer ^19, @source in
shared-ui-test.css, prettier drift) + real @swift2/ui import in ReaderSpike.
**02:34:** #4844 reviewer r1 REQUEST CHANGES (declare @swift2/content +
@swift2/ui in apps/web/package.json; re-render identity test; onBack doc) +
Codex r1 `task-mus714zb-kgv3x9` pending → one fix round after. WP2.2-A →
**#4843** (corpus.ts function lookups, withProviders deleted, LOAD_SOURCE,
hash ba18fffa unchanged, parity 37113198335 green, flat-order audit passes —
C2 unblocked; local expo export failed "environmental" — reviewer checking CI
coverage) → reviewer r1 launched; Codex next slot.
**02:40:** #4843 reviewer r1 APPROVE (CI build-full runs expo exports ios+android
— covered); Codex r1 REQUEST CHANGES (P1 build.ts → lenses/track-guide →
corpus.ts → provider modules still in the import graph; P2 purity test not
transitive; P2 no assertion for lastGoodAfterDataError→error) → fix round 1.
#4844 Codex r1: P2 HostImageProps too narrow for next/image migration
(unoptimized, onLoad…); P3 env.origin hydration-unstable → fix round 1 with
reviewer items. **#4841 r2 reviewer REQUEST CHANGES — caused by PM ruling:
peer `react: ^19` → npm ci ERESOLVE (root resolves react 18.3.1; the dup root
react noted in WP0.4) → CI red on wp2.1a.** PM: revert to `^18 || ^19` (02:24
ruling withdrawn); 2nd rejection → Fable consult (mandatory) with Codex r2
(`task-mus799r9-r7gpgt`) findings.
**02:41:** WP2.1-C built + pushed (feature/one-ui-wp2.1c @7b0c0dbf, stacked on
wp2.1a): build-fonts.mjs → web url() /fonts/*.hash.woff2 (+preload Inter/
Playfair, immutable cache) + DOM data-URI CSS; same-bytes hash test;
FONTS-LICENSE; next/font removed. 238,776 B woff2 / 321,939 B base64 → **OTA
+322 KB (+4.4%), baseline updated with reason (G1 cond 3)**. Web before/after:
text rects + heights identical; small hero-region pixel diff (likely
animation, unviewed). /eras allowlist → D (12 PNGs ≈21 MB). PR NOT opened —
blocked by wp2.1a ERESOLVE → grunt reverting peer now (urgent; not waiting
for Codex r2).
**02:44:** wp2.1a peer reverted 4ecd7f49 (npm ci OK; root resolves react
18.3.1 + 19.2.8, apps/web 19.2.8). B fixer + C executor told to merge it; C
resumed to verify/parity/open PR. #4841 Codex r2 REQUEST CHANGES (P2 computed
dynamic import/require bypass; P3 data-swift2-ui attr; P3 fingerprint
unverified) → **Fable (mandatory, 2nd consecutive)** launched. **#4838 MERGED**
(Android independent of iOS). **#4842 MERGED**. Image-race fix → **#4845**
(imagesReady wait; negative 4 s-delay spec; no baselines changed; 2 green runs)
— was based on the prune branch, retargeted to main BEFORE GitHub deleted it
(stacked-PR rule held); reviewer r1 launched.
**02:46:** Fable #4841 (Fable log): fix-forward — ban all computed import()/
require() in packages/ui; REMOVE data-swift2-ui (rendered DOM isn't a probe
surface; proof-of-resolution → per-host tests); fingerprint from CI run URL;
scoped reviewer, land A, retarget B + C → fix r2 launched. **First post-#4838
train run 37112800404: Android selection `unknown`** (status read failed —
fails closed, Android skipped) → researcher diagnosing (EAS CLI command/flags/
JSON noise?). #4845 reviewer: minor — branch carries the prune commits
(merge main), negative spec may not discriminate (prove via mutation), SVG
decode false-fail risk → fix next slot.
**02:50:** Train "unknown" root cause: `eas workflow:status --json` prints JSON
then exits 11 (FAILURE)/12 (CANCELED) (eas-cli 23.2.0 status.js:97-108) → old
`if eas …; then` skipped the selector. Fix → **#4846** (read-android-status.sh
accepts 0/11/12; fake-eas tests 34/34) → reviewer APPROVE → **auto-merge set**.
Next train run after it lands should submit Android to Play internal (if the
EAS Android build job succeeded). #4844 fix r1 74426fe8 (deps, HostImageProps
+5 props, constant origin, identity test) → scoped reviewer APPROVE
(provisional on parity jobs); ops-env dispatch failure = wrong workflow
(mobile-parity.yml), irrelevant; Codex r2 `task-mus7mnzi-srp8qe` pending.
#4843 fix r1 pushed (PM accepted ~561 gross lines: moved wrappers, net +167;
transitive purity test catches 12 offenders pre-fix) → scoped reviewer r2
launched; Codex r2 next slot. #4845 fix r1 launched (merge main; prove the
negative spec discriminates via mutation; SVG decode tolerance).
**02:52:** #4843 r2 reviewer APPROVE; Codex r2 `task-mus7p36t-c6etr1` pending.
WP2.1-C → **#4847** (base wp2.1a; parity 37114176156 green, no baselines changed
— harness forces ParityFont, so parity can't see real-font regressions: web
evidence = identical text rects + doc heights before/after; hero diff =
animation (two "after" shots differ too); OTA +4.4% reason in body; extra:
/fonts immutable cache header in next.config.mjs, .prettierignore) → reviews
queued for next slot. WP2.4 first-slice brief draft launched (prep).
**02:56:** #4841 fix r2 daa4ab81 (computed import/require ban + 7 tests;
data-swift2-ui removed; per-host resolution tests; fingerprint caveat — no CI
job prints it) → scoped reviewer APPROVE → **#4841 (WP2.1-A) MERGED**; #4844 +
#4847 retargeted to main BEFORE branch delete (rule held). WP2.2-B executor
launched (stacked on wp2.2a + main merged in). Open: no CI job prints the Expo
fingerprint → candidate small CI addition (later).
**02:59:** #4845 fix r1 7d3a30fc (merged main; new delayed lazy-img + CSS-bg
specs fail with imagesReady no-op'd; SVG tolerance; viewport-width scope) →
scoped reviewer APPROVE → **#4845 MERGED** (harness image race closed; G1
cond 4 hole fixed). Executor syncing main into wp2.1b (#4844) + wp2.1c
(#4847) so their diffs show only their own work; then #4847 reviews + #4844
landing.
**03:08:** B/C synced (#4844 ac02626b, #4847 b5f7509b). **#4844 (WP2.1-B)
MERGED** (Codex r2 APPROVE + reviewer). #4847 reviewer r1: Med preload only
Inter/Playfair vs next/font preloading all → PM: preload ALL used faces (founder
rule 1); Med need real-font pixel evidence (no ParityFont) incl. merch (Bodoni
italic) + Dancing Script surface; Low stale comments; confirm bundle budget
counts fonts → fix after Codex r1 (`task-mus88z07-dy3gc1`). #4843 Codex r2 P2
(walker forms) → Fable: fix-forward → hardening fix running. WP2.3-A launched
(2.1-B merged). WP2.4 PR 0 running. **HA #97** filed (parity-gate required),
landing via #4848.
**03:10:** #4843 walker hardening b5aebe07 → scoped reviewer APPROVE → auto-merge
set WITHOUT --delete-branch (2.2-B stacked). **TODO after #4843 merges:**
retarget any PR on feature/one-ui-wp2.2a to main, then delete that branch.
**03:13:** WP2.1-D launched (next/* call sites → useHost; close /eras
allowlist or report options). WP2.2-B → **#4849** (base wp2.2a — RETARGET
when #4843 merges): perf median 12.1 ms / max 22.1 ms unthrottled (gate ok),
4x median 60.6; probe hash = fixture; suite 8367; search index replaced
(identical). **Concern: web bundle +117 KB gzip (.next/static 3.03→3.49 MB)**
— eager snapshot pulls merch/moods/videos/theories into the main route →
reviewer judging inherent-vs-avoidable; Fable if contested (G3 perf input).
**03:27:** WP2.1-D → **#4851** (14 reader files next/image→useHost; +118/-31;
parity 37116143963 green; reader-modules.ts mounts web adapter for side b).
**PM decision (reversible, recorded): era art in the app = network via
resolveUrl → https://www.longlivets.com/eras/* (like content photos; 21 MB
can't ride OTA); harness serves those canonical URLs with real bytes from
apps/web/public/eras via page.route; serve.mjs /eras fallthrough DELETED →
allowlist closed (G1 cond 2).** S4/G0 check added: offline era art on device.
TopBar bell Link: widen HostLinkProps (className/aria/title/ref passthrough).
Executor resumed for both; then reviews.
**03:29:** WP2.4 PR 0 → **#4852** (12 new captures: a-home-viewport,
a-item-viewport, a-home-footer ×4; 0 modified; 2 green runs). **Sensitivity
gap found:** pure 1px TopBar translate stays under maxDiffPixelRatio 0.001 on
iPad viewports (executor fell back to a padding mutation) → PM: add
element-clipped TopBar (+footer if needed) captures so the ratio applies to
the small area; negative = pure translateY(1px) must fail on all 4. Executor
resumed. **03:30:** #4849 fix r1 (Fable B split; base now main; hash = fixture;
parity 37116269531 green; main-route gzip −65 KB of +117 → remainder = core/
search code, accepted as inherent per Fable). Perf conflict: r0 browser
median 12.1 ms vs r1 script median 36 ms (likely Node) → re-measure per
ratified spec (Playwright, prod build + fixture, ≥10 fresh contexts) before
any contract call. **03:34:** re-measured per spec (e2e/perf/snapshot-build.spec.ts,
prod build + fixture, 12 fresh contexts ×3): fromBakedCore median 12.55/12.75/
12.60 ms, p90 24.0/13.6/12.9, max 24.6/14.1/13.4 → **gate PASSES**; 4x median
58–76 ms (report-only, G3). Full fromBaked ≈23 ms → core split ~halves it. Node
script deleted. #4843 MERGED; wp2.2a branch deleted (childless). Codex r1 on
#4849 launched. **03:35:** WP2.3-A → #4850: reviewer r1 minor; Codex r1
REQUEST CHANGES (payload not JSON-validated / proto keys; WebPath accepts
//host; openExternal any scheme; api headers allow Authorization/Cookie;
negotiate(NaN) ok; ids unbounded; dispatcher behaviours absent). PM: fix
validators in A (strict JSON, isWebPath, https-only isExternalUrl,
safelisted-header BridgeApiRequest, NATIVE_SUPPORTED_RANGE, bounded ids);
dispatcher behaviours (exactly-one-res, unsupported, timeouts, cancel,
replay dedup) = **WP2.3-B acceptance**, written as a CONTRACT in the bridge
README. Fix round launched. **03:43:** #4850 fix r1 (validate.ts strict JSON/
isWebPath/https-only/BridgeApiRequest safelist/bounded ids/NATIVE_SUPPORTED_
RANGE; README CONTRACT; 125 bridge tests) → reviewer r2 minor (undefined type
test, missing pre-ready strike line, nit) + Codex r2 `task-mus9hlb7-olv7lp`
pending. #4851 r1 changes done (resolveUrl era art; serve.mjs fallthrough
deleted → **/eras allowlist CLOSED**; HostLinkProps widened, TopBar migrated;
parity 37117092950 green) → reviewer launched. **03:50:** #4851 reviewer APPROVE
(minors: route fulfil 404 not throw; harness origin constant; resolveUrl must
not mangle //host) + Codex r1 `task-mus9lswp-ex91af` pending. WP2.3-B (logic
only, not wired — step 4 waits G0) launched stacked on wp2.3a. #4847 fix r1
65d608ea: real-font compare found REAL diffs (font bytes ≠ next/font's; č
fell back in Special Elite) → now next/font's exact bytes + 18 non-latin
subset faces (web CSS) → **0 px diff** on home/Speak Now/Merch/support/privacy
at 390+1440; preload 6 faces; metrics fixture; budget counts fonts (5.21/8
MB). Open: DOM CSS is latin-only (app may fall back on č) → reviewer r2
quantifying. **03:52:** #4847 reviewer r2 APPROVE conditional: only non-latin
letter in content = č (Toni Matičevski). **PM: DOM CSS gets latin-ext for all 5
families (~245 KB base64; reason recorded = G1 cond 3) + guard test: every
content code point > U+00FF must be covered by a DOM unicode-range or an
explicit system-fallback allow-list.** Executor resumed.
**03:53:** WP2.3-B (logic only) → **#4853** (base wp2.3a; createBridgeHost,
injected deps, CONTRACT→test table; not wired; fingerprint unchanged) → reviews
next free slot. #4849 Codex r1: P1 "callers not migrated" = BY DESIGN (C1–C3);
P2 enforce PERF_SAMPLES ≥10; P2 search golden over ALL groups on the frozen
fixture, generated from the OLD builder → fix round. #4851 Codex r1 = same
minors as reviewer (404 not throw, //host guard, shared origin) → fix round.
#4850 Codex r2 queued.
**03:58:** #4851 minors fixed (404 era route, resolve-url.ts single-slash only,
shared canonical-origin.ts) → lander waiting on PR parity-gate (not yet a
required check — HA #97) then merges. #4849 r2 fix 2680dbd5 (PERF_SAMPLES ≥10;
search golden over all 7 groups / 28 queries from the OLD builder on the frozen
fixture) → Codex r2 `task-musa207v-tat3sq`. #4847 DOM latin-ext added (OTA
+247 KB ≈ +3.3%, reason recorded) + coverage guard → Codex r2
`task-musa3de3-412a1q`. #4853 reviewer r1 REQUEST CHANGES (7: unbounded queues,
LRU evicts in-flight ids, unvalidated share/haptic/notif payloads, re-ready
ignored, cancel typing, requests never resolve after fatal, raw error text) +
Codex r1 `task-musa4…` launched → one fix round after.
**04:02:** **#4851 (WP2.1-D) MERGED** (allowlist closed on main; WP2.1 A/B/D
done, C = #4847 in Codex r2). Launched WP2.3-C (client + 3-leg contract, not
wired) and WP2.2-C1 (caller migration group 1). Release train 37115793933:
Android selection `skipped` → suspect an existing Android store build for the
fingerprint (built earlier, never submitted — "this run only" rule strands it)
→ researcher confirming. **04:04: CONFIRMED** — get_android_build SUCCESS
build 0a1ef202-45ec-4cf3-add2-04029409828e (current fingerprint), build_android
SKIPPED, publish_update_android_only SUCCESS (OTA publishing for that
fingerprint) — but that build was NEVER submitted to Play (old whole-run gate +
new this-run-only rule). Joey's phone is on an older native build → needs it.
Fix executor launched: selector `existing` result (fingerprint-bound, not
commit-bound) → submit; idempotent re-submit handling.
**04:09:** **#4854** (submit existing Android build; field = jobs[get_android_build]
.turtleBuild.id — the logged "build" is our projection; actions/cache marker
per build id) reviewer APPROVE → **auto-merge set** → next main train should
submit 0a1ef202 to Play internal. **#4847 (WP2.1-C fonts)**: Codex r2 APPROVE
(no findings) + reviewer → **auto-merge set** (parity green 37117886342).
WP2.3-C → **#4855** (client + 3-leg contract, not wired; 150 tests) → reviewer
r1: 8 small items; Codex r1 launched. #4853 Codex r1: 8 hardening findings
(unbounded seen on malformed path, no inflight cap, v not enforced post-ready,
cancel-before-start still invokes handler, no teardown after fatal/dispose,
res correlation by id only, ack seq bounds, scheduler throws) + reviewer's 7
→ fix round 1 launched (15 items). Codex queue: #4849 r2, #4850 r2.
**04:16:** WP2.2-C2 → **#4857** (partial: MomentDetail, ThreadsTimeline,
ProposalThread migrated; ~22 lines). PM: C2 adds missing queries
(contentForThreadInRange, songTargetOf, contentForThreadInEra,
resolveEraSecretLink) with deep-equal tests + migrates EntryDetail /
RunwayThread / EraSecretCard; share-payload cascade → C3; trace a 1×404 per
page seen in smoke. Executor resumed. WP2.2-C1 running in parallel.
**04:22:** **#4854 MERGED** (existing Android build submit) → next main train
should push 0a1ef202 to Play internal. #4853: reviewer r2 APPROVE (all 15);
re-ready = new session (PM decision: abort old in-flight, clear seen,
renegotiate, re-flush); Codex r2 `task-musaux0q-uz8cfw` running. #4855 Codex r1
(P1 no sendReady on mount; P1 readySent before post; strict JSON outbound; inbox
cap; contract legs tautological/one-way; timer TDZ) + reviewer 8 → fix round
(14 items). Codex queue was WEDGED (#4849 r2, #4850 r2 queued 40 min) →
cancelled + relaunched #4849 r2; #4850 r2 nits (undefined type test, contract
pre-ready strike, prettier) via grunt. C1 → **#4856** (parity 37119083649 green;
PM accepts ~8-line ReaderSpike provider mount; threadsInEra/threadCrossings
→ C3) and C2 → **#4857** (+4 pure queries; era-secrets-link.ts; 404 =
/_vercel/insights pre-existing) → reviewers launched.
**04:30:** C1 #4856 reviewer APPROVE (Codex r1 `task-musayp0r-iuy0qa`); C2 #4857
reviewer APPROVE provisional (Codex r1 `task-musazabl-yqjavl`); C1 lands
before C2 (MomentDetail conflict). #4850 nits d371b8ab → Codex r2
`task-musazy2d-icpi1v`. WP2.2-C3 launched (threadsInEra/threadCrossings
queries + share cascade; stacked on C1). WP2.4 PR 0 #4852 done: TopBar element
clip — pure 1px translate fails on all 4 (run 37119324040); footer capture
DROPPED (unstable; follow-up: footer on /support); 12 A / 0 M; 2 green runs →
reviewer w/ landing authority.
**04:32:** #4852 approved but head = bot commit (no PR CI) → grunt merging main
(non-bot push triggers CI) then lands. #4849 Fable fixes 07ae26fa (perf spec
excluded via testIgnore + dispatch-only perf workflow; legacy builder test-only
+ regen-equals-golden test; exactly 28) → scoped reviewer landing w/ stacked
rule (retarget #4856/#4857 to main). #4855 fix r1 (14 items + monotonic ids;
176 tests) → reviewer r2 APPROVE; Codex r2 `task-musba925-ao4yi4`. #4853
monotonic-ids round running. **Bridge landing order: A #4850 → B #4853 + C #4855
retarget to main; README CONTRACT conflict between B and C expected (trivial).**
**04:36:** #4853 reviewer r3 APPROVE (monotonic ids: 1–15 digits, hwm survives
ready; ready 3/10 s; outbox; decisions.md entry) → lands after A. Codex: C1
#4856 + C2 #4857 = P3 only (equivalence sampled) → approve-with-nit, grunt making
them exhaustive (C1: every item, id AND slug). #4850 Codex r2 REQUEST CHANGES
(P1 Proxy TOCTOU — returns original object; P2 unbounded walk before size cap;
P2 double-encoded %252e bypasses isWebPath; P2 version parse throws on Proxies;
P3 unicode slash lookalikes) and #4855 Codex r2 REQUEST CHANGES (P1 rejected
ready never retried; P1 clock-backwards after reload → all ids ≤ hwm rejected;
P2 pre-ready timeouts start before send; P2 inbox parses 1,024 before cap; P3
ids beyond MAX_SAFE_INTEGER) → both 2nd consecutive → **Fable consult**
(leaning: A returns a fresh clone + bounded walk + decode-until-stable + ASCII
paths + guarded reads; C ready backoff, host returns hwm in ready ack → client
reseeds max(now, hwm+1), timeouts from send, parse ≤ cap, BigInt ids).
**04:37:** **#4849 (WP2.2-B) MERGED** — snapshot context + core/extension split
on main; #4856/#4857 retargeted to main, wp2.2b deleted. Landing next: C1 #4856
(after exhaustive-test commit) → retarget C3 (stacked on c1) → C2 #4857 (merge
main; MomentDetail conflict) .
**04:42:** **#4852 (WP2.4 PR 0) MERGED** (chrome captures on main). B #4853 hwm
delta 629a8d44 (`readyAck {hwm}`) delta-reviewed APPROVE → B fully approved,
lands after A. C #4855 fix r2 launched (ready backoff, hwm reseed w/ validation,
timeouts from send, inbox slice before parse) — merged wp2.3b in. A #4850 Fable
fixes in (string boundary, canonicalize, ASCII+fixed-point isWebPath) → scoped
reviewer landing (retarget B + C). C1 #4856 exhaustive test 23f4996e → lander
polling CI; C2 #4857 exhaustive 830ee85d. C3 → **#4858** (6 new queries, share
cascade w/ server-only wrapper) reviewer r1: sampled equivalence + myEras cases;
"out-of-scope release files" = main merged into its stack (noise, clears on
retarget) → fix after Codex r1. **HA #97 still open** (rulesets require only
`build`) → WP2.4 A1 held.
**04:48:** **#4850 (WP2.3-A) MERGED**; #4853/#4855 retargeted to main, wp2.3a
deleted. B #4853 landing executor (merge main; adapt bridge-host to A's final
string-boundary API). C #4855 Fable r2 80d0b310 → scoped review found a real bug
(flush on ready POST success, before readyAck reseed) + client.ts 378 lines →
fix (gate opens on readyAck; ack timeout → retry; split) running. C3 #4858
exhaustive equivalence pushed. WP2.2 landing chain executor (C1→C2→C3, merging
main each) running.
**04:49: ANDROID UNBLOCKED** — train run 37120205359: "Android store-build job:
existing; build id 0a1ef202…" → **submitted to Google Play internal (version code
18)** at 11:43Z, submission 8696849e-52ec-4edf-972c-482113e6e814. Joey can update
the Android app from Play. **S2 (Android) ready for chat:** update from Play →
open twice → diag panel shows build 18 + current update id → 5 cold (force-stop
between) + 5 warm [diag] reports; pass bar PLAN §WP0.2 cold ≤2.5 s worst-of-5,
warm ≤1 s; at: offsets must be real now (#4833). Then S4 (spike checklist).
**05:00:** **#4853 (WP2.3-B) MERGED** (adapted to A's string-boundary API:
parseEnvelope(raw) for strings, parseEnvelopeValue for objects; 8660 tests).
C #4855 gate fix 59bcfe57 (ack-gated flush; split client-ready/inbox/back) →
verify-and-land agent (merge main, land). WP2.2-E launched (merch + songMoods
via attachExtensions in their lazy chunk; mobile mirror; useReader typing →
drop TrackGuide cast).
**05:12:** **#4855 (WP2.3-C) MERGED** → WP2.3 A, B, C (pre-G0 scope) all on main.
Fable's wrong-call signal fired: DOM client uses parseEnvelopeValue (Expo can
deliver objects); native host has an object path (tests) → Fable consulted.
Remaining WP2.3: B step 4 (wire host into SharedUiHost/watchdog), C step 3
(wire client into DOM host), D/E/F — all after G0.
**05:16:** **WP2.2 C1 #4856, C2 #4857, C3 #4858 MERGED** (landing chain; no
ambiguous hunks). WP2.2 remaining: E #4859 (reviewer APPROVE; Codex r1 pending)
and D (lint ban + docs) launched. #4847 fonts went CONFLICTING after the merges
→ sync executor (re-run font-compare). Fable invariant test FOUND A REAL
DIVERGENCE: top-level own `__proto__` key rejected by parseEnvelope(string) but
accepted by parseEnvelopeValue(object) (object path walked only payload) → fix
authorized: one shared post-parse funnel (object path = canonicalize →
parseEnvelope(string)). **05:18:** fix → **#4860** (parseEnvelopeValue runs the
whole-envelope checkParsedJson walk like the string path; object-path.test.ts
pins the invariant; 457 tests) — auto-merge set; PM accepted without separate
review (strictly narrows validation; CI typecheck gates).
**05:27:** WP2.2-D → **#4861** (lint ban in components/longlive + packages/ui;
merch allow-listed → #4859; root lint now covers components/longlive) →
reviewer landing. #4847 synced (fc93da5d) but real-font compare now shows a
**reproducible 27 px diff on home @1440** (card-corner marks; was 0 before sync;
main-vs-main 0) + merch `fonts equal=false` → **PM DISABLED auto-merge on #4847**
(founder rule 1) → researcher root-causing.
**05:29:** **#4861 (WP2.2-D) MERGED** (lint ban live). Follow-up: extend the ban
to client-only files in apps/web/lib/longlive (or split server/client there).
#4859 Codex r1 = P3 only (stale doc) → approve-with-nit; final round (doc,
typed accessor instead of double cast, effect deps, merge main, REMOVE merch
allow-list from the ban) + land running. WP2.2 done once #4859 lands.
**05:34:** #4847 diff root-caused: **antialiasing noise** (1–2 levels/channel on
1px rounded .era-card borders; main-vs-main flips 0↔27 too) + merch equal=false
= variable-vs-static Bodoni face listing (pixels identical) → NOT a regression →
**auto-merge re-enabled on #4847**. Tooling follow-up (tolerance ≤2, re-run on
nonzero, face normalisation) executor waits for #4847 then opens a small PR.
**05:41: ✅ WP2.2 COMPLETE** — **#4859 (E) MERGED** (merch/songMoods via
ReaderExtensionsProvider in the merch chunk; merch components migrated to
useReader + content-enrichment; allow-list removed; docs fixed). Home route
gzip 1,278,783 B (merch absent). Open: #4862 (lint ban → lib/longlive client
files; merch-filters TODO now clearable) reviewer landing; /support footer
capture; font-compare tooling; G0 evidence pack committed (g0-evidence.md). (Note for G3/WP2.4+: whole-viewport ratio tolerances hide
small-element shifts — prefer element clips for chrome.)
**18:09:** #4816 (WP0.2 C) + #4831 (size baseline) MERGED → **WP0.2 A–C all on
main.** #4833 (WP0.1b): Codex r1 P2 (0 ms ≠ point mark) → fe95e5b8 explicit
POINT_STAGES → scoped reviewer APPROVE → auto-merge set. #4827 reviewer r2
APPROVE (probe route safe: runtime env, force-dynamic, no input; fixture apply
fails closed); PM verified fingerprint line 4c8f334d base==head. Codex r2
`task-murow2wy-ubyg32` pending → then the #4827/#4822/#4828 landing sequence.
**NEXT after #4833 lands (OTA):** S2 in chat — Android (+iPad if TestFlight
invite arrived): 5 cold + 5 warm [diag] reports; pass bar PLAN §WP0.2 cold
≤2.5 s worst-of-5, warm ≤1 s; check at: offsets are real (not 600000).
**18:04:** #4827 fix r1 → head 8a35f251 (all 10 items; PM verified run
37084307031 success). Deviations PM-accepted: frozen fixture ≈8 MB/118k lines
committed (prune = follow-up issue; no regeneration until pruned);
apps/web/app/parity-probe/route.ts env-gated (accepted IF reviewers confirm
prod-unreachable); bypassCSP kept on WebKit only. **Windows MAX_PATH:** fixture
hash-dirs fail checkout without core.longpaths (worktree add failed) — reviewers
rating. Round 2 (FINAL per rule 3) launched: Codex r2 (tree
C:/Users/Fourtys/AppData/Local/Temp/cx27) + reviewer r2. 2nd rejection → DEBUG.md
+ Fable.
**17:56:** #4828 r2 fixes 1a67746e (impact in key + test; passes>0; doc) +
nit 6d6bd5d1 (stale type ref) → **#4828 APPROVED** (approve-with-nit), lands
after #4827/#4822 pair (retarget to main first; re-run parity after merge-in).
Local unpushed merge b853f1b4 in wt-05b — discard by not pushing. Spike is
behind the override flag → nothing user-facing waits.

**CHECKPOINT 2026-10-02 14:56 PDT — supersedes everything below in this
section.** Merge freeze ON (S1 with Joey in chat; no [diag] reports on #4791
yet). Merged today: #4792 #4794 #4793 #4814 (size gate). #4817 auto-merge set.

APPROVED & HELD for post-S1 landing, in this order (CodeQL/CI green; check
`gh pr view <n> --json mergeable` first, merge main in if behind):
1. #4796 (WP0.3b) `gh pr merge 4796 --squash --auto --delete-branch`
2. #4813 (WP0.2 A) same
3. #4799 (WP0.4 native batch → store builds) same
4. #4811 (WP0.4b) — after #4799 merges: `gh pr edit 4811 --base main`, merge
   main in if needed, then auto-merge
5. #4815 (WP0.2 B, base wp0.3b) → retarget main after #4796; then #4816
   (WP0.2 C, base wp0.2b) → retarget main after #4815
6. #4818 (WP0.5a, base wp0.4b) → retarget after #4811
6b. #4819 (WP1.1c p1, base wp0.4b) → retarget main after #4811, auto-merge
6c. #4822 (WP0.5b, base wp0.5a) → **APPROVED 17:09** (head d16abd2c; confirm
   build-full green) → retarget after #4818, auto-merge. Then S4 (checklist in
   Fable log 17:02).
7. After #4799 lands: bump size baseline (`node scripts/parity/size-check.mjs
   --update`, +11.6% expected) in a small PR; then S2/S3 sessions in chat
   (owner directive: sessions go in chat). S3 extra check: WP0.4 test page
   ~250 px wide in a 393 px iPhone viewport.
**15:03 update:** WP0.5b → **#4822** (base wp0.5a; merged 42dc6852). ~700
non-test lines — PM accepts unsplit (spike code, replaced by WP2.x).
Deviation accepted: call-time require() after fill() (await import() broke
expo export: "Asset not found __common-*.js"). Added `@/*` paths to mobile
tsconfig. Suite 8174; exports OK; bundle check OK; browser screenshots real
(scratch `wp05b-{chromium,webkit}-{stream,scrolled,moment-detail}.png`;
snapshot hash ad5cf47a…, 780 items/12 eras). **Reviewers must reconcile the
fingerprint: executor reports 3603a03f before==after, earlier executors
reported dcf1ea59 on a similar base — confirm the native fingerprint is truly
unchanged vs origin/feature/one-ui-wp0.4b.** NEXT: Codex + reviewer on #4822,
then Fable design-fidelity (owner directive). Device-only checks → S4.
IN FLIGHT (as of 14:56): WP0.5b executor (now done → #4822); #4819 (WP1.1c part 1) Codex
r1 pending + reviewer r1 REQUEST CHANGES (minor: real PR run on head;
fingerprint line in PR/docs) → one fix round to the #4819 executor after
Codex. Then: Codex + reviewer + Fable design-fidelity on WP0.5b; WP1.1c part
2 brief (research in log 14:37; Fable review incl. structural-gate deviation).
WP0.2 S2 + cost table wait for S1 [diag] reports.

(Superseded checkpoints and the 12:15–14:56 session history were moved verbatim to `PROGRESS-archive-2026-10-02.md`.)
