// A green model invocation is not evidence that the intake bridge ran.
// Check its durable, run-specific receipt on the existing shared log.
import { ghApi } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';

const RECEIPT_AUTHORS = new Set(['github-actions[bot]', 'claude[bot]']);

export function findReceipt(comments, { runId, attempt, startedAt }) {
  if (!/^\d+$/.test(String(runId)) || !/^\d+$/.test(String(attempt))) {
    throw new Error('A numeric run ID and attempt are required');
  }
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) throw new Error('A valid run start time is required');
  const marker = `news-triage-run: ${runId}/${attempt}`;
  return comments.find((comment) => {
    if (!RECEIPT_AUTHORS.has(comment.user?.login)) return false;
    const created = Date.parse(comment.created_at);
    if (!Number.isFinite(created) || created < start) return false;
    const lines = String(comment.body ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim());
    return (
      lines.includes(marker) &&
      lines.some((line) => /^consumed-snapshot: \S+\.md$/.test(line)) &&
      lines.some((line) => /^stories-reviewed: \d+$/.test(line)) &&
      lines.some((line) => /^triage-outcome: (filed|no-items)$/.test(line))
    );
  });
}

export async function verifyReceipt({ repo, runId, attempt, api = ghApi }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) throw new Error('A repository is required');
  if (!/^\d+$/.test(String(runId)) || !/^\d+$/.test(String(attempt))) {
    throw new Error('A numeric run ID and attempt are required');
  }
  const run = await api(`/repos/${repo}/actions/runs/${runId}/attempts/${attempt}`);
  const startedAt = run.run_started_at;
  if (!Number.isFinite(Date.parse(startedAt))) throw new Error('Run start time unavailable');
  // `since` filters updated_at. findReceipt separately requires created_at,
  // so editing an old receipt can never satisfy a new invocation.
  for (let page = 1; page <= 20; page++) {
    const comments = await api(
      `/repos/${repo}/issues/502/comments?since=${encodeURIComponent(startedAt)}&per_page=100&page=${page}`,
    );
    if (!Array.isArray(comments)) throw new Error('Invalid comments response');
    const receipt = findReceipt(comments, { runId, attempt, startedAt });
    if (receipt) return receipt;
    if (comments.length < 100) break;
  }
  throw new Error(
    `News Triage ${runId}/${attempt} left no completed receipt on #502. Check the digest read, issue filing and run-log delivery; Claude success alone does not prove triage ran.`,
  );
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'check-triage-receipt.mjs') {
  runMain(async () => {
    const receipt = await verifyReceipt({
      repo: process.env.GITHUB_REPOSITORY,
      runId: process.env.GITHUB_RUN_ID,
      attempt: process.env.GITHUB_RUN_ATTEMPT,
    });
    console.log(`News Triage receipt verified: ${receipt.html_url}`);
  });
}
