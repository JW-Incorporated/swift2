export const THREADS = [
  {
    id: 'the-proposal',
    title: 'End Game',
    kicker: 'It started with him asking',
    what: 'The tight end who invited her onto his podcast — and every sourced, dated step after it, from the first game to the ring in the garden.',
    // Joey's A1 pick (2026-08-13): End Game's card is Travis's face, so it can
    // never read as the same thread as Blank Spaces. Rehosted rather than
    // hotlinked because every other THREADS hero is a local file — same
    // Commons original already vetted for `rel-kelce` below and for the social
    // library (scripts/social/seed-library.mjs):
    // https://commons.wikimedia.org/wiki/File:Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5,_2023_-_P20230605AS-0902_(cropped).jpg
    // Public domain (a work of a US federal government employee). Fetched from
    // the 1280px thumb and downscaled to 1200px wide, q82 mozjpeg.
    hero: '/threads/end-game-travis-kelce.jpg',
    // Measured in the browser at the real phone geometry (350x262 card, the
    // 4:3 single-column case), not guessed. The text block is 246px of that
    // 262px card — but its top 48px is a transparent-to-opaque ramp, so the
    // strip where the photo actually reads is only the top ~60px. A centred
    // crop of a 1200x1576 portrait puts his scalp in that strip; this pushes
    // the face into it, and the face is legible at both 4:3 (phone) and 16:10
    // (desktop). Re-check this value if the card's aspect or copy length moves.
    heroPosition: '50% 36%',
    heroAlt: 'Travis Kelce, smiling, in a red jacket at the White House in 2023.',
    heroCredit: 'Adam Schultz / The White House · Public domain, via Wikimedia Commons',
    heroSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5,_2023_-_P20230605AS-0902_(cropped).jpg',
  },
  {
    id: 'love-story',
    title: 'Blank Spaces',
    kicker: 'Nine names before him',
    what: 'Her past relationships, era by era — the songs each one produced, and the quiet stretches in between.',
    // Joey's B2 pick (2026-08-13): "the wall of names" — the card art is the
    // grid of portraits in `threadHeroTiles('love-story')`, deliberately many
    // so no single ex becomes "the" face. This `hero` is only the fallback if
    // that grid is ever empty.
    hero: '/eras/lover.png',
  },
  {
    id: 'fashion',
    title: 'The Runway',
    kicker: 'Twelve wardrobes, one story',
    what: 'Walk the runway of every era and watch the looks, colors, and silhouettes tell you who she was becoming.',
    // A garment, not a face. The relationship threads above are a portrait and
    // a wall of portraits, so the fashion thread earns its glance by being the
    // only hero that is a piece of clothing — and a museum-lit gown reads as
    // "clothes" at 350px in a way a red-carpet photo of a person does not.
    // Same sourcing precedent as `look-evermore` below, which already cites a
    // V&A Songbook Trail costume photo.
    // https://commons.wikimedia.org/wiki/File:Taylor_Swift_Songbook_Trail_Bejeweled_costume_01.jpg
    // CC0 (public-domain dedication). Downscaled to 1200px wide by
    // `scripts/images/thread-hero.mjs`.
    hero: '/threads/runway-bejeweled-gown.jpg',
    // Measured with `thread-hero.mjs preview`, not guessed: the card's text
    // block covers all but the top strip, so a centred crop of a 1200x1830
    // portrait shows the hem. This lifts the bodice — bows, lace, gold satin —
    // into the strip that actually reads, at both 4:3 and 16:10.
    heroPosition: '50% 26%',
    heroAlt: 'The gold gown Taylor Swift wore in the "Bejeweled" video, displayed on a mannequin at the V&A in London.',
    heroCredit: '14GTR · CC0, via Wikimedia Commons',
    heroSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Taylor_Swift_Songbook_Trail_Bejeweled_costume_01.jpg',
  },
  {
    id: 'taylors-version',
    title: "Taylor's Version",
    kicker: 'Owning the masters',
    what: 'Follow the re-recording campaign, album by album, as she reclaims her life’s work one vault at a time.',
    // "All Too Well (10 Minute Version)" is the one image of this thread's
    // subject that exists: a song that had never been released until she owned
    // the recording, performed as the closer of the Eras Tour's Red act. A
    // photo of a re-recorded ALBUM COVER would only say "Red"; this says she is
    // the one singing it now.
    // https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Inglewood,_California_-_Red_act_10.jpg
    // CC BY 2.0 — attribution is a licence condition, and `heroCredit` renders
    // on the thread detail. The photographer asks to be credited by his full
    // name (Paolo Villanueva) on his Commons file pages.
    hero: '/threads/taylors-version-all-too-well.jpg',
    // She stands low in a tall, mostly-black frame; a centred crop would put
    // the empty stage in the readable strip. Measured, as above.
    heroPosition: '50% 82%',
    heroAlt: 'Taylor Swift performing "All Too Well (10 Minute Version)" in a red sequined coat at the Eras Tour, August 2023.',
    heroCredit: 'Paolo Villanueva · CC BY 2.0, via Wikimedia Commons',
    heroSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Inglewood,_California_-_Red_act_10.jpg',
  },
  {
    id: 'easter-eggs',
    title: 'The Clue Web',
    kicker: 'The secrets she plants',
    // DoD item 3 (docs/definition-of-done.md): this card and The Decode below
    // read as the same thread. The difference is scale — this one is the whole
    // map, The Decode is one route through it — so this line now promises
    // "everything at once" where The Decode's promises a single walkthrough.
    what: 'The whole game at once — every clue she has planted, the motif trails that link them, and where each one landed.',
    // The many-nodes half of item 3's "many nodes vs. two points and a gap":
    // a stadium of light-up wristbands is a real photograph of thousands of
    // points at once, which is what a clue web looks like. No single subject,
    // deliberately — The Decode's hero has one.
    // https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_Minnesota_-_acoustic_set_2.jpg
    // CC BY 2.0.
    hero: '/threads/clue-web-wristband-constellation.jpg',
    // The lit tiers are the top two-thirds of the frame and the dark floor
    // crowd is the bottom third; this keeps the lights in the readable strip.
    heroPosition: '50% 18%',
    heroAlt: 'A stadium of light-up wristbands turned purple around a single spotlit stage at the Eras Tour, Minneapolis, June 2023.',
    heroCredit: 'Michael Hicks · CC BY 2.0, via Wikimedia Commons',
    heroSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_Minnesota_-_acoustic_set_2.jpg',
  },
  {
    id: 'hidden-clues',
    title: 'The Decode',
    kicker: 'One clue, one payoff',
    what: 'Take a single hidden clue and decode it — reveal the payoff it was pointing to, and watch the thread stretch across the months between them.',
    // The other half of item 3: one clue, close enough to read. "13" inked on a
    // hand is the most-decoded mark in the catalog and it is legible at
    // thumbnail size, where the Clue Web's constellation is deliberately a
    // field of dots. Fans' hands, not Swift's — the caption says so and so does
    // the alt text; we never upgrade a photo's claim.
    // https://commons.wikimedia.org/wiki/File:Fans_With_Friendship_Bracelets_at_The_Eras_Tour.png
    // CC BY-SA 4.0.
    hero: '/threads/decode-thirteen-on-hands.jpg',
    // The hands are in the lower half of a portrait frame; this raises them
    // into the strip the text block leaves uncovered. Measured, as above.
    heroPosition: '50% 80%',
    heroAlt: 'Fans at the Eras Tour raising hands with the number 13 inked on them, Gelsenkirchen, July 2024.',
    heroCredit: 'Sally-Marie Böhm · CC BY-SA 4.0, via Wikimedia Commons',
    heroSourceUrl:
      'https://commons.wikimedia.org/wiki/File:Fans_With_Friendship_Bracelets_at_The_Eras_Tour.png',
  },
];
