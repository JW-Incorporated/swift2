// Per-song dossiers for the Lover era (issue #440 pattern), keyed by track
// slug and attached in lover.mjs. Added by the depth engine's Answerer
// (2026-07-24, shard 5) to drain curiosity ledgers #1351 (Cruel Summer),
// #1410 (Cornelia Street) and #1415 (Afterglow) — their sources, writing/
// production, live-history, reception and cross-link axes. Fact-checked this
// pass against the Wikipedia song articles (fetched) plus Billboard, Rolling
// Stone, American Songwriter and NYC property reporting: confirmed[] = a
// documented fact or Swift's own on-record statement; anything about a song's
// subject or the "lost the lease" lore is labeled fanTheories, never fact.
// No lyric quotations. The song:/moment: connection ids resolve and are
// asserted by apps/web/lib/longlive/tracks.test.ts.
export default {
  'cruel-summer': {
    whyItMatters: [
      "One of Swift's biggest songs and the catalog's defining 'fan-willed correction.' A 2019 Lover deep cut that was never a single at release, it climbed to No. 1 on the Billboard Hot 100 four years later — the chart dated October 28, 2023 — after fans screamed its bridge nightly on the Eras Tour and Republic finally issued it as a single on June 20, 2023. It was her 10th Hot 100 leader and the first Lover track to top the chart, completing one of the longest debut-to-No. 1 journeys in the chart's history (it had first entered at No. 29 in September 2019).",
      "The 2023 run turned it into her longest-charting Hot 100 hit ever, at 54 weeks on the survey, with four (non-consecutive) weeks at No. 1 and 34 weeks in the top 10; on Billboard's Radio Songs chart it reigned 12 weeks, her longest-ruling single there.",
    ],
    meaning: {
      confirmed: [
        "Written by Swift with Jack Antonoff and Annie Clark (St. Vincent) during the Lover sessions; Swift and Antonoff produced it and St. Vincent contributed guitar. The 'ranting' bridge runs over skittering synths with Swift's vocal put through a vocoder — a distorted texture rare in her catalog.",
        "Swift confirmed the long-rumored shelved single herself: at the Eras Tour's Pittsburgh show on June 17, 2023 she said she had 'intended to release Cruel Summer as a single in 2020' but abandoned the plan when the pandemic hit and pivoted to Folklore instead.",
        "Swift has described the song as an uncertain summer romance, about 'yearning for something that you don't quite have yet' — a general statement of theme rather than a named subject.",
      ],
      fanTheories: [
        "Fans widely tie the song to the guarded early days of the relationship that began in late 2016. Swift has never confirmed a specific subject, so that romantic read stays interpretation, not fact.",
      ],
    },
    live: [
      {
        date: "March 17, 2023",
        event: "The Eras Tour opening night — Glendale, AZ (State Farm Stadium)",
        note: "'Cruel Summer' has been the second song of every Eras Tour show from opening night, launching the Lover act. The nightly bridge scream-along became the documented ritual that drove the 2023 single release and the song's chart resurrection — so the scream has an origin point (the tour's start), not a later mid-run one.",
      },
    ],
    connections: [
      {
        relatedId: "moment:vault-lover-lover-the-first-album-shes-ever-owned",
        label: "Lover: the first album she's ever owned",
        why: "Cruel Summer was buried on Lover as a deep cut; its 2023 No. 1 is the belated smash the album never got at release, and the clearest proof of the record's long streaming tail.",
      },
    ],
    sources: [
      {
        name: "Cruel Summer (Taylor Swift song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Cruel_Summer_(Taylor_Swift_song)",
      },
      {
        name: "Taylor Swift's 'Cruel Summer' Hits No. 1 on Billboard Hot 100, Becoming Her 10th Leader — Billboard",
        url: "https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/",
      },
      {
        name: "Taylor Swift's 'Cruel Summer' Is Now Her Longest-Charting Hot 100 Hit — Billboard",
        url: "https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-longest-chart-hot-100-hit-1235687637/",
      },
    ],
  },

  'cornelia-street': {
    whyItMatters: [
      "A solo-written Lover ballad that pins a whole relationship to a single New York address — and one of the rare Swift titles that is literal reportage rather than metaphor: she really did live on Cornelia Street. Fans treat the West Village block as a pilgrimage site, and the song became one of the Eras Tour's most-wanted surprise songs.",
    ],
    meaning: {
      confirmed: [
        "Swift is the sole writer and co-produced the track with Jack Antonoff. The title is literal: in 2016 Swift rented a townhouse at 23 Cornelia Street in Manhattan's West Village while her own TriBeCa home was being renovated, living there into 2017 (widely documented in NYC property reporting, including when the townhouse was later listed for sale). Keeping to the street/city level she herself made public via the title.",
      ],
      fanTheories: [
        "The widely repeated fan lore that Swift 'lost the lease' and could never return to the townhouse mirrors the song's premise almost too neatly — but it is not documented. Reporting shows only that the rental was always temporary and she moved back to her renovated TriBeCa home; treat the 'can't go back' story as fan legend, not established fact.",
        "The romantic subject is generally read as the early days of the relationship that began in 2016; Swift has not tied the lyric to a named person on the record.",
      ],
    },
    live: [
      {
        date: "August 26, 2023",
        event: "The Eras Tour — Mexico City (Foro Sol)",
        note: "Live debut, played solo on acoustic guitar as the night's first surprise song; Swift framed it as challenging herself to perform songs she hadn't yet done on the tour. Later revived, e.g. mashed with 'The Bolter' in Indianapolis on November 3, 2024.",
      },
    ],
    connections: [
      {
        relatedId: "song:death-by-a-thousand-cuts",
        label: "Death by a Thousand Cuts",
        why: "Lover's other New York breakup song — both map heartbreak onto the same downtown Manhattan geography, making them the album's paired city-as-memory tracks.",
      },
      {
        relatedId: "song:welcome-to-new-york",
        label: "Welcome to New York",
        why: "Her first NYC-as-home anthem, five years earlier on 1989 — the arrival that 'Cornelia Street' turns into the fear of losing the place love happened in.",
      },
    ],
    sources: [
      {
        name: "Cornelia Street — Wikipedia (song background)",
        url: "https://en.wikipedia.org/wiki/Cornelia_Street",
      },
      {
        name: "Watch Taylor Swift Deliver Fan-Favorite 'Cornelia Street' in Mexico City — Rolling Stone",
        url: "https://www.rollingstone.com/music/music-news/taylor-swift-cornelia-street-live-mexico-city-eras-tour-watch-1234812964/",
      },
      {
        name: "'Cornelia Street' townhouse once rented by Taylor Swift asks $17.9M — 6sqft",
        url: "https://www.6sqft.com/taylor-swift-cornelia-street-rental-in-nyc-asks-17-9m/",
      },
    ],
  },

  'afterglow': {
    whyItMatters: [
      "Lover's most self-blaming song and its production outlier: track 15 of 18, 'Afterglow' is the only cut on the album built by the pop team of Louis Bell and Frank Dukes rather than the record's Jack Antonoff / Joel Little core — an unusual pairing for Swift, whose regular collaborators handle the rest of the album. It lands late on a deliberately front-loaded record, the accountability low point three tracks before the peace of closer 'Daylight.'",
    ],
    meaning: {
      confirmed: [
        "Written by Swift, Louis Bell and Frank Dukes (Adam King Feeney) and produced by the three; recorded at Electric Feel Studios in Los Angeles. Bell is best known for his Post Malone hits and Dukes for sample-based production. It is a power ballad of slow-building bass and Swift's falsetto in which she takes the blame for a fight she started and asks the other person to stay while she repairs the damage.",
      ],
      fanTheories: [
        "The song is popularly read as an apology aimed at her partner at the time, but Swift has never named a subject on the record, so that reading is interpretation rather than confirmed fact. No documented sample or interpolation underlies the track — it is credited as an original composition, notwithstanding Dukes's usual sample-based style.",
      ],
    },
    live: [
      {
        date: "August 27, 2023",
        event: "The Eras Tour — Mexico City (Foro Sol)",
        note: "Live debut as a surprise song, four years after release; later performed mashed with 'Dress' in New Orleans on October 27, 2024. Contrary to its reputation as a never-played deep cut, it has been performed live — though only on the Eras Tour, never during the Lover-era promo run or the April 2020 City of Lover show.",
      },
    ],
    connections: [
      {
        relatedId: "song:daylight",
        label: "Daylight",
        why: "Lover's other glow-titled song and its closer — 'Afterglow' is the self-blame that 'Daylight' resolves into peace three tracks later, the album's turn from arson to light.",
      },
      {
        relatedId: "song:this-is-me-trying",
        label: "This Is Me Trying",
        why: "Its folklore successor in Swift's accountability lineage — both are first-person songs about owning damage and asking for grace rather than assigning blame.",
      },
    ],
    sources: [
      {
        name: "Afterglow (Taylor Swift song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Afterglow_(Taylor_Swift_song)",
      },
      {
        name: "'Lover' Songs Taylor Swift Has Never Performed Live — Billboard (2019 context)",
        url: "https://www.billboard.com/music/music-news/lover-taylor-swift-songs-never-performed-live-8529618/",
      },
    ],
  },
};
