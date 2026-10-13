// Card 2: asserts the rewritten extraction prompt actually encodes the new
// copy standard (summary 2-3 sentences, detail a 60-150 word grounded
// paragraph) and keeps the pre-existing honesty/status/redline rules intact.
// prompt.ts is pure data (system prompt string + tool schema) — these tests
// pin down its content so a future edit can't silently regress the standard
// this card exists to raise.

import { describe, expect, it } from 'vitest';
import { EXTRACT_SYSTEM_PROMPT, RECORD_KNOWLEDGE_TOOL } from './prompt';

describe('EXTRACT_SYSTEM_PROMPT — Card 2 copy standard', () => {
  it('requires a 2-3 sentence summary, not a single clipped line', () => {
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/summary.*2-3 full sentences/i);
  });

  it('requires a real 60-150 word detail paragraph', () => {
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/detail.*60-150 words/i);
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/real paragraph/i);
  });

  it('still forbids inventing facts beyond the given material', () => {
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/[Nn]ever invent a fact/);
  });

  it('extends the no-invention rule to the newly added article text', () => {
    expect(EXTRACT_SYSTEM_PROMPT.toLowerCase()).toContain('article text');
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/article text.*untrusted source material/i);
  });

  it('keeps the existing honesty/status-hint discipline', () => {
    expect(EXTRACT_SYSTEM_PROMPT).toContain('status_hint');
    expect(EXTRACT_SYSTEM_PROMPT).toMatch(/rumor.*reported.*far more often than.*confirmed/i);
  });

  it('keeps the privacy redline rules and location ladder intact', () => {
    expect(EXTRACT_SYSTEM_PROMPT).toContain('PRIVACY REDLINES');
    expect(EXTRACT_SYSTEM_PROMPT).toContain('LOCATION LADDER');
  });
});

describe('RECORD_KNOWLEDGE_TOOL — Card 2 schema descriptions', () => {
  it('describes summary as 2-3 sentences, not a <=400 char single line', () => {
    const summaryDesc = RECORD_KNOWLEDGE_TOOL.input_schema.properties.current_item.properties.summary.description;
    expect(summaryDesc).toMatch(/2-3 full sentences/);
    // Must stay within the DB check (char_length(summary) <= 400) and the
    // sanitizer's 400-char clamp, or the model's tail gets silently cut.
    expect(summaryDesc).toMatch(/160-400 characters/);
  });

  it('describes detail as a real paragraph grounded in given material', () => {
    const detailDesc = RECORD_KNOWLEDGE_TOOL.input_schema.properties.current_item.properties.detail.description;
    expect(detailDesc).toMatch(/real paragraph/);
    expect(detailDesc).toMatch(/60-150 words/);
    expect(detailDesc).toMatch(/grounded only in the given/);
  });
});
