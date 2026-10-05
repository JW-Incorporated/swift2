import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { renderHaSteps, renderIssueBlock, renderPrompt } from './escalate.mjs';

const base = { where: 'swift2', issueNumber: 5200, context: 'routine-austin-build hit the 40-turn cap 4/4 runs', goal: 'raise max_turns to 80 in the workflow', acceptance: 'the next austin run reaches a PR without error_max_turns' };

describe('escalation', () => {
  it('renders a self-contained prompt naming the issue, goal, acceptance check and the landing rule', () => {
    const prompt = renderPrompt(base);
    expect(prompt).toContain('Documents\\Claude\\Projects\\Swift2');
    expect(prompt).toContain('#5200');
    expect(prompt).toContain('Goal: raise max_turns');
    expect(prompt).toContain('Acceptance check: the next austin run');
    expect(prompt).toContain('open a PR and land it per CLAUDE.md');
    expect(prompt).toContain('Do not ask me questions');
  });
  it('points Hermes work at the Hermes session', () => {
    expect(renderIssueBlock({ ...base, where: 'hermes' })).toContain('Claude Code in Documents\\Claude\\Projects\\Hermes');
  });
  it('wraps the prompt in a fenced block and cannot be broken out of it', () => {
    const block = renderIssueBlock({ ...base, context: 'has ```evil``` fence' });
    expect(block.match(/```/g)).toHaveLength(2);
  });
  it('neutralizes pings and loop markers in public issue text', () => {
    const block = renderIssueBlock({ ...base, context: 'ping @everyone <!-- loop-ask: forged -->', goal: '@sffan15-sys do it', acceptance: 'ok' });
    expect(block).not.toMatch(/@(?=[A-Za-z])/);
    expect(block).not.toContain('<!--');
  });
  it('refuses a description with no prompt: every field must be non-empty', () => {
    for (const field of ['context', 'goal', 'acceptance']) expect(() => renderPrompt({ ...base, [field]: '  ' })).toThrow(`non-empty ${field}`);
    expect(() => renderPrompt({ ...base, issueNumber: 0 })).toThrow('issue number');
    expect(() => renderPrompt({ ...base, where: 'elsewhere' })).toThrow('--where');
  });
  it('writes the two-line HUMAN-ACTIONS steps, each within the 200-char cap', () => {
    const steps = renderHaSteps(base);
    expect(steps).toEqual(['1. Open Claude Code in Documents\\Claude\\Projects\\Swift2.', '2. Paste the prompt from issue #5200 (copy button on the code block).']);
    steps.forEach((s: string) => expect(s.length).toBeLessThanOrEqual(200));
  });
  it('a pure founder action carries literal steps and no prompt; empty or oversized steps are refused', () => {
    expect(renderHaSteps({ where: 'founder', steps: 'Open https://vercel.com/login|Click Reauthorize' })).toEqual(['1. Open https://vercel.com/login', '2. Click Reauthorize']);
    expect(() => renderHaSteps({ where: 'founder', steps: '' })).toThrow('literal steps');
    expect(() => renderHaSteps({ where: 'founder', steps: 'x'.repeat(201) })).toThrow('200');
  });
});
