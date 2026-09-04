// ── Motif trails (the Clue Web mini-app) ────────────────────────────────────
// Trails are the *guided* way into the Clue Web: each groups related eggs into
// a readable story. EGG_LINKS remain the cross-trail connections drawn on the
// exploratory constellation map. Every node belongs to exactly one trail.
//
// Adding an egg? Add it to EGG_NODES and to exactly one trail in
// MOTIF_MEMBERSHIP below. The dev guard at the bottom fails loudly if a node is
// left unclassified — that is what keeps new content consistent.

export const MOTIFS = [
  {
    id: 'number-13',
    label: 'The Number 13',
    icon: 'Hash',
    blurb: 'Her lucky number, hidden in dates, teasers, and track counts since day one.',
  },
  {
    id: 'hidden-messages',
    label: 'Hidden Messages',
    icon: 'Type',
    blurb: 'Secret capital letters and coded liner notes that trained fans to decode everything.',
  },
  {
    id: 'the-snake',
    label: 'The Snake',
    icon: 'Spline',
    blurb: 'An insult reclaimed as armor in reputation, then shed for butterflies in Lover.',
  },
  {
    id: 'color-coding',
    label: 'Color Coding',
    icon: 'Palette',
    blurb: 'Colors that forecast an era and pay off seasons — sometimes years — later.',
  },
  {
    id: 'clocks-countdowns',
    label: 'Clocks & Countdowns',
    icon: 'Clock',
    blurb: 'Timestamps and reveal timers pointing at one specific hour.',
  },
  {
    id: 'doors-rooms',
    label: 'Doors & Rooms',
    icon: 'DoorOpen',
    blurb: 'The Lover house, the folklore cabin, and the orange doors of a new era.',
  },
  {
    id: 'the-rerecordings',
    label: 'The Re-Recordings',
    icon: 'RefreshCw',
    blurb: 'Breadcrumbs that mapped the order of the Taylor’s Version rollout.',
  },
];
