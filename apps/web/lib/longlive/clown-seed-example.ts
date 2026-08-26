/**
 * The pre-filled worked example. Static, shipped, zero runtime cost.
 *
 * Captured 2026-08-13 by POSTing the real question below to the real route
 * handler (`apps/web/app/api/clown/route.ts`'s exported `POST`, invoked
 * directly with a constructed `Request` — same pattern `route.test.ts`
 * uses) with a live `ANTHROPIC_API_KEY`. Nothing below is hand-written: the
 * `answer` is the route's actual JSON response body, pasted verbatim —
 * every segment, every cited source id, and the delulu value exactly as the
 * live pipeline produced them. `theoryName` is likewise the route's real
 * output: `route.ts` calls `resolveTheoryName()` (`clown-names.ts`) against
 * the cited-only `sources` after the output gate, so a canonical registry
 * match wins over whatever the model proposed — here it resolved to "The
 * Twelve Doors". Regenerating this file means re-running
 * `scripts/capture-clown-seed.mjs "what's the deal with the orange doors?"`
 * and pasting the new output — never editing the prose by hand.
 *
 * QUESTION: "what's the deal with the orange doors?"
 *
 * CANDIDATE SELECTION (Joey, 2026-08-13): three grounded candidates were
 * captured — this one, "explain the twelve doors theory like I'm new here",
 * and "did she really buy her masters back?". The masters-buyback answer had
 * the cleanest retrieval, but it scored delulu 0 and opened with "this isn't
 * a clown theory, it's just documented fact" — a factual lookup, not a
 * demonstration of what a *clown* bot does. This one is a real fan theory,
 * scores delulu 2 (so the delulu indicator visibly does something on first
 * load), and its counterpoint beat — fans calling the "orange era" off
 * rhinestone glints on tour looks months before the promo confirmed it — is
 * exactly the "yes-and, then raise" move the bot exists to perform.
 */
import type { ClownAnswer } from './clown-answer';

export interface SeedExample {
  question: string;
  /** A REAL answer from the live pipeline, captured once and frozen. */
  answer: ClownAnswer;
}

export const SEED_EXAMPLE: SeedExample = {
  question: "what's the deal with the orange doors?",
  answer: {
    kind: 'take',
    // Captured before the agent loop (PLAN.md Stage 10) existed — no
    // investigation trail to show for this frozen example.
    investigation: [],
    theoryName: 'The Twelve Doors',
    segments: [
      {
        role: 'stance',
        text: 'The twelve orange doors are a real-world extension of the TLOAS orange-era branding, not a random gimmick — each door/QR code drop is basically a physical Easter egg hunt for album clues.',
      },
      {
        role: 'argument',
        text: 'The 2025-10-03 orange-doors-hunt itself confirms this: twelve doors, twelve cities, each QR-coded to a stylised clue video, which lines up perfectly with the orange-and-feathers visual identity already documented in [moment:vault-tloas-orange-sequins-and-feathers].',
      },
      {
        role: 'counterpoint',
        text: 'The color-coding was called way in advance by fans reading orange accents into late Eras Tour looks per [theory:tloas:orange-era-clues], which means the doors could just be marketing catching up to what fans already guessed — less a hidden code, more a victory lap.',
      },
      {
        role: 'aside',
        text: 'I called the orange era in a group chat once and then immediately lost the screenshot, so honestly I have no proof I did anything but the wig knows.',
      },
    ],
    delulu: 2,
    sources: [
      {
        id: 'lore:orange-doors-hunt',
        headline: 'Twelve orange doors in twelve cities',
        detail:
          'Twelve orange doors in twelve cities The Life of a Showgirl promo ran as a real-world scavenger hunt built with Google: twelve orange doors hidden in twelve cities, each with a QR code leading to a short stylised video of album clues. Peak modern egg-hunt — and, as it turned out, the thing that started the biggest fight the fandom has had with her team.',
        status: 'confirmed',
        date: '2025-10-03',
        sources: [
          {
            name: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-gen-ai-accusations-fans-promo-videos-rcna236025',
          },
          {
            name: 'PetaPixel',
            url: 'https://petapixel.com/2025/10/09/taylor-swift-accused-of-using-ai-for-life-of-a-showgirl-promo-videos/',
          },
        ],
      },
      {
        id: 'moment:vault-tloas-orange-sequins-and-feathers',
        headline: 'Orange sequins and feathers',
        detail:
          'Orange sequins and feathers The visual language: burnt-orange rhinestones, marabou, and spotlight sparkle. “Showgirl orange” was the era’s signal before a note dropped: Taylor told Jason Kelce on New Heights that she chose orange because it captured how her Eras Tour life felt — “effervescent” — and had teased it for months, exiting each Eras stage through an orange door. The rhinestones-and-feathers language was set by the album’s imagery, shot by Mert Alas and Marcus Piggott and styled by Taylor’s longtime stylist Joseph Cassell Falconer: a custom burnt-orange, ombré-sequined Gucci gown with opera gloves anchors the portrait suite, while one alternate cover revived a feather-trimmed, rhinestone-encrusted Bob Mackie costume from the Las Vegas revue Jubilee! — Mackie being the designer synonymous with Cher and the Vegas stage. The self-directed “Fate of Ophelia” video carried the same palette across its showgirl tableaux.',
        status: 'confirmed',
        date: '2025-10-01',
        sources: [
          {
            name: "Every Fashion Detail of Taylor Swift's 'The Life of a Showgirl'",
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
          },
          {
            name: "Taylor Swift's 'Life of a Showgirl' Album Cover Outfit, Explained",
            url: 'https://www.marieclaire.com/fashion/taylor-swift-life-of-a-showgirl-album-outfits-new-heights/',
          },
          {
            name: "Bob Mackie 'Blown Away' by Taylor Swift Wearing His Design on 'Showgirl' Cover",
            url: 'https://www.billboard.com/music/pop/bob-mackie-blown-away-taylor-swift-outfit-showgirl-cover-1236101495/',
          },
        ],
      },
      {
        id: 'theory:tloas:orange-era-clues',
        headline: 'The orange era, called before the announcement',
        detail:
          "The orange era, called before the announcement Through the TTPD stretch, TS12 watchers bet the next era's color was orange — reading glittery orange accents into late Eras Tour looks and posts. When The Life of a Showgirl arrived, the branding was orange head to toe. The album was announced on the New Heights podcast in August 2025 wrapped in glittering orange (and mint) — instantly validating months of color-watching. How much of the pre-announcement orange was planted versus pattern-matched has never been itemized, so the call is graded, not fully confirmed.",
        status: 'reported',
        date: 'undated',
        sources: [
          {
            name: 'The Life of a Showgirl',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
          },
        ],
      },
    ],
  },
};
