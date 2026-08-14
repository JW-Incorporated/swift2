import { describe, expect, it } from 'vitest';
import {
  detailVideoFor,
  feedCardImageHidden,
  feedVideoFor,
  footnoteVideoSources,
  heroVideoFor,
  imageDuplicatesPageVideo,
  youtubeFrameId,
} from './video-affordance';
import { ERAS } from './eras';
import { contentForEra } from './content';
import { eraKnownVideoIds, inlineVideoMomentIds } from './era-feed';
import { videosForEra } from './videos';
import { primaryImageRef } from './types';
import type { ContentItem, EggSource } from './types';

const source = (name: string, url: string): EggSource => ({ name, url }) as EggSource;

const moment = (over: Partial<ContentItem> = {}): ContentItem =>
  ({
    id: 'm1',
    eraId: 'lover',
    date: '2019-08-23',
    dateLabel: 'August 23, 2019',
    title: 'A Moment',
    summary: '',
    body: [],
    tags: ['Music'],
    images: [],
    ...over,
  }) as unknown as ContentItem;

const YT = 'https://www.youtube.com/watch?v=abcdefghijk';
const YT_ID = 'abcdefghijk';

describe('feedVideoFor', () => {
  it('is the moment’s own video, so the badge and the Videos filter agree', () => {
    const v = { youtubeId: 'abc', title: 'T' };
    expect(feedVideoFor(moment({ video: v }))).toEqual(v);
  });

  it('is null for a moment with no footage — no badge on that card', () => {
    expect(feedVideoFor(moment())).toBeNull();
  });

  it('does NOT promote a YouTube source into the feed (that would widen the filter)', () => {
    expect(feedVideoFor(moment({ sources: [source('Clip', YT)] }))).toBeNull();
  });
});

describe('detailVideoFor', () => {
  it('is the moment’s own video, with MomentVideo’s default caption', () => {
    const v = { youtubeId: 'abc', title: 'T' };
    expect(detailVideoFor(moment({ video: v }))).toEqual({ video: v });
  });

  // #2051 decision point 3 proposed promoting a lone YouTube CITATION into this
  // slot. Deliberately not implemented — six of the 29 citations it would fire
  // on are fan re-uploads, and presenting one as a page's lead media is a
  // rights/product call for Joey, not a refactor. See detailVideoFor's comment.
  it('does NOT promote a lone YouTube citation into the lead slot', () => {
    const item = moment({ sources: [source('YouTube — someone (fan archive)', YT)] });
    expect(detailVideoFor(item)).toBeNull();
  });

  it('does not promote even a single citation from an official-looking channel', () => {
    const item = moment({ sources: [source('YouTube — GRAMMYS', YT)] });
    expect(detailVideoFor(item)).toBeNull();
  });

  it('prefers the moment’s own video over any citation', () => {
    const own = { youtubeId: 'own-id', title: 'Own' };
    const item = moment({ video: own, sources: [source('Clip', YT)] });
    expect(detailVideoFor(item)).toEqual({ video: own });
  });

  it('is null when there is no footage at all', () => {
    expect(
      detailVideoFor(moment({ sources: [source('Billboard', 'https://b.com/x')] })),
    ).toBeNull();
  });
});

describe('footnoteVideoSources', () => {
  it('keeps a lone YouTube citation in the footnote (nothing is promoted out)', () => {
    expect(
      footnoteVideoSources(moment({ sources: [source('Clip', YT)] })).map((s) => s.youtubeId),
    ).toEqual([YT_ID]);
  });

  it('drops a citation duplicating the moment’s own video', () => {
    const item = moment({
      video: { youtubeId: YT_ID, title: 'Own' },
      sources: [source('Clip', YT)],
    });
    expect(footnoteVideoSources(item)).toEqual([]);
  });

  it('keeps multiple YouTube citations in the footnote, where references belong', () => {
    const item = moment({
      sources: [source('Clip A', YT), source('Clip B', 'https://youtu.be/zzzzzzzzzzz')],
    });
    expect(footnoteVideoSources(item).map((s) => s.youtubeId)).toEqual([YT_ID, 'zzzzzzzzzzz']);
  });

  it('ignores non-YouTube citations', () => {
    const item = moment({ sources: [source('Billboard', 'https://www.billboard.com/x')] });
    expect(footnoteVideoSources(item)).toEqual([]);
  });

  it('keeps the other YouTube citations when the moment has its own video', () => {
    const item = moment({
      video: { youtubeId: 'ownidownid1', title: 'Own' },
      sources: [source('Own', 'https://youtu.be/ownidownid1'), source('Clip', YT)],
    });
    expect(footnoteVideoSources(item).map((s) => s.youtubeId)).toEqual([YT_ID]);
  });
});

