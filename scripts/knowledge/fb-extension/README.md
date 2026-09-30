# Long Live FB export — Chrome extension

Replaces the CDP collector. Facebook stunts group feeds in any CDP-controlled Chrome; a content
script in plain Chrome (no `--remote-debugging-port`) sees the normal feed. See `PLAN.md`
(FB-EXTENSION-1) for the receiver protocol (schema v1).

## One-time setup (owner)

1. Open Chrome with the dedicated export profile (`%LOCALAPPDATA%/longlive-fb/chrome-profile`) —
   the same profile the weekly task launches, already signed in to Facebook.
2. Go to `chrome://extensions`, switch **Developer mode** on (top right).
3. Click **Load unpacked** and choose this folder (`scripts/knowledge/fb-extension`).
4. Leave it enabled. After a `git pull` that changes these files, press the extension's reload
   (circular arrow) button on `chrome://extensions`.

Chrome 137+ ignores `--load-extension` for branded (Google Chrome) builds, so the launcher cannot
inject it per run — it must be loaded once, by hand, in that profile. Chrome keeps it across
restarts.

## What it does

- `content.js` on `http://127.0.0.1:<port>/start#<token>` passes port + token to the background
  service worker and scrubs the token from the address bar. The token is never put on a
  facebook.com URL.
- `background.js` does all network I/O (`X-LLFB-Token` header): `GET /next` → navigates the same
  tab to the group → waits for the page's result → `POST /result` → repeat → `POST /finished`.
  Heartbeats (`POST /heartbeat`) every 30 s while a group is being scrolled. State lives in
  `chrome.storage.session` (content scripts cannot write it, so the handshake goes via a message).
- `content.js` on `https://www.facebook.com/groups/*` does nothing unless the background says this
  tab has an active job. Then: classify the page (not-member / unavailable / login / checkpoint /
  captcha stop immediately), scroll at a human pace (350–800 px smooth steps, 1.2–3.2 s pauses,
  12 % 4–8 s pauses), expand "See more", capture + merge units, stop per the CDP collector's rules
  (seven-days, feed-end, scroll cap, wall budget) plus **stunted** (≤ 3 feed slots after 20
  scrolls). Then `LLFB.collectComments` (from `comments.js`) if present. A small status box shows
  progress.
- Only recent units (the seven-day rule, `recentHarvestUnits`) leave the page.
- `harvest-core.js` holds the pure harvest logic, ported from `fb-export-helpers.mjs` /
  `fb-export-harvest.mjs`; `fb-extension.test.ts` checks it against those originals.

## Known limits

- **Wrong profile** is detected only if the `i_user` cookie (acting as a Page) is readable from the
  page; when reading as a Page, or if the cookie is HttpOnly, it is not detected.
- `reactions` / `commentCount` per post are best-effort label matches (`null` when unknown).
- A service-worker restart is harmless (state is in session storage); a full page reload mid-group
  restarts that group's scroll, with the wall budget still counted from the first start.
