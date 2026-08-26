import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check as checkWithSocial, checkCampaignPairs, hasSinglePlatformException } from './social-post-missing.mjs';

const check = (items: object[]) => checkWithSocial(items, { socialRecords: [] });

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

const social = (file: string, platform: string, campaign: string, why = 'why this, why now') => ({
  file,
  item: { platform, campaign, why },
});

describe('social campaign pairing check', () => {
  it('accepts a campaign represented by X and Instagram across queue and posted', () => {
    const findings = checkCampaignPairs([
      social('social/posted/story-x.json', 'x', 'story:paired'),
      social('social/queue/story-ig.json', 'instagram', 'story:paired'),
    ]);

    expect(findings).toEqual([]);
  });

  it('reports one P2 finding for a campaign with only one platform', () => {
    const findings = checkCampaignPairs([
      social('social/posted/story-x.json', 'x', 'story:single'),
      social('social/posted/story-x-retry.json', 'x', 'story:single'),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      checker: 'content.social-post-missing',
      severity: 'P2',
      itemRef: { key: 'story:single', field: 'platform' },
    });
    expect(findings[0].title).toContain('instagram');
  });

  it('accepts only the explicit human-readable exception marker', () => {
    expect(hasSinglePlatformException('Single-platform exception: no verified visual exists for Instagram.')).toBe(true);
    expect(hasSinglePlatformException('This format works best on X.')).toBe(false);
    expect(hasSinglePlatformException('Single-platform exception: n/a')).toBe(false);

    expect(
      checkCampaignPairs([
        social(
          'social/posted/story-x.json',
          'x',
          'story:excepted',
          'Why now. Single-platform exception: the interactive X poll has no Instagram equivalent.',
        ),
      ]),
    ).toEqual([]);
  });

});