describe('youtubeFrameId', () => {
  it('reads the id out of every thumbnail shape the vault uses', () => {
    expect(youtubeFrameId(`https://i.ytimg.com/vi/${YT_ID}/maxres3.jpg`)).toBe(YT_ID);
    expect(youtubeFrameId(`https://i3.ytimg.com/vi/${YT_ID}/sd2.jpg`)).toBe(YT_ID);
    expect(youtubeFrameId(`https://img.youtube.com/vi/${YT_ID}/0.jpg`)).toBe(YT_ID);
    expect(youtubeFrameId(`https://i.ytimg.com/vi_webp/${YT_ID}/maxresdefault.webp`)).toBe(YT_ID);
  });

  it('is null for a photograph, a local path, a malformed url, and nothing', () => {
    expect(youtubeFrameId('https://upload.wikimedia.org/a/b.png')).toBeNull();
    expect(youtubeFrameId('/eras/debut.png')).toBeNull();
    expect(youtubeFrameId('not a url')).toBeNull();
    expect(youtubeFrameId(undefined)).toBeNull();
  });

  it('is null for a ytimg url that is not a frame path', () => {
    expect(youtubeFrameId(`https://i.ytimg.com/an/${YT_ID}/x.jpg`)).toBeNull();
    expect(youtubeFrameId(`https://i.ytimg.com/vi/${YT_ID}`)).toBeNull();
  });
});

/**
 * #2081. The #2057 de-dupe gives a video to exactly one card, which left the
 * OTHER card free to keep a still of that video as its photo — with no play
 * control, because it does not own the embed. On tloas that rendered
 * "'Elizabeth Taylor' goes to radio" as a hero-tier picture of the Elizabeth
 * Taylor music video that does nothing when tapped. #2080 could not catch it:
 * it only ever compared a card's photo against the video that card PLAYS, and a
 * deferring card plays none.
 *
 * Note what is NOT a parameter here: ownership. The answer is the same on both
 * sides of the de-dupe, so passing it in would have been a lie — see the note on
 * the function. What ownership decides is what REPLACES the photo, which is the
 * tier question (feed-tiers.test.ts).
 */
describe('feedCardImageHidden', () => {
  const img = (url: string) => [{ url, kind: 'primary' as const }];
  const frame = (id: string, file = 'maxres3.jpg') => `https://i.ytimg.com/vi/${id}/${file}`;
  const video = { youtubeId: YT_ID, title: 'T' };
  const known = new Set([YT_ID, 'otherotherot']);

  it('hides a card’s photo that is a frame of its own video — owner or deferrer', () => {
    // #2080's case (the poster is about to show it) and #2081's (there is no
    // poster, so nothing plays it) are one rule, not two.
    const item = moment({ video, images: img(frame(YT_ID)) });
    expect(feedCardImageHidden(item, known)).toBe(true);
  });

  it('hides every frame filename of that video, not just the poster’s url', () => {
    for (const file of ['hqdefault.jpg', 'maxresdefault.jpg', 'maxres3.jpg', 'sd2.jpg']) {
      const item = moment({ video, images: img(frame(YT_ID, file)) });
      expect(feedCardImageHidden(item, known)).toBe(true);
    }
  });

  it('hides a card showing a frame of some OTHER video in the era', () => {
    // The generalisation the fix asked for: the frame need not be of the card's
    // own video, only of one the era can play. Zero cases in the vault today —
    // this is the hole a future Photo Enrichment run would otherwise reopen.
    const item = moment({ video, images: img(frame('otherotherot')) });
    expect(feedCardImageHidden(item, known)).toBe(true);
  });

  it('keeps a frame of a video the app knows nothing about', () => {
    const item = moment({ video, images: img(frame('strangerthan')) });
    expect(feedCardImageHidden(item, known)).toBe(false);
  });

  it('is not fooled by an id that merely PREFIXES the path segment', () => {
    const item = moment({ video, images: img(`https://i.ytimg.com/vi/${YT_ID}extra/0.jpg`) });
    expect(feedCardImageHidden(item, known)).toBe(false);
  });

  it('does not throw on a malformed image url', () => {
    expect(feedCardImageHidden(moment({ video, images: img('not a url') }), known)).toBe(false);
  });

  it('keeps the photo on a card with no footage at all, frame or not', () => {
    // Scope guard. 20 moments carry a still of an era video without carrying
    // the video — a piece about the "22" video illustrated with a shot from it.
    // They promise no player, so they are not masquerading as anything, and the
    // frame is the only picture they have. Suppressing them would delete
    // imagery rather than duplication.
    expect(feedCardImageHidden(moment({ images: img(frame(YT_ID)) }), known)).toBe(false);
  });

  it('keeps a genuine photograph on a deferring card', () => {
    const item = moment({ video, images: img('https://upload.wikimedia.org/a/b.png') });
    expect(feedCardImageHidden(item, known)).toBe(false);
  });

  it('is false when there is no real photo to hide', () => {
    expect(feedCardImageHidden(moment({ video, images: img('/eras/debut.png') }), known)).toBe(
      false,
    );
    expect(feedCardImageHidden(moment({ video, images: [] }), known)).toBe(false);
  });

  it('still fires on the card’s own video when the known set is empty', () => {
    const item = moment({ video, images: img(frame(YT_ID)) });
    expect(feedCardImageHidden(item, new Set())).toBe(true);
  });
});

