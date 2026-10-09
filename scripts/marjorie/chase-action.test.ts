import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs
import { main } from './chase-action.mjs';

const MID = '900000000000000001';
const OPEN = `## #76 🟡 [DECIDE] stale\n<!-- ha filed=2026-09-14 -->\n<!-- marjorie-chase: 96h issue=4324 -->`;
const issue = { number: 4324, state: 'open', labels: [{ name: 'marjorie-filed' }] };

function fixture(text = 'defer') {
  const root = mkdtempSync(join(tmpdir(), 'chase-action-'));
  const context = join(root, 'context.json');
  writeFileSync(context, JSON.stringify({ bot: 'marjorie', already: null, message_id: MID, url: `https://discord.com/channels/900000000000000002/900000000000000003/${MID}`, text, replying_to: { text: 'HA #76' } }));
  writeFileSync(join(root, 'HUMAN-ACTIONS.md'), OPEN);
  writeFileSync(join(root, 'HUMAN-ACTIONS-DONE.md'), '');
  return { root, context };
}

describe('CLI', () => {
  it('writes metadata first, then applies defer, leaving HA files for the PR step', () => {
    const f = fixture();
    const execImpl = vi.fn()
      .mockReturnValueOnce(JSON.stringify([[issue]]))
      .mockReturnValueOnce(JSON.stringify([[]]))
      .mockReturnValueOnce('').mockReturnValueOnce('');
    expect(main(['--context', f.context, '--repo', 'o/r'], { execImpl, root: f.root })).toBe(0);
    expect(execImpl.mock.calls[2][1].slice(0, 2)).toEqual(['issue', 'comment']);
    expect(execImpl.mock.calls[3][1]).toContain('deferred');
    expect(execImpl.mock.calls.every((call) => !call[1].includes('HUMAN-ACTIONS.md'))).toBe(true);
  });

  it('retries the label after a prior comment without posting twice', () => {
    const f = fixture();
    const marker = `<!-- marjorie-chase-action: HA=76 issue=4324 action=defer message=${MID} -->`;
    const prior = { body: `metadata\n${marker}`, user: { login: 'claude[bot]', type: 'Bot' } };
    const execImpl = vi.fn()
      .mockReturnValueOnce(JSON.stringify([[issue]]))
      .mockReturnValueOnce(JSON.stringify([[prior]]))
      .mockReturnValueOnce('');
    expect(main(['--context', f.context, '--repo', 'o/r'], { execImpl, root: f.root })).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(3);
    expect(execImpl.mock.calls[2][1].slice(0, 2)).toEqual(['issue', 'edit']);
  });
});
