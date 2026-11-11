import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CAP_STOP_REASON } from './audit-matches-authoring-config.mjs';

const execFileAsync = promisify(execFile);

export function capIssueContent(artifact) {
  if (artifact?.run?.stopReason !== CAP_STOP_REASON) return null;
  const remaining = (artifact.judgments ?? []).filter((judgment) =>
    judgment.reasons?.includes('not judged before run cap'),
  );
  return {
    title: 'E3 vision judgment: pairs remaining after run cap',
    body: [
      'The E3 authoring runner stopped before the next pre-call reservation would reach its cap.',
      '',
      `Cap: $${artifact.run.capUsd}; reserved: $${artifact.run.reservedCostUsd}; completed: ${artifact.run.completedJudgments}.`,
      '',
      'Remaining detector pairs:',
      ...remaining.map(
        (judgment) => `- ${judgment.productId} (${judgment.cacheKey ?? 'no cache key'})`,
      ),
    ].join('\n'),
  };
}

export async function upsertCapIssue(
  content,
  { execImpl = (args) => execFileAsync('gh', args) } = {},
) {
  if (!content) return null;
  const search = await execImpl([
    'issue', 'list', '--search', `"${content.title}" in:title`, '--state', 'open',
    '--json', 'number,url,title',
  ]);
  const issues = JSON.parse(search.stdout || '[]');
  const existing = issues.find((issue) => issue.title === content.title);
  if (existing) {
    await execImpl(['issue', 'comment', String(existing.number), '--body', content.body]);
    return existing.url;
  }
  const created = await execImpl([
    'issue', 'create', '--title', content.title, '--body', content.body,
  ]);
  return created.stdout.trim();
}

/**
 * Spec P2 (issue #3447): a below-25 `mismatch` must not stay in place. This
 * builds one E6 re-source ticket per demoted product carrying the auditor's
 * own reasons, so a human/E6 lane can find a replacement candidate without
 * re-deriving why the original was rejected. Filed the same way as the cap
 * follow-up issue (one exact-title issue, reused via comment on repeat runs)
 * so re-running authoring never spawns duplicate tickets.
 */
export function reSourceIssueContent(artifact) {
  const demotions = Array.isArray(artifact?.demotions) ? artifact.demotions : [];
  if (demotions.length === 0) return null;
  return {
    title: 'E3 vision judgment: products demoted below match-tier floor',
    body: [
      'The E3 auditor scored these products below 25 (mismatch) against their',
      'source moment photo. Per spec P2, they must be removed from the',
      "moment's products and re-sourced — do not restore the same listing",
      'without a new, higher-scoring vision judgment.',
      '',
      ...demotions.map((demotion) => {
        const reasons = Array.isArray(demotion.auditorReasons)
          ? demotion.auditorReasons.map((reason) => `  - ${reason}`).join('\n')
          : '  - (reasons not attached)';
        return [
          `- ${demotion.productId}`,
          `  url: ${demotion.url ?? '(unknown)'}`,
          reasons,
        ].join('\n');
      }),
    ].join('\n'),
  };
}
