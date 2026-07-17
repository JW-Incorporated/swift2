// Vault theories/easter eggs — Lover era. All URLs verified 2026-07-08.

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
  eraSlug: 'lover',
  theories: [
    {
      slug: 'butterfly-mural',
      kind: 'easter_egg',
      title: 'The butterfly mural that announced the era',
      claim:
        'Hours before "ME!" dropped in April 2019, a pastel butterfly mural by street artist Kelsey Montague appeared in Nashville — fans swarmed it, correctly reading it as the snake era molting into something new.',
      evidence:
        'Documented rollout stunt: the mural went up unannounced, fan detectives connected it to the countdown Taylor had posted, and she showed up at the wall herself. The butterfly-eats-snake beat inside the "ME!" video completed the metamorphosis arc.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [wiki('Me!', 'ME!', 'the mural stunt is documented in the single article')],
    },
    {
      slug: 'mastermind-doctrine',
      kind: 'easter_egg',
      title: 'The easter-egg doctrine, stated on the record',
      claim:
        'Not a theory — a confession: Taylor has said outright that she plants clues about future music years in advance, and that decoding them is a game she deliberately plays with fans.',
      evidence:
        'She described the practice in Lover-era interviews and later wrote it into a song ("Mastermind"). This record is the anchor for every other entry in this collection: the eggs are real, planted, and intended to be found — which is exactly why unconfirmed readings still need labels.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:liner-notes-hidden-messages'],
      sources: [
        wiki('Cultural_impact_of_Taylor_Swift', 'Cultural impact of Taylor Swift', 'documents her stated easter-egg practice'),
        wiki('Swifties', 'Swifties'),
      ],
    },
    {
      slug: 'me-video-chicks-painting',
      kind: 'easter_egg',
      title: "The 'ME!' video predicted the album's guest stars",
      claim:
        "A painting of the Dixie Chicks hangs on the wall of the 'ME!' video, spotted by fans within hours and read as a collab tease. Four months later the Chicks were on Lover, harmonizing on 'Soon You'll Get Better.'",
      evidence:
        "Egg roundups flagged the painting the day the video dropped in April 2019, months after Taylor had name-checked the group in her Elle essay — and the payoff shipped on the album that August. The same video gasped a real cat into existence: the kitten Brendon Urie offers her became Benjamin Button, adopted from the shoot.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['lover:mastermind-doctrine'],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-me-video-easter-eggs-8509007/',
          source_title: "Taylor Swift's 'ME!' Video Easter Eggs: Album Title, Her Next Single & More",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
        {
          source_url: 'https://www.eonline.com/news/1035688/taylor-swift-s-me-music-video-all-the-hidden-easter-eggs-and-symbolism',
          source_title: "Taylor Swift's ''ME!'' Music Video: All the Hidden Easter Eggs and Symbolism",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
      ],
    },
    {
      slug: 'the-man-karma-graffiti',
      kind: 'easter_egg',
      title: "The subway wall in 'The Man' maps her whole catalog",
      claim:
        "The graffiti wall Tyler Swift walks past in 'The Man' is tagged with her album titles, a 'Missing: if found return to Taylor Swift' poster standing in for the stolen debut — and, largest of all, the word KARMA.",
      evidence:
        "Outlets catalogued the wall shot when the video dropped in February 2020, mid-fight over her masters — the graffiti read as a map of the back catalog Scooter Braun had just bought, with the 13th Street station sign as a bonus. The KARMA tag fed the long-running lost-album theory; no Karma album ever surfaced, but 'Karma' the song arrived on Midnights and she has kept the wink going since.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['midnights:karma-lost-album'],
      sources: [
        {
          source_url: 'https://www.marieclaire.com/celebrity/a31129779/easter-eggs-taylor-swift-the-man/',
          source_title: "Easter Eggs In Taylor Swift's 'The Man' Video Are Everywhere",
          publisher: 'Marie Claire',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
        {
          source_url: 'https://www.distractify.com/p/taylor-swift-the-man-music-video-easter-eggs',
          source_title: "7 Easter Eggs You Might Not Have Noticed in Taylor Swift's \"The Man\" Music Video",
          publisher: 'Distractify',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          excerpt: null,
          notes: null,
        },
      ],
    },
    {
      slug: 'lover-house-eras-map',
      kind: 'theory',
      title: 'Every room in the Lover house is an era',
      claim:
        "Fans read each room of the 'Lover' video's snow-globe house as one of her albums — the red room for Red, the hazy attic for reputation — with the starry ceiling revealed as Midnights, completing the house.",
      evidence:
        "The room-by-room mapping circulated for years before a viral TikTok matched every room to an album when Midnights was announced in 2022 and declared the house complete. Taylor liked the TikTok — E! and ABC Audio both covered it as a seeming nod of approval — but she has never confirmed the mapping outright, so the thumbs-up is as official as it gets.",
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['lover:mastermind-doctrine'],
      sources: [
        {
          source_url: 'https://www.eonline.com/news/1344281/taylor-swift-approves-of-this-theory-about-her-10-albums',
          source_title: 'Taylor Swift Approves of This Theory About Her 10 Albums',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
        {
          source_url: 'https://digital.abcaudio.com/news/taylor-swift-seemingly-confirms-fan-theory-about-lover-house',
          source_title: 'Taylor Swift seemingly confirms fan theory about the "Lover" house',
          publisher: 'ABC Audio',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          excerpt: null,
          notes: null,
        },
      ],
    },
  ],
};
