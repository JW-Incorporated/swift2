# One UI PROGRESS archive — superseded Next-actions history, 2026-10-02 (moved verbatim)

(Older checkpoint 2026-10-02 ~12:15 PDT, superseded.) Merged: WP0.0 #4792, WP0.3 #4794,
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
**14:23:** #4816 Codex r1 = REQUEST CHANGES (P1 memo aliases mutable objects
across sequential calls; P2 pin covers only schema.ts, not load.ts
name→schema mapping). PM: DROP the memo (clone defeats it, freeze risks
TypeErrors); move mapping to `validation-contract.ts`; pin hashes schema.ts +
validation-contract.ts + zod version. Fix round 1 sent to PR C executor.
**14:24:** #4815 fix r2 pushed HEAD 497698fe (stop()/drain, finally; suite
8113). PM accepted deviation: integrity-failure bound is cap+1 launches (the
freed worker launches one more before the loader judges) — bounded. Scoped
reviewer launched (landing gate, no Codex r3).
**14:24b:** #4815 scoped reviewer = **APPROVE** (cap+1 bound confirmed
finite; doc nit → executor fixing comment only). **#4815 APPROVED**, queued
post-S1 (retarget base → main after #4796 merges). Doc nit pushed bab13e49.
**14:25:** WP0.5 research stage launched early (read-only; slots free):
import graph/shims, data feed via fromBundle, CSS/fonts, in-webview
persistence, X2 images, native risk, PR split. Then PM brief → Fable brief
review (owner directive) → executor once #4799/#4811 land.
**14:26:** Owner (Joey, chat): "Keep working as much in parallel as
possible." PM: WP1.1c split — part 1 now (stacked on wp0.4b: parity entry +
web export + Playwright 4 projects on the test page + baseline compare +
negative spec + parity.yml), part 2 after WP0.5 (web fixture render (a),
a-vs-b, real routes). Fable brief review of part 1 launched. 3/3 slots.
**14:27:** #4816 fix r1 pushed HEAD 314d05db (memo removed; pin = schema.ts +
validation-contract.ts + zod version; merged B 497698fe, conflict resolved
keeping B's loop; suite 8121). Codex r2 `task-murh3zcn-5ny6a6` + reviewer r2
launched. A 2nd Codex reject → Fable.
**14:28:** #4816 reviewer r2 = APPROVE (Low: stale "in-session memo" test
comment — fold into next round). **#4814 MERGED 21:22Z** (WP1.1a done; size
gate live). Pre-landing check: #4813/#4799 CLEAN, #4811/#4815/#4816 mergeable
into their bases; **#4796 UNSTABLE — CodeQL fail** → researcher diagnosing
(real finding vs pre-existing vs tooling).
**14:29:** CodeQL on #4796 = new high `js/incomplete-sanitization` in TEST
helper apps/web/next-config.test.ts:11 (matches() escapes `/` not `\`); trusted
fixed input, no runtime exposure; Analyze jobs all passed (PR-diff gate). PM:
fix in code, not dismiss → grunt pushing a test-only commit to
feature/one-ui-wp0.3b. #4815/#4816 (stacked) will pick it up at landing.
**14:30:** WP0.5 research back: 73 web files in graph; only next/image (6) +
next/link (1) need stubs; no next/navigation/font/analytics/Supabase; baked
content modules install providers at import → must be shimmed (else baked
content ships); seam = exported set*Provider; injected async StorageAdapter →
IndexedDB adapter; file:// persistence unproven (CB-9008); no native need;
React 19 runs React-18 web code. PM draft brief = scratch `brief-wp05.md`
(fresh PM: rebuild from this row if missing): 3 stacked PRs on wp0.4b — 0.5a
Metro alias + next stubs + content shims; 0.5b ReaderSpike + IndexedDB +
bridge min + marks; 0.5c tests/docs. **Fable brief review launched.**
**14:31:** #4816 Codex r2 = "REQUEST CHANGES" with ONLY a P3: stale
"in-session memo" test comment (same as reviewer Low); no P1/P2, everything
else verified. PM call (reversible, recorded): treat as approve-with-nit —
not a §4 "failed review" (approach approved by both; comment-only) → no Fable.
Queue: PR C executor removes the stale comment (next free slot) → #4816
APPROVED, queued post-S1.
**14:32:** WP1.1c part 1 executor launched (`feature/one-ui-wp1.1c`, stacked
on wp0.4b). WP1.1 = PARTIAL until part 2 (Fable). PR C stale-comment fix
sent. #4796 CodeQL fix pushed aba7028f (test helper escapes all regex
metachars; 3 tests pass) — confirm CodeQL green before landing.
**14:33:** Fable reviewed WP0.5 brief (Fable log) → brief rewritten; **0.5a
executor launched** (`feature/one-ui-wp0.5a`, stacked on wp0.4b). #4816
stale comment fixed e47afbd0 → **#4816 APPROVED**, queued post-S1. Researcher
checking SDK57 dom-webview persistence (Fable optional 10).
**14:34:** Persistence check (source read): iOS loadFileURL read-access "/",
default persistent store → localStorage likely persists; **Android
domStorageEnabled never set (default false) → localStorage/IndexedDB likely
unavailable**; Android allowFileAccessFromFileURLs=true. Breaks the 0.5b
IndexedDB plan on Android + web reader localStorage uses. **Fable consulted
(judgment fork)**: PM leaning B = webview reads native disk cache via
file:// fetch (path + version token over bridge, C6 intact) + localStorage
shim. 0.5b brief on hold until ruling; 0.5a unaffected.
**14:36:** Fable → B (Fable log); 0.5b brief amended; 0.5b launches when 0.5a
PR is up (stacked). #4796 CodeQL now PASS. Researcher launched on WP1.1c part
2 render (a) (web build without secrets, equivalence-hash argument, determinism,
font gap until WP2.1).
**14:37:** 1.1c part-2 research: (a) = `npm run sync:content` → `npm run
build -w @swift2/web` → `next start` (secretless build already works in
build-full; Supabase degrades to empty; `/` + `/?item=<id>`); same-data claim
rests on the WP0.3 fromBaked==fromBundle hash (optional fixture-hash assert).
Determinism via Playwright only: stub /vault/live, abort analytics + external
hosts (same handler for (b)), clock.setFixedTime (not install — jump-scroll
loops), reducedMotion, caret/animations, addInitScript first-visit flags.
Fonts (5 next/font families) differ until WP2.1 → PM leaning: G1 gate =
structural a-vs-b (landmarks, text, layout boxes w/ tolerance) + per-side
pixel baselines; pixel a-vs-b deferred to WP2.1 (plan deviation → Fable in
part-2 brief review). Runtime est 10–15 min > 10 → parallel (a)/(b) jobs,
cache .next/cache. Part 2 brief written after WP0.5b lands.
**14:38:** Support task launched (CI-only, not frozen): release-train summary
gains per-job statuses + OTA update group id/runtime (lookup keyed to commit
SHA) so S-sessions can pin the update without an Expo login → branch
`feature/one-ui-release-summary`. Needs Codex + reviewer after.
**14:40:** → **#4817**. Reviewer r1 = REQUEST CHANGES (High: 5-min step cap
vs up to 8 × 90 s CLI calls → timeout kills the step red → Play submit
skipped; Lows: stale header arithmetic, docs omit that a mismatch skips
submit). PM decision: step becomes informational — `continue-on-error: true`,
total deadline (~200 s) skipping remaining lookups, incremental summary
writes; DROP the "SUCCESS but job failed" assertion (wait step already keys
on run status). Bundle with Codex r1 (relay job running).
**14:41:** #4817 Codex r1 = REQUEST CHANGES, same P1 (timeout). Fix round 1
sent. (Relay summarised rather than pasting companion output — on r2 read via
codex-companion result directly.)
**14:42:** WP0.5a → **#4818** (base wp0.4b; resolver.js web+apps/web scoped,
absolute-path match; next stubs; shims incl. theories (PM accepts deviation:
baked theories.ts self-installs a provider); singletons forced; suite 8146 —
one file failed once then green on rerun → reviewers to check flake;
fingerprint dcf1ea59 unchanged). Codex r1 launched; reviewer next slot; 0.5b
executor launches stacked on wp0.5a when a slot frees (critical path).
**14:43:** #4817 fix r1 pushed 200f3c71 (continue-on-error, assertion
dropped, 200 s budget / 25 s per call, incremental summary, sanitised cells).
→ Codex r2 + reviewer r2 queued. **0.5b executor launched**
(`feature/one-ui-wp0.5b`, stacked on wp0.5a). Queue for slots: #4818
reviewer, #4817 r2 reviews.
**14:46:** #4818 Codex r1 = REQUEST CHANGES (P1 next/dynamic in LongLive.tsx
unstubbed → stub it (React.lazy-based) + integration-resolution test; P2
parity test @ts-nocheck/runtime keys only → add compile-time export-shape
check). Bundle with reviewer r1 (running).
**14:48:** #4818 reviewer r1 = APPROVE (Lows: parity type gap; underWeb also
matches apps/web/node_modules; CI all green incl. build-full). Fix round 1
sent to 0.5a executor (next/dynamic stub + loud fail on other next/*;
compile-time parity check; comment). Then Codex r2 + reviewer r2. #4817 r2
reviews wait for a slot.
**14:50:** WP1.1c part 1 → **#4819** (base wp0.4b). No app.json change
(`EXPO_NO_WEB_SETUP=1`); main→"index" + index.web.tsx; fingerprint dcf1ea59
unchanged; .hbc names identical. PM spot-checked: bootstrap run 37068517032 =
failure (missing baselines — as designed), rerun 37068913846 = success.
Baselines committed 4c5ef187 (16 PNGs); runtime ~2 min. Side facts: base
(WP0.4 DOM www.bundle) is +11.6% over the size baseline → #4799 passes the
15% gate; bump baseline after #4799 lands. **S3 check to add:** WP0.4 test
page renders ~250 px wide in a 393 px iPhone viewport. Note: GITHUB_TOKEN
commits don't trigger pull_request runs → dispatch reruns by hand. Codex r2
on #4817 launched; #4819 reviews + #4817 reviewer r2 queued.
**14:51:** #4818 fix r1 pushed 42dc6852 (next/dynamic stub; other next/* from
apps/web on web THROW; parity.types.ts compile-time; suite 8152; fingerprint
unchanged). 0.5b told to merge it. Codex r2 on #4818 launched; reviewer r1 on
#4819 running. Still queued: Codex on #4819, reviewer r2 #4818 + #4817.
**14:52:** #4819 reviewer r1 = REQUEST CHANGES (minor): PR-head parity run
37068886288 = action_required (bot-authored baseline push) → no real PR run
on head; fingerprint proof for the `main` change not in docs/PR body. PM:
the fix-round push (non-bot) triggers a real PR run; add the dcf1ea59
before/after line. Bundle with Codex r1 on #4819 (next slot).
**14:53:** #4817 reviewer r2 = APPROVE (CI all green). Codex r2 = REQUEST
CHANGES (P2: only newest 6 groups scanned; EAS push trigger can publish ≥6
newer groups during the wait → false "None published") → 2nd consecutive →
**Fable (mandatory)**; PM proposal: scan ≤20 groups within budget, honest
"lookup incomplete" wording, scoped reviewer, no Codex r3. Codex r1 on #4819
running (job not in the Swift2 state dir — read via relay); #4818 r2 job
task-murhzvkg-7tilc6 "not found" in companion → relay agent will report.
**14:55:** #4817 fix r2 fc0bfa6b (LIMIT 50, hash filter first, honest
wording) → scoped reviewer APPROVE → **auto-merge SET** (CI-only, not frozen).
First real check of it = the next release-train run (post-S1 landing).
**14:56:** #4818 Codex r2 = APPROVE (no findings; throw surfaces in Metro;
next/dynamic named-export loader OK; parity.types.ts in CI typecheck). With
reviewer r1 APPROVE (Lows fixed) → **#4818 APPROVED**, queued post-S1
(stacked: lands after #4811). #4819 Codex r1 pending (relay will report).
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
