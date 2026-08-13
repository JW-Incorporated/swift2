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

const ERA_SECTION = readFileSync(
  new URL('../../components/longlive/EraSection.tsx', import.meta.url),
  'utf8',
);

/** The body of a top-level function in EraSection, up to the next one. */
function functionSource(name: string): string {
  const start = ERA_SECTION.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`no function ${name} in EraSection.tsx`);
  const next = ERA_SECTION.indexOf('\nfunction ', start + 1);
  return ERA_SECTION.slice(start, next === -1 ? undefined : next);
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
  const card = functionSource('MomentCard');
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

  it('yields its photo slot to the poster when they are the same frame', () => {
    expect(card).toContain('cardImageDuplicatesVideo(item, video)');
  });
});

/**
 * #2078: ONE video treatment in the feed. A story moment carrying footage and a
 * video record are two different cards, and Joey's whole complaint across #2051
 * → #2055 → #2063 was that they did not look like they did the same thing. The
 * lock is that they render the SAME component — a look can be copied and then
 * drift; a component cannot.
 */
const ERA_SECTION_IMPORTS = ERA_SECTION.slice(0, ERA_SECTION.indexOf('export function EraSection'));

describe('one video treatment in the era feed', () => {
  it('imports the poster from the same module the video-record card embeds through', () => {
    expect(ERA_SECTION_IMPORTS).toContain("import { MomentVideo, VideoPoster } from './MomentVideo'");
  });

  it('leaves the era feed with no second poster implementation', () => {
    // No local component may draw a YouTube thumbnail here; the only route to
    // one is VideoPoster/MomentVideo.
    expect(ERA_SECTION).not.toContain('i.ytimg.com');
  });

  it('renders the video-record card through the same facade', () => {
    expect(functionSource('VideoMomentCard')).toContain('<MomentVideo');
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
