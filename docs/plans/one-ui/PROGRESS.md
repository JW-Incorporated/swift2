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
| 0.0 | in review (round 1 changes) | #4792 | Codex REQUEST CHANGES: (H) job timeout can cancel the summary step — reserve time / separate `needs` report job; (H) hung path has no reliable run URL — launch without `--wait`, persist run id/URL, then wait by id; (L) rollback 15 min tight. Fix queued for next free slot (resume WP0.0 executor), then Codex round 2 + reviewer |
| 0.1 | in progress | | executor |
| 0.2 | blocked on S1 | | |
| 0.3 | in progress | | executor |
| 0.3b | queued | | CORS on /content only |
| 0.4 | Stage 1 done; matrix awaiting Fable sign-off | | Must-add: react-dom 19.2.3, react-native-web ~0.21.0, @expo/metro-runtime ~57.0.16, **@expo/dom-webview ~57.0.1 (native — DOM no longer uses RNC webview)**, expo-haptics ~57.0.3, `android.softwareKeyboardLayoutMode: resize`, iOS associatedDomains + Android intentFilters (X4). Open: RNC webview 14.0.1 vs SDK pin 13.16.1; dom-webview has no onError/onLoad (watchdog = ready + terminate/renderGone + timeout; expo#46374 blank WKWebView); file:// storage persistence → WP0.5 device test; Tailwind v4 in DOM unproven. PM leanings for Fable: include universal links now (C3), keep RNC 14.0.1 unless export/doctor fails |
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
| 2026-10-02 | Confirmation pass | READY after 3 text edits: stale `[diag]` wording, §8/§9 order, PROGRESS/HUMAN-ACTIONS landing without `--delete-branch` | All applied |

## Decisions log (PM, reversible, one line each)

- 2026-10-02 — Plan calls C1–C6 (`PLAN.md`).
- 2026-10-02 — PM branch based on `origin/docs/one-ui-plan` (PR #4789, auto-merge set) because `main` didn't have PROGRESS.md yet; merge `origin/main` once #4789 lands.
- 2026-10-02 — **Owner directive (Joey, chat): "Leverage fable as much as you want to ensure this goes very well. And codex for reviews."** Applied as: (1) Codex adversarial review (`codex:rescue --background`, read via `codex-companion.mjs result`) on **every** WP PR, not only [codex] ones, alongside `reviewer`; (2) Fable reviews the brief before launch for every [codex]/native/architectural WP (0.3b, 0.4, 0.4b, 0.5, 1.1, 2.1, 2.2, 2.3) and does a final design-fidelity review of those PRs, plus the mandatory §4 triggers; (3) Fable sanity-checks any PM call that touches the proposal §4 design. The 3-concurrent-agent cap still holds, so reviews queue behind it.
- 2026-10-02 — Workers open PRs without auto-merge; the PM enables it after `reviewer` (+ Codex) passes, so nothing lands unreviewed.

## Log

- 2026-10-02 — Programme planned; awaiting kickoff.
- 2026-10-02 — Kickoff. PM worktree created; WP0.0, WP0.1, WP0.3 launched.
- 2026-10-02 — WP0.0 PR #4792 opened (yaml-lint pass); Codex review launched.
- 2026-10-02 — Fable reviewed 0.3b/0.4 briefs (12 required edits adopted). WP0.4 Stage 1 researcher launched. Codex round 1 on #4792: REQUEST CHANGES (fix queued; cap is 3 agents).
- 2026-10-02 — WP0.4 Stage 1 returned (matrix in Status row). WP0.0 round-1 fix sent to its executor.
- Queue for free slots, in order: (a) ~~WP0.0 fix~~ (running) → Codex round 2; (b) WP0.3b executor with Fable edits 1–6 (brief in PM scratch `briefs-0.3b-0.4.md` + Fable log row); (c) Fable signs the WP0.4 matrix when Stage 1 returns.
