import { describe, expect, it, vi } from 'vitest';
import { collectGroup, readDpapiPassword } from './fb-export-collect.mjs';

describe('Facebook collector boundaries', () => {
  it('uses an injectable page and treats Join group as a successful skip', async () => {
    const page = {
      goto: vi.fn(),
      url: () => 'https://www.facebook.com/groups/123',
      evaluate: vi
        .fn()
        .mockResolvedValue({ text: 'Private group', hasPassword: false, hasJoinGroup: true }),
    };
    const result = await collectGroup(page as never, { slug: 'group-a', groupId: '123' } as never, {
      outputDir: 'unused',
    });
    expect(page.goto).toHaveBeenCalledWith(
      'https://www.facebook.com/groups/123?sorting_setting=CHRONOLOGICAL',
      expect.anything(),
    );
    expect(result).toEqual({ slug: 'group-a', status: 'not-member' });
  });

  it('reads DPAPI through PowerShell stdout without putting the password in arguments', async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: 'not-a-real-password' });
    const value = await readDpapiPassword({ exec, root: 'C:\\safe' });
    expect(value).toBe('not-a-real-password');
    expect(JSON.stringify(exec.mock.calls)).not.toContain('not-a-real-password');
    expect(exec.mock.calls[0][1]).toContain('-NonInteractive');
  });

  it('turns credential errors into a fixed message that cannot leak stderr', async () => {
    const exec = vi.fn().mockRejectedValue(new Error('stderr contains secret-value'));
    await expect(readDpapiPassword({ exec, root: 'C:\\safe' })).rejects.toThrow(
      'credential could not be read',
    );
    await expect(readDpapiPassword({ exec, root: 'C:\\safe' })).rejects.not.toThrow('secret-value');
  });
});
