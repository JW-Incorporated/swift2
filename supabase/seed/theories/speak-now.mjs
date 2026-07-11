// Vault theories/easter eggs — Speak Now era. Liner-note codes and the
// (Taylor's Version) track-list reveal. All URLs verified 2026-07-08.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — coverage of songs widely rumored to be
// about specific exes (e.g. "Dear John") is deliberately excluded here;
// these entries stick to documented puzzle mechanics and her own
// life events, not romantic-subject guessing.

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
  eraSlug: 'speak-now',
  theories: [
    {
      slug: 'never-grow-up-liner-note-code',
      kind: 'easter_egg',
      title: 'A liner-note code confirms when she moved out',
      claim:
        'The 2010 Speak Now CD booklet hid a capitalization code inside "Never Grow Up" that decodes to "MOVED OUT IN JULY" — a real detail about Swift leaving her family\'s home, matching the song\'s own coming-of-age theme.',
      evidence:
        'Using the same hidden-capital-letters technique found across her early album booklets, the "Never Grow Up" lyric sheet\'s decoded phrase lines up with Swift\'s own account of moving into her first apartment that July, turning a lyric-sheet puzzle into a factual footnote on the song.',
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
          notes: 'catalogs the confirmed liner-note codes across her early albums, including Speak Now',
        },
      ],
    },
    {
      slug: 'speak-now-tv-tracklist-reveal',
      kind: 'easter_egg',
      title: 'The Speak Now (Taylor\'s Version) track list drops on social media',
      claim:
        'Swift unveiled the full Speak Now (Taylor\'s Version) track list, including its "From the Vault" songs, directly via social media on June 5, 2023, ahead of the album\'s July 7, 2023 release — continuing her established pattern of announcing re-record vault tracks in a dedicated reveal moment rather than a traditional press release.',
      evidence:
        'Fearless and Red (Taylor\'s Version) vault tracks had each been revealed through a cryptic scrambled-word "vault" puzzle video fans had to decode. Speak Now (TV) skipped the puzzle: a single, fan-facing announcement post named every vault track and its guest directly, rather than a label press cycle — a simplification of the earlier playbook, not a repeat of it.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:vault-track-anagram-reveal', 'red:vault-track-word-puzzle-reveal'],
      sources: [
        wiki("Speak_Now_(Taylor%27s_Version)", "Speak Now (Taylor's Version)", 'documents the June 5, 2023 track-list announcement and July 7 release date'),
      ],
    },
  ],
};
