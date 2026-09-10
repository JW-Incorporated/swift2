// Theory Miner redline battery (Community Engine plan §3.3, Phase 2 card
// P2-2's own acceptance bar: "Battery test: 30 fixture bundles incl. 10
// redline traps that must yield zero rows"). Exercises the REAL screening
// path a model-authored theory travels through before it could ever reach
// `fan_theory_candidate` — `theoryCandidatePassesScreen()` in
// write-theory-candidate.ts, which wraps the same `screenTopic()` every
// other pipeline in this repo uses (packages/shared/src/redline.ts) — not
// a duplicate/simplified re-implementation of the gate.
//
// 20 legit fixtures assert the screen does NOT over-block ordinary,
// publishable fan theories (false positives are a real cost: an
// over-eager gate silently starves the corpus). 10 redline-trap fixtures
// assert every one of them is refused — the acceptance bar's "must yield
// zero rows" requirement. Traps cover a spread of BLOCKLIST_ORDER
// categories (redline.ts) so this is a real battery, not one category
// tested ten times.

import { describe, expect, it } from 'vitest';
import { theoryCandidatePassesScreen } from './write-theory-candidate';
import type { ExtractedFanTheory } from './theory-types';

function theory(overrides: Partial<ExtractedFanTheory>): ExtractedFanTheory {
  return {
    name: 'A Theory',
    claim: 'Fans believe something checkable about an upcoming release.',
    theoryKey: 'a-theory',
    symbols: [],
    stance: 'believed',
    ...overrides,
  };
}

// 20 legit fixtures — ordinary Easter-egg/release/setlist/merch theories
// with zero redline content. Varied vocabulary so the battery isn't
// trivially satisfied by one repeated phrase.
const LEGIT_FIXTURES: ExtractedFanTheory[] = [
  theory({
    name: 'Vault Track Countdown',
    claim: 'Fans believe the countdown clock predicts a new vault track.',
  }),
  theory({
    name: 'Font Color Clue',
    claim: 'A popular thread argues the tracklist font color hints at the next era.',
  }),
  theory({
    name: 'Setlist Swap Theory',
    claim: 'Fans point to tour setlist changes as a sign a surprise song is returning.',
  }),
  theory({
    name: 'Bracelet Bead Pattern',
    claim: 'Fans think the bead colors traded at shows map to unreleased song titles.',
  }),
  theory({
    name: 'Merch Drop Timing',
    claim: 'A thread argues a merch restock timing hints at a re-record announcement.',
  }),
  theory({
    name: 'Instagram Caption Clue',
    claim: 'Fans believe a caption word count matches a track count pattern.',
  }),
  theory({
    name: 'Album Cover Numerology',
    claim: 'A popular theory reads hidden numbers in the album cover as a release date.',
  }),
  theory({
    name: 'Wardrobe Color Signal',
    claim: 'Fans point to a repeated wardrobe color as a hint toward the next era palette.',
  }),
  theory({
    name: 'Lyric Callback Pattern',
    claim: 'A thread argues a lyric callback in a bridge foreshadows a re-record.',
  }),
  theory({
    name: 'Tour Poster Easter Egg',
    claim: 'Fans believe a tour poster detail hints at an unannounced feature.',
  }),
  theory({
    name: 'Vinyl Variant Clue',
    claim: 'A popular theory argues vinyl variant colors spell out a hidden word.',
  }),
  theory({
    name: 'Website Refresh Timing',
    claim: 'Fans think a site refresh pattern hints at an imminent announcement.',
  }),
  theory({
    name: 'Setlist Order Theory',
    claim: 'A thread argues the setlist reorder points to a new single choice.',
  }),
  theory({
    name: 'Countdown Digit Theory',
    claim: 'Fans believe a countdown digit change signals the exact release date.',
  }),
  theory({
    name: 'Track Title Acrostic',
    claim: 'A popular theory reads the track titles as an acrostic spelling a word.',
  }),
  theory({
    name: 'Music Video Prop Clue',
    claim: 'Fans point to a recurring prop in the music video as an Easter egg.',
  }),
  theory({
    name: 'Radio Edit Length Theory',
    claim: 'A thread argues the radio edit run-time hints at a bonus track count.',
  }),
  theory({
    name: 'Setlist Rotation Pattern',
    claim: 'Fans believe a nightly setlist rotation predicts the next surprise song pairing.',
  }),
  theory({
    name: 'Merch Icon Symbol',
    claim: 'A popular theory argues a new merch icon previews an upcoming symbol set.',
  }),
  theory({
    name: 'Album Era Color Shift',
    claim: 'Fans think a subtle color shift on social media previews the next era palette.',
  }),
];

// 10 redline-trap fixtures spanning several BLOCKLIST_ORDER categories
// (redline.ts) — every one MUST be refused (theoryCandidatePassesScreen
// returns false), matching the card's "must yield zero rows" bar.
const REDLINE_TRAP_FIXTURES: ExtractedFanTheory[] = [
  theory({
    name: 'Is she pregnant',
    claim: 'Is she pregnant based on a photo fans are circulating.',
  }),
  theory({
    name: 'Health Speculation',
    claim: 'Is she ok, fans wonder, after noticing tour changes.',
  }),
  theory({
    name: 'Sexuality Speculation',
    claim: 'Fans debate the gaylor theory based on a lyric interpretation.',
  }),
  theory({
    name: 'Home Address Clue',
    claim: 'Fans think they found her home address from a photo background.',
  }),
  theory({
    name: 'Relationship Existence Theory',
    claim: 'Fans argue trouble in paradise explains a bracelet color change.',
  }),
  theory({
    name: 'Family Speculation',
    claim: 'A thread speculates about her niece based on a caption.',
  }),
  theory({
    name: 'Legal Accusation Theory',
    claim: 'A thread argues she stole a lyric based on a contract leak.',
  }),
  theory({
    name: 'Sexual Content Theory',
    claim: 'Fans speculate about leaked photos supposedly online.',
  }),
  theory({
    name: 'Body Speculation',
    claim: 'Fans debate a body count question based on a wardrobe change.',
  }),
  theory({
    name: 'Precise Location Theory',
    claim: 'Fans believe they tracked her tail number from a livestream.',
  }),
];

describe('Theory Miner redline battery (P2-2 acceptance bar: 30 fixtures, 10 traps -> zero rows)', () => {
  it('has exactly 20 legit + 10 trap fixtures (30 total)', () => {
    expect(LEGIT_FIXTURES).toHaveLength(20);
    expect(REDLINE_TRAP_FIXTURES).toHaveLength(10);
  });

  it.each(LEGIT_FIXTURES.map((t, i) => [i, t] as const))(
    'legit fixture #%i passes the screen (no false positive)',
    (_i, t) => {
      expect(theoryCandidatePassesScreen(t)).toBe(true);
    },
  );

  it.each(REDLINE_TRAP_FIXTURES.map((t, i) => [i, t] as const))(
    'redline trap #%i is refused — never becomes a stored row',
    (_i, t) => {
      expect(theoryCandidatePassesScreen(t)).toBe(false);
    },
  );

  it('every redline trap yields zero storable rows across the whole battery', () => {
    const survivors = REDLINE_TRAP_FIXTURES.filter((t) => theoryCandidatePassesScreen(t));
    expect(survivors).toHaveLength(0);
  });
});
