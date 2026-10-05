# One UI device checklists (draft, 2026-10-04)

Ready to paste into HUMAN-ACTIONS.md. Wording is for the tester, not for engineers.

What the tester never types: build numbers, update ids, timings. Those reach us
automatically in the [diag] reports posted to GitHub issue #4791 when you tap
**Send report** or run **Speed test mode**. If a step fails, just say what you
saw on screen.

Words used below:
- **Force-quit (iPhone/iPad):** swipe up from the bottom edge and hold until the
  app cards appear, then swipe the Long Live card up and away.
- **Force-stop (Android):** swipe up from the bottom and hold, then swipe the
  Long Live card up and away.
- **Diagnostics:** the hidden menu. Open it by tapping 7 times quickly in a
  screen corner (the step says which one). Close it with **Done** (top right).

---

## iOS-1 (gate before Wave 4)

**Build:** TestFlight build 38, plus OTA update `<WAVE 1-3 OTA — PM fills in>`.
**Devices:** iPhone (the owner coordinates with the iPhone tester), iPad (the
owner's own).
**Before you start:** Wi-Fi on, about 20 minutes per device.

### iPhone (7 steps)

1. **Install and update.** Open the **TestFlight** app, tap **Long Live**, tap
   **Install** (or **Update**). Open Long Live, wait 10 seconds, force-quit it,
   then open it again.
   *Pass:* the app opens to the era screen.
2. **Turn on the new reader.** Tap 7 times in the **bottom-left corner, next to
   the thin home bar** at the bottom of the screen. The new reader is the default (no switch to turn on). In Diagnostics tap **Done**, force-quit, reopen (a device that cached the old config shows it from its second launch). Open
   Diagnostics again the same way and tap **Send report**, then **Done**.
   *Pass:* Diagnostics opened both times and the button said it sent.
3. **Hidden corner, other spots.** Tap 7 times in the **top-left corner** (by
   the clock). Close with Done. Then tap 4 times bottom-left and 3 times
   top-left.
   *Pass:* Diagnostics opened both times.
4. **Look, photos, menus, scrolling.** Tap every button on the bottom bar once,
   then open the era picker (top) and switch eras. Scroll the era stream
   non-stop for about 2 minutes. Open 3 moments that have photos, in 2 eras.
   *Pass:* it looks like longlivets.com (same letters, same layout), every
   bottom-bar page opens, real photos (not grey boxes), and the screen never
   went blank or restarted.
5. **YouTube.** Open a moment with a YouTube video and tap play.
   *Pass:* the video plays inside the app (no "error" box).
6. **Offline.** With Wi-Fi on, first open Long Live, wait 30 seconds, then force-quit and reopen it twice (it saves era pictures for offline use, #5074). Then turn on **Airplane Mode** (and make sure Wi-Fi is off),
   force-quit, reopen.
   *Pass:* posts and era pictures still show. Turn Airplane Mode off after.
7. **Speed test.** Open Diagnostics (bottom-left, 7 taps; if no strip is tappable, type `longlive://diag` into the phone browser or a Notes link and tap it), switch on **Speed
   test mode**, tap **Done**. Then:
   - 5 times: force-quit, reopen, wait until the eras show;
   - 5 times, quickly: swipe up to go home, tap Long Live again straight away.
   It sends itself after the 10th launch. Open Diagnostics once more.
   *Pass:* it says **Speed test done ... PASS**. (FAIL or "not enough
   launches" = tell us; no need to copy the numbers.)

### iPad (8 steps)

1. **Install and update.** **TestFlight** app > **Long Live** > **Install** (or
   **Update**). Open it, wait 10 seconds, force-quit, reopen.
   *Pass:* the app opens to the era screen.
2. **Turn on the new reader.** Tap 7 times in the **bottom-left corner by the
   home bar**. The new reader is the default; **Done**,
   force-quit, reopen. Open Diagnostics again, tap **Send report**, **Done**.
   *Pass:* Diagnostics opened both times; report sent.
3. **Hidden corner, other spots.** 7 taps **top-left**; close. Then 4 taps
   bottom-left + 3 taps top-left.
   *Pass:* Diagnostics opened both times.
4. **Look, photos, letters, both ways round.** Hold the iPad upright: scroll,
   open 3 photo moments in 2 eras. Turn it sideways and do the same.
   *Pass:* looks like longlivets.com both ways, real photos, nothing cut off.
5. **Split View stress.** Tap the **three dots (•••) at the top centre** of the
   screen, choose **Split View**, pick any other app. Drag the black divider
   left and right 3 times. Then scroll Long Live non-stop for 2 minutes and open
   10 moments.
   *Pass:* Long Live never goes blank, white, or reloads itself.
6. **Video and music.** Open a moment with a YouTube video and tap play. Then
   open the **Taylor's Version** thread and tap play on the Spotify player.
   *Pass:* both play inside the app.
7. **Offline, then the safety net.** With Wi-Fi on, first open Long Live, wait 30 seconds, then force-quit and reopen it twice (it saves era pictures for offline use, #5074). Then turn on **Airplane Mode** (Wi-Fi off),
   force-quit, reopen: posts and era pictures should show. Still offline, open
   Diagnostics, set **Force DOM failure** to **throw**, **Done**, force-quit,
   reopen.
   *Pass:* first launch shows content; second launch shows the older app screens
   (not a blank page). Then put it back: Diagnostics > Force DOM failure
   **off** > **Reset watchdog** > Done, Airplane
   Mode off, force-quit, reopen.
8. **Speed test.** Same as iPhone step 7 (Speed test mode on; 5 force-quit
   relaunches; 5 quick go-home-and-back relaunches).
   *Pass:* Diagnostics says **Speed test done ... PASS**.

**Reply (one line per device):** `iPhone: pass 1-6, fail 7: <what you saw>` /
`iPad: pass 1-8`

**What the PM reads from the reports (no tester action):** build + update id,
cold/warm worst-of-5 vs 2.5 s / 1 s, image loads, offline art (probe `art`: loaded > 0 and fallback = 0 means file:// art works; fallback > 0 with loaded = 0 means the WebView refused it, note on #5074), fonts, and the H4/D2
ready→ack round trip on both iOS devices. Also needed for the gate (PM, not
tester): a fresh green WebKit (WP1.1) CI run cited in PROGRESS.md.

---

## S5 Android (after Wave 4: slices 2.4-2.7 + the #4953 inset fix)

**Build:** Play internal build 1.0.0 (18), plus OTA update `<WAVE 4 OTA — PM
fills in>`.
**Device:** Pixel 10 Pro (gesture navigation).
**Before you start:** Wi-Fi on, about 20 minutes.

1. **Update and turn on the new reader.** Open Long Live, wait 10 seconds,
   force-stop, reopen. Tap 7 times in the **bottom strip** (just above the
   gesture bar). Tap **Send
   report**, then **Done**.
   *Pass:* Diagnostics opened and the report sent.
2. **Top of the screen.** Look at the top while scrolling the era stream. Then
   tap 7 times in the **top strip** (by the clock); close. Then 4 taps bottom +
   3 taps top.
   *Pass:* no black band at the top, the filter pills stay right under the top
   bar while scrolling, and Diagnostics opened both times.
3. **Bottom bar and era picker.** Tap every button on the bottom bar once. Open
   the era picker and switch between 3 eras. Use the back gesture (swipe in from
   the screen edge) after each.
   *Pass:* every button opens its page, eras switch, back returns where you were.
4. **Moments, photos, YouTube.** Open 3 moments with photos, then a moment with
   a YouTube video and tap play. Swipe back to close.
   *Pass:* real photos, the video plays in the app (no "error 153"), back closes
   the moment.
5. **Track guide and search.** Open the track guide, tap a song, go back. Open
   search, type `cardigan`, tap a result.
   *Pass:* both open and back works.
6. **Merch and community.** Open merch and tap a product: it opens in the
   browser; then return to Long Live. Open the community page.
   *Pass:* you come back to the same spot in merch, and community loads.
7. **Offline.** With Wi-Fi on, first open Long Live, wait 30 seconds, then force-stop and reopen it twice (it saves era pictures for offline use, #5074). Then turn on Airplane Mode and Wi-Fi off, force-stop, reopen.
   *Pass:* posts and era pictures show. Turn Airplane Mode off after.
8. **Speed test.** Diagnostics (bottom strip, 7 taps) > **Speed test mode** on >
   **Done**. Then:
   - 5 times: force-stop, reopen, wait for the eras;
   - 5 times, **quickly** (Android may close the app if you wait): swipe home,
     tap Long Live straight away.
   It sends itself after the 10th launch. Open Diagnostics.
   *Pass:* it says **Speed test done ... PASS**.

**Reply:** `pass 1-6, fail 7: <what you saw>`

**What the PM reads from the reports (no tester action):** build + update id,
5 cold / 5 warm worst-of-5, image loads (#4895), ready→ack.
