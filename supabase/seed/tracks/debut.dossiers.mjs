// Per-song dossiers for the debut era (Taylor Swift, 2006), keyed by track slug
// and attached in debut.mjs (issue #440 pattern; see red.mjs / tortured-poets).
// Added by the depth engine's Answerer (shard 1, 2026-07-24) to answer curiosity
// ledger #1306 (Our Song) — its production, chart, video, live-history,
// reception and cross-link questions, which resolve through a dossier's
// `connections`.
// Fact-checked this pass: every source URL supports its claim; the confirmed
// tier is Swift's own public statements or hard documented facts only; readings
// are labeled; no lyric quotations. Internal song:/moment: connection ids all
// resolve.
export default {
  'our-song': {
    whyItMatters: [
      "It is the record that proved the debut was no fluke: her first Billboard Hot Country Songs No. 1, and the one that made her the youngest person to single-handedly write AND sing a country chart-topper — a distinction that traces to the 17-year-old who wrote and recorded it. It spent six consecutive weeks at No. 1 (first dated Dec. 15, 2007), crossed to No. 16 on the Hot 100, and is certified 4x platinum.",
      "The origin is pure homemade Taylor: she wrote it alone in about twenty minutes for her ninth-grade talent show, wanting an upbeat song everyone could relate to, and only cut it after classmates kept singing the hook back to her. A late album cut — track 11 — it was chosen as the third single (sent to country radio Sept. 10, 2007, after 'Tim McGraw' and 'Teardrops on My Guitar') and placed last on the record so its closing 'play it again' line would nudge listeners to restart the whole thing."
    ],
    meaning: {
      confirmed: [
        "Track 11 and the closing song of Taylor Swift (Oct. 24, 2006); written solely by Swift and produced by Nathan Chapman, who also played banjo and electric guitar on it, with Rob Hajacos on fiddle and a Nashville session band.",
        "Six consecutive weeks at No. 1 on Billboard Hot Country Songs (first dated Dec. 15, 2007), No. 16 on the Hot 100, and an RIAA 4x-platinum certification (August 2014).",
        "Trey Fanjoy directed the music video, which premiered on CMT on Sept. 24, 2007 and won both Video of the Year and Female Video of the Year at the 2008 CMT Music Awards."
      ],
      supported: [
        "Swift has said she wrote it for her ninth-grade talent show in roughly twenty minutes, because she was dating someone with no shared 'song' and decided everything already around them was one; she made it the album closer so the final 'play it again' would send listeners back to the top.",
        "It was recognized among the 2008 BMI Country Awards' award-winning songs, and reception at release was warm, singling out its plainspoken, everyday-romance detail.",
        "It became a recurring Eras Tour acoustic surprise song — played in Los Angeles on Aug. 4, 2023 (the night filmed for the concert movie, paired with 'You Are in Love') and mashed with 'Call It What You Want' on the New Orleans opening night, where she noted the song had just 'turned 18.'"
      ],
      fanTheories: [
        "Fans read it as the debut's thesis in miniature — that the small, unglamorous specifics (a screen door, a late phone call, sneaking back in slow) are the love song — and prize the closing 'play it again' as a built-in invitation to loop the record."
      ]
    },
    connections: [
      {
        relatedId: "song:tim-mcgraw",
        label: "Tim McGraw",
        why: "The debut single run in order: 'Tim McGraw' opened the campaign, 'Our Song' finished it as her first No. 1. A reader tracing how she broke wants the first single beside the first chart-topper."
      },
      {
        relatedId: "song:teardrops-on-my-guitar",
        label: "Teardrops on My Guitar",
        why: "The second single between them — the crossover-leaning ballad that set up 'Our Song' as the third and biggest, completing the debut's three-single arc."
      },
      {
        relatedId: "moment:vault-debut-our-song-hits-number-one",
        label: "“Our Song” hits number one",
        why: "The moment page for the record this song set — the youngest solo writer-performer of a country No. 1 — is the event this track's story culminates in."
      }
    ],
    sources: [
      {
        name: "Our Song — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Our_Song"
      },
      {
        name: "Songfacts: Our Song by Taylor Swift",
        url: "https://www.songfacts.com/facts/taylor-swift/our-song"
      },
      {
        name: "Billboard: All the Surprise Songs Taylor Swift Performed on The Eras Tour",
        url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/"
      }
    ]
  }
};
