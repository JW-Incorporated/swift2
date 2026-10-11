import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { checkRoutineWorkflows, extractAllowedTools } from '../check-routine-workflows.mjs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const prWorkflow = read('.github/workflows/strategy-pr.yml');
const update = read('.github/workflows/routine-fable-strategy-update.yml');
const review = read('.github/workflows/routine-marjorie-weekly-review.yml');
const updatePrompt = read('docs/agents/runner-prompts/fable-strategy-update.md');
const reviewPrompt = read('docs/agents/runner-prompts/marjorie-weekly-review.md');
const chatPrompt = read('docs/agents/runner-prompts/marjorie-chat.md');
const charter = read('docs/agents/marjorie.md');

describe('strategy-pr.yml (the only writer of docs/strategy/growth-strategy.md besides chat steers)', () => {
  it('runs the validator on main with the PAT, and never as an agent', () => {
    expect(prWorkflow).toContain('workflow_call:');
    expect(prWorkflow).toContain('ref: main');
    expect(prWorkflow).toContain('token: ${{ secrets.SOCIAL_POSTER_PAT }}');
    expect(prWorkflow).toContain('scripts/marjorie/strategy-doc.mjs open-pr --file .scratch/out/growth-strategy.md');
    expect(prWorkflow).not.toContain('claude-code-action');
    expect(prWorkflow).not.toMatch(/run:.*\$\{\{ *inputs/);
  });
});

describe('weekly review rewrites the strategy', () => {
  it('hands the agent’s file to strategy-pr.yml and keeps the PAT out of the agent job', () => {
    expect(review).toMatch(/\n {2}strategy:\n {4}needs: run\n/);
    expect(review).toContain('uses: ./.github/workflows/strategy-pr.yml');
    expect(review).toContain('artifact: marjorie-weekly-review-out');
    expect(review).toContain('kind: weekly');
    const run = review.slice(review.indexOf('\n  run:\n'), review.indexOf('\n  file-tree-feedback:'));
    expect(run).not.toMatch(/SOCIAL_POSTER_PAT/);
  });
  it('the prompt orders the rewrite, binds her to Owner direction and groups Next up under the three labels', () => {
    expect(reviewPrompt).toContain('## Step 1c');
    expect(reviewPrompt).toContain('docs/strategy/growth-strategy.md');
    expect(reviewPrompt).toContain('.scratch/out/growth-strategy.md');
    expect(reviewPrompt).toContain('strategy-doc.mjs check');
    expect(reviewPrompt).toMatch(/Honour every `## Owner direction \(standing\)` line/);
    for (const g of ['### To grow', '### To make content better', '### Other']) expect(reviewPrompt).toContain(g);
    expect(reviewPrompt).toMatch(/only these three `###` sub-headings/);
  });
});

describe('routine-fable-strategy-update.yml', () => {
  it('is dispatch-only, waits for the direction PR, and gives the agent no write token', () => {
    expect(update).toMatch(/^on:\n {2}workflow_dispatch:/m);
    expect(update).not.toMatch(/schedule:/);
    expect(update).toContain('strategy-doc.mjs wait-merged');
    expect(update).toContain('uses: ./.github/workflows/strategy-pr.yml');
    expect(update).toContain('kind: update');
    expect(update).toContain('model: claude-fable-5');
    const run = update.slice(update.indexOf('\n  run:\n'), update.indexOf('\n  strategy:\n'));
    expect(run).not.toMatch(/SOCIAL_POSTER_PAT/);
    const tools = extractAllowedTools(update);
    for (const forbidden of ['Write', 'Edit', 'Task']) expect(tools).not.toContain(forbidden);
  });
  it('passes the routine-workflow invariants and its prompt exists', () => {
    expect(checkRoutineWorkflows({ '.github/workflows/routine-fable-strategy-update.yml': update }).problems).toEqual([]);
    expect(updatePrompt).toContain('.scratch/strategy-update.json');
    expect(updatePrompt).toContain('.scratch/out/growth-strategy.md');
    expect(updatePrompt).toContain('docs/social/guardrails.md');
  });
});

// routine-marjorie-chat.yml was deleted 2026-10-09 (Marjorie chats as a Hermes agent); only the reference prompt remains pinned.
describe('chat steering', () => {
  it('the prompt answers from the strategy, records steers verbatim by PR, asks Fable for a rewrite, and defers to the guardrails', () => {
    expect(chatPrompt).toContain('**h) The growth strategy');
    expect(chatPrompt).toContain('docs/strategy/growth-strategy.md');
    expect(chatPrompt).toContain('strategy-doc.mjs add-direction --from-context .scratch/chat-context.json');
    expect(chatPrompt).toContain('strategy-doc.mjs save-update --pr');
    expect(chatPrompt).toContain('gh pr merge <pr number> --repo "$GITHUB_REPOSITORY" --squash --auto');
    expect(chatPrompt).toMatch(/Guardrails outrank him/);
    expect(chatPrompt).toMatch(/ONLY way an owner line is written/);
    expect(chatPrompt).not.toContain('--text-file');
    expect(chatPrompt).not.toMatch(/add-direction --text/);
    expect(chatPrompt).toContain('You have 35 turns');
  });
});

describe('charter', () => {
  it('documents strategy ownership and steering', () => {
    expect(charter).toMatch(/## Amendment \(2026-10-01, owner\): visible strategy and owner steering/);
    expect(charter).toContain('docs/strategy/growth-strategy.md');
  });
});
