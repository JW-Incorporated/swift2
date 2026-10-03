# WP2.3 Bridge protocol: executor briefs (draft, six PRs A–F)

Drafted 2026-10-02 against `origin/main` @ `b09c8246`. Sources: PLAN.md §WP2.3, "Calls made up front" (C1–C6), "Cross-cutting concerns" (X1–X4); OPERATING-MODE.md §7 and §9; PROGRESS.md 16:54 (WP2.3 prep).
**Codex adversarial review applies to all six PRs** (PLAN marks WP2.3 `[codex]`). The PM runs it, not the executor.

## FABLE REQUIRED (2026-10-02 19:00) — apply to the briefs before launch
1. A depends on WP2.1-B merged (shared types in packages/ui/src/host/types.ts), not only 2.1-A.
2. A defines the exhaustive `HandlerMap` type in packages/ui/src/bridge; B implements it; C imports it (C depends only on A).
3. C contract test gets a third leg: HostAdapter member signatures ⇄ PayloadOf/ResultOf.
4. D `navigate` semantic: in-DOM routing stays in the DOM (history API, X4 paths); DOM→native `navigate` only for routes native still owns, else `{ok:false, code:'invalid'}`.
5. Transport isolation (G0 guard): everything Expo-DOM-specific (`inbox` prop, `bridge` native action) lives in exactly two files — B's SharedUiHost wiring and C's `dom/bridge/transport-expo.ts`; envelope/client/host transport-neutral. State in A/B/C acceptance.
RULING ClownChat: /api/clown stays out of F; built later in the WP2.11 Clownbot slice as "F2": F's allowlist gets per-endpoint `nativeSession: true`; native holds the server-issued cookie in memory and re-attaches it for /api/clown only; nothing crosses the bridge, no DOM storage, no server change. Wrong-signal: clown-session-store.ts cookie attributes rotate per response.
TIMING: wait for G0 → 2.3-D, E, F, 2.3-B step 4, 2.3-C step 3. Proceed after G1 lands → 2.3-A, 2.3-B logic, 2.3-C client/contract.

