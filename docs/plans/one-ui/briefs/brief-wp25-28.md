# WP2.5–2.8 executor briefs (0, A1, A2, D per slice): moment detail, threads, track guide + song, search (draft for the PM)

Sources: PLAN.md §WP2.4–2.13 (`origin/main` 359-389: slice table 365-370, "Each slice" 372-385, S5 after 2.4–2.7 / S6 after 2.8–2.13 at 387-389); brief-wp24.md (FABLE REQUIRED block, PM rulings 03:02, carried rulings, and the shared Repo rules / Land / Verify blocks, **reused verbatim and not repeated here**). Research is from `origin/main` @ `ace719b0` (2026-10-03).

State of main:
- WP2.1-A/B/C/D merged (#4841 #4844 #4847 #4851): every reader `next/image` and `next/link` is already `useHost()`.
- WP2.2 complete: `useReader()`, the lint ban (#4861/#4862/#4865), and `ReaderExtensionsProvider` for merch + songMoods (#4859).
- WP2.3-A/B/C merged (#4850 #4853 #4855); the wiring comes after G0.
- WP2.4-0 merged (#4852, plus the footer capture #4864). WP2.4 A1–D are NOT merged, and every brief below stacks on them.

## FABLE REQUIRED (2026-10-03 06:10) - supersedes the PM rulings block and anything below where they conflict
- 2.4-D PULL FORWARD: overlayFallback (overlays the DOM cannot render yet -> native via presentNativeRoute) and the capture-phase _blank/off-origin -> openExternal interceptor ship in 2.4-D (the shell TopBar already opens them). 2.5-2.8-D then only DELETE their fallback entries; 2.5-D D1/D2 split removed.
- 2.5-A1: drop EraSelector/ShareFallbackToast (-> 2.4-B). 2.6: add TheoryGuide/TheoryCard + theories route; D deletes that fallback; do NOT split A1 (renames do not count toward 400; run PR0 once; shard by project only if >10 min). 2.7: remove TheoryGuide/theories. 2.13: drop SiteFooter (-> 2.4-B).
- D-chain order is a scheduling preference (S5/S6 batching), not a dependency; A-series stays serial (shared shims/READER-MOVE.md).
- ClownChat F2 = REUSE OS-036 (SecureStore Bearer, persisted): nativeSession is allowlist-side only (test: DOM cannot set it); Authorization added AFTER sanitize; strip x-clown-session/set-cookie; 60 s cancellable; non-streaming = known deviation (streaming via evt chunks only if S6 says so).
- Turnstile: NO native form (separately-editable mobile UI violates founder rule). App: siteKey null -> form submits; if server says verification required -> inline "Finish on longlivets.com" via openExternal. Deciding fact: is TURNSTILE_SECRET_KEY set in prod (ask owner); unset = no change.
- 2.12: file the web-inbox-or-drop-inbox product question to Joey before WP5.2, not now. Affiliate via HostEnv = config, OK (optional member; S5 check 10 verifies).
- WP2.14: approve all five fixes; QUARANTINE_AFTER=2; precedence quarantine > override > cache > default; pending-view colour from the reader body-background token (never hardcoded); MUST merge before any channel publishes remote sharedUi:true. Nothing needed before G0. S4 must record time-to-ready per device (feeds READY_TIMEOUT).
- Earliest wrong signal: 2.4-D fallback loops on device (navigate -> native -> back -> reopen) => the D-7 modal model is wrong, not the slices.

## PM rulings (2026-10-03 06:08) - supersede the open questions below; Fable review pending
1. Unowned components: EraSelector + SiteFooter + share toast -> WP2.4-B (shell chrome); TheoryGuide -> WP2.6 (threads); MoodChat -> WP2.11 (Clownbot/chat); FeedbackButton -> WP2.13.
2. Overlays the app can open but whose slice has not moved: fall back to the NATIVE screen via presentNativeRoute (Fable D-6/D-7 pattern) - never a blank.
3. External links: bridge openExternal (https-only validator). Embeds (YouTube/Spotify iframes) stay in-DOM; null-origin refusal is an S4/G0 check.
4. Affiliate IDs / NEXT_PUBLIC_* config the app build lacks: REQUIRED parity (founder rule 1) - expose via HostAdapter env (like turnstileSiteKey), filled in the app from a JS constant/config shipped in the OTA (no native change).
5. Parity routes added web-side only until each slice app PR = ADDING baselines (allowed).
6. Diagnostics/inbox stay native-only (presented modally). Watchdog reports to public #4791 are acceptable: category-only, no free text (existing strict schema).
7. For Fable: ClownChat session = reuse the app existing saved Clownbot token natively vs in-memory cookie (F2); Turnstile in the app (null origin) - PM leaning: present the native form via presentNativeRoute.

## Open questions for the PM (decide before dispatch)

1. **Overlays the app's DOM shell can open but doesn't render yet.** D-6 covers *modes*, not *overlays*. From 2.4-D on, the DOM shell can open overlays it doesn't render: TopBar search (`TopBar.tsx:142`), a moment's song and thread links, EraSecretCard → song. The store flips state and **nothing appears**. **Rec:** 2.5-D adds `overlayFallback` to the ReaderShell slots, the overlay analogue of D-6.
   - When an overlay with no slot opens, it calls `navigate(<X4 URL>)` once (`/?song=` `/?guide=` `/?theories=` `/?item=`, or a native-owned `/search`), then clears that overlay's store state.
   - Native presents it modally via `presentNativeRoute` (D-7).
   - Each later D deletes its own entry. If WP2.4-D already ships this, 2.5-D drops it.
2. **Surfaces no slice owns.** The PLAN table doesn't name any of these, and all mount at `LongLive.tsx:55-98`:
   - `TheoryGuide` (193) + `TheoryCard` (181) + `LiveTheoryCard` (102; ClueWeb uses it too)
   - `EraSelector` (74) and `ShareFallbackToast` (72)
   - `MoodChat` (267) + `MoodSongCard` (75, Spotify iframe)
   - `SiteFooter` (80) and `FeedbackButton` (331; `/api/feedback`, sessionStorage)

   **Rec:**
   - `LiveTheoryCard` → 2.6.
   - `TheoryGuide`/`TheoryCard` → 2.7 (an era overlay, `?theories=`).
   - `EraSelector`/`ShareFallbackToast` → 2.5-A1, unless 2.4-B took them.
   - `MoodChat` → 2.11 with Clownbot (chat, `/api/mood`, keyboard).
   - `SiteFooter`/`FeedbackButton` → 2.13.
3. **External links and iframes in the app.**
   - Raw `<a target="_blank">` appear at `MomentDetail.tsx:224,248,885,1014`, `ClueWeb.tsx:633,865`, `ThreadsMode.tsx:374`, `DecodeCard.tsx:207`, `EntryDetail.tsx:144`, `TrackGuide.tsx:200` and `TrackDetail.tsx:374`.
   - The iframes are youtube-nocookie (`MomentVideo.tsx:158`), Instagram (`MomentSocialPost.tsx:58`) and Spotify (`SpotifyCompare.tsx:31-36`).

   **Rec:**
   - *Links:* one delegated capture-phase click handler in the app's `AppReader` sends off-origin or `_blank` anchors to `openExternal` (2.3). That keeps it in one app-side place with zero web diff, and no anchor gets converted to `Link`.
   - *Iframes:* they stay inline and become a device check (PLAN:291, "embeds refusing a null origin"). If S4/S5 shows a refusal (YouTube error 153), a follow-up adds an optional `embedMode?: 'inline'|'external'` member (additive, like `resolveUrl`). That needs PM approval then, not now.
4. **Affiliate IDs.** `shop.ts:116-118` reads `process.env.NEXT_PUBLIC_{AWIN_ID,AMAZON_ASSOCIATES_TAG,CATCHALL_ID}`. Next inlines these even inside `packages/ui`, so the web is unchanged. Metro inlines only `EXPO_PUBLIC_*`, so the app's ShopTheLook links lose their tags; today's spike already has this problem. **Rec:** A1 moves `shop.ts` as-is. A2 adds an optional `HostEnv.affiliate?: {awinId, amazonTag, catchallId}`, which the web adapter fills from the same three vars. Approve the member, or keep `shop.ts`/`shop-networks.ts`/`awin-advertisers.json` in apps/web behind a slot.
5. **Parity for surfaces side b can't render yet.** Side b (`index.web.ts` → `ReaderSpike` → `reader-modules.ts:28-44`) renders only EraStream, MomentDetail and BottomNav. Search and Crossings have no deep link (`deepLinkTarget`, `packages/experience/src/deepLink.ts:36-58`). **Rec:**
   - PR0s add **a-only** routes via an additive `sides` field on `ROUTES`. Each D flips them to both sides and adds the a-vs-b compare and new b-* baselines.
   - Search and Crossings get an additive `prepare(page)` step (click and type), not a new URL param, because a new deep link is a product change.
   - Confirm this counts as *adding* baselines (ruling 5), not re-baselining.

---

## Binding rules (carried from WP2.4's FABLE REQUIRED block; every brief)

- **MOVE-ONLY RULE (every A1).**
  - `git diff -M50% --numstat <base>` lists every moved file as a rename.
  - Every +/- line inside a renamed file is an import/export-path line. Paste the output of `git diff -M50% <base> -- <moved> | grep '^[+-]' | grep -vE "^[+-]{3}|import|from '|export"`; it must be EMPTY.
  - Lines that aren't renames, shims or tests: ≤ 400.
  - Any other hunk is logic and goes in the companion A2.
  - The 300-line rule is waived for move-only PRs. Log the debt (MomentDetail 1216, ClueWeb 911, Crossings 620, TrackDetail 580) in `packages/ui/READER-MOVE.md`.
- **MOVE vs LOGIC.**
  - A1 = `git mv` + import fix-ups + one-line shims + type re-homing.
  - A2 (stacked on A1) = every behaviour edit, under the normal 400 tripwire.
  - If A2 would be empty, say so in A1's body and skip it.
- **Shims.** An old path gets a one-line `export * from '@swift2/ui/reader/...'` only when `git grep` shows an importer outside the moved set (apps/web, apps/mobile, scripts, e2e, packages, tests). Otherwise it's a plain rename. List both kinds in READER-MOVE.md.
- **Parity captures before any move (the PR0 pattern).**
  - Touch only `e2e/parity/**`, the new PNGs and `docs/one-ui/parity.md`.
  - Generate the baselines from `main` via `gh workflow run parity.yml -f update-baselines=true`.
  - `git diff --stat origin/main -- e2e/parity/__screenshots__` must show ONLY added files, and the run must go green twice without an update.
  - Paste the negative proof: a 1px mutation of the new surface FAILS its capture.
  - The `helpers.ts` diff is additive only (captureRoot untouched), and the existing PNGs stay byte-identical.
  - Use element clips (`locator.screenshot`) for small chrome and for sections below the fold. Use EXISTING role/aria/heading selectors only. Never add `data-*`; if no stable selector exists, report it.
  - Adding baselines is allowed. Changing an existing one to hide a diff never is.
- **App mount (every D).** Held until the **G0 GO**. Codex adversarial pass **mandatory**.
  - Native screens PRESENT MODALLY over a still-mounted `SharedUiHost` via `presentNativeRoute(path)` (`apps/mobile/lib/dom-host-handlers.ts`). Never unmount or remount the host.
  - Presenting doesn't change insets. Native owns back while an overlay is up, and the watchdog fallback clears the overlay.
  - Watchdog, app config and native deps are untouchable. The fingerprint must stay IDENTICAL.
- **Carried rulings.**
  - Host capabilities only via `useHost()`.
  - In `packages/ui`: no `next/*`, no `react-native*`, no computed `import()`/`require()`.
  - Data only via `useReader()`/`useExtendedSnapshot()`.
  - Expo-DOM code only in `SharedUiHost.tsx` and `dom/bridge/transport-expo.ts`.
  - In-DOM routing stays in the DOM. DOM→native `navigate` only for routes native still owns.
  - No new allowlist entries.
  - No OTA baseline bump without a recorded reason.
  - Merge `origin/main` bottom-up before every parity run.
- **Land.** NO auto-merge; the PM merges. Never `--delete-branch` a branch that has open child PRs. Merge freeze during device sessions. Paste brief-wp24's Repo rules, Land (`<BASE>` per PR) and Verify blocks unchanged.

## Order and dependencies (step 1 of every brief: `gh pr view <n> --json state`)

| Needs merged | every X-0 | X-A1/A2 | X-D |
|---|---|---|---|
| WP2.4-A1/A2 (store, libs, share/storage adapters) | | yes | yes |
| WP2.4-B/C (ReaderShell slots; MomentVideo, OverlayNav, ShareImageMenu, TrackFivePill, SignificanceBadge in the package; EraSecretCard re-pointed off TrackDetail) | | yes | yes |
| Previous slice's A2 (READER-MOVE.md, MAP.md and `index.ts` conflict, so moves go serially) | | yes | |
| 2.5-A1 (`useFocusTrap` in the package): for 2.7 and 2.8 | | yes | |
| WP2.4-D, WP2.3-D/F (navigate, openExternal, share, apiFetch) | | | yes |
| Previous slice's D (the overlays it opens are DOM-rendered): 2.6←2.5, 2.7←2.6, 2.8←2.7 | | | yes |
| **G0 GO** (WP0.6) | | | **yes** |

- All PR0s may run now and in parallel (e2e only, base `main`).
- The A-series runs pre-G0 once WP2.4-C merges.
- Stacking: X-A1 → `main`, X-A2 → X-A1, X-D → X-A2.
- **S5 needs 2.4-D … 2.7-D merged. 2.8 goes to S6.**
- Earliest wrong signal: a PR0 that can't go green twice, then an A1 whose grep isn't empty.

---

## WP2.5 — Moment detail + video/social embeds

**Moves** (closure of `MomentDetail.tsx` minus 2.4's, ≈2.2k lines) → `packages/ui/src/reader/moment/`:
- `MomentDetail.tsx` (1216). Its inner parts stay in the file: `ConfidenceBanner` :139, `RumorSection` :175, `MomentFigure` :289, `MomentLightbox` :338 (portal to `document.body` :483), `ShopTheLook` :985, `RelatedMomentsRail` :1090, `FollowThreadsRow` :1152, `ClueWebCta` :1196.
- `MomentSocialPost.tsx` (114) and `ZoomableImage.tsx` (382).
- `lib/longlive/{contain-fit 63, related 98, useFocusTrap 84, shop 190, shop-networks 48, awin-advertisers.json}`.
- Tests move with them: `MomentDetail.test.tsx`, `ZoomableImage.test.ts`, `contain-fit`, `related`, `useFocusTrap`, `shop`, `shop-networks`.
- Shims:
  - `shop.ts`: `MerchSection.tsx:38`, `merch/MerchCard.tsx:42`.
  - `useFocusTrap.ts`: TrackGuide, SearchOverlay, TheoryGuide, EraSelector, FeedbackButton, `modal-focus-trap.test.ts`.
  - `MomentDetail.tsx`: `reader-modules.ts:32`, until D.
- Type-only edge: `shop.ts:1` `type MerchItem` from `./merch` (a data module, which stays). Re-home the type to `@swift2/experience` if it lives there, else to `packages/ui/src/reader/types/`.

**Host deps → HostAdapter** (`packages/ui/src/host/types.ts:86-115`).

| Call site | Today | Member / owner |
|---|---|---|
| `MomentDetail.tsx:290,488,1097`, `ZoomableImage.tsx:77` | `useHost().Image` | done (2.1-D); app impl 2.4-D |
| `MomentDetail.tsx:23` `shareTarget` | `navigator.share` | `share` (2.4-A2; `types.ts:110` "@later WP2.5") |
| `MomentDetail.tsx:224,248,885,1014` | raw `_blank` anchors (sources, shop) | `openExternal` (`types.ts:114` "@later WP2.5"), Q3 interceptor |
| `MomentSocialPost.tsx:58`, `MomentVideo.tsx:158` | click-to-load Instagram / YouTube iframes | stays; device check (Q3) |
| `shop.ts:116-118` | `process.env.NEXT_PUBLIC_*` | `env.affiliate?` (Q4, A2) |
| `window.scrollTo` (:1117,1176,1205), `keydown` (:546), back/scroll-lock hooks | DOM | real DOM; Android back via 2.3-D `onBack` |

**Parity (PR0, both sides).** Side b already renders MomentDetail, and `item` (`helpers.ts:41`) covers its top 480px.
- New routes:
  - `item-video`: `/?item=vault-tloas-the-fate-of-ophelia-video-premieres` (video-hero facade; its poster gets the placeholder).
  - `item-social`: `/?item=vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own` (the Instagram facade). **Never click it:** an iframe is an external non-image request, and the guard fails those (`helpers.ts:119-120`).
- Element clips on `item`, by their existing headings: the related rail, the follow-threads row, and the lightbox after clicking the first figure.
- The ids are in the frozen `tloas.json`, so the fixture needs no regen. Verify them via `/parity-probe` before baselining.

**PRs.**
- 0: captures.
- A1: move-only (9 renames + 3 shims; ≈120–200 edited lines). Also EraSelector and ShareFallbackToast if Q2 puts them here.
- A2: Q4 `env.affiliate`, plus the `MerchItem` re-home if it isn't a pure type move.
- D:
  - `AppReader` passes the package `MomentDetail` in `slots.overlays`.
  - Delete `reader-modules.ts`'s web `require`s (:28-35).
  - Retire the spike resolver's apps/web shims only if `git grep "web/components/longlive" -- apps/mobile` is empty (side b's `devLoader` must still build).
  - Add the Q3 link interceptor and the Q1 `overlayFallback`, plus a `presentNativeRoute` map test.
  - Likely split: D1 (interceptor/fallback/handlers), D2 (mount + parity flip).

**S5 checks (D PR body).**
1. A moment opens from the stream, from a notification tap (cold/warm, needs 2.3-E) and from the related rail. Scroll restores on close.
2. Android back goes lightbox → moment → exit. The iOS edge swipe never strands a blank view.
3. YouTube inline playback with sound. Record any error 152/153 (Q3).
4. The Instagram post loads in place, or record that it's refused.
5. Source and shop links open the system browser, and on return the moment is at the same scroll.
6. Lightbox pinch-zoom works on iPhone, Android and iPad landscape.
7. Share opens the native sheet, and focus returns.
8. VO/TalkBack announces the dialog title first, focus stays trapped, and after close focus returns to the card.
9. Song and thread links present native Song/Threads modally until 2.6 and 2.7 (Q1).
10. Shop links carry the affiliate tag in the app (Q4).

## WP2.6 — Threads

**Moves** (closure of `ThreadsMode.tsx` minus 2.4's: 24 files, ≈5.2k lines) → `packages/ui/src/reader/threads/`, keeping the subfolder layout:
- Top level:
  - `ThreadsMode` (434).
  - `ThreadsTimeline` (469), `ClueWeb` (911), `Crossings` (620), `crossingMarkerLayout` (59).
  - `FromTheEras` (87; used by `runway/RunwayThread.tsx:8` and `love-story/EntryDetail.tsx:10`).
  - `LiveTheoryCard` (102; shimmed, because `TheoryGuide.tsx:15` imports it).
- Subfolders:
  - `decode/{DecodeThread 291, DecodeCard 286, PatternRail 97, StatBar 41, patternRailLayout 14}`
  - `love-story/{LoveStoryThread 414, EntryDetail 216}`
  - `proposal/ProposalThread 146`
  - `runway/RunwayThread 153`
  - `taylors-version/{TaylorsVersionThread 119, AlbumNarrativeCard 153, BuybackBeat 91, OwnershipTimeline 272, SpotifyCompare 214}`
- Libs: `lib/longlive/{decode 18, love-story 10, live-theories 2}`. `threads.ts` is a data module and stays.
- Tests move too: `crossingMarkerLayout`, `crossings-*`, `decode/*`, `love-story/*`, `proposal/*`, `taylors-version/ownershipTimeline`, `decode.test`, `love-story-songs`.

**Host deps.**
- Images already go through `useHost()` (`ThreadsMode.tsx:99`, `FromTheEras.tsx:33`, `ProposalThread.tsx:36`, `RunwayThread.tsx:24`).
- External anchors (`ThreadsMode.tsx:374`, `ClueWeb.tsx:633,865`, `DecodeCard.tsx:207`, `EntryDetail.tsx:144`): Q3.
- The Spotify facade iframe: device check.
- ClueWeb progress (`:149`) goes through the store's `local-storage-adapter` (host storage since 2.4-A2).
- Scroll, resize and observers (`ThreadsTimeline.tsx:103-185`, `ClueWeb.tsx:549`) are real DOM.
- **A2 expected empty.**

**Parity (PR0, a-only per Q5; root `main`).**
- `threads` (`/?mode=threads`).
- One route per lens, since each mounts a different component family (`ThreadsMode.tsx:41-48`): `lens-love-story`, `-fashion`, `-taylors-version`, `-easter-eggs`, `-hidden-clues`, `-the-proposal`.
- `crossing`: `prepare` clicks "Where threads cross" (`:272-275`).
- An element clip of the ThreadsTimeline scrubber on `lens-fashion` (the only lens with a scrubber, `:52-58`).
- The fixture covers only Fearless and TLOAS, so some threads are sparse. Fine, but note it.
- That's 8 routes × 4 projects. Report the minutes. If parity goes past the 10-min WP1.1 budget, STOP and propose sharding; never drop projects silently.

**PRs.**
- 0: captures.
- A1: move-only. Split into A1a (top-level files) and A1b (the five subfolders) if there are more than 400 edited non-rename lines.
- A2: only if needed.
- D: set `slots.surfaces.threads = ThreadsMode`, drop `threads` from the D-6 mode fallback (native `ThreadsScreen` stops presenting), and flip the routes to both sides.

**S5 checks.**
1. The Threads tab opens the DOM gallery at the top (`LongLive.tsx:46-48`).
2. All 6 threads open. The fashion scrubber drags smoothly without fighting overscroll.
3. Opening a moment from a thread, then back, returns to the same thread scroll.
4. Crossings closes on back. Markers are tappable on Android.
5. The Spotify facade plays inline, or record that it's refused (Q3).
6. Clue-web reveal-on-scroll works. External links go out and come back.
7. A notification tap to `/?lens=hidden-clues` works cold and warm.
8. VO/TalkBack reads the gallery in visual order.
9. iPad rotation keeps the thread and its scroll.

## WP2.7 — Track guide + song

**Moves** → `packages/ui/src/reader/tracks/`:
- `TrackGuide.tsx` (222) and `TrackDetail.tsx` (580). `TrackGuide.tsx:14` imports `trackKey` from `./TrackDetail`, which re-exports it from `@swift2/experience` (`TrackDetail.tsx:20,59-62`). They move together, so the relative import holds. 2.4-C already re-pointed `EraSecretCard`.
- With Q2 accepted, also `TheoryGuide` (193) and `TheoryCard` (181).
- 2.4 has already moved MomentVideo, OverlayNav, TrackFivePill, `track-video`, `useSwipeNav` and `theme`. 2.5 has moved `useFocusTrap`.
- Add `@swift2/content-enrichment` (`TrackGuide.tsx:10`) to `packages/ui/package.json`, at apps/web's version.

**Host deps.**
- **A2 logic:** `TrackDetail.tsx:36-50` reads and writes the swipe hint with `window.localStorage`; switch it to `useHost().storage.local`. The web adapter must stay `localStorage`-backed so that parity's init script still applies (it sets `ll-track-swipe-hint-seen-v1`).
- `useResolveUrl` is already used (`TrackGuide.tsx:6`, `TrackDetail.tsx:5`).
- External anchors (`TrackGuide.tsx:200`, `TrackDetail.tsx:374`): Q3.
- `keydown` (`TrackDetail.tsx:124`, `TrackGuide.tsx:54`) is real DOM.

**Parity (PR0, a-only).** The fixture has 25 Fearless and 12 TLOAS tracks with dossiers.
- `guide`: `/?guide=fearless`, root `[role="dialog"][aria-label$="track guide"]` (`TrackGuide.tsx:69-74`).
- `song`: `/?song=<key>`, root `[role="dialog"][aria-label$="song detail"]` (`TrackDetail.tsx:150-155`).
  - Derive the key with `trackKey` from `@swift2/experience` against the fixture, not by hand.
  - Both dialogs are open at once (`store/index.tsx:300-307`), so never use `.first()`.
- An element clip of the song's prev/next OverlayNav.
- With Q2: `theories` (`/?theories=fearless`).

**PRs.**
- 0: captures.
- A1: move-only (≈5 files).
- A2: the swipe-hint storage swap, plus a test (shown once, persisted through `storage.local`).
- D:
  - Add TrackGuide, TrackDetail and TheoryGuide to `slots.overlays`.
  - Delete their `overlayFallback` entries, so native TrackGuideScreen and SongScreen stop presenting.
  - Flip the routes to both sides.

**S5 checks.**
1. `?guide=` and `?song=` notification taps work cold and warm, with the song stacked over the guide.
2. Android back goes song → guide → stream. The iOS edge swipe peels one layer at a time.
3. Swiping between songs (`useSwipeNav`) doesn't trigger the OS back gestures. The hint shows once. Android will show it every launch until storage is native-backed: record that, don't fail on it.
4. The track video plays inline (Q3).
5. VoiceOver order: title → facts → sections, and the OverlayNav buttons are labelled.
6. iPad landscape and split view.

## WP2.8 — Search

**Moves** → `packages/ui/src/reader/search/`:
- `SearchOverlay.tsx` (443) and `search-listbox-children.test.ts`.
- `lib/longlive/search.ts` **stays**. It's a 21-line re-export of `@swift2/experience`, still used by `clown-retrieve.ts`, `__fixtures__/legacy-search-builder.ts`, the `search*.test.ts` golden suite and `scripts/parity/regen-search-golden.mjs`.
- The moved file's `from '@/lib/longlive/search'` (`SearchOverlay.tsx:20-26`) becomes `from '@swift2/experience'`. That's an import-path line, so it's allowed in A1.

**Host deps.** No fetch, storage or external links, so **A2 is empty**.
- Real DOM only: `keydown` (`:112`, the `/` hotkey; `:125`, capture-phase Escape), the debounce (`:148`) and `scrollIntoView` (`:194`).
- `searchIndex` comes from `useReader()` (`:76`).
- The risk is the keyboard. The input sits in a `fixed inset-0` dialog (`:255-262`), and `dvh`/`visualViewport` under the keyboard is a CI blind spot (PLAN:284-292).

**Parity (PR0, a-only, `prepare`).**
- `search-open`: click `button[aria-label="Search the archive (press /)"]` (`TopBar.tsx:142`), then capture `[role="dialog"][aria-label="Search the archive"]`.
- `search-results`: type `fearless`, wait for the listbox (`:348`) to have options, then capture.
- An element clip of the combobox row at 390px.

**PRs.**
- 0: captures.
- A1: move-only (1 file + its test).
- D: add SearchOverlay to `slots.overlays` and delete its fallback (native SearchScreen); flip the routes to both sides. 2.8-D needs 2.5–2.7-D, so every result type lands on a DOM surface.

**S6 checks.**
1. The keyboard opens without the dialog jumping, and results stay visible above it (small iPhone; Android with gesture nav).
2. iPad hardware keyboard: `/` opens search, Escape closes it, and the arrows move the active option.
3. A result opens its moment/song/guide/thread. Back returns to search with the query kept, then to the page underneath.
4. Android back with the keyboard up closes the keyboard first, then search.
5. VO/TalkBack announces the combobox's expanded state and the result count.
6. iPad rotation with the keyboard up.

---

## Brief templates (fill each from its slice section; return ≤ 300 words each)

- **X-0 captures.**
  - Touch (additive only): `e2e/parity/{baseline,compare,negative}.spec.ts`, `helpers.ts`, the new `__screenshots__/<project>/a-<route>*.png`, `docs/one-ui/parity.md`.
  - Do: add the slice's routes and clips, update-baselines dispatch, two green runs, 1px negative.
  - `<Land BASE=main>`; return the run ids.
- **X-A1 move-only.**
  - Step 0 (read-only): re-derive the closure on the base. A file not on this list, or a non-type edge into a data module → STOP.
  - Touch: `packages/ui/src/reader/<slice>/**`, `packages/ui/src/index.ts`, `packages/ui/package.json` (apps/web versions), old paths (shims), moved tests, MAP.md, READER-MOVE.md.
  - Accept:
    - numstat + empty grep pasted;
    - parity green, no baseline changed (X-0's included);
    - probe hash == `fixture.json`;
    - lint ban passes;
    - both expo exports + identical fingerprint.
  - Narrow tests: `packages/ui/src/reader/<slice>`. `<Land BASE=main>`.
- **X-A2 logic.** Only the edits listed for the slice, each with a test, under the 400 tripwire, with the same parity acceptance. `<Land BASE=X-A1>`.
- **X-D app mount** (after the G0 GO; Codex mandatory).
  - Touch: `apps/mobile/dom/AppReader.tsx` (slots, interceptor, fallback), `dom/bridge/app-adapter*.tsx` (only when a member is added), `lib/dom-host-handlers.ts` (`presentNativeRoute` map), `dom/spike/**` (deletions only), `e2e/parity/**` (side flip + new b-* files only), `docs/one-ui/{parity,dom-host}.md`, MAP.md, tests.
  - NOT `packages/ui` (STOP if it needs a change), watchdog, config or native deps.
  - Accept:
    - web pixel-identical;
    - slice a-vs-b green;
    - Expo-DOM grep proof;
    - forced failure → native;
    - OTA delta reported;
    - device checks in the PR body.
  - Over 400 lines → D1 (handlers/adapter) and D2 (mount + parity). `<Land BASE=X-A2|X-A1>`.

## PM notes (not for executors)

- **Size** (non-test, `-M`):
  - A1s ≈100–250 edited lines (big in bytes, small in diff); 2.6 is the largest at 24 renames.
  - Ds ≈200–400; 2.5-D carries Q1+Q3, so it's the likely split.
- **Reviewer focus:**
  - A1: the grep proof and single-line shims.
  - D: the fallback can't loop (navigate → native → back → reopen); the interceptor skips same-origin and in-DOM links; `presentNativeRoute` stays the single presenter.
- **Merge freeze:** queue 2.8's A-series during S5. S5 starts after 2.7-D merges.
- **After 2.5-D:** if the spike resolver is retired, log it in PROGRESS. No apps/web component path into the app bundle remains except shims.
