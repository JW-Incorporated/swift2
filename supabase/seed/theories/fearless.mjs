// Vault theories/easter eggs — Fearless era. Liner-note capitalization codes
// and the "From the Vault" reveal puzzle. All URLs verified 2026-07-08.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — these entries stick to documented
// puzzle mechanics and a family tribute, not romantic-subject guessing.

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
      relatedSlugs: [],
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
  ],
};