## PM rulings (2026-10-02 18:58) — supersede the open questions below
1. Bridge version range = JS constant in bridge-host.ts (DOM bundle ships in the same OTA update group; no native change). 2. /api/clown EXCLUDED from F (HttpOnly cookie session); in-app ClownChat handling = open question for Fable. 3. Device endpoints via E (notification commands), not F. F also extends the X1 CORS rule to /vault/live/* and the share-card PNG. 4. Approved: optional AbortSignal `signal` on ApiFetch (packages/content/src/api-fetch.ts added to F touch set). 5. D depends on WP0.5b (#4822) merged. Every Land line: never --delete-branch a branch with open child PRs.

## Open questions for the PM (answer before dispatching the PR named)

1. **Version range "declared natively" (A/B).** The RN JS and the DOM bundle ship in the same embedded bundle and the same OTA. That means the native side's `{min,max}` can be a **JS constant in `bridge-host.ts`**, with no `app.json`/native change and no fingerprint change. A real mismatch can only come from the Fable fallback mount or a half-applied update. Recommendation: use a JS constant and keep the range check as a defensive, add-only rule. Do **not** put it in `app.json` `extra`, which would risk a fingerprint change. Confirm.
2. **`/api/clown` session (F).** `ClownChat.tsx:163-167` keeps session continuity through an **HttpOnly cookie**. "Never forwards cookies" plus "no auth/session in the bridge" means a proxied in-app clown chat loses continuity. Options: (a) leave `/api/clown` off F's allowlist and keep it as a later slice's call (recommended); (b) proxy it statelessly and accept a degraded chat; (c) native attaches `clown-session-store.ts`'s session, which breaks the no-auth rule.
3. **Device endpoints (E vs F).** `/api/devices/register` (`web-push-client.ts:110,:150`) and `/api/devices/:id/prefs` GET/PUT (`WebNotificationSettings.tsx:96,:113`) are web-push plumbing. In the app they should map to E's native `notifications.*` commands, not the api proxy. Recommendation: F's allowlist leaves them out. Related: two same-origin fetches are neither `/api` nor `/content/**`, so X1's CORS doesn't cover them: `use-live-data.ts:35` (`/vault/live/{era}`) and `share-payload.ts:103` (share-card PNG). Which WP owns them?
4. **`ApiFetch` has no cancellation (F).** `packages/content/src/api-fetch.ts:23` is `(req) => Promise<ApiResponse>` and takes no `AbortSignal`. The prep said "api cancellable". The recommended fix is additive: `(req, opts?: { signal?: AbortSignal })`. That adds `packages/content/src/api-fetch.ts` to F's touch set. Approve the expansion?
5. **D needs WP0.5b first.** The `backTick` counters D replaces live only on `origin/feature/one-ui-wp0.5b` (`SharedUiHost.tsx:43,75,110`, `dom/ReaderSpike.tsx:25,48,163`, `dom/spike/reader-modules.ts:11-32`), not on main. Confirm that 0.5b merges before D. Otherwise D has nothing to migrate and should only build the queue.

Also note (not a question): PLAN §WP2.3's touch set says `apps/mobile/dom/bridge/**`, while the split puts the host in `apps/mobile/lib/bridge-host.ts`. The briefs use both: host logic in `lib/` (pure and testable, like `dom-host-handlers.ts`), and the DOM-side app adapter in `dom/bridge/`.

**Cited seams on origin/main:**
- `ApiFetch`: `packages/content/src/api-fetch.ts:23`, re-exported from `packages/content/src/index.ts:15`. `ApiRequest` has `path: \`/api/${string}\``, `ApiResponse` is `{status, headers, body: string}`, and the web default is `webApiFetch`. From #4796.
- Watchdog: `apps/mobile/lib/watchdog.ts`. It is **292 lines, so don't grow it**. `createAttemptMonitor` (`:238`) only strikes on `error` before ready, and `READY_TIMEOUT_MS = 10_000`.
- DOM signal handlers: `apps/mobile/lib/dom-host-handlers.ts` (`onReady`, `reportError`).
- Mount: `apps/mobile/components/SharedUiHost.tsx`. From #4811.
- Cold/warm notification taps: `apps/mobile/App.tsx:307` (`getLastNotificationResponseAsync`) and `:310` (`addNotificationResponseReceivedListener`).

**Stack and order:**
- A needs WP2.1-A (the `packages/ui` skeleton) merged.
- B and C need A.
- D needs B and C, plus WP0.5b.
- E needs B, C and D (it uses `navigate`).
- F needs B and C, WP0.3b (merged, #4796), and WP2.1-B (the host adapter with `apiFetch`).

**Native fingerprint check (every PR):** run `npx @expo/fingerprint .` in `apps/mobile`, both on the PR base and on the branch, and compare the top-level `hash`. The hashes must be identical: the bridge is JS-only (C3). If they differ, stop and report. Do not "fix forward".

---

## WP2.3-A: Envelope, typed union, version rules

```
WP 2.3-A: Bridge envelope + typed message union + version rules. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3).
Goal: One platform-neutral, JSON-only TypeScript definition of every bridge message, plus the version and unknown-type rules, so the native host and the DOM client can't drift.
Depends on: WP2.1-A (packages/ui skeleton) MERGED. Check with `gh pr view <n> --json state` first. If it isn't merged, stop and report. Base: origin/main. Branch: feature/one-ui-wp2.3a.
Touch set: packages/ui/src/bridge/** (new: envelope.ts, messages.ts, version.ts, index.ts, *.test.ts), packages/ui/src/index.ts (re-export only), MAP.md. Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. envelope.ts: `Envelope = { v: number; id: string; kind: 'cmd'|'res'|'evt'; type: string; payload: unknown; ts: number; seq?: number }`.
     - `res` reuses the `id` of the `cmd` it answers and carries `{ ok: true, value } | { ok: false, error: { code: 'unsupported'|'timeout'|'cancelled'|'invalid'|'failed', message } }`.
     - Add `parseEnvelope(raw: unknown): Envelope | null`. It is a hand-written guard, with no new dependency. It rejects non-objects, a wrong `kind`, a non-string `id`/`type` and a non-finite `ts`.
     - Payloads must be JSON-serialisable (Expo DOM props and actions are JSON). No functions, Dates, Maps or class instances.
  3. messages.ts: a discriminated union keyed by `type`, with a direction and a payload/result type per message. Declare every PLAN §WP2.3 type now, even where D/E/F implement it later. That lets the contract test in C cover the full set.
     - DOM→native cmd: `navigate {path:`/${string}`, replace?}`, `share {title?, text?, url}`, `haptic {kind:'light'|'medium'|'heavy'|'success'|'warning'|'error'|'selection'}`, `openExternal {url}`, `notifications.status`, `notifications.request`, `notifications.register`, `notifications.updatePrefs {prefs}`, `api {req: ApiRequest}` (import the type from @swift2/content, `ApiFetch` seam = packages/content/src/api-fetch.ts:23), `cancel {targetId}`.
     - DOM→native evt: `ready {v, range?}`, `diag {stage, detail?}`, `ack {seq}`.
     - native→DOM cmd: `back` → result `'handled'|'exit'`.
     - native→DOM evt: `insets {top,right,bottom,left}`, `contentVersion {token}`, `navigate {path, source:'notification'|'deeplink'}`.
     - Export `CommandType`, `EventType`, `PayloadOf<T>`, `ResultOf<T>`, and a runtime `COMMAND_TYPES`/`EVENT_TYPES` readonly array that `satisfies` the union. That array gives you exhaustiveness.
     - X4: `navigate.path` uses the web path and query shape exactly (`/era/<id>?…`). It is never an app-only route name.
  4. version.ts: `BRIDGE_VERSION = 1`, `inRange(v, {min,max})`, `negotiate(domV, hostRange) → { ok: true } | { ok: false, reason: 'too-old'|'too-new' }`.
     Rules, written as a doc comment:
     - add-only within a major;
     - an unknown `type` gets `res {ok:false, code:'unsupported'}`, never a throw;
     - removing or renaming a type, or changing a payload field's type, bumps `BRIDGE_VERSION` and the host's `max`.
     (The native range is a JS constant in B. See PM question 1.)
  5. Unit tests: parseEnvelope accepts and rejects (≥8 cases), negotiate boundaries, a JSON round-trip of one sample per type, and `COMMAND_TYPES` covering every union member (a type-level check with `expectTypeOf`, or a `satisfies` compile check).
  6. MAP.md: add the packages/ui/src/bridge/ entry.
Acceptance (PLAN §WP2.3 subset): typed commands and events exist for every PLAN-listed type plus the content version token; the version and unknown-type rules are encoded and tested; unit tests pass; zero runtime dependencies added; no `react-native*`/`next/*` import (the WP2.1 ESLint ban passes); diff ≤ ~250 lines.
Verify with (paste the final result line of each):
  - npx vitest run packages/ui/src/bridge
  - npm run typecheck
  - npm run lint
  - npm run test   (once, at the end)
  - cd apps/mobile, then `npx @expo/fingerprint .` on base and on branch: hash identical (expected, since apps/mobile is untouched)
  - No expo export is needed (apps/mobile is untouched). No device checks.
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base main. Do NOT set auto-merge (the PM lands the stack). Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```

---

## WP2.3-B: Host dispatcher, timeouts, pre-ready queue, watchdog integration

```
WP 2.3-B: Native host dispatcher + timeouts + pre-ready queue + watchdog integration. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3).
Goal: A pure, unit-tested native-side dispatcher. It routes DOM→native commands to handlers, sends native→DOM messages as a sequenced queue, holds them until `ready`, and reports only protocol-fatal failures to the watchdog.
Depends on: WP2.3-A merged (or open: base on feature/one-ui-wp2.3a). Branch: feature/one-ui-wp2.3b.
Touch set: apps/mobile/lib/bridge-host.ts (new), apps/mobile/lib/bridge-host.test.ts (new), apps/mobile/lib/dom-host-handlers.ts (+ its test), apps/mobile/components/SharedUiHost.tsx (wiring only), MAP.md. Do NOT edit apps/mobile/lib/watchdog.ts (292 lines; consume its existing API only). Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. bridge-host.ts. Keep it free of React/RN imports, like dom-host-handlers.ts, so it is testable. Export `createBridgeHost({ handlers, send, now, scheduler, onProtocolFatal, onSignal })`:
     - `HOST_RANGE = { min: 1, max: BRIDGE_VERSION }` as a JS constant. No native or app.json change (PM Q1).
     - `receive(raw)`: `parseEnvelope`. Before ready, invalid input is protocol-fatal. After ready it is dropped and logged via `onSignal('bridge-invalid')`.
       - `ready`: run `negotiate`. Out of range → `onProtocolFatal('bridge-version <reason> dom=<v> host=<min>-<max>')`, which maps to `watch.error` via dom-host-handlers. In range → mark ready and flush the queue in order. `ready` is idempotent.
       - `cmd`: look up the handler. If there's none, `res {ok:false, code:'unsupported'}`. Handlers return a Promise. Each cmd gets **exactly one** `res`: success, failure, timeout (default **8000 ms**, overridable per type) or `cancelled`. After the first `res`, late results are dropped.
       - `cancel {targetId}`: abort the handler's AbortSignal and answer the target with `cancelled`.
       - `ack {seq}`: trim the outbound queue through `seq`.
     - Outbound (native→DOM): `emit(type, payload)` / `request(type, payload)` assign a monotonically increasing `seq`. Until ready they are queued, and their timers start **at dispatch, not enqueue**. `request` resolves on the matching `res` or times out.
     - **Watchdog rule:** only protocol-fatal errors (version out of range, invalid envelope before ready) call `onProtocolFatal`. Command timeouts, handler failures and `unsupported` are never reported to the watchdog, before or after ready. Assert this in tests.
  3. dom-host-handlers.ts: `onReady` now receives the `ready` envelope payload through the host, so the version check happens before `watch.ready()`. Add a `bridge(env)` native action entry that forwards to `host.receive`. Keep `reportError` for genuine DOM render errors.
  4. SharedUiHost.tsx: build one host per mount and pass `bridge` as the DOM native action. Expose the outbound queue as a JSON prop `inbox: Envelope[]` (a sequenced list, not counters). Register no handlers beyond a stub map. D/E/F add them.
  5. Tests (fake scheduler and clock): the timeout yields exactly one res; a late result is dropped; cancel; unsupported; pre-ready queue order and flush; dispatch-time timers; ack trimming; version too-old and too-new go to onProtocolFatal; command timeouts and handler failures before ready do NOT call onProtocolFatal; double ready is a no-op.
Acceptance: PLAN §WP2.3 "ordering and cancellation" and "protocol unit tests (native side)" are met; the watchdog only gets protocol-fatal errors; watchdog.ts is unchanged; the native fingerprint is unchanged; diff ≤ ~350 lines; no file over 300 lines.
Verify with (paste the final result line of each):
  - npx vitest run apps/mobile/lib/bridge-host.test.ts apps/mobile/lib/dom-host-handlers.test.ts apps/mobile/lib/watchdog
  - npm run typecheck
  - npm run lint
  - cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios   (keep the output out of the repo)
  - cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  - cd apps/mobile: `npx @expo/fingerprint .` on base vs branch: hash IDENTICAL (paste both). If it differs, stop.
  - npm run test   (once, at the end)
  - List for the NEXT HA device session (don't run them; put them in the PR body): (1) with the C4 override on, the DOM reader still reaches ready and the diagnostics panel shows dom-ready on Android, iPad and iPhone; (2) the forced-failure switch ('throw' and 'hang') still falls back to native screens in airplane mode.
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base = feature/one-ui-wp2.3a if A is still open, else main. Do NOT set auto-merge. Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```

---

## WP2.3-C: DOM client and type-level contract test

```
WP 2.3-C: DOM-side bridge client + type-level contract test. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3).
Goal: The DOM (shared-UI) side of the protocol. It sends commands and gets typed results, consumes the sequenced inbox exactly once and in order, sends `ready` with its version, and a contract test fails the build if the DOM and native message types drift.
Depends on: WP2.3-A (base on feature/one-ui-wp2.3a if it's open). Independent of B, so it can run in parallel in a separate worktree. The contract test imports B's handler-map type: if B isn't merged yet, base on feature/one-ui-wp2.3b instead and say so. Branch: feature/one-ui-wp2.3c.
Touch set: packages/ui/src/bridge/client.ts (new), packages/ui/src/bridge/client.test.ts (new), packages/ui/src/bridge/contract.test.ts (new), apps/mobile/dom/bridge/** (new: the app adapter glue that wires client ⇄ Expo DOM `inbox` prop / `bridge` native action), MAP.md. Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. client.ts (platform-neutral; transport injected): `createBridgeClient({ post(env), now, idGen })`.
     - `call<T extends DomCommand>(type, payload, { signal?, timeoutMs? }): Promise<ResultOf<T>>`. An aborted signal posts `cancel {targetId}`. Results correlate by `id`. The 8000 ms default timeout mirrors the host's.
     - `on<T extends NativeEvent>(type, fn)`, plus a `handle('back', fn)` responder that answers with `res {ok:true, value:'handled'|'exit'}`.
     - `consumeInbox(inbox: Envelope[])`: process only `seq > lastSeq`, in order, then post `ack {seq: last}`. Re-renders that re-deliver the same array must not re-fire. This replaces the backTick-style counters.
     - `sendReady()` posts `ready {v: BRIDGE_VERSION}` once.
  3. apps/mobile/dom/bridge/: a small hook or wrapper that the DOM entry uses to feed the `inbox` prop into `consumeInbox` and route `post` to the `bridge` native action. No content crosses (C6). Only commands and the version token do.
  4. contract.test.ts:
     - type-level (`expectTypeOf`): B's host handler map type is `Record<DomCommandType, Handler>`, so it is exhaustive both ways; `ResultOf` on client.call equals the host handler's resolved type for every command; the native→DOM types the client listens for equal those the host emits.
     - runtime: `COMMAND_TYPES`/`EVENT_TYPES` match the keys of the registered maps.
  5. client.test.ts: id correlation; timeout; abort→cancel; duplicate inbox delivery is ignored; out-of-order seq is held or ignored; ack is emitted; a late res after a timeout is dropped.
Acceptance: PLAN §WP2.3 "protocol unit tests on both sides, plus contract tests that the DOM and native message types match" are met; removing one handler from the host map fails typecheck (show this in the PR by describing the deliberate break you tried and reverted); the native fingerprint is unchanged; diff ≤ ~300 lines.
Verify with (paste the final result line of each):
  - npx vitest run packages/ui/src/bridge apps/mobile/dom/bridge
  - npm run typecheck
  - npm run lint
  - cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios
  - cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  - cd apps/mobile: `npx @expo/fingerprint .` on base vs branch: hash IDENTICAL (paste both)
  - npm run test   (once, at the end)
  - Device checks: none in this PR on its own. They are covered by D's session list.
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base = the parent branch if it's still open, else main. Do NOT set auto-merge. Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```

---

## WP2.3-D: navigate / openExternal / share / haptic / insets / back / diag / contentVersion

```
WP 2.3-D: UI commands over the bridge + migrate the spike's back/insets wiring to the sequenced queue. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3).
Goal: Implement the user-facing commands and events on both sides, and replace the spike's backTick-style counter props with the B/C sequenced event queue.
Depends on: WP2.3-B and WP2.3-C, plus WP0.5b (the spike wiring: `backTick` at origin/feature/one-ui-wp0.5b SharedUiHost.tsx:43,75,110, dom/ReaderSpike.tsx:25,48,163, dom/spike/reader-modules.ts:11-32). Check all three show merged first. If 0.5b isn't merged, stop and report (PM Q5). Branch: feature/one-ui-wp2.3d.
Touch set: apps/mobile/lib/bridge-handlers-ui.ts (+ test, new), apps/mobile/components/SharedUiHost.tsx, apps/mobile/dom/ReaderSpike.tsx, apps/mobile/dom/spike/reader-modules.ts, apps/mobile/dom/bridge/**, apps/mobile/lib/deep-links.ts (read and reuse; edit only if a parser must be exported), packages/ui/src/bridge/** (only if a payload type needs tightening; additive only), MAP.md. Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. Native handlers (bridge-handlers-ui.ts, RN imports allowed here, injected into the host):
     - `navigate`: validate that `path` is a web path (X4: same path and query shape as the web). Unknown routes resolve `{ok:false, code:'invalid'}` and are never thrown.
     - `openExternal`: allow only http/https. Use `Linking.openURL`.
     - `share`: use RN's built-in `Share` (per the WP0.4 matrix).
     - `haptic`: use `expo-haptics` (present since WP0.4). If it's unavailable, no-op success.
     - `diag {stage, detail}`: forward to the existing diagnostics `onSignal`.
  3. Native→DOM events:
     - `insets` from `react-native-safe-area-context`, emitted on change.
     - `contentVersion {token}`, replacing the spike's `versionToken` prop.
  4. back: the BackHandler listener calls `host.request('back')`.
     - Before ready: return false, so native default behaviour applies (as the spike did).
     - After ready: consume the press. `'handled'` means nothing more happens. `'exit'`, a timeout or an error means `BackHandler.exitApp()`.
     - Use a short back timeout: 1000 ms. This is the executor's call and is reversible. Note it in the PR.
  5. Remove the `backTick` state, props and `useRef` comparison everywhere. The DOM side uses `client.handle('back', …)` instead. Grep must show zero `backTick` left.
  6. Accessibility (PLAN §WP2.3): after a `share` res resolves (the native sheet has closed), the DOM side restores focus to the element that triggered it. Implement this in the dom/bridge glue as a helper `withFocusRestore(fn)`.
  7. Tests: each handler's validation (bad URL scheme, non-web path); back before ready returns false; back after ready with handled, exit and timeout; insets coalescing; a DOM-side test proving a back press delivered twice in one render fires once (the bug counters had).
Acceptance: navigate, openExternal, share, haptic, insets, back → handled|exit, diag and the content version token all go over the bridge; no counters remain; focus is restored after the share sheet; the native fingerprint is unchanged; diff ≤ ~400 lines (split off the back migration if it's bigger).
Verify with (paste the final result line of each):
  - npx vitest run apps/mobile/lib/bridge-handlers-ui.test.ts apps/mobile/dom
  - npm run typecheck
  - npm run lint
  - cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios
  - cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  - cd apps/mobile: `npx @expo/fingerprint .` on base vs branch: hash IDENTICAL (paste both)
  - git grep -n backTick -- apps/mobile packages   → no output
  - npm run test   (once, at the end)
  - For the NEXT HA device session (put these in the PR body; the PM batches them):
    (1) Android: hardware back closes an open sheet or moment first, then exits at the root.
    (2) Android: rapid double-back doesn't skip a level.
    (3) All devices: the share sheet opens, and after you dismiss it VoiceOver/TalkBack focus is back on the share button.
    (4) A haptic is felt on the iPhone (marked "for Joey to coordinate") and on Android.
    (5) An external link opens in the system browser.
    (6) iPad portrait, landscape and split view: insets update with no content under the status bar or home indicator.
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base = the parent branch if it's still open, else main. Do NOT set auto-merge. Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```

---

## WP2.3-E: Notification commands and the cold/warm tap queue

```
WP 2.3-E: notifications.* commands + notification-tap navigation held until ready. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3).
Goal: The shared UI can read and change notification state through native code, and a notification tap opens the right screen on both cold and warm start, even when it arrives before the reader is ready.
Depends on: WP2.3-B, WP2.3-C, WP2.3-D (for navigate). Branch: feature/one-ui-wp2.3e.
Touch set: apps/mobile/lib/bridge-handlers-notifications.ts (+ test, new), apps/mobile/lib/notification-tap-queue.ts (+ test, new), apps/mobile/App.tsx (only the tap listener block at ~:300-315), apps/mobile/components/SharedUiHost.tsx (handler registration), MAP.md. Reuse, don't duplicate: apps/mobile/lib/push-registration.ts, prefs-client.ts, notification-actions.ts, notification-channels.ts, routes.ts/deep-links.ts. Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. Handlers that delegate to the existing native modules (no new native modules; categories and channels already exist):
     - `notifications.status` → `{permission, registered, prefs}`;
     - `notifications.request` → the permission prompt;
     - `notifications.register` → push-registration;
     - `notifications.updatePrefs {prefs}` → prefs-client.
     These are the app's equivalents of the web's `/api/devices/*` calls (see PM Q3). The push token never crosses the bridge (C2 privacy), only booleans and status.
  3. notification-tap-queue.ts (pure): `enqueue(response)` maps the notification data to a web path via the existing routes/deep-links mapping (X4).
     - Dedupe by notification identifier, because a cold-start response can also fire the listener.
     - `drainTo(sink)`.
     - Cold start: App.tsx:307's `getLastNotificationResponseAsync`. Warm start: App.tsx:310's listener. Both enqueue.
     - If the DOM host is mounted and ready, drain to `host.emit('navigate', {path, source:'notification'})`. Before ready, hold the taps (B's queue already holds emits, so pass through without building a second queue: grep first to avoid a duplicate mechanism).
     - If the watchdog mounts native screens (fallback or flag off), drain to today's native navigation instead. A tap must never be lost.
  4. Tests: a cold tap before ready is delivered once after ready; a warm tap after ready is delivered immediately; the same id delivered by both cold and listener paths is delivered once; the fallback path routes natively; an unknown payload is dropped without a throw.
Acceptance: PLAN §WP2.3 "notification tap goes to navigate once the reader reports ready, on both cold and warm start" is met; notifications.{status,request,register,updatePrefs} work; no token or PII crosses the bridge; the native fingerprint is unchanged; diff ≤ ~350 lines.
Verify with (paste the final result line of each):
  - npx vitest run apps/mobile/lib/notification-tap-queue.test.ts apps/mobile/lib/bridge-handlers-notifications.test.ts apps/mobile/lib/notification-actions.test.ts
  - npm run typecheck
  - npm run lint
  - cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios
  - cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  - cd apps/mobile: `npx @expo/fingerprint .` on base vs branch: hash IDENTICAL (paste both)
  - npm run test   (once, at the end)
  - For the NEXT HA device session (PR body):
    (1) App killed, tap a test notification: the app opens on that screen in the DOM reader (cold).
    (2) App backgrounded, tap a notification: it navigates there (warm).
    (3) The same in airplane mode with the forced-failure switch on: it lands on the native screen for that route.
    (4) Settings → notifications in the DOM reader shows the correct permission state and toggles persist after a relaunch.
    (5) Run (1) and (2) on Android, on iPad, and on iPhone (marked "for Joey to coordinate").
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base = the parent branch if it's still open, else main. Do NOT set auto-merge. Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```

---

## WP2.3-F: The api proxy via ApiFetch

**Reconciling the `/api` call sites.** PLAN X1 says "six"; the WP2.3 prep (PROGRESS 16:54) says PLAN says 7. On origin/main @ b09c8246 the count is **9 fetch call sites, 7 distinct paths, 8 path+method pairs**:

| # | Call site | Endpoint | Method | Proposed in-app route |
|---|---|---|---|---|
| 1 | `apps/web/components/longlive/ClownChat.tsx:168` | `/api/clown` | POST | **Excluded, pending PM Q2** (HttpOnly-cookie session) |
| 2 | `apps/web/components/longlive/CurrentItemDetail.tsx:65` | `/api/intake` | POST | api proxy |
| 3 | `apps/web/components/longlive/FeedbackButton.tsx:159` | `/api/feedback` | POST | api proxy |
| 4 | `apps/web/components/longlive/MoodChat.tsx:63` | `/api/mood` | POST | api proxy |
| 5 | `apps/web/components/longlive/SubmitLinkForm.tsx:122` | `/api/submit-link` | POST | api proxy |
| 6 | `apps/web/components/longlive/WebNotificationSettings.tsx:96` | `/api/devices/:id/prefs` | GET | E: `notifications.status` (PM Q3) |
| 7 | `apps/web/components/longlive/WebNotificationSettings.tsx:113` | `/api/devices/:id/prefs` | PUT | E: `notifications.updatePrefs` |
| 8 | `apps/web/lib/web-push-client.ts:110` | `/api/devices/register` | POST | E: `notifications.register` |
| 9 | `apps/web/lib/web-push-client.ts:150` | `/api/devices/register` | POST | E: `notifications.register` |

Same-origin, non-`/api` fetches that X1's `/content/**` CORS does **not** cover: `apps/web/lib/longlive/use-live-data.ts:35` (`/vault/live/{era}`) and `apps/web/lib/longlive/share-payload.ts:103` (share-card PNG). See PM Q3.

```
WP 2.3-F: `api` bridge command — native proxy behind the ApiFetch seam. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.3, X1).
Goal: In the app, the shared UI's `apiFetch` (ApiFetch, packages/content/src/api-fetch.ts:23, exported from packages/content/src/index.ts:15) goes over the bridge to a native fetch against the allowlisted `/api` endpoints. It never forwards cookies or secrets.
Depends on: WP2.3-B, WP2.3-C; WP0.3b (merged, #4796); WP2.1-B (host adapter with `apiFetch`) merged. Check all of them. Branch: feature/one-ui-wp2.3f.
Touch set: apps/mobile/lib/bridge-handlers-api.ts (+ test, new), apps/mobile/dom/bridge/** (the app adapter's apiFetch = client.call('api')), apps/mobile/components/SharedUiHost.tsx (registration), packages/content/src/api-fetch.ts (+ test) ONLY IF the PM approved Q4 (optional `{signal}` arg, additive), MAP.md, and the X1 note in docs/plans/one-ui/PLAN.md (replace "six reader call sites" with the reconciled table's count). Do NOT touch apps/web call sites (their migration is the WP2.4–2.13 slices) or `/api` CORS/CSP (X1). Touching anything else = stop and report.
Do:
  1. `npm ci --silent` at the worktree root.
  2. Native handler `api {req: ApiRequest}`:
     - Allowlist method + path. Proposed: POST /api/intake, /api/feedback, /api/mood, /api/submit-link. /api/clown only if the PM answers Q2 (b). The device endpoints never go here (they're E's job).
     - Anything else resolves `{ok:false, code:'invalid'}`.
     - URL = `apiBaseUrl()` (apps/mobile/lib/api-base.ts:5) + path. Reject a path containing `..`, `//`, a scheme or a host.
     - Request headers: allowlist `content-type` and `accept` only. Drop `cookie`, `authorization`, `x-*`, and anything else. Use `credentials: 'omit'`.
     - Response headers: return only `content-type`, `retry-after` and `x-ratelimit-*`. Never `set-cookie`.
     - Body: string, capped at 256 KB each way.
     - Cancellable: B's AbortSignal goes to `fetch`, and a `cancel` aborts it.
     - Timeout: the 8000 ms default. If you raise it for `/api/feedback`, note that in the PR.
     - Errors map to `ApiResponse`-shaped `{status:0}` or a `res` error code. Never a throw across the bridge.
  3. DOM side: the app host adapter's `apiFetch: ApiFetch` calls `client.call('api', {req}, {signal})` and returns `ApiResponse`. On the web, `webApiFetch` is unchanged.
  4. Tests: allowlist accept and reject; header stripping both ways (a cookie and an authorization in → absent out; set-cookie in the response → absent); path-traversal reject; abort → cancelled; timeout; size cap; a type test showing the adapter `satisfies ApiFetch`.
  5. Update PLAN X1's count with the reconciled table (see above): 9 sites / 7 paths / 8 path+method, 4 proxied, 4 via E, 1 pending Q2.
Acceptance: X1's app path ("the bridge hands the request to native code, which calls the API directly") is met for the allowlisted endpoints; there's no cookie, auth or secret in either direction (tested); `/api` CORS and the CSP are untouched; the native fingerprint is unchanged; diff ≤ ~300 lines.
Verify with (paste the final result line of each):
  - npx vitest run apps/mobile/lib/bridge-handlers-api.test.ts packages/content/src/api-fetch.test.ts apps/mobile/dom/bridge
  - npm run typecheck
  - npm run lint
  - cd apps/mobile: npx expo export --platform ios --output-dir <scratchpad>/exp-ios
  - cd apps/mobile: npx expo export --platform android --output-dir <scratchpad>/exp-android
  - cd apps/mobile: `npx @expo/fingerprint .` on base vs branch: hash IDENTICAL (paste both)
  - git diff origin/main -- apps/web/next.config.mjs   → empty (CORS/CSP untouched)
  - npm run test   (once, at the end)
  - For the NEXT HA device session (PR body):
    (1) In the DOM reader, send feedback and confirm the issue/comment appears.
    (2) Submit a link (Turnstile) and confirm it's accepted.
    (3) Mood chat answers.
    (4) In airplane mode, each fails gracefully with no hang longer than 8 s.
    Run these on Android, on iPad, and on iPhone (marked "for Joey to coordinate").
Repo rules (OPERATING-MODE.md §7):
  - Branch and worktree: work on a branch in your own worktree outside `Documents\Claude\Projects\`, and verify the branch before every commit. Never commit to `main` or force-push. Never use `git restore`/`reset --hard`/`clean`/`checkout --` or `--no-verify`.
  - Shell: one simple command per Bash call. Prefer `node -e` over python. Filter command output at the source (`| tail -30`).
  - Never touch `scripts/social/**` or `social/queue/**`. Never merge a `social-draft` PR. Never send social work to Codex.
  - Gates: Typecheck `npm run typecheck`. Lint `npm run lint` (the exact CI command, not per-file eslint). Tests: narrow `npx vitest run <path>` while iterating; full `npm run test` once at the end. Mobile bundle check (when `apps/mobile` changes): `npx expo export --platform ios` and `npx expo export --platform android`.
  - Editing: surgical edits only, no reformatting of untouched code, and keep files under 300 lines. Update `MAP.md` when files are added, moved or deleted.
  - Definition of done: acceptance criteria met; all tests pass; review clean; works on mobile and desktop web; docs updated in the same PR; no secrets.
  - Device verification: a UI change isn't verified until it's seen in a browser at phone and desktop widths, and on device for app changes. A green suite is not evidence.
  - Native changes are expensive: any change to `apps/mobile` native dependencies or config changes the fingerprint, which triggers new store builds on both platforms. Only make one if the WP says so.
  - Size tripwire: diff past ~400 lines means stop and report.
Land: open the PR (TL;DR, then ---, then detail; refs #4788), base = the parent branch if it's still open, else main. Do NOT set auto-merge. Never `--delete-branch` a branch that has child PRs: retarget each child first (`gh pr edit <child> --base main`). Do not wait on CI.
Return ≤ 300 words: what changed, verification results (incl. fingerprint hashes), PR URL, open risks.
```
