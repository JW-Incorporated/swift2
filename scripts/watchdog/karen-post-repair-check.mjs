// Karen post-repair confirmation — deterministic, zero-AI, SELF-LIMITING.
//
// WHY THIS EXISTS SEPARATELY from watchdog.yml's standing "Karen filed what
// she found" step: that step's staleness tolerance is 9 days (see its own
// header — the cadence itself is unconfirmed, so it deliberately tolerates a
// slow week). That is the right choice for a permanent alarm, but it means it
// would stay silent about today's specific question — "did the 2026-08-14/15
// repair (6ec8d6ca, d51676ce) actually work?" — until 2026-08-23. This answers
// that question directly and quickly, using the strongest signal available
// (a merged Karen PR) plus the same provenance/filing markers the standing
// check already reads (scripts/content-engine/lib/report.mjs), so nothing
// here re-derives that parsing.
//
// SELF-LIMITING (CLAUDE.md orchestrator contract: these checks answer a
// question that resolves in a day or two, not a permanent nag):
//   - Bounded to WINDOW_END below (one week from the repair, matching the
//     weekly-cadence reasoning already in watchdog.yml's Karen step).
//   - Closes its own alert the moment a genuine run is confirmed.
//   - Also closes its own alert once WINDOW_END passes even if still
//     unconfirmed — the standing 9-day check inherits full coverage the
//     moment this expires, so nothing goes unwatched.
//   - Trivially removable at any time: delete the "Karen post-repair
//     confirmation" step from watchdog.yml (or this file). Nothing else
//     imports it.
//
// Usage: node --use-env-proxy scripts/watchdog/karen-post-repair-check.mjs \
//          --repo owner/name --alert-body /tmp/alert-body.md
// Exit: 0 = nothing to alarm on (confirmed, or window expired) — caller closes.
//       1 = window still open and unconfirmed — caller opens.
//       2 = the check itself broke — caller must not report this as "clear".
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh } from '../lib/gh.mjs';
import { parseRunProvenance, parseFilingStatus } from '../content-engine/lib/report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const REPORTS_DIR = join(ROOT, 'docs', 'audits', 'engine');

// Karen's PR title convention (confirmed against #1850, #1547, #1192, #885 —
// all merged "karen: nightly run report <date>").
export const KAREN_PR_TITLE_RE = /^karen:\s*nightly run report\b/i;

// "merged after 2026-08-15" per the founder's ask — the day the watchdog's own
// staleness alarm was repaired (d51676ce), one day after Karen's report-path
// mechanics were repaired (6ec8d6ca, 2026-08-14).
export const REPAIR_SINCE = '2026-08-15T00:00:00Z';
// One week — matches the weekly-cadence reasoning already in watchdog.yml's
// Karen step (her last run, PR #1850, landed on a Saturday; a week gives her a
// full cycle to prove herself before this self-limiting check stands down).
export const WINDOW_END = '2026-08-22T00:00:00Z';

/** The strongest signal: a Karen-authored PR merged after the repair. */
export function findConfirmingPr(prs, since = REPAIR_SINCE) {
  const sinceMs = Date.parse(since);
  const matches = (prs || [])
    .filter((pr) => KAREN_PR_TITLE_RE.test(pr.title || '') && pr.mergedAt && Date.parse(pr.mergedAt) > sinceMs)
    .sort((a, b) => Date.parse(a.mergedAt) - Date.parse(b.mergedAt));
  return matches[0] ?? null;
}

/**
 * Evaluate the confirmation state. Pure — takes already-fetched PRs and an
 * already-read newest report, so it is unit-testable without gh or the
 * filesystem. `newestReport` is `{ name, date, text }` or null.
 */
export function evaluate({ prs, newestReport, now = new Date(), since = REPAIR_SINCE, windowEnd = WINDOW_END }) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const sinceMs = Date.parse(since);
  const windowEndMs = Date.parse(windowEnd);

  const pr = findConfirmingPr(prs, since);
  if (pr) {
    return {
      status: 'confirmed',
      reason: `Karen-authored PR #${pr.number} ("${pr.title}") merged ${pr.mergedAt} — a genuine nightly run landed after the repair.`,
    };
  }

  if (newestReport && newestReport.date && Date.parse(newestReport.date) >= sinceMs) {
    const run = parseRunProvenance(newestReport.text);
    const filing = parseFilingStatus(newestReport.text);
    if (run && run.source === 'all') {
      const unfiled = filing ? Number(filing.unfiled ?? 0) : NaN;
      if (filing && filing.status === 'ok' && unfiled === 0) {
        return {
          status: 'confirmed',
          reason: `\`${newestReport.name}\` carries \`cie-run: source=all\` and \`cie-filing: status=ok\` — a genuine run landed after the repair and filed what it found.`,
        };
      }
      return {
        status: 'partial',
        reason: `\`${newestReport.name}\` carries \`cie-run: source=all\` (a genuine run happened after the repair) but its filing verdict is ${filing ? `\`status=${filing.status} unfiled=${filing.unfiled}\`` : 'missing'} — the run itself is confirmed, filing is not. See the standing "Karen filed what she found" check above for the filing alarm.`,
      };
    }
  }

  if (nowMs >= windowEndMs) {
    return {
      status: 'window-expired',
      reason: `No Karen-authored PR merged after ${since}, and no canonical report dated after ${since} carries a \`cie-run: source=all\` marker, even after the ${windowEnd} window. Standing down — the "Karen filed what she found" check above (9-day staleness) keeps watching indefinitely; this self-limiting check does not.`,
    };
  }

  return {
    status: 'unconfirmed',
    reason: `No Karen-authored PR merged after ${since} yet, and the newest canonical report (\`${newestReport ? newestReport.name : 'none found'}\`) does not carry a \`cie-run: source=all\` marker produced after the repair. Still inside the confirmation window (closes ${windowEnd}).`,
  };
}

/** Newest `docs/audits/engine/*-cie-run.md` report, or null. Filenames are
 * `YYYY-MM-DD-cie-run.md`, so lexical sort is chronological. */
export function readNewestReport(dir = REPORTS_DIR) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}-cie-run\.md$/.test(f)).sort();
  } catch {
    return null;
  }
  const name = files[files.length - 1];
  if (!name) return null;
  const date = name.slice(0, 10);
  const text = readFileSync(join(dir, name), 'utf8');
  return { name, date, text };
}

function renderBody(result) {
  const heading = {
    confirmed: 'Karen has run for real since the repair.',
    partial: 'Karen ran for real since the repair, but filing is not yet confirmed.',
    'window-expired': 'The one-week confirmation window has closed.',
    unconfirmed: 'Still no confirmed genuine Karen run since the repair.',
  }[result.status];
  return `@sffan15-sys — ${heading}\n\n${result.reason}\n\n(This is the self-limiting post-repair confirmation check, watchdog.yml — closes ${WINDOW_END} regardless of outcome. The standing "Karen filed what she found" step above is the permanent alarm.)\n`;
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
    'pr', 'list', ...repoArgs, '--state', 'merged',
    '--json', 'number,title,mergedAt', '--limit', '50',
  ]);
  const prs = JSON.parse(stdout || '[]');
  const newestReport = readNewestReport();

  const result = evaluate({ prs, newestReport });
  console.log(`karen-post-repair: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result));

  process.exit(result.status === 'unconfirmed' ? 1 : 0);
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'karen-post-repair-check.mjs';
if (invokedDirectly) {
  try {
    await main();
  } catch (e) {
    console.error(`✗ karen-post-repair check could not run: ${e.message}`);
    process.exit(2);
  }
}
