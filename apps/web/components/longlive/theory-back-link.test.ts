import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// PLAN.md P3 step 17 (R4): every egg/theory detail must carry a back-link to
// the thread it belongs to when one genuinely fits, and — UNCONDITIONALLY,
// even when no specific thread fits — a line teaching the reader that a
// whole section is dedicated to theories and eggs. No component-render
// harness in this suite (vitest runs `environment: 'node'`), so this is a
// static source lock, same idiom as close-affordance.test.ts and
// scrubber-nested-interactive.test.ts.

const src = readFileSync(new URL('./TheoryCard.tsx', import.meta.url), 'utf8');

describe('R4: TheoryCard cannot render without a back-link', () => {
  it('computes a threadId for every card via the shared doorways.ts mapping', () => {
    expect(src).toContain('theoryThreadId(theory)');
  });

  it('renders a specific thread back-link when threadId resolves', () => {
    expect(src).toContain('onClick={() => openThread(threadId)}');
    expect(src).toMatch(/Part of the .*thread/);
  });

  it('renders the unconditional "whole section" line when threadId is null — never a bare gap', () => {
    expect(src).toContain("onClick={() => setMode('threads')}");
    expect(src).toContain('whole section for theories');
  });

  it('the back-link block is unconditional: it sits outside any threadId-gated JSX branch', () => {
    // The ternary that picks WHICH link to show is the only conditional here —
    // there is no `threadId &&` guard around the whole block that could make
    // it disappear entirely for a null threadId.
    expect(src).toMatch(/\{threadId \? \(/);
    expect(src).not.toMatch(/\{threadId && \(/);
  });
});
