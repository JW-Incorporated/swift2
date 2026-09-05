import { describe, expect, it } from 'vitest';
import {
  videosForEra,
  allVideoRecordsForEra,
  isPlayable,
  musicVideosForEra,
  eraVideoFeed,
  isAppearance,
  APPEARANCE_KINDS,
  VIDEO_KIND_LABEL,
  findVideoEraId,
} from './videos';
import type { EraId, VideoNote } from './types';

const ALL_ERA_IDS: EraId[] = [
  'debut',
  'fearless',
  'speak-now',
  'red',
  '1989',
  'reputation',
  'lover',
  'folklore',
  'evermore',
  'midnights',
  'ttpd',
  'tloas',
];

// The song-to-video matcher (formerly `videoForTrack` here) moved to
// track-video.ts's `trackVideoFor` — see track-video.test.ts. Removed rather
// than kept in parallel (finding #2, adversarial review 2026-08-13): its
// `normalizeTitle` stripped every parenthetical including "(Taylor's
// Version)", so it disagreed with the conservative matcher on which
// recording to play.

const allVideos = (): VideoNote[] => ALL_ERA_IDS.flatMap((id) => videosForEra(id));

describe('the appearance taxonomy (2026-08-12)', () => {
  it('carries the appearances that PR #2035 could not place, on the era of their moment', () => {
    // One per new kind, spot-checked against the verified ledger
    // (supabase/seed/candidates/youtube-appearances.mjs).
    const find = (eraId: EraId, slug: string) => videosForEra(eraId).find((v) => v.slug === slug);
    expect(find('tloas', 'tonight-show-fallon-2025')?.kind).toBe('interview');
    expect(find('midnights', 'grammys-album-of-the-year-2024')?.kind).toBe('award_speech');
    expect(find('evermore', 'nyu-commencement-2022')?.kind).toBe('speech');
    expect(find('midnights', 'eras-tour-film-premiere-carpet-2023')?.kind).toBe('press_event');
  });

  it('holds Joey\'s line: the Videos surface is Taylor ON SCREEN only (2026-08-12)', () => {
    // The Time Person of the Year TODAY reveal is real, sourced, and belongs
    // on the timeline — but the video is Time's editor-in-chief announcing
    // the honor, not Taylor appearing. Joey overruled the wider definition:
    // "it should only be Taylor." An announcement ABOUT her must never sit on
    // the Videos rail, however big the news. Banned by VIDEO id, not slug —
    // the candidates ledger still lists this upload as verified, so a future
    // integration pass could otherwise re-add it under a fresh slug.
    for (const v of allVideos()) {
      expect(v.youtubeId, `${v.slug} embeds the banned TODAY announcement`).not.toBe(
        'VeFzmqp6OaQ',
      );
      expect(v.slug).not.toBe('time-person-of-the-year-today-2023');
    }
  });

  it('every appearance ships with a verified embeddable upload — never a metadata-only row', () => {
    // The whole point of the enum widening was to surface WATCHABLE
    // appearances. An appearance with no official upload must stay out of the
    // rail entirely (a fan re-upload is a timeline source, never an
    // officialUrl), so any appearance record that reached the data without a
    // youtubeId means that rule broke somewhere upstream.
    for (const v of allVideos().filter(isAppearance)) {
      expect(v.youtubeId, `${v.slug} has no embeddable upload`).toBeTruthy();
      expect(v.sources.length, `${v.slug} has no sources`).toBeGreaterThan(0);
    }
  });

  it('cites the exact video it embeds', () => {
    // The seed spells the id twice — once for the embed, once in the upload
    // citation — because the inertness grammar forbids the spread that would
    // have let one helper derive both. This is the guard against those two
    // drifting apart and a card citing a different video than it plays.
    for (const v of allVideos().filter(isAppearance)) {
      const cited = v.sources.some((s) => s.url.includes(v.youtubeId as string));
      expect(cited, `${v.slug} does not cite the video it embeds`).toBe(true);
    }
  });

  it('every appearance is dated, so the Videos filter can place it chronologically', () => {
    for (const v of allVideos().filter(isAppearance)) {
      expect(v.releasedOn, `${v.slug} is undated`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('labels every kind that actually appears in the data', () => {
    for (const v of allVideos()) {
      if (v.kind === null) continue;
      expect(VIDEO_KIND_LABEL[v.kind], `no label for kind ${v.kind}`).toBeTruthy();
    }
  });

  it('does not classify her own works as appearances', () => {
    for (const v of allVideos()) {
      if (v.kind === 'music_video' || v.kind === 'documentary' || v.kind === 'performance') {
        expect(isAppearance(v)).toBe(false);
      }
    }
    expect(APPEARANCE_KINDS.has('music_video')).toBe(false);
  });

  it('never lets an appearance leak into the default music-video timeline merge', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of musicVideosForEra(eraId)) expect(isAppearance(v)).toBe(false);
    }
  });
});

describe('watchable-first: every rendered video card can actually be watched (Joey, 2026-08-13; widened #3476)', () => {
  // Replaces #2050/#2055's "every card either plays or says why it can't".
  // Joey's original rule: "I don't want anything on the timeline that can't
  // be played. It just doesn't make sense to show a piece of content that a
  // user can't view." #3476 corrected a too-narrow reading of "played": 8
  // tour films/documentaries ARE viewable (Netflix, Disney+, Apple Music,
  // DVD, theatrical) but were hidden because "played" had been read as
  // "embeddable on this site". The invariant is still "nothing is rendered
  // unless a reader can actually watch it" — it just now accepts a verified
  // official watch link as well as an in-app embed. See docs/decisions.md,
  // "Playable-first timeline" (superseded in spirit, not reverted).

  it('gives every record on every reader-facing surface a real embed id OR a verified watch link', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of videosForEra(eraId)) {
        const watchable = Boolean(v.youtubeId) || (Boolean(v.watchUrl) && Boolean(v.platform));
        expect(watchable, `${v.slug} would render with nothing to watch`).toBe(true);
      }
      // The two derived surfaces inherit it rather than re-deciding — both
      // stay embed-only, since neither has an in-app slot for a link-out.
      for (const v of eraVideoFeed(eraId)) {
        const watchable = Boolean(v.youtubeId) || (Boolean(v.watchUrl) && Boolean(v.platform));
        expect(watchable).toBe(true);
      }
      for (const v of musicVideosForEra(eraId)) expect(v.youtubeId).toBeTruthy();
    }
  });

  it('shows a record with a verified watch link even with no embed (#3476)', () => {
    // The Eras Tour film is the clearest case: a real, important, well-sourced
    // record whose work exists only in cinemas and on Disney+. It now renders
    // via its watchUrl/platform rather than staying hidden.
    const found = videosForEra('midnights').find((v) => v.slug === 'taylor-swift-the-eras-tour-film');
    expect(found, 'the Eras Tour film should render via its watch link').toBeDefined();
    expect(found!.youtubeId).toBeNull();
    expect(found!.watchUrl).toBeTruthy();
    expect(found!.platform).toBeTruthy();
    expect(allVideoRecordsForEra('midnights').map((v) => v.slug)).toContain(
      'taylor-swift-the-eras-tour-film',
    );
  });

  it('hides exactly the records with neither an embed nor a watch link, and no others', () => {
    for (const eraId of ALL_ERA_IDS) {
      const hidden = allVideoRecordsForEra(eraId)
        .filter((v) => !videosForEra(eraId).some((p) => p.slug === v.slug))
        .map((v) => v.slug);
      const unwatchable = allVideoRecordsForEra(eraId)
        .filter((v) => !v.youtubeId && !(v.watchUrl && v.platform))
        .map((v) => v.slug);
      expect(hidden).toEqual(unwatchable);
    }
  });

  it('embeds the music videos that used to render as unplayable cards', () => {
    // The 11 backfilled in the same change, each oEmbed-verified against the
    // official "Taylor Swift" channel. If a content pass ever nulls one of
    // these out again, it disappears from the rail — this catches that.
    const expected: [EraId, string][] = [
      ['1989', 'out-of-the-woods-mv'],
      ['1989', 'new-romantics-mv'],
      ['debut', 'picture-to-burn-mv'],
      ['evermore', 'i-bet-you-think-about-me-mv'],
      ['fearless', 'white-horse-mv'],
      ['fearless', 'fifteen-mv'],
      ['midnights', 'lavender-haze-mv'],
      ['red', 'everything-has-changed-mv'],
      ['red', 'begin-again-mv'],
      ['speak-now', 'the-story-of-us-mv'],
      ['ttpd', 'i-can-do-it-with-a-broken-heart-mv'],
    ];
    for (const [eraId, slug] of expected) {
      const found = videosForEra(eraId).find((v) => v.slug === slug);
      expect(found, `${slug} is no longer playable in ${eraId}`).toBeDefined();
      expect(found!.youtubeId).toBeTruthy();
    }
  });

  it('does not leak the module array to a caller that might sort it', () => {
    const a = allVideoRecordsForEra('1989');
    expect(allVideoRecordsForEra('1989')).not.toBe(a);
    a.reverse();
    expect(allVideoRecordsForEra('1989').map((v) => v.slug)).not.toEqual(a.map((v) => v.slug));
  });

  it('isPlayable rejects a null or empty id', () => {
    const base = allVideoRecordsForEra('1989')[0];
    expect(isPlayable(base)).toBe(true);
    expect(isPlayable({ ...base, youtubeId: null })).toBe(false);
    expect(isPlayable({ ...base, youtubeId: '' })).toBe(false);
  });
});

