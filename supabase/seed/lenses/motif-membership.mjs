// Seed data for the LongLive Lens datasets — MOTIF_MEMBERSHIP.
// Extracted from the pre-split packages/experience/src/lenses.ts monolith
// (R12 redo against the OS-021 packages/experience/src layout). Source of
// truth for which EGG_NODES id belongs to which MOTIFS trail — every egg
// node must appear in exactly one trail here (scripts/validate-content.mjs
// enforces this; the historical dev-only console.error guard in lenses.ts
// only caught it at runtime in development, which review flagged as a real
// gap — this seed file plus the validator invariant closes it at
// `npm run validate:content` time instead).
export const MOTIF_MEMBERSHIP = {
  'number-13': ['egg-13-debut', 'egg-13-video-1989', 'egg-13-tracks-midnights'],
  'hidden-messages': ['egg-capitals-debut', 'egg-capitals-fearless', 'egg-fearless-tv-scramble', 'egg-wood-track-tloas'],
  'the-snake': ['egg-snake-instagram', 'egg-snake-lwymmd', 'egg-snake-me-mv'],
  'color-coding': ['egg-red-burning', 'egg-color-daylight', 'egg-string-willow', 'egg-karma-album-theory'],
  'clocks-countdowns': [
    'egg-clock-lastkiss',
    'egg-midnights-vinyl-clock',
    'egg-grammys-two-fingers',
    'egg-ttpd-timetable-clock',
    'egg-ttpd-anthology-drop',
  ],
  'doors-rooms': [
    'egg-loverhouse-mv',
    'egg-cabin-folklore',
    'egg-eras-burning-house',
    'egg-tloas-orange-doors',
    'egg-tloas-album-drop',
  ],
  'the-rerecordings': [
    'egg-man-graffiti',
    'egg-red-tv-rings',
    'egg-bejeweled-elevator',
    'egg-rep-tv-clue-bejeweled',
    'egg-speaknow-tv-nashville',
    'egg-1989-tv-la',
  ],
};
