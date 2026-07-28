// Vault theories/easter eggs — Fearless era. Liner-note capitalization codes,
// the "From the Vault" reveal puzzle, a surprise home-movie tribute, and two
// confirmed songwriting readings (the Shakespeare rewrite, the underdog-label
// anthem). Original URLs verified 2026-07-08; entries added 2026-07-27 verified
// that session.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — these entries stick to documented puzzle
// mechanics, a family tribute, and Taylor's own words on how songs were built,
// not romantic-subject guessing.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'fearless',
  theories: [
    {
      slug: 'the-best-day-liner-note-code',
      kind: 'easter_egg',
      title: 'A liner-note code hidden inside "The Best Day"',
      claim:
        'The 2008 Fearless CD booklet capitalized scattered letters within "The Best Day" lyric sheet that, read in order, spell out "GOD BLESS ANDREA SWIFT" — a hidden tribute to her mother.',
      evidence:
        'Swift used this capitalization-code technique across her early album booklets, letting fans decode a short message per song from oddly capitalized letters in the printed lyrics. For "The Best Day" — itself written about her mother — the decoded message names her directly, tying the song\'s subject to its hidden dedication.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:the-best-day-surprise-home-video'],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
          source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          notes: 'catalogs the confirmed liner-note codes across her early albums',
        },
      ],
    },
    {
      slug: 'vault-track-anagram-reveal',
      kind: 'easter_egg',
      title: 'An anagram video unlocks the "From the Vault" track list',
      claim:
        'Before officially announcing the six "From the Vault" songs on Fearless (Taylor\'s Version), Swift posted a scrambled-letter anagram video on social media that fans raced to decode, correctly working out the titles — and a Keith Urban feature — hours ahead of the formal reveal.',
      evidence:
        'The teaser clip showed jumbled letters that fans reassembled into the vault-track titles; Swift confirmed the full list, including the Keith Urban duet, on April 3, 2021, six days ahead of the April 9 release. The announcement date (Feb. 11) and release date (April 9) each reduce to her frequently cited number 13 (2+11 and 4+9), a numerology pattern she has said she builds into release timing on purpose.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('Fearless_(Taylor%27s_Version)', "Fearless (Taylor's Version)", 'documents the anagram-teaser reveal method and release timeline'),
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-fearless-taylors-version-track-list-keith-urban-1150599/',
          source_title: "Taylor Swift Reveals 'Fearless (Taylor's Version)' Track List, Including Keith Urban Duet",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          notes: 'confirms the April 3, 2021 track-list reveal and feature',
        },
      ],
    },
    {
      slug: 'the-best-day-surprise-home-video',
      kind: 'easter_egg',
      title: 'The home video she made in secret',
      claim:
        'Taylor wrote and recorded "The Best Day" about her mother and then, without telling her, cut a music video out of the family\'s real home movies — saving the whole thing as a Christmas surprise before it ever reached the public.',
      evidence:
        'She kept the song and the video hidden from Andrea, then played both for her on Christmas Eve. "That\'s when I lost it," Andrea recalled, "and I\'ve lost it pretty much every time I\'ve heard that song since." The self-edited clip of childhood footage went public on May 1, 2009 as a Mother\'s Day release through Big Machine — the moving-image companion to the booklet\'s decoded "GOD BLESS ANDREA SWIFT" tribute, so the same dedication is hidden twice on the same album, once in the printed letters and once on film. Years later she extended the gesture, adding never-before-seen home movies to the "Best Day (Taylor\'s Version)" lyric video.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:the-best-day-liner-note-code'],
      sources: [
        wiki(
          'The_Best_Day_(Taylor_Swift_song)',
          'The Best Day (Taylor Swift song)',
          'documents the secret Christmas-surprise recording, Andrea\'s reaction, and the May 1, 2009 home-video release',
        ),
        {
          source_url: 'https://www.eonline.com/news/1257438/taylor-swift-pays-tribute-to-mom-andrea-with-unseen-home-movies-in-the-best-day-lyric-video',
          source_title: "Taylor Swift Pays Tribute to Mom Andrea With Unseen Home Movies in 'The Best Day' Lyric Video",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-27',
          reliability_score: 3,
          excerpt: null,
          notes: 'covers the home-movie tribute and the later Taylor\'s Version lyric-video footage',
        },
      ],
    },
    {
      slug: 'love-story-rewritten-ending',
      kind: 'theory',
      title: 'The Shakespeare rewrite',
      claim:
        'The reading — which Taylor has confirmed — that "Love Story" deliberately rewrites Romeo and Juliet: it keeps the star-crossed lovers and the disapproving family, then throws out the double suicide and hands the couple the ending Shakespeare denied them.',
      evidence:
        'Taylor has said she wrote the song in about twenty minutes on her bedroom floor, using Romeo and Juliet as the frame but refusing its tragedy: "I thought, why can\'t you make it a happy ending and put a key change in the song and turn it into a marriage proposal?" The finished lyric ends not with a tomb but with a proposal, and the music literally lifts a whole step at the payoff — the key change she described built into the song. It is a reading about craft and literary source, not about who the song is written for.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki(
          'Love_Story_(Taylor_Swift_song)',
          'Love Story (Taylor Swift song)',
          'documents the ~20-minute writing, the Romeo and Juliet source, and the rewritten marriage-proposal ending',
        ),
        {
          source_url: 'https://www.songfacts.com/facts/taylor-swift/love-story',
          source_title: 'Love Story by Taylor Swift',
          publisher: 'Songfacts',
          source_type: 'reputable_press',
          accessed_at: '2026-07-27',
          reliability_score: 3,
          excerpt: null,
          notes: 'carries her "happy ending… key change… marriage proposal" quote verbatim',
        },
      ],
    },
    {
      slug: 'change-underdog-anthem',
      kind: 'theory',
      title: '"Change" is the underdog-label anthem',
      claim:
        'The reading — in Taylor\'s own words — that "Change" isn\'t a breakup song but an underdog anthem: she wrote it about being sixteen on the smallest label in Nashville, willing her tiny team to beat the giants, and only later did an Olympics broadcast make it about athletes.',
      evidence:
        'Taylor has called it plainly "an underdog story," written "about being on a small record label and being a 16 year-old girl and having a lot of odds against all of us" — Big Machine against the Nashville majors, the feeling of "when are we going to get a fighting chance?" She finished it around her 2007 CMA Horizon Award win, watching label head Scott Borchetta react. NBC then chose it for the 2008 Summer Olympics and the AT&T Team USA Soundtrack, which she found fitting but unexpected: "it\'s kind of crazy to think that the Olympics chose this." The entry is about the song\'s stated meaning and rollout, not any relationship.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki(
          'Change_(Taylor_Swift_song)',
          'Change (Taylor Swift song)',
          'quotes her "underdog story" / "smallest record label in Nashville" framing and the 2008 Olympics selection',
        ),
        {
          source_url: 'https://www.songfacts.com/facts/taylor-swift/change',
          source_title: 'Change by Taylor Swift',
          publisher: 'Songfacts',
          source_type: 'reputable_press',
          accessed_at: '2026-07-27',
          reliability_score: 3,
          excerpt: null,
          notes: 'carries her "small record label… 16 year-old girl… odds against all of us" quote and the Olympics/AT&T Team USA use',
        },
      ],
    },
  ],
};
