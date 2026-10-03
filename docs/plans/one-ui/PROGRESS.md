# One UI programme: progress (the PM's memory)

The single source of live state for the PM. Rewrite the **Next actions**
block at every checkpoint; append to the **Log**; never let this file pass
~200 lines (fold old log lines into one summary line per finished phase).

## Next actions (for a fresh PM session)

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
