import { describe, expect, it, vi } from 'vitest';
import { DELETE_X_SITE_SCREEN_POST_IDS, deleteXSiteScreenPosts } from './delete-x-site-screens.mjs';

const credentials = {
  apiKey: 'key',
  apiKeySecret: 'key-secret',
  accessToken: 'access-token',
  accessTokenSecret: 'access-token-secret',
};

describe('deleteXSiteScreenPosts', () => {
  it('deletes only the two owner-approved post IDs', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { deleted: true } }),
      text: async () => JSON.stringify({ data: { deleted: true } }),
    });

    await expect(deleteXSiteScreenPosts({ credentials, fetchImpl })).resolves.toEqual(DELETE_X_SITE_SCREEN_POST_IDS);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['https://api.twitter.com/2/tweets/2092348505243160881', 'DELETE'],
      ['https://api.twitter.com/2/tweets/2092276284667691117', 'DELETE'],
    ]);
  });

  it('fails closed when the approved ID allowlist changes', async () => {
    await expect(
      deleteXSiteScreenPosts({ credentials, fetchImpl: vi.fn(), postIds: ['2092348505243160881'] }),
    ).rejects.toThrow('fixed owner-approved allowlist');
  });

  it('continues with the remaining approved ID when a prior target is already absent', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => JSON.stringify({ title: 'Not Found' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({ data: { deleted: true } }) });

    await expect(deleteXSiteScreenPosts({ credentials, fetchImpl })).resolves.toEqual(DELETE_X_SITE_SCREEN_POST_IDS);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});