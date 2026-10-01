// A recorded decision reaches the tickets it is about (Bots v2 W7). When the
// owner replies `decide #N <choice>` on the status page, the reply job closes
// the human-action item — and the item's own text is the only place that names
// the issues and PRs the decision affects, and it leaves HUMAN-ACTIONS.md the
// moment it closes. So the reply job calls this once, before that text is
// gone: it comments the decision on every issue/PR the item references, once
// each (a hidden marker, trusted only from the workflow identity), so the bot
// that owns each ticket sees the answer where it is already looking.
// Marjorie's brief then acts on it (docs/agents/runner-prompts/marjorie-brief.md).
// Best effort: a failure is logged and never undoes the recorded decision.
import { neutralizeAt } from './loop-asks.mjs';

const MAX_REFS = 5;
const BOT_LOGINS = new Set(['github-actions[bot]', 'github-actions', 'app/github-actions']);
const marker = (haNumber) => `<!-- decision-propagated: HA-${haNumber} -->`;

/** The item's block: its `## #N` heading to the next heading or `---` rule. */
export function blockOf(openMd, number) {
  const lines = String(openMd || '').replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+#${number}\\s`).test(l));
  if (start === -1) return '';
  let end = start + 1;
  while (end < lines.length && !/^##\s+#\d+\s/.test(lines[end]) && lines[end].trim() !== '---') end += 1;
  return lines.slice(start, end).join('\n');
}

/**
 * Issue/PR numbers the text points at: `#1234` (three digits or more — HA
 * numbers are shorter, and `HA #123` is skipped) and links into this repo.
 * First mention order, de-duplicated, capped.
 */
export function issueRefs(text, { repo, exclude = [] } = {}) {
  const found = [];
  const add = (n) => {
    const num = Number(n);
    if (Number.isInteger(num) && num > 0 && !exclude.includes(num) && !found.includes(num)) found.push(num);
  };
  const re = new RegExp(`(?<![\\w/])(?<!HA )#(\\d{3,7})\\b|github\\.com/${String(repo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?:issues|pull)/(\\d+)`, 'g');
  for (const m of String(text || '').matchAll(re)) add(m[1] ?? m[2]);
  return found.slice(0, MAX_REFS);
}

export function renderDecisionComment({ number, title, choice, outcome, url }) {
  const safe = (s) => neutralizeAt(String(s ?? '')).replace(/<!--/g, '&lt;!--').replace(/\s+/g, ' ').trim();
  const verb = outcome === 'skip' ? 'skipped' : 'decided';
  return [
    `**Owner ${verb} on human action #${number} — ${safe(title)}:** \`${safe(choice).replace(/`/g, "'")}\``,
    `Recorded on the status page: ${url}`,
    `Whoever owns this ticket: act on it now, or comment why you can't. Marjorie checks it at the next brief.`,
    marker(number),
  ].join('\n\n');
}

/** Never throws. `run(cmd, args)` executes `gh` synchronously and returns stdout. */
export async function propagateDecision({ openMd, number, title, choice, outcome = 'done', url, repo, run, log = console.log }) {
  const posted = [];
  let refs = [];
  try {
    refs = issueRefs(blockOf(openMd, number), { repo });
    for (const ref of refs) {
      const comments = JSON.parse(String(run('gh', ['api', `repos/${repo}/issues/${ref}/comments?per_page=100`])).trim() || '[]');
      if (comments.some((c) => BOT_LOGINS.has(c?.user?.login) && String(c.body ?? '').includes(marker(number)))) continue;
      run('gh', ['issue', 'comment', String(ref), '--repo', repo, '--body', renderDecisionComment({ number, title, choice, outcome, url })]);
      posted.push(ref);
    }
  } catch (err) {
    log(`decision propagation for HA #${number} stopped: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
  }
  if (refs.length) log(`decision propagation for HA #${number}: commented on ${posted.length ? posted.map((n) => `#${n}`).join(', ') : 'nothing new'} (referenced: ${refs.map((n) => `#${n}`).join(', ')})`);
  return { refs, posted };
}
