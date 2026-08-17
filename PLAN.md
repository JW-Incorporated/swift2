# PLAN.md — Score the 82 unscored songs

Branch: `feature/score-remaining-songs` off merged `main`.

## Why

162 of 244 songs carry mood scores. The other 82 carry only `slug/title/eraId/
youtubeId`, so the matcher can never surface them. **All of `tloas` is unscored
— no Life of a Showgirl song can reach any reader today.**

Joey's ruling (2026-08-17), after I wrongly filed this as needing his sign-off:
*"Why not assign them a mood score? Read what they are about and figure it
out."* Every song already carries the site's own researched prose. Deriving the
axes from it is reading comprehension against a fixed schema — work, not a
product decision.

## The gap, by era (none of these four has a seed file yet)

| Era | Unscored | New seed file |
|---|---|---|
| `evermore` | 17 | `supabase/seed/song-moods/evermore.mjs` |
| `midnights` | 22 | `supabase/seed/song-moods/midnights.mjs` |
| `ttpd` | 31 | `supabase/seed/song-moods/ttpd.mjs` |
| `tloas` | 12 | `supabase/seed/song-moods/tloas.mjs` |

The other eight eras are fully scored. **One agent per era, one new file each —
zero file contention, so all four run in parallel.**

## The authoring contract (binding, enforced by the generator)

```js
export default {
  eraSlug: 'evermore',
  songs: [
    {
      slug: 'willow',
      moods: {
        heartbreak: 0.2, anger: 0.05, nostalgia: 0.4, joy: 0.5,
        calm: 0.15, defiance: 0.4, longing: 0.55, catharsis: 0.7,
      },
      energy: 0.75,
      valence: 0.6,
      useCase: ['wanting someone like a spell', 'a pull you follow anyway'],
      oneLiner: 'Devotion bent like the tree it is named for.',
    },
  ],
};
```

- **All 8 axes required**, every one present, `0..1`, 2 decimals. An axis with
  no presence gets a low score (0.02–0.05), not omission.
- `energy` (0 still .. 1 driving) and `valence` (0 sad .. 1 happy) required.
- `useCase`: 1–6 phrases, **≤60 chars each**, noun/gerund phrases.
- `oneLiner`: required, **≤160 chars**, one sentence.
- **NO LYRICS, EVER.** `oneLiner` and `useCase` are ORIGINAL prose. The
  generator rejects any internal line break (`looksLikeLyric`) and the redlines
  file a P0. This is the hardest rule in the repo's content layer.
- **Score from the track's EXISTING researched `note` / `discussion` /
  `facts.themes` in `tracks.generated.ts` — never invent a fact about a song to
  justify an axis.**

## Steps

**1.** Four parallel agents, one era each, creating one seed file each.
*Verify:* each file parses and self-checks its own constraints.

**2. I run the generator ONCE, after all four land** — `npm run sync:content`.
Agents must NOT run it: four processes writing `song-moods.generated.ts`
concurrently would race.
*Verify:* `npm run check:generated` clean.

**3. Verify by EXECUTION against the real matcher**, not by reading scores.
Confirm a Showgirl song actually surfaces for a plausible mood, and that the
scored count goes 162 → 244.
*Verify:* a probe calling `matchMoods` directly.

**4.** Full suite + `npm run typecheck --workspace=@swift2/web`, then PR.
**Joey merges.**

## Traps

- `*.generated.ts` is NEVER hand-edited. Author the seed; run the generator.
- `check:generated` fails CI on drift, so the generated file must be committed
  in the same change as the seeds.
- The `oneLiner` is user-facing copy under every card. Joey may want to read
  all 82 before they are live — offer, do not assume.
- Where a song's reading is genuinely contested, score from the site's own
  description rather than personal interpretation, so the catalogue stays
  self-consistent. Flag real ambiguity rather than silently picking.
