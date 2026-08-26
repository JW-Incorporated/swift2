// Vault theories/easter eggs — evermore era. Depth pass for issue #460 (the
// Theories & eggs section reads thin): evermore was the catalog's sole standout
// laggard — a single entry that was actually an easter_egg, so effectively ZERO
// fan theories on folklore's lore-rich sister album. Added five fan theories
// (song-narrative and craft close-reads — evermore is built from fictional
// character studies, so these read the songs, never Taylor's private life) plus
// the era's marquee confirmed egg. Every entry carries the required
// confidence/outcome badges; readings are labeled, never stated as fact.
// URLs reuse the already-verified evermore/folklore album articles.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  // Rumor Desk recheck 2026-08-12 (rumor-lifecycle staleness on the evermore
  // theories): the readings here are unfalsifiable fan close-reads of a 2020
  // album and their Wikipedia sources are unchanged — nothing resolved or
  // shifted, so this refreshes the last-accessed date rather than any claim.
  accessed_at: '2026-08-12',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

const EVERMORE = (notes) =>
  wiki('Evermore_(Taylor_Swift_album)', 'Evermore (Taylor Swift album)', notes);

export default {
  eraSlug: 'evermore',
  theories: [
    {
      slug: 'thirteen-backwards',
      kind: 'easter_egg',
      title: 'Dropped when 13 runs backwards',
      claim:
        'evermore arrived two days before her 31st birthday — and she said the timing was the point: she\'d been excited about turning 31 "because it\'s my lucky number backwards, which is why I wanted to surprise you with this now."',
      evidence:
        'Stated in her own announcement of the album: the 31/13 mirror was her framing, not a fan read. The numerology habit that started with hand-painted 13s now sets release dates.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:lucky-number-13', 'folklore:woodvale'],
      sources: [EVERMORE('her 31/13 announcement framing is documented in the album article')],
    },
    {
      slug: 'dorothea-and-the-love-triangle',
      kind: 'theory',
      title: 'Does the love triangle grow up on evermore?',
      claim:
        "Fans read 'tis the damn season and dorothea as one hometown girl who left for Hollywood and the ex she keeps circling back to — and tie her to the folklore teenage love triangle, reading evermore as those characters grown up.",
      evidence:
        "Taylor framed evermore as folklore's sister record, set in the same fictional world, and the two songs share a narrator: someone who left a small town for the screen, and the road that keeps leading her back to an old flame. Fans map her onto Betty, or onto the one who got away — but Taylor confirmed only the shared universe, never that Dorothea IS any named folklore character, so the specific casting stays an open close-read rather than canon.",
      confidence: 'strong_fan_consensus',
      outcome: 'unfalsifiable',
      relatedSlugs: ['folklore:teenage-love-triangle'],
      sources: [
        EVERMORE('the folklore/evermore sister-album shared fictional universe is documented here'),
        wiki('Folklore_(Taylor_Swift_album)', 'Folklore (Taylor Swift album)', 'the confirmed teenage love triangle these characters belong to'),
      ],
    },
    {
      slug: 'ivy-the-affair-narrative',
      kind: 'theory',
      title: "'ivy': an affair told in a garden",
      claim:
        "The near-universal reading of ivy is the confession of a married woman in love with someone else — creeping 'ivy' standing in for a love that spreads where it isn't wanted — with a companion theory that the literary, 19th-century diction nods to Emily Dickinson.",
      evidence:
        "evermore is built from fictional character studies, and ivy's narrator is widely read as a wife whose heart has gone elsewhere, the overgrown-garden metaphor doing the work a plainer confession couldn't. Its old-fashioned, poem-like language fed a second reading that the song echoes Dickinson. Both stay interpretation of a deliberately literary, fictional lyric — not a key Taylor has handed over.",
      confidence: 'strong_fan_consensus',
      outcome: 'unfalsifiable',
      relatedSlugs: [],
      sources: [EVERMORE('the album article covers ivy among evermore\'s fictional character studies')],
    },
    {
      slug: 'cowboy-like-me-two-con-artists',
      kind: 'theory',
      title: "'cowboy like me': two grifters fall in love",
      claim:
        'The popular reading of cowboy like me is a love story between two con artists who spot the hustle in each other — a pair of charmers who prey on the wealthy, then dangerously fall for the one mark who can read them right back.',
      evidence:
        "The lyric's tells — the tallied marks, the wariness, the recognition of a fellow schemer — support a near-universal fan reading of two grifters undone by real feeling. Like most of evermore it's a character study, so the reading is about the fictional narrators rather than anyone real; Taylor has left the song to speak for itself.",
      confidence: 'strong_fan_consensus',
      outcome: 'unfalsifiable',
      relatedSlugs: [],
      sources: [EVERMORE('cowboy like me\'s narrative is discussed in the album article')],
    },
    {
      slug: 'closure-discomfort-by-design',
      kind: 'theory',
      title: "'closure' is uncomfortable on purpose",
      claim:
        "Fans argue closure's jarring, off-kilter production isn't a misstep but the whole point — a song that refuses a clean resolution, set to music that refuses to sit still, so the listener feels the closure the narrator won't grant.",
      evidence:
        "closure pairs a bitter kiss-off — thanks but no thanks to a peace offering that's really about the ex's comfort — with a deliberately abrasive, industrial-leaning arrangement in an unsettled meter. Critics and fans read the mismatch as intentional: the discomfort in the mix mirrors a narrator denying the tidy ending everyone expects. A craft reading, not a confirmed statement.",
      confidence: 'plausible',
      outcome: 'unfalsifiable',
      relatedSlugs: [],
      sources: [EVERMORE('the album article notes closure\'s experimental, off-kilter arrangement')],
    },
    {
      slug: 'evermore-bonus-tracks-true-ending',
      kind: 'theory',
      title: "The bonus tracks are evermore's real ending",
      claim:
        "Fans treat the two deluxe tracks — right where you left me and it's time to go — as evermore's true emotional finale: one narrator frozen at the table where she was left, the other finally learning when to walk away — a matched pair about staying versus leaving.",
      evidence:
        "Placed after the title track, the pair reads as a deliberate coda: right where you left me strands a woman in the exact moment of heartbreak while the world moves on, and it's time to go answers it with the wisdom to recognize a lost cause and leave first. Fans prize the two as the record's thesis on endings — an editorial reading of track placement, not an official 'real ending' Taylor has claimed.",
      confidence: 'strong_fan_consensus',
      outcome: 'unfalsifiable',
      relatedSlugs: [],
      sources: [EVERMORE('the deluxe/bonus tracks right where you left me and it\'s time to go are listed in the album article')],
    },
    {
      slug: 'marjorie-grandmothers-vocals',
      kind: 'easter_egg',
      title: "Her grandmother really sings on 'marjorie'",
      claim:
        "The soaring background vocals in the last minute of marjorie aren't a session singer — they're Marjorie Finlay herself, Taylor's late grandmother and a trained opera singer, woven in from old recordings.",
      evidence:
        "Taylor has said she layered her grandmother's real operatic vocals into the track named for her, so Marjorie Finlay quite literally sings on her own tribute. It's the era's most-cited egg because it's confirmed and quietly devastating — a fact Taylor shared herself about a family member the family made public, not a fan guess.",
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [EVERMORE('Marjorie Finlay\'s operatic backing vocals on the track are documented in the album article')],
    },
  ],
};
