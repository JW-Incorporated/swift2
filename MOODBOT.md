# MOODBOT.md — Mood Chat: songs, scores, and the classifier prompt

How the Mood Chat feature (`/api/mood`) gets its data, and the one rule that
protects it: **never hand-edit a generated file.**

## Where song data actually lives

- **Track catalogue (source):** `supabase/seed/tracks/**` — one file per era,
  hand-authored.
- **Mood scores (source):** `supabase/seed/song-moods/**` — one file per era
  (`1989.mjs`, `debut.mjs`, `fearless.mjs`, `folklore.mjs`, `lover.mjs`,
  `red.mjs`, `reputation.mjs`, `speak-now.mjs`, plus `_example.mjs` and a
  `README.md`). Each song gets a score 0..1 on the eight mood axes below.

**GENERATED — never hand-edit:**

- `apps/web/lib/longlive/tracks.generated.ts`
- `apps/web/lib/longlive/song-moods.generated.ts`

These are built FROM the seed directories above by:

- `scripts/sync-longlive-tracks.mjs` (tracks)
- `scripts/sync-song-moods.mjs` (mood scores)

Both run as part of the `prebuild` chain in `apps/web/package.json`, so a
normal `npm run build` regenerates them automatically. If you change a seed
file and don't rebuild, `npm run check:generated`
(`scripts/check-generated-in-sync.mjs`) fails on the drift — that check is the
guardrail, run it after any seed edit.

To add or re-score a song: edit the seed file under `supabase/seed/**`, then
either build (`prebuild` regenerates) or run the sync script directly, then
run `check:generated` to confirm the generated file matches.

## The eight mood axes

Every song is scored 0..1 on each (`apps/web/lib/longlive/types.ts`,
`MOOD_AXES` — the single source of truth; the generator, the validator, and
the matcher all derive their axis list from it):

`heartbreak`, `anger`, `nostalgia`, `joy`, `calm`, `defiance`, `longing`,
`catharsis`

Plus two coarse, optional hints layered on top: `energy` (0 still .. 1
driving) and `valence` (0 sad .. 1 happy).

## Current coverage gap

**82 of 244 songs are currently unscored — all of the `tloas` (Showgirl) era.**
There is no `supabase/seed/song-moods/tloas.mjs` file yet. Until one is added,
the bot cannot recommend a Showgirl song to anyone, no matter how well it
reads the reader's mood. This is a content-authoring gap, not a classifier bug
— scoring those songs is a separate job from anything in this file's
"how it works" section.

## The classifier prompt

The system prompt the model classifier uses lives in its own file,
`apps/web/lib/longlive/mood-prompt.ts` (`MOOD_SYSTEM_PROMPT`), separate from
the request code in `apps/web/lib/longlive/mood-client.ts`. This means the
wording — what counts as a scoreable feeling, what counts as `out_of_scope`,
what counts as `crisis` — can be edited without touching the fetch/retry/
validation logic around it. The model is a **classifier, not a writer**: it
reads one message and returns eight axis scores plus `crisis`/`out_of_scope`
through a forced tool call; it never names or searches for a song. Song
selection is deterministic TypeScript (`mood-match.ts`) over the precomputed
`song-moods.generated.ts` vectors, so the model cannot hallucinate a track.

When there is no `ANTHROPIC_API_KEY` (the normal local/preview state), the
route falls back to the free keyword matcher in `mood-keywords.ts` instead —
same eight axes, derived from a hand-built lexicon rather than the model.
