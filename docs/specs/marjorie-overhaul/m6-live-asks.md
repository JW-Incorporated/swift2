# M6 — Live asks between the bots (event-driven L1 answers)

Written 2026-09-13 by the session that built and proved M5, from Joey's
decision in chat the same day ("For #2 I agree, yes to all"; recorded on
#4180 and in `docs/decisions.md`). It follows the architect agent's
evaluation (logged in `STATE.md`). Siblings stay the source of truth:
`l1-loop.md` for how asks are filed, `m5-chat.md` for the chat loop. This
spec covers only how an ask gets answered quickly. Epic #4180.

## Behavior you will see

- **Marjorie asks Tree** (from her brief's `For Tree:` slot, or because you
  asked her something in chat that needs Tree). Within about five minutes of
  the ask being filed, Tree has answered on the issue. It either closes the
  issue or says why it can't. If the ask came from your message in
  `#longlive-marjorie`, one line lands in that thread: `Tree answered #N:
  <first sentence> — <link>`.
- **Tree asks Marjorie** (the Monday plan's `needsFromMarjorie` slot).
  Marjorie answers within about five minutes. She acts inside her charter
  (a human action by PR, a desk ticket, a routine re-run), comments what she
  did, and closes.
- **Tree answers now and acts Monday.** If an ask needs a calendar change,
  Tree says so, leaves a proposal comment on the latest plan PR (as in chat),
  and the change lands in Monday's plan. Tree never opens a plan PR, never
  touches `social/queue/`, and never posts in `#longlive-tree`.
- **The briefs are unchanged.** Asks still show in both briefs with their
  age until closed. The scheduled receive steps stay as the fallback when
  a live answer did not run.

## Data

- **The ask** is the L1 issue, unchanged: labels `tree-filed` + `desk:ops` or
  `marjorie-filed` + `desk:tree`, and the body marker `<!-- loop-ask:
  <key>[ contradicts=N] -->` (`scripts/marjorie/lib/loop-asks.mjs:47,164`). A
  filing is trusted only when its author is in `FILER_LOGINS` (`:36`) and the
  marker parses (`isLoopFiling`, `:173`). The briefs show only trusted
  filings (`selectAsksFor`, `:243`).
- **New marker field:** `thread=<discord thread id>`, set only on
  chat-originated asks, so the echo knows where to land. `parseMarker` must
  accept it; trust rules are unchanged.
- **Chat-originated ask slot.** Marjorie's chat agent no longer runs `gh
  issue create` for a `desk:tree` ask (today it does, `runner-prompts/
  marjorie-chat.md:74`, and the result has no marker, so Tree's brief never
  sees it). It writes `.scratch/out/chat-ask.json` — `{ "ask": …, "why": … }`,
  at most one per chat run and 300 characters — and a trusted `run:` step
  files it.
- **The answer** is one comment on the ask issue, written by a plain `run:`
  step from the agent's `.scratch/out/loop-answer.md` (≤600 characters),
  ending in `<!-- loop-answer: <bot> -->`. It never quotes founder text; the
  repo is public.

## Mechanics

1. **Dispatch from the three trusted filing steps, not from issue events.**
   GitHub starts no workflow from an event a `GITHUB_TOKEN` created. Every L1
   filing runs on that token, so `on: issues` would never fire. Each filing
   step therefore dispatches directly with `gh workflow run
   routine-loop-answer.yml -f bot=<addressee> -f issue=<N>`:
   - **Tree → Marjorie:** `routine-tree-weekly-plan.yml` `send-brief`, after
     `loop-asks.mjs file-tree` (`:253`), for each entry in `/tmp/loop.json`
     `filed[]` whose `created` is true. The job already has `actions: write`
     (`:117`).
   - **Marjorie → Tree:** `routine-marjorie-brief.yml` `deliver`, after
     `file-marjorie` (`:104`). `file-marjorie` must also report the filed
     number (today it rewrites the body only), and `deliver` gains `actions:
     write` (today `contents: read` + `issues: write`, `:74-76`).
   - **Chat → Tree:** `routine-marjorie-chat.yml` `finish` reads
     `chat-ask.json` from the `chat-reply` artifact, files it with a new
     `loop-asks.mjs file-chat` (marker `thread=`, the same trust and
     idempotency key), then dispatches. `finish` gains `issues: write` (it
     has it) and `actions: write`.

   A failed dispatch is a warning, never a failed brief. The ask is still
   answered by the scheduled receive step.
2. **`routine-loop-answer.yml`** is dispatch-only. Inputs are `bot`
   (`marjorie`|`tree`) and `issue`. `run-name: <Bot> answers #<N>`, and the
   concurrency group is `loop-answer-<issue>`. Jobs:
   - **`gate`** (plain `run:`, `GITHUB_TOKEN`): `loop-answer.mjs gate`
     proceeds only if all of these hold:
     - the issue is open;
     - it is a trusted loop filing;
     - it carries the addressee's desk label;
     - there is no prior `loop-answer:` comment.

     Otherwise it outputs `skip=true`.
   - **`run`** (the `routine-template.yml` agent job, `github.run_attempt ==
     '1'`, `allowed_bots: github-actions`): Opus, `max_turns: 15`, prompt
     `runner-prompts/loop-answer-<bot>.md`. Tools and credentials match
     that bot's chat routine. Marjorie keeps `SOCIAL_POSTER_PAT` plus the
     dispatch token and acts inside her charter. Tree gets `Bash(gh:*)`,
     `Bash(node:*)` and read tools only. The agent writes
     `.scratch/out/loop-answer.md` and, optionally,
     `.scratch/out/loop-close` containing `close`.
   - **`post`** (plain `run:`, `GITHUB_TOKEN`, first attempt only): comments
     the answer with its marker. It closes the issue only if the agent asked
     and the answering bot may close it:
     - Marjorie closes `tree-filed` + `desk:ops` (`docs/agents/marjorie.md:345-349`);
     - Tree closes `marjorie-filed` + `desk:tree` (`docs/agents/tree.md:352-356`).
   - **`echo`** (`environment: ops`, only when the marker has `thread=`): posts
     one line into that thread through `DISCORD_MARJORIE_WEBHOOK_URL` as
     Marjorie. `#longlive-marjorie` already carries "the Tree/Marjorie
     working thread" (`docs/decisions.md`, 2026-09-12 channel decision). Its
     text is the answer's first sentence, mention-neutralised with `ref:`
     lines defused (reuse `chat-post.mjs composePost`), plus the issue link.
3. **No loops.**
   - The answer runs have no filing path: no `loop-asks.mjs file-*` call,
     and both prompts forbid creating `tree-filed` or `marjorie-filed`
     issues.
   - The `gate` refuses any issue not authored by a `FILER_LOGINS` login, so
     an agent-made issue can never start an answer run.
   - Only the three trusted filing steps dispatch.
4. **Caps.**
   - Brief slots are unchanged: Tree ≤2 asks a week, Marjorie ≤1 a day,
     300 characters (`l1-loop.md:91-96`).
   - Chat-originated asks: ≤1 per founder message, and ≤3 per rolling 24 h.
     `file-chat` refuses beyond that, counting its own marker keys in the
     REST issues list; eventual, like L1's lookup.
   - One answer run per ask: the `gate` sees the `loop-answer:` marker.
5. **The fallback stays.** Tree's step 0.7 (`runner-prompts/
   tree-weekly-plan.md:33-60`) and Marjorie's receive step 3a (`marjorie-
   brief.md:45-47`) still read open asks. An ask a live run already answered
   and closed shows up there only as closed history.
6. **Cost.** Asks are capped, so a normal week has a handful of answer runs,
   each ≤15 Opus turns. Actions minutes are unbilled on this public repo.

## Acceptance criteria

- **Live, Marjorie → Tree:** a founder asks Marjorie in chat for something
  that needs Tree. Her reply names the filed ask. Tree's answer comment is
  on the issue within 10 minutes of filing, and one echo line is in the
  founder's thread. The issue carries the marker with `thread=` and shows in
  Tree's next brief.
- **Live, Tree → Marjorie:** the next Monday `needsFromMarjorie` ask, or a
  smoke run of `send-brief`'s dispatch against a synthetic `[M6 check]` ask,
  gets Marjorie's answer within 10 minutes.
- **No loop:** no answer run files an issue, shown by the issue history and
  a unit test. A second dispatch for the same issue skips at `gate`.
- **Unit tests:**
  - `file-chat`: caps, the `thread=` marker, trust, idempotency.
  - `parseMarker` with and without `thread=`.
  - `loop-answer.mjs`: `gate` (untrusted author, closed issue, wrong desk,
    already answered) and `post` (marker, close rights by bot, echo
    neutralisation).
  - Workflow text tests: no Discord secret in the agent job, first-attempt
    gating, `allowed_bots`.
- **MR1 untouched:** nothing here merges before the 2026-09-14 Monday cycle
  has run (Tree 10:00Z, Marjorie 12:00Z) and its evidence is on #4180.
- **Docs:**
  - `l1-loop.md`: "answers on its next run" becomes "answers when the ask is
    filed; the scheduled receive step is the fallback".
  - `MAP.md` rows.
  - `checkpoints.json` MR2 gains "≥1 live-answered ask each way".
  - Charters: mutation rights unchanged; one line naming the answer routine.

## Files affected

- **New:**
  - `.github/workflows/routine-loop-answer.yml`
  - `scripts/marjorie/loop-answer.mjs` + `.test.ts`
  - `docs/agents/runner-prompts/loop-answer-marjorie.md`
  - `docs/agents/runner-prompts/loop-answer-tree.md`
- **Edited:**
  - `scripts/marjorie/loop-asks.mjs` + `lib/loop-asks.mjs` (+ tests):
    `file-chat`, the `thread=` field, the filed number reported by
    `file-marjorie`
  - `.github/workflows/routine-tree-weekly-plan.yml` (dispatch step)
  - `.github/workflows/routine-marjorie-brief.yml` (`actions: write`,
    dispatch step)
  - `.github/workflows/routine-marjorie-chat.yml` (`finish` files the chat
    ask and dispatches)
  - `scripts/marjorie/chat-post.mjs` (the ask slot)
  - `docs/agents/runner-prompts/marjorie-chat.md` (the ask slot instead of
    `gh issue create` for `desk:tree`)
  - `docs/specs/marjorie-overhaul/l1-loop.md`
  - `docs/agents/marjorie.md`, `docs/agents/tree.md` (one line each)
  - `MAP.md`
  - `docs/plans/marjorie-overhaul/checkpoints.json`

## Open questions

- **The Hermes-VM relay** for instant pickup of founder messages is not in
  this spec. Joey approved it on 2026-09-13 (decisions 1–5), and it is wave
  M7, `m7-doorbell.md`. It is independent of M6 and composes with it: both
  edit the chat routines, so land one build before the other.
- **Model for Tree's answer runs.** Start on Opus with 15 turns; measure
  after two weeks, and consider Sonnet since Tree is read-mostly.
- **Marjorie's other chat filings** (`desk:build` and the rest) are not L1
  asks and stay as they are.
