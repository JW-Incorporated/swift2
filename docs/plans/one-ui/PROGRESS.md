# One UI programme: progress (the PM's memory)

The single source of live state for the PM. Rewrite the **Next actions**
block at every checkpoint; append to the **Log**; never let this file pass
~200 lines (fold old log lines into one summary line per finished phase).

## Next actions (for a fresh PM session)

**>>> CHECKPOINT 2026-10-03 04:43 PDT — AUTHORITATIVE; everything below is history. <<<**
Owner: "keep going… run all night… parallel agents" (02:08). Cap 5 workers (+Codex jobs).
**ON MAIN:** G1 done (harness+a11y+parity-gate always-run #4840, image-race fix #4845,
fixture prune #4842); WP0.1b #4833; WP2.1 A #4841, B #4844, D #4851 (allowlist closed,
resolveUrl era art); WP2.2 A #4843, B #4849 (core/extension snapshot); WP2.4 PR0 #4852;
release train: #4838/#4846/#4854 (Android submit independent of iOS; existing build
0a1ef202 submitted on next train).
**OPEN / NEXT (in order):**
1. WP2.1-C fonts **#4847** — approved, auto-merge set (check merged).
2. WP2.3 bridge: A **#4850** scoped reviewer landing → retarget B **#4853** (approved incl.
   hwm `readyAck` delta) + C **#4855** to main → land B → C fix r2 (Fable 04:36) running →
   C scoped reviewer after merging main (contains B) → land. Watch README CONTRACT conflicts.
3. WP2.2 callers: C1 **#4856** lander polling CI (then retarget C3 **#4858** to main) → C2
   **#4857** (approved; Codex P3 fixed 830ee85d; merge main, resolve MomentDetail conflict
   vs C1) → C3 #4858 fix round after Codex r1 (exhaustive equivalence + myEras cases;
   conflicts w/ C2 on MomentDetail/TopBar/TheoryGuide/TrackGuide/TrackDetail/queries.ts).
4. WP2.4 A1 (move-only rule, brief-wp24.md) — BLOCKED on **HA #97** (parity-gate required;
   rulesets currently require only `build`). Then A2 → B → C; D after G0.
5. G0 (WP0.6) blocked on device sessions: **HA #96** (Apple Associated Domains) for iOS;
   Android: confirm Play internal got build 0a1ef202 (check latest "Mobile release train"
   run log: "Android store-build job: existing" + submit step) → then S2 in chat with Joey
   (5 cold + 5 warm [diag]; diag offsets now real via #4833) and S4 (checklist in Fable
   log 17:02 + font/era-art/ClownChat checks).
