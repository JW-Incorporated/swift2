# PLAN — FB export via a Chrome extension (FB-EXTENSION-1, 2026-09-30)

Why: Facebook stunts the feed for any CDP-controlled Chrome; a content-script extension in plain
Chrome (no CDP) loads normally (Kulto 15, Vault 46 slots / 3 min). Base: feat/fb-export-page-profile.

## Flow
1. `fb-export-run` (weekly task) → receiver on `127.0.0.1:<random port>`, random 32-byte hex token.
2. Launcher starts plain Chrome (profile `%LOCALAPPDATA%/longlive-fb/chrome-profile`, NO
   `--remote-debugging-port`) on `http://127.0.0.1:<port>/start#<token>`.
3. Extension content script on that page reads port+token → `chrome.storage.session`; background
   loop: `GET /next` → navigate tab to the group URL → content script harvests (+ comments) →
   background `POST /result` → `GET /next` … until `{done:true}`; then `POST /finished`.
   The token never appears on a facebook.com URL. All network I/O is in the background service
   worker (`host_permissions: http://127.0.0.1/*`), never from the facebook.com page.
4. Receiver turns each result into the existing `collected` shape → `gateExport` → `ingestOne` →
   `uploadOne` → ledger → weekly-issue comment/close (all unchanged, via `runExport({collect})`).

## Schema v1 (every request: header `X-LLFB-Token: <token>`; wrong/missing → 403; body ≤ 64 MB)
- `GET /next` → `{done:false, slug, label, groupId, url, wallBudgetMs, maxScrolls, comments:{topN:20,
  maxPerPost:50, pacingMs:[2000,5000]}}` or `{done:true}`. Vault budget 75 min, others 20 min.
- `POST /result` → `{v:1, slug, extVersion, status, stopReason, message?,
  units:[{key, position, html, ownTimestamp, ignoreForAge, reactions, commentCount}],
  comments:[{postKey, postUrl, comments:[{id, author, text, ts, reactions,
  replies:[{id, author, text, ts, reactions}]}]}],
  coverage:{harvestedCount, recentCount, slotCount, coverageAgeMs, partial, ageRuleMet, scrolls,
  wallMs}, collectedAt}` → `{ok:true}`.
  - `status`: collected | not-member | unavailable | login | checkpoint | captcha | wrong-profile
    | stunted | failed. `stopReason`: seven-days | feed-end | scroll-cap | wall-budget | stunted-feed.
  - `stunted` = slot count still ≤ 3 after 20 scrolls (the CDP symptom) → run STOPS.
  - login | checkpoint | captcha | wrong-profile | stunted stop the whole run (receiver answers
    `/next` with `{done:true}` afterwards).
- `POST /heartbeat {slug, scrolls, slotCount}` every 30 s → receiver's stall watchdog (5 min).
- `POST /finished {}` → receiver resolves; the launcher closes Chrome.
- Comments are PRIVATE: stored only under `%LOCALAPPDATA%/longlive-fb/comments/<week>/<slug>.json`,
  never in the repo, never uploaded, never logged beyond counts.

## Ownership (one agent, one worktree, one branch off feat/fb-export-page-profile)
- A `fbx-a` (Opus): `scripts/knowledge/fb-extension/{manifest.json,background.js,content.js,
  harvest-core.js,README.md}` + `scripts/knowledge/fb-extension.test.ts`. Port expand/capture/
  merge + stopDecision/trailingOldBoundary/recentHarvestUnits/harvestCoverageAge/classifyPage
  into `harvest-core.js` (plain script, `globalThis.LLFB`; vitest loads it via `vm`). Human-paced
  scroll (test extension rhythm), per-unit `reactions`/`commentCount`, heartbeat, stunted detect.
  After the feed: `await globalThis.LLFB.collectComments?.(units, job.comments)` — B supplies it.
- B `fbx-b` (Opus): `scripts/knowledge/fb-extension/comments.js` (+ `comments.test.ts`) and
  `scripts/knowledge/fb-comments.mjs` (+ test): parse/validate/normalize the comments payload,
  `storeComments({root, week, slug, comments})` → private file, `commentSummary()` counts only.
- C `fbx-c` (Sonnet): `scripts/knowledge/fb-export-receiver.mjs` (+ test): `startReceiver({groups,
  token, root, outputDir, now, onResult?})` → `{port, url, done: Promise<results[]>, close()}`;
  converts a result into the `collected` shape (writes HTML via `buildHarvestedHtml(recent units)`
  to `outputDir/exportFileName(...)`), calls `storeComments`, enforces token + watchdog + stop rules.
- D `fbx-d` (Sonnet): `scripts/knowledge/fb-export-launch.mjs` (+ test) (plain Chrome, no CDP,
  total wall = Σ budgets + 10 min, kills Chrome at the end); `fb-export-run.mjs` wiring
  (`collect` = receiver + launcher); `fb-groups-checklist.mjs` per-group `wallBudgetMs`;
  `fb-export-task.ps1` (task time limit 3 h); docs (`docs/` runbook + decisions.md entry);
  delete the CDP path (`fb-export-browser.mjs`, `fb-export-collect.mjs` CDP bits, puppeteer use).

## Verify (per part; each agent runs its own, full suite only once at the end by Opus)
- A: `npx vitest run scripts/knowledge/fb-extension.test.ts` + manifest JSON parses.
- B: `npx vitest run scripts/knowledge/fb-comments.test.ts scripts/knowledge/fb-extension/comments.test.ts`
- C: `npx vitest run scripts/knowledge/fb-export-receiver.test.ts` (real HTTP on port 0: 403 without
  token, full synthetic round trip → collected file the real gate accepts).
- D: `npx vitest run scripts/knowledge/fb-export-launch.test.ts scripts/knowledge/fb-export-run.test.ts`
- Merge: `npx vitest run scripts/knowledge scripts/community/fb-export-ingest.test.ts` + lint.

## Rules for every agent
PR later, by Opus only. No git restore/checkout --/clean/reset --hard. Never touch scripts/social/**.
Never read dotenv files. The Facebook password never enters code paths here, logs or args.
Synthetic fixtures only — no real post/comment text. No live Facebook runs. A guard denial = stop.
