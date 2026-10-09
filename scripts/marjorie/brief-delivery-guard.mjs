import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DELIVERY_MARKER = /<!--\s*(?:discord-message-id:\s*\d+|marjorie-brief-delivery-recovery)\s*-->/;

export function todayLA(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function validateBrief(issue, comments, { issueNumber, date }) {
  if (!issue || issue.pull_request || issue.number !== issueNumber) throw new Error('issue mismatch');
  if (issue.state !== 'open') throw new Error('issue is not open');
  if (issue.html_url !== `https://github.com/${issue.repository_url.split('/repos/')[1]}/issues/${issueNumber}`) throw new Error('issue URL mismatch');
  if (!(issue.labels || []).some((label) => (typeof label === 'string' ? label : label?.name) === 'founders-brief')) throw new Error('founders-brief label is missing');
  const title = `Founders' Brief — ${date}`;
  if (issue.title !== title) throw new Error(`title must be exactly: ${title}`);
  const header = `**${title}** · [issue #${issueNumber}](${issue.html_url})`;
  const lines = String(issue.body || '').replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== 'cc @sffan15-sys @wjduvall-cmd' || lines[1] !== '' || lines[2] !== header) throw new Error('brief self-header is invalid');
  if (DELIVERY_MARKER.test(issue.body || '') || comments.some((comment) => DELIVERY_MARKER.test(String(comment?.body || '')))) throw new Error('brief already has a delivery marker');
  return { body: issue.body, url: issue.html_url };
}

function ghJson(execImpl, endpoint) {
  return JSON.parse(execImpl('gh', ['api', endpoint], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

export function guard({ env = process.env, execImpl = execFileSync, writeImpl = writeFileSync, appendImpl = appendFileSync, now = new Date(), log = console.log } = {}) {
  try {
    if (env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch') throw new Error('manual main runs only');
    if (!/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY || '') || !/^\d+$/.test(env.ISSUE_NUMBER || '')) throw new Error('invalid input');
    const issueNumber = Number(env.ISSUE_NUMBER);
    const issue = ghJson(execImpl, `repos/${env.GITHUB_REPOSITORY}/issues/${issueNumber}`);
    const comments = [];
    for (let page = 1; page <= 20; page += 1) {
      const batch = ghJson(execImpl, `repos/${env.GITHUB_REPOSITORY}/issues/${issueNumber}/comments?per_page=100&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('comments unreadable');
      comments.push(...batch);
      if (batch.length < 100) break;
      if (page === 20) throw new Error('comment page cap');
    }
    const valid = validateBrief(issue, comments, { issueNumber, date: todayLA(now) });
    if (!env.BODY_FILE || !env.GITHUB_OUTPUT) throw new Error('output paths missing');
    writeImpl(env.BODY_FILE, valid.body);
    appendImpl(env.GITHUB_OUTPUT, `issue_url=${valid.url}\n`);
    log(`validated founders brief #${issueNumber} for delivery`);
    return 0;
  } catch (error) {
    console.error(`brief delivery refused: ${error instanceof Error ? error.message : 'unknown error'}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = guard();
