<!--
social/lessons.md — the founder-feedback ledger (Tree Overhaul T5,
docs/specs/tree-overhaul/t5-lessons-ledger.md — read that spec for the full
mechanics: attribution, retirement, codification, the strategy-proposal
diff). Distilled every Monday by Tree's weekly run
(docs/agents/runner-prompts/tree-weekly-plan.md) from your ✏️/❌ reasons and
thread replies — you do not write it, but hand-editing it directly is fine
(a founder correcting a rule directly is a feature); keep the shape below
exactly if you do, since scripts/social/lib/lessons.mjs parses it.

One `###` block per rule, newest first, active rules above a trailing
`## Retired` section (omitted entirely while nothing is retired). Shape:

### L<NNN> — <imperative title, ≤80 chars, what Tree does, not what went wrong>

- **Status:** active | retired
- **First seen:** YYYY-MM-DD (PR #n)
- **Times fired:** <integer ≥ 1 — distinct founder ✏️/❌ events, not
  drafter consultations>
- **Last fired:** YYYY-MM-DD (PR #n)
- **Evidence:** [#n ✏️](url), [#n ❌](url), … — one link per firing
- **Codify:** #n | — | done (#n)
- **Superseded by:** check-drafts.mjs:<checkName> | L### | — (retired only)

**You said:** "<the founder's own words, verbatim — never paraphrased>"

**So I:** <the operative rule, one or two sentences a drafter can act on>

Tree reads every `active` rule before drafting (`tree-daily-draft.md`). Turning a
rule into a hard gate is Tree's explicit choice (S2, 2026-10-01): a rule fired 3
times with `Codify: —` gets a `codify:` issue filed only while
`social/strategy-params.json` has `lessons.autoCodify: true` (it ships `false`);
a rule quiet for 8 consecutive weeks across ≥10 briefs is retired, not deleted.
-->


### L003 — Judge every caption before the draft PR opens, and rewrite anything under 4

- **Status:** active
- **First seen:** 2026-11-16 (ask #6895)
- **Times fired:** 1
- **Last fired:** 2026-11-16 (ask #6895)
- **Evidence:** [#6895 ask](https://github.com/JW-Incorporated/swift2/issues/6895)
- **Codify:** #6890

**You said:** "Before opening any draft PR, run scripts/social/judge-drafts.mjs on your captions and rewrite each one scoring under 4 — all 7 judged drafts since 11-10 failed, mostly onVoice 3 for a news-recap middle, and we posted nothing after 11-09." (Marjorie, ask #6895 — not the owner; recorded here because it changes how every draft run works.)

**So I:** Judging is now a pre-flight step of the drafting run, not something that happens to the PR after it opens. Once the day's items are written, run `node scripts/social/judge-drafts.mjs <file.json> …` over them and read the four dimensions in `scripts/social/lib/judge-rubric.mjs` — `onVoice`, `specific`, `formula`, `notEmbarrassed`. Anything under 4 on any one of them is rewritten and re-judged in the same session, because `check-drafts.mjs` inside `social-tree-approve.yml` requires every judge score ≥4 and `social-draft-judge.yml` only dispatches approval when they all clear — a caption at 3 does not get a second look, it goes stale at 48h and is retired, which is exactly how 10–15 November went dark after seven failed drafts. The T2 self-score is not evidence here: the judge is a separate Opus call that did not write the caption, and the pre-flight record it writes is unsigned and simply overwritten by the workflow's signed one, so running it costs nothing but the call. The repeated miss is `onVoice` 3 where a caption's middle slides into a news recap — stay in first person the whole way through, one concrete detail, never narrate the story back at the reader. If the judge call is unavailable, score by hand against the rubric anchors before opening the PR and say in the body that the pre-flight was manual. Two rewrites that still miss leave the slot empty with the reason in the PR body (invariant 17) — never open a PR for a caption the gate will refuse.

### L002 — Never surface a Reddit target whose reply-eligibility is unconfirmed

- **Status:** active
- **First seen:** 2026-10-06 (reply queue)
- **Times fired:** 1
- **Last fired:** 2026-10-06 (reply queue)
- **Evidence:** [reddit:af12faf2 ❌](https://github.com/JW-Incorporated/swift2/blob/main/social/feedback/2026-W41.jsonl)
- **Codify:** —

**You said:** "Cannot reply to this particular post. Don't show me posts that I can't reply to"

**So I:** A Reddit reply target only reaches you when its reply-eligibility is CONFIRMED open. `scripts/community/awareness-eligibility.mjs` already resolves a five-state `REPLY_STATES` (`ok`, `locked`, `archived`, `no-comment`, `unknown`), but `awareness-scan.mjs:238` keeps an `unknown` candidate and merely flags it `replyUnverified` — so a post nobody can reply to still lands in your queue and costs you a click to find out. Treat `unknown` as not-eligible: hold it back rather than shipping it with a flag. The filter itself is in a script outside this desk’s mutation rights, so it is asked of Marjorie rather than fixed here; until it lands, never count an `unknown`-state target toward the Reddit contribution plan.

## Retired

### L001 — Never re-use a photograph that has already shipped

- **Status:** retired
- **First seen:** 2026-09-21 (PR #4471)
- **Times fired:** 6
- **Last fired:** 2026-09-30 (PR #4574)
- **Evidence:** [#4471 ❌](https://github.com/JW-Incorporated/swift2/pull/4471), [#4513 ❌](https://github.com/JW-Incorporated/swift2/pull/4513), [#4544 ❌](https://github.com/JW-Incorporated/swift2/pull/4544), [#4556 ❌](https://github.com/JW-Incorporated/swift2/pull/4556), [#4565 ❌](https://github.com/JW-Incorporated/swift2/pull/4565), [#4574 ❌](https://github.com/JW-Incorporated/swift2/pull/4574)
- **Codify:** done (#4601)
- **Superseded by:** check-drafts.mjs:checkPhotoReuse

**You said:** "The reason for all the "no's" on all of these posts is teh same: Re-used picture. All re-used pictures will be rejected. We need new pictures."

**So I:** Never ship a `photoId` that already appears in `social/posted/`, `social/queue/` or an open draft PR — except the one sanctioned repeat: the IG and X halves of the SAME campaign carry the SAME photo (one pair, one image, because the owner approves the pair as one post — docs/decisions.md 2026-09-30), so the earlier "never put the same `photoId` on both halves" clause is withdrawn. You do not hunt for a photo: the daily pre-compute (`.scratch/tree-inputs.json`) hands each beat a never-used, Instagram-sized pick (a photo outside Instagram's 0.8–1.91 aspect window can never ship, so it is never offered), and `check-drafts.mjs` now fails a repeat across campaigns. When no pick is left for a beat (or its era), defer the beat and say so in the PR body — never repeat a tile, never drop X to text-only to dodge this rule, never take an off-era photo. Name the photo choice in the item's `why`.
