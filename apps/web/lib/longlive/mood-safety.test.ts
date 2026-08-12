import { describe, expect, it } from 'vitest';

import {
  CRISIS_MESSAGE,
  CRISIS_MESSAGE_ABUSE,
  DV_RESOURCE_LINE,
  HEAVY_INTRO,
  REFUSAL_MESSAGE,
  UNCLEAR_MESSAGE,
  assessCrisis,
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

  // #1979 collisions — the abuse tier must not fire on ordinary Swiftie speech
  // that happens to contain a harm verb without a human subject, or with an
  // idiom follower. These are the exact strings the subject/idiom guards exist
  // to protect.
  'this song really hits me',
  'that lyric hits me every time',
  'the bridge hits me so hard',
  'it hurts me that he forgot my birthday', // emotional hurt, "it" subject → heartbreak, not abuse
  'beats me why he even bothered', // "beats me" = I have no idea
  'he beats me at chess every single time',
  'she always beats me at Mario Kart',
  'hit me up when you land',
  'he hits me up every day', // = messages me
  'this movie is so violent',
  'nobody can hurt me anymore', // defiance, bare "hurt me" (not matched)
  "you can't hurt me",

  // #1980 collisions — guarded ideation must clear on the benign completion,
  // and bare medication adherence must not fire (only quantified overdose does).
  'I want to end it with him', // breakup, not ideation
  'I wanna end it with her, we are done',
  'I was thinking about ending it with him anyway',
  'I took the pills the doctor prescribed and I feel a bit better',
  'took my meds like I was told',

  // Obfuscation-hardening collisions (follow-up to #2002). Folding leet digits
  // and collapsing spaced-out letters must never manufacture a crisis phrase
  // out of ordinary Swiftie text — digits, era names, and multi-char words all
  // keep their boundaries.
  'top 5 songs of 1989',
  'listening to 1989 at 3am on repeat',
  'she is 13 forever and so am I',
  'paid $5 for merch at the popup',
  'i want to spend my life with him', // must never collapse into "endmylife"
  'i want to skill myself up in guitar', // "skill" is not "kill"
  'kms lol the presale sold out', // algospeak hyperbole — same call as bare "kill me"
  'the unalive jokes on my feed are exhausting', // meme vocabulary, not disclosure
  'I want to unalive him I swear', // the "I could kill him" of algospeak

  // Abuse-tier collisions (follow-up to #2002) — emotional fan speech with a
  // harm verb must clear via the subject/idiom/figurative guards.
  'this song chokes me up',
  'that ending choked me up so bad',
  'my anxiety attacks me at night',
  'cupid attacks me with these lyrics',
  'my boss beats me to the office every day',
  'she hits me with the feels every time',
  'she hits me right in the feels',
  'the way he sings hurts me in the best way',
  'he cheated on me and it hurts me so bad', // heartbreak — "it" owns the verb
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

  // #1980 — passive / obfuscated ideation the old lexicon skipped.
  'nobody would notice if I was gone',
  'if I was gone it would be easier for everyone',
  'if I were gone nobody would care',
  'I want to end it',
  'honestly I just want to end it',
  'I wrote the note already',
  'I have written the note',
  'I wrote a goodbye letter to my parents',
  'I left a goodbye note',
  'I took all the pills',
  'I took a whole bottle of pills last night',
  'I swallowed all the pills',
  "I don't want to be here anymore",
  'there is no point in living',
  'I don’t see the point anymore',
  'I just want to stop existing',
  "I don't want to exist",
  'I wish I didn’t exist',

  // Guarded-ideation additions (follow-up to #2002).
  'I keep thinking about ending it',
  'I thought about ending it last night',

  // Algospeak (follow-up to #2002) — platform-filter euphemisms whose dominant
  // usage is the disclosure itself.
  'i want to unalive myself',
  'thinking about unaliving myself',
  'i want to unalive',
  'commit sewer slide',
  'i want to self delete',
];

/**
 * MUST fire — obfuscated spellings of Tier A/B content (follow-up to #2002,
 * mirroring the Clownbot refusal gate's #1989/#2001 hardening). A reader who
 * has spent years typing around platform filters does not switch the habit off
 * for a genuine disclosure; every class here reached songs or UNCLEAR before
 * the normalizer learned NFKD, homoglyph/leet folding, zero-width deletion,
 * and spaced-letter collapse.
 */