6. WP2.3 D/E/F + all of WP2.4-D wait for G0.
Follow-ups: footer parity capture on /support; packages/ui `useReader` generic typing
(WatchableVideoNote cast in TrackGuide); executors keep dispatching mobile-parity.yml by
mistake — always say "exactly parity.yml"; Codex queue can wedge (cancel + relaunch).
Briefs: docs/plans/one-ui/briefs/brief-wp2{1,2,3,4}.md (top blocks = binding rulings).

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
review (strictly narrows validation; CI typecheck gates). (Note for G3/WP2.4+: whole-viewport ratio tolerances hide
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

## Status

| WP | State | PR | Notes |
|---|---|---|---|
| 0.0 | **merged** | #4792 | | Reviewer nits applied (android steps 3+7; job cap 235). Next WP checks `merged`. Earlier: | Caps 20 preflight / 195 wait / 225 job (evidence-sized); follow-up #4795 (split cap, slow EAS waits — needs Expo dashboard timelines). Reviewer = landing gate. Earlier: | Codex r2: one Medium (timeout slack) → Fable: fix + reviewer, no r3. Executor applying after checking real EAS wait durations. Round-1 note: | Codex REQUEST CHANGES: (H) job timeout can cancel the summary step — reserve time / separate `needs` report job; (H) hung path has no reliable run URL — launch without `--wait`, persist run id/URL, then wait by id; (L) rollback 15 min tight. Fix queued for next free slot (resume WP0.0 executor), then Codex round 2 + reviewer |
| 0.1 | **merged** | #4793 | Researcher pinning the OTA/build for S1. | Final fix 03416584 (32 KB cap, exact diag shape, unknown launch, DIAG_REPO, test split; suite 8071 pass). Scoped reviewer APPROVE bar one indentation nit. | Codex r2: (H) 4 KB cap after unbounded req.json(); (M) `.trim()` + extra top-level keys accepted; (L) unknown→cold. Injection paths confirmed closed. | Reviewer REQUEST CHANGES (minor): PM accepts the visible Settings version label (plan's unlock needs it; note in PR body); split route.test.ts diag block → route.diag.test.ts; unknown launch → label/skip, not "cold"; diag comment uses constant repo `JW-Incorporated/swift2`. Bundle with Codex r2 (job `task-murav0ko-t1usx2`). | R1 fix 72167108: strict `parseDiagReport` (diag.ts, PM accepted new file), server-built comment, 4 KB cap; suite 8064 pass (2 flaky unrelated timeouts noted). Nit for r2: launch "unknown" → "cold" skews baseline. Then reviewer. R1: | Codex r1 REQUEST CHANGES (Critical): `[diag]` + free text → public comment on #4791 (spam/personal-text, C2 whitelist violated; test vacuous). PM fix: server-side strict schema, reject extra/unknown fields, tight type/size/range limits, comment built server-side from whitelisted values only (no free text). No app "auth" token (would be public in the bundle; secrets are Joey's). Residual accepted: fake numbers in a fixed format. Then Codex r2 + reviewer. Earlier: | Marks added (provider-wiring in era-stream-data; first-era-paint via rAF in EraSection, first era only); full suite 8062 pass; both exports OK. Codex launched. Prior note: | Tracking issue **#4791** (`DIAG_ISSUE_NUMBER`). PM accepted 6-line App.tsx deviation; executor adding `provider wiring` + `first era paint` marks (touch set +EraStreamScreen/era-stream-data) before Codex + reviewer |
| 0.2 | blocked on S1 | | |
| 0.3 | **merged** | #4794 | | Final fix pushed (fail→pass verified by executor; suite 8056 pass). Scoped reviewer = landing gate → then auto-merge. | Codex r2: 2 Mediums (provider restore by value; async withProviders) → Fable: fix + doc edits, scoped reviewer, land. Earlier: | R1 fixed (suite 8054 pass). PM accepted deviations: production searchDocs tie-break score→title→key (tiny web tie-order change), two one-line provider getters. ~530 non-test lines. Codex r2 running; Fable design-fidelity after (when a slot frees). R1 note: | Codex r1 REQUEST CHANGES (P1 search order hidden by sort; P1 call-order-dependent global providers; P1 songMoods catalogue unwired; P2 hash ignores snapshot.version); reviewer APPROVE w/ findings (baked test could go vacuous). PM: preserve source order; scope+restore providers now, pure derivation = WP2.2. After fix: Codex r2 + Fable design-fidelity. Earlier note: | +674/-1 (~490 non-test; PM accepted over tripwire — one coherent contract). Full suite 8047 pass. Codex running (codex-companion job), then reviewer + Fable design-fidelity (snapshot is the §4 core contract). Risks: fromBundle rewires global providers; search-docs.ts mirrors web buildSearchIndex (WP2.2 to dedupe); WebCrypto-only hash |
| 0.3b | **APPROVED — queued for merge freeze** (no auto-merge until S1 closes; then `gh pr merge 4796 --squash --auto --delete-branch`) | #4796 | Fable fix ee211f0a (partial loads write only last-good; main merged, WP0.1 hooks kept; suite 8101 pass); scoped reviewer APPROVE; body nit fixed by PM. Follow-up #4800 (cross-OTA schema hazard). Earlier: | Codex r2 P1: marker-last unsafe for overlapping loads (pruned + full interleave → pruned data marked complete). Earlier: | R1 P1s fixed (warm-cache validation; marker-last write order — marker-before-files gap was pre-existing on main; suite 8052 pass). R2 told to read the worktree directly (sandbox can't fetch) and cover CORS/ApiFetch. | P1 warm path serves unvalidated/partial cache; P1 complete-marker written before files. Codex (sandbox blocked fetch; cached refs) did NOT cover CORS rules / ApiFetch / vacuous tests → round 2 must. | Reviewer fixes pushed (legacy-marker tests, corrupt-cache fallthrough, naming comment; preview re-curled OK; suite 8049 pass). Will need a merge of main after #4793 (both edit load.ts). | Codex job `task-murat5n0-cboswh` stalled (log frozen 22 min) → cancelled; produced nothing, so it doesn't count as a round. | Reviewer REQUEST CHANGES (minor): legacy `etag:<v>` cache-value test (truthy → warm hit, '' → network); warm-path parse inside try → fall through to network; comment on kept `etag:` key name. Bundle with Codex r1 findings into one fix round. | PM fix done (73d09936): warm load = 1 request (`current.json` bundleVersion vs cached complete marker); 304 path deleted; Expose-Headers dropped (ETag unused); suite 8046 pass. Earlier: | ACAO `*` + Expose ETag on `/content/:path*` (preview curl verified; /api none). `ApiFetch` contract in packages/content. **Canonical host: `https://www.longlivets.com`** (apex 308s). 7 `/api` call sites listed (ClownChat, CurrentItemDetail, FeedbackButton, MoodChat, SubmitLinkForm, WebNotificationSettings, web-push-client). PM REQUEST CHANGES: stripping If-None-Match made every load re-download the bundle (native regression) → version/hash short-circuit with zero file fetches; delete dead 304 branch. Conflicts with #4793 in load.ts expected. Then Codex |
| 0.4 | round-1 fixed (39a129b0) → Codex r2 + reviewer next; HOLD merge until S1 closes (store builds) | #4799 | R1: Codex REQUEST CHANGES (P1 crash loop → reload cap + WP0.4b sequencing; P1 app links → accepted; P2 tests → added); reviewer APPROVE w/ 2 Lows (fixed). | Fingerprint (a) 71afa3f3→3603a03f (native: dom-webview, log-box, haptics, screen-orientation); (b) DOM-only edit unchanged → OTA proven; DOM bundle under www.bundle. expo-doctor 2 explained (dup react-dom root 18.3.1 vs mobile 19.2.3 → Metro singleton pin; patch drift left). PM accepted deviations: routes.ts(+test), app-config.test, override comment, font as CSS data URI, JS deps tailwindcss/@tailwindcss/postcss/@radix-ui/react-dialog. Earlier: | Brief: PM scratch `brief-wp04-stage2.md` (a fresh PM: if missing, rebuild from this row + PLAN §WP0.4). Post-impl: Codex + reviewer (Fable reviewed at the matrix boundary). Merge = new store builds; respect S1 merge freeze. | Final must-add: react-dom 19.2.3 · react-native-web ~0.21.0 · @expo/metro-runtime ~57.0.16 · @expo/dom-webview ~57.0.1 · expo-haptics ~57.0.3 · expo-screen-orientation (SDK-57 pin; lock phones portrait at runtime) · `android.softwareKeyboardLayoutMode: resize` · `orientation: default` · `ios.requireFullScreen: false` · `ios.associatedDomains: [applinks:longlivets.com, applinks:www.longlivets.com]` · one Android intentFilter autoVerify VIEW https both hosts BROWSABLE+DEFAULT · `expo.install.exclude: [react-native-webview]` (keep 14.0.1). Stage 2 brief must add: launch-attempted/ready strike record; own `reload()` when supplying onContentProcessDidTerminate; DOM `window.onerror`/`unhandledrejection` → async `reportError` prop; test page calls `onReady`; TWO fingerprint diffs (batch before/after; DOM-only edit leaves it unchanged = proves DOM bundles are OTA); do NOT touch `.well-known` (they're the switch — ship only with WP2.3). Superseded researcher notes: | Must-add: react-dom 19.2.3, react-native-web ~0.21.0, @expo/metro-runtime ~57.0.16, **@expo/dom-webview ~57.0.1 (native — DOM no longer uses RNC webview)**, expo-haptics ~57.0.3, `android.softwareKeyboardLayoutMode: resize`, iOS associatedDomains + Android intentFilters (X4). Open: RNC webview 14.0.1 vs SDK pin 13.16.1; dom-webview has no onError/onLoad (watchdog = ready + terminate/renderGone + timeout; expo#46374 blank WKWebView); file:// storage persistence → WP0.5 device test; Tailwind v4 in DOM unproven. PM leanings for Fable: include universal links now (C3), keep RNC 14.0.1 unless export/doctor fails |
| 0.4b | ready to launch (stacked on #4799) | | Fable-reviewed brief (Fable log) |
| 0.5 | blocked on 0.2/0.3/0.3b/0.4/0.4b | | |
| 0.6 | blocked on 0.5 | | Fable |
| 1.1 | blocked on 0.6 | | |
| 1.2 | blocked on 1.1 | | |
| 2.1–2.14 | blocked on G1 | | **WP2.2 carry (Fable, from #4794):** pure derivation over inputs, no module-global providers = ACCEPTANCE criterion gating WP2.4 (needs WP1.1 parity harness first); web uses `buildSearchDocs(inputs)`, delete web copy, `searchIndex` test-only or removed; confirm no reader path depends on flat `CONTENT` order; replace `'offline-last-good'` literal (sources.ts:88) with loader constant; context type `{status:'loading'} \| ReaderSnapshot`, `state:'error'` = last-good shown, refresh failed. WP2.1–2.3: app uses `https://www.longlivets.com`; 7 `/api` call sites per WP0.3b row |
| G3–G5 | blocked | | |

States: queued · in progress · in review · merged · blocked on <x> · dropped (reason).

## Human-action sessions

| Session | State | HA # | Result |
|---|---|---|---|
| S1 | **given to Joey in chat 13:35** (owner directive: sessions in chat) — awaiting his reply; freeze ON | | #4793 merged f27698a4 19:07Z; release-train run 37052010807 queued behind 37048689230 (#4794). File S1 once 37052010807 completes: pin build + update id (OTA includes #4794's packages/experience code). **Merge freeze on apps/mobile/** + packages/** effective now** (no auto-merge on #4796/#4799 until S1 closes). |

## Fable log

| Date | Question | Advice | PM decision |
|---|---|---|---|
| 2026-10-02 | Plan review (pre-kickoff) | Blocker: no CORS on `/content`; watchdog too late; missing native-needs audit; `next/font` breaks parity; PROGRESS landing, kickoff prompt, OTA freeze undefined | All five required edits and the minor notes adopted (WP0.3b, WP0.4b, needs matrix, fonts in WP2.1, OPERATING-MODE §3/§6/§8 kickoff, `[diag]` → one issue, perceptual diff, OTA size budget) |

| 2026-10-02 | Pre-launch review of WP0.3b + WP0.4 briefs | 0.3b: bridge-serializable `ApiFetch` ({method,path,headers,body:string}); strip non-safelisted request headers (no preflight); expose ETag only if read; no `Vary: Origin`; curl the Vercel preview on `www.`. 0.4: must-add = any WP through G5; add orientation/tablet, splash-hold, web-browser, inline media, X4 prereqs, fonts, webview version rows; name DOM ready/crash/imperative mechanisms + release origin/IndexedDB persistence; test page proves `onReady` + crash callbacks in S3; store build only if fingerprint diff non-empty; Fable signs matrix at the stage 1→2 boundary instead of post-impl | All 12 REQUIRED adopted; 0.4 Stage 1 launched first (critical path), 0.3b next free slot |
| 2026-10-02 | WP0.4 native-needs matrix sign-off | Signed with amendments: +expo-screen-orientation, `orientation: default`, explicit `requireFullScreen:false`, universal links apex+www now (.well-known withheld until WP2.3), keep RNC 14.0.1 via install.exclude, stay on dom-webview (RNC onError wouldn't catch the real failures), DOM bundles must be OTA assets (prove via 2nd fingerprint diff) | Signed as amended |
| 2026-10-02 | #4792 two consecutive Codex rejections (mandatory) | Approach sound, no DEBUG/revert; r2 Medium real but non-material (URL already in summary before wait). Fix: secret-check cap 1, wait 34 (54/60). Land after scoped `reviewer` pass, no 3rd Codex round. Watch: first real store-build EAS run >25 min → raise wait, cut preflight | Adopted; PM added a check of real successful-run wait durations before fixing the 34 |
| 2026-10-02 | #4794 design fidelity | MERGE-WITH-EDITS: doc-comment eraStream/trackGuide/threads as equivalence fingerprints (types.ts + README); PR body states the search tie-break web change. Pure derivation = WP2.2 acceptance gate | Adopted; WP2.2 carry list recorded |
| 2026-10-02 | #4794 two consecutive Codex rejections (mandatory) | Sound, fix-forward, no DEBUG/revert. Restore original provider function refs via getters (identity test); withProviders module-private + sync-only (type + runtime thenable throw). One commit with doc edits → scoped `reviewer` (each Medium fail→pass test) → land; no Codex r3 | Adopted |
| 2026-10-02 | #4793 two consecutive Codex rejections (mandatory) | Fix-forward. Route-wide 32 KB byte cap before JSON parse (16 KB could 413 legit 5000-char CJK/emoji feedback; diag-only leaves the shared hole); streamed abort for chunked; exact `[diag]`, top-level keys {message,hp,diag}; constant repo; `unknown` launch. Scoped reviewer → merge, no Codex r3. Watch: any real-user 413 in Vercel logs | Adopted |
| 2026-10-02 | #4796 two consecutive Codex rejections (mandatory) | Race real (verified load.ts 489-501) and reachable on main too. Fix-forward: partial/pruned loads write ONLY last-good, never the version-keyed trio (structural; correct across N JS contexts). Rejected per-version mutex (one runtime only) and pulling WP0.2 dedupe forward. Deterministic interleaving tests. Follow-up issue: cross-OTA schema hazard (fold schemaVersion/build id into cache keys). Land after scoped reviewer | Adopted; PM overrides landing timing only: no auto-merge until S1 closes (merge freeze) |
| 2026-10-02 | WP0.4b brief review | REQUIRED: mount gate in App.tsx via pure `decideMount(record, buildKey, now)`, predicate `(sharedUi \|\| override) && !fallbackActive`; attempt write AWAITED before host renders (fail closed); ready idempotent, reportError strikes only pre-ready, terminate/renderGone count at event; timeout paused on background, background-before-ready = abandoned not strike; strike 1 → native THIS launch immediately, 2 → clear override + fallbackLaunchesRemaining 1; re-enabling override clears record; one SecureStore JSON key, buildKey = nativeBuildVersion:updateId; reasons ≤120 chars; own worktree from origin/feature/one-ui-wp0.4; fake-clock tests, no fetch import. OPTIONAL: tri-state force failure (off/throw/hang); reload cap 2; watchdog block in diag report | All REQUIRED + OPTIONAL 8, 10 adopted (9 done in #4799) |
| 2026-10-02 13:50 | #4799 two consecutive Codex rejections (mandatory) + #4811 reviewer kill-loop finding | A: fix-forward in #4811; #4811 DELETES #4799's reload cap/static screen (watchdog strike → native is the one recovery path); unresolved `attempting` without `backgrounded` marker = strike `abandoned-before-ready`; ready save awaited + 1 retry; flag flip launch-time only (doc); native flash deferred to S4. Landing: don't merge #4799 until #4811 has reviewer+Codex approval, then both in one pass | Adopted all; PM added (Codex #4811 r1): serialized in-order record writes + monotonic state (ready can't erase a strike), recheck wantsDom before mount; #4799 MAP.md row carried in #4811 |
| 2026-10-02 14:00 | #4811 two consecutive Codex rejections (mandatory): bg→active→kill race | B: `abandonedStreak` (2 abandons = strike 'abandoned-repeated'), reset on ready/strike/fallback; reviewer Low 1 fix; header states bound (worst case 4 launches). Rejected A (unbounded hole) and C (same race). Land: executor → scoped reviewer → land; no Codex r3; reply on PR with the bound | Adopted as written; + Low 2 doc note |
| 2026-10-02 14:21 | #4815 two consecutive Codex rejections (mandatory): no-new-fetch only on transport failures | C: mapPool `stop()` (drain + failed=true) called in a `finally` around the consume loop; contract = no new launches after any decisive failure, ≤cap−1 in-flight discarded; gated-promise launch-count test. Rejected A (premise false: workers fetch ALL remaining files after a consumer-detected failure) and B (parse/validate depend on drop state; wider touch). Land: executor → scoped reviewer, no Codex r3 | Adopted; PM's A premise was wrong — recorded |
| 2026-10-02 14:30 | WP1.1c part-1 brief review | Split sound; part 1 = harness proof, NOT WP1.1 acceptance (G1 needs part 2). REQUIRED: never edit app.json (web platform changes fingerprint → store build/OTA cut-off) — env-gated app.config.js only if needed, prove fingerprint equal; entry via `main:"index"` + index.web.tsx, prove size-identical; updateSnapshots none + dispatch bootstrap to non-main ref; maxDiffPixels 200 not ratio; blank-page guard + fail on external requests; playwright container v1.63; wider path triggers; never required | All REQUIRED + OPTIONAL 8, 9 adopted; executor launched |
| 2026-10-02 14:31 | WP0.5 brief review | Approve with edits. REQUIRED: dynamic-import screens after snapshot fill (module-level constants freeze); resolver on resolved absolute path, web+apps/web scoped; force react/react-dom/jsx-runtime/scheduler singletons; bundle-has-no-baked-content proof as committed script in 0.5b; tests travel with code (fold 0.5c); persistence probe on PRODUCTION export, IndexedDB+localStorage, adapter `kind` tag, fallback not built now; automated placeholder-image counts per host; diag snapshot hash = CI equivalence hash. OPTIONAL: keep no-referrer (+doc), grep SDK57 dom-webview for nonPersistent, tsconfig paths | All REQUIRED + OPTIONAL 9–11 adopted; brief rewritten (scratch brief-wp05.md); 0.5a launched |
| 2026-10-02 14:34 | Android DOM webview has no web storage (domStorageEnabled unset) — 0.5b persistence design fork | B: webview read-only over the native disk cache via file:// (fetch → XHR, status 0 ok); RN passes only cache URIs + version token (C6 holds; amend wording); iOS fallback = RN writes bundle.js read via <script src>; Map-backed localStorage shim before importing web code; probe records fetch/XHR/script/storage per platform. Rejected A (builds a second cache likely to fail) and C (no prop; native change, C3). No decisions.md entry | Adopted; brief amended (scratch brief-wp05.md) |
| 2026-10-02 14:53 | #4817 two consecutive Codex rejections (mandatory): newest-6 scan window | PM proposal + tweak: LIMIT 50 list, filter by row.gitCommitHash first, update:view only on matches; per-group view (cap 20) only as fallback; "None published" only if list < LIMIT or oldest createdAt predates commit time, else "lookup incomplete". Rejected EAS-run outputs (undocumented) and Codex r3. Land: scoped reviewer, merge | Adopted |
| 2026-10-02 16:14 | WP1.1c part-2 brief: structural-only a-vs-b deviation? | B: pixel a-vs-b NOW, font-normalised (shared @font-face override + fonts.ready), content-root screenshot, zero insets on (b); structural kept as 2nd blocking assertion (root-relative rects, role landmarks in order, ±2px/edge, NFC text); baselines threshold 0.3 / maxDiffPixelRatio 0.001; (b) baseline with real insets; colour negative fails a-vs-b; size budget | Adopted all; size budget already live (WP1.1a #4814), not duplicated. Brief = scratch `brief-wp11c-part2.md` (fresh PM: rebuild from this row). Launch after #4822 settles (stack on wp0.5b) |
| 2026-10-02 16:56 | #4822 two consecutive Codex rejections (mandatory): r2 P1a unmapped chunks/uncanonical map paths, P1b sentinel kinds + untested extractor, P2 ClownChat raw env() | Fix-forward, no DEBUG. Every .js needs a map (exit 1; named-chunk allowlist only, never skip); canonicalize sources; all 4 kinds required, missing current.json → exit 1 "run sync:content"; real-extractor fixture test; P2 → WP2.1 + explicit S4 check, no spike override. One commit → scoped reviewer, no Codex r3 | Adopted; told WP1.1c-2 executor: CI runs sync:content first + re-merge wp0.5b |
| 2026-10-02 17:02 | #4822 design fidelity (G0-evidence quality) | MERGE-WITH-EDITS: (1) describeSnapshot hash failure non-fatal (else false G0 negative); (2) show native-clock launch→ready beside webview firstPaintMs (else flatters DOM vs S2); (3) probe JSON exportable verbatim. **S4 checks:** store build + build id; persistence = 2 launches same bundle version then airplane kill, judge by `Marker` not `adapter`; CI equivalence hash beside each device hash; placeholder count = initial viewport only → human scrolls full stream + opens 3+ photo moments/era; 1 YouTube + 1 Spotify (null-origin refusal = G0 input, not bug); iOS memory: 2-min scroll + 10 moment opens + iPad split-view resize, no content-process strike; record `Read:` per platform (iOS xhr=fail → bundle.js fallback is WP0.6 scope); note system fonts / unoptimised images; + ClownChat expanded panel vs notch/gesture bar (Android) | Adopted all; (3) via RN core Share (no native dep). Final round + reviewer nits (regex `i`, decodeURIComponent) → scoped reviewer → APPROVED |
| 2026-10-02 19:00 | WP2.1 (A–D) + WP2.3 (A–F) brief review | Sound. REQUIRED 2.1: apiFetch = WP0.3b `ApiFetch` type (Response can't cross bridge); shared primitive types in packages/ui/src/host/types.ts; web adapter built in provider, stable Link/Image, no module singleton (WP2.2 gate); turnstileSiteKey `string\|null`. 2.3: A after 2.1-B; HandlerMap in A; C contract 3rd leg HostAdapter⇄payloads; D navigate semantic (in-DOM routing stays DOM); Expo-DOM transport isolated to 2 files (G0 guard). ClownChat → WP2.11 "F2" native-held cookie, per-endpoint `nativeSession`. Wait for G0: 2.3-D/E/F, 2.3-B step 4, 2.3-C step 3 | Adopted all + OPTIONAL (preload Inter/Playfair; next/image fill styles doc). Briefs now durable at docs/plans/one-ui/briefs/brief-wp21.md, brief-wp23.md. Launch after G1 lands + G1 Fable go/no-go |
| 2026-10-03 02:10 | **G1 go/no-go** (mandatory) + #4838 two consecutive Codex rejections | **G1 GO** for G2 limited to WP2.1 (all) + WP2.3 A, B-logic, C. Conditions: (1) parity becomes a REQUIRED check before the first WP2.4 slice branch (add an always-run job reporting success when paths untouched); (2) WP2.1 closes the /eras/*.png allowlist, no new entries; (3) no OTA baseline re-bump without a PROGRESS reason; (4) watch: WebKit parity flake with no code change ×2 → revisit comparator before required. #4838: fix-forward (strict string hash == GITHUB_SHA else skip; UUID regex), extract selection to scripts/release/select-android-build.mjs + vitest (no node -e on inline YAML); scoped reviewer, no Codex r3, land | Adopted all; WP2.1-A launched |
| 2026-10-03 02:20 | WP2.2 brief review (A, B, C1–C3, D) + may it run pre-G0? | Sound; **GO pre-G0** (zero-visual refactor, parity-guarded, per-PR revertible). REQUIRED: A O(1) lookups as functions not prebuilt Maps; flat-order audit doesn't block A; B browser perf mark ≤15 ms unthrottled (+4x report), type-guard narrowing, packages/ui/package.json in touch set; C required data param + *.server.ts with server-only; merge main bottom-up before every parity run, never re-baseline. Eager snapshot = §4 contract (no laziness; >15 ms → contract change via Fable). Order: A now ∥ 2.1-A; B after 2.1-A; C, D after B | Adopted all + OPTIONAL (C1–C3 each on B). WP2.2-A launched |
| 2026-10-03 02:44 | #4841 two consecutive Codex rejections (mandatory) | Fix-forward, land A. REQUIRED: no-restricted-syntax ImportExpression[source.type!='Literal'] + CallExpression[callee.name='require']:not([arguments.0.type='Literal']) with tests; remove data-swift2-ui from ReaderSpike (proof → per-host tests); fingerprint cited from CI run. Rejected Codex r3 + reverting the peer revert. Landing: scoped reviewer → merge A → retarget #4844 + 2.1-C | Adopted |
| 2026-10-03 05:13 | Wrong-call signal fired: DOM client + native host accept OBJECT envelopes (parseEnvelopeValue) | Acceptable as-is: real hazard was skipping size cap/shape checks; canonicalize re-serializes; Expo 'use dom' transport is already JSON; strings-only would double-encode. Keep native object branch. REQUIRED before G0 wiring: test pinning parseEnvelopeValue(obj) ≡ parseEnvelope(JSON.stringify(obj)) incl. __proto__ key + getter; >256 KB canonical rejected; if canonicalize ever throws in prod (circular) → reopen | Adopted; test PR launched (auto-merge) |
| 2026-10-03 04:36 | #4850 + #4855 second consecutive Codex rejections (mandatory) | A: boundary is a STRING → validators take raw string: length >256 KB → invalid (O(1)), JSON.parse in try, then shape-walk (no Proxy/getters possible); object entry points canonicalize = stringify→length→parse in try; isWebPath ASCII allow-list on raw input → decode ≤3 rounds to fixed point → segment checks. C: ready retry 250 ms×2 → cap 5 s, 6 attempts, then fatal + reject queued calls explicitly; **host returns hwm in ready ack → client reseeds max(now, hwm+1)** (B one-commit delta + reviewer on delta); inbox slice to 64 before parse, total cap 1,024 drop-oldest; BigInt NOT required — assert < MAX_SAFE_INTEGER → fatal. Landing A → B(+hwm) → C (C merges merged B before its reviewer). Wrong-call: any path delivering an object not a string | Adopted; A fix + B hwm delta launched; C after B |
| 2026-10-03 04:25 | #4849 + #4853 second consecutive Codex rejections (mandatory) | #4849 fix-forward: e2e/perf via the same testIgnore mechanism as parity + own config + dispatch-only report-only job; legacy search builder as test-only helper + committed regenerator + regen-equals-golden test (no runtime git show); exactly 28 queries; README ReaderSnapshotCore. #4853 **contract change**: monotonic per-DOM integer ids seeded from Date.now(); host high-water mark NOT reset by ready; reject id ≤ hwm; FIFO-per-channel assumption documented + tested (wrong-signal: rejected_monotonic telemetry); ready ≤3/10 s (4th fatal) + v/range checked; requests leave outbox on res; decisions.md entry before landing; #4850/#4855 updated same pass. Scoped reviewer, no Codex r3 | Adopted; both fix rounds launched; #4855 told new id rule |
| 2026-10-03 03:15 | #4849 web bundle +117 KB gzip (eager snapshot defeats MerchSection's lazy split) + perf gate statistic | **B**: CORE = eras, content, milestones, videos, theories, eraSecrets, tracks + eraStream, threads, trackGuide, searchIndex; EXTENSION = merch, songMoods only (videos/theories feed search → core). PR B: drop MERCH/SONG_MOODS from root baked-modules; fromBakedCore + pure attachExtensions; hashSnapshot throws on missing domains (never hash core-only); probe stays full → hashes unchanged. WP2.2-C: merch dynamic() chunk + mood-match read extensions via attachExtensions. Gate: median ≤15 ms over ≥10 fresh contexts, report p90 + max; 4x report-only. Wrong-call: a main-route accessor needing merch/songMoods → move it back to core, never a 3rd tier | Adopted; #4849 fix r1 launched |
| 2026-10-03 03:07 | #4843 two consecutive Codex rejections (mandatory): r2 sole P2 = purity walker misses import=require / import() / .tsx entrypoints | Fix-forward (gate hardening, not a shipped-graph defect); one failing fixture per form; scoped reviewer; land; retarget 2.2-B before deleting | Adopted; fix running |
| 2026-10-03 03:03 | WP2.4 first slice brief (shell + era stream; PRs 0, A, B, C, D) | Launch 0–C after edits; D held to G0 GO. PR0: pasted 1px-TopBar negative proof; captureRoot untouched. A split MOVE (A1) vs LOGIC (A2). **Binding move-only rule** for A1/B/C: renames via git diff -M50%, only import/export-path lines inside renamed files (pasted empty grep), non-rename non-shim non-test ≤400; 300-line rule waived, debt in READER-MOVE.md. D: no NotInAppYet — navigate(tabPath)+setMode(prev); **native screens present modally over a still-mounted SharedUiHost, never remount**; presentNativeRoute in dom-host-handlers.ts; native owns back during overlay; Codex mandatory on D | Adopted all (brief-wp24.md top block). PM: parity-gate required = branch protection → **HA #97** (owner); PR 0 launched now (captures only); A1 waits for #97 |
| 2026-10-02 | Confirmation pass | READY after 3 text edits: stale `[diag]` wording, §8/§9 order, PROGRESS/HUMAN-ACTIONS landing without `--delete-branch` | All applied |

## Decisions log (PM, reversible, one line each)

- 2026-10-02 — Plan calls C1–C6 (`PLAN.md`).
- 2026-10-02 — PM branch based on `origin/docs/one-ui-plan` (PR #4789, auto-merge set) because `main` didn't have PROGRESS.md yet; merge `origin/main` once #4789 lands.
- 2026-10-02 — **Owner directive (Joey, chat): "Leverage fable as much as you want to ensure this goes very well. And codex for reviews."** Applied as: (1) Codex adversarial review (`codex:rescue --background`, read via `codex-companion.mjs result`) on **every** WP PR, not only [codex] ones, alongside `reviewer`; (2) Fable reviews the brief before launch for every [codex]/native/architectural WP (0.3b, 0.4, 0.4b, 0.5, 1.1, 2.1, 2.2, 2.3) and does a final design-fidelity review of those PRs, plus the mandatory §4 triggers; (3) Fable sanity-checks any PM call that touches the proposal §4 design. The 3-concurrent-agent cap still holds, so reviews queue behind it.
- 2026-10-02 — WP0.3 over the 400-line tripwire (~490) accepted unsplit: one contract, splitting adds churn not safety. Fable added to WP0.3's final review (core §4 contract).
- 2026-10-02 — **WP0.0 acceptance changed by evidence:** 12 successful mobile-release runs: 5 waits 15–20 min, 7 waits 70–155 min (max 154.8, run 36859454944). PLAN's 60-min cap (and Fable's 34-min fix) would fail legit store builds incl. WP0.4's. Decision: wait 195 / job 225; URL persisted before the wait; split-cap + slow-wait investigation → follow-up issue. Supersedes Fable's numbers (evidence Fable didn't have), not its approach.
- 2026-10-02 — Play app-signing SHA-256 HA deferred until WP2.3 is near (the `.well-known` files must not ship before WP2.3; asking now isn't load-bearing).
- 2026-10-02 — WP0.1: App.tsx deviation accepted; missing paint/wiring marks go in the same PR (S1 needs launch-to-eras).
- 2026-10-02 17:35 — **Stacked PRs: never `--delete-branch` on a parent while children target it** — GitHub AUTO-CLOSES them (killed #4815; not reopenable → replacement PR from feature/one-ui-wp0.2b). Retarget children to main first, then delete the branch. OPERATING-MODE §5 Land step to be amended (grunt, docs PR).
- 2026-10-02 — Workers open PRs without auto-merge; the PM enables it after `reviewer` (+ Codex) passes, so nothing lands unreviewed.

## Log

- 2026-10-02 — Programme planned; awaiting kickoff.
- 2026-10-02 — Kickoff. PM worktree created; WP0.0, WP0.1, WP0.3 launched.
- 2026-10-02 — WP0.0 PR #4792 opened (yaml-lint pass); Codex review launched.
- 2026-10-02 — Fable reviewed 0.3b/0.4 briefs (12 required edits adopted). WP0.4 Stage 1 researcher launched. Codex round 1 on #4792: REQUEST CHANGES (fix queued; cap is 3 agents).
- 2026-10-02 — WP0.4 Stage 1 returned (matrix in Status row). WP0.0 round-1 fix sent to its executor.
- 2026-10-02 — WP0.0 fix pushed (no-wait start + persisted URL + wait-by-id; rollback 30 min); Codex round 2 job `task-muraaz8s-sdn7h0`. WP0.3 → #4794, Codex launched. WP0.1 → #4793, marks follow-up running. Fable signing WP0.4 matrix.
- 2026-10-02 — **Codex vs Fable disagreement (surface to Joey):** #4799 universal links. Codex P1: declaring app links with no URL intake lets an unverified Android link open the app on home. Fable (matrix sign-off): include now (C3, one native batch), harmless without .well-known. PM: keep — Android 12+ defaults to browser when unverified, test devices only (C5), WP2.3 adds intake + .well-known.
- 2026-10-02 — #4799 Codex P1 crash loop → sequencing: WP0.4b lands right after #4799 in the same freeze window; S3 pins the update containing WP0.4b; #4799 adds a reload cap of 2 + "don't use override without watchdog" doc note.
- 2026-10-02 — Codex jobs can stall silently: when checking a job, also check its log mtime (`~/.claude/plugins/data/codex-openai-codex/state/Swift2-*/jobs/<id>.log`); frozen >15 min = cancel and re-run.
- 2026-10-02 13:35 — **Owner directive (Joey, chat): device test sessions go in chat, not HUMAN-ACTIONS.md** ("For the first device test, just put it in chat… I will do it right away"). S1 given in chat 13:35; release run 37052010807 still in progress then — S1 self-gates on the panel existing; reports carry build + update id, so the WP0.2 researcher filters #4791 comments by update id instead of a pre-pinned one. Merge freeze still applies until Joey replies with S1 results.
- 2026-10-02 ~12:20 — PM handoff at ~50% context. G0 status: 0.0/0.1/0.3 merged; 0.3b approved+queued; 0.4 in review r2; 0.4b ready; S1 waiting on OTA.
- 2026-10-02 — #4789 (plan) merged; `origin/main` merged into the PM branch (PROGRESS conflict resolved to ours; main's copy was the unmodified original).
- 2026-10-02 — WP0.3b executor launched. Pending Codex jobs to read with `codex-companion.mjs result <id>`: `task-muraaz8s-sdn7h0` (#4792 round 2), `task-murabxyy-7mhaw0` (#4794 round 1).
- Queue for free slots: reviewer on #4792 (after Codex r2 clean) → auto-merge; reviewer + Fable on #4794 (after Codex); Codex + reviewer on #4793 (after marks); WP0.4 Stage 2 brief (after Fable signs matrix + #4792/#4793 merged).
