import { describe, expect, it } from 'vitest';

import {
  CRISIS_MESSAGE,
  HEAVY_INTRO,
  REFUSAL_MESSAGE,
  UNCLEAR_MESSAGE,
  isCrisisText,
  normalizeForCrisis,
} from './mood-safety';
import { SONG_MOODS } from './song-moods.generated';

/**
 * WHERE THE LINE IS, AS A TEST.
 *
 * This file is the regression guard in BOTH directions, and both directions are
 * real harms:
 *
 *  - Too permissive → we hand a playlist to someone disclosing risk.
 *  - Too strict → we tell someone who typed "I'm sad" that their feeling is
 *    outside what we can help with. That is not a cosmetic failure: the
 *    published guidance names labeling, stigma and discouraged future
 *    help-seeking as costs of a false positive, and at this feature's base rate
 *    (people asking a Taylor Swift app for a playlist) almost every fire of a
 *    broad net is a false one.
 *
 * The threshold below is modelled on the instruments clinicians actually use:
 * the C-SSRS screener opens on "wished you were dead" / "thoughts of killing
 * yourself", the NIMH ASQ asks the same four questions explicitly, and PHQ-9
 * items 1–8 measure ordinary depressive symptoms with NO crisis pathway — only
 * item 9 ("better off dead, or of hurting yourself") has one. Everything in
 * ORDINARY_FEELINGS below is items 1–8 territory. It must reach songs.
 *
 * When adding a case, add it to the corpus — not to an ad-hoc `it()`.
 */

/** Must NOT fire. Each entry is a phrasing a real reader could plausibly type. */
const ORDINARY_FEELINGS: readonly string[] = [
  // The founder's own sentence. The case this whole change exists for.
  "I'm grumpy and everything is pissing me off",

  // Plain negative affect — PHQ-9 items 1-8.
  'im sad',
  'I feel sad today',
  'so depressed lately',
  'feeling really low',
  'miserable',
  'I feel hopeless about this job search',
  'numb, honestly',
  'I feel completely empty',
  'exhausted and burnt out',
  'drained',
  'I have no energy for anything',

  // Anger, the whole range.
  'angry',
  'furious at my boss',
  'irritated by everything today',
  'annoyed',
  'so frustrated',
  'fed up',
  'I hate everything right now',
  'I hate my life right now',
  'everything sucks',
  'worst day ever',
  'bitter and resentful',
  'I want revenge',
  'I could kill him',
  'she is driving me insane',

  // Heartbreak and grief — the literal subject matter of the catalogue.
  'heartbroken',
  'he broke up with me and I am devastated',
  'gutted',
  'I miss him so much it hurts',
  'grieving',
  'my grandmother died last month and I miss her',
  'part of me died when they left',
  'I will never get over this',
  'crying in the car',
  'I cannot stop crying',

  // Loneliness and longing.
  'so lonely',
  'nobody understands me',
  'I feel invisible',
  'left out again',

  // Anxiety.
  'anxious',
  'stressed out',
  'spiraling about tomorrow',

  // Hyperbole and idiom — where a keyword list is at its worst.
  'I want to die of embarrassment',
  'I want to die, this album is so good',
  'this bridge makes me want to die of joy',
  'I want to die laughing',
  'this is killing me',
  "I'm literally dying",
  "I'm dying to see the Eras tour",
  'this bridge is to die for',
  'kill me now, my alarm did not go off',
  "I'd rather die than go to this wedding",
  'I feel dead tired after work',
  "I've overdosed on this album",
  'I have been overdosing on Folklore all week',

  // Negated — reassurance, not disclosure.
  "I don't want to die, I just want a break",
  'I do not want to die I just need a nap',

  // Third-party and past-tense framing.
  'my friend went through something like this',
  'I felt that way years ago and I am so much better now',

  // Fine, actually.
  'content and a little wistful',
  'so happy I could cry',
  'feeling nostalgic about high school',
  'winning, quietly',
];

/** MUST fire. Explicit ideation, intent, method, or self-harm. */
const GENUINE_RISK: readonly string[] = [
  // C-SSRS Q2 / ASQ Q3 — thoughts of killing yourself.
  'i want to kill myself',
  'thinking about killing myself',
  'I want to end my life',
  'I have been thinking about taking my own life',

  // C-SSRS Q1 / ASQ Q1-Q2 — wish to be dead.
  'i want to die',
  'I want to die.',
  'I WANT to  Die!!!',
  'i wanna die',
  'I wish I was dead',
  'I want to be dead',
  'I just want to end it all',
  "I don't want to be alive anymore",
  'I do not want to live anymore',
  "I don't want to wake up tomorrow",
  'there is no reason to live',
  'I have nothing to live for',
  'life is not worth living',
  'everyone would be better off without me',
  'they would all be better off dead',

  // Self-harm.
  'I keep cutting myself',
  'I want to hurt myself',
  'thinking about harming myself',
  'I self harm when it gets bad',

  // Named directly.
  'I feel suicidal tonight',
  'having suicidal thoughts',

  // Overdose in its literal sense.
  'I took an overdose last night',

  // Existing approved behaviour, preserved deliberately (see the note below).
  'i cant go on like this',
  'I give up on life',
];

