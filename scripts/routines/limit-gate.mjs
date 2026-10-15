#!/usr/bin/env node
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LABEL = 'claude-weekly-limit';
const FALLBACK_MS = 6 * 60 * 60 * 1000;

function dateOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bodyValue(body, key) {
  const match = String(body ?? '').match(new RegExp(`^${key}:\\s*(.+)$`, 'im'));
  return match?.[1].trim() ?? null;
}

export function issueReset(issue, { now = new Date() } = {}) {
  const current = dateOrNull(now) ?? new Date();
  const reset = dateOrNull(bodyValue(issue?.body, 'claude-weekly-limit-reset'));
  if (reset) return { resetAt: reset.toISOString(), fallback: false };

  const detected = dateOrNull(bodyValue(issue?.body, 'claude-weekly-limit-detected'));
  const created = dateOrNull(issue?.createdAt ?? issue?.created_at);
  const fallbackStart =
    (detected && detected <= current && detected) ||
    (created && created <= current && created);
  return {
    resetAt: (fallbackStart
      ? new Date(fallbackStart.getTime() + FALLBACK_MS)
      : current
    ).toISOString(),
    fallback: true,
  };
}

/** Pure decision used by the workflow entry point and unit tests. */
export function decideLimitGate({ issues = [], now = new Date(), priority, routinesPaused } = {}) {
  if (routinesPaused === true || routinesPaused === 'true') {
    return { skip: true, message: 'skipped: routines paused' };
  }
  if (issues.length === 0) return { skip: false, message: null };

  const issue = [...issues].sort((a, b) => Number(a.number) - Number(b.number))[0];
  const reset = issueReset(issue, { now });
  if (new Date(reset.resetAt) <= new Date(now)) {
    return { skip: false, message: null, closeIssueNumber: issue.number };
  }
  if (priority === 'content') return { skip: false, message: null };
  return {
    skip: true,
    message: `skipped: weekly limit until ${reset.resetAt}`,
  };
}

async function githubRequest(pathname, { body, method = 'GET', token } = {}) {
  const response = await fetch(`${process.env.GITHUB_API_URL ?? 'https://api.github.com'}${pathname}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`GitHub API ${method} ${pathname} returned ${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function writeSkip(skip) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `skip=${skip}\n`, 'utf8');
  }
}

async function main() {
  if (process.env.ROUTINES_PAUSED === 'true') {
    console.log('skipped: routines paused');
    await writeSkip(true);
    return;
  }

  const token = process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) throw new Error('missing GitHub issue context');
  const base = `/repos/${repository}`;
  const issues = (await githubRequest(
    `${base}/issues?state=open&labels=${encodeURIComponent(LABEL)}&per_page=100`,
    { token },
  )).filter((issue) => !issue.pull_request);
  const decision = decideLimitGate({
    issues,
    priority: process.env.ROUTINE_PRIORITY,
    routinesPaused: process.env.ROUTINES_PAUSED,
  });
  if (decision.closeIssueNumber) {
    await githubRequest(`${base}/issues/${decision.closeIssueNumber}`, {
      method: 'PATCH',
      token,
      body: { state: 'closed', state_reason: 'completed' },
    });
  }
  if (decision.message) console.log(decision.message);
  await writeSkip(decision.skip);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`::error::weekly-limit gate failed: ${error.message}`);
    process.exitCode = 1;
  });
}
