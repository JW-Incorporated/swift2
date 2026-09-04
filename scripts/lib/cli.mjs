// Shared CLI error/exit convention (R23, Fable 5.1 architecture review).
//
// Every top-level script and sub-engine entry point in scripts/** wraps its
// `main()` in `runMain(main, { name: 'script-name' })` instead of hand-rolling
// its own try/catch + process.exit. This gives every script:
//   - a uniform `[script] error: <message>` line on failure (instead of N
//     slightly different console.error shapes across the tree)
//   - a uniform default failure exit code (1) when `main()` throws/rejects
//   - a way to still return a specific exit code on purpose: return a number
//     from `main()` (0, 1, 2, ...) and that number becomes process.exitCode.
//     Several scripts use non-1 codes deliberately (e.g. clown-battery's
//     2 = "the gate itself is broken", distinct from 1 = "a real regression
//     fired") — runMain preserves that, it does not flatten every failure to
//     the same code.
//
// `main()` may be sync or async; either return value / thrown error is
// handled the same way. runMain never calls process.exit() itself — it only
// sets process.exitCode, so a script's own event-loop drain (e.g. an open DB
// connection that was already `.end()`ed) still governs when the process
// actually exits, and any `finally` cleanup in main() still runs before the
// catch here ever sees an error.
//
//   import { runMain } from './lib/cli.mjs';
//   async function main() { ... return 0; }
//   runMain(main, { name: 'my-script' });
//
// isSchemaPending/SCHEMA_PENDING_RE: moved out of apps/worker/src/index.ts
// (R23 scope) so every script that talks to Postgres/PostgREST classifies a
// "table/column not migrated yet" error the same way, instead of each
// script re-deriving its own regex. See apps/worker/src/index.ts for the
// full rationale (HUMAN-ACTIONS.md #14 — schema-pending is a known, tracked
// infra state, not a script fault).

const SCHEMA_PENDING_RE = /schema cache|does not exist|PGRST204|PGRST205/i;

/**
 * True when `err` (an Error, a string, or anything with a `.message`) looks
 * like a "table/column not migrated yet" PostgREST/Postgres error rather
 * than a genuine failure.
 */
export function isSchemaPending(err) {
  const msg = typeof err === 'string' ? err : (err && err.message) || String(err);
  return SCHEMA_PENDING_RE.test(msg);
}

/**
 * Run `fn` as a script's entry point with the shared error/exit convention.
 * - `fn` returning a number sets process.exitCode to that number.
 * - `fn` returning anything else (including undefined) leaves exitCode
 *   untouched (0, i.e. success) unless `fn` itself set process.exitCode.
 * - `fn` throwing/rejecting prints `[name] error: <message>` (plus stack,
 *   when available, to aid debugging) and sets process.exitCode to 1.
 *
 * @param {() => (number | void | Promise<number | void>)} fn
 * @param {{ name?: string }} [opts] Script name for the error prefix.
 *   Defaults to the invoked file's basename (argv[1]) when omitted.
 */
export async function runMain(fn, opts = {}) {
  const name = opts.name || deriveScriptName();
  try {
    const result = await fn();
    if (typeof result === 'number') {
      process.exitCode = result;
    }
  } catch (err) {
    const detail = err && err.stack ? err.stack : err && err.message ? err.message : String(err);
    console.error(`[${name}] error:`, detail);
    process.exitCode = 1;
  }
}

function deriveScriptName() {
  const argv1 = process.argv[1];
  if (!argv1) return 'script';
  const base = argv1.split(/[\\/]/).pop() || 'script';
  return base.replace(/\.mjs$/, '');
}
