import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BOX_DRAWING_PREFIXES,
  TIER_BODY,
  TIER_BOX,
  TIER_BOX_STYLE,
  TIER_FOOTER,
  TIER_SPAN,
} from './card-chrome';
import type { CardTier } from './feed-tiers';

/**
 * #2057: the era feed's play affordance rendered OUTSIDE the card's border — a
 * detached pill floating in the gap below an 830px-tall card, which reads as
 * "this card has no video". The CEO scrolled past four in a row.
 *
 * The fix is structural, so the lock is structural: the card's box is drawn
 * once, by a wrapper that contains BOTH the card's <button> and the play
 * affordance. These tests fail if a future edit gives the button its own box
 * back (two boxes — the affordance is outside one of them) or lifts the
 * affordance back out to the <li>.
 *
 * There are no component tests in this suite (vitest runs in a `node`
 * environment), so the second half is a source lock, in the idiom of
 * components/longlive/close-affordance.test.ts.
 */

const TIERS: CardTier[] = ['hero', 'media', 'chip', 'text'];

describe('per-tier chrome', () => {
  it('covers every tier', () => {
    for (const map of [TIER_SPAN, TIER_BOX, TIER_BODY, TIER_FOOTER, TIER_BOX_STYLE]) {
      expect(Object.keys(map).sort()).toEqual([...TIERS].sort());
    }
  });

  for (const tier of TIERS) {
    describe(tier, () => {
      it('draws the box on the wrapper: a surface and a border', () => {
        expect(TIER_BOX[tier]).toContain('era-card');
        expect(TIER_BOX[tier]).toMatch(/\bborder(-l-4)?\b/);
      });

      it('eases the .era-card hover instead of snapping it', () => {
        // `.era-card:hover` animates border-color and box-shadow but carries no
        // transition itself — it has to sit on the same element as this class.
        expect(TIER_BOX[tier].split(/\s+/)).toContain('transition');
      });

      it('leaves the card button with no box of its own', () => {
        const offenders = TIER_BODY[tier]
          .split(/\s+/)
          .filter((cls) => BOX_DRAWING_PREFIXES.some((prefix) => prefix.test(cls)));
        expect(offenders).toEqual([]);
      });

      it('keeps the button full width inside the box', () => {
        expect(TIER_BODY[tier]).toContain('w-full');
      });

      it('pads the footer off the box’s bottom edge', () => {
        expect(TIER_FOOTER[tier]).toMatch(/\bpb-\d/);
      });
    });
  }
});

// PLAN.md P3 step 15 split EraSection.tsx's card components out into their
// own files — see MAP.md. `MomentCard` now lives in MomentCard.tsx,
// `VideoMomentCard` in VideoMomentCard.tsx; both read from there.
const MOMENT_CARD = readFileSync(
  new URL('../../components/longlive/MomentCard.tsx', import.meta.url),
  'utf8',
);
const VIDEO_MOMENT_CARD = readFileSync(
  new URL('../../components/longlive/VideoMomentCard.tsx', import.meta.url),
  'utf8',
);

/** The body of a top-level exported function in `src`, up to the next one. */
function functionSource(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`no function ${name} in this source`);
  const next = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

/**
 * Index just past the `</div>` that closes the <div> opening at `openAt`.
 *
 * Counting <div>/`</div>` depth rather than reaching for `lastIndexOf('</div>')`
 * matters: the shape this file exists to reject — the affordance lifted back
 * out of the box in a wrapper of its own, i.e. #2055's shipped
 * `<div className="mt-3">…</div>` — ends in a `</div>` too, and a lastIndexOf
 * check would happily resolve to THAT one and pass with the bug restored.
 */
function endOfDiv(src: string, openAt: number): number {
  const tags = /<div\b|<\/div>/g;
  tags.lastIndex = openAt;
  let depth = 0;
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(src)) !== null) {
    depth += tag[0] === '</div>' ? -1 : 1;
    if (depth === 0) return tag.index + tag[0].length;
  }
  throw new Error('unbalanced <div> in the sliced source');
}

