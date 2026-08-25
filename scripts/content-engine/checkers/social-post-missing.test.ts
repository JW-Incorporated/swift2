import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './social-post-missing.mjs';

const moment = (context: string, socialPost?: object) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'showgirl-swift-music-pulled-from-trump-tiktoks',
  title: 'Her music keeps going quiet on Trump’s TikToks — and now the White House’s',
  texts: { snippet: '', context },
  raw: { moment: { ...(socialPost ? { socialPost } : {}) } },
});

describe('social-post-missing check', () => {
  it('does not treat an incidental on-Instagram reference as a missing post', async () => {
    const item = moment(
      'The backstory runs to September 2024, when Taylor endorsed Kamala Harris for president on Instagram.',
    );

    expect(await check([item])).toEqual([]);
  });

  it('flags a page that promises a specific Instagram post without embedding it', async () => {
    const findings = await check([
      moment('Taylor endorsed Kamala Harris for president in an Instagram post signed “Childless Cat Lady.”'),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].checker).toBe('content.social-post-missing');
    expect(findings[0].severity).toBe('P1');
  });

  it('does not flag a page that embeds the referenced post', async () => {
    const item = moment('The Instagram post was the primary artifact.', {
      platform: 'instagram',
      shortcode: 'example',
    });

    expect(await check([item])).toEqual([]);
  });
});
