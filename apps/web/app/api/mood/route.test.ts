import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';
import { MOOD_STARTERS } from '../../../lib/longlive/mood-starters';
import { BEREAVEMENT_SLUGS } from '@swift2/experience';
import '../../../lib/longlive/vault-wiring';
import { MOOD_BATTERY } from '../../../lib/longlive/mood-battery';

// Post JSON to the route with a chosen client IP so the per-IP rate limiter
// doesn't bleed between unrelated cases.
function post(body: unknown, ip = '10.0.0.1'): Promise<Response> {
  return POST(
    new Request('http://localhost/api/mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  // No key → the route uses the deterministic keyword fallback, so these tests
  // never touch the network and stay fully deterministic.
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/mood', () => {
  it('chip path: a hand-tuned vector returns real songs, no model needed', async () => {
    const res = await post({ moods: { heartbreak: 0.9, anger: 0.7 } }, '10.1.0.1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('chip');
    expect(json.picks.length).toBeGreaterThan(0);
    expect(typeof json.picks[0].slug).toBe('string');
  });

  it('crisis text returns resources and NO songs', async () => {
    const res = await post({ text: 'i want to die' }, '10.1.0.2');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    expect(json.message.join(' ')).toContain('988');
  });

  it('abuse disclosure returns the DV hotline, not just the suicide line (#1979)', async () => {
    const res = await post({ text: 'my boyfriend hits me' }, '10.1.0.20');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    const joined = json.message.join(' ');
    expect(joined).toContain('1-800-799-7233');
    expect(joined).toContain('START to 88788');
  });

  it('"he hurts me" no longer returns a breakup playlist (#1979)', async () => {
    const res = await post({ text: 'he hurts me' }, '10.1.0.21');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.picks).toBeUndefined();
    expect(json.message.join(' ')).toContain('1-800-799-7233');
  });

  it('self-directed ideation keeps the 988 message, no DV line (#1980)', async () => {
    const res = await post({ text: 'there is no reason to live' }, '10.1.0.22');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    const joined = json.message.join(' ');
    expect(joined).toContain('988');
    expect(joined).not.toContain('1-800-799-7233');
  });

  it('obfuscated crisis spellings still get resources end to end (hardening follow-up)', async () => {
    for (const [i, text] of ['k1ll myself', 'ｉ ｗａｎｔ ｔｏ ｄｉｅ', 'i want to unalive myself'].entries()) {
      const res = await post({ text }, `10.1.0.4${i}`);
      const json = await res.json();
      expect(json.kind).toBe('crisis');
      expect(json.picks).toBeUndefined();
      expect(json.message.join(' ')).toContain('988');
    }
  });

  it('fan speech with a harm verb still reaches songs, not the DV path (hardening follow-up)', async () => {
    const res = await post({ text: 'this song chokes me up, im crying' }, '10.1.0.50');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('hyperbole returns songs instead of dead-ending in unclear (#1981)', async () => {
    for (const [i, text] of ['this is killing me', "I'm dying to see the Eras tour"].entries()) {
      const res = await post({ text }, `10.1.0.3${i}`);
      const json = await res.json();
      expect(json.kind).toBe('matches');
      expect(json.picks.length).toBeGreaterThan(0);
    }
  });

  it('free text with no key falls back to keyword matcher and still returns songs', async () => {
    const res = await post({ text: 'heartbroken and angry, he betrayed me' }, '10.1.0.3');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('keyword');
    expect(json.degraded).toBe(true);
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('adds the heavy intro for genuinely sad input', async () => {
    const res = await post({ text: 'so heartbroken and lonely, just crying' }, '10.1.0.4');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.intro).toBeTruthy();
    expect(json.intro).toContain('heavy');
  });

  // "We couldn't read a feeling here" and "this is out of scope" are DIFFERENT
  // facts, and the route used to answer both with Block 6. On the degraded
  // (no-API-key) path that meant any wording the keyword lexicon missed was
  // told it was outside what the bot can help with — including "I'm sad".
  // Block 6 is now reachable only via the classifier's out_of_scope flag.
  it('unrecognised text gets the say-more nudge, not a refusal', async () => {
    const res = await post({ text: 'what is the capital of France' }, '10.1.0.5');
    const json = await res.json();
    expect(json.kind).toBe('unclear');
    expect(json.message).not.toContain('outside what I can help with');
  });

  it('ordinary negative feeling reaches songs on the degraded path', async () => {
    // The founder's sentence, end to end, with no ANTHROPIC_API_KEY set.
    const res = await post(
      { text: "I'm grumpy and everything is pissing me off" },
      '10.1.0.11',
    );
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.source).toBe('keyword');
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('plain sadness reaches songs rather than a refusal', async () => {
    const res = await post({ text: 'im sad' }, '10.1.0.12');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.picks.length).toBeGreaterThan(0);
  });

  it('rejects empty text', async () => {
    const res = await post({ text: '   ' }, '10.1.0.6');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid JSON body', async () => {
    const res = await POST(
      new Request('http://localhost/api/mood', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.0.7' },
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rate-limits a bursting IP', async () => {
    const ip = '10.9.9.9';
    let sawLimit = false;
    for (let i = 0; i < 20; i++) {
      const res = await post({ text: 'happy and excited' }, ip);
      if (res.status === 429) sawLimit = true;
    }
    expect(sawLimit).toBe(true);
  });

  // #1984 — the grief-canon gate, end to end. Ordinary sadness must reach songs
  // but never a bereavement song; a genuine bereavement must reach them.
  it('"I feel numb" returns songs but never the grief canon (#1984)', async () => {
    const res = await post({ text: 'I feel numb' }, '10.2.0.1');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.picks.length).toBeGreaterThan(0);
    for (const p of json.picks) expect(BEREAVEMENT_SLUGS.has(p.slug)).toBe(false);
  });

  it('an explicit bereavement reaches the grief songs (#1984)', async () => {
    const res = await post({ text: 'my grandma just died' }, '10.2.0.2');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.picks.some((p: { slug: string }) => BEREAVEMENT_SLUGS.has(p.slug))).toBe(true);
  });

  // #2000 — the "sitting with something heavy?" wellness intro was showing on
  // FUN chips. It must show only for genuinely heavy moods.
  it('the "feral about a bridge" FUN chip gets NO heavy intro (#2000)', async () => {
    const s = MOOD_STARTERS.find((x) => x.label === 'feral about a bridge')!;
    const res = await post({ moods: s.moods, energy: s.energy, valence: s.valence }, '10.2.0.3');
    const json = await res.json();
    expect(json.kind).toBe('matches');
    expect(json.intro).toBeFalsy();
  });

  it('the "cardigan weather" (cozy) chip gets NO heavy intro (#2000)', async () => {
    const s = MOOD_STARTERS.find((x) => x.label === 'cardigan weather')!;
    const res = await post({ moods: s.moods, energy: s.energy, valence: s.valence }, '10.2.0.4');
    const json = await res.json();
    expect(json.intro).toBeFalsy();
  });

  it('a genuinely heavy chip still gets the heavy intro (#2000)', async () => {
    const s = MOOD_STARTERS.find((x) => x.label === 'someone said "we need to talk"')!;
    const res = await post({ moods: s.moods, energy: s.energy, valence: s.valence }, '10.2.0.5');
    const json = await res.json();
    expect(json.intro).toBeTruthy();
    expect(json.intro).toContain('heavy');
  });

  // HARD CONSTRAINT regression: the crisis/abuse battery (#2002) must still fire
  // ahead of any scoring. These changes sit downstream of the crisis check; if a
  // crisis input ever reached the matcher this would go red.
  it('the crisis / abuse battery still fires — no crisis input reaches songs', async () => {
    const battery: Array<[string, 'crisis']> = [
      ['i want to die', 'crisis'],
      ['I want to end my life', 'crisis'],
      ['there is no reason to live', 'crisis'],
      ['nobody would notice if I was gone', 'crisis'],
      ['I took all the pills', 'crisis'],
      ['my boyfriend hits me', 'crisis'],
      ['he hurts me', 'crisis'],
      ['my dad abuses me', 'crisis'],
      ['he threatens to kill me', 'crisis'],
    ];
    for (const [i, [text]] of battery.entries()) {
      const res = await post({ text }, `10.3.0.${i}`);
      const json = await res.json();
      expect(json.kind, `crisis must fire for: ${text}`).toBe('crisis');
      expect(json.picks).toBeUndefined();
    }
  });

  it('the abuse tier still leads with the DV hotline after the changes (#2002)', async () => {
    const res = await post({ text: 'my partner is violent' }, '10.3.1.0');
    const json = await res.json();
    expect(json.kind).toBe('crisis');
    expect(json.message.join(' ')).toContain('1-800-799-7233');
  });

  // fix-mood-over-refusal — the 10-case acceptance battery (mood-battery.ts),
  // asserted here on the KEY-FREE / keyword-fallback path. The live battery
  // (scripts/check-mood-battery.mjs) asserts the same list against the model.
  describe('acceptance battery (key-free path)', () => {
    const matchesCases = MOOD_BATTERY.filter((c) => c.expectedKind === 'matches');
    const refusalCases = MOOD_BATTERY.filter((c) => c.expectedKind === 'refusal');

    it.each(matchesCases)('case $id "$text" reaches songs, not a refusal', async (c) => {
      const res = await post({ text: c.text }, `10.4.0.${c.id}`);
      const json = await res.json();
      expect(json.kind).toBe('matches');
      expect(json.picks.length).toBeGreaterThan(0);
    });

    // Cases 8–9 are the model's out_of_scope judgment (a coding request, a
    // prompt-injection attempt) — only the classifier sets that flag; the
    // keyword fallback has no notion of "not a feeling", it just finds no
    // axis words and returns UNCLEAR. `refusal` is the model-path expectation,
    // covered by the live battery against the real API.
    it.each(refusalCases)('case $id "$text" is unclear (not refusal) on the keyword path', async (c) => {
      const res = await post({ text: c.text }, `10.4.1.${c.id}`);
      const json = await res.json();
      expect(json.kind).toBe('unclear');
    });

    // Case 10 caught a LIVE self-harm detection hole, now fixed in this PR.
    // assessCrisis() listed the Tier A phrase "hurt myself" but not its
    // progressive form "hurting myself". `phraseHits` appends inflections to
    // the END of the whole phrase ("hurt myselfing"), so the progressive never
    // matched, and "I've been thinking about hurting myself" fell through to
    // the keyword matcher — whose `heartbreak` axis the word "hurting" happens
    // to hit — returning a SONG instead of crisis resources. It failed on both
    // the model and keyword paths, because assessCrisis runs before either.
    // This assertion is now the regression lock. It must never be weakened to
    // `it.fails` or `.skip` again: if it goes red, crisis detection is broken.
    it('case 10 "I\'ve been thinking about hurting myself" reaches crisis resources', async () => {
      const case10 = MOOD_BATTERY.find((c) => c.id === 10)!;
      const res = await post({ text: case10.text }, '10.4.2.10');
      const json = await res.json();
      expect(json.kind).toBe('crisis');
    });
  });
});
