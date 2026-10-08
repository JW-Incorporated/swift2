import { describe, expect, it } from 'vitest';

import { containedImageRect, isPointerOutsideContainedImage } from './contain-fit';

// A 1518x663 viewport row holding the 3:2 Reuters wedding photo — the exact
// case Wyatt clicked when he reported that clicking outside the picture did
// nothing. The picture renders letterboxed with ~360px of black on each side.
const ROW = { left: 0, top: 0, width: 1518, height: 663 };
const WIDE = { w: 3000, h: 2000 };

describe('containedImageRect', () => {
  it('centres a picture that is limited by height', () => {
    const rect = containedImageRect(ROW, WIDE.w, WIDE.h);
    expect(rect).not.toBeNull();
    // Height-limited: fills the row vertically, letterboxed horizontally.
    expect(rect!.height).toBeCloseTo(663, 0);
    expect(rect!.width).toBeCloseTo(994.5, 0);
    expect(rect!.left).toBeCloseTo((1518 - 994.5) / 2, 0);
    expect(rect!.top).toBeCloseTo(0, 0);
  });

  it('centres a picture that is limited by width', () => {
    const rect = containedImageRect({ left: 0, top: 0, width: 400, height: 900 }, 1000, 1000);
    expect(rect!.width).toBeCloseTo(400, 0);
    expect(rect!.height).toBeCloseTo(400, 0);
    expect(rect!.top).toBeCloseTo(250, 0); // (900 - 400) / 2
  });

  it('returns null when the intrinsic size is not known yet', () => {
    expect(containedImageRect(ROW, 0, 0)).toBeNull();
    expect(containedImageRect({ left: 0, top: 0, width: 0, height: 0 }, 100, 100)).toBeNull();
  });
});

describe('isPointerOutsideContainedImage', () => {
  it('treats the letterbox beside the picture as outside', () => {
    // x=160 is where the click that exposed the bug landed. The <img> element
    // covers it, so target===currentTarget reported a hit on the image; the
    // geometry correctly reports letterbox.
    expect(isPointerOutsideContainedImage(160, 400, ROW, WIDE.w, WIDE.h)).toBe(true);
    expect(isPointerOutsideContainedImage(1400, 400, ROW, WIDE.w, WIDE.h)).toBe(true);
  });

  it('treats the picture itself as inside', () => {
    expect(isPointerOutsideContainedImage(759, 331, ROW, WIDE.w, WIDE.h)).toBe(false);
    // Just inside each edge of the rendered picture.
    const rect = containedImageRect(ROW, WIDE.w, WIDE.h)!;
    expect(isPointerOutsideContainedImage(rect.left + 1, 331, ROW, WIDE.w, WIDE.h)).toBe(false);
    expect(
      isPointerOutsideContainedImage(rect.left + rect.width - 1, 331, ROW, WIDE.w, WIDE.h),
    ).toBe(false);
  });

  it('treats the bars above and below a panoramic picture as outside', () => {
    // The bars only land top/bottom when the picture is WIDER than the row:
    // the row is 1518x663 (2.29:1), so this 3:1 panorama fills the width and
    // leaves ~78px of black above and below.
    const row = { left: 0, top: 0, width: 1518, height: 663 };
    expect(isPointerOutsideContainedImage(759, 5, row, 3000, 1000)).toBe(true);
    expect(isPointerOutsideContainedImage(759, 658, row, 3000, 1000)).toBe(true);
    expect(isPointerOutsideContainedImage(759, 331, row, 3000, 1000)).toBe(false);
  });

  it('stays open when it cannot tell — an undecoded image never dismisses', () => {
    // Conservative on purpose: a wrong close loses the reader's place, while a
    // missed backdrop click costs one press of X.
    expect(isPointerOutsideContainedImage(0, 0, ROW, 0, 0)).toBe(false);
  });

  it('respects a row that is offset from the viewport origin', () => {
    const row = { left: 200, top: 100, width: 600, height: 400 };
    // 1:1 picture in a 3:2 row => 400x400 centred at x 300..700.
    expect(isPointerOutsideContainedImage(250, 300, row, 500, 500)).toBe(true);
    expect(isPointerOutsideContainedImage(500, 300, row, 500, 500)).toBe(false);
  });
});
