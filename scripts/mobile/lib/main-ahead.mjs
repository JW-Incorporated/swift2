// MAIN_AHEAD — is production lagging the newest mobile-relevant commit on main?
//
// The parity rules in check-parity.mjs compare iOS with Android; none notices
// when BOTH are stuck behind main (the release train failed or never ran).
// `evaluateMainAhead` is pure; `readGitState` takes an injected runner so the
// git answers (head commit, ancestry) can be faked in tests.

export const DEFAULT_MAIN_AHEAD_HOURS = 6;
export const DEFAULT_MAIN_REF = 'origin/main';

// Paths whose changes must reach the stores; docs-only commits never do.
export const MOBILE_PATHSPEC = [
  'apps/mobile',
  'packages',
  'package-lock.json',
  ':(exclude)**/*.md',
];

/**
 * Newest main commit touching mobile-relevant paths, plus, for every
 * candidate commit, whether it contains that head (head is an ancestor of, or
 * equal to, the candidate).
 *
 * `run(args)` runs git with an args array and returns stdout; it throws on a
 * nonzero exit, with the exit code on `err.status` and stderr on `err.stderr`.
 *
 * @param {(args: string[]) => string} run
 * @param {{ mainRef?: string, commits?: Array<string | undefined | null> }} opts
 * @returns {{ mainHead: string | null, mainHeadTime: string | null, ancestry: Record<string, boolean> }}
 */
export function readGitState(run, { mainRef = DEFAULT_MAIN_REF, commits = [] } = {}) {
  const out = String(
    run(['log', '-1', '--format=%H%x09%cI', mainRef, '--', ...MOBILE_PATHSPEC]),
  ).trim();
  if (!out) return { mainHead: null, mainHeadTime: null, ancestry: {} };
  const [mainHead, mainHeadTime] = out.split('\t');
  const ancestry = {};
  for (const commit of new Set(commits.filter(Boolean))) {
    ancestry[commit] = isAncestor(run, mainHead, commit);
  }
  return { mainHead, mainHeadTime: mainHeadTime ?? null, ancestry };
}

function isAncestor(run, ancestor, commit) {
  try {
    run(['merge-base', '--is-ancestor', ancestor, commit]);
    return true;
  } catch (err) {
    if (err?.status === 1) return false;
    // A commit this clone has never seen cannot contain main's head — but
    // only when git itself says it is unknown; any other failure is real.
    const stderr = String(err?.stderr ?? '');
    if (err?.status === 128 && /not a valid (commit|object) name/i.test(stderr)) return false;
    throw err;
  }
}

/**
 * @param {{
 *   mainHead: string | null | undefined,
 *   mainHeadTime: string | null | undefined,
 *   platforms: Array<{ name: string, publishCommit?: string, buildCommit?: string }>,
 *   ancestry: Record<string, boolean>,
 *   now?: number,
 *   thresholdHours?: number,
 * }} input
 * @returns {Array<{ code: 'MAIN_AHEAD', detail: string }>}
 */
export function evaluateMainAhead({
  mainHead,
  mainHeadTime,
  platforms,
  ancestry,
  now = Date.now(),
  thresholdHours = DEFAULT_MAIN_AHEAD_HOURS,
}) {
  if (!mainHead || !mainHeadTime) return [];
  const behind = (platforms ?? []).filter(
    (p) => !(ancestry?.[p.publishCommit] || ancestry?.[p.buildCommit]),
  );
  if (!behind.length) return [];
  const ageH = (now - new Date(mainHeadTime).getTime()) / 36e5;
  if (!(ageH > thresholdHours)) return [];
  return [
    {
      code: 'MAIN_AHEAD',
      detail: `${behind.map((p) => p.name).join(' and ')} not carrying main @${mainHead.slice(0, 8)} (committed ${Math.round(ageH)}h ago, threshold ${thresholdHours}h) — neither the latest publish nor the latest store build contains it`,
    },
  ];
}

/** 1 if any parity finding, else 3 if only MAIN_AHEAD, else 0. */
export function exitCodeFor(findings) {
  if (findings.some((f) => f.code !== 'MAIN_AHEAD')) return 1;
  return findings.length ? 3 : 0;
}
