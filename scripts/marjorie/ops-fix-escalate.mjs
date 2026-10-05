// Builds the escalation text the ops-fixer posts when it cannot finish
// (2 failed attempts, or a rail it may not cross): a copy-paste PROMPT in a
// fenced block plus where to paste it (founder requirement, 2026-10-05), and
// the matching HUMAN-ACTIONS.md v2 entry. Pure text; the routine writes it.
//
//   node scripts/marjorie/ops-fix-escalate.mjs comment <spec.json>
//   node scripts/marjorie/ops-fix-escalate.mjs ha <spec.json>
//   node scripts/marjorie/ops-fix-escalate.mjs auto <issue> <reason> [runUrl] [title]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';

export const WHERE = {
  swift2: 'Claude Code in Documents\\Claude\\Projects\\Swift2',
  hermes: 'Claude Code in Documents\\Claude\\Projects\\Hermes',
};
const NEED = ['issue', 'found', 'tried', 'goal', 'acceptance'];

function check(spec) {
  for (const k of NEED) if (!String(spec[k] ?? '').trim()) throw new Error(`spec.${k} is required`);
  if (!WHERE[spec.project]) throw new Error('spec.project must be "swift2" or "hermes"');
}

export function renderPrompt(spec) {
  check(spec);
  const n = spec.issue;
  return [
    `Fix JW-Incorporated/swift2 issue #${n}${spec.title ? ` (${spec.title})` : ''}. Work from ${WHERE[spec.project]}; read its CLAUDE.md first.`,
    `What was found: ${spec.found}`,
    `What was tried (do not repeat): ${spec.tried}`,
    `Exact goal: ${spec.goal}`,
    `Acceptance check: ${spec.acceptance}`,
    `When done, open a PR that says "Fixes #${n}" and land it per CLAUDE.md, then comment the PR link on #${n}.`,
  ].join('\n\n');
}

export function renderComment(spec) {
  const prompt = renderPrompt(spec);
  const fence = prompt.includes('```') ? '````' : '```';
  return [
    `ops-fix:stuck — ${spec.reason || 'the ops-fixer could not finish this one'}.`,
    '',
    `**Where to paste:** ${WHERE[spec.project]}`,
    '',
    `${fence}text`,
    prompt,
    fence,
    '',
    `<!-- ops-fix-stuck:${spec.issue} -->`,
  ].join('\n');
}

export function renderHa(spec) {
  check(spec);
  if (!Number.isInteger(spec.ha) || !spec.date) throw new Error('spec.ha (number) and spec.date are required');
  const title = spec.title || `Ops-fixer is stuck on #${spec.issue}`;
  return [
    `## #${spec.ha} 🔴 [BLOCKING] ${title} (~5 min)`,
    `<!-- ha filed=${spec.date} -->`,
    '',
    `**Why:** ${spec.why || `The ops-fixer could not fix #${spec.issue} and needs a session with more reach.`}`.slice(0, 308),
    '**Steps:**',
    `1. Open ${WHERE[spec.project]}.`,
    `2. Paste the prompt from issue #${spec.issue} (copy button on the code block).`,
    `**Worked if:** issue #${spec.issue} is closed by a merged PR.`,
    '',
  ].join('\n');
}

// Deterministic escalation for the workflow's own failure/guard steps, where no
// LLM wrote a spec: the run URL is the evidence, the goal is to finish the fix.
export function autoSpec(issue, reason, runUrl = '', title = '') {
  return {
    issue: Number(issue), project: 'swift2', title, reason,
    found: reason,
    tried: `The ops-fixer routine ran${runUrl ? ` (${runUrl})` : ''} and did not land a fix.`,
    goal: `Diagnose the root cause from issue #${issue} and the run log${runUrl ? ` at ${runUrl}` : ''}, fix it surgically, and land the fix.`,
    acceptance: `The failure described in issue #${issue} no longer reproduces and CI is green.`,
  };
}

export function main(argv = process.argv.slice(2)) {
  const [cmd, file] = argv;
  if (cmd === 'auto') {
    process.stdout.write(`${renderComment(autoSpec(argv[1], argv[2], argv[3], argv[4]))}\n`);
    return 0;
  }
  const spec = JSON.parse(readFileSync(file, 'utf8'));
  if (cmd === 'comment') process.stdout.write(`${renderComment(spec)}\n`);
  else if (cmd === 'ha') process.stdout.write(renderHa(spec));
  else throw new Error('usage: ops-fix-escalate.mjs comment|ha <spec.json>');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runMain(() => main(), { name: 'ops-fix-escalate' });