describe('crisis detection — genuine risk signals', () => {
  it.each(GENUINE_RISK)('fires on %j', (text) => {
    expect(isCrisisText(text)).toBe(true);
  });
});

describe('crisis detection — ordinary feeling must reach the songs', () => {
  it.each(ORDINARY_FEELINGS)('does NOT fire on %j', (text) => {
    expect(isCrisisText(text)).toBe(false);
  });
});

describe('the founder case, named', () => {
  it('"I\'m grumpy and everything is pissing me off" is not a crisis', () => {
    expect(isCrisisText("I'm grumpy and everything is pissing me off")).toBe(false);
  });
});

describe('the guards are scoped, not global', () => {
  it('negation clears the die-family but never Tier A', () => {
    expect(isCrisisText("I don't want to die")).toBe(false);
    // Negations of a *reason to live* are disclosures, not reassurances.
    expect(isCrisisText("I don't want to live")).toBe(true);
    expect(isCrisisText("I don't want to be alive")).toBe(true);
  });

  it('a negation in an earlier clause does not clear a later disclosure', () => {
    expect(isCrisisText("I don't like Mondays. I want to die.")).toBe(true);
  });

  it('hyperbole must sit next to the phrase, not later in the message', () => {
    // "so good" appears, but far outside the window that modifies the phrase.
    expect(
      isCrisisText('I want to die. I know the new album is meant to be so good but I cannot care.'),
    ).toBe(true);
  });

  it('one unhedged mention is enough even beside a hedged one', () => {
    expect(isCrisisText('I want to die of embarrassment. Also I want to die.')).toBe(true);
  });
});

describe('normalization', () => {
  it('folds casing and punctuation before matching', () => {
    expect(normalizeForCrisis("I WANT to  Die!!!")).toBe('i want to die');
    expect(isCrisisText('I  W A')).toBe(false);
  });

  it('matches across inflections without bare-substring false hits', () => {
    expect(isCrisisText('I have been cutting myself')).toBe(true);
    // "management" contains "anger"-like substrings; nothing here should fire.
    expect(isCrisisText('thinking about project management today')).toBe(false);
  });
});

/**
 * The catalogue itself must not be a tripwire. A reader quoting a song title —
 * core Swiftie behaviour, and the single most screenshot-able way to get this
 * wrong — has to reach the songs. Driven off the generated catalogue so a
 * newly-seeded track with a darker title fails CI here rather than in public.
 */
describe('the song catalogue does not trip the crisis check', () => {
  it('no song title in the catalogue reads as a crisis disclosure', () => {
    const tripped = SONG_MOODS.filter((s) => isCrisisText(s.title)).map((s) => s.title);
    expect(tripped).toEqual([]);
  });

  it('no curated one-liner reads as a crisis disclosure', () => {
    const tripped = SONG_MOODS.filter((s) => s.oneLiner && isCrisisText(s.oneLiner)).map(
      (s) => s.slug,
    );
    expect(tripped).toEqual([]);
  });
});

describe('approved copy is present verbatim', () => {
  it('crisis message keeps the load-bearing resource specifics', () => {
    const joined = CRISIS_MESSAGE.join(' ');
    // 988 replaced 1-800-273-8255 in 2022 and is the number to lead with.
    expect(joined).toContain('988');
    expect(joined).toContain('HOME to 741741');
    expect(joined).toContain('findahelpline.com');
    expect(CRISIS_MESSAGE[0]).toBe("I'm really glad you told me.");
  });

  it('keeps signposts to the two or three the guidance recommends', () => {
    // Samaritans' industry guidance: users in distress are overwhelmed by more
    // than two or three signposts. Guard against the resources block growing.
    const joined = CRISIS_MESSAGE.join(' ');
    const signposts = ['988', '741741', 'findahelpline.com'];
    expect(signposts.filter((s) => joined.includes(s))).toHaveLength(3);
  });

  it('heavy intro and refusal are the approved lines', () => {
    expect(HEAVY_INTRO.startsWith('Sitting with something heavy?')).toBe(true);
    expect(REFUSAL_MESSAGE.startsWith("That's outside what I can help with")).toBe(true);
  });

  it('the unclear reply is an invitation, not a refusal', () => {
    expect(UNCLEAR_MESSAGE).not.toContain('outside what I can help with');
    expect(UNCLEAR_MESSAGE.toLowerCase()).toContain('tell me');
  });
});
