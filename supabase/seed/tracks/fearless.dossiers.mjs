// Per-song dossiers for the Fearless era (issue #726 / #440 pattern), keyed by
// track slug and attached in fearless.mjs. Created 2026-07-25 for depth ledger
// #1470 (the title track was a mid-stub: no live history, no chart/reception,
// no Taylor's Version, no awards, no cross-links). Original prose only — never
// lyrics; unconfirmed readings labeled. Facts sourced from the song's and the
// re-recording's Wikipedia articles (writing, chart, certification, live, and
// re-recording detail), verified this session. Connection ids resolve
// globally (song:<slug>) and are asserted by
// apps/web/lib/longlive/tracks.test.ts.
export default {
  fearless: {
    whyItMatters: [
      "The album's namesake and thesis statement. Swift has framed fearlessness not as the absence of fear but as jumping anyway, and the title track dramatizes that as a first date so good it's worth dancing through a storm for. It is the only three-writer cut on Fearless — built with her regular Nashville collaborators Liz Rose and Hillary Lindsey — and she has said she wrote it on tour, single, about \"the best first date I hadn't had yet,\" an imagined ideal rather than a real night.",
      "Released to iTunes on Oct. 14, 2008 as a pre-order promotional single, it reached No. 9 on the Hot 100 on download strength alone before a January 2010 country-radio run, peaked at No. 10 on Hot Country Songs, and was certified platinum. It lent its name to the 2009-10 Fearless Tour and, in 2021, to the first full Taylor's Version re-recording — making the title track a throughline from her breakthrough to the project that reclaimed it."
    ],
    meaning: {
      confirmed: [
        "Written by Swift with Liz Rose and Hillary Lindsey — the album's only three-writer song — and produced by Nathan Chapman and Swift; she has said she conceived it on tour, about \"the best first date I hadn't had yet.\"",
        "Big Machine released it to iTunes on Oct. 14, 2008 as a promotional single ahead of the album, then to country radio in January 2010; it peaked at No. 9 on the Billboard Hot 100 and No. 10 on Hot Country Songs and was certified platinum by the RIAA in 2012.",
        "\"Fearless (Taylor's Version),\" co-produced by Swift and Christopher Rowe, was released April 9, 2021 on the first full re-recording; the re-cut keeps the 4:01 runtime with only subtle changes — an omitted organ note early on, a louder electric guitar in the fade — and reached No. 71 on the Hot 100 and No. 14 on Hot Country Songs.",
        "The title track earned no Grammy of its own — the album itself won Album of the Year at the 2010 ceremony — and Swift has framed its \"dancing in a storm\" first date as an imagined ideal rather than a specific memory."
      ],
      supported: [
        "Contemporary critics praised the production's momentum: Elysa Gardner singled out its \"storytelling lyrics and the earnest innocence and wonder,\" and Rob Sheffield later ranked it No. 42 among Swift's songs, admiring how the track \"builds up to a swoon.\"",
        "It has been a live cornerstone across eras — a staple of the 2009-10 Fearless Tour and the song that opened the Fearless act of the 2023-24 Eras Tour, performed with a rhinestoned acoustic guitar in both."
      ],
      fanTheories: [
        "Because the lyric names no one and Swift has called it an imagined ideal, fans read the \"rain in a parking lot\" first date as an aspiration rather than a coded real memory — the rare early Swift love song with no muse to decode."
      ]
    },
    connections: [
      {
        relatedId: "song:love-story",
        label: "Love Story",
        why: "The two definitive Fearless singles: \"Love Story\" rewrites a tragedy into a proposal, the title track turns a first date into a leap of faith — the album's fairy-tale optimism in its two most famous forms."
      },
      {
        relatedId: "song:you-belong-with-me",
        label: "You Belong With Me",
        why: "Fearless's other blockbuster single; together with the title track they carried Swift's country-to-crossover breakthrough."
      }
    ],
    sources: [
      {
        name: "Fearless (Taylor Swift song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_song)"
      },
      {
        name: "Fearless (Taylor's Version) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)"
      }
    ]
  }
};
