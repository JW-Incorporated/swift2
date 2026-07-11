# Brief: draft TLOAS song dossiers (issue #440 Phase 1 content wave)

You are drafting per-song "dossier" content for The Life of a Showgirl (2025)
tracks. OUTPUT: create the file
`supabase/seed/tracks/the-life-of-a-showgirl.dossiers.draft.mjs` exporting
`export default { /* slug -> dossier */ }` — one key per track slug from
`supabase/seed/tracks/the-life-of-a-showgirl.mjs` (read it first; reuse its
sourced facts). Do NOT edit any existing file.

## Dossier shape (per song; all keys optional EXCEPT sources)

```js
{
  whyItMatters: ['1-2 paragraphs: the editorial case for caring about this song'],
  meaning: {
    confirmed: ['only what Swift/a collaborator has DIRECTLY said it is about'],
    supported: ['well-supported readings from the song + public context'],
    fanTheories: ['popular unconfirmed fan readings, framed as such'],
  },
  connections: [
    // >=3 per song. relatedId must resolve against REAL data:
    //   song:<slug>   — any slug in apps/web/lib/longlive/tracks.generated.ts (all eras)
    //   moment:<id>   — any id in apps/web/lib/longlive/content-vault.generated.ts
    // Read those files and use ONLY ids that exist. `why` must EXPLAIN the
    // relationship (never just name-drop): weak "Related to Red";
    // strong "Both treat love through color, but ...".
    { relatedId: 'song:opalite', label: 'Opalite', why: '...' },
  ],
  live: [
    // ONLY real, sourced performances/appearances. NOTE (verified 2026-07-10):
    // TLOAS has NO tour and (as far as verified) NO live TV performance of its
    // songs yet. She did NOT play the Super Bowl LX halftime (that was Bad
    // Bunny). If you cannot cite a URL for a live performance, OMIT this
    // section entirely — an honest gap beats an invented show.
    { date: 'YYYY-MM-DD', event: '...', note: '...' },
  ],
  voices: [
    // What Swift/collaborators actually said, PARAPHRASED in editorial voice.
    // NEVER paste quotes verbatim beyond a short illustrative excerpt.
    { who: 'Taylor Swift', context: 'New Heights podcast, August 2025', note: '...' },
  ],
  sources: [ { name: '...', url: 'https://...' } ], // REQUIRED, real URLs only
}
```

## Verified fact pack (safe to use, with these sources)

- "The Fate of Ophelia" music video: directed by Swift; cinematographer
  Rodrigo Prieto; choreography Mandy Moore; features Eras Tour dancers;
  world-premiered in the theatrical "Official Release Party of a Showgirl"
  (Oct 3–5, 2025, ~$33M box office), then YouTube Oct 5, 2025 7PM ET.
  Sources: https://variety.com/2025/music/news/taylor-swift-fate-of-ophelia-music-video-premiere-youtube-1236540694/
  and https://www.rollingstone.com/music/music-news/taylor-swift-the-fate-of-ophelia-video-1235441075/
- "The Fate of Ophelia": debuted at Hot 100 No. 1, led for a career-longest
  10 non-consecutive weeks (already sourced in the seed file).
- "Opalite" hit Hot 100 No. 1 in Feb 2026 (week of ~Feb 26): driven by its
  official video premiere + vinyl/CD variants + remixes (168K sales, +2,290%);
  her 14th Hot 100 No. 1, tying Rihanna for third-most ever; first time since
  1989 that one album produced two No. 1s.
  Sources: https://www.billboard.com/lists/taylor-swift-opalite-hot-100-number-one/
  and https://variety.com/2026/music/news/taylor-swift-opalite-top-hot-100-chart-tied-with-rihanna-1236670506/
- Album promo (Oct 2025): The Tonight Show Starring Jimmy Fallon (Oct 6),
  a Late Night with Seth Meyers "TAY/kover" episode, The Graham Norton Show —
  interviews/appearances, NOT musical performances. Do not call them
  performances.
- No Showgirl tour announced as of 2026-07-10. No Grammy claims for TLOAS
  (it missed the 68th Grammys eligibility window — there is an internal
  moment about this: see content-vault ids matching
  `showgirl-grammy-eligibility-window-miss`).

## Hard rules

1. NO fabrication. Every factual claim must trace to a source URL you list.
   If unsure, leave it out. Meaning tiers: `confirmed` ONLY with a direct
   statement from Swift/a collaborator (the seed file's `inspiration` fields
   tell you which readings are confirmed vs fan readings — respect those
   labels exactly; e.g. Opalite's Travis/October link and Actually Romantic's
   Charli XCX reading are FAN interpretations, not confirmed).
2. No verbatim quote blocks. Paraphrase; at most a short illustrative excerpt.
3. No lyric quotation at all in this draft (quotedLines is handled elsewhere).
4. Connections: >=3 per song, each `why` explains the link. Prefer a mix of
   same-album songs, cross-era songs (e.g. track-five tradition for Eldest
   Daughter vs 'all-too-well' / 'my-tears-ricochet'; Elizabeth Taylor vs
   'the-lucky-one' on Red about fame's cost — CHECK the real slugs in
   tracks.generated.ts), and tloas era moments (`vault-tloas-...` ids).
5. Write in the site's editorial voice: warm, literate, die-hard-fan level,
   never tabloid. Interpretation explains WHY, not just a conclusion.
6. Cover all 12 tracks. whyItMatters + meaning + connections for every track;
   live/voices only where genuinely sourced.
