# Song mood scores — Mood Chat catalogue

Source data for the **Mood Chat** feature
(`docs/proposals/2026-07-19-mood-chat.md`). One `.mjs` file per era; each
scores real tracks on the eight mood axes so the deterministic matcher can rank
them. **The model never searches the catalogue** — matching is pure TypeScript
over these numbers, which is what makes it deterministic, free at runtime, and
unable to invent a song that doesn't exist.

## How it flows

```
tracks/<era>.mjs  ─┐
                   ├─► scripts/sync-song-moods.mjs ─► apps/web/lib/longlive/song-moods.generated.ts
song-moods/<era>.mjs ┘   (merge by slug, validate)
```

- The **song list** is the track seeds (`supabase/seed/tracks/**`). Every
  catalogue entry is a real track; `youtubeId` is that track's own
  oEmbed-verified id.
- The files **here** add the mood **scores**. A song with no score yet ships
  unscored (a placeholder the matcher skips). Stage 2 fills them in, ~60 songs
  per PR.

After editing anything here, run `npm run sync:content` and commit the
regenerated `song-moods.generated.ts`; `npm run check:generated` enforces it.

## File shape

See `_example.mjs`. Each file is `{ eraSlug, songs: [...] }`; each song is
keyed by the track `slug` from `tracks/<era>.mjs` and carries:

| field      | type                | rule                                            |
| ---------- | ------------------- | ----------------------------------------------- |
| `slug`     | string              | must resolve to a real track in this era        |
| `moods`    | 8 axes → number     | all axes present, each `0..1`                   |
| `energy`   | number              | `0..1` (still → driving)                        |
| `valence`  | number              | `0..1` (sad → happy)                            |
| `useCase`  | string[]            | 1–6 original phrases, ≤ 60 chars each           |
| `oneLiner` | string              | one original sentence, ≤ 160 chars              |

The eight axes: `heartbreak, anger, nostalgia, joy, calm, defiance, longing,
catharsis`.

## Hard rules

1. **No lyrics, ever.** `oneLiner` and `useCase` are ORIGINAL prose. The
   generator rejects verse-shaped text (any line break) and the redlines file a
   P0 on it.
2. **Never invent a fact** about a song to justify an axis. Score from the
   track's existing researched `note` + article body only.

Any violation fails the build (`sync-song-moods.mjs` exits non-zero) and
`npm run validate:content` reports it before you get that far.
