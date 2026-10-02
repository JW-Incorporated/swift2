# One UI programme: progress (the PM's memory)

The single source of live state for the PM. Rewrite the **Next actions**
block at every checkpoint; append to the **Log**; never let this file pass
~200 lines (fold old log lines into one summary line per finished phase).

## Next actions (for a fresh PM session)

0. Create the PM worktree (OPERATING-MODE §3) if it's missing. (Done
   2026-10-02; branch pushed.)
1. WP0.0, WP0.1, WP0.3 executors launched 2026-10-02. If a fresh PM finds
   no PR for one, check `gh pr list --search "one-ui"` / branch
   `feature/one-ui-wp0.x` before re-briefing.
2. On each PR: `reviewer` + Codex (every PR, per owner directive in the
   Decisions log), + Fable final review for the WPs listed there; then
   enable auto-merge. Fable reviews the WP0.3b and WP0.4 briefs before launch.
   As a slot frees up: WP0.3b, then the WP0.4 researcher audit (the
   native-needs matrix).
3. When WP0.1 merges and its OTA has published: file HA session S1 with
   the `human-actions` skill, pinning the build and update id, and tell
   Joey. The merge freeze starts.

## Status

| WP | State | PR | Notes |
|---|---|---|---|
| 0.0 | final fix (Fable-ruled) | #4792 | Codex r2: one Medium (timeout slack) → Fable: fix + reviewer, no r3. Executor applying after checking real EAS wait durations. Round-1 note: | Codex REQUEST CHANGES: (H) job timeout can cancel the summary step — reserve time / separate `needs` report job; (H) hung path has no reliable run URL — launch without `--wait`, persist run id/URL, then wait by id; (L) rollback 15 min tight. Fix queued for next free slot (resume WP0.0 executor), then Codex round 2 + reviewer |
| 0.1 | in review | #4793 | Marks added (provider-wiring in era-stream-data; first-era-paint via rAF in EraSection, first era only); full suite 8062 pass; both exports OK. Codex launched. Prior note: | Tracking issue **#4791** (`DIAG_ISSUE_NUMBER`). PM accepted 6-line App.tsx deviation; executor adding `provider wiring` + `first era paint` marks (touch set +EraStreamScreen/era-stream-data) before Codex + reviewer |
| 0.2 | blocked on S1 | | |
| 0.3 | review round 1 → fixing | #4794 | Codex r1 REQUEST CHANGES (P1 search order hidden by sort; P1 call-order-dependent global providers; P1 songMoods catalogue unwired; P2 hash ignores snapshot.version); reviewer APPROVE w/ findings (baked test could go vacuous). PM: preserve source order; scope+restore providers now, pure derivation = WP2.2. After fix: Codex r2 + Fable design-fidelity. Earlier note: | +674/-1 (~490 non-test; PM accepted over tripwire — one coherent contract). Full suite 8047 pass. Codex running (codex-companion job), then reviewer + Fable design-fidelity (snapshot is the §4 core contract). Risks: fromBundle rewires global providers; search-docs.ts mirrors web buildSearchIndex (WP2.2 to dedupe); WebCrypto-only hash |
| 0.3b | in progress | | executor launched with Fable edits 1–6 (serializable ApiFetch, no preflight, no Vary, preview curl, canonical host) |
| 0.4 | **matrix SIGNED (PM, 2026-10-02, per Fable)**; Stage 2 waits on #4792 + #4793 merged | | Final must-add: react-dom 19.2.3 · react-native-web ~0.21.0 · @expo/metro-runtime ~57.0.16 · @expo/dom-webview ~57.0.1 · expo-haptics ~57.0.3 · expo-screen-orientation (SDK-57 pin; lock phones portrait at runtime) · `android.softwareKeyboardLayoutMode: resize` · `orientation: default` · `ios.requireFullScreen: false` · `ios.associatedDomains: [applinks:longlivets.com, applinks:www.longlivets.com]` · one Android intentFilter autoVerify VIEW https both hosts BROWSABLE+DEFAULT · `expo.install.exclude: [react-native-webview]` (keep 14.0.1). Stage 2 brief must add: launch-attempted/ready strike record; own `reload()` when supplying onContentProcessDidTerminate; DOM `window.onerror`/`unhandledrejection` → async `reportError` prop; test page calls `onReady`; TWO fingerprint diffs (batch before/after; DOM-only edit leaves it unchanged = proves DOM bundles are OTA); do NOT touch `.well-known` (they're the switch — ship only with WP2.3). Superseded researcher notes: | Must-add: react-dom 19.2.3, react-native-web ~0.21.0, @expo/metro-runtime ~57.0.16, **@expo/dom-webview ~57.0.1 (native — DOM no longer uses RNC webview)**, expo-haptics ~57.0.3, `android.softwareKeyboardLayoutMode: resize`, iOS associatedDomains + Android intentFilters (X4). Open: RNC webview 14.0.1 vs SDK pin 13.16.1; dom-webview has no onError/onLoad (watchdog = ready + terminate/renderGone + timeout; expo#46374 blank WKWebView); file:// storage persistence → WP0.5 device test; Tailwind v4 in DOM unproven. PM leanings for Fable: include universal links now (C3), keep RNC 14.0.1 unless export/doctor fails |
| 0.4b | blocked on 0.4 | | minimal watchdog |
| 0.5 | blocked on 0.2/0.3/0.3b/0.4/0.4b | | |
| 0.6 | blocked on 0.5 | | Fable |
| 1.1 | blocked on 0.6 | | |
| 1.2 | blocked on 1.1 | | |
| 2.1–2.14 | blocked on G1 | | |
| G3–G5 | blocked | | |

