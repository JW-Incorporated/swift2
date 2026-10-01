import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildContext, main } from './status-relay.mjs';

const comment = (over: Record<string, unknown> = {}) => ({
  id: 9, body: 'What is blocking growth?', html_url: 'https://github.com/o/r/issues/50#issuecomment-9', created_at: '2026-09-30T20:00:00Z',
  issue_url: 'https://api.github.com/repos/o/r/issues/50', author_association: 'OWNER', user: { login: 'sffan15-sys', type: 'User' }, ...over,
});
const apiFor = (c: unknown, issue: unknown = { number: 50, labels: [{ name: 'status-page' }] }) => vi.fn(async (p: string) => (p.includes('/issues/comments/') ? c : issue));

describe('status relay context', () => {
  it('builds the agent context for the owner\'s own comment on a status-page issue', async () => {
    const out = await buildContext('9', { api: apiFor(comment()), repo: 'o/r' });
    expect(out).toMatchObject({ ok: true, context: { source: 'github-status-page', comment_id: 9, issue_number: 50, text: 'What is blocking growth?' } });
  });
  it('refuses anyone else, any bot, any other issue, and a malformed id', async () => {
    const refuse = async (c: unknown, issue?: unknown, id = '9') => (await buildContext(id, { api: apiFor(c, issue), repo: 'o/r' })).ok;
    expect(await refuse(comment({ user: { login: 'stranger', type: 'User' }, author_association: 'NONE' }))).toBe(false);
    expect(await refuse(comment({ user: { login: 'github-actions[bot]', type: 'Bot' }, author_association: 'MEMBER' }))).toBe(false);
    expect(await refuse(comment(), { number: 50, labels: [{ name: 'bug' }] })).toBe(false);
    expect(await refuse(comment(), { number: 50, labels: [{ name: 'status-page' }], pull_request: {} })).toBe(false);
    expect(await refuse(comment(), undefined, '9; rm -rf')).toBe(false);
  });
  it('writes the file and skip=false for the owner, and skip=true with no file otherwise', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'relay-'));
    try {
      const out = path.join(dir, 'x', 'status-comment.json');
      const gho = path.join(dir, 'gho');
      writeFileSync(gho, '');
      await main(['context', '--comment-id', '9', '--out', out], { api: apiFor(comment()), env: { GITHUB_REPOSITORY: 'o/r', GITHUB_OUTPUT: gho }, log: vi.fn() });
      expect(JSON.parse(readFileSync(out, 'utf8')).text).toBe('What is blocking growth?');
      expect(readFileSync(gho, 'utf8')).toBe('skip=false\n');
      const gho2 = path.join(dir, 'gho2');
      writeFileSync(gho2, '');
      const out2 = path.join(dir, 'none.json');
      await main(['context', '--comment-id', '9', '--out', out2], { api: apiFor(comment({ author_association: 'NONE' })), env: { GITHUB_REPOSITORY: 'o/r', GITHUB_OUTPUT: gho2 }, log: vi.fn() });
      expect(readFileSync(gho2, 'utf8')).toBe('skip=true\n');
      expect(() => readFileSync(out2)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
