import { describe, expect, it } from 'vitest';

import { keywordQuery, isEmptyQuery, hasBereavementSignal } from './mood-keywords';
import { matchMoods, BEREAVEMENT_SLUGS } from './mood-match';

/** Slugs of the top-N keyword matches for a raw message. */
function topSlugs(text: string, limit = 5): string[] {
  return matchMoods(keywordQuery(text), { limit }).map((p) => p.slug);
}

describe('keywordQuery', () => {
  it('asserts only the axes the words evoke', () => {
    const q = keywordQuery('heartbroken and furious after the breakup');
    expect(q.moods.heartbreak).toBeGreaterThan(0);
    expect(q.moods.anger).toBeGreaterThan(0);
    expect(q.moods.joy).toBeUndefined();
    expect(q.moods.calm).toBeUndefined();
  });

  it('infers low valence / energy from sad-and-quiet language', () => {
    const q = keywordQuery('lonely and sad, quiet 3am kind of feeling');
    expect(q.moods.longing).toBeGreaterThan(0);
    expect(q.valence).toBeLessThan(0.5);
    expect(q.energy).toBeLessThan(0.5);
  });

  it('infers high valence / energy from an upbeat message', () => {
    const q = keywordQuery('so happy and excited, dancing around the kitchen');
    expect(q.moods.joy).toBeGreaterThan(0);
    expect(q.valence).toBeGreaterThan(0.5);
    expect(q.energy).toBeGreaterThan(0.5);
  });

  it('returns an empty query for text with no mood signal', () => {
    const q = keywordQuery('what is the capital of France');
    expect(isEmptyQuery(q)).toBe(true);
  });

  it('degrades to REAL songs — the whole point of the fallback', () => {
    const q = keywordQuery('heartbroken and angry');
    const picks = matchMoods(q, { limit: 5 });
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect(typeof p.slug).toBe('string');
  });

  it('does not fire an axis on a substring of an unrelated word', () => {
    // "management" contains "anger" as a substring; whole-token matching must
    // not assert anger from it.
    const q = keywordQuery('thinking about project management today');
    expect(q.moods.anger).toBeUndefined();
  });

  // #1981 — hyperbole/idiom that the crisis suppressor clears used to dead-end
  // in UNCLEAR (no axis word, empty query, no songs). It must now seed a
  // sensible default vector and return real songs.
  describe('hyperbole idioms seed a default mood and return songs (#1981)', () => {
    const EXCITED = [
      "I'm dying to see the Eras tour",
      'I am dying to see her live',
      'this bridge is to die for',
      'I want to die laughing at this',
    ];
    const ANXIOUS = [
      'this is killing me',
      'this wait is killing me',
      'I could die of embarrassment',
      'I want to die of embarrassment',
    ];

    it.each(EXCITED)('seeds joy and returns songs for %j', (text) => {
      const q = keywordQuery(text);
      expect(isEmptyQuery(q)).toBe(false);
      expect(q.moods.joy).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it.each(ANXIOUS)('seeds catharsis and returns songs for %j', (text) => {
      const q = keywordQuery(text);
      expect(isEmptyQuery(q)).toBe(false);
      expect(q.moods.catharsis).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('an idiom never overrides a real mood word already in the message', () => {
      // "heartbroken" hits an axis, so the idiom seed must not add joy on top.
      const q = keywordQuery('heartbroken, this is killing me');
      expect(q.moods.heartbreak).toBeGreaterThan(0);
      expect(q.moods.joy).toBeUndefined();
    });
  });

  // #1984 — the grief-canon must NOT surface for ordinary sadness/stress/numb,
  // but MUST for an explicit bereavement. keywordQuery drives both via the
  // bereavement flag; here we prove it end-to-end through the matcher.
  describe('grief canon is gated by an explicit bereavement signal (#1984)', () => {
    const ORDINARY = ['I feel numb', 'stressed about work', 'nervous about TS12', 'so sad today'];
    it.each(ORDINARY)('does NOT surface a grief song for %j', (text) => {
      const q = keywordQuery(text);
      expect(q.bereavement).toBeUndefined();
      for (const slug of topSlugs(text, 6)) expect(BEREAVEMENT_SLUGS.has(slug)).toBe(false);
    });

    const BEREAVEMENT = ['my grandma just died', 'grieving my dad', 'my mom passed away'];
    it.each(BEREAVEMENT)('flags bereavement and reaches the grief songs for %j', (text) => {
      const q = keywordQuery(text);
      expect(q.bereavement).toBe(true);
      expect(q.moods.heartbreak).toBeGreaterThan(0); // something to rank on
      expect(topSlugs(text, 6).some((s) => BEREAVEMENT_SLUGS.has(s))).toBe(true);
    });

    it('the breakup sense of "lost him/her" is NOT bereavement', () => {
      for (const t of ['I lost him', 'my ex left me', 'we broke up', 'heartbroken']) {
        expect(hasBereavementSignal(t)).toBe(false);
        expect(keywordQuery(t).bereavement).toBeUndefined();
      }
    });

    it('names a death/grief/illness as a bereavement signal', () => {
      for (const t of ['my grandma just died', 'grieving my dad', 'my mom passed away', 'her funeral is tomorrow', 'lost my best friend to cancer']) {
        expect(hasBereavementSignal(t)).toBe(true);
      }
    });

    // Hyperbole must not re-open the gate: English uses death for emphasis
    // constantly, and every one of these contains a bare bereavement keyword
    // ('death' / 'died'). None of them may unlock the grief canon — that would
    // be the #1984 failure reintroduced through an idiom.
    const FIGURATIVE = [
      'im sick to death of my ex',
      'i died laughing at that meme',
      'this album will be the death of me',
      'love him to death but he drives me crazy',
      'scared to death about my exam tomorrow',
      'worried to death about my mom',
      'bored to death at work',
    ];
    it.each(FIGURATIVE)('death-hyperbole %j is NOT bereavement and gets no grief song', (text) => {
      expect(hasBereavementSignal(text)).toBe(false);
      expect(keywordQuery(text).bereavement).toBeUndefined();
      for (const slug of topSlugs(text, 6)) expect(BEREAVEMENT_SLUGS.has(slug)).toBe(false);
    });

    it('genuine losses keep their signal through the frames we do NOT strip', () => {
      for (const t of ['dealing with the death of my father', 'we buried my dad last week and everything hurts']) {
        expect(hasBereavementSignal(t)).toBe(true);
        expect(keywordQuery(t).bereavement).toBe(true);
      }
    });

    it('"sick to death of my ex" still reads as a feeling (anger), not a blank', () => {
      const q = keywordQuery('im sick to death of my ex');
      expect(q.moods.anger).toBeGreaterThan(0);
    });
  });

  // #1999 — anticipation axis + the token-cancellation fix + fan vernacular.
  describe('anticipation and fan vernacular (#1999)', () => {
    it('"hyped … cannot sit still" reads as HIGH energy — "still" no longer cancels', () => {
      const q = keywordQuery('HYPED for the drop, cannot sit still');
      expect(q.energy).toBeGreaterThan(0.6);
      expect(q.moods.joy).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('anticipation vernacular returns songs, not an empty query', () => {
      for (const t of ['cannot wait for TS12', 'counting down to the drop', 'so hyped for the eras tour']) {
        const q = keywordQuery(t);
        expect(isEmptyQuery(q)).toBe(false);
        expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
      }
    });

    it('the #2000 nervous-about-TS12 example returns forward-looking picks, not the old alphabetical grief set', () => {
      const picks = topSlugs('kind of nervous about TS12 honestly, what if it flops');
      expect(picks[0]).toBe('long-live');
      expect(picks).not.toEqual(['clean', 'cruel-summer', 'dear-john', 'dont-blame-me', 'my-tears-ricochet']);
    });

    it('"reputation villain era" reads as defiance', () => {
      const q = keywordQuery('in my reputation villain era today');
      expect(q.moods.defiance).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('understands the remaining #1999 Swiftie idioms', () => {
      expect(keywordQuery('feeling completely delulu today').moods.catharsis).toBeGreaterThan(0);
      const club = keywordQuery('crying in the club');
      expect(club.moods.heartbreak).toBeGreaterThan(0);
      expect(club.moods.catharsis).toBeGreaterThan(0);
      expect(club.energy).toBeGreaterThan(0.6);
    });

    // Agitation support words count only INSIDE a hype context. Solo, they are
    // panic or insomnia, and rebranding those as celebration (joy + high
    // valence) would hand party songs to an anxious reader.
    it('agitation words alone are NOT anticipation — panic is not celebration', () => {
      for (const t of ['freaking out about my exam tomorrow', 'losing my mind over this deadline', 'so restless tonight, cant sleep']) {
        const q = keywordQuery(t);
        expect(q.moods.joy, t).toBeUndefined();
        expect(q.valence ?? 0, t).toBeLessThan(0.6);
      }
    });

    it('"i just want to sit still" is a wish for calm, not high energy', () => {
      const q = keywordQuery('i just want to sit still and breathe for a minute');
      expect(q.energy ?? 0).toBeLessThan(0.6);
    });

    it('negated sit-still forms still read as high energy inside a hype message', () => {
      const q = keywordQuery('could not sit still all day, so excited for ts12');
      expect(q.energy).toBeGreaterThan(0.6);
      expect(q.moods.joy).toBeGreaterThan(0);
    });
  });

  // #1988 — the everyday casual register that used to dead-end in UNCLEAR.
  describe('casual register (#1988)', () => {
    it.each(['meh', 'bored', 'idk', 'fine i guess'])('returns songs for %j', (text) => {
      expect(matchMoods(keywordQuery(text), { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('good news reads as joyful and upbeat', () => {
      const q = keywordQuery('I just got a promotion!!');
      expect(q.moods.joy).toBeGreaterThan(0);
      expect(q.valence ?? 0).toBeGreaterThan(0.6);
    });
  });

  // #1986 — breakup-script gaps: rumination/self-blame, "leaves you", and 1am.
  describe('breakup-script gaps (#1986)', () => {
    it('rumination / self-blame reads as heartbreak', () => {
      const q = keywordQuery('keep replaying everything I did wrong');
      expect(q.moods.heartbreak).toBeGreaterThan(0);
      expect(matchMoods(q, { limit: 5 }).length).toBeGreaterThan(0);
    });

    it('"1am" and "leaves you" now register (heartbreak, quiet)', () => {
      const q = keywordQuery('why does 1am hit different when someone leaves you');
      expect(q.moods.heartbreak).toBeGreaterThan(0);
      expect(q.energy).toBeLessThan(0.5); // 1am is a small-hours low-energy marker
    });
  });

  // #1985 — loneliness is not romantic desire, even though they share `longing`.
  describe('loneliness disambiguated from desire (#1985)', () => {
    it('"I just want to feel less alone" steers quiet/sad, not to the desire set', () => {
      const q = keywordQuery('I just want to feel less alone');
      expect(q.moods.longing).toBeGreaterThan(0);
      expect(q.energy ?? 1).toBeLessThan(0.5);
      expect(q.valence ?? 1).toBeLessThan(0.5);
      // The exact songs the ticket flagged (up-tempo wanting) must not lead.
      const slugs = topSlugs('I just want to feel less alone', 5);
      expect(slugs).not.toContain('cruel-summer');
      expect(slugs).not.toContain('dress');
    });
  });
});
