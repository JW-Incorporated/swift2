import type { GlossaryEntry } from './types';

/**
 * The app's own vocabulary, defined so nothing in the UI is assumed knowledge
 * (audit §E.10 / T7). These are hand-authored UI/navigation definitions — how
 * THIS experience uses each word — not sourced Swiftie lore, so they carry no
 * citations. Fan-culture terms ("vault track", "surprise song") are defined
 * only as far as the app uses them.
 *
 * Keep `id`s stable: they are see-also link targets, search-result targets,
 * and scroll anchors in the Glossary drawer. Display order is alphabetical
 * (sorted at the bottom of this file), so authoring order is not significant.
 */
const ENTRIES: GlossaryEntry[] = [
  {
    id: 'era',
    term: 'Era',
    definition:
      'One chapter of the story, anchored to an album — its own colors, typography, and mood. Eras mode scrolls through them newest to oldest, and every moment, egg, and thread point belongs to one.',
    example: 'Scrolling past the folklore era turns the whole app grayscale-cottage-quiet.',
    seeAlso: ['moment', 'eras-mode'],
  },
  {
    id: 'eras-mode',
    term: 'Eras mode',
    definition:
      'The main view: a chronological stream of eras you scroll through like a timeline, with the top bar and theming following whichever era is on screen.',
    seeAlso: ['era', 'threads-mode', 'timeline-scrubber'],
  },
  {
    id: 'moment',
    term: 'Moment',
    definition:
      'A single dated card inside an era — a release, a look, a piece of lore. Tapping one opens the full story with sources; visited moments are remembered on your device.',
    example: '"The interrupted speech" is a Lore moment in the Fearless era.',
    seeAlso: ['era', 'hidden-clue'],
  },
  {
    id: 'thread',
    term: 'Thread',
    definition:
      'A storyline followed across every era at once instead of era by era — like Love Story, Fashion, or Taylor’s Version. Threads mode lays each one out on a single timeline.',
    example: 'The Fashion thread jumps from cowboy boots to bodysuits in one scroll.',
    seeAlso: ['threads-mode', 'crossing'],
  },
  {
    id: 'threads-mode',
    term: 'Threads mode',
    definition:
      'The second view (the gold-on-charcoal "vault" look): a gallery of threads that each cut across all the eras, for when you want one storyline instead of the whole timeline.',
    seeAlso: ['thread', 'eras-mode'],
  },
  {
    id: 'crossing',
    term: 'Crossing',
    definition:
      'A point where two threads touch the same stretch of time — shown as an overlay that puts both threads on one shared axis so you can see the overlap.',
    example: 'Love Story and Fashion cross where a relationship era and a signature look coincide.',
    seeAlso: ['thread'],
  },
  {
    id: 'clue-web',
    term: 'Clue Web',
    definition:
      'The Easter-egg constellation inside the Easter Eggs thread: every documented clue and payoff as connected stars, grouped into motif trails you can walk one by one.',
    seeAlso: ['motif-trail', 'easter-egg', 'clue-payoff'],
  },
  {
    id: 'motif-trail',
    term: 'Motif trail',
    definition:
      'A guided path through the Clue Web following one recurring motif — the number 13, the snake, hidden messages — from its first appearance to its latest payoff.',
    example: 'The Snake trail runs from the 2016 feud fallout to the reputation era’s serpent imagery.',
    seeAlso: ['clue-web', 'easter-egg'],
  },
  {
    id: 'easter-egg',
    term: 'Easter egg',
    definition:
      'A deliberate hidden hint — in a video, an outfit, a caption, liner notes — planted for fans to decode. In this app, eggs marked confirmed were acknowledged by Taylor or her team; the rest are labeled fan theory.',
    seeAlso: ['clue-web', 'clue-payoff', 'theory'],
  },
  {
    id: 'clue-payoff',
    term: 'Clue → payoff',
    definition:
      'The two ends of an Easter egg: the clue is the moment it was planted, the payoff is the later moment it turned out to point at. The Hidden Clues thread lets you reveal payoffs one pair at a time.',
    example: 'A 2019 butterfly mural (clue) pointed at the Lover announcement days later (payoff).',
    seeAlso: ['easter-egg', 'hidden-clue'],
  },
  {
    id: 'hidden-clue',
    term: 'Hidden clue',
    definition:
      'The shimmer treatment on some moment cards: a clue that was hiding inside that moment, with a tap-to-reveal payoff showing what it later meant.',
    seeAlso: ['clue-payoff', 'moment'],
  },
  {
    id: 'theory',
    term: 'Theory',
    definition:
      'A fan belief about what something means. Every theory here carries two badges — confidence (how well-supported it is) and outcome (confirmed, debunked, or still pending) — so speculation never reads as fact.',
    seeAlso: ['confidence', 'easter-egg'],
  },
  {
    id: 'confidence',
    term: 'Confidence badge',
    definition:
      'The label showing how well-supported a claim is, from Official (stated by Taylor or her team) down through Reported and Fan consensus to Clowning (fans joyfully over-reading). No badge means established fact.',
    seeAlso: ['theory'],
  },
  {
    id: 'taylors-version',
    term: 'Taylor’s Version',
    definition:
      'A re-recording of one of the first six albums, made so Taylor owns the new master recordings. Marked "(Taylor’s Version)" on the album title; the Taylor’s Version thread tracks each album’s reclaiming.',
    seeAlso: ['re-recording', 'vault-track'],
  },
  {
    id: 're-recording',
    term: 'Re-recording',
    definition:
      'The project behind Taylor’s Version: re-recording early albums after the original master tapes were sold, so the versions fans stream are ones she owns.',
    seeAlso: ['taylors-version'],
  },
  {
    id: 'vault-track',
    term: 'Vault track',
    definition:
      'A song written for one of the original albums but left off it, released for the first time on that album’s Taylor’s Version — "From the Vault." This app borrows the vault metaphor for its whole archive.',
    example: '"All Too Well (10 Minute Version)" arrived from the Red vault.',
    seeAlso: ['taylors-version', 'track-guide'],
  },
  {
    id: 'surprise-song',
    term: 'Surprise song',
    definition:
      'A song outside the fixed setlist, played once per show on tour (often acoustic). Fans track which songs have and haven’t been played — a live-show cousin of the Easter egg.',
    seeAlso: ['easter-egg'],
  },
  {
    id: 'track-guide',
    term: 'Track guide',
    definition:
      'The per-album song list opened from an era: each track with a short sourced note — the meaning, the background, or the Easter egg. Only songs with a real source appear.',
    seeAlso: ['vault-track', 'era'],
  },
  {
    id: 'timeline-scrubber',
    term: 'Timeline scrubber',
    definition:
      'The thin strip at the very top in Eras mode — the whole career as one line. Drag it to jump straight to any era.',
    seeAlso: ['eras-mode'],
  },
];

/** All glossary entries, alphabetical by term (display order). */
export const GLOSSARY: GlossaryEntry[] = [...ENTRIES].sort((a, b) =>
  a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
);

const BY_ID = new Map(GLOSSARY.map((e) => [e.id, e]));

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return BY_ID.get(id);
}

// Dev-only guard: see-also links must resolve, ids must be unique. A broken
// link should fail loudly here instead of silently rendering nothing.
if (process.env.NODE_ENV !== 'production') {
  if (BY_ID.size !== GLOSSARY.length) {
    // eslint-disable-next-line no-console
    console.error('[v0] Glossary: duplicate entry ids');
  }
  for (const e of GLOSSARY) {
    for (const ref of e.seeAlso ?? []) {
      if (!BY_ID.has(ref)) {
        // eslint-disable-next-line no-console
        console.error(`[v0] Glossary: "${e.id}" has unresolvable seeAlso "${ref}"`);
      }
    }
  }
}
