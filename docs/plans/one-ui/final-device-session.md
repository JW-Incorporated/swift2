# Final device session — Android + iPhone (S8 drill + playback + iOS confirm)

**Test with:** Pixel 10 Pro (gesture nav) + iPhone 17 (TestFlight build 38)

---

## A. Get the latest update

1. Open Settings → Apps → Long Live → Force Stop
2. Open Long Live app → wait 10 seconds (let it update in background)
3. Force Stop again
4. Open Long Live → wait for it to fully load

---

## B. iPhone confirm: Diagnostics & shared UI

1. Open Long Live
2. Open Settings → About → tap the version number 7 times (or use the hot corner once the new UI appears)
3. Diagnostics panel opens
4. Tap "Reset watchdog"
5. Tap "Force shared UI" OFF (turns blue/disabled)
6. Tap "Force shared UI" ON (turns on)
7. Close Diagnostics with the hot corner
8. Force Stop the app completely
9. Open Long Live → wait for full load
10. Force Stop again
11. Open Long Live → should load the new UI
12. Open Diagnostics (hot corner)
13. Confirm Watchdog entry says "Mount: shared UI" ✓
14. Tap "Send report"

> **Note:** After PR #5042 lands, the "Force shared UI" switch disappears — skip steps 5–6 and the new UI is the default.

---

## C. Playback test

1. In the feed, tap a moment card with a YouTube video
2. Video plays without "error 153" ✓
3. Go back to feed, tap a song card
4. Spotify opens and plays ✓
5. Tap "Track guide" button
6. Track guide view opens ✓

---

## D. Looks & layout

1. Switch between different eras (e.g., folklore → Midnights)
2. Status bar color matches each era ✓
3. Scroll a moment detail up and down
4. Nothing is hidden behind the notch ✓
5. Scroll the filter pills row left/right
6. Pills stay in place (don't jump or collapse) ✓

---

## E. Offline mode

1. Open Settings → Airplane mode ON
2. Force Stop the app
3. Open Long Live
4. Scroll feed — content still shows (cached) ✓
5. Try tapping a moment (won't load new data, but no crash)
6. Go back to Settings → Airplane mode OFF
7. App refreshes and fetches live content ✓

---

## F. S8 crash drill (only when build includes Recovery screen)

1. Open Diagnostics (hot corner or Settings → About → tap version 7 times)
2. Toggle "the failure drill switch" ON (might be named "Force DOM failure" or "Enable recovery drill")
3. Close Diagnostics
4. Force Stop the app
5. Open Long Live
6. You should see "Something went wrong" error screen with:
   - Retry button
   - Privacy, Terms, Support links ✓
7. Tap Retry → still fails (drill is still on) ✓
8. Open Diagnostics (hot corner)
9. Toggle the failure drill switch OFF
10. Close Diagnostics
11. Tap Retry → the new UI loads successfully ✓

---

## G. After each section

Open Diagnostics → tap "Send report" (no typing needed).

---

## Done

If anything looks wrong, take a screenshot and send it — that's all.
