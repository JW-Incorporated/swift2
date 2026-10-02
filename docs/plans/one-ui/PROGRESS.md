# One UI programme: progress (the PM's memory)

The single source of live state for the PM. Rewrite the **Next actions**
block at every checkpoint; append to the **Log**; never let this file pass
~200 lines (fold old log lines into one summary line per finished phase).

## Next actions (for a fresh PM session)

(Checkpoint 2026-10-02 ~12:15 PDT.) Merged: WP0.0 #4792, WP0.3 #4794,
WP0.1 #4793. PM worktree `C:\Users\Fourtys\AppData\Local\Temp\one-ui-pm`.
**Merge freeze on apps/mobile/** + packages/** is ON** (S1 pending) — no
auto-merge on #4796 / #4799 until S1 closes.

**In flight (13:38 PDT session):** Codex r2 on #4799 = job
`task-murfe0gi-4nj6py` (reads wt-wp04 tree; read with `codex-companion.mjs
result`); `reviewer` r2 on #4799 **APPROVE** 13:40 (Low: MAP.md row for
`apps/mobile/lib/dom-host-handlers.ts` — bundle with Codex r2 fixes; CI
build/build-full green on 39a129b0, PM spot-checked; stale worktree
`rv-wp04` left — long-path remove failed, prune later); WP0.4b → **#4811**
opened 13:48 (base feature/one-ui-wp0.4, head 989e0aaa, no auto-merge; suite
8111 pass; fingerprint unchanged dcf1ea59 both sides; PM accepted watchdog
block panel-only — diag schema has no slot). Codex r1 on #4811 launched
(job id from the codex-rescue relay; check `/codex:status`) + `reviewer` r1
(diff-only, no worktree). PM concern for both: whole-app kill before ready
may read as "abandoned" not strike → possible loop. Fable final after.
**13:49:** #4799 Codex r2 = REQUEST CHANGES (P1 cap → static dead-end
screen, override can't be cleared in-app; P2 crashReloads never resets
after ready) → 2nd rejection → **Fable consulted (mandatory)**, options
A fix-forward in #4811 (PM leaning) / B fix #4799 too / C fold. #4811
Codex r1 = job `task-murfr9fb-knxeem`; #4811 reviewer r1 = REQUEST CHANGES
(HIGH kill-before-ready = abandoned → infinite loop, test :124 locks it;
MED ready-save fire-and-forget; LOW remote-flag flip doesn't unmount;
LOW native flash in pending) — forwarded to Fable. Plan: one combined fix
round after Fable + Codex #4811.
**13:51:** Codex #4811 r1 = REQUEST CHANGES (P1 kill-loop; P1 unordered
ready/strike writes; P2 wantsDom not rechecked; P3 RN-thread stall → covered
by abandoned rule). Fable ruled (Fable log). Combined fix round 1 sent to the
WP0.4b executor (items 1–9). NEXT: Codex r2 + reviewer r2 on #4811 → if both
approve, merge #4799 then #4811 in ONE pass after S1 closes (#4799 needs no
new round; its findings are resolved in #4811). A 2nd #4811 rejection → Fable.
**13:56:** #4811 fix r1 pushed, HEAD db051c61 (suite 8113 pass, fingerprint
dcf1ea59 unchanged, both exports OK). PM accepted ~557 non-test lines over
tripwire (one safety mechanism; WP0.3 precedent). Codex r2 + reviewer r2
(diff-only) launched on #4811. Codex r2 job `task-murg0wvd-tv2w1x`.
**13:57:** reviewer r2 #4811 = 3 Lows, non-blocking (PM: treat as approve-
with-nits). Bundle with Codex r2: (1) write backgrounded:true after
startAttempt if AppState not active; (2) doc note in dom-host.md: double
ready-save failure → one false strike (bounded); (3) hook-level test gap →
covered by S4 device check, no code.
**13:59:** Codex r2 #4811 = REQUEST CHANGES (P1: on return to active the
backgrounded:false clear isn't awaited → bg→active→kill race leaves stale
marker → abandoned, no strike → repeatable). 2nd consecutive rejection →
**Fable consulted (mandatory)**; PM leaning B = `abandonedStreak` cap (N
abandons = strike) + reviewer Low 1 fix + Low 2 doc, scoped reviewer, no
Codex r3.
**14:00:** Fable → B (Fable log). Fix round 2 sent to the WP0.4b executor.
NEXT: scoped `reviewer` on the fix-r2 diff only → if APPROVE, #4799 + #4811
are READY; land both in one pass when S1 closes (`gh pr merge 4799 --squash
--auto --delete-branch`, then retarget #4811 base to main + merge). No Codex
r3 on #4811.
**14:01:** release run 37052010807 = success (S1 OTA live); #4791 has 0
reports. Owner directive (Joey, 14:00): "run as much parallel work as makes
sense" → PM pulled forward two read-only research stages (reversible, no
merges): WP0.2 loader pre-analysis (ready to rank once [diag] lands) and
WP1.1 parity-harness research (build path, comparator, runtime). 3/3 slots.
**14:02:** WP0.2 pre-analysis back. Predicted #1 cost: NO in-flight dedupe —
3 EraSections each run a full loadBundle every launch (content-bundle.ts:50).
Then pure-JS sha256 per file (hash.ts; don't add expo-crypto = native), serial
file fetches (load.ts:433), double-stringify disk write; warm: 3× JSON.parse
+ zod safeParse per file. Partial-load apps never get a complete marker →
cold load every launch. Split (all JS-only): **A** in-flight dedupe (<150,
independent of #4796) · **B** parallel fetches (<200, after #4796) · **C**
warm short-circuit + memo + single encode/write (<250, after #4796) · **D**
only if [diag] says so. PM call: build A now (merge waits for freeze anyway;
S1 measures the old build) → executor `feature/one-ui-wp0.2a` launched.
B/C wait for #4796 to merge. S2 measures after A–C.
**14:03:** WP1.1 research back. Recipe: `expo export --platform web` of a
harness entry ('use dom' renders as-is on web; reuses WP0.4 Metro/Tailwind) —
unproven; Playwright 1.63 descriptors Pixel 7 / iPhone 15 / iPad Pro 11 (+
landscape); toHaveScreenshot (threshold ~0.2, maxDiffPixelRatio ~0.002) for
baselines + pixelmatch includeAA:false for a-vs-b; negative spec (4px shift +
colour) and blur-passes case; Linux-only baselines + manual update workflow;
clock/reducedMotion/page.route stubs; fonts must match (WP2.1 recapture);
size check = sum dist JS + www.bundle vs committed baseline, +15% fails;
est. 6–8 min. PM calls: gate on BOTH a-vs-b and baseline; routes = WP0.5
spike routes (a-vs-b hollow until then); split **1.1a** OTA size check (now,
next free slot) · **1.1b** web-export spike (scratch, launched 14:03) ·
**1.1c** harness (after WP0.5; Fable brief review first). Open: apps/web
needs a fixture mode for (a) — resolve in 1.1c brief.
**14:04:** #4811 fix r2 pushed HEAD 31400300 (abandonedStreak; suite 8116;
fingerprint unchanged; bound comment posted). NEXT (queued, slots full):
scoped `reviewer` on the fix-r2 diff only. Joey 14:02: "nothing has changed
on the android app" — expected visually (panel is hidden), BUT run
37052010807 has only a `trigger` job → researcher verifying the Android OTA
actually published + runtime matches the installed build.
**14:05:** WP1.1b spike = WORKS (primary path, no fallback). Recipe: entry
`apps/mobile/parity-entry/index.tsx` (15 lines: mounts SharedUiTest, stub
onReady→window.__ready, `?inset=` → --safe-* vars, registerRootComponent);
app.json `platforms += web`, `web:{bundler:metro,output:single}`; entry via
package.json main (CI: find a non-edit way); `npx expo export --platform web
--output-dir dist-parity` (26 s; 371 KB JS + 43 KB CSS); static serve;
Chromium + WebKit pass: Tailwind, font, --safe-top, onReady, --era-* switch,
Radix portal, no console errors. PM spot-checked 4 screenshots exist
(scratch `sp-wp11b/shots`). Untested on Linux CI; real DOM entry must stay
free of native-only imports for web export. Scoped reviewer on #4811 fix r2
launched (landing gate).
**14:06:** Android OTA check: run 37052010807 → EAS workflow; fingerprint
matched existing builds (no store build), "Publish OTA (both platforms, one
group)" ran on branch/channel `production`; green. Installed Android build =
EAS 86b6c887 (from 98a99c65, Play internal, 2026-10-01 23:47Z). Group id not
visible (no EXPO_TOKEN here) — Expo dashboard jw-labs/swift2-vault. Panel
unlock reachable (SettingsAboutSection.tsx). Gave Joey exact relaunch steps.
Watch item: the trigger's wait ended while the publish job was still in
COMPLETE_JOB — check whether the WP0.0 wait can report success before the
final EAS job finishes (follow-up if so).
**14:07:** #4811 scoped reviewer = **APPROVE** (hand-traced 4-launch bound;
mixed streak fail-closed; Low: "ready resets" test doesn't seed a streak —
non-blocking). Fable's two rulings stand as its design review. **#4799 +
#4811 READY** — land in one pass when S1 closes, once #4811 build-full is
green: `gh pr merge 4799 --squash --auto --delete-branch`; after it merges,
`gh pr edit 4811 --base main` (+ merge main if needed) then `gh pr merge 4811
--squash --auto --delete-branch`. Launched: WP1.1a size-check executor
(`feature/one-ui-wp1.1a`, CI/scripts only, not frozen) + researcher on the
WP0.0 wait-timing question.
**14:07:** wait-timing = NO defect (wait polls run status; publish-job
"In progress" line was a stale table snapshot; a failed job → exit 11, red).
Optional later: post-wait `workflow:status --json` per-job summary (would
also surface the update group id) — not scheduled. WP0.2 PR A → **#4813**
(+55/-1, head 0f1c0f23, suite 8090 pass, fingerprint unchanged 49a1159e,
no bypassing callers). Codex r1 + reviewer r1 launched. Merge waits for S1.
**14:08:** #4813 reviewer r1 = APPROVE (Low: doc-comment that the shared
LoadedBundle must not be mutated). Codex r1 `task-murgdpv0-bxq2dx` pending.
WP0.2 PR B (parallel fetches, cap 5, manifest-order validation) executor
launched STACKED on feature/one-ui-wp0.3b (#4796) → branch
`feature/one-ui-wp0.2b`. PR C waits for B.
**14:09:** #4813 Codex r1 = APPROVE (no findings; callers read-only, cold/warm
label still accurate) → reviewer Low doc note dropped (PM). **#4813 APPROVED,
queued for the post-S1 landing.** Post-S1 landing pass (in order): #4796,
#4813 (both main-based; merge main into each if behind), #4799, then #4811
(retarget base → main). Then PR B (retarget → main after #4796).
**14:11:** WP1.1a → **#4814** (size-check script, baseline ios 4,009,136 /
android 4,021,701 B from 58242111; ci.yml exports → dist-ios/dist-android;
suite 8092 pass; negative run exit 1). NOT frozen (CI/scripts only) → can
auto-merge once Codex + reviewer pass. Interaction: #4799's DOM assets add
size → bump baseline with `--update` in #4799's wake (or in #4799 if it
trips >15%). Codex r1 + reviewer r1 launched. Codex job `task-murgketx-ycdgoc`.
**14:12:** #4814 reviewer r1 = REQUEST CHANGES (minor): Med — check runs only
in build-full, not build-content → PM: doc note in docs/mobile-release.md
(content reaches the app via the runtime D1 bundle, not the OTA; no extra
export on content CI = Actions minutes); Low — add `dist-*/` to
apps/mobile/.gitignore (PM accepts; not shipped by OTA, freeze n/a). Bundle
with Codex r1.
**14:13:** WP0.2 PR B → **#4815** (base feature/one-ui-wp0.3b, head c4d37653,
+210/-6; pool.ts mapPool cap 5; manifest-order validation; suite 8108;
fingerprint unchanged 71afa3f3). Codex r1 + reviewer r1 launched. PR C
(warm short-circuit via schema fingerprint, memo by bundleVersion, single
encode + single files write) executor launched STACKED on wp0.2b →
`feature/one-ui-wp0.2c`. Post-S1 landing adds: #4815 (retarget → main after
#4796) then PR C.
**14:14:** #4815 reviewer r1 = APPROVE (Lows: up to 5 in-flight bodies held
after an integrity fail — accepted; dead `!settled` guard; 5 ms timer in
test 3 may flake). Codex r1 job `task-murglwtp-mbz069` pending.
**14:15:** #4815 Codex r1 = REQUEST CHANGES (P1: mapPool awaits all in-flight
after a failure → a hung later fetch blocks fallback forever; P3 test). Fix
round 1 sent to the PR B executor (finish as soon as manifest-order outcome is
decisive; discard later in-flight; + reviewer Lows). Then Codex r2 + reviewer.
PR C (stacked) will need to merge the fixed B.
**14:16:** #4814 Codex r1 = REQUEST CHANGES (P1 content-only PRs skip the
check though seed regenerates lenses.generated.ts into the bundle; P2 export
total ≠ exact re-download payload). PM: P1 → add exports + check to
build-content (supersedes 14:12 doc-note call; repo public → minutes free);
P2 → wording only (export total is the plan's proxy; bundle always
re-downloads); + dist-*/ gitignore. Fix round 1 sent to the WP1.1a executor.
**14:17:** #4814 fix r1 pushed HEAD 90de8426 (build-content now runs
sync:content + exports + check). Codex r2 launched; reviewer r2 next slot.
Last round (cap 2): a reject → Fable. Codex r2 job `task-murgrk7u-v20kab`;
reviewer r2 launched.
**14:18:** #4815 fix r1 pushed HEAD e4772afe (per-item never-reject promises,
stop at first decisive manifest-order failure; suite 8111). Residuals
accepted: earlier-file hang still blocks (as before); no abort signal.
Codex r2 launched; reviewer r2 next slot. PR C told to merge fixed B.
**14:18b:** #4814 reviewer r2 = APPROVE (Low: duplicated export steps in two
jobs). Land #4814 when Codex r2 approves + build-full green (CI-only, not
frozen; `gh pr merge 4814 --squash --auto --delete-branch`). #4815 Codex r2
job `task-murgs6mn-xqyx7t`; reviewer r2 launched.
**14:19:** #4814 Codex r2 = APPROVE (no findings; build aggregator still
waits on build-content) → **auto-merge SET** on #4814 (lands when build-full
green). #4815 reviewer r2 = APPROVE (Low: abandoned fetch leaves no
endDownload mark — harmless). #4815 Codex r2 pending.
**14:20:** #4815 Codex r2 = REQUEST CHANGES (P1: "no new fetches after
failure" holds only for transport/HTTP; integrity/parse/validate failures are
detected after the worker already launched file 5+; P2 tests don't assert
launch counts). 2nd consecutive rejection → **Fable consulted (mandatory)**;
PM leaning A = amend contract (≤cap extra discarded fetches) + launch-count
test + scoped reviewer, no Codex r3.
**14:21:** WP0.2 PR C → **#4816** (base feature/one-ui-wp0.2b; merged B fix
e4772afe; warm-cache.ts SCHEMA_FINGERPRINT hand-bumped, test pins sha256 of
schema.ts (#4800); memo per adapter+baseUrl+bundleVersion; single encode +
single blob write; suite 8121; fingerprint 71afa3f3 = base). Codex r1 +
reviewer r1 launched. Codex job `task-murgw4db-4c1ixu`.
**14:22:** Fable → C on #4815 (Fable log); fix round 2 sent to PR B executor;
then scoped reviewer, no Codex r3. #4816 reviewer r1 = APPROVE (Lows: memo
hit doesn't re-check complete marker / comment overclaims; fingerprint ignores
zod version — PM: zod is JS so it DOES ship by OTA → include zod version in
the fingerprint or the pin test). Bundle with Codex r1; #4816 must also merge
B's fix r2.
Old executor note: WP0.4b executor
(worktree `wt-wp04b` under this session's scratchpad
`71ba59ae-…/scratchpad`, branch `feature/one-ui-wp0.4b`). If a fresh PM
finds these unreported: check `gh pr list --head feature/one-ui-wp0.4b`
and the Codex job before relaunching. S1 is with Joey in chat (release run
37052010807 still in progress at 13:38).

1. **S1:** when release-train run 37052010807 (#4793 merge f27698a4)
   completes, have a researcher pull the OTA update id / group, runtime and
   store build numbers from its summary/logs; then file HA session S1 via
   the `human-actions` skill (PLAN §WP0.1 "Then": Android + iPad 5 cold +
   5 warm launches each, "Send report" after each; iPhone same "for Joey to
   coordinate"; pin build + update id; unlock = tap Settings version label
   7×; reports land on #4791). Land HUMAN-ACTIONS on main via a docs-only
   PR from this branch (`--squash --auto`, no `--delete-branch`), then
   `git merge origin/main` here. Tell Joey. If the run is red/hung → researcher
   diagnoses (`mobile-release.yml` now caps wait 195 / job 235).
2. **#4796 (WP0.3b):** APPROVED, queued. When S1 closes: `gh pr merge 4796
   --squash --auto --delete-branch` (may need a merge of main first).
3. **#4799 (WP0.4):** round-1 fix PUSHED (39a129b0: reload cap 2 via pure
   `lib/dom-host-handlers.ts`, docs notes, focused tests, both reviewer nits;
   fingerprint still 3603a03f…; suite 8095 pass). NEXT: Codex **round 2**
   (`codex:rescue --background`; tell it to read the branch from a worktree
   on disk — its sandbox can't `git fetch`; read via `codex-companion.mjs
   result <id>`; check log mtime for stalls) + `reviewer`. A 2nd rejection
   → Fable (mandatory). Land only after S1 closes; merge = store builds.
4. **WP0.4b** (watchdog) — READY TO LAUNCH NOW (nothing in flight):
   brief = this file's Fable-log row "WP0.4b brief review" (all REQUIRED +
   OPTIONAL 8, 10) on top of PLAN §WP0.4b. Executor worktree:
   `git worktree add -b feature/one-ui-wp0.4b <Temp path> origin/feature/one-ui-wp0.4`;
   PR base = `feature/one-ui-wp0.4`. Then Codex + reviewer (+ Fable final,
   per owner directive). Must land right after #4799 in the same freeze
   window; S3 pins the update containing it.
6. Handoff note: no agents or Codex jobs were in flight at the
   2026-10-02 ~12:20 handoff. Old session worktrees under the previous
   session's scratchpad (`wt-wp00/01/03/03b/04`, `wt-wp04-base`) may be
   gone; always start fresh worktrees from `origin/<branch>`.
5. **WP0.2** waits on S1 reports (researcher turns `[diag]` comments on
   #4791 into a ranked cost table first).

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
| 2026-10-02 | Confirmation pass | READY after 3 text edits: stale `[diag]` wording, §8/§9 order, PROGRESS/HUMAN-ACTIONS landing without `--delete-branch` | All applied |

## Decisions log (PM, reversible, one line each)

- 2026-10-02 — Plan calls C1–C6 (`PLAN.md`).
- 2026-10-02 — PM branch based on `origin/docs/one-ui-plan` (PR #4789, auto-merge set) because `main` didn't have PROGRESS.md yet; merge `origin/main` once #4789 lands.
- 2026-10-02 — **Owner directive (Joey, chat): "Leverage fable as much as you want to ensure this goes very well. And codex for reviews."** Applied as: (1) Codex adversarial review (`codex:rescue --background`, read via `codex-companion.mjs result`) on **every** WP PR, not only [codex] ones, alongside `reviewer`; (2) Fable reviews the brief before launch for every [codex]/native/architectural WP (0.3b, 0.4, 0.4b, 0.5, 1.1, 2.1, 2.2, 2.3) and does a final design-fidelity review of those PRs, plus the mandatory §4 triggers; (3) Fable sanity-checks any PM call that touches the proposal §4 design. The 3-concurrent-agent cap still holds, so reviews queue behind it.
- 2026-10-02 — WP0.3 over the 400-line tripwire (~490) accepted unsplit: one contract, splitting adds churn not safety. Fable added to WP0.3's final review (core §4 contract).
- 2026-10-02 — **WP0.0 acceptance changed by evidence:** 12 successful mobile-release runs: 5 waits 15–20 min, 7 waits 70–155 min (max 154.8, run 36859454944). PLAN's 60-min cap (and Fable's 34-min fix) would fail legit store builds incl. WP0.4's. Decision: wait 195 / job 225; URL persisted before the wait; split-cap + slow-wait investigation → follow-up issue. Supersedes Fable's numbers (evidence Fable didn't have), not its approach.
- 2026-10-02 — Play app-signing SHA-256 HA deferred until WP2.3 is near (the `.well-known` files must not ship before WP2.3; asking now isn't load-bearing).
- 2026-10-02 — WP0.1: App.tsx deviation accepted; missing paint/wiring marks go in the same PR (S1 needs launch-to-eras).
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