const OBFUSCATED_RISK: readonly string[] = [
  // Fullwidth — previously normalized to the EMPTY STRING and vanished.
  'ｋｉｌｌ ｍｙｓｅｌｆ',
  'ｉ ｗａｎｔ ｔｏ ｄｉｅ',
  // Fancy-font generators (mathematical alphanumerics, circled letters).
  '𝐤𝐢𝐥𝐥 𝐦𝐲𝐬𝐞𝐥𝐟',
  '𝓀𝒾𝓁𝓁 𝓂𝓎𝓈𝑒𝓁𝒻',
  'ⓚⓘⓛⓛ ⓜⓨⓢⓔⓛⓕ',
  // Leet.
  'k1ll myself',
  'i want to k1ll mys3lf',
  'su1c1dal',
  '5uicidal',
  'i w4nt to di3',
  // Cyrillic homoglyphs (м, с, і).
  'kill мyself',
  'suiсidal tonight',
  // Zero-width joiner/space inside or between words.
  'k‍i‍l‍l myself',
  'kill​myself',
  // No separator at all.
  'killmyself',
  'i want to killmyself',
  // Spaced-out letters.
  'k i l l m y s e l f',
  'i want to k i l l myself',
  // Diacritics.
  'kïll mysélf',
  'suïcidal',
];

/**
 * #1979 — the abuse / immediate-danger tier. MUST fire, AND must be flagged as
 * abuse so the route leads with the DV hotline rather than the suicide line.
 * These used to fall through: "hurts me" was a heartbreak keyword and the rest
 * had no entry at all, so a reader in danger got a breakup playlist.
 */
