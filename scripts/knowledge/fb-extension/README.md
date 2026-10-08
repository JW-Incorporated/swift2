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
  facebook.com URL. The background validates the token with `GET /hello` (→ `{ok, runId}`)
  **before** it replaces any session state: a token the receiver refuses, or a port nothing
  answers on, never overwrites a live run.
- `background.js` does all network I/O (`X-LLFB-Token` header): `GET /next` → navigates the same
  tab to the group → waits for the page's result → `POST /result` → repeat → `POST /finished`.
  Heartbeats (`POST /heartbeat`) every 30 s while a group is being scrolled. State lives in
  `chrome.storage.session` (content scripts cannot write it, so the handshake goes via a message).
- **Tab ↔ group binding.** A job is handed only to a page whose URL group segment is the job's
  `groupId`, the segment of the job's own URL, or one of the group's configured `aliases`
  (vanity names, optional in `fb-groups-checklist.mjs`). A page on any other group — a redirect,
  a navigation — gets no job and the job is reported `failed{redirected}` (or the challenge
  status its URL names); the content script re-checks its own URL before reading anything. If
  Facebook redirects a numeric group id to a vanity name, add that name to the group's `aliases`.
- `content.js` on `https://www.facebook.com/groups/*` does nothing unless the background says this
  tab has an active job. Then: check the profile, classify the page (not-member / unavailable /
  login / checkpoint / captcha stop immediately), scroll at a human pace (350–800 px smooth steps,
  1.2–3.2 s pauses, 12 % 4–8 s pauses), expand "See more", capture + merge units, stop per the CDP
  collector's rules (seven-days, feed-end, scroll cap, wall budget) plus **stunted** (≤ 3 feed
  slots after 20 scrolls). Then `LLFB.collectComments` (from `comments.js`). A small status box
  shows progress.
- **Scroll cap.** The receiver hands each job `maxScrolls`: default **400** (`DEFAULT_MAX_SCROLLS`
  in `fb-export-receiver.mjs`), overridable per group with `maxScrolls: <n>` in
  `fb-groups-checklist.mjs` (clamped to 1–2000). 250 finished the Vault in ~16 min; 2000 froze its
  renderer on 2026-10-01, so the wall budget alone is not a safe limit on a huge feed.