describe('MomentCard renders its play affordance inside the card’s box', () => {
  const card = functionSource(MOMENT_CARD, 'MomentCard');
  const boxAt = card.indexOf('<div className={TIER_BOX[tier]}');
  const footerAt = card.indexOf('TIER_FOOTER[tier]');
  const liCloseAt = card.indexOf('</li>');

  it('opens the box wrapper before the footer that holds the affordance', () => {
    expect(boxAt).toBeGreaterThan(-1);
    expect(footerAt).toBeGreaterThan(boxAt);
    expect(liCloseAt).toBeGreaterThan(footerAt);
  });

  it('keeps the affordance INSIDE the box, not after it', () => {
    // The assertion that would have caught #2055's placement: its badge sat
    // after the card's box closed, in the gap before </li>.
    expect(footerAt).toBeLessThan(endOfDiv(card, boxAt));
  });

  it('closes the box immediately before the list item — nothing renders between', () => {
    expect(card.slice(endOfDiv(card, boxAt), liCloseAt).trim()).toBe('');
  });

  it('uses the shared full-width poster, not a bespoke row or a detached pill', () => {
    expect(card).toContain('<VideoPoster');
    // #2063's compact 96px row and #2055's ghost pill, both rejected by the CEO.
    expect(card).not.toContain('<PlayPoster');
    expect(card).not.toContain('<PlayBadge');
  });

  it('yields its photo slot on the decision EraSection handed down', () => {
    // The rule itself is `feedCardImageHidden` (video-affordance.ts, unit
    // tested there); the card must not re-derive it. It used to call
    // `cardImageDuplicatesVideo(item, video)` inline, where `video` is null on a
    // card that defers its embed — so a deferring card showing a still of the
    // video it does NOT play never reached the check at all (#2081, Joey's
    // tloas report). Taking the answer as a prop is what makes the deferring
    // case representable, and what lets the tier be scored against the same
    // answer before render.
    expect(card).toContain('hideImage={hideImage}');
    expect(card).not.toContain('cardImageDuplicatesVideo');
  });
});

/**
 * #2080: ONE video treatment in the feed. A story moment carrying footage and a
 * video record are two different cards, and Joey's whole complaint across #2051
 * → #2055 → #2063 was that they did not look like they did the same thing. The
 * lock is that they render the SAME component — a look can be copied and then
 * drift; a component cannot.
 */
const MOMENT_CARD_IMPORTS = MOMENT_CARD.slice(0, MOMENT_CARD.indexOf('export function MomentCard'));

describe('one video treatment in the era feed', () => {
  it('imports the poster from the same module the video-record card embeds through', () => {
    expect(MOMENT_CARD_IMPORTS).toContain("import { MomentVideo, VideoPoster } from './MomentVideo'");
  });

  it('leaves the era feed with no second poster implementation', () => {
    // No local component may draw a YouTube thumbnail here; the only route to
    // one is VideoPoster/MomentVideo.
    expect(MOMENT_CARD).not.toContain('i.ytimg.com');
    expect(VIDEO_MOMENT_CARD).not.toContain('i.ytimg.com');
  });

  it('renders the video-record card through the same facade', () => {
    expect(functionSource(VIDEO_MOMENT_CARD, 'VideoMomentCard')).toContain('<MomentVideo');
  });
});

const MOMENT_VIDEO = readFileSync(
  new URL('../../components/longlive/MomentVideo.tsx', import.meta.url),
  'utf8',
);

/**
 * The body of a top-level function in MomentVideo.tsx, up to the next one — or
 * up to the next function's DOC COMMENT, whichever comes first. Stopping only at
 * `export function` would trail MomentVideo's own doc ("the iframe is heavy")
 * into VideoPoster's slice and make the "no iframe here" assertion unfalsifiable.
 */
function momentVideoSource(name: string): string {
  const start = MOMENT_VIDEO.indexOf(`export function ${name}(`);
  if (start === -1) throw new Error(`no exported function ${name} in MomentVideo.tsx`);
  const ends = ['\nexport function ', '\n/**']
    .map((marker) => MOMENT_VIDEO.indexOf(marker, start + 1))
    .filter((at) => at !== -1);
  return MOMENT_VIDEO.slice(start, ends.length > 0 ? Math.min(...ends) : undefined);
}

