// news-worker Supabase key rotation confirmation — deterministic, zero-AI,
// SELF-LIMITING.
//
// WHY THIS EXISTS. SUPABASE_SERVICE_ROLE_KEY was rotated 2026-08-15T18:31:50Z.
// Its only consumer is .github/workflows/news-worker.yml (every ~4h). At
// rotation time no run had happened since, so the new key was unverified. The
// standing "Scheduled workflows healthy" cadence check in watchdog.yml only
// asks "has SOMETHING succeeded within 10h" — it cannot say whether the FIRST
// run after the rotation specifically authenticated, and it cannot tell an
// auth-shaped failure from an ordinary one (a real distinction: news-worker is
// a documented no-op with zero news_source rows seeded, so "succeeded" here
// mostly just means "authenticated and ran clean").
//
// SELF-LIMITING (CLAUDE.md orchestrator contract):
//   - Bounded to WINDOW_END below (one week — news-worker runs every ~4h, so a
//     week is generous; if nothing has run by then the standing cadence check
//     has already alarmed on that separately).
//   - Only ever OPENS an alert for the one shape this check exists to catch —
//     a confirmed authentication failure. A confirmed success, a confirmed
//     ordinary (non-auth) failure, or a window expiry all close/no-op: those
//     are either good news or someone else's alarm (the cadence check) to
//     raise, not this one's job to duplicate.
//   - Trivially removable at any time: delete the "news-worker rotation
//     confirmation" step from watchdog.yml (or this file).
//
// Usage: node --use-env-proxy scripts/watchdog/news-worker-rotation-check.mjs \
//          --repo owner/name --alert-body /tmp/alert-body.md
// Exit: 0 = nothing to alarm on (confirmed ok, confirmed non-auth failure,
//           still pending, or window expired) — caller closes.
//       1 = confirmed authentication-shaped failure — caller opens.
//       2 = the check itself broke — caller must not report this as "clear".
import { writeFileSync } from 'node:fs';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';

export const ROTATION_AT = '2026-08-15T18:31:50Z';
// One week — see header. news-worker's own cadence alarm (10h max-age, in the
// standing "Scheduled workflows healthy" step) covers the "nothing ran at
// all" case well inside this window.
export const WINDOW_END = '2026-08-22T00:00:00Z';

// Keyword shapes a bad/rotated Supabase key produces, from PostgREST/GoTrue's
// own error vocabulary (e.g. a stale service_role key gets a flat 401 with
// "Invalid API key" or "No API key found in request"; an expired/malformed
// JWT gets "JWSError"/"invalid signature"/"jwt expired"). Deliberately narrow:
// a false match here would misreport an unrelated failure as "the rotation
// broke it".
export const AUTH_PATTERNS = [
  /invalid api key/i,
  /no api key found/i,
  /jws\w*error/i,
  /invalid[_ ]?signature/i,
  /jwt expired/i,
  /jwt malformed/i,
  /\bunauthorized\b/i,
  /\b401\b/i,
  /pgrst301/i,
];

/** null = no auth-shaped pattern found (treat as an ordinary failure). */
export function classifyLogText(text) {
  if (!text) return null;
  return AUTH_PATTERNS.some((re) => re.test(text)) ? 'auth' : 'other';
}

/** The first news-worker run that started after `since`, chronologically. */
export function firstRunAfter(runs, since = ROTATION_AT) {
  const sinceMs = Date.parse(since);
  const matches = (runs || [])
    .filter((r) => r.createdAt && Date.parse(r.createdAt) > sinceMs)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return matches[0] ?? null;
}

/**
 * Evaluate the confirmation state. Pure — takes already-fetched runs and an
 * already-fetched log (only needed for a failing run), so it is
 * unit-testable without gh.
 */
export function evaluate({ runs, logText, now = new Date(), since = ROTATION_AT, windowEnd = WINDOW_END }) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const windowEndMs = Date.parse(windowEnd);

  const run = firstRunAfter(runs, since);
  if (!run) {
    if (nowMs >= windowEndMs) {
      return {
        status: 'window-expired',
        reason: `No news-worker run has started since the key rotation (${since}), even after the ${windowEnd} window. The standing "Scheduled workflows healthy" cadence check above (10h max-age) will already have alarmed on this — deferring to it.`,
      };
    }
    return {
      status: 'pending',
      reason: `No news-worker run has started since the key rotation (${since}) yet. It runs every ~4h, so one is expected soon. Still inside the confirmation window (closes ${windowEnd}).`,
    };
  }

  if (!run.conclusion) {
    return {
      status: 'pending',
      reason: `Run ${run.databaseId} (started ${run.createdAt}) is the first since the rotation and is still in progress — verdict pending.`,
    };
  }

  if (run.conclusion === 'success') {
    return {
      status: 'confirmed-ok',
      reason: `Run ${run.databaseId} (started ${run.createdAt}) — the first since the rotation — completed successfully. The rotated \`SUPABASE_SERVICE_ROLE_KEY\` authenticates.`,
    };
  }

  const kind = classifyLogText(logText);
  if (kind === 'auth') {
    return {
      status: 'confirmed-auth-failure',
      reason: `Run ${run.databaseId} (started ${run.createdAt}) — the first since the rotation — failed with an authentication-shaped error in its log. The rotated \`SUPABASE_SERVICE_ROLE_KEY\` does NOT appear to work.`,
      run,
    };
  }
  return {
    status: 'confirmed-other-failure',
    reason: `Run ${run.databaseId} (started ${run.createdAt}) — the first since the rotation — failed, but not on an authentication-shaped error. The key rotation looks fine; something else broke. See the standing "Scheduled workflows healthy" cadence check above, or the run itself: https://github.com/${process.env.REPO ?? ''}/actions/runs/${run.databaseId}`,
  };
}

function renderBody(result) {
  const heading = {
    'confirmed-ok': 'The rotated Supabase key works.',
    'confirmed-auth-failure': 'The rotated Supabase key does NOT work.',
    'confirmed-other-failure': 'The rotated Supabase key works; an unrelated failure occurred.',
    'window-expired': 'The one-week confirmation window has closed.',
    pending: 'No verdict yet.',
  }[result.status];
  return `@sffan15-sys — ${heading}\n\n${result.reason}\n\n(This is the self-limiting post-rotation confirmation check, watchdog.yml — closes ${WINDOW_END} regardless of outcome.)\n`;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const repo = arg('--repo') ?? process.env.REPO ?? process.env.GITHUB_REPOSITORY;
  const repoArgs = repo ? ['--repo', repo] : [];

  const { stdout } = await gh([
    'run', 'list', ...repoArgs, '--workflow', 'news-worker.yml',
    '--json', 'databaseId,createdAt,conclusion,status', '--limit', '30',
  ]);
  const runs = JSON.parse(stdout || '[]');
  const candidate = firstRunAfter(runs);

  let logText;
  if (candidate && candidate.conclusion && candidate.conclusion !== 'success') {
    const { stdout: log } = await gh([
      'run', 'view', String(candidate.databaseId), ...repoArgs, '--log',
    ]).catch((e) => ({ stdout: `<could not fetch log: ${e.message}>` }));
    logText = log;
  }

  const result = evaluate({ runs, logText });
  console.log(`news-worker-rotation: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result));

  return result.status === 'confirmed-auth-failure' ? 1 : 0;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'news-worker-rotation-check.mjs';
if (invokedDirectly) {
  runMain(async () => {
    try {
      return await main();
    } catch (e) {
      console.error(`✗ news-worker rotation check could not run: ${e.message}`);
      return 2;
    }
  }, { name: 'news-worker-rotation-check' });
}