- **A dead tab fails only its group.** Heartbeat silence for 5 min (the receiver's stall
  watchdog), the run tab closing (`tabs.onRemoved`) or no heartbeat for 150 s (renderer gone;
  `llfb-liveness` alarm) makes the extension `POST /tab-lost` (or the watchdog fire): the receiver
  records that group `failed{stalled | tab-closed | renderer-gone}`, answers `/next` with 503
  meanwhile, and signals the launcher. `extensionCollect` (`fb-export-launch.mjs`) kills that
  Chrome (`taskkill /T /F`), waits for the profile lockfile to free (30 s), relaunches the profile
  on the same receiver URL (`--hide-crash-restore-bubble`, so the frozen group page is not
  reopened) and the remaining groups run. At most one relaunch per group; if Chrome cannot be
  relaunched the rest are `failed{chrome-relaunch-failed}`. A stall with no group in flight
  (Chrome never connected) still ends the run. After changing `background.js`, reload the
  extension (chrome://extensions) before the next run.
- **Ledger.** A `not-member` verdict is recorded but is **not** done: the next run retries the
  group (membership changes), and only `uploaded` / `unavailable` / `no-recent-posts` rows are
  skipped as `already-done`.
- **Uploaded html is built positively** (`buildPostHtml`), on the live feed shape read from the
  2026-09-30 DOM skeletons: the post card is **not** a `role=article` any more — every article
  inside a feed unit is a comment — so the post is anchored by Facebook's own
  `data-ad-rendering-role` markers: `profile_name` (author) → `story_message` /
  `[data-ad-preview="message"]` (body; absent on photo / video / shared-only posts) → attachments
  → `meta` (`title` / `description` of a link / share card) → the **action row** (Like button
  with the reaction count inside it + `like_button`, "Leave a comment" with the comment count +
  `comment_button`, Share + `share_button`, the "See who reacted" toolbar) → comment articles →
  the composer. Copied, in order: author (`profile_name`'s link, else the first own
  `a[aria-label]`), timestamps (permalink if any, the date-labelled link — `aria-label` "Tuesday,
  September 30, 2026 at 3:15 PM", text "2h" — and `abbr`/`time`), the message container clone,
  the `meta` title/description texts, post media between the header and the action row / count
  element, and `<n> reactions` / `<n> comments`. Nothing else is ever copied. Fail-closed rules:
  a message container holding any comment marker drops the unit; a post with no message is kept
  **only** when the post side holds no message container at all AND it is bounded by an author
  anchor and the action row / toolbar (`ok-no-message`) — a message outside the region
  (`message-outside-region`) or no end anchor (`no-message-container`) drops it
  (`coverage.sanitizeDropped`). The receiver fails the group when it dropped at least as many
  posts as it kept. The legacy shape (post article with comments nested inside) still works: the
  primary article is the first one holding a post anchor.
- Only recent units leave the page: the three-trailing-old-posts rule decides where the feed
  stops, and independently every non-pinned unit with a readable timestamp older than seven days
  is filtered out (`recentHarvestUnits`, also re-applied by the receiver).
- Comment coverage is never silent: `commentCoverage` is the four counts or an explicit
  `{error}` (collector missing / threw / returned nothing); no budget left for comments reports
  every eligible post as timed out. The receiver fails the group whenever posts were eligible and
  none was processed, on an `{error}`, or when a harvested group arrives without coverage.
- `harvest-core.js` holds the pure harvest logic, ported from `fb-export-helpers.mjs` /
  `fb-export-harvest.mjs`; `fb-extension.test.ts` checks it against those originals.

## Capture mode — reading Facebook's real markup without reading any post

`npm run knowledge:fb-export:capture` runs the same receiver + plain Chrome flow with the job
flag `capture:true` (dry run 2026-09-30: Vault dropped 96/131 posts for "no message container",
Kulto read no "N comments" count on 45/45 posts — both selectors are guesses, see
`buildPostHtml` / `extractEngagement`). Per group: at most **3 minutes** of the usual human-paced
scrolling, no comments, no ingest, no upload, no ledger, no weekly issue. The content script
(`skeleton.js`) sends, for up to 15 post containers per group (units `buildPostHtml` DROPPED
first, then a few kept ones), a **skeleton**:

- a nested tree `{tag, role?, attrs?, n, children?}`, depth ≤ 25, ≤ 600 nodes per unit, in which
  **every text node is `{text:'T', len}`**;
- attribute values only for `role`, `data-ad-*`, `data-pagelet`, `aria-posinset`, `dir`,
  `tabindex`, `type`, `data-testid` and enum-valued `aria-*`; `aria-label` / `title` / `alt` keep a
  **shape** (lower-cased; words kept only from a fixed UI vocabulary — comment(s), reaction(s),
  like, share(s), reply/replies, see, more, all, view, previous, most, relevant, write, a, an, by,
  their Tagalog equivalents, time units; digits → `9`; every other word → `w`); `href` keeps a
  **path shape** (known path words, every id/vanity → `:id`, query keys only); `class`, `src`,
  `style`, `id`, `name`, `value` are dropped; other attributes keep their name only (`-`);
- a `diagnosis` per unit: what `postRegion` cut on (`cutKind`), `postMessageVerdict`'s reason
  code (`ok` / `no-message-container` / `message-holds-…`), the count reader's result, and tag
  paths; plus `labels` (every aria-label and every ≤ 40-char text holding a digit, as shapes with
  their tag path) and `dataAttributes` (where `data-ad-*` / `data-pagelet` sit).

The receiver re-checks every skeleton against the same grammar (`isRedactedSkeleton`) and fails
the group (`capture-unredacted`) if anything else appears, then writes
`%LOCALAPPDATA%/longlive-fb/debug/<date>/<slug>.skeleton.json` — private, never the repo — and
prints counts and that path only. An extension that predates capture mode answers without
`skeletons` → `capture-unsupported`: reload it on `chrome://extensions`. `skeleton.test.ts`
proves no synthetic sentence, name, id or link survives a skeleton.

## Checkout guard

The extension is loaded from this checkout, so `npm run knowledge:fb-export` refuses to run
(summary says why, exit 1) unless the checkout is on `main` and has no uncommitted changes under
`scripts/knowledge` or `scripts/community`. If a scheduled run reports a refusal, put
`Projects/Swift2` back on a clean `main` and re-run; other sessions should use their own worktrees.

## Known limits

- **Profile.** Reading as personal, wrong-profile fires on ANY acting-as-a-Page signal: a readable
  `i_user` cookie, the configured Page's name/id in the top-bar account control, or
  acting-as-a-Page wording in the banner ("Your Page", "acting as", "Switch now" / "Switch back").
  Without the account control the profile is **unverified**: the run continues, but a not-member /
  unavailable verdict from an unverified profile is recorded `failed{unverified-profile-skip}` —
  never ledgered as a skip, never closes the weekly issue. A collected group from an unverified
  profile is still uploaded (owner choice, 2026-09-30: unverified must not stop every run).
- `reactions` / `commentCount` per post (`extractEngagement`): the numbers inside the Like /
  "Leave a comment" buttons first (also through Chrome's translator `<font>` wrappers); a Comment
  button that shows no number is a **confirmed 0** (the live feed omits it when nobody
  commented — 97/97 units with a thread showed one, none without), so comments.js skips the post;
  reactions fall back to "N reactions; see who reacted…" / "All reactions: N", then the summed
  per-reaction breakdown ("Love: 12 people"), else 0 when there is no reactions toolbar;
  otherwise `null` (unknown).
- Shared posts: the sharer's own caption is the message; the inner (shared) post's text is not
  copied, only the `meta` title/description of the card when Facebook renders one.
- A service-worker restart is harmless (state is in session storage); a full page reload mid-group
  restarts that group's scroll, with the wall budget still counted from the first start.
- `chrome.storage.session` holds at most 10 MiB, so a large result (full post HTML + comments) is
  not persisted: the background posts it from memory and the group page re-sends it until it is
  acknowledged. If the receiver is unreachable after retries, a `chrome.alarms` wake-up (every
  minute) resumes the persisted step.
- Accepted residual: a local process that serves its own `/start#<token>` page AND answers
  `GET /hello` for that token can still drive a run; such a process already has the Chrome
  profile, so this extension adds no new exposure.
