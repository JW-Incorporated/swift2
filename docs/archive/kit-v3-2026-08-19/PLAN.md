# PLAN.md — Mood bot: stop over-refusing intoxication and blunt moods

Branch: `fix/mood-over-refusal` off up-to-date `main`.

## The bug, precisely

`POST /api/mood` with "im drunk" returns `kind:'refusal'` (Block 6,
`REFUSAL_MESSAGE`). Traced to two independent causes, one per path:

- **Model path (production, key present).** `route.ts:222` returns Block 6 when
  and only when the model sets `out_of_scope:true`. The classifier prompt
  (`mood-client.ts:67-95`) tells the model to set that flag for "a message that
  is plainly not about a feeling at all". "im drunk" is a physical/emotional
  state with no listed axis, so the model reads it as not-a-feeling. **There is
  no blocklist entry for alcohol anywhere** — this is live model judgment.
- **Degraded path (no key — the documented local/preview state).**
  `keywordQuery("im drunk")` hits zero axis keywords and zero idiom seeds →
  empty vector → `hasSignal()` false → `kind:'unclear'` (`route.ts:239`). Not a
  refusal, but it reads as one to a user.

Both must be fixed or the bug survives in one environment.

## Architecture — read before touching anything

The model is a **classifier, not a writer**. One model call
(`mood-client.ts:167`, via `classifyMood`, called once at `route.ts:200`). It
emits 8 mood axes + `crisis` + `out_of_scope` through a **forced tool call**
(`tool_choice: {type:'tool', name:'record_mood'}`) and is instructed "Do not add
prose." Song selection is deterministic TypeScript (`mood-match.ts`) over
precomputed vectors (`song-moods.generated.ts`). The sentence under each song is
`pick.oneLiner`, precomputed catalogue prose rendered into a React card
(`MoodSongCard.tsx:31`). The model's text never reaches the DOM.

**Consequences that override parts of the original brief:**

- No catalog goes in the prompt. Selection cannot hallucinate a track — it is
  array access over 244 real records. Do not rebuild this as catalog-in-prompt.
- No output format to specify. The tool schema is the format.
- No bot "voice" to write. User-facing copy lives in `mood-safety.ts`.
- `temperature` is not set and must not be: (a) `claude-sonnet-5` rejects
  non-default sampling params with a 400, and (b) variety in a classifier makes
  recommendations jitter for identical input. Determinism is correct here.

## Files touched

| File | Change |
|---|---|
| `apps/web/lib/longlive/mood-prompt.ts` | **NEW.** `SYSTEM_PROMPT` moved out of code, with the permissiveness section rewritten |
| `apps/web/lib/longlive/mood-client.ts` | Import the prompt; correct the stale `cache_control` comment |
| `apps/web/lib/longlive/mood-keywords.ts` | Add intoxication / party / blunt-state vocabulary so the degraded path yields a vector |
| `apps/web/lib/longlive/mood-battery.ts` | **NEW.** The 10 acceptance cases as data, with expected `kind` |
| `apps/web/app/api/mood/route.test.ts` | Assert the battery on the key-free path |
| `scripts/check-mood-battery.mjs` | **NEW.** Runs the battery against the live route; prints a transcript |
| `MOODBOT.md` | **NEW.** How to add songs and re-score moods |

Nothing under `clown-*`. Confirmed zero shared imports — a mood-only change
cannot reach Clownbot except by editing the wrong file by mistake.

## Steps

**1. Branch.** `git checkout main && git pull --ff-only && git checkout -b fix/mood-over-refusal`
*Verify:* `git rev-parse --abbrev-ref HEAD` prints `fix/mood-over-refusal`.

**2. Extract the prompt verbatim** into `mood-prompt.ts`; `mood-client.ts`
imports it. No wording change in this step.
*Verify:* `npm test --workspace=@swift2/web -- mood` passes unchanged.

**3. Rewrite the `out_of_scope` section.** Keep the `crisis` section as-is — it
is already narrow, well-reasoned, and clinically grounded (`mood-safety.ts:92+`).
The change is to `out_of_scope` only:
- Being drunk, hungover, high, wired, exhausted, sick with nerves is a **state
  description** and always scores.
