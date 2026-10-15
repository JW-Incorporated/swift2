#!/usr/bin/env node
// Decides a routine's final outcome after `anthropics/claude-code-action` ran
// with `continue-on-error: true`. The action fails the step when a SUCCESSFUL
// session used more turns than --max-turns ("Claude reported a successful
// result after 42 turns, exceeding the configured maximum of 40"); that is a
// false failure. A genuine cutoff (`error_max_turns`), any error, or a missing
// result stays a failure.
//
// A failure message must name its cause. The action hides the session output
// ("full output hidden for security"), so for a long time a failing routine
// logged only `subtype=success is_error=true` — unreadable, and routine-failure
// issues inherited that dead end (issue #5281: six identical failures nobody
// could diagnose). The terminal result message carries the reason; this script
// surfaces it, redacted and truncated, and names the two shapes that are not
// code defects: an exhausted plan-usage window and a session that failed before
// its first API call.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Redacted before anything reaches a (public) Actions log or a filed issue.
const TOKENISH =
  /(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|[A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{40,}={0,2})/g;
const DETAIL_MAX = 240;
const WEEKLY_LIMIT_FALLBACK_MS = 6 * 60 * 60 * 1000;
const WEEKLY_LIMIT_LABEL = 'claude-weekly-limit';

function asDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseWeeklyReset(text, now) {
  const iso = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z)$/i);
  if (iso) return asDate(iso[1]);

  const utcTime = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\((?:UTC|GMT)\)$/i);
  if (!utcTime) return null;
  let hour = Number(utcTime[1]) % 12;
  if (utcTime[3].toLowerCase() === 'pm') hour += 12;
  const minute = Number(utcTime[2] ?? 0);
  if (hour > 23 || minute > 59) return null;
  const reset = new Date(now);
  reset.setUTCHours(hour, minute, 0, 0);
  if (reset <= now) reset.setUTCDate(reset.getUTCDate() + 1);
  return reset;
}

/** Pure: a terminal result message -> a one-line, redacted reason, or null. */
export function resultDetail(result) {
  const raw =
    typeof result?.result === 'string'
      ? result.result
      : typeof result?.error === 'string'
        ? result.error
        : typeof result?.error?.message === 'string'
          ? result.error.message
          : '';
  const text = raw.replace(TOKENISH, '[redacted]').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > DETAIL_MAX ? `${text.slice(0, DETAIL_MAX)}…` : text;
}