describe('VideoPoster keeps the #2051 accessibility contract', () => {
  const poster = momentVideoSource('VideoPoster');

  it('is a real button that does not submit anything', () => {
    expect(poster).toContain('type="button"');
  });

  it('announces what plays, in one sentence, everywhere it renders', () => {
    expect(poster).toContain('aria-label={`Play ${playNoun}: ${video.title}`}');
    // The feed passes no playNoun, so a moment card must still say "Play video".
    expect(poster).toContain("playNoun = 'video'");
  });

  it('shows the video’s poster rather than loading a player', () => {
    expect(poster).toContain('https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg');
    expect(poster).not.toContain('iframe');
  });

  it('hides the decorative overlay and glyph from screen readers', () => {
    expect(poster.match(/aria-hidden/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('is full width and 16:9 — the video-record treatment, not a compact row', () => {
    expect(poster).toContain('<VideoFrame>');
    expect(MOMENT_VIDEO).toContain('aspect-video w-full');
    // The #2063 row's giveaways: a fixed narrow poster and its own copy label.
    expect(poster).not.toContain('w-24');
    expect(poster).not.toContain('Play video</span>');
  });
});

const MOMENT_DETAIL = readFileSync(
  new URL('../../components/longlive/MomentDetail.tsx', import.meta.url),
  'utf8',
);

/**
 * #2081, FIX 2. Joey on the detail pages: "it looks horrible… the site would
 * feel much more natural if you played the video from the top." On 10 of the 16
 * video-carrying moments the ~42vh hero was a still of the very video embedded a
 * screen below, because Photo Enrichment sourced frames as photos for the
 * moments that ARE a video. The hero now plays.
 *
 * Structural assertions, because vitest runs in `node` with no component tests:
 * these lock the properties a rendering test would have caught, at the only
 * level available here.
 */
describe('the detail hero plays the moment’s own footage', () => {
  it('asks the shared rule rather than re-deriving the hero decision', () => {
    expect(MOMENT_DETAIL).toContain('heroVideoFor(item)');
  });

  it('renders the hero player through the same facade every other video uses', () => {
    const branch = MOMENT_DETAIL.slice(
      MOMENT_DETAIL.indexOf('{heroVideo ? ('),
      MOMENT_DETAIL.indexOf(') : ('),
    );
    expect(branch).toContain('<MomentVideo video={heroVideo}');
    // Click-to-load (#1935): the poster is a plain <img> and no iframe exists
    // in this file at all — MomentVideo mounts one only on a real click.
    expect(MOMENT_DETAIL).not.toContain('<iframe');
    // A video hero PLAYS; the lightbox is for photographs. The viewer opens
    // only from `hero`, which is undefined whenever the video took the slot.
    expect(branch).not.toContain('openLightbox');
  });

  it('caps the player at the photo hero’s 42vh instead of letting 16:9 run away', () => {
    // Full-bleed 16:9 is 219px tall at 390px wide and ~850px on a desktop. The
    // width cap makes the height aspect-driven on a phone and exactly 42vh on
    // a desktop, so both look deliberate and the page rhythm is preserved.
    expect(MOMENT_DETAIL).toContain('max-w-[calc(42vh*16/9)]');
  });

  it('does not pull the article over a player the way it does over a photo', () => {
    // -mt-10 lands on a photo hero's already-faded gradient; over a video it
    // would crop the frame and sit on the player's controls.
    expect(MOMENT_DETAIL).toContain("${heroVideo ? 'mt-4' : '-mt-10'}");
  });

  it('keeps one set of sheet controls, reachable from either hero', () => {
    // Favorite/share/close are the way back out of a modal sheet. Defined once
    // and rendered by both branches, so neither can lose them.
    expect(MOMENT_DETAIL.match(/aria-label="Close"/g)).toHaveLength(1);
    expect(MOMENT_DETAIL.match(/\{heroControls\}/g)).toHaveLength(2);
  });

  it('keeps every promoted or duplicated frame out of the photo viewer too', () => {
    // The viewer holds what the page shows, in page order — never item.images,
    // which still contains the frames the gallery filter dropped. Otherwise
    // swiping out of a gallery photo lands on the still this change removes.
    expect(MOMENT_DETAIL).toContain('const lightboxImages = hero ? [hero, ...gallery] : gallery');
    expect(MOMENT_DETAIL).toContain('images={lightboxImages}');
    expect(MOMENT_DETAIL).not.toContain('images={item.images}');
  });

  it('drops body frames of the page’s own video by id, not by object identity', () => {
    // Identity dropped only the ImageRef the hero consumed, so a SECOND frame of
    // the same video ("goes to radio" carries maxres3 and maxres2) came back
    // into the body under a player of that very footage.
    expect(MOMENT_DETAIL).toContain('!imageDuplicatesPageVideo(item, img.url)');
  });

  it('marks the hero poster as the LCP image, as the photo hero already was', () => {
    // A `?item=` share link opens this sheet as the first paint.
    expect(MOMENT_DETAIL).toContain('<MomentVideo video={heroVideo} className="" priority />');
  });
});