describe('#3476 guardrail: every generated video record is watchable somehow', () => {
  // The issue's own concrete fix shape (item 4): a future authored-but-
  // unlinkable film — one with neither a YouTube embed nor a watchUrl/
  // platform pair — should fail CI, not silently vanish the way the original
  // 8 tour films/documentaries did. Runs over `allVideoRecordsForEra`, the
  // unfiltered path, so it catches the defect BEFORE `videosForEra` would
  // otherwise quietly hide it.
  it('has a youtubeId or a complete watchUrl+platform pair on every record', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of allVideoRecordsForEra(eraId)) {
        const watchable = Boolean(v.youtubeId) || (Boolean(v.watchUrl) && Boolean(v.platform));
        expect(watchable, `${eraId}/${v.slug} has no embed and no watch link`).toBe(true);
      }
    }
  });

  it('never carries a watchUrl without a platform label, or vice versa', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of allVideoRecordsForEra(eraId)) {
        expect(Boolean(v.watchUrl), `${eraId}/${v.slug} watchUrl/platform mismatch`).toBe(
          Boolean(v.platform),
        );
      }
    }
  });
});

describe('eraVideoFeed', () => {
  it('returns every video record for the era, newest-first', () => {
    const feed = eraVideoFeed('midnights');
    expect(feed.length).toBe(videosForEra('midnights').length);
    const dated = feed.filter((v) => v.releasedOn !== null).map((v) => v.releasedOn as string);
    expect([...dated].sort((a, b) => b.localeCompare(a))).toEqual(dated);
  });

  it('sorts undated records after dated ones rather than dropping them', () => {
    for (const eraId of ALL_ERA_IDS) {
      const feed = eraVideoFeed(eraId);
      const firstUndated = feed.findIndex((v) => v.releasedOn === null);
      if (firstUndated === -1) continue;
      expect(feed.slice(firstUndated).every((v) => v.releasedOn === null)).toBe(true);
    }
  });

  it('drops a record whose video is already embedded on a moment (no double-showing)', () => {
    const target = eraVideoFeed('tloas').find((v) => v.youtubeId);
    expect(target).toBeDefined();
    const withoutIt = eraVideoFeed('tloas', new Set([target!.youtubeId!]));
    expect(withoutIt.map((v) => v.slug)).not.toContain(target!.slug);
    expect(withoutIt.length).toBe(eraVideoFeed('tloas').length - 1);
  });

  it('surfaces appearances that the music-video merge deliberately excludes', () => {
    const feedSlugs = eraVideoFeed('tloas').map((v) => v.slug);
    const timelineSlugs = musicVideosForEra('tloas').map((v) => v.slug);
    expect(feedSlugs).toContain('late-show-colbert-2025');
    expect(timelineSlugs).not.toContain('late-show-colbert-2025');
  });
});