/**
 * The real corpus, wired the way EraSection wires it. A synthetic fixture cannot
 * fail if the rule stops matching the vault's actual urls, and the vault is
 * where the bug lived.
 */
describe('feedCardImageHidden over the real vault', () => {
  const suppressed: { id: string; owns: boolean }[] = [];
  for (const era of ERAS) {
    const items = contentForEra(era.id);
    const owners = inlineVideoMomentIds(items);
    const knownIds = eraKnownVideoIds(items, videosForEra(era.id));
    for (const item of items) {
      const owns = owners.has(item.id);
      if (feedCardImageHidden(item, knownIds)) suppressed.push({ id: item.id, owns });
    }
  }
  const deferring = suppressed.filter((s) => !s.owns).map((s) => s.id);

  it('suppresses the card Joey flagged — the radio beat that could not play', () => {
    expect(deferring).toContain('vault-tloas-elizabeth-taylor-goes-to-radio');
  });

  it('suppresses its sibling, the deferring Fate of Ophelia beat', () => {
    expect(deferring).toContain('vault-tloas-the-fate-of-ophelia-video-premieres');
  });

  it('fires on the deferring cards and on nothing else', () => {
    // Measured 2026-08-13: exactly the two tloas cards where two moments share
    // one video. If this number moves, a Photo Enrichment run changed the
    // corpus and the new cases want looking at rather than rubber-stamping.
    expect(deferring).toHaveLength(2);
  });

  it('still suppresses the #2080 owner frames, unchanged', () => {
    // 8 moments hold a frame of their own video in the hero slot; 6 of them own
    // their embed AND hold it as a real `primary` image, which is what this rule
    // suppresses. The other 2 (the deferring pair) are counted above. The two
    // that hold their frame as a non-primary stand-in never rendered a photo in
    // the feed anyway — MomentCardButton gates its image block on
    // `hasRealPrimaryImage` — so there was nothing there to suppress.
    expect(suppressed.filter((s) => s.owns)).toHaveLength(6);
  });

  it('leaves every suppressed deferring card with a video it does not own', () => {
    for (const id of deferring) {
      const item = ERAS.flatMap((e) => contentForEra(e.id)).find((i) => i.id === id)!;
      expect(item.video).toBeTruthy();
      expect(youtubeFrameId(primaryImageRef(item)?.url)).toBeTruthy();
    }
  });
});

/**
 * #2081 / Joey, 2026-08-13: "it looks horrible… the site would feel much more
 * natural if you played the video from the top."
 */