States: queued · in progress · in review · merged · blocked on <x> · dropped (reason).

## Human-action sessions

| Session | State | HA # | Result |
|---|---|---|---|
| S1 | not filed | | |

## Fable log

| Date | Question | Advice | PM decision |
|---|---|---|---|
| 2026-10-02 | Plan review (pre-kickoff) | Blocker: no CORS on `/content`; watchdog too late; missing native-needs audit; `next/font` breaks parity; PROGRESS landing, kickoff prompt, OTA freeze undefined | All five required edits and the minor notes adopted (WP0.3b, WP0.4b, needs matrix, fonts in WP2.1, OPERATING-MODE §3/§6/§8 kickoff, `[diag]` → one issue, perceptual diff, OTA size budget) |

| 2026-10-02 | Pre-launch review of WP0.3b + WP0.4 briefs | 0.3b: bridge-serializable `ApiFetch` ({method,path,headers,body:string}); strip non-safelisted request headers (no preflight); expose ETag only if read; no `Vary: Origin`; curl the Vercel preview on `www.`. 0.4: must-add = any WP through G5; add orientation/tablet, splash-hold, web-browser, inline media, X4 prereqs, fonts, webview version rows; name DOM ready/crash/imperative mechanisms + release origin/IndexedDB persistence; test page proves `onReady` + crash callbacks in S3; store build only if fingerprint diff non-empty; Fable signs matrix at the stage 1→2 boundary instead of post-impl | All 12 REQUIRED adopted; 0.4 Stage 1 launched first (critical path), 0.3b next free slot |
| 2026-10-02 | WP0.4 native-needs matrix sign-off | Signed with amendments: +expo-screen-orientation, `orientation: default`, explicit `requireFullScreen:false`, universal links apex+www now (.well-known withheld until WP2.3), keep RNC 14.0.1 via install.exclude, stay on dom-webview (RNC onError wouldn't catch the real failures), DOM bundles must be OTA assets (prove via 2nd fingerprint diff) | Signed as amended |
| 2026-10-02 | #4792 two consecutive Codex rejections (mandatory) | Approach sound, no DEBUG/revert; r2 Medium real but non-material (URL already in summary before wait). Fix: secret-check cap 1, wait 34 (54/60). Land after scoped `reviewer` pass, no 3rd Codex round. Watch: first real store-build EAS run >25 min → raise wait, cut preflight | Adopted; PM added a check of real successful-run wait durations before fixing the 34 |
| 2026-10-02 | Confirmation pass | READY after 3 text edits: stale `[diag]` wording, §8/§9 order, PROGRESS/HUMAN-ACTIONS landing without `--delete-branch` | All applied |

## Decisions log (PM, reversible, one line each)

- 2026-10-02 — Plan calls C1–C6 (`PLAN.md`).
- 2026-10-02 — PM branch based on `origin/docs/one-ui-plan` (PR #4789, auto-merge set) because `main` didn't have PROGRESS.md yet; merge `origin/main` once #4789 lands.
- 2026-10-02 — **Owner directive (Joey, chat): "Leverage fable as much as you want to ensure this goes very well. And codex for reviews."** Applied as: (1) Codex adversarial review (`codex:rescue --background`, read via `codex-companion.mjs result`) on **every** WP PR, not only [codex] ones, alongside `reviewer`; (2) Fable reviews the brief before launch for every [codex]/native/architectural WP (0.3b, 0.4, 0.4b, 0.5, 1.1, 2.1, 2.2, 2.3) and does a final design-fidelity review of those PRs, plus the mandatory §4 triggers; (3) Fable sanity-checks any PM call that touches the proposal §4 design. The 3-concurrent-agent cap still holds, so reviews queue behind it.
- 2026-10-02 — WP0.3 over the 400-line tripwire (~490) accepted unsplit: one contract, splitting adds churn not safety. Fable added to WP0.3's final review (core §4 contract).
- 2026-10-02 — **WP0.0 acceptance changed by evidence:** 12 successful mobile-release runs: 5 waits 15–20 min, 7 waits 70–155 min (max 154.8, run 36859454944). PLAN's 60-min cap (and Fable's 34-min fix) would fail legit store builds incl. WP0.4's. Decision: wait 195 / job 225; URL persisted before the wait; split-cap + slow-wait investigation → follow-up issue. Supersedes Fable's numbers (evidence Fable didn't have), not its approach.
- 2026-10-02 — Play app-signing SHA-256 HA deferred until WP2.3 is near (the `.well-known` files must not ship before WP2.3; asking now isn't load-bearing).
- 2026-10-02 — WP0.1: App.tsx deviation accepted; missing paint/wiring marks go in the same PR (S1 needs launch-to-eras).
- 2026-10-02 — Workers open PRs without auto-merge; the PM enables it after `reviewer` (+ Codex) passes, so nothing lands unreviewed.

## Log

- 2026-10-02 — Programme planned; awaiting kickoff.
- 2026-10-02 — Kickoff. PM worktree created; WP0.0, WP0.1, WP0.3 launched.
- 2026-10-02 — WP0.0 PR #4792 opened (yaml-lint pass); Codex review launched.
- 2026-10-02 — Fable reviewed 0.3b/0.4 briefs (12 required edits adopted). WP0.4 Stage 1 researcher launched. Codex round 1 on #4792: REQUEST CHANGES (fix queued; cap is 3 agents).
- 2026-10-02 — WP0.4 Stage 1 returned (matrix in Status row). WP0.0 round-1 fix sent to its executor.
- 2026-10-02 — WP0.0 fix pushed (no-wait start + persisted URL + wait-by-id; rollback 30 min); Codex round 2 job `task-muraaz8s-sdn7h0`. WP0.3 → #4794, Codex launched. WP0.1 → #4793, marks follow-up running. Fable signing WP0.4 matrix.
- 2026-10-02 — WP0.3b executor launched. Pending Codex jobs to read with `codex-companion.mjs result <id>`: `task-muraaz8s-sdn7h0` (#4792 round 2), `task-murabxyy-7mhaw0` (#4794 round 1).
- Queue for free slots: reviewer on #4792 (after Codex r2 clean) → auto-merge; reviewer + Fable on #4794 (after Codex); Codex + reviewer on #4793 (after marks); WP0.4 Stage 2 brief (after Fable signs matrix + #4792/#4793 merged).
