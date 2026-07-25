import { describe, expect, it } from 'vitest';

import {
  CRISIS_MESSAGE,
  HEAVY_INTRO,
  REFUSAL_MESSAGE,
  isCrisisText,
  normalizeForCrisis,
} from './mood-safety';

describe('crisis detection', () => {
  it('fires on clear self-harm / suicidal phrasing', () => {
    for (const text of [
      'i want to die',
      'I want to die.',
      "I don't want to be alive anymore",
      'thinking about killing myself',
      'I feel suicidal tonight',
      'I want to end my life',
      'everyone would be better off without me',
      'i cant go on like this',
      'I keep cutting myself',
    ]) {
      expect(isCrisisText(text)).toBe(true);
    }
  });

  it('does not fire on ordinary heavy sadness or hyperbole about songs', () => {
    for (const text of [
      'heartbroken and angry, he left me',
      'feeling nostalgic about high school',
      "I'm dying to see the Eras tour",
      'this bridge is to die for',
      'content and a little wistful',
      'so happy I could cry',
      'I feel dead tired after work',
    ]) {
      expect(isCrisisText(text)).toBe(false);
    }
  });

  it('normalizes casing and punctuation before matching', () => {
    expect(normalizeForCrisis("I WANT to  Die!!!")).toBe('i want to die');
    expect(isCrisisText('I  W A')).toBe(false);
    expect(isCrisisText("i want to die")).toBe(true);
  });
});

describe('approved copy is present verbatim', () => {
  it('crisis message keeps the load-bearing resource specifics', () => {
    const joined = CRISIS_MESSAGE.join(' ');
    expect(joined).toContain('988');
    expect(joined).toContain('HOME to 741741');
    expect(joined).toContain('findahelpline.com');
    expect(CRISIS_MESSAGE[0]).toBe("I'm really glad you told me.");
  });

  it('heavy intro and refusal are the approved lines', () => {
    expect(HEAVY_INTRO.startsWith('Sitting with something heavy?')).toBe(true);
    expect(REFUSAL_MESSAGE.startsWith("That's outside what I can help with")).toBe(true);
  });
});
