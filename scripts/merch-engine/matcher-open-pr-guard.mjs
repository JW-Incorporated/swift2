#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
export const MATCHER_BRANCH_PREFIX = 'merch-matcher/';
export const OPEN_PR_MAX_AGE_MS = 3 * 86_400_000;

export function openMatcherPr(prs, now = new Date()) {
  const cutoff = now.getTime() - OPEN_PR_MAX_AGE_MS;
  return (prs ?? []).find((pr) =>
    pr.headRefName?.startsWith(MATCHER_BRANCH_PREFIX) && Date.parse(pr.createdAt) > cutoff,
  ) ?? null;
}

export async function findOpenMatcherPr({ run = execFileAsync, now = new Date() } = {}) {
  const { stdout } = await run('gh', [
    'pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number,headRefName,createdAt',
  ]);
  return openMatcherPr(JSON.parse(stdout || '[]'), now);
}

async function main() {
  const pr = await findOpenMatcherPr();
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `number=${pr?.number ?? ''}\n`);
  console.log(pr ? `matcher PR #${pr.number} is still open; skipping this run` : 'no open matcher PR');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => { console.error(`matcher-open-pr-guard: ${error.message}`); process.exitCode = 1; });
}
