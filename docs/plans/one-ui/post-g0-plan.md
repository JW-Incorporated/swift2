> DRAFT 2026-10-03 14:08 PDT — pending Fable review; see PROGRESS.md for rulings.

# One UI: post-G0-GO execution plan (read-only research, 2026-10-03)

Basis: PM docs (PLAN, PROGRESS 13:40 addendum + Fable log, g0-evidence, briefs wp23/24/25-28/29-214) + `origin/main` @ 2737de28 (fetched; the main checkout is 31 commits behind and was never switched; all code reads via `git show origin/main:`). Open PRs that matter: #4923 (2.7-A2), #4925 (2.9-A2), #4926 (2.13-A2), #4929 (era perf r1b, #4895), #4930 (merch marquee CSP).
Legend: [pure] = apps/mobile/lib-only, e2e or docs; no edit to SharedUiHost.tsx, `dom/bridge/transport-expo.ts`, `dom/spike/**` or ReaderSpike (the Fable 12:28 pre-G0 line).

## 0. State of main that the plan relies on (verified)
- DONE web-side: all slice A1s; A2s merged for 2.4, 2.5 (#4924 `HostEnv.affiliate`), 2.11 (lore only), 2.12 (`HostAdapter.webPush?`), 2.13 A1/A1b. A2 not needed: 2.6, 2.8, 2.10.
- DONE pure native: bridge A/B/C (envelope, `createBridgeHost`, `createBridgeClient`, `transport-expo.ts` `useExpoBridge`), D1 `bridge-handlers-ui.ts` (+`createBackHandler`, insets/contentVersion emitters), E1 `bridge-handlers-notifications.ts` + `notification-tap-queue.ts`, F1 `bridge-handlers-api.ts` (+`ApiFetch` signal, `/vault/live` + share-PNG CORS, #4903), WP2.14 watchdog (#4867), `DiagHotCorner` (#4875, top+bottom strips, shared 7-tap counter).
- STILL RAW `fetch` inside packages/ui (must become `useHost().apiFetch` before the app works): `reader/merch/SubmitLinkForm.tsx:122` (/api/submit-link), `reader/clown/ClownChat.tsx:173` (/api/clown). FeedbackButton:159 is fixed by open #4926. `MoodChat` (/api/mood) is not moved at all (`apps/web/components/longlive/MoodChat.tsx:63`, still in the LongLive.tsx slot map).
- NOT existing yet: `presentNativeRoute`, `overlayFallback`, `nativeOverlayRoute`, `nativeSession`, `isMailtoUrl`, any `.well-known/*`, any `Linking` URL listener in App.tsx, `dom/slots`. SharedUiHost still uses `backTick` counters and ReaderSpike (181 lines) with `loadReader` from `dom/spike/reader-modules.ts` (still `require`s apps/web store/theme/EraStream/MomentDetail/BottomNav/host-adapter; those paths are now one-line shims into packages/ui).

## 1. HOLD work items (post-GO): files, TODO markers, dependencies

TODO(PM) markers on main (`git grep "TODO(PM"`): (a) `apps/mobile/dom/spike/reader-modules.ts:34` WP2.3-F; (b) `apps/mobile/lib/watchdog-gate.ts:10` WP2.4-D overlay clearing; (c) `watchdog-gate.ts:11` WP2.3-E tap queue; (d) `watchdog-gate.ts:12` WP2.3-B step 4 `watch.protocol`; (e) `apps/web/components/longlive/CurrentItemDetail.intake.test.tsx:54` WP2.3-F; (f) `docs/one-ui/dom-host.md:119-121` (same as b, c, d); (g) `packages/ui/HOST-ADAPTER.md:39` WP2.3-F. Non-TODO "after G0" text: `apps/mobile/lib/bridge-handlers-ui.ts:3` (D2) and the `dom/bridge/transport-expo.ts` header (not imported by ReaderSpike until G0, C step 3).

### H0 WP2.3-B4 + C3: bridge wiring, both sides, ONE PR
- Do: `createBridgeHost` per mount; `bridge` native action + `inbox` prop; `onProtocolFatal` -> `watch.protocol`; DOM side `useExpoBridge` in ReaderSpike (`sendReady`, `consumeInbox`).
- Files: apps/mobile/components/SharedUiHost.tsx, apps/mobile/dom/ReaderSpike.tsx, apps/mobile/lib/dom-host-handlers.ts (+test, `bridge(env)` forwarder), apps/mobile/dom/bridge/* glue, docs/one-ui/dom-host.md, MAP.md, comment-only edit of lib/watchdog-gate.ts.
- Resolves (d), part of (f), the transport-expo header. Needs: G0 GO and 0b-1 (composer).

### H1 WP2.3-D2: UI commands live
- Do: register bridge-handlers-ui with real deps (isNativeRoute from lib/routes.ts, Linking, RN Share, expo-haptics); hardware back via `createBackHandler`; insets + contentVersion emitters; DELETE `backTick` (SharedUiHost.tsx, ReaderSpike.tsx, dom/spike/back.ts + back.test.ts, reader-modules.ts Shell); `withFocusRestore`.
- Files: SharedUiHost.tsx, ReaderSpike.tsx, dom/spike/{back.ts,back.test.ts,reader-modules.ts}, dom/bridge/**, tests. Resolves bridge-handlers-ui.ts:3. Needs H0.

### H2 WP2.3-F2: api live
- Do: register `createHandlers({fetch: expo/fetch, baseUrl: apiBaseUrl})` (apps/mobile/lib/api-base.ts); DOM `apiFetch = client.call('api', {req}, {signal})` in the app adapter.
- Files: dom/bridge/app-adapter*.tsx (created in H4/D1) or dom/bridge/api-fetch.ts, composer, docs/one-ui/dom-host.md, packages/ui/HOST-ADAPTER.md, MAP.md, PLAN X1 count. Resolves (a), (e), (g). Needs H0.

### H3 WP2.3-E2: taps and notifications live
- Do: App.tsx tap block (~:303-317) enqueues `resp.notification.request.identifier` + `deepLink` into the tap queue; attach `navigateSink` when host ready, `detach` otherwise, native-navigation sink on fallback/quarantine; real NotificationHost deps (push-registration, prefs-client, permissions).
- Files: apps/mobile/App.tsx (tap block only), composer, lib/notification-tap-queue.ts, lib/bridge-host.ts (ack hook, gap G6), tests. Resolves (c), part of (f). Needs H0, H1 (navigate), 0b-3.

### H4 WP2.4-D (split D1 / D2 per the 400-line rule)
- D1: app HostAdapter dom/bridge/app-adapter.tsx (Link interceptor, Image fill inline styles, storage shim, env, insets, resolveUrl, currentUrl, openExternal and _blank capture interceptor); `presentNativeRoute` + native overlay state + RN Modal over the STILL-MOUNTED host in App.tsx (`mount==='dom'` branch ~:387); native owns back while overlay is up; watchdog fallback clears overlay. Needs H0.
- D2: `git mv dom/ReaderSpike.tsx dom/AppReader.tsx` mounting `ReaderRoot` with slot registry, `overlayFallback`, D-6 mode fallback; index.web.ts; parity a-vs-b viewport compare. Needs H0, H1, H2 (E before S5).
- Files: apps/mobile/App.tsx, lib/dom-host-handlers.ts, lib/watchdog-gate.ts (comment), dom/AppReader.tsx, dom/bridge/app-adapter*.tsx, dom/slots/* (new, recommended), dom/spike/reader-modules.ts, components/SharedUiHost.tsx (import swap), index.web.ts, e2e/parity/{compare,helpers}.ts, docs/one-ui/{parity,dom-host}.md. Resolves (b), part of (f).

### H5 Slice D PRs (all need H4/D2 plus section 2 prereqs; Codex mandatory on each)
- 2.5-D moment (MomentDetail overlay; shop affiliate env, gap G4), 2.6-D threads (+TheoryGuide), 2.7-D tracks (needs #4923), 2.8-D search, 2.9-D merch (needs #4925 + SubmitLinkForm swap + H2), 2.10-D community, 2.11-D1 F2 clown handler (apps/mobile/lib only), 2.11-D2 clownbot + mood slots, 2.12-D settings (needs H3; HostNotifications app impl; /inbox and /settings/about as native routes), 2.13-D legal (needs 2.13 A2/A2b + H2; App.tsx openLegalPage :341-347; lib/site-url.ts; isMailtoUrl).
- Each: slot file under dom/slots, ONE line in dom/AppReader.tsx, delete its fallback entry, flip its parity routes to both sides + new b-* baselines, device checklist in the PR body; dom/spike/** deletions only; lib/dom-host-handlers.ts native-route map.

### H6 NEW, no brief owns it: X4 universal-link intake
- `.well-known` (AASA + assetlinks.json) in apps/web/public/.well-known (must NOT ship before H3), App.tsx `Linking` listener feeding the same tap queue with `source:'deeplink'`, HA entries for Apple team id and Play app-signing SHA-256. Needs H3.

## 2. Pre-GO prerequisites that unblock the Ds (run NOW; not HOLD)
- 0a: land #4923, #4925, #4926, #4929, #4930 (suggested order #4929, #4930, #4923, #4925, #4926).
- 0a-2 missing A2s: SubmitLinkForm -> apiFetch (+ inline "verification required" message via openExternal), not covered by #4925 (MerchSection only). 2.11 A1b + A2b: move Mood (MoodChat, MoodSongCard, mood-starters); swap /api/mood and /api/clown to the host (read G12 first). 2.13 A2b: `isMailtoUrl` + openExternal mailto branch (bridge contract change: Codex + contract third leg), lib/site-url.ts; shim deletions only after the D mounts.
- 0b [pure; ask Fable whether it fits the 12:28 line]: (1) apps/mobile/lib/bridge-app-handlers.ts composer `createAppHandlers(deps)` merging ui/notifications/api maps, so H1/H2/H3 each edit only their own deps file and SharedUiHost is touched once (in H0); (2) `presentNativeRoute` pure route map + overlay state machine in dom-host-handlers.ts (no Modal yet); (3) bridge-host.ts ack-observation API (G6); (4) lib/expo-fetch-deps.ts + test asserting the stream path; (5) tap resolver `source` extension. Also ask whether 2.11-D1 (F2 clown allowlist entry, F1-class) can join 0b.

## 3. Parallel waves (max 6 branch-writers; reviewer and Codex are not writers) and merge order
PM is the sole merger, one PR at a time. After each merge, open branches run `git merge origin/main` (never rebase). Never `--delete-branch` with open children. No merge during device sessions. Dispatch exactly `parity.yml`.
- Wave 0 (now, while S2/S4/G0 pending), up to 5 writers: 0a landings; SubmitLinkForm swap; 2.11 A1b+A2b; 2.13 A2b; 0b-1/2; 0b-3/4/5.
- Wave 1 (GO): W1-A H0 (critical path, single writer); W1-B H4/D1 (new app-adapter files + App.tsx modal; no SharedUiHost/ReaderSpike); W1-C 2.11-D1 (if not released to 0b); W1-D H6 drafts (.well-known files and HA entries, NOT shipped); W1-E e2e parity b-side viewport compare scaffolding. Merge order: H0, H4/D1, 2.11-D1.
- Wave 2 (H0 merged): H1, H2, H3 in parallel (distinct deps files via the composer). H4/D2 waits for H1 (both edit ReaderSpike/reader-modules). Merge order H1, H2, H3.
- Wave 3: H4/D2 alone on the hot files (Codex mandatory; first production DOM-host path), plus H6 intake (needs H3).
- Wave 4 (H4 merged), 6 writers: 2.5-D, 2.6-D, 2.7-D, 2.8-D, 2.9-D, 2.10-D, merged in S5-batching order. Collisions only in the e2e/parity route list, docs/one-ui/parity.md, MAP.md, READER-MOVE.md, so merge serially. S5 device session after 2.4-D..2.7-D merge.
- Wave 5: 2.11-D2, 2.12-D (needs H3), 2.13-D (needs 2.13 A2/A2b + H2), spike cleanup (delete dom/spike resolver, shims, reader-modules, stubs once Mood and MerchSection leave apps/web), TODO/doc sweep. S6 after. Then S7 (also feeds READY_TIMEOUT_MS), G4, G5.

## 4. Brief gaps and staleness (what changed today)
- G1. F2 must use `expo/fetch` (Fable 12:58). F1 `readCapped` refuses a response with no `res.body.getReader` (UNREADABLE), so RN global fetch would fail every call; the wp23-F text saying native fetch is stale. Installed expo 57.0.19 `NativeRequest.ts` declares `redirect` and `credentials` (F1 sets redirect error, credentials omit); on-device behaviour unverified. Add a stream-path check to S5/S6.
- G2. E2 must dedupe taps by id (Fable 12:59). The queue dedupes only when `raw.id` is a non-empty string, so E2 must pass `response.notification.request.identifier` (cold getLastNotificationResponseAsync and the listener can deliver one response twice; null id = no dedupe). Consider clearLastNotificationResponseAsync. The wp23-E text saying no second queue is stale: E1 built a separate ack-based queue (15 s ack timeout, 10 min TTL, capacity 16).
- G3. HostStorage.get is tri-state (#4923, still OPEN; undefined = storage unavailable, null = key absent). The 2.4-D brief (storage = WP0.5b Map shim) assumes string or null. App adapter must implement the new type: Map shim returns null for absent keys (swipe hint shows every launch on Android, S5 check 13), undefined only when truly unavailable. Merge #4923 before H4/D1.
- G4. Affiliate ids (#4924): HostEnv.affiliate is filled by the web root adapter only; absent = direct retailer links, so the app silently loses tags (founder parity rule). Values are the NEXT_PUBLIC AWIN_ID, AMAZON_ASSOCIATES_TAG, CATCHALL_ID vars in Vercel (Joey only). Action: HA for the literal values (or read them from public affiliate links), ship as a JS constant in the app adapter; add to 2.5-D acceptance and S5 check 10.
- G5. Turnstile, submit-link, intake and feedback all go through apiFetch -> F2 (allowlist POST /api/intake, feedback, mood, submit-link). Only intake (#4882) and feedback (#4926) are swapped; SubmitLinkForm and Mood are not (section 2). Open fact: is TURNSTILE_SECRET_KEY set in prod? (ask Joey; if set, in-app submit shows a finish-on-longlivets.com message via openExternal; no native form per founder rule). Limits: 256 KB body, 8 s timeout (clown needs 60 s, per endpoint).
- G6. E2 needs an ack-observation hook that does not exist. `createBridgeHost.emit()` returns void and `onAck` only trims the outbox (bridge-host.ts:198-201, bridge-host-outbox.ts), but E1 `navigateSink(emit, awaitAck)` must learn when the DOM acked that navigate. Add emit returning seq plus an onAcked(seq) hook first (add-only, tests, Codex). Not in any brief.
- G7. `navigateSink` hard-codes source notification; universal links need source deeplink (messages.ts supports both). No brief owns app URL intake (App.tsx has no Linking listener) or the .well-known files the WP0.4 ruling said ship only with WP2.3 -> H6.
- G8. Diag hot-corner. S-checklists (2.4-D, 2.12) still say 7 taps on the version label in About. Since #4875 the hot corner (top AND bottom inset strips, shared counter, rendered outside SafeAreaView, only when mount is dom, App.tsx:481) is the Diagnostics entry while the DOM is up. 2.4-D must not let AppReader painting into insets or the D-7 RN Modal break it; add S5 check: 7 taps top strip, 7 bottom strip, mixed 4+3, on all devices; keep About as a native-overlay route (S8 relies on Diagnostics). #4877 deep-link fallback still awaits device evidence.
- G9. AppReader must keep ReaderSpike measurement instrumentation: Speed test mode (#4898: speedTestOn, reportImageLoad, setImageLoadListener), probe/firstPaint/heap, reportProbe, window error capture, devLoader. The git mv must not drop the S2/S4/#4895 measurement path.
- G10. The 2.4-D brief assumes MomentDetail comes via the spike resolver. MomentDetail, tracks, search, threads, merch leaves, community, clown, settings and legal are already in packages/ui, so AppReader can import them directly (still fill(snapshot) before anything with module-level data). Remaining apps/web components in the DOM bundle: MoodChat and the MerchSection wrapper (until #4925). The reader-modules.ts trim and spike-resolver retirement follow once those leave.
- G11. 2.4-D touch set: App.tsx only if PM approved Q3 is settled by Fable D-7 (App.tsx modal mandatory); presentNativeRoute lives in lib/dom-host-handlers.ts. Recommend a dom/slots/ registry (one file per slice) created in H4/D2 so slice Ds do not collide in AppReader.tsx.
- G12. ClownChat streaming. ClownChat reads NDJSON from the fetch body, while ApiFetch returns a whole string and the F2 brief says readClownStream from a string. Swapping ClownChat to apiFetch on the web would buffer it and remove the live investigation trail (visible web regression). Needs a Fable call before 2.11 A2b: an optional streaming member (web = real fetch, app = F2 buffered). Same ruling: reuse OS-036 Bearer from SecureStore, add Authorization after sanitize, strip x-clown-session and set-cookie, 60 s cancellable.
- G13. `currentUrl?` is a new HostAdapter member (#4926, web-root only). The app adapter must supply the in-DOM web path (not file://) or FeedbackButton reports lose location.url. Not in any D brief.
- G14. Stale dependency rows: the previous-slice A2/D rows were deleted by the 12:28 ruling; 2.8-D needing 2.5-2.7-D is only a scheduling preference (overlayFallback covers it). 2.13-D drops SiteFooter; 2.6 includes TheoryGuide (A1b #4919 done). WP2.14 is already merged (#4867): not HOLD, but it needs S7 data for READY_TIMEOUT_MS and must precede any remote sharedUi true.
- G15. Hot-file collision: the briefs have D, E and F each register handlers in SharedUiHost.tsx, and D2 plus 2.4-D both rewrite ReaderSpike/reader-modules. Fix with the composer (0b-1) and the D2-then-2.4-D/D2 order.

## 5. G0 NO-GO fallback (static packages/ui build in ONE react-native-webview)
Basis: PLAN WP0.4b, g0-evidence section 4. RNC webview 14.0.1 is already installed (kept via expo.install.exclude), so the fallback needs no new native module and no store build (C3: if one appears, stop and go to Fable). @expo/dom-webview stays installed unused until WP5.2.

Carries over unchanged (everything above the transport line):
- all of packages/ui, ReaderSnapshot, fonts, HostAdapter types; every A1/A2/PR0 capture already merged and all of wave 0;
- the parity harness and its b-side (index.web.ts is already a plain Metro-web browser entry);
- bridge envelope, client, host dispatcher, validators, ids/hwm/version rules; D1/E1/F1 handler modules, the composer, notification-tap-queue and the ack hook;
- watchdog policy/telemetry/drill/record (the gate stays; crash inputs come from different callbacks);
- DiagHotCorner, diagnostics, Speed test, release train; slice-D semantics (slots, overlayFallback, presentNativeRoute, interceptors, checklists); app HostAdapter pieces as DOM code; H6.

Changes:
1. transport-expo.ts -> transport-rnwebview.ts (postMessage + injectJavaScript), still the ONLY transport file.
2. SharedUiHost.tsx becomes an RNC WebView host: onMessage -> host.receive; onContentProcessDidTerminate / onRenderProcessGone / onError / onHttpError -> watchdog (RNC gives load-error signals dom-webview lacked).
3. ReaderSpike/AppReader: drop the use-dom directive; props -> bridge events (insets, contentVersion, back); onReady/reportError -> bridge ready/diag.
4. New build step producing static index.html + bundle and a delivery path (OTA asset unpacked for allowFileAccess, or source html with baseUrl https://www.longlivets.com).
5. H0 and H1 rewritten against the new transport (same tests, new adapter); H2/H3 only touch registration.
6. Persistence/C6: RNC can enable DOM storage and IndexedDB, so the file:// cache-read workaround may be dropped or kept.
7. dom/spike (resolver, shims, read-local, probe) retires earlier; the OTA size baseline may fall.
8. Budget a new S4-lite device session (fonts, photos, embeds, offline kill/relaunch, memory) plus a Fable go/no-go.

Upside to evaluate: a real baseUrl origin may cure YouTube/Spotify null-origin refusals (error 153) and make /api same-origin. Risk: a custom origin changes CORS/CSP assumptions (/content ACAO star, /api no CORS, CSP untouched per X1) and Referer-gated images (X2); verify on device.
Decision rule: waves 0a/0a-2/0b run regardless (transport-independent). Hold H0 and the DOM side of H4/D1 until Fable rules on G0; the App.tsx modal + presentNativeRoute and all slice slot files carry over under either outcome.

## 6. Traps
- Never switch branches in the main checkout (the Facebook export runs from it). Read with `git show origin/main:` or a worktree outside Projects. Local main is 31 commits behind; the brief file:line cites predate #4908-#4926.
- watchdog.ts is capped near 300 lines; .well-known must not ship before H3/H6; no app.json or native-dep edits (fingerprint identical on every PR).
- Executors sometimes dispatch mobile-parity.yml by mistake; bot baseline commits do not trigger PR CI.
- Two Codex rejections on a PR -> Fable (log in STATE.md). Codex is mandatory on every HOLD PR.

## 7. Open questions (not verified)
- Whether expo/fetch enforces redirect error on both OS (types only).
- Whether Fable releases the 0b-pure items and 2.11-D1 pre-GO (assumed, not ruled).
- ClownChat streaming approach (G12), prod Turnstile secret state (G5), affiliate id values (G4).
- Wave durations unknown (no slice D has landed yet).

## Rulings and acceptance additions (2026-10-03 14:10–14:29)
- Fable 14:10 plan review: APPROVED with edits — H0 (B4+C3) is one PR and the critical path; H4/D2 merges only after H0's ready→ack round trip is observed on a real device; each slice's dom/slots/<slice>.ts exports its slot AND its native-route entries (only shared edit = one import line; native-safe routes module split from DOM slots per #4940); wave 0 approved and in flight (#4934 presentNativeRoute, #4937 Mood, #4938 ack hook, #4939 ClownChat apiStream, #4940 composer+slots, #4941 expo-fetch deps + clown allow-list).
- ClownChat on the app: optional HostAdapter.apiStream (web root only); app falls back to bufferedFrom(apiFetch) until 2.11-D1 decides on native streaming (F1 caps replies at 256 KB — check clown reply sizes).
- NO-GO fallback must NOT use baseUrl https://www.longlivets.com (origin spoofing → site cookies attach); keep null/custom origin; S2/S4 data does not transfer to a different renderer — budget an S4-lite go/no-go for the fallback.
- H6 universal-link intake must dedupe getInitialURL vs the url listener (consume-once flag); H3 adds clearLastNotificationResponseAsync.
- currentUrl (G13) and diag hot-corner survival under the RN Modal (G8) are explicit H4/D1 acceptance items.
- Affiliate ids: NEXT_PUBLIC_* values are public — ship as a JS constant read from the live site (no HA); app must supply HostEnv.affiliate or Shop-the-Look earns nothing in-app.
- E2/D2 acceptance (Codex 14:29 on #4938): bridge host and WebView/client transport share one lifetime — recreating the host must recreate the transport; test it (epochless wire acks are otherwise ambiguous).
- presentNativeRoute (Fable 14:25): App.tsx schedules one `tick` per applied opening/closing transition (OPEN 1500 ms, CLOSE 1000 ms); log 'stale' results.
- F2 (Fable 12:58): inject fetch from expo/fetch (expo-fetch-deps.ts); per-endpoint API timeout table shared by DOM client, native dispatcher and handler (#4941 fix).
- Era perf rung 2 (content-visibility) stays gated on S7 + element-anchored restore; follow-ups #4935.
