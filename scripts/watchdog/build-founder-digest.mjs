// Founder-task digest builder — deterministic, zero AI.
//
// THE BUG THIS EXISTS FOR (2026-08-11): tree-mail.yml originally mailed the
// founders instantly on EVERY issue opened with the `founder-task` label, with
// a "Tree needs ~15 min of founder time" subject line. Then a Wyatt-side
// deconfliction pass opened four labelled issues (#1955-#1958) inside 30
// seconds, and Joey got four near-duplicate emails at once — attributed to
// Tree, an agent that had never run. Two failures in one: any burst of N
// labelled issues produced N instant emails, and every one of them wore Tree's
// name regardless of author.
//
// THE FIX: the workflow now sweeps on a schedule instead of firing per event.
// This script turns "all open `founder-task` issues not yet mailed" into ONE
// mail payload for scripts/watchdog/send-mail.py (whose contract —
// {subject, body, url} — is unchanged), plus the list of issue numbers to mark
// with the `founder-mailed` bookkeeping label after a successful send.
//
// Subject attribution: only Tree's own weekly issue (title convention
// `founder-task: social reach week of <date>`, per docs/marketing/
// social-strategy.md) gets a Tree subject, and only when it is the sole issue
// in the sweep. Everything else is a neutral "Founder action needed".
//
// Usage: node build-founder-digest.mjs <issues.json> <payload.json> <numbers.txt>
//   issues.json  gh issue list --label founder-task --state open
//                  --json number,title,body,url,labels
//   payload.json written only when there is something to mail
//   numbers.txt  written alongside it, one issue number per line
import { readFileSync, writeFileSync } from 'node:fs';

export const FOUNDER_TASK_LABEL = 'founder-task';
export const MAILED_LABEL = 'founder-mailed';
// Tree's weekly issue title convention (docs/marketing/social-strategy.md §7).
export const TREE_TITLE_PREFIX = 'founder-task: social reach';

/** @param {{labels?: {name: string}[]}} issue */
const labelNames = (issue) => (issue.labels ?? []).map((l) => l.name);

/** An issue the sweep should mail: labelled, and not already mailed. */
export function needsMail(issue) {
  const names = labelNames(issue);
  return names.includes(FOUNDER_TASK_LABEL) && !names.includes(MAILED_LABEL);
}

export function isTreeWeekly(issue) {
  return (issue.title ?? '').toLowerCase().startsWith(TREE_TITLE_PREFIX);
}

/**
 * Build the single digest payload for a sweep.
 *
 * @param {Array<{number: number, title: string, body?: string, url: string,
 *   labels?: {name: string}[]}>} issues - open founder-task issues
 * @param {string} repo - "owner/name", for the multi-issue label-query link
 * @returns {null | {payload: {subject: string, body: string, url: string},
 *   numbers: number[]}} null when there is nothing to mail
 */
export function buildDigest(issues, repo) {
  const due = issues.filter(needsMail).sort((a, b) => a.number - b.number);
  if (due.length === 0) return null;

  let subject;
  if (due.length === 1) {
    // Attribution fix: only Tree's own artifact wears Tree's name.
    subject = isTreeWeekly(due[0])
      ? `Tree needs ~15 min of founder time: ${due[0].title}`
      : `Founder action needed: ${due[0].title}`;
  } else {
    subject = `Founder action needed: ${due.length} tasks waiting`;
  }

  const sections = due.map(
    (i) => `## ${i.title}\n\n${i.url}\n\n${i.body?.trim() || '(no issue body)'}`,
  );
  const intro =
    due.length === 1
      ? []
      : [
          `${due.length} founder tasks were opened since the last sweep — ` +
            'batched into this one email so a burst of issues never becomes a burst of mail.',
        ];
  const body = [...intro, ...sections].join('\n\n---\n\n');

  const url =
    due.length === 1
      ? due[0].url
      : `https://github.com/${repo}/issues?q=is%3Aissue+is%3Aopen+label%3A${FOUNDER_TASK_LABEL}`;

  return { payload: { subject, body, url }, numbers: due.map((i) => i.number) };
}

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  const [issuesFile, payloadFile, numbersFile] = process.argv.slice(2);
  if (!issuesFile || !payloadFile || !numbersFile) {
    console.error('Usage: build-founder-digest.mjs <issues.json> <payload.json> <numbers.txt>');
    process.exit(2);
  }
  const issues = JSON.parse(readFileSync(issuesFile, 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY ?? '';
  const digest = buildDigest(issues, repo);
  if (!digest) {
    console.log('No unmailed founder-task issues — nothing to send.');
  } else {
    writeFileSync(payloadFile, JSON.stringify(digest.payload));
    writeFileSync(numbersFile, digest.numbers.join('\n') + '\n');
    console.log(
      `Digest of ${digest.numbers.length} issue(s): ${digest.numbers.join(', ')} -> ${payloadFile}`,
    );
  }
}
