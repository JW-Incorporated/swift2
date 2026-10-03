# Bridge types and validators (One UI WP2.3-A)

Transport-neutral message contract between the DOM reader and the native host.
Pure types plus pure validators; no dispatcher, no transport (that is WP2.3-B).

- The boundary is a string (`postMessage` / `injectJavaScript` deliver strings);
  validators parse then walk: length > 256 KB is invalid before anything else, then
  `JSON.parse` in try, then a shape-walk of the plain parsed data.
- `parseEnvelope(raw: string)` returns `{ok, envelope} | {ok:false, reason}`; the payload must be
  strict JSON (depth <= 32). It never throws. Object-accepting entry points
  (`parseEnvelopeValue`, `negotiate`, `parseReady`, `sanitizeApiRequest`) first run
  `canonicalize` (stringify, length check, parse, all in try), then validate.
- `ts` is informational and untrusted: never used for auth, ordering or dedup.
- `isWebPath` / `isExternalUrl` (https only) / `sanitizeApiRequest` guard what a
  command may reach. `WebPath` and `ExternalUrl` are branded; only validators make them.
- `NATIVE_SUPPORTED_RANGE` is a JS constant. `ready.range` absent means the DOM
  speaks only `ready.v`. `negotiate` fails closed (`invalid`).
- Optional payload fields are absent on the wire; an explicit `undefined` is rejected.

## CONTRACT: WP2.3-B acceptance criteria

The dispatcher (WP2.3-B) must implement, and test:

1. Exactly one `res` per `cmd` (never zero, never two).
2. Unknown command type answers `res {ok:false, error:{code:'unsupported'}}` (see `answerUnknown`).
3. Per-type timeouts answer `timeout`.
4. `cancel {targetId}` cancels the in-flight command by id (`cancelled`).
5. Monotonic command ids (replay protection, docs/decisions.md 2026-10-03). A `cmd` id is a
   strictly increasing integer per DOM, string-encoded digits (1-15) within the id charset. The
   host keeps a high-water mark (hwm) that `ready` does NOT reset; an id not above the hwm is
   answered `invalid` (signal `rejected_monotonic`) and never runs. The DOM seeds its counter from
   `Date.now()` at client creation, so ids after a reload exceed prior sessions' (client: #4855).
   Every accepted `ready` is answered with an unsequenced `readyAck {hwm}` (host hwm, -1 sent as
   0) before any replay; the DOM reseeds its counter to max(now, hwm+1) so a clock that went
   backwards after reload cannot get every id rejected. hwm >= MAX_SAFE_INTEGER - 1 is protocol-fatal.
   Assumes FIFO delivery per channel (WKWebView messageHandlers, Android
   `addJavascriptInterface`): an out-of-order lower id is rejected, not reordered.
6. Every inbound envelope string goes through `parseEnvelope`, `navigate`/`openExternal`/`api`
   payloads through `isWebPath`/`isExternalUrl`/`sanitizeApiRequest` before any handler runs.
7. Pre-ready version negotiation against `NATIVE_SUPPORTED_RANGE`; out-of-range = protocol-fatal → watchdog strike (B: `onProtocolFatal`).
8. `res` is unsequenced (no `seq`, never queued or replayed on ack/re-ready). A native request
   leaves the outbox when its `res` arrives (ack governs events/emits only); re-ready retransmits
   only unsettled requests and unacked emits.
9. `ready` is rate limited to 3 per 10 s; the 4th is protocol-fatal (`onProtocolFatal`). `ready`
   is validated against `NATIVE_SUPPORTED_RANGE` and the envelope `v` like every other message.