- Partying, exes, revenge fantasies, pettiness, messy choices, profanity, being
  fired, crying in a car — all in scope. Half the catalogue is about these.
- Never set `out_of_scope` because a mood is negative, unhealthy, or unflattering.
- Reserve `out_of_scope` for: an actual request for medical/legal/financial
  advice, or a message with no readable feeling (a factual question, a coding
  request, an instruction aimed at the bot itself).
- When unsure, `out_of_scope:false` and score what is there. Never refuse for
  ambiguity — that is what `UNCLEAR_MESSAGE` is for.
*Verify:* step 6.

**4. Add degraded-path vocabulary** to `mood-keywords.ts`: `drunk, tipsy,
buzzed, wasted, hammered, tequila, hungover, hanging` and the blunt states
`feral, unhinged, wired, over it, done`.
*Judgment call, stated:* intoxication maps to **energy-high + catharsis**, not
to joy — "im drunk" is as often maudlin as celebratory, and catharsis is the
axis that spans both. Hungover maps to low energy + low valence.
*Verify:* a unit test asserting `hasSignal(keywordQuery('im drunk'))` is true.

**5. Codify the battery** (`mood-battery.ts` + route test). Cases 1–7 expect
`matches`; 8–9 expect `refusal`; 10 expects `crisis`. Workflow rule 8 — this is
the third time this repo has hand-run a refusal check, so it becomes a file.
*Verify:* `npm test --workspace=@swift2/web -- mood` green.

**6. Run the battery live** against `POST /api/mood`.
*Trap:* Joey's dev server may own port 3000 and an agent has killed it before.
Start on **3100** (`npm run dev --workspace=@swift2/web -- -p 3100`) and never
kill a process this session did not start.
*Verify:* all ten cases match expectation. Any of 1–7 returning `refusal`,
`unclear`, a lecture, or a wellness disclaimer = step 3 is not done. **Max two
revision rounds** (CLAUDE.md); a third means the approach is wrong, not the
wording.

**7. Measure the prompt.** `messages.count_tokens` on the final system prompt.
`claude-sonnet-5`'s cache minimum is **1024 tokens**. If the prompt clears it,
`cache_control` starts working and `usage.cache_read_input_tokens` goes above
zero on the second identical call — report the real number. If it does not
clear it, say so plainly and leave the annotated no-op in place rather than
pretending caching is active.

**8. `MOODBOT.md`** — seed → `sync-song-moods.mjs` → `check:generated`. Must
state that `*.generated.ts` is never hand-edited.

**9. Full suite + typecheck.** `npm test`, then
`npm run typecheck --workspace=@swift2/web` (repo-wide typecheck is red on
`apps/mobile` — pre-existing, not ours).

## Out of scope — deliberately not doing

- **Rebuilding the catalog into the system prompt.** Would replace a working
  deterministic matcher with model guesswork and make hallucinated tracks
  possible for the first time.
- **Switching to a Haiku-class model.** The brief asks for it, and the
  classification work would suit it — but this model call also produces the
  `crisis` flag, which `route.ts:213` relies on as defense in depth behind the
  keyword check. At the 200/day cap the saving is a few dollars a month, which
  does not buy a downgrade of a safety judgment. **One-line change in
  `mood-client.ts:32` if Joey wants it; his call, not mine.**
- **Scoring the 82 unscored songs** (all of `tloas`/Showgirl included). A real
  gap — the bot cannot recommend a Showgirl song to anyone — but it is content
  authoring, not a refusal bug. Separate job.
- **Weakening the bereavement gate** (`mood-match.ts:40-48`, issue #1984) or the
  crisis prompt section. Both stay.

## Founder gate

`docs/content-ops/mood-chat-safety-language.md` gates user-facing copy.
`REFUSAL_MESSAGE` and `UNCLEAR_MESSAGE` already read as warm redirects and I am
**not** rewording them. If step 6 shows the copy is the problem rather than the
routing, that goes to Joey rather than into the diff.