describe('heroVideoFor', () => {
  const img = (url: string, kind: 'primary' | 'archival' = 'primary') => [{ url, kind }];
  const video = { youtubeId: YT_ID, title: 'T' };

  it('promotes the video when the hero image is a frame of it', () => {
    expect(heroVideoFor(moment({ video, images: img(`https://i.ytimg.com/vi/${YT_ID}/maxres1.jpg`) }))).toEqual(
      video,
    );
  });

  it('promotes it even when the frame is a non-primary stand-in', () => {
    // Two of the ten ("Tim McGraw" arrives, "willow" leads the era) hold their
    // frame as a stand-in kind. `hasRealPrimaryImage` answers "no real photo"
    // about an image the reader is looking at, so the hero rule compares against
    // primaryImageRef — what the slot actually renders — instead.
    const item = moment({ video, images: img(`https://i.ytimg.com/vi/${YT_ID}/0.jpg`, 'archival') });
    expect(heroVideoFor(item)).toEqual(video);
  });

  it('leaves a page whose hero is a genuine photo alone', () => {
    const item = moment({ video, images: img('https://upload.wikimedia.org/a/b.png') });
    expect(heroVideoFor(item)).toBeNull();
    // …and that page keeps its body embed, because nothing is duplicated there.
    expect(detailVideoFor(item)).toEqual({ video });
  });

  it('is null for a moment with no footage', () => {
    expect(heroVideoFor(moment({ images: img(`https://i.ytimg.com/vi/${YT_ID}/0.jpg`) }))).toBeNull();
  });

  it('takes the body slot with it — one player per page, never two', () => {
    const item = moment({ video, images: img(`https://i.ytimg.com/vi/${YT_ID}/maxres1.jpg`) });
    expect(heroVideoFor(item)).toEqual(video);
    expect(detailVideoFor(item)).toBeNull();
  });

  // #2051, non-negotiable: a reader meets "Rumor — unconfirmed" BEFORE the
  // media. The body slot sits under the banner; the hero sits above it, so
  // promoting on a rumored moment would silently inverting that order. No vault
  // item carries both `video` and `confidence` today — which is precisely why
  // the rule has to live in code rather than in the corpus.
  it('refuses the hero on a sub-confirmed moment, leaving the video under the banner', () => {
    const images = img(`https://i.ytimg.com/vi/${YT_ID}/maxres1.jpg`);
    for (const confidence of ['reputable_reporting', 'strong_fan_consensus', 'clowning'] as const) {
      const item = moment({ video, images, confidence });
      expect(heroVideoFor(item)).toBeNull();
      expect(detailVideoFor(item)).toEqual({ video });
    }
  });

  it('still promotes on a CONFIRMED-tier confidence', () => {
    for (const confidence of ['official', 'confirmed_interview'] as const) {
      const item = moment({
        video,
        images: img(`https://i.ytimg.com/vi/${YT_ID}/maxres1.jpg`),
        confidence,
      });
      expect(heroVideoFor(item)).toEqual(video);
    }
  });
});

/**
 * The hero promotion drops the ImageRef it consumed, but the OTHER frames of
 * that same video were still woven through the body — under a player of the very
 * footage they are stills of. "'Elizabeth Taylor' goes to radio" carries
 * maxres3 (promoted) and maxres2 (not), one video, two files.
 */
describe('imageDuplicatesPageVideo', () => {
  const video = { youtubeId: YT_ID, title: 'T' };

  it('is true for any frame of the video this page plays', () => {
    const item = moment({ video });
    for (const file of ['maxres2.jpg', 'hqdefault.jpg', 'sd2.jpg']) {
      expect(imageDuplicatesPageVideo(item, `https://i.ytimg.com/vi/${YT_ID}/${file}`)).toBe(true);
    }
  });

  it('is false for a photograph, and for a frame of a different video', () => {
    const item = moment({ video });
    expect(imageDuplicatesPageVideo(item, 'https://upload.wikimedia.org/a/b.png')).toBe(false);
    expect(imageDuplicatesPageVideo(item, 'https://i.ytimg.com/vi/zzzzzzzzzzz/0.jpg')).toBe(false);
  });

  it('is false on a page with no video — nothing to duplicate', () => {
    expect(
      imageDuplicatesPageVideo(moment(), `https://i.ytimg.com/vi/${YT_ID}/maxres2.jpg`),
    ).toBe(false);
  });

  it('drops exactly the two archival frames in the vault, and no photographs', () => {
    const dropped: string[] = [];
    for (const era of ERAS) {
      for (const item of contentForEra(era.id)) {
        const heroImage = primaryImageRef(item);
        for (const img of item.images) {
          if (img !== heroImage && imageDuplicatesPageVideo(item, img.url)) dropped.push(item.id);
        }
      }
    }
    expect(dropped.sort()).toEqual([
      'vault-tloas-elizabeth-taylor-goes-to-radio',
      'vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
    ]);
  });
});

describe('heroVideoFor over the real vault', () => {
  const withVideo = ERAS.flatMap((e) => contentForEra(e.id)).filter((i) => i.video);
  const promoted = withVideo.filter((i) => heroVideoFor(i));

  it('promotes the video on the pages whose hero was a still of it', () => {
    // 10 of the 16 video-carrying moments, measured 2026-08-13. Photo
    // Enrichment sourced frames as photos for the moments that ARE a video.
    expect(withVideo).toHaveLength(16);
    expect(promoted).toHaveLength(10);
  });

  it('includes the page Joey pointed at', () => {
    expect(promoted.map((i) => i.id)).toContain(
      'vault-tloas-one-of-the-30-greatest-living-american-songwriters-and-a-rar',
    );
  });

  it('never leaves a promoted page rendering the same video twice', () => {
    for (const item of promoted) expect(detailVideoFor(item)).toBeNull();
  });

  it('leaves the other six pages with hero=photo and body=video', () => {
    for (const item of withVideo.filter((i) => !heroVideoFor(i))) {
      expect(detailVideoFor(item)).toEqual({ video: item.video });
      expect(youtubeFrameId(primaryImageRef(item)?.url)).not.toBe(item.video!.youtubeId);
    }
  });
});
