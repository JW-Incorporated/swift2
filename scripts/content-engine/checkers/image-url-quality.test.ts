import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { declaredThumbWidth, isGettyComp } from './image-url-quality.mjs';

describe('declaredThumbWidth', () => {
  it('reads the render width from a Wikimedia thumbnail path', () => {
    expect(
      declaredThumbWidth(
        'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Taylor_Swift_-_Love_Story.png/250px-Taylor_Swift_-_Love_Story.png',
      ),
    ).toBe(250);
    expect(
      declaredThumbWidth(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/x.jpg/500px-x.jpg',
      ),
    ).toBe(500);
  });

  it('returns null for a full-resolution or non-thumbnail URL', () => {
    expect(
      declaredThumbWidth('https://upload.wikimedia.org/wikipedia/commons/6/6a/x.jpg'),
    ).toBeNull();
    expect(declaredThumbWidth('https://www.billboard.com/some-photo.jpg')).toBeNull();
    // A stray "NNNpx-" in a non-thumbnail filename must not false-positive.
    expect(declaredThumbWidth('https://example.com/img/200px-banner-hero.jpg')).toBeNull();
  });
});

describe('isGettyComp', () => {
  it('flags the watermarked Getty preview CDN', () => {
    expect(
      isGettyComp(
        'https://media.gettyimages.com/id/90711948/photo/foo.jpg?s=594x594&w=0&k=20',
      ),
    ).toBe(true);
  });

  it('does not flag other hosts', () => {
    expect(isGettyComp('https://www.billboard.com/photo.jpg')).toBe(false);
    expect(isGettyComp('https://upload.wikimedia.org/x/250px-y.png')).toBe(false);
  });
});
