import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Default `runGhApi`: shells out to the real `gh` CLI against GitHub's
 * "list pull requests associated with a commit" endpoint. Tests inject a
 * fake `runGhApi` instead — this default path is never exercised by a unit
 * test, same discipline as every other real-network call in this track.
 */
async function defaultRunGhApi(sha, repo) {
  const { stdout } = await execFileAsync('gh', [
    'api',
    `repos/${repo}/commits/${sha}/pulls`,
    '--jq',
    '.[0].merged_by.login,.[0].merged_at',
  ]);
  return stdout;
}

/**
 * Looks up who/when the CURRENT content of a `social/queue/**` file was
 * approved. Two Codex review rounds (2026-09-10, see `DEBUG.md`) found that
 * local git metadata cannot answer this — a GitHub web-UI squash merge's
 * author is the original drafter and its committer is GitHub's own bot
 * identity, neither is the founder who clicked "Merge." The actual answer
 * is GitHub-API-only data: `GET /repos/{owner}/{repo}/commits/{sha}/pulls`
 * returns the PR(s) associated with a commit, and `merged_by`/`merged_at`
 * on the first result is exactly "who approved, and when."
 *
 * Two steps: (1) find the SHA of the most recent commit touching this file
 * — the same local `git log` lookup the earlier (wrong) implementations
 * used, kept as-is since finding the commit was never the broken part; (2)
 * ask GitHub's API what PR that commit belongs to and who merged it.
 *
 * Provenance only, never a gate (post-queue.mjs's caller does not block on
 * this): ANY failure — no git history for the file, `repo` unknown, the
 * `gh` CLI unavailable/unauthenticated in whatever context calls this, a
 * network hiccup, or a commit with no associated PR at all (e.g. a direct
 * push, or `merged_by` is `null` because the PR was closed without merging)
 * — comes back as `{ approvedBy: null, approvedAt: null }` rather than
 * throwing, so a best-effort metadata lookup can never stop a real post.
 */
export async function getQueueFileProvenance(
  relativePath,
  {
    cwd = process.cwd(),
    execFileImpl = execFileAsync,
    repo = process.env.GITHUB_REPOSITORY,
    runGhApi = defaultRunGhApi,
  } = {},
) {
  try {
    if (!repo) return { approvedBy: null, approvedAt: null };

    const { stdout } = await execFileImpl('git', ['log', '--format=%H', '-1', '--', relativePath], {
      cwd,
    });
    const sha = String(stdout ?? '').trim();
    if (!sha) return { approvedBy: null, approvedAt: null };

    const raw = await runGhApi(sha, repo);
    // `--jq '.[0].merged_by.login,.[0].merged_at'` prints one value per
    // line; either can legitimately be the literal string "null" (no
    // associated PR at all, or a PR that was closed without merging).
    const [approvedByRaw, approvedAtRaw] = String(raw ?? '').trim().split('\n');
    const approvedBy = approvedByRaw && approvedByRaw !== 'null' ? approvedByRaw : null;
    const approvedAt = approvedAtRaw && approvedAtRaw !== 'null' ? approvedAtRaw : null;
    return { approvedBy, approvedAt };
  } catch {
    return { approvedBy: null, approvedAt: null };
  }
}
