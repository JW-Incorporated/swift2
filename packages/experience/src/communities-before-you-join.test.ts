import { describe, expect, it } from 'vitest';
import { aiTellHits, emDashCount } from '@swift2/shared';
import { BEFORE_YOU_JOIN } from './communities-before-you-join';
import { COMMUNITIES } from './communities';

/**
 * Editor-voice phrasing that must never reach a fan: research-pass field
 * names, instructions to curators, and references to "this list/file".
 */
const INTERNAL_PHRASING: readonly RegExp[] = [
  /\b[a-z]+_[a-z_]+\b/, // snake_case field names: activity_level, verification_level, presence_count
  /invite (API|code)/i,
  /\bvanity\b/i,
  /re-?verif/i,
  /re-?check/i,
  /before (publishing|recommending|pointing)/i,
  /\bflag (this|for|before)\b/i,
  /\b(this|the) (list|file|research|dataset)\b/i,
  /\b(users|curators?|orchestrator)\b/i,
  /\bper (Wikipedia|the citing source)\b/i,
  /presence ratio/i,
  /\bguild\b/i,
];

const fanFacingTexts = COMMUNITIES.flatMap((c) =>
  [c.name, c.niche, c.description, ...c.beforeYouJoin].map((text) => ({ community: c.name, text })),
);

describe('BEFORE_YOU_JOIN', () => {
  it('has an explicit entry for every community, and no orphans', () => {
    const names = new Set(COMMUNITIES.map((c) => c.name));
    expect(Object.keys(BEFORE_YOU_JOIN).sort()).toEqual([...names].sort());
  });

  it('is what the card receives, never the internal curation notes', () => {
    for (const c of COMMUNITIES) {
      expect(c.beforeYouJoin).toBe(BEFORE_YOU_JOIN[c.name]);
      for (const note of c.curationNotes) expect(c.beforeYouJoin).not.toContain(note);
    }
  });

  it('is short, house voice, no em dashes', () => {
    for (const [name, notes] of Object.entries(BEFORE_YOU_JOIN)) {
      for (const note of notes) {
        expect(emDashCount(note), `${name}: ${note}`).toBe(0);
        expect(note.includes('--'), `${name}: ${note}`).toBe(false);
        expect(aiTellHits(note, 'voice'), `${name}: ${note}`).toEqual([]);
        expect(note.length, `${name}: ${note}`).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('fan-facing community copy', () => {
  it.each(INTERNAL_PHRASING.map((re) => [re.source, re] as const))('never contains internal phrasing /%s/', (_s, re) => {
    const hits = fanFacingTexts.filter(({ text }) => re.test(text));
    expect(hits).toEqual([]);
  });

  it('catches the phrasing that shipped to production (guard self-test)', () => {
    const shipped = [
      'Utility/alert server, not really a discussion community -- flag this distinction to users expecting a hangout.',
      'Check before publishing and re-verify periodically.',
      'treat activity_level as a soft signal, not a guarantee.',
      'High verification_level (4) on the guild suggests phone-verification is required',
      'Invite code found in search (qfxP85uSYb) is a random, non-vanity code',
    ];
    for (const text of shipped) expect(INTERNAL_PHRASING.some((re) => re.test(text)), text).toBe(true);
  });
});
