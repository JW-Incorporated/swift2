# One UI Waves 3-5 briefs (PM scratch, drafted 2026-10-04 from origin/main cc9206d2)

Basis: post-g0-plan.md section 1 H4/H5 + section 4 gaps, brief-wp24/25-28/29-214, PROGRESS Fable log 06:39 and 07:06, origin/main (H0 #4962 and #4963 merged). In-flight, NOT on main when drafted: #4961 (H4/D1 app adapter + NativeOverlayHost, embedOrigin set), #4960 (YouTube wrapper), #4966 (2.13 A2b mailto); H1/H2/H3 had no pushed branch or PR when drafted (verify). Every brief step 1 = gh pr view <n> --json state for each dependency; any unmerged = STOP and report.

## 0. Facts that shaped these briefs

- main today: SharedUiHost.tsx still mounts ReaderSpike (205 lines) with backTick + hardwareBackHandled (H1 deletes). ReaderSpike takes inbox/bridge/reportProtocolFatal props (H0). loadReader() in dom/spike/reader-modules.ts still requires apps/web store/theme/EraStream/MomentDetail/BottomNav/host-adapter and builds its own Shell. dom/bridge/ has only transport-expo.ts on main (app-adapter lands with #4961).
- dom/slots on main: registry with register(slice, slots) where slots is a Record name -> component, names unique across slices; native-safe routes registry (registerRoutes). Both index files have NO slice imports yet. Slot NAMES are not mapped to ReaderSlots (surfaces/overlays/footer/floating/fallback): H4/D2 defines that mapping (D2 step 5).
- packages/ui ReaderSlots (reader/shell/ReaderShell.tsx:15-19) = {surfaces: Partial Record AppMode, overlays: ComponentType[], footer?, floating?, fallback: ComponentType with mode prop}. There is NO overlayFallback member. Slice Ds may not edit packages/ui, so overlayFallback must be an app-side component placed in the overlays array (D2 step 6; ambiguity A1 in the return note).
- All A1 moves are on main: packages/ui/src/reader/{clown,community,era,legal,merch,moment,search,settings,shell,store,threads,tracks}. TheoryGuide/TheoryCard/LiveTheoryCard live in reader/threads, so 2.6-D owns them (old brief-wp25-28 Q2 and the 2.7 section say 2.7: STALE). EraSelector and SiteFooter are shell chrome (2.4).
- Parity infra on main (#4963): e2e/parity/{routes,sides,compare.spec,capture,...}. AOnlyRoute.sides = "both" adds compare "a vs b viewport: <name>" and baselines b-<name>.png + b-<name>-viewport.png; assertNoBaselineCollisions guards b-home* and b-item*.
- Gap rulings folded in: G4 affiliate = decided, no NEXT_PUBLIC affiliate vars set in Vercel, web earns none, app sends none, so HostEnv.affiliate stays ABSENT and no HA. G5 Turnstile keys unset = drop the verification-required message item. G8 hot-corner, G10 direct imports, G13 currentUrl as listed per slice.

---

## 1. H4/D2 (Wave 3, single writer on the hot files; Codex MANDATORY)

~~~
WP H4/D2 (WP2.4-D part 2): AppReader mounts packages/ui ReaderRoot. Programme: One UI (post-g0-plan.md section 1 H4; brief-wp24 "Brief 2.4-D" as amended here).
Goal: the app DOM reader renders TopBar + era stream + moment overlay + BottomNav from packages/ui through the slot registry, using the D1 app adapter and the H2 bridge apiFetch, with native fallback for anything unmoved and web parity pixel-identical.
Depends on (step 1, STOP if unmerged): H0 #4962 (merged), H1 (UI commands; backTick deleted), H2 (dom/bridge/api-fetch.ts), #4961 D1 (app-adapter, NativeOverlayHost, SafeAreaView edges [], embedOrigin), #4960 (YouTube wrapper), #4963 (merged). H3 is needed by S5, not by this PR. Confirm git grep -n backTick -- apps/mobile packages is EMPTY.
Touch set: apps/mobile/dom/AppReader.tsx (git mv from dom/ReaderSpike.tsx), dom/reader-spike.css (rename only if needed), dom/slots/{index.ts,reader-slots.ts (new: slot-name to ReaderSlots mapper),overlay-fallback.tsx (new),moment.ts (new)}, dom/spike/reader-modules.ts (trim), components/SharedUiHost.tsx (import swap ONLY), index.web.ts, lib/dom-host-handlers.ts (native-route wiring only if needed), lib/watchdog-gate.ts (comment only: clears TODO(PM) WP2.4-D), e2e/parity/** (additive only), docs/one-ui/{parity,dom-host}.md, MAP.md, tests. NOT packages/ui (STOP if a change is needed), app.json/app.config.*, native deps, watchdog logic. Anything else = stop and report.
Do:
 1. npm ci --silent. Read dom/bridge/app-adapter*.tsx (D1) and dom/bridge/api-fetch.ts (H2) first.
 2. git mv dom/ReaderSpike.tsx dom/AppReader.tsx. Keep the props: cacheUri, versionToken, insets, inbox, bridge, reportProtocolFatal, reportProbe, reportError, onReady, speedTestOn, reportImageLoad, devLoader, dom (drop backTick/reportBack only if H1 already did).
 3. G9 MUST-KEEP, grep proof pasted in the PR body (each identifier present in AppReader or its imports): speedTestOn + reportImageLoad + setImageLoadListener; createProbe/checkMarkers/countPlaceholders; firstPaintMs + heapMb + the 4000/12000 ms placeholder samples; reportProbe; window error + unhandledrejection capture (with the cacheUri script filter); devLoader; ExpoBridgeMount/useExpoBridge with onFatal to reportProtocolFatal; installStorageShim; insetsFromQuery. These are the S2/S4/#4895 measurement path.
 4. Build the app adapter once per mount inside the component (no module singleton): createAppAdapter({client, apiFetch, isNativeRoute from dom/slots/routes, navigateDom, getPath, insets, onBack, storage}). apiFetch = the H2 client.call("api") function; client = the useExpoBridge client (host and transport share one lifetime: remount on the epoch key; test it, Codex 14:29 ruling). storage = the Map shim from spike/storage-shim.ts, NOT D1 default window storage (the Android DOM has none, G3): get() is tri-state, null for an absent key, undefined only when storage is truly unavailable; add a test. env.affiliate stays ABSENT (G4) and turnstileSiteKey null (G5).
 5. Render HostProvider + ReaderSnapshotProvider + ReaderExtensionsProvider (as loadReader does) around ReaderRoot slots. Call fill(core) and fillExtensions BEFORE any web-only component is required. Slot-name convention (document in dom/slots/index.ts header, implement in reader-slots.ts): "surface:<mode>" to slots.surfaces[mode], "overlay:<name>" appended to overlays in registration order, "footer", "floating". D2 registers the moment slice itself in dom/slots/moment.ts: surface:era = EraStream and overlay:moment = MomentDetail, both imported DIRECTLY from @swift2/ui subpaths (G10, no spike resolver), ONE import line in dom/slots/index.ts. Native-route entries go in dom/slots/<slice>.routes.ts + ONE line in routes.ts.
 6. overlayFallback (Fable 06:10 pulled into 2.4-D): an app-side component in dom/slots/overlay-fallback.tsx, passed in the overlays array. It reads the store (useAppState) for every overlay the shell can open that has no slot yet (search, song, track guide, theory guide, thread/lens, EraSecretCard song) and calls adapter navigate(native or X4 URL) ONCE, then clears that overlay store state, rendering null. One table keyed by overlay id; each slice D deletes its own row. Test the loop guard: navigate, native, back, reopen must not re-trigger. If this needs a packages/ui edit, STOP and report (ambiguity A1).
 7. D-6 mode fallback: slots.fallback receives the mode prop, calls navigate(tabPath) once, then setMode(previous), renders null. Unslotted modes at D2: threads, merch, community, clownbot, mood and any other AppMode. Each slice D deletes its mode.
 8. Capture-phase click interceptor (_blank or off-origin anchors to openExternal) ships in the D1 adapter: grep first, never build a second one; test same-origin and in-DOM links are skipped.
 9. SharedUiHost.tsx: import AppReader instead of ReaderSpike, nothing else. index.web.ts renders AppReader (parity side b). Trim reader-modules.ts to what remains needed; do NOT delete the spike resolver yet.
10. Parity: compare.spec.ts gets "a vs b viewport" for home and item with header and nav visible. NO existing baseline regenerated; list any new b-* files. Dispatch exactly parity.yml (never mobile-parity.yml); bot baseline commits do not trigger PR CI, so re-run once.
11. Watchdog untouched: forced DOM failure and ready timeout still fall back to native, the D1 overlay state is cleared on fallback, watchdog tests pass unmodified.
12. node scripts/parity/size-check.mjs delta pasted; over budget = STOP.
13. Over ~400 non-test lines: D2a (adapter wiring + slot mapper + fallbacks + tests) then D2b (AppReader mount + parity); SharedUiHost swap goes in the last one.
Acceptance:
 - Web pixel-identical: parity green on all 4 projects, no existing baseline changed, probe hash == fixture.json both sides, check-dom-bundle green.
 - App under the C4 override (or remote sharedUi) shows TopBar + era stream + BottomNav from packages/ui; with both off the native screens are unchanged.
 - ready then ack round trip covered by tests; host/transport lifetime test present.
 - G9 grep proof; Expo-DOM-specific code still only in SharedUiHost.tsx + dom/bridge/transport-expo.ts (grep proof).
 - Fingerprint IDENTICAL base vs branch (paste both); both expo exports pass.
 - Carried D1 items re-checked: currentUrl returns the in-DOM web path (G13); diag hot corner (7 taps top strip, 7 bottom strip, 4+3 mixed) survives the RN Modal and the DOM painting into insets (G8; DOM is sole inset owner after #4961).
Verify with: npm run typecheck; npm run lint; npx vitest run apps/mobile/dom apps/mobile/lib packages/ui/src/bridge scripts/parity; npm run test once at the end; npx expo export --platform ios and android; node scripts/parity/check-dom-bundle.mjs <ios export dir>; node scripts/parity/size-check.mjs. Paste the final result line of each.
Repo rules: OPERATING-MODE.md section 7 pasted verbatim.
Land: PR (TL;DR, then ---, detail; refs #4788), NO auto-merge, PM merges after Codex clean AND the device gate. Never --delete-branch with open children.
Return <=300 words: what changed, verification results (fingerprint hashes, OTA delta, parity run id), PR URL, open risks.
~~~

PM gate (not for the executor). Fable 06:39: D2 merges only after its ready-to-ack round trip is OBSERVED on a real device on BOTH OS at iOS-1 (iPhone + iPad on build 38 + Wave 1-3 OTA; Android was seen at S4). Sequence: reviewer + Codex clean, OTA from the branch, iOS-1 session (S4 checklist + ready/ack on iPhone, iPad, Android + a freshly cited WP1.1 WebKit leg run id), then merge D2, then Wave 4. #4960 YouTube must play on device at S5 and iOS-1 before Wave 5. Wave 3 also carries H6 (needs H3); not briefed here.

---

## 2. Common block for every slice D (paste into each brief below; Waves 4 and 5)

~~~
SLICE D COMMON
Template: OPERATING-MODE section 9. Depends on: H4/D2 merged + iOS-1 passed (Wave 4), the slice A1/A2 on main, H2 (api) merged; STOP otherwise.
Touch set (every slice): dom/slots/SLICE.ts (slot registration, one file) + dom/slots/SLICE.routes.ts (only if native keeps routes) + ONE import line each in dom/slots/index.ts and routes.ts; delete the slice rows in dom/slots/overlay-fallback.tsx and in the mode fallback; e2e/parity/routes.ts (flip the slice routes to sides both) + new b-* baselines via parity.yml update-baselines (ADD only); docs/one-ui/parity.md; MAP.md; READER-MOVE.md heading for the slice; tests. dom/spike/** deletions only. NOT packages/ui (STOP), App.tsx unless stated, watchdog, app.json, native deps.
Rules: import slice components DIRECTLY from @swift2/ui (G10); still fill(snapshot) before anything with module-level data; no second interceptor/presenter/adapter (grep first); presentNativeRoute is the single native presenter; no overlay loop (navigate, native, back, reopen); web pixel-identical (parity green on 4 projects, no existing baseline changed); fingerprint IDENTICAL; Expo-DOM grep proof; size-check delta; forced failure still falls back to native.
Codex adversarial pass mandatory (PM runs codex exec directly). Two rejections go to Fable (log in STATE.md). PM merges serially; after each merge open branches run git merge origin/main (never rebase). Expect trivial collisions only in the parity route list, parity.md, MAP.md, READER-MOVE.md, dom/slots/index.ts.
Device checks go into the PR body as a numbered list for S5 or S6. Every slice also checks: diag hot corner (7 taps top strip, 7 bottom strip, 4+3 mixed) with the slice surface open (G8); Android back and iOS edge swipe peel exactly one layer; airplane-mode relaunch still renders.
Return <=300 words.
~~~

---

## 3. Wave 4 slice Ds (6 writers after D2 + iOS-1; merge order 2.5, 2.6, 2.7, 2.9, 2.10, 2.8; S5 after 2.5-D..2.7-D)

### 2.5-D moment overlay (MomentDetail)
~~~
WP 2.5-D: moment detail is a registered overlay; shop links carry no affiliate tag by decision. Programme: One UI slice 2.5. Common block applies.
Goal: moment open/close, lightbox, related rail, follow-threads and shop links all render and behave in the app DOM via packages/ui MomentDetail; unslotted song/thread links still present native.
Depends on: D2 merged, 2.5-A2 #4924 (HostEnv.affiliate, merged), A1 merged.
Touch set: common block + dom/slots/moment.ts only if D2 left an overlay entry to extend; delete the moment rows in overlay-fallback.tsx; reader-modules.ts: delete the web require of MomentDetail (and any now-dead web requires); retire spike resolver apps/web shims ONLY if git grep "web/components/longlive" -- apps/mobile is empty (side b devLoader must still build); log in PROGRESS if retired.
Do: (1) confirm MomentDetail is imported from @swift2/ui, not the shim; (2) affiliate (G4, PM call): do NOT set HostEnv.affiliate and add NO constants; add a unit test that ShopTheLook hrefs under the app adapter env are the plain retailer links (no tag params); web is unchanged and also untagged; (3) song and thread links inside a moment must hit overlayFallback (native Song/Threads present modally) until 2.6-D/2.7-D, with the loop-guard test; (4) share goes through adapter share (bridge), card-image share falls back to URL share (known); (5) flip routes item, item-video, item-social to sides both (item-social: NEVER click, the iframe is an external request); add b-* baselines.
Acceptance: common block; plus moment parity a-vs-b green; presentNativeRoute map test for song/thread.
Verify with: npx vitest run apps/mobile/dom apps/mobile/lib/dom-host-handlers.test.ts packages/ui/src/reader/moment; typecheck; lint; parity.yml; size-check; fingerprint.
~~~
STALE in old text: Q4 and G4 said fill HostEnv.affiliate from a JS constant and S5 check 10 verifies tags: superseded (none set in Vercel, app sends none, the owner was told web earns none). Q1/Q3 (overlayFallback, interceptor) are no longer 2.5-D work: they ship in D2/D1. Open PR #4656 (R20 split of MomentDetail) may change import paths if it merges first: re-grep.
S5 device checks: (1) opens from stream, from notification tap cold+warm (needs H3), from related rail; scroll restores on close. (2) Android back: lightbox, then moment, then exit; iOS edge swipe never strands a blank view. (3) YouTube inline playback WITH SOUND via the #4960 wrapper (record error 152/153); Instagram facade loads or record refused. (4) source and shop links open the system browser; returning keeps scroll; NO affiliate tags (expected). (5) lightbox pinch-zoom on iPhone, Android, iPad landscape. (6) Share opens the native sheet, focus returns. (7) VO/TalkBack: dialog title first, focus trapped, returns to the card. (8) song/thread links present native Song/Threads modally. (9) hot corner with the moment open (G8).

### 2.6-D threads (+ TheoryGuide)
~~~
WP 2.6-D: Threads surface and TheoryGuide registered. Programme: One UI slice 2.6. Common block applies.
Goal: the Threads tab, all six lenses, Crossings and the theories overlay render in the app DOM; native ThreadsScreen and the theory fallback stop presenting.
Depends on: D2, 2.6-A1/A1b (merged).
Touch set: common block; dom/slots/threads.ts: surface:threads = ThreadsMode, overlay:theory-guide = TheoryGuide (both from @swift2/ui, G10); delete the threads row in the mode fallback and the theories row in overlay-fallback.tsx; threads.routes.ts only if a native route remains (none expected).
Do: (1) register; (2) ClueWeb progress uses host storage (Map shim, tri-state); external anchors rely on the D1 interceptor, test none bypasses it; (3) flip routes threads, lens-love-story, lens-fashion, lens-taylors-version, lens-easter-eggs, lens-hidden-clues, lens-the-proposal, crossing, theories to sides both: 9 routes x 4 projects, report parity minutes; over the WP1.1 10-min budget = STOP and propose sharding, never drop projects.
Acceptance: common block; the Threads tab no longer presents native ThreadsScreen (test the mode fallback row is gone).
Verify with: npx vitest run apps/mobile/dom packages/ui/src/reader/threads; typecheck; lint; parity.yml; size-check.
~~~
STALE: brief-wp25-28 Q2 and the 2.7 section put TheoryGuide/theories in 2.7; Fable 06:10 moved it to 2.6 (it lives in reader/threads). Do not also register it in 2.7-D (a duplicate slot name throws at registration).
S5 device checks: (1) Threads tab opens the gallery at top. (2) all 6 threads open; the fashion scrubber drags without fighting overscroll. (3) open a moment from a thread and back: same scroll. (4) Crossings closes on back; markers tappable on Android. (5) Spotify facade plays inline or record refused. (6) ClueWeb reveal-on-scroll; external links go out and return. (7) notification tap to /?lens=hidden-clues cold and warm (H3). (8) theories overlay opens from the era and closes on back. (9) VO/TalkBack visual order; iPad rotation keeps thread + scroll. (10) hot corner on Threads (G8).

### 2.7-D track guide + song
~~~
WP 2.7-D: TrackGuide and TrackDetail registered as overlays. Programme: One UI slice 2.7. Common block applies. The track guide belongs to this slice.
Goal: /?guide= and /?song= open in the app DOM, song stacked over guide; native TrackGuideScreen and SongScreen stop presenting.
Depends on: D2, 2.7-A1 + A2 (swipe hint on storage.local) and #4923 HostStorage tri-state (verify merged).
Touch set: common block; dom/slots/tracks.ts: overlay:track-guide = TrackGuide, overlay:song = TrackDetail (from @swift2/ui); delete the track-guide and song rows in overlay-fallback.tsx.
Do: (1) register; (2) swipe hint uses host storage: the Map shim returns null for an absent key (G3), so the hint shows once per launch on Android and never errors; (3) flip routes guide, song to sides both (never use .first(): both dialogs can be open); (4) check overlay stacking order with both dialogs open.
Acceptance: common block; guide and song a-vs-b green; no TheoryGuide here.
Verify with: npx vitest run apps/mobile/dom packages/ui/src/reader/tracks; typecheck; lint; parity.yml.
~~~
STALE: the 2.7 section lists TheoryGuide/theories: remove. The swipe hint not persisting on Android is expected until storage is native-backed: record it, do not fail S5.
S5 device checks: (1) /?guide= and /?song= taps cold+warm with song over guide (H3). (2) Android back: song, then guide, then stream; iOS edge swipe peels one layer at a time. (3) swiping between songs (useSwipeNav) does not trigger OS back gestures; hint shows once per launch. (4) track video plays inline (wrapper #4960). (5) VoiceOver: title, facts, sections; OverlayNav buttons labelled. (6) iPad landscape and split view. (7) hot corner with the guide open (G8).

### 2.8-D search
~~~
WP 2.8-D: SearchOverlay registered. Programme: One UI slice 2.8. Common block applies.
Goal: TopBar search opens the DOM SearchOverlay; results open moment/song/guide/thread (DOM where slotted, native fallback otherwise); native SearchScreen stops presenting.
Depends on: D2. Waiting for 2.5-D..2.7-D is a scheduling preference only (G14): overlayFallback covers unslotted result types.
Touch set: common block; dom/slots/search.ts overlay:search = SearchOverlay; delete the search row in overlay-fallback.tsx.
Do: (1) register; the search index comes from useReader, no new data path; (2) flip routes search-open, search-results to sides both (prepare steps click and type; no new URL param); (3) keyboard risk: dvh and visualViewport under the keyboard are a CI blind spot: record device findings and fix host-side only (a package edit is an A2: STOP).
Acceptance: common block; both search captures a-vs-b green.
Verify with: npx vitest run apps/mobile/dom packages/ui/src/reader/search; typecheck; lint; parity.yml.
~~~
Device checks (S5 batch if merged by then, else S6): (1) keyboard opens without the dialog jumping, results visible above it (small iPhone; Android gesture nav). (2) iPad hardware keyboard: / opens, Escape closes, arrows move the option. (3) a result opens its moment/song/guide/thread; back returns to search with the query kept, then to the page. (4) Android back with keyboard up closes the keyboard first, then search. (5) VO/TalkBack: combobox expanded state and result count. (6) iPad rotation with keyboard up. (7) hot corner with search open (G8).

### 2.9-D merch (+ SubmitLinkForm)
~~~
WP 2.9-D: Merch surface registered with bundle extensions. Programme: One UI slice 2.9. Common block applies.
Goal: /?mode=merch renders from packages/ui in the app DOM with merch extensions supplied from the bundle snapshot; submit-link works through the bridge.
Depends on: D2, H2 (apiFetch), 2.9-A2 #4925 (merged), SubmitLinkForm apiFetch swap (on main).
Touch set: common block; dom/slots/merch.ts surface:merch = MerchSection wrapper passing extensions from useExtendedSnapshot (WP0.5b shims/merch + fill); delete the merch row in the mode fallback.
Do: (1) register; merch data comes from the filled snapshot only; (2) affiliate (G4): merch cards are plain links, add no tags; (3) submit-link: POST /api/submit-link via apiFetch. Turnstile keys are UNSET (G5): the form just submits, add NO verification-required message and no openExternal item; (4) flip route merch to sides both (images are hotlinked and fulfilled by the fixture stub).
Acceptance: common block; merch a-vs-b green; test that env.turnstileSiteKey null renders a submittable form.
Verify with: npx vitest run apps/mobile/dom packages/ui/src/reader/merch; typecheck; lint; parity.yml; size-check.
~~~
STALE: brief-wp29-214 Q3, 2.9-A2 and the 2.9 S6 line "submit link (Q3 outcome)" (Submit on longlivets.com message): dropped per G5. The 2.9 section claims shop.ts: it is owned by 2.5 only (Fable 12:28).
Device checks (S5 batch if merged, else S6): (1) looks like the site at 390/834/1194. (2) a retailer tap opens the system browser and returns to the same scroll (no tag expected). (3) EraSpine and rail section jump under the fixed TopBar. (4) submit a link: succeeds or shows the server error cleanly; the 8 s timeout error is a clean message. (5) VO/TalkBack order rail then cards; iPad rotation. (6) Android back from merch returns to the era. (7) hot corner on merch (G8).

### 2.10-D community
~~~
WP 2.10-D: Community surface registered. Programme: One UI slice 2.10. Common block applies.
Goal: /?mode=community renders from packages/ui in the app DOM; external community links go out via the interceptor; native CommunityScreen stops presenting.
Depends on: D2, 2.9-D merged (SubmitLinkForm and section-jump are in the package).
Touch set: common block; dom/slots/community.ts surface:community = CommunitySection; delete the community row in the mode fallback.
Do: (1) register; (2) _blank anchors in CommunityCard are handled by the D1 interceptor: assert via test, write no new code; (3) SubmitLinkForm section=community behaves as in 2.9 (G5: no verification message); (4) flip route community to sides both.
Acceptance: common block; community a-vs-b green.
Verify with: npx vitest run apps/mobile/dom packages/ui/src/reader/community; typecheck; lint; parity.yml.
~~~
STALE: old text says the 2.4-D interceptor handles _blank: it is in the D1 adapter (#4961). Old Q1 had FeedbackButton here: it is 2.13.
Device checks (S5/S6): (1) jump-bar chips scroll to the right section under the chrome. (2) Discord and Reddit links open the system browser (record whether Discord hands off to its app); return restores scroll. (3) the suggest-a-link banner focuses the form with the keyboard up (iOS + Android). (4) TalkBack order. (5) hot corner on community (G8).

---

## 4. Wave 5 slice Ds (after Wave 4 merged and S5 passed; #4960 YouTube proven on device at S5 + iOS-1 per Fable; S6 follows)

### 2.11-D2 clownbot + mood slots (D1 is DONE: #4941 allow-list + expo-fetch-deps; do not redo)
~~~
WP 2.11-D2: Clownbot and Mood registered. Programme: One UI slice 2.11. Common block applies. Codex mandatory.
Goal: /?mode=clownbot and /?mode=mood render from packages/ui in the app DOM; ClownChat talks through the bridge (buffered unless apiStream is implemented); native ClownChatScreen stops presenting.
Depends on: D2, H2 merged (api handlers registered with createExpoApiDeps incl. clownSession), 2.11 A1/A1b/A2b merged (MoodChat apiFetch #4937, ClownChat apiStream #4939).
Touch set: common block; dom/slots/clown.ts: surface:clownbot = ClownChat, surface:mood = MoodChat (from @swift2/ui); delete the clownbot and mood rows in the mode fallback; app adapter: apiStream ONLY if S6 says the buffered trail is unacceptable (else leave absent: ClownChat falls back to bufferedFrom(apiFetch)); a --app-vvh var in the adapter only if the keyboard check fails (the package CSS edit is an A2, STOP).
Do: (1) register; (2) confirm the host apiFetch path for /api/clown uses the 60 s clown timeout and strips x-clown-session and set-cookie (tests in bridge-handlers-api-clown.test.ts: re-run); check clown replies against the 256 KB response cap and record the largest observed; (3) the stale TODO(PM, 2.11-D1) markers at bridge-handlers-api.ts:28 and packages/ui/src/host/types.ts:139: clownSession IS wired by createExpoApiDeps, so report them (comment-only fix allowed in apps/mobile, the types.ts one is a package edit: report); (4) ClownChat full-size and safe-area check (S4 checklist item): ClownChat is fixed inset-0 with h-[100dvh] (ClownChat.tsx:256,265). With SafeAreaView edges [] and the DOM as sole inset owner, verify the titlebar clears the notch and the composer clears the home indicator, via the --safe-* vars in a b-side capture at ?inset=47,0,34,0 and on device; fix host-side only; (5) flip routes clownbot, clownbot-transcript, mood to sides both (the stubbed /api/clown NDJSON fulfil exists); (6) MoodSongCard YouTube iframe uses the #4960 wrapper path when host.embedOrigin is set: verify, do not re-implement.
Acceptance: common block; a-vs-b green for the 3 routes; safe-area b capture present; no token crosses the bridge in either direction (existing test green).
Verify with: npx vitest run apps/mobile/dom apps/mobile/lib/bridge-handlers-api-clown.test.ts packages/ui/src/reader/clown; typecheck; lint; parity.yml; size-check.
~~~
STALE: brief-wp29-214 says F2 returns a whole string, Hermes fetch has no stream, and that the mood and clown swaps are not done: now expo/fetch (G1), apiStream optional on HostAdapter, buffered fallback is the ruled default; Q2 (OS-036 reuse) adopted. The keyboard fix text assumed a package edit: keep it host-side.
S6 device checks: (1) keyboard over the composer on iPhone, iPad (split view + hardware keyboard), Android; the sent message stays visible above the keyboard. (2) ClownChat fills the screen: titlebar below the notch, composer above the home indicator or gesture bar, no gap at the top. (3) expand and minimise titlebar. (4) session continuity across kill and relaunch. (5) a long answer (over 8 s, up to 60 s) completes; airplane mode gives a clean error within the timeout. (6) the privacy link from the AI disclosure routes per 2.13-D. (7) VoiceOver reads new answers. (8) the mood YouTube pick plays inline (wrapper). (9) hot corner on clownbot (G8).

### 2.12-D settings (notifications)
~~~
WP 2.12-D: notification settings in the DOM; Inbox and About stay native. Programme: One UI slice 2.12. Common block applies. Codex mandatory.
Goal: /settings/notifications renders from packages/ui in the app DOM using HostNotifications backed by the E handlers; Inbox and About present native modally.
Depends on: D2, H3 merged (taps + notification host deps), 2.12-A2 (HostAdapter.webPush, merged), H2.
Touch set: common block; dom/slots/settings.ts (slot for the settings route: confirm in the store how /settings/notifications mounts, else a path route); dom/slots/settings.routes.ts: native routes /inbox and /settings/about (ONE line in routes.ts); app adapter: HostNotifications calling the bridge notifications.{status,request,register,updatePrefs} (the push token never crosses the bridge); delete the settings and bell fallback rows; App.tsx NOT touched.
Do: (1) register; (2) the DOM settings page gets Inbox and About rows doing navigate to /inbox and /settings/about, which present in NativeOverlayHost; About = SettingsAboutSection in the modal; (3) permission prompt from the DOM: undetermined to granted or denied; denied shows the OS-settings hint; (4) no web inbox (product question goes to Joey before WP5.2, per Fable); (5) flip route settings-notifications to sides both (Notification API stubbed to default in the fixture).
Acceptance: common block; a-vs-b green; handler tests for status/request/register/updatePrefs through the bridge; presentNativeRoute map test for /inbox and /settings/about.
Verify with: npx vitest run apps/mobile/dom apps/mobile/lib packages/ui/src/reader/settings; typecheck; lint; parity.yml.
~~~
STALE: the 2.12 S6 check "7 taps on the version label in About opens Diagnostics" is not the entry while the DOM is up: since #4875 the hot corner (top and bottom inset strips, shared 7-tap counter, outside SafeAreaView, only when mount is dom) is the Diagnostics entry (G8). Keep About as a native overlay route because S8 needs Diagnostics there too: check BOTH.
S6 device checks: (1) permission prompt from the DOM on iOS and Android 13+. (2) toggles persist across relaunch. (3) a notification tap while settings is open navigates (E). (4) Inbox row opens the native inbox modal; back returns to DOM settings at the same scroll. (5) About row opens native About; 7 taps on the version still open Diagnostics; hot corner works with settings open (G8). (6) denied state shows the OS-settings hint. (7) TalkBack order.

### 2.13-D legal + footer + feedback
~~~
WP 2.13-D: legal pages, SiteFooter and FeedbackButton in the app DOM; SiteShell retired on the sharedUi path only. Programme: One UI slice 2.13. Common block applies. Codex mandatory.
Goal: /privacy /terms /support render in the DOM; the mailto link opens Mail; openLegalPage under mount dom routes in-DOM; FeedbackButton reports the in-DOM path.
Depends on: D2, H2, 2.13-A2 and A2b #4966 (isMailtoUrl + openExternal mailto branch + lib/site-url.ts) merged, A1/A1b merged.
Touch set: common block; dom/slots/legal.ts (surfaces, footer and floating slots as the shell uses them); apps/mobile/App.tsx openLegalPage (about :341-347, re-grep) and the Clownbot disclosure route to in-DOM paths ONLY under mount dom; lib/site-url.ts (from A2b); shim deletions with grep proof per shim (READER-MOVE.md); native LegalPageScreen and SiteShell STAY for fallback and native-only callers (deleted in WP5.2).
Do: (1) register; (2) FeedbackButton: sessionStorage via storage.session; location via adapter currentUrl (G13): assert reports carry the web path, never file://; apiFetch for /api/feedback; (3) openLegalPage under mount dom navigates in-DOM; with the forced-failure switch on, the native LegalPageScreen path still opens (App Review 5.1.1(i): privacy and support always reachable); (4) mailto: only LEGAL_FACTS addresses, no query (A2b); (5) flip routes privacy, terms, support to sides both.
Acceptance: common block; a-vs-b green; test that App.tsx routes legal in-DOM only when mount is dom; shim deletions have grep proof; fingerprint IDENTICAL.
Verify with: npx vitest run apps/mobile packages/ui/src/reader/legal apps/web/components/longlive; typecheck; lint; parity.yml; size-check.
~~~
STALE: the 2.13 briefs put SiteFooter in 2.13-A1; it is shell chrome (2.4), so 2.13-D only registers the slot if D2 did not. The mailto validator is described as a stated call with no PR: now #4966 (in flight). FeedbackButton Q1 is closed: it is 2.13.
S6 device checks: (1) legal pages render offline (bundled, no network). (2) the support email opens Mail and returns. (3) the feedback sheet sends from each surface and the report shows the right path (G13). (4) footer links work. (5) legal pages still open with the forced-DOM-failure switch on (native fallback). (6) VoiceOver heading order. (7) hot corner with a legal page open (G8).

---

## 5. Per-slice device matrix for S5 and S6 (PM batching)

S5 (after D2 + 2.5-D..2.7-D merged; Android + iPhone + iPad): the 2.4-D checks (1)-(13) from brief-wp24 with these replacements: (11) tabs not yet moved present the NATIVE screen via presentNativeRoute (no "Not in the app preview yet" panel; D-6) and back from it works; (13) Android storage is the Map shim: progress does not persist and the swipe hint shows every launch (record, do not fail). Plus the 2.5-D, 2.6-D, 2.7-D lists (2.8/2.9/2.10 if merged by then); #4954 YouTube plays with sound; 5/5 speed capture cold and warm (Fable); G8 hot corner top, bottom and 4+3 mixed on every device, with the top strip retested after the #4953 inset change; ready-to-ack observed.
S6 (after Wave 5): the 2.11-D2, 2.12-D, 2.13-D lists above. S7 (READY_TIMEOUT_MS data) and S8 (Diagnostics via About and hot corner) follow.

## 6. Cross-cutting stale text to ignore in the old briefs

- backTick / reportBack: deleted by H1. NotInAppYet panel: replaced by D-6 fallback.
- "Hermes fetch has no stream" and "F2 returns a whole string": expo/fetch (G1) + optional apiStream with buffered fallback.
- G4 "ship affiliate constant / S5 check 10": superseded, none set. G5 "finish on longlivets.com via openExternal": dropped, keys unset.
- "7 taps on the version label is the only Diagnostics entry": the hot corner is the entry while the DOM is up (G8).
- TheoryGuide in 2.7: it is 2.6. EraSelector, SiteFooter, ShareFallbackToast: shell (2.4). MoodChat: moved (2.11 A1b done).
- "D-chain order is a dependency": a scheduling preference only (G14).
- "2.4-D touches App.tsx only if Q3 approved": the D-7 modal is mandatory and ships in #4961; D2 needs no App.tsx edit.
- All file:line cites in the old briefs predate #4908-#4966: re-grep before trusting any.
