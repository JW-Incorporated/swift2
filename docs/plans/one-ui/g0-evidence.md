> PM corrections (2026-10-03 05:38): Android build 18 (0a1ef202) WAS submitted to Google Play internal at 11:43Z (train run 37120205359, submission 8696849e) - S2 on Android is unblocked. Font OTA figures are cumulative, not conflicting: +4.4% (latin, #4847 r0) then +3.3% (latin-ext in DOM, #4847 r1).

# G0 evidence pack (WP0.6 input), compiled 2026-10-03

Sources: PLAN.md (P:n = line), PROGRESS.md (PG:n = line), proposal
docs/proposals/2026-10-02-one-ui-three-surfaces.md (PR:n), docs/one-ui/wp0.5.md, dom-host.md,
decisions.md 2026-10-02/10-03, gh issue view 4791. "Fable log" = PG:660-694.

## 1. What G0 must decide, and the PLAN-required inputs
- WP0.6 (P:256-261), PM + Fable mandatory. Decide: proceed on Expo DOM, or switch to the fallback
  mount (static packages/ui build in one react-native-webview, P:224-226); adjust budgets if evidence
  warrants, with reasons. Output: G1-G5 milestone estimate in PROGRESS.md + comment on #4788.
  Proposal gate 0e: estimate "from what a-d actually took" (PR:153-165).
- Required inputs (P:257): S2 numbers (P:129: Android cold launch to eras <= 2.5 s worst of 5, warm
  <= 1 s; same on iPad/iPhone), S4 numbers + checklist (P:244-254), WP0.3/0.4/0.5 reports.
  P:254: a researcher compares the spike against the S2 native numbers.
- Budgets (PR:173-176): cold -> era content <= 2.5 s p95; warm <= 1 s p95; scroll <= 5% dropped frames;
  era switch <= 150 ms p95; memory <= 300 MB; OTA size + bandwidth forecast at 10k MAU. CI OTA budget:
  fail > 15% growth over stored baseline (P:282).
- Assumptions G0 tests (PR:233-239): Expo DOM on SDK 57 runs Tailwind v4 + Radix; in-webview loader
  meets budget vs native baseline.
- Work already held to G0 GO: WP2.3 D/E/F, 2.3-B step 4, 2.3-C step 3, WP2.4-D (PG:32, 684, 693).

## 2. Evidence already in hand
- S1 native baseline, n=2, Android Pixel 10 Pro / Android 16 / build 1.0.0(17), both WARM: load-total
  1564 / 2387 ms (target <= 1000); pointer 1018/1472 (~63% of load-total); manifest 488/854. Reports
  predate WP0.1b: every at: = 600000, point marks 0.0, so launch -> first-era is UNMEASURABLE
  (#4791 has 2 comments; PG:132-135). No cold, no iPad/iPhone. Owner closed S1 "at risk" (PG:112).
  Offsets fixed by #4833 (T0 at collector creation), merged (PG:140, 208). WP0.2 loader fixes merged
  (#4813, #4829/#4816) but no cost table / "WP0.2 D" decision exists (PG:134).
- Snapshot build perf (Playwright Chromium on CI, prod build + fixture, 12 fresh contexts x3):
  fromBakedCore median 12.55/12.75/12.60 ms, p90 24.0/13.6/12.9, max 24.6/14.1/13.4; gate (median
  <= 15 ms, Fable 03:15) PASSES. 4x CPU throttle median 58-76 ms (report-only, G3). Full fromBaked
  ~23 ms (PG:380-384, #4849). Not a device number.
- OTA size (baseline scripts/parity/size-check.mjs): +11.6/11.7% from WP0.4 native batch (baseline
  bump #4831); +61% from WP0.5b ReaderSpike (pulls web reader into DOM bundle; accepted for spike,
  flagged "G0 input", PG:191-194). WP2.1-C fonts: 238,776 B woff2 / 321,939 B base64 = +322 KB (+4.4% (inconsistent — recompute at G0 from the live OTA))
  at PG:285-287; later restated "+247 KB ~ +3.3% (inconsistent — recompute at G0 from the live OTA)" (latin-ext, PG ~405-426) - recheck live baseline.
  Fable cond. 3: no re-bump without a PROGRESS reason (PG:685). 10k-MAU bandwidth forecast: not found.
- Web bundle: eager snapshot cost +117 KB gzip on main routes; core/extension split took -65 KB
  back; remainder accepted as inherent (PG:375-377, 691).
- Fonts: DOM export drops url()/imported woff2 (404); data-URI @font-face works (spike 02:26,
  PG:243-249). Ruling C: one generator, web url()+preload, DOM data-URI, same bytes (hash test).
  ReaderSpike itself uses system fonts (wp0.5.md "Not built").
- Persistence: Android DOM webview has no web storage. Ruling B (Fable 14:34, PG:679): webview reads
  the native disk cache via file:// (fetch then XHR; XHR status 0 OK); RN passes only cache URI +
  version token (C6 amended). iOS bundle.js/script-src fallback is PROBE-ONLY, built only if S4
  shows iOS fetch+XHR both fail (wp0.5.md). Map-backed localStorage shim loads first.
- Watchdog (WP0.4b #4811 merged): pure decideMount; attempt write awaited before render; 10 s
  ready timeout (paused backgrounded); strike 1 -> native this launch; strike 2 -> clear override, next
  launch native; <= 4 launches to fallback; terminate/renderGone/DOM error count; forced failure
  off/throw/hang (dom-host.md; Fable log 10-02 13:50, 14:00). Flag flip evaluated at launch only.
- Bridge (WP2.3 A #4850 / B #4853 / C #4855 still OPEN per PG:18-20): envelope
  {v,id,kind,type,payload,ts}; boundary is a STRING (Fable 04:36); monotonic per-DOM integer ids seeded
  from Date.now(), host high-water mark survives ready, ids <= hwm rejected, ready-ack returns hwm
  (decisions.md 2026-10-03); ready <= 3/10 s; 8 s default timeout; object envelopes canonicalized
  (Fable 05:13). Expo-DOM transport confined to 2 files (G0 guard, PG:684).
- Native batch (WP0.4 #4799): matrix signed; fingerprint 71afa3f3 -> 3603a03f; DOM-only edit leaves
  fingerprint unchanged (OTA proof); main now 473eab6c. expo-doctor: dup react-dom 18.3.1/19.2.3
  (Metro singleton pins) (dom-host.md).
- G1: Fable GO 10-03 02:10 limited to WP2.1 + WP2.3 A/B-logic/C; WP2.2 GO pre-G0. Parity green on
  main (run 37090052458). Chromium+WebKit render of the DOM entry works in CI.
- Release train: red since #4799 (iOS profile lacks Associated Domains; HA #96 open). #4838/#4846/
  #4854 decoupled Android; build 0a1ef202 "submitted on next train" (PG:27-31). gh run list on
  10-03 12:14-12:35Z: 3 failures + 1 in progress. Play-internal arrival of an Android build UNCONFIRMED.

## 3. Evidence STILL MISSING and what produces it
| Gap | Produced by |
|---|---|
| S2 Android cold (5) + warm (5), real offsets | Joey in chat on Play-internal build including #4833; [diag] to #4791 |
| S2 iPad / iPhone (baseline + loader fix) | Blocked on HA #96 (iOS store build) + TestFlight invite |
| WP0.2 cost table / D decision | Researcher over valid S2 reports |
| S4 spike: webview first-paint vs native launch->ready (two clocks), 5 cold + 5 warm per device | S4 chat session on a DOM-enabled store build; panel "Share probe JSON" |
| Persistence: 2 launches same bundle version, then airplane kill-relaunch; judge by Marker not adapter; record Read: per platform (iOS xhr=fail -> bundle.js fallback is WP0.6 scope) | S4 |
| Forced failure -> native, airplane mode; native flash while gate pending | S4 |
| Real photos (X2): scroll full stream, open 3+ photo moments per era (auto count = initial viewport only) | S4 |
| Embeds: 1 YouTube + 1 Spotify; null-origin refusal is a G0 input | S4 |
| iOS memory: 2-min scroll + 10 moment opens + iPad split-view resize, no content-process strike; iPad portrait/landscape/split | S4 |
| Fonts: data-URI faces loaded on iOS+Android, no FOUT before onReady, variable weights, 360 KB CSS vs cold start | S4 (PG:247-249) |
| Era art offline (12 PNGs ~21 MB via resolveUrl, #4851) | S4 airplane relaunch |
| ClownChat expanded panel vs notch/gesture bar (raw env()) | S4 Android + iPhone |
| Look side by side; Tailwind v4/Radix on device; WP0.4 test page ~250 px wide in 393 px viewport | S3/S4 |
| 10k-MAU bandwidth forecast; live OTA delta vs baseline | Researcher (not done) |
| Memory <= 300 MB, dropped frames, era-switch p95 | G3/S7 (S4 only a red-flag screen) |
| Proposal names Pixel 6a / iPhone 12; real devices differ (Pixel 10 Pro etc.) | Decision to record in WP0.6 |

## 4. Draft decision table
| Signal | GO on Expo DOM | NO-GO / fallback trigger |
|---|---|---|
| Cold launch -> first era, spike vs S2 native, worst of 5 | <= 2.5 s and not materially worse than native S2 | > 2.5 s with no profiled path, or well above native |
| Warm launch | <= 1 s, but native S1 warm is already 1.56-2.39 s (n=2): rebase budget if S2 confirms | DOM warm far worse than native |
| Persistence | airplane kill-relaunch shows content on Android + iOS | iOS fetch AND xhr fail -> build bundle.js fallback (still Expo DOM, JS-only); that also fails -> fallback mount |
| Process stability | no content-process strike in iOS scroll/split view | repeated terminations / blank WKWebView (expo#46374) |
| Watchdog | forced failure falls back to native, offline | cannot be done on SDK 57 (explicit trigger, P:224-226) |
| Photos / embeds | real photos; YouTube + Spotify play | embeds refuse null origin with no host workaround; CDN placeholders (X2) |
| Fonts / look | matches site; data-URI fonts load both platforms | fonts fail on a platform |
| Memory | <= 300 MB | > 300 MB or OS kills |
| OTA size | within 15% rule or reason recorded | 10k-MAU bandwidth unacceptable (founder call) |
| Bridge | back handled/exit works; monotonic ids hold | ordering violations (rejected_monotonic) |
- Fallback mount would change (P:224-226): static packages/ui build in one react-native-webview 14.0.1
  (kept via install.exclude) instead of @expo/dom-webview. Unchanged: packages/ui, ReaderSnapshot,
  bridge protocol (transport in 2 files), watchdog logic, parity harness, fonts. Redo: apps/mobile/dom/**
  and 'use dom' entries, transport files, bundle delivery (OTA asset vs app-bundled), SharedUiHost,
  persistence read path. A new native module means a new store build (C3: Fable first).
- Budget adjustments to consider, with reasons: rebase warm target on measured S2; decide whether the
  OTA baseline resets when the spike alias is deleted (WP5.2).

## 5. Milestone skeleton G1-G5 (durations UNKNOWN unless stated)
- G1 DONE (harness, a11y, parity-gate always-run; Fable GO). Residual HA #97 (make parity-gate
  required) blocks WP2.4 A1.
- G2 (JS-only): merged 2.1 A,B,D, 2.2 A,B; open 2.1-C #4847, 2.2-C1/C2/C3 #4856-#4858, 2.3 A/B/C
  #4850/#4853/#4855; pending 2.2-D. Pre-G0 backlog roughly a night's work at current throughput.
  Held to G0 GO: 2.3 D/E/F, 2.4-D, slices 2.5-2.13 (each A1/A2/B/C move-only PRs + Codex + reviewer;
  no WP2.4 slice has landed, so per-slice time is UNKNOWN), 2.14. Device sessions S5 (after 2.4-2.7),
  S6 (after 2.8-2.13). Cap 5 workers; Codex queue can wedge.
- G3: S7 (10 cold + 10 warm per device, scroll, era switch) -> researcher p50/p95 vs S2 -> Fable
  go/no-go; fix loop unknown. Needs all G2 and valid S2 baseline.
- G4: S8 drill (airplane + mobile-rollback.yml on broken internal OTA). Needs 2.14.
- G5: WP5.1 (flag default true, store-kit.md), S9, Joey store forms/submit (#4729 steps 3,4,7), then
  WP5.2 after launch + 1 OTA cycle. App Review duration unknown.
- Critical path: HA #96 -> iOS S2/S4 -> G0 -> 2.3 D-F + 2.4-D -> 2.5-2.13 -> S5/S6 -> S7 -> S8 -> S9.
  Joey's device availability, not agent throughput, is the dominant unknown.

## S2/S4 results (2026-10-03 onward)

| Criterion | Platform | Evidence | Status | Link |
|---|---|---|---|---|
| S2 cold ≤2.5 s worst-of-5 | Android native | Pending | pending | |
| S2 cold ≤2.5 s worst-of-5 | Android shared-UI | Pending | pending | |
| S2 cold ≤2.5 s worst-of-5 | iPhone | Pending | pending | |
| S2 cold ≤2.5 s worst-of-5 | iPad | Pending | pending | |
| S2 warm ≤1 s worst-of-5 | Android native | Pending | pending | |
| S2 warm ≤1 s worst-of-5 | Android shared-UI | Pending | pending | |
| S2 warm ≤1 s worst-of-5 | iPhone | Pending | pending | |
| S2 warm ≤1 s worst-of-5 | iPad | Pending | pending | |
| S4 persistence airplane-mode relaunch | Android | Pending | pending | |
| S4 persistence airplane-mode relaunch | iOS | Pending | pending | |
| S4 stability no content-process strike | iOS | Pending | pending | |
| S4 stability no content-process strike | iPad | Pending | pending | |
| S4 watchdog forced failure → native offline | Android | Pending | pending | |
| S4 watchdog forced failure → native offline | iOS | Pending | pending | |
| S4 real photos + YouTube/Spotify embeds | All | Pending | pending | |
| S4 fonts no FOUT | All | Pending | pending | |
| ClownChat safe area | All | Pending | pending | |
| Diag hot-corner reachable | All | Pending | pending | #4877 |
| First visible image + T+10 s load | Shared-UI | Pending | pending | #4895 |
| OTA size within 15% rule | All | Pending | pending | |
| Spike not materially worse than S2 | All | Pending | pending | |

**Note:** S1 (n=2, warm only, broken offsets) and the 12:04 S2 run (all labelled warm, stale marks) are NOT valid baselines — superseded by Speed test mode (#4898). Score with `npm run one-ui:score-speed` (PR pending).

### S4 Android 2026-10-04

**Device:** Pixel 10 Pro, Android 16, gesture navigation, Play-internal build 1.0.0 (18), OTA update 01a10400-19de-7c8e-bc45-321d0e91143e.

**Speed test (npm run one-ui:score-speed):**
- **Native run 5ef3e6c1:** FAIL — worst cold 3183.8 ms (budget 2500), worst warm 222.1 ms (budget 1000), n 7 cold / 3 warm.
- **Shared-UI run 87324b0c:** INCOMPLETE by count only — worst cold 864.4 ms, worst warm 17.0 ms, n 6 cold / 4 warm (OS killed backgrounded app so one warm counted cold); PM treats as PASS-with-caveat.

**Native issues:** scroll lag ~0.5 s (#4895); post images missing ~half of launches → #4952 (bare RN Image burst, no onError); scorer image metric blind to it.

**Shared UI results:**
- Scrolling: perfect
- Images: loaded every launch
- Offline (airplane + wifi off): content shows
- Hot corner: TOP strip failed, BOTTOM worked (#4877 deep link not needed on Android)
- Layout: black band at top + sticky filter pills offset → #4953 (top inset double-applied, App.tsx SafeAreaView + DOM --safe-top)
- YouTube: error 153 → #4954 (null origin, no Referer; fix = https baseUrl + referrerPolicy, G0 input)
- Spotify: only SpotifyCompare in Taylor's Version thread remains, untested
- Track guide, bottom nav, era picker, ClownChat: not mounted in spike (expected pre-G0, wired WP2.4/2.7-D) → era art offline + ClownChat safe-area UNTESTED
- Loading state: "Loading..." placeholder flashes top-left on cold launch (ReaderSpike.tsx:176) — no true FOUT observed

**Watchdog:** Force DOM failure=throw offline → native fallback shown (PASS). Strike clears Force-shared-UI override by design; Reset watchdog + "off" persistence quirk → #4955 (diagnostics-only; real users not stuck).

**Probe JSON:** not captured ({} — shared from native fallback).

**iOS / iPad:** NOT TESTED — owner decision 2026-10-04 06:37 PDT: "Use the android info and apply it everywhere"; iOS/iPad deferred to the first post-G0 device session.

## Traps
- PROGRESS "Status" table (PG:634-650) is stale; trust the 04:43 checkpoint (PG:9-36).
- S1 is n=2, warm-only, broken offsets: not a valid cold baseline. Native warm already misses 1 s.
- 12.6 ms is Chromium CI, not a device figure.
- PLAN says 7 /api sites; research counts 9 fetches / 7-8 endpoints (PG:79-81).
- OTA percentages inconsistent across PROGRESS lines (+4.4% vs +3.3%); recheck live baseline.
