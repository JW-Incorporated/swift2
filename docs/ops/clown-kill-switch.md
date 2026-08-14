# Clown bot kill switch — `CLOWN_MODEL_DISABLED`

Build B (`feature/clownbot-rebuild`, see `PLAN.md` and `docs/decisions.md`
2026-08-13 "Clownbot rebuild — build B ships, in Joey's layout") ships live on
merge (J3), with no human gate in front of the first real traffic beyond the
CI red-team battery and the one-time live-key pass (J5). This is the fast
lever for switching the model off if something is wrong in production.

## What it is

**Variable:** `CLOWN_MODEL_DISABLED`
**Value that disables the model path:** `1`

Set in the deploy environment (Vercel, Production scope, same place
`ANTHROPIC_API_KEY` lives). Any other value, or the variable unset, leaves the
model path enabled.

## What it does

Checked in `apps/web/lib/longlive/clown-client.ts`'s `askClown()`, **before**
the daily usage cap is reserved — so a disabled model burns zero quota, not
just zero spend on the call itself. When set, `askClown()` returns `null`
immediately, the same as a missing `ANTHROPIC_API_KEY` or an over-cap
instance, and the route falls through to the deterministic, zero-model
fallback composer (`clown-fallback.ts`).

## What users see

**The deterministic fallback — a designed experience, not an error.** Readers
still get an in-voice answer built from source cards and framing copy, with
zero model calls. They do not see a broken feature, a spinner, or an error
state; they see the bot answering in its lower-effort, always-available mode.
The two prefill columns and every chip already resolve with zero model calls
regardless of this switch (J2, J4), so most of the surface is unaffected.

## How to use it

No redeploy of code is needed — only an env change (plus whatever redeploy
step the platform requires to pick up a new environment variable, e.g. a
Vercel redeploy of the existing build). This is the same shape as the
rollback in `docs/ops/clownbot-launch-gate.md` for build A: one env change,
no revert, no migration, no content change.
