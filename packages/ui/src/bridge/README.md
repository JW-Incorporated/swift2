# Bridge types and validators (One UI WP2.3-A)

Transport-neutral message contract between the DOM reader and the native host.
Pure types plus pure validators; no dispatcher, no transport (that is WP2.3-B).

- `parseEnvelope` returns `{ok, envelope} | {ok:false, reason}`; the payload must be
  strict JSON (depth <= 32, serialized <= 256 KB). It never throws.
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
5. Replay and duplicate-id dedup: a repeated `cmd` id is not executed twice.
6. Every inbound envelope goes through `parseEnvelope`, `navigate`/`openExternal`/`api`
   payloads through `isWebPath`/`isExternalUrl`/`sanitizeApiRequest` before any handler runs.
7. Pre-ready version negotiation against `NATIVE_SUPPORTED_RANGE`; out-of-range = protocol-fatal → watchdog strike (B: `onProtocolFatal`).
