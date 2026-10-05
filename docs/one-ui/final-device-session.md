# One UI final device session

Checks that need a physical device (or emulator) and cannot be covered by unit tests or the parity harness.

## Offline era/thread art (#5074)

Native downloads era covers and first-party primary moment images into `swift2-art-v1/` after the first content refresh and hands the WebView an `art-map.js` of `url -> file://`. Unverified: iOS WKWebView may refuse `<img src="file://...">` outside its read-access root; the `onError` fallback keeps that safe (remote URL), so this check tells us whether the cache actually helps.

Run on iOS and Android:

1. Launch online, open the era stream, wait ~30 s (art syncs after first paint; at most 10 MB per launch, so repeat the launch two or three times to fill the 12 era covers).
2. Force-quit, enable airplane mode, clear the WebView cache (Android: Settings > Apps > Android System WebView > Storage > Clear cache; iOS: delete and reinstall is too destructive, so skip and rely on step 4), relaunch.
3. Era covers show with no network.
4. Open Diagnostics and read the probe `art` field: `map` is the number of cached images, `loaded` the `file://` images that rendered, `fallback` the `onError` falls back to the remote URL. `loaded > 0` and `fallback = 0` means `file://` works in that WebView. `fallback > 0` with `loaded = 0` means the WebView refused `file://` and the offline path needs a different delivery (note it on #5074).
