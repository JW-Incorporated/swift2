// ⚠️ STRAWMAN — NOT PRODUCT CONTENT. This is a small placeholder taxonomy +
// mapping so the matcher has typed, validated fixture data and Joey has a
// concrete example of the authoring shape to react to. The real taxonomy and
// song↔mood mapping are CONTENT-track editorial work (Joey's), authored as
// seed data like the rest of the Vault. Nothing in any app imports this file;
// it must not ship to users as-is.
// See docs/proposals/2026-07-07-chatbots-architecture.md §3.
import type { MoodTaxonomy, SongMoodTag } from './types';

export const STRAWMAN_MOOD_TAXONOMY: MoodTaxonomy = {
  version: 0, // version 0 = strawman; the first real authored taxonomy is 1
  moods: [
    {
      slug: 'heartbreak-2am',
      label: 'Crying at 2am',
      prompt: "I'm heartbroken and want to feel understood",
      keywords: [
        'sad',
        'crying',
        'heartbroken',
        'heartbreak',
        'breakup',
        'lonely',
        'devastated',
        'crying at 2am',
        'miss him',
        'miss her',
      ],
    },
    {
      slug: 'villain-era',
      label: 'Villain era',
      prompt: "I'm angry and done being nice about it",
      keywords: [
        'angry',
        'furious',
        'betrayed',
        'revenge',
        'petty',
        'villain era',
        'done with him',
        'done with her',
      ],
    },
    {
      slug: 'hopelessly-in-love',
      label: 'Hopelessly in love',
      prompt: "I'm falling for someone and it's all I can think about",
      keywords: ['in love', 'crush', 'butterflies', 'smitten', 'romantic', 'adore', 'falling for'],
    },
    {
      slug: 'main-character',
      label: 'Main character energy',
      prompt: "I'm feeling myself and nothing can stop me",
      keywords: [
        'confident',
        'unstoppable',
        'iconic',
        'bold',
        'main character',
        'feeling myself',
        'on top of the world',
      ],
    },
    {
      slug: 'nostalgic',
      label: 'Nostalgic',
      prompt: "I'm missing how things used to be",
      keywords: [
        'nostalgic',
        'nostalgia',
        'memories',
        'childhood',
        'growing up',
        'miss the old days',
        'simpler times',
      ],
    },
    {
      slug: 'cozy-quiet',
      label: 'Cozy and quiet',
      prompt: 'I want something calm for a rainy afternoon',
      keywords: [
        'cozy',
        'calm',
        'quiet',
        'rainy',
        'autumn',
        'fall',
        'peaceful',
        'wrapped in a blanket',
      ],
    },
    {
      slug: 'hype',
      label: 'Getting ready to go out',
      prompt: 'I need something loud while I get ready',
      keywords: ['hype', 'party', 'dancing', 'excited', 'fun', 'getting ready', 'going out'],
    },
    {
      slug: 'what-could-have-been',
      label: 'What could have been',
      prompt: "I keep wondering how it would've gone differently",
      keywords: [
        'regret',
        'wondering',
        'wistful',
        'what if',
        'could have been',
        'the one that got away',
      ],
    },
  ],
} as const;

export const STRAWMAN_SONG_MOOD_TAGS: readonly SongMoodTag[] = [
  { eraSlug: 'red', trackTitle: 'All Too Well', moodSlug: 'heartbreak-2am', weight: 3 },
  { eraSlug: 'red', trackTitle: 'All Too Well', moodSlug: 'nostalgic', weight: 2 },
  { eraSlug: 'evermore', trackTitle: 'champagne problems', moodSlug: 'heartbreak-2am', weight: 3 },
  { eraSlug: 'folklore', trackTitle: 'my tears ricochet', moodSlug: 'heartbreak-2am', weight: 2 },
  { eraSlug: 'tortured-poets', trackTitle: 'loml', moodSlug: 'heartbreak-2am', weight: 3 },
  {
    eraSlug: 'reputation',
    trackTitle: 'Look What You Made Me Do',
    moodSlug: 'villain-era',
    weight: 3,
  },
  { eraSlug: 'speak-now', trackTitle: 'Better Than Revenge', moodSlug: 'villain-era', weight: 2 },
  { eraSlug: 'midnights', trackTitle: 'Vigilante Shit', moodSlug: 'villain-era', weight: 2 },
  { eraSlug: 'lover', trackTitle: 'Lover', moodSlug: 'hopelessly-in-love', weight: 3 },
  { eraSlug: 'speak-now', trackTitle: 'Enchanted', moodSlug: 'hopelessly-in-love', weight: 2 },
  { eraSlug: 'fearless', trackTitle: 'Love Story', moodSlug: 'hopelessly-in-love', weight: 2 },
  { eraSlug: 'midnights', trackTitle: 'Bejeweled', moodSlug: 'main-character', weight: 3 },
  { eraSlug: '1989', trackTitle: 'Shake It Off', moodSlug: 'main-character', weight: 2 },
  { eraSlug: '1989', trackTitle: 'Shake It Off', moodSlug: 'hype', weight: 2 },
  { eraSlug: 'fearless', trackTitle: 'The Best Day', moodSlug: 'nostalgic', weight: 3 },
  { eraSlug: 'folklore', trackTitle: 'seven', moodSlug: 'nostalgic', weight: 2 },
  { eraSlug: 'speak-now', trackTitle: 'Long Live', moodSlug: 'nostalgic', weight: 2 },
  { eraSlug: 'folklore', trackTitle: 'cardigan', moodSlug: 'cozy-quiet', weight: 2 },
  { eraSlug: 'evermore', trackTitle: "'tis the damn season", moodSlug: 'cozy-quiet', weight: 3 },
  { eraSlug: 'red', trackTitle: '22', moodSlug: 'hype', weight: 3 },
  { eraSlug: 'lover', trackTitle: 'Cruel Summer', moodSlug: 'hype', weight: 2 },
  { eraSlug: 'folklore', trackTitle: 'the 1', moodSlug: 'what-could-have-been', weight: 3 },
  {
    eraSlug: 'evermore',
    trackTitle: 'right where you left me',
    moodSlug: 'what-could-have-been',
    weight: 2,
  },
];
