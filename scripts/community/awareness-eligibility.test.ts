import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  eligibilityRank,
  fetchSubAbout,
  imageCommentsLabel,
  parseAbout,
  resolveImageComments,
} from './awareness-eligibility.mjs';

const about = (data: Record<string, unknown>) => ({ kind: 't5', data });

describe('about.json image-comment eligibility', () => {
  it('reads comment_contribution_settings.allowed_media_types: static means images are allowed', () => {
    expect(
      parseAbout(
        about({
          comment_contribution_settings: {
            allowed_media_types: ['giphy', 'static', 'animated', 'expression'],
          },
        }),
      ).imageComments,
    ).toBe('image');
  });

  it('marks a sub text-only when the media list exists but has no static images', () => {
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: ['giphy'] } }))
        .imageComments,
    ).toBe('text_only');
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: [] } }))
        .imageComments,
    ).toBe('text_only');
  });

  it('never guesses text-only from a missing or null field, and ignores allow_images (image POSTS)', () => {
    expect(parseAbout(about({})).imageComments).toBe('unknown');
    expect(
      parseAbout(about({ comment_contribution_settings: { allowed_media_types: null } }))
        .imageComments,
    ).toBe('unknown');
    expect(parseAbout(about({ allow_images: false })).imageComments).toBe('unknown');
    expect(parseAbout(null).imageComments).toBe('unknown');
  });

  it('flags NSFW subs', () => {
    expect(parseAbout(about({ over18: true })).over18).toBe(true);
    expect(parseAbout(about({ over18: false })).over18).toBe(false);
  });

  it('lets a pinned config value override the live reading', () => {
    expect(resolveImageComments({ imageComments: 'text_only' }, { imageComments: 'image' })).toBe(
      'text_only',
    );
    expect(resolveImageComments({ imageComments: null }, { imageComments: 'image' })).toBe('image');
    expect(resolveImageComments({}, undefined)).toBe('unknown');
  });

  it('degrades a blocked or failing request to unknown instead of throwing', async () => {
    const blocked = vi.fn(async () => new Response('blocked', { status: 403 }));
    expect(await fetchSubAbout('TaylorSwift', { fetchImpl: blocked })).toEqual({
      imageComments: 'unknown',
      over18: false,
      error: 'HTTP 403',
    });
    const broken = vi.fn(async () => {
      throw new Error('network down');
    });
    expect((await fetchSubAbout('TaylorSwift', { fetchImpl: broken })).imageComments).toBe(
      'unknown',
    );
  });

  it('requests the public about.json with a User-Agent', async () => {
    const ok = vi.fn(
      async () =>
        new Response(
          JSON.stringify(
            about({ comment_contribution_settings: { allowed_media_types: ['static'] } }),
          ),
          { status: 200 },
        ),
    );
    expect((await fetchSubAbout('swifties', { fetchImpl: ok })).imageComments).toBe('image');
    const [url, init] = ok.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/r/swifties/about.json');
    expect(init.headers['User-Agent']).toMatch(/Swift2Awareness/);
  });

  it('labels and orders states: image first, text-only last', () => {
    expect(imageCommentsLabel('text_only')).toContain('text-only sub');
    expect(imageCommentsLabel('unknown')).toContain('unverified');
    expect(
      ['text_only', 'unknown', 'image'].sort((a, b) => eligibilityRank(a) - eligibilityRank(b)),
    ).toEqual(['image', 'unknown', 'text_only']);
  });
});
