// Vault theories/easter eggs — Red era. Liner-note friendship code and the
// "From the Vault" word-puzzle reveal. All URLs verified 2026-07-08.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — these entries stick to documented
// puzzle mechanics and a friendship dedication, not romantic-subject guessing.

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
  eraSlug: 'red',
  theories: [
    {
      slug: 'twenty-two-liner-note-code',
      kind: 'easter_egg',
      title: 'A liner-note code names the friends behind "22"',
      claim:
        'The 2012 Red CD booklet hid a capitalization code inside "22" that decodes to "ASHLEY DIANNA CLAIRE SELENA" — a shout-out to the real friends the song\'s carefree night was inspired by.',
      evidence:
        'Following the same hidden-capital-letters technique used on her earlier album booklets, the "22" lyric sheet\'s decoded message names four friends rather than a romantic subject, matching the song\'s own framing as a friendship anthem about a birthday night out.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
          source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          notes: 'catalogs the confirmed liner-note codes across her early albums, including Red',
        },
      ],
    },
    {
      slug: 'vault-track-word-puzzle-reveal',
      kind: 'easter_egg',
      title: 'A word puzzle unlocks the Red (Taylor\'s Version) vault tracks',
      claim:
        'On Aug. 5, 2021, Swift posted an interactive word-puzzle video across social media that, once solved, revealed the "From the Vault" collaborators and titles — including Chris Stapleton, Phoebe Bridgers, "Babe," "Better Man," and the All Too Well (10 Minute Version) — ahead of the album\'s release.',
      evidence:
        'The puzzle format built on the anagram-teaser approach from the Fearless re-record, this time rewarding fans who solved it with a bonus image. All of the revealed information — the featured artists and track titles — matched the official track list confirmed at release.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:vault-track-anagram-reveal'],
      sources: [
        wiki('Red_(Taylor%27s_Version)', "Red (Taylor's Version)", 'documents the word-puzzle reveal of vault tracks and features'),
      ],
    },
  ],
};