const ABUSE_RISK: readonly string[] = [
  // "hurt(s) me" in the violence sense — the exact regressions in the ticket.
  'he hurts me',
  'my mom hurts me',
  'he is hurting me',
  'she keeps hurting me',
  'im scared he will hurt me',
  "I'm scared he's going to hurt me",
  // Physical violence.
  'my boyfriend hits me',
  'he hits me',
  'my husband beats me',
  'my girlfriend hits me when she is angry',
  'he is hitting me',
  // Named abuse / threats / control.
  'my dad abuses me',
  'im being abused',
  'I think I am being abused',
  'he threatens to kill me',
  'my partner threatens to hurt me',
  'my partner is violent',
  'he gets violent when he drinks',
  'my husband is abusive',

  // Follow-up to #2002 — physical-violence verbs and past-tense threats the
  // first pass skipped.
  'he chokes me',
  'he choked me last night',
  'he strangles me',
  'he slaps me when he is drunk',
  'my dad slapped me',
  'he punches me',
  'he punched me again',
  'he attacks me when he is drunk',
  'he beats me to a pulp',
  'he threatened me again last night',
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

describe('crisis detection — obfuscated spellings still fire (parity with the refusal gate)', () => {
  it.each(OBFUSCATED_RISK)('fires on %j', (text) => {
    expect(isCrisisText(text)).toBe(true);
  });

  it('fullwidth text no longer normalizes to the empty string', () => {
    expect(normalizeForCrisis('ｋｉｌｌ ｍｙｓｅｌｆ')).toBe('kill myself');
  });

  it('folds leet and homoglyphs without corrupting era names into phrases', () => {
    expect(normalizeForCrisis('k1ll mys3lf')).toBe('kill myself');
    // Digit folding mangles "1989" into a nonsense token — which is fine,
    // because no crisis phrase can ever match a nonsense token. What matters is
    // that the message stays clear.
    expect(isCrisisText('top 5 songs of 1989')).toBe(false);
  });

  it('deletes zero-width characters instead of turning them into boundaries', () => {
    expect(normalizeForCrisis('k‍i‍l‍l myself')).toBe('kill myself');
    expect(normalizeForCrisis('kill​myself')).toBe('killmyself');
    expect(isCrisisText('kill​myself')).toBe(true);
  });

  it('spaced-out letters collapse for Tier A only — guards keep their boundaries', () => {
    expect(isCrisisText('k i l l m y s e l f')).toBe(true);
    // Ordinary multi-character words never collapse, so "spend my life" can
    // never form "endmylife" and "skill myself" never forms "killmyself".
    expect(isCrisisText('i want to spend my life with him')).toBe(false);
    expect(isCrisisText('i want to skill myself up in guitar')).toBe(false);
    // A spelled-out negation stays a non-match: the collapsed token
    // "idontwanttodie" whole-token-matches no stripped phrase.
    expect(isCrisisText('d o n t w a n t t o d i e')).toBe(false);
  });
});

describe('abuse tier (#1979) — fires AND routes to the DV resources', () => {
  it.each(ABUSE_RISK)('fires as an abuse-tier crisis on %j', (text) => {
    const a = assessCrisis(text);
    expect(a.crisis).toBe(true);
    expect(a.abuse).toBe(true);
  });

  it('the exact ticket regressions no longer read as a breakup playlist', () => {
    // Before the fix these returned songs (heartbreak) or unclear. Now crisis.
    for (const t of ['he hurts me', 'my mom hurts me', 'he is hurting me', 'im scared he will hurt me']) {
      expect(isCrisisText(t)).toBe(true);
    }
  });

  it('ideation stays ideation — no DV misfire on self-directed risk', () => {
    for (const t of ['i want to kill myself', 'i want to die', 'there is no reason to live']) {
      const a = assessCrisis(t);
      expect(a.crisis).toBe(true);
      expect(a.abuse).toBe(false);
    }
  });

  it('a harm verb needs a human subject — ordinary fan speech does not fire', () => {
    expect(assessCrisis('this song hits me').abuse).toBe(false);
    expect(assessCrisis('this song hits me').crisis).toBe(false);
    expect(isCrisisText('it hurts me that he forgot')).toBe(false);
    expect(isCrisisText('he beats me at chess every time')).toBe(false);
    expect(isCrisisText('he hits me up every day')).toBe(false);
  });

  it('a non-human subject directly before the verb owns it, whoever else is nearby', () => {
    // "he" sits inside the 6-word window, but grammar says "it" is the subject.
    expect(isCrisisText('he cheated on me and it hurts me so bad')).toBe(false);
    // With the person as the subject the same verb is a disclosure again.
    expect(assessCrisis('he hurts me so bad').abuse).toBe(true);
  });

  it('figurative fan-speech frames clear a gated verb, but only unmistakable ones', () => {
    expect(isCrisisText('she hits me with the feels every time')).toBe(false);
    expect(isCrisisText('the way he sings hurts me in the best way')).toBe(false);
    // No figurative frame → still a disclosure.
    expect(assessCrisis('she hits me when she is angry').abuse).toBe(true);
    expect(assessCrisis('he hits me with a belt').abuse).toBe(true);
  });

  it('"beats me to X" clears as an idiom except the violent completion', () => {
    expect(isCrisisText('my boss beats me to the office every day')).toBe(false);
    expect(assessCrisis('he beats me to a pulp').abuse).toBe(true);
  });

  it('"chokes me up" is fan speech; "chokes me" with a human subject is not', () => {
    expect(isCrisisText('this song chokes me up')).toBe(false);
    expect(assessCrisis('he chokes me').abuse).toBe(true);
    // "up" after the human-subject form clears too — "he chokes me up" is the
    // emotional sense even with a person as the subject.
    expect(isCrisisText('he chokes me up with that speech')).toBe(false);
  });
});

describe('the DV resource line (#1979)', () => {
  it('the abuse message leads with the National DV Hotline specifics', () => {
    const joined = CRISIS_MESSAGE_ABUSE.join(' ');
    expect(joined).toContain('1-800-799-7233');
    expect(joined).toContain('START to 88788');
    // DV resources come before the general suicide line in the abuse message.
    const dvAt = CRISIS_MESSAGE_ABUSE.indexOf(DV_RESOURCE_LINE);
    const line988 = CRISIS_MESSAGE_ABUSE.findIndex((l) => l.includes('988'));
    expect(dvAt).toBeGreaterThanOrEqual(0);
    expect(dvAt).toBeLessThan(line988);
  });

  it('the ideation message is unchanged — no DV line, keeps 988/741741', () => {
    const joined = CRISIS_MESSAGE.join(' ');
    expect(joined).not.toContain('1-800-799-7233');
    expect(joined).toContain('988');
    expect(joined).toContain('741741');
  });
});

describe('guarded ideation (#1980) clears on the benign completion', () => {
  it('"want to end it" fires, "end it with him" does not', () => {
    expect(isCrisisText('I want to end it')).toBe(true);
    expect(isCrisisText('I want to end it with him')).toBe(false);
    expect(isCrisisText('I want to end it all')).toBe(true);
  });

  it('"kill me" hyperbole is deliberately never a crisis', () => {
    // On the red-team list, intentionally omitted (see the note in mood-safety).
    expect(isCrisisText('kill me now, my alarm did not go off')).toBe(false);
    expect(isCrisisText('ugh kill me')).toBe(false);
    // But the DIRECTED threat form is caught by the abuse tier.
    expect(assessCrisis('he threatens to kill me').abuse).toBe(true);
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
