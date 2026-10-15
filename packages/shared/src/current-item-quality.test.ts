import { describe, expect, it } from 'vitest';
import {
  CURRENT_ITEM_QUALITY_THRESHOLDS,
  IMAGE_HOST_ALLOWLIST,
  SCOPED_IMAGE_HOST_ALLOWLIST,
  evaluateCurrentItemQuality,
  isAllowlistedImageHost,
  passesCurrentItemQualityGate,
  sentenceCount,
  wordCount,
  type CurrentItemQualityInput,
} from './current-item-quality';

const GOOD_SUMMARY =
  'Taylor Swift announced a surprise new single today during a livestream event watched by fans worldwide. Fans immediately began speculating about which album the surprise single might come from.';
const GOOD_DETAIL = Array(62).fill('word').join(' '); // 62 words, clears the 60-word floor

function baseItem(overrides: Partial<CurrentItemQualityInput> = {}): CurrentItemQualityInput {
  return {
    headline: 'New single announced',
    summary: GOOD_SUMMARY,
    detail: GOOD_DETAIL,
    imageUrl: 'https://www.people.com/photo.jpg',
    redlineOk: true,
    ...overrides,
  };
}

describe('sentenceCount', () => {
  it('is linear on adversarial input (CodeQL polynomial-redos regression)', () => {
    const evil = 'a' + '!'.repeat(50_000) + 'b';
    const t0 = Date.now();
    expect(sentenceCount(evil)).toBe(1);
    expect(Date.now() - t0).toBeLessThan(200);
  });

  it('counts a run of terminators as one sentence end', () => {
    expect(sentenceCount('Wow!!! Really?! Yes.')).toBe(3);
  });
  it('counts simple sentences', () => {
    expect(sentenceCount('One. Two. Three.')).toBe(3);
  });
  it('is 0 for an empty string', () => {
    expect(sentenceCount('')).toBe(0);
    expect(sentenceCount('   ')).toBe(0);
  });
  it('counts a single unterminated sentence', () => {
    expect(sentenceCount('Just one fragment with no period')).toBe(1);
  });
});

describe('wordCount', () => {
  it('counts whitespace-separated words', () => {
    expect(wordCount('a b  c   d')).toBe(4);
  });
  it('is 0 for an empty string', () => {
    expect(wordCount('')).toBe(0);
  });
});

describe('isAllowlistedImageHost', () => {
  it('passes a bare-host allowlisted URL', () => {
    expect(isAllowlistedImageHost('https://www.people.com/photo.jpg')).toBe(true);
  });

  it.each([
    'https://www.taylorswift.com/wp-content/photo.jpg',
    'https://cdn.shopify.com/s/files/photo.jpg',
    'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
    'https://static01.nyt.com/images/photo.jpg',
    'https://media.pitchfork.com/photos/photo.jpg',
  ])('passes official and established image host %s', (url) => {
    expect(isAllowlistedImageHost(url)).toBe(true);
  });

  it('rejects a non-allowlisted host', () => {
    expect(isAllowlistedImageHost('https://random-blog.example.com/x.jpg')).toBe(false);
  });

  it('rejects an unparseable URL instead of throwing', () => {
    expect(isAllowlistedImageHost('not a url')).toBe(false);
  });

  it('passes a scoped host only under its required path prefix', () => {
    const scoped = SCOPED_IMAGE_HOST_ALLOWLIST[0]!;
    expect(isAllowlistedImageHost(`https://${scoped.host}${scoped.pathPrefix}img.jpg`)).toBe(true);
    expect(isAllowlistedImageHost(`https://${scoped.host}/other-path/img.jpg`)).toBe(false);
  });

  it('every bare allowlist entry is actually checked by the function', () => {
    for (const host of IMAGE_HOST_ALLOWLIST) {
      expect(isAllowlistedImageHost(`https://${host}/x.jpg`)).toBe(true);
    }
  });
});

describe('evaluateCurrentItemQuality', () => {
  it('passes a fully-qualifying item', () => {
    expect(evaluateCurrentItemQuality(baseItem())).toEqual({ ok: true });
    expect(passesCurrentItemQualityGate(baseItem())).toBe(true);
  });

  it('holds for a missing headline', () => {
    expect(evaluateCurrentItemQuality(baseItem({ headline: '' }))).toEqual({
      ok: false,
      reason: 'missing_headline',
    });
  });

  it('holds for a missing image', () => {
    expect(evaluateCurrentItemQuality(baseItem({ imageUrl: undefined }))).toEqual({
      ok: false,
      reason: 'missing_image',
    });
  });

  it('holds for an image on a non-allowlisted host', () => {
    expect(
      evaluateCurrentItemQuality(baseItem({ imageUrl: 'https://random-blog.example.com/x.jpg' })),
    ).toEqual({ ok: false, reason: 'image_host_not_allowlisted' });
  });

  it('holds for a summary under the sentence floor, even if long enough in chars', () => {
    const longOneSentence = `This is one very long single sentence that easily clears one hundred sixty characters in length but never once ends with a period question mark or exclamation mark so it stays one sentence`;
    expect(evaluateCurrentItemQuality(baseItem({ summary: longOneSentence }))).toEqual({
      ok: false,
      reason: 'summary_too_short',
    });
  });

  it('holds for a summary under the char floor, even with 2+ sentences', () => {
    expect(evaluateCurrentItemQuality(baseItem({ summary: 'Short one. Short two.' }))).toEqual({
      ok: false,
      reason: 'summary_too_short',
    });
  });

  it('holds for a detail under the word floor', () => {
    expect(evaluateCurrentItemQuality(baseItem({ detail: 'Too short.' }))).toEqual({
      ok: false,
      reason: 'detail_too_short',
    });
  });

  it('holds when the redline screen failed', () => {
    expect(evaluateCurrentItemQuality(baseItem({ redlineOk: false }))).toEqual({
      ok: false,
      reason: 'redline_failed',
    });
  });

  it('reports exactly one reason, checked in a fixed order (headline first)', () => {
    const everythingFails = baseItem({
      headline: '',
      imageUrl: undefined,
      summary: 'Too short.',
      detail: 'Too short.',
      redlineOk: false,
    });
    expect(evaluateCurrentItemQuality(everythingFails)).toEqual({
      ok: false,
      reason: 'missing_headline',
    });
  });

  it('honors a custom thresholds override', () => {
    const strict = { ...CURRENT_ITEM_QUALITY_THRESHOLDS, detailMinWords: 1000 };
    expect(evaluateCurrentItemQuality(baseItem(), strict)).toEqual({
      ok: false,
      reason: 'detail_too_short',
    });
  });
});
