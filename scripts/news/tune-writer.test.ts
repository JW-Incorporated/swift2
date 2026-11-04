import { describe, expect, it } from 'vitest';
import { replayWriter } from './tune-writer.mjs';

const row = {
  facts: [{ id: 'f1' }],
  contextText: '[c1] Era seed.',
};
const draft = (lead: string, ref: string) => ({ lead, paragraphs: [{ sentences: [{ text: 'One sentence.', refs: [ref] }] }] });

describe('replayWriter', () => {
  it('replays a supplied draft through the production validation', async () => {
    const result = await replayWriter(draft('Too short', 'f1'), row)();
    expect(result.status).toBe('invalid');
    expect(result.reasons.some((r: string) => r.includes('lead is 9 characters'))).toBe(true);
  });

  it('rejects a ref that is not a provided fact or context id', async () => {
    const result = await replayWriter(draft('x'.repeat(250), 'f9'), row)();
    expect(result.reasons).toContain('ref f9 is not a provided fact or context id');
  });
});
