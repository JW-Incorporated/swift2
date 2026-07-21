// Per-song dossiers for the Midnights era (issue #440 pattern), keyed by track
// slug and attached in midnights.mjs. Added by the depth engine's Answerer
// (2026-07-21) to answer curiosity ledger #1098 (Anti-Hero) — its music-video,
// live-history, reception, writing/production, sources and cross-link axes.
// Fact-checked this pass against the Wikipedia song article (fetched) and the
// in-repo Midnights record-week moment: confirmed tier = documented facts or
// Swift's own statements only; the '30 Rock' and any subject readings are
// labeled fan/press theory, never fact. No lyric quotations. The internal
// song:/moment: connection ids resolve and are asserted by
// apps/web/lib/longlive/tracks.test.ts.
export default {
  'anti-hero': {
    whyItMatters: [
      "Anti-Hero is the most culturally load-bearing song of the Midnights era and Swift's own stated favorite on the record. Released with the album on October 21, 2022, it became her longest-running Billboard Hot 100 No. 1 to that point — eight weeks on top, six of them consecutive before Mariah Carey's holiday perennial interrupted the run and it returned for two more weeks in January 2023 — surpassing 'Blank Space.' On its opening day it drew about 17.4 million Spotify streams, at the time the biggest single-day for a song in the platform's history, and its 'it's me, hi' hook became a global catchphrase within days.",
      "It also anchored a chart first: the week it debuted at No. 1, the nine other Midnights tracks filled out the rest of the Hot 100's top 10, making Swift the first artist ever to hold the entire top 10 at once. The self-directed video and its self-loathing imagery kept the song in the culture for months, and it was nominated for Record of the Year, Song of the Year and Best Pop Solo Performance at the 2024 Grammys."
    ],
    meaning: {
      confirmed: [
        "The lead single from Midnights (October 21, 2022), written and produced by Swift and Jack Antonoff; Swift introduced it in an Instagram video as a guided tour of the things she dislikes and fears about herself. Antonoff built the track over an OB-8 synth with tremolo applied to a LinnDrum beat (E major, ~97 BPM).",
        "It spent eight weeks at No. 1 on the Hot 100 — her longest-running chart-topper up to then — and set a Spotify single-day streaming record on release. The Swift-written-and-directed music video premiered October 21, 2022; a version featuring Bleachers (Jack Antonoff's band) followed on November 7-8, 2022, reworking the album cut as a duet."
      ],
      supported: [
        "The video literalizes the song's intrusive thoughts — Swift confronted by an 'anti-hero' version of herself — including a bathroom-scale shot reading 'fat.' After criticism that the scene equated fatness with failure, Swift edited the video to remove that specific shot. The will-reading/funeral sequence, where a scheming family divides her estate, was played by Mike Birbiglia, John Early and Mary Elizabeth Ellis as her sons and daughter-in-law.",
        "It received three 2024 Grammy nominations (Record of the Year, Song of the Year, Best Pop Solo Performance) and won none, in a field where Miley Cyrus's 'Flowers' took Record of the Year and Best Pop Solo Performance and Billie Eilish's 'What Was I Made For?' took Song of the Year. Its live debut came on January 12, 2023, when Swift joined The 1975 as a surprise guest at their London show; it then held a fixed spot in the Midnights section of the Eras Tour."
      ],
      fanTheories: [
        "The 'sexy baby / monster on the hill' line is widely read as invoking the sitcom 30 Rock, but Swift has not confirmed the reference, so the reading stays fan/press interpretation rather than a stated source."
      ]
    },
    connections: [
      {
        relatedId: "moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once",
        label: "Every spot in the Hot 100 top 10, all at once",
        why: "Anti-Hero is the No. 1 that led the record — the week it debuted atop the chart, the other nine Midnights tracks filled out the top 10, the first time one artist ever monopolized it, and this song's 59.7 million-stream week sat at the front of it."
      },
      {
        relatedId: "song:youre-on-your-own-kid",
        label: "You're on Your Own, Kid",
        why: "The album's two self-portraits — Anti-Hero itemizes the self-loathing, You're on Your Own, Kid answers it with hard-won self-reliance; the record's problem statement and its resolution."
      },
      {
        relatedId: "song:mastermind",
        label: "Mastermind",
        why: "Two sides of Swift narrating her own reputation — Anti-Hero the anxious confession of being her own worst problem, Mastermind the wink that every bit of the image was calculated on purpose."
      }
    ],
    live: [
      {
        date: "January 12, 2023",
        event: "The 1975 — 'At Their Very Best' Tour, London (The O2)",
        note: "Live debut, performed as a surprise guest during The 1975's set before the Eras Tour began; it then ran as a fixture of the tour's Midnights section from opening night."
      }
    ],
    sources: [
      {
        name: "Anti-Hero (song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Anti-Hero_(song)"
      },
      {
        name: "Anti-Hero — biggest single-day Spotify streams and Hot 100 records (Wikipedia, cited)",
        url: "https://en.wikipedia.org/wiki/Anti-Hero_(song)#Commercial_performance"
      }
    ]
  }
};
