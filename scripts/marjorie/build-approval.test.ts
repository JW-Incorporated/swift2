import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { approveResolved, main } from './build-approval.mjs';

const MID = '900000000000000001';
const URL = `https://discord.com/channels/900000000000000002/900000000000000003/${MID}`;
const issue = { number: 44, state: 'OPEN', labels: [{ name: 'marjorie-filed' }, { name: 'desk:build' }] };

const pages = (comments: unknown[] = []) => JSON.stringify([comments]);

describe('approveResolved', () => {
  it('posts the canonical link-only comment', () => {
    const execImpl = vi.fn().mockReturnValueOnce(pages()).mockReturnValueOnce('');
    expect(approveResolved({ execImpl, repo: 'o/r', issue, messageId: MID, messageUrl: URL })).toMatchObject({ ok: true, duplicate: false });
    const body = execImpl.mock.calls[1][1][6];
    expect(body).toContain(URL);
    expect(body).toContain(`<!-- marjorie-approval: ${MID} -->`);
    expect(body).not.toContain('founder words');
  });

  it('dedupes only the same Discord message', () => {
    const body = `Founder approved this in Discord: ${URL}\nPlan approved — ready for the build lane.\n<!-- marjorie-approval: ${MID} -->`;
    const execImpl = vi.fn().mockReturnValueOnce(pages([{ body, user: { login: 'github-actions[bot]', type: 'Bot' } }]));
    expect(approveResolved({ execImpl, repo: 'o/r', issue, messageId: MID, messageUrl: URL })).toMatchObject({ ok: true, duplicate: true });
    expect(execImpl).toHaveBeenCalledTimes(1);
  });
});

describe('CLI', () => {
  it('resolves one referenced open ticket from trusted chat context', () => {
    const dir = mkdtempSync(join(tmpdir(), 'approval-'));
    const context = join(dir, 'context.json');
    writeFileSync(context, JSON.stringify({ bot: 'marjorie', already: null, message_id: MID, url: URL, text: 'yes #44' }));
    const execImpl = vi.fn()
      .mockReturnValueOnce(JSON.stringify([[issue]]))
      .mockReturnValueOnce(pages())
      .mockReturnValueOnce('');
    expect(main(['approve', '--context', context, '--repo', 'o/r'], { execImpl })).toBe(0);
    expect(execImpl).toHaveBeenCalledTimes(3);
  });
});