/** Pure: a weekly-limit result -> a bounded reset record, or null. */
export function weeklyLimitInfo(result, { now = new Date() } = {}) {
  const detail = resultDetail(result) ?? '';
  const match = detail.match(
    /you(?:'|’)ve hit your weekly limit\s*(?:[-–—·?]\s*)?resets\s+(.+)$/i,
  );
  if (!match) return null;
  const detectedAt = asDate(now) ?? new Date();
  const parsedReset = parseWeeklyReset(match[1].trim(), detectedAt);
  const reset = parsedReset ?? new Date(detectedAt.getTime() + WEEKLY_LIMIT_FALLBACK_MS);
  return {
    detectedAt: detectedAt.toISOString(),
    resetAt: reset.toISOString(),
    parsed: Boolean(parsedReset),
  };
}

/** Pure: a terminal result message -> a note on why it is not a code defect, or null. */
export function failureHint(result, options) {
  const detail = resultDetail(result) ?? '';
  const weekly = weeklyLimitInfo(result, options);
  if (weekly) {
    const fallback = weekly.parsed ? '' : ' (safe six-hour fallback)';
    return `plan usage for this account is exhausted, resets ${weekly.resetAt}${fallback} — transient, not a code defect`;
  }
  const limit = detail.match(/usage limit reached\|?(\d{10,13})?/i);
  if (limit) {
    const stamp = Number(limit[1]);
    const resets =
      Number.isFinite(stamp) && stamp > 0 ? new Date(stamp < 1e12 ? stamp * 1000 : stamp) : null;
    const when =
      resets && !Number.isNaN(resets.getTime()) ? `, resets ${resets.toISOString()}` : '';
    return `plan usage for this account is exhausted${when} — transient, not a code defect; the next scheduled run recovers`;
  }
  const noTurns =
    Number(result?.num_turns ?? 0) <= 1 &&
    Number(result?.total_cost_usd ?? 0) === 0 &&
    Object.keys(result?.modelUsage ?? {}).length === 0;
  if (noTurns && !detail) {
    return 'no model turns ran and nothing was billed — the session failed before its first API call (auth, usage limit, or a rejected CLI argument)';
  }
  return null;
}

/** Pure: execution-log JSON text (or null) -> { pass, message }. */
export function decideOutcome(rawLog, { maxTurns, now, stepOutcome } = {}) {
  if (stepOutcome === 'success') return { pass: true, message: null };
  if (rawLog == null)
    return { pass: false, message: 'no execution file — treating the routine step as failed' };
  let log;
  try {
    log = JSON.parse(rawLog);
  } catch {
    return {
      pass: false,
      message: 'execution file is not valid JSON — treating the routine step as failed',
    };
  }
  let result = null;
  if (Array.isArray(log)) {
    for (let i = log.length - 1; i >= 0; i -= 1) {
      if (log[i] && log[i].type === 'result') {
        result = log[i];
        break;
      }
    }
  }
  if (!result)
    return {
      pass: false,
      message: 'no terminal result message — treating the routine step as failed',
    };
  const weeklyLimit = result.is_error === true ? weeklyLimitInfo(result, { now }) : null;
  if (weeklyLimit) {
    return {
      pass: true,
      message: failureHint(result, { now }),
      weeklyLimit,
    };
  }
  if (result.subtype === 'success' && result.is_error === false) {
    if (!(Number(result.num_turns) > Number(maxTurns))) {
      return {
        pass: false,
        message: `action failed but the session was not over its turn cap (turns ${result.num_turns ?? 'unknown'}, cap ${maxTurns ?? 'unknown'}) — routine step failed`,
      };
    }
    return {
      pass: true,
      message: `session used ${result.num_turns ?? 'unknown'} turns (cap ${maxTurns ?? 'unknown'}) — consider raising max_turns`,
    };
  }
  const parts = [
    `session result subtype=${result.subtype ?? 'unknown'} is_error=${result.is_error ?? 'unknown'} — routine step failed`,
  ];
  const detail = resultDetail(result);
  if (detail) parts.push(`reason: ${detail}`);
  const hint = failureHint(result);
  if (hint) parts.push(hint);
  return { pass: false, message: parts.join(' · ') };
}

export function weeklyLimitIssueBody({ detectedAt, parsed, resetAt, backupResetAt, existingBody }) {
  if (backupResetAt && existingBody) {
    return String(existingBody).replace(/^claude-weekly-limit-reset-backup:.*\r?\n?/im, '')
      .replace(/^claude-weekly-limit-reset:.*$/im, `$&\nclaude-weekly-limit-reset-backup: ${backupResetAt}`);
  }
  return [
    '<!-- claude-weekly-limit -->',
    `claude-weekly-limit-reset: ${resetAt}`,
    ...(backupResetAt ? [`claude-weekly-limit-reset-backup: ${backupResetAt}`] : []),
    `claude-weekly-limit-detected: ${detectedAt}`,
    `claude-weekly-limit-parse: ${parsed ? 'exact' : 'fallback-6h'}`,
    '',
    'Claude routines reached the shared weekly plan limit. This issue is updated in place.',
  ].join('\n');
}

export function dedupeWeeklyLimitIssues(issues) {
  const unique = new Map();
  for (const issue of issues) {
    if (!issue.pull_request) unique.set(issue.number, issue);
  }
  const [keeper, ...duplicates] = [...unique.values()].sort((a, b) => a.number - b.number);
  return { keeper, duplicates };
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
  if (response.status === 204) return null;
  return response.json();
}

async function syncWeeklyLimitIssue(limit, tokenSource) {
  const token = process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) throw new Error('missing GitHub issue context');
  const base = `/repos/${repository}`;
  try {
    await githubRequest(`${base}/labels/${WEEKLY_LIMIT_LABEL}`, { token });
  } catch (error) {
    if (!String(error.message).endsWith('returned 404')) throw error;
    try {
      await githubRequest(`${base}/labels`, {
        method: 'POST',
        token,
        body: {
          name: WEEKLY_LIMIT_LABEL,
          color: 'D4C5F9',
          description: 'Claude weekly plan limit is active',
        },
      });
    } catch (createError) {
      if (!String(createError.message).endsWith('returned 422')) throw createError;
    }
  }

  const listOpen = () =>
    githubRequest(
      `${base}/issues?state=open&labels=${encodeURIComponent(WEEKLY_LIMIT_LABEL)}&per_page=100`,
      { token },
    );
  let issues = await listOpen();
  const title = `Claude weekly limit — resets ${limit.resetAt}`;
  let body = weeklyLimitIssueBody({ ...limit, backupResetAt: tokenSource === 'backup' ? limit.resetAt : null });
  if (issues.length === 0) {
    const created = await githubRequest(`${base}/issues`, {
      method: 'POST',
      token,
      body: { title, body, labels: [WEEKLY_LIMIT_LABEL] },
    });
    issues = [...(await listOpen()), created];
  }
  const { keeper, duplicates } = dedupeWeeklyLimitIssues(issues);
  if (!keeper) throw new Error('weekly-limit issue was not returned after creation');
  body = weeklyLimitIssueBody({
    ...limit, backupResetAt: tokenSource === 'backup' ? limit.resetAt : null, existingBody: keeper.body,
  });
  await githubRequest(`${base}/issues/${keeper.number}`, {
    method: 'PATCH',
    token,
    body: { title, body },
  });
  for (const duplicate of duplicates) {
    await githubRequest(`${base}/issues/${duplicate.number}`, {
      method: 'PATCH',
      token,
      body: { state: 'closed', state_reason: 'duplicate' },
    });
  }
}

async function main() {
  const stepOutcome = process.env.STEP_OUTCOME;
  const file = process.env.EXECUTION_FILE;
  let raw = null;
  if (file) {
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      raw = null;
    }
  }
  const { pass, message, weeklyLimit } = decideOutcome(raw, {
    maxTurns: process.env.MAX_TURNS,
    stepOutcome,
  });
  if (pass) {
    if (weeklyLimit) {
      try {
        await syncWeeklyLimitIssue(weeklyLimit, process.env.TOKEN_SOURCE);
      } catch {
        console.log('::warning::weekly limit detected, but its tracking issue could not be updated');
      }
    }
    if (message) console.log(`::warning::${message}`);
    return 0;
  }
  console.log(`::error::${message}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