describe('musicVideosForEra', () => {
  it('only ever returns music_video-kind entries with a real release date', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of musicVideosForEra(eraId)) {
        expect(v.kind).toBe('music_video');
        expect(v.releasedOn).not.toBeNull();
      }
    }
  });

  it('is a subset of videosForEra for every era', () => {
    for (const eraId of ALL_ERA_IDS) {
      const all = new Set(videosForEra(eraId).map((v) => v.slug));
      for (const v of musicVideosForEra(eraId)) {
        expect(all.has(v.slug)).toBe(true);
      }
    }
  });

  it('includes the-fate-of-ophelia-mv now that its release date is known', () => {
    // Was the "undated music videos stay rail-only" example until 2026-08-13,
    // when the date was sourced from its own Wikipedia citation (YouTube
    // release 2025-10-05, two days after the theatrical premiere).
    //
    // NB this asserts musicVideosForEra, which is PRE-de-dupe. It does not mean
    // the card reaches the rendered feed: a tloas moment embeds the same id, so
    // EraSection's embeddedVideoIds drops it downstream. Asserted at this layer
    // on purpose — this function's contract is "dated music videos", and the
    // de-dupe is a separate rule with its own tests below.
    const found = musicVideosForEra('tloas').find((v) => v.slug === 'the-fate-of-ophelia-mv');
    expect(found?.releasedOn).toBe('2025-10-05');
  });

  it('still excludes any music video that has no release date at all', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of musicVideosForEra(eraId)) expect(v.releasedOn).not.toBeNull();
    }
  });

  it('excludes a non-music_video work even when it has a release date (tloas: the release-party film)', () => {
    const slugs = musicVideosForEra('tloas').map((v) => v.slug);
    expect(slugs).not.toContain('the-official-release-party-of-a-showgirl');
  });

  it('includes a dated music video (1989: shake-it-off-mv)', () => {
    const slugs = musicVideosForEra('1989').map((v) => v.slug);
    expect(slugs).toContain('shake-it-off-mv');
  });
});

// #3312 — a `?item=` deep link that names a video's slug (rather than a
// moment's id) needs to know which era owns it, since videos have no
// standalone `?video=` param of their own.
describe('findVideoEraId', () => {
  it('finds the real era for a known video slug (the #3312 repro)', () => {
    expect(findVideoEraId('icon-sessions-grammy-museum-medley')).toBe('tloas');
  });

  it.each([
    ['the-best-day-taylors-version-mv', 'evermore'],
    ['mr-perfectly-fine-taylors-version-lyric-video', 'evermore'],
    ['i-can-see-you-mv', 'midnights'],
  ] as const)('places %s by its Taylor\'s Version publish date', (slug, eraId) => {
    expect(findVideoEraId(slug)).toBe(eraId);
  });

  it('returns null for a slug that matches no video anywhere', () => {
    expect(findVideoEraId('not-a-real-video-slug')).toBeNull();
  });

  it('agrees with allVideoRecordsForEra for every real slug', () => {
    for (const eraId of ALL_ERA_IDS) {
      for (const v of allVideoRecordsForEra(eraId)) {
        expect(findVideoEraId(v.slug)).toBe(eraId);
      }
    }
  });
});
