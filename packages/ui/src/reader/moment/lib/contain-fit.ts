/**
 * Geometry for `object-fit: contain` images.
 *
 * A `contain`-fitted <img> still fills its whole element box — the letterboxed
 * bars beside or above the picture are part of the IMG, not of whatever sits
 * behind it. That breaks the usual "did this click land on the backdrop?" test
 * of `e.target === e.currentTarget`: clicking the black space next to a photo
 * reports the image as the target, so the guard never fires and the overlay
 * never closes (Wyatt, 2026-07-20 — "clicking outside the picture doesn't
 * close it").
 *
 * The only way to tell the picture from its letterbox is geometric: derive the
 * rendered rect from the intrinsic aspect ratio and compare the pointer to it.
 */

export type RenderedRect = { left: number; top: number; width: number; height: number };

/**
 * The rect the picture actually occupies inside `box`, centred, preserving
 * aspect ratio. Returns null when the intrinsic size isn't known yet (the
 * image hasn't decoded) or the box has collapsed — callers must treat null as
 * "can't tell" rather than as a hit or a miss.
 */
export function containedImageRect(
  box: { left: number; top: number; width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
): RenderedRect | null {
  if (!naturalWidth || !naturalHeight || !box.width || !box.height) return null;
  const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
  };
}

/**
 * True when (x, y) falls on the letterbox rather than on the picture.
 *
 * Deliberately conservative: when the rendered rect is unknowable it returns
 * false, so an ambiguous click leaves the viewer open. Dismissing a photo the
 * reader still wanted is the worse of the two failures — the X button and Esc
 * both remain available, so a missed backdrop click costs one extra click,
 * while a wrong close loses their place.
 */
export function isPointerOutsideContainedImage(
  x: number,
  y: number,
  box: { left: number; top: number; width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  const rect = containedImageRect(box, naturalWidth, naturalHeight);
  if (!rect) return false;
  return (
    x < rect.left || x > rect.left + rect.width || y < rect.top || y > rect.top + rect.height
  );
}
