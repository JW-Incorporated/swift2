#!/usr/bin/env node
// Founder escalation, rendered in code (docs/decisions.md 2026-10-05, Joey's
// chat requirement): a bot that must hand something to the founder never sends
// only a description. It names WHERE to work and carries a complete,
// self-contained prompt a fresh Claude Code session can run without asking
// questions. Deterministic and validated — empty fields are refused, not filled.
//
//   node scripts/marjorie/escalate.mjs --where swift2|hermes --issue <N> --context "<text>" --goal "<text>" --acceptance "<text>" [--out <file>]
//
// Prints the issue-body block (fenced prompt) and the two HUMAN-ACTIONS.md Steps
// lines. A pure founder action (login, payment, secret value) has no prompt: use
// `--where founder --steps "<literal click 1>|<literal click 2>"`.
import { writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';
import { parseArgs } from './loop-asks.mjs';

const STEP_MAX = 200;
export const PROJECTS = {
  swift2: { session: 'Claude Code in Documents\\Claude\\Projects\\Swift2', repoRule: 'Work on a branch, open a PR and land it per CLAUDE.md.' },
  hermes: { session: 'Claude Code in Documents\\Claude\\Projects\\Hermes', repoRule: "Follow that project's own CLAUDE.md for branches, PRs and landing, and land the fix." },
};
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const safe = (v) => clean(v).replace(/`{3,}/g, "'''");

/** The self-contained prompt a fresh session can run. Throws when any part is empty. */
export function renderPrompt({ where, issueNumber, context, goal, acceptance }) {
  const project = PROJECTS[where];
  if (!project) throw new Error(`--where must be swift2, hermes or founder (got ${where})`);
  const issue = Number(issueNumber);
  if (!Number.isInteger(issue) || issue <= 0) throw new Error('an escalation needs the issue number the prompt lives in');
  const fields = { context: safe(context), goal: safe(goal), acceptance: safe(acceptance) };
  for (const [name, value] of Object.entries(fields)) if (!value) throw new Error(`an escalation needs a non-empty ${name}: never escalate with only a description`);
  return [
    `Work in ${project.session}. Fix GitHub issue #${issue} (JW-Incorporated/swift2); read it first for the full thread.`,
    `Context: ${fields.context}`,
    `Goal: ${fields.goal}`,
    `Acceptance check: ${fields.acceptance}`,
    `${project.repoRule} Do not ask me questions: make every reversible call yourself and state it in one line. Report what changed and the acceptance result.`,
  ].join('\n');
}

/** WHERE + the fenced prompt, for the GitHub issue body. */
export function renderIssueBlock(args) {
  const prompt = renderPrompt(args);
  return `**Founder escalation — where:** ${PROJECTS[args.where].session}\n\nPaste this into that session (copy button on the block):\n\n\`\`\`\n${prompt}\n\`\`\``;
}

/** The HUMAN-ACTIONS.md Steps lines (format v2: literal, <=200 chars each). */
export function renderHaSteps({ where, issueNumber, steps }) {
  if (where === 'founder') {
    const own = (Array.isArray(steps) ? steps : String(steps ?? '').split('|')).map(clean).filter(Boolean);
    if (own.length === 0) throw new Error('a founder-only action needs literal steps (login, payment, secret value)');
    own.forEach((s) => { if (s.length > STEP_MAX) throw new Error(`a step is over ${STEP_MAX} chars: ${s.slice(0, 40)}…`); });
    return own.map((s, i) => `${i + 1}. ${s}`);
  }
  renderPrompt({ where, issueNumber, context: 'x', goal: 'x', acceptance: 'x' });
  return [`1. Open ${PROJECTS[where].session}.`, `2. Paste the prompt from issue #${Number(issueNumber)} (copy button on the code block).`];
}

async function main() {
  const { flags } = parseArgs(['escalate', ...process.argv.slice(2)]);
  const where = flags.where;
  const args = { where, issueNumber: flags.issue, context: flags.context, goal: flags.goal, acceptance: flags.acceptance, steps: flags.steps };
  const text = where === 'founder'
    ? renderHaSteps(args).join('\n')
    : `${renderIssueBlock(args)}\n\n--- HUMAN-ACTIONS.md Steps ---\n${renderHaSteps(args).join('\n')}`;
  if (typeof flags.out === 'string') writeFileSync(flags.out, `${text}\n`);
  else console.log(text);
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/escalate.mjs')) {
  runMain(main, { name: 'escalate' });
}
