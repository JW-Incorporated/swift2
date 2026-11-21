import type { CSSProperties, SyntheticEvent } from 'react';

/**
 * Era-tinted fill for a moment card's fixed-aspect photo box (#6807). It sits
 * behind the image, so it shows while a hot-linked photo loads and stays as
 * the placeholder if it never does; the box keeps its aspect ratio either way,
 * so a failure cannot shift the feed.
 */
export const ERA_IMAGE_PLACEHOLDER_STYLE: CSSProperties = {
  background:
    'linear-gradient(135deg, color-mix(in srgb, var(--era-accent) 18%, var(--era-surface-2)), var(--era-surface))',
};

/** onError for a photo inside a placeholder box: hide the broken image, keep the box. */
export function hideFailedImage(event: SyntheticEvent<HTMLImageElement>): void {
  event.currentTarget.style.visibility = 'hidden';
}
