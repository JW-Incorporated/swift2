# Engineering lessons

Defects that cost more than one review round to find, written down so the next
session does not re-buy them. These are **durable** — unlike live task state,
which belongs in GitHub Issues/PRs.
When a lesson stops being about the current sprint and starts being about how
this codebase behaves, it moves here.

*(Before 2026-08-19 the transient half of this lived in a root `STATE.md`. That
file was retired with kit-v3; see `docs/decisions.md` 2026-08-19 and
2026-08-22.)*

Each entry is: what we believed, what was actually true, and the check that
would have caught it the first time.

---

## Verification

### A passing suite is not evidence; execution against the real corpus is

Every genuine defect in the 2026-08 era-reader and Clownbot work was found by
running the pipeline over live data, never by reading code — and each time
2600+ green tests had already made us confident and wrong. The fixtures used
the easy case (distinct dates, in-position cards, well-formed queries); the
vault does not.

**The check:** for any change to a data pipeline, run it over the real corpus
and report counts — admitted, excluded, changed. A filter that excludes zero
items is not proven, it is vacuous. The blocklist test that finally counted
(853 candidates → 820 admitted → **33 excluded**) is the shape to copy.

### Verify the user-visible outcome, not the mechanism you changed

Retiring the landing page did not make the masthead visible: the era-jump
correction scrolled straight past it on plain load. The mechanism changed; the
outcome did not.

Corollary, which cost two review rounds on its own: **verify a control with
`elementFromPoint` and a real tap**, never by asserting that its container
moved.

### A count is only as good as the method that produced it — demand the method

On 2026-08-14 one number decided whether a feature was buildable: how many merch
products could reuse their source moment's photo. Two agents answered
independently and **both were wrong** — one said 147 of 151, the other 151 of
151. The truth was **150 of 156**.

The failure was method, not arithmetic. The second agent grepped the content
vault with multiline regexes instead of running `hasRealPrimaryImage()`, whose
own doc warns *"every item has a non-empty `images`, so 'has images' alone
proves nothing."* A `.*?` pattern spanning array entries matches a moment whose
real photo is a `reference` and whose `primary` is the era-art stand-in — so it
counted stand-ins as real photos and returned a confident 100%.

Both answers also inherited a units error nobody caught: `shopTheLook` holds
**156 products across 151 moments**, because a moment carries a `products[]`
array. "151 products" was never a real quantity, and it propagated through two
agent reports and three of my own messages before the discrepancy surfaced it.

**The rules this buys:**

- **Ask how it was counted, not just what the count is.** A number without a
  method is a rumour. Any brief asking for a figure should require the agent to
  state how it derived it.
- **When a predicate exists, run the predicate.** Text-matching a data file is
  not equivalent to evaluating the function the app uses, and the difference is
  invisible in the output.
- **Two disagreeing agents means neither is trusted** — that is a signal to do
  it yourself, not to send a third. A tie-breaker agent would have produced a
  third number with no way to choose among them.
- **Watch the units.** When two counts are suspiciously identical (151 products
  / 151 moments), one of them is probably the other wearing a wrong label.

Method note for this repo: plain `node --experimental-strip-types` cannot run
this codebase's modules — internal imports are extensionless (`./content`) and
node ESM will not resolve them. Use a throwaway `vitest` file instead, which
resolves the module graph correctly, then delete it. Vitest also swallows
`console.log` under the default reporter; throwing an `Error` containing the
numbers is the reliable way to get them out.

### Agent-reported success is a claim

Spot-check before marking a step done. A reviewer that reads code finds
different things from one required to reproduce — the Fable rounds that caught
the session-bricking regression and the sheet-injection PoC were both told to
reproduce, not read.

---

## This codebase specifically

### `apps/web` is not linted by anything

Verified 2026-08-14. The root `eslint.config.mjs` ignores `apps/web/**`
(line 13), `apps/web/package.json` has no lint script (dev/prebuild/build/
start/typecheck only), and CI runs the root `npm run lint`, which skips it.

**So "lint clean" says nothing about any component or lib module under
`apps/web`.** `npm test` and `npm run typecheck --workspace=@swift2/web` are the
only real gates there. Do not quote lint as verification for web code.

Turning it on is its own task — the pre-existing backlog is unknown, and
bundling it into a feature PR makes the diff unreviewable.

### Two mechanisms for one fact is this repo's recurring defect

It appeared three times in a single branch: two song→video matchers, two date
paths, and an inference left running beside an authored field. Grep for other
callers before declaring a matching bug fixed.

The deliberate exception, which proves the rule: `neutralizeCell` in
`apps/web/lib/longlive/submit-link.ts` and `neutralizeCell_` in
`scripts/apps-script/submissions-doPost.gs` are the same rule on purpose,
because they sit on opposite sides of a trust boundary and the webhook may one
day have another caller. **Change one, change both.**

### A sum of heights is not a position

Four fixes died on this. Sticky chrome's summed height equals its on-screen
position only once it is stuck; anything added above it (the masthead) breaks
the equality pre-stick.

Ask the DOM where an edge **is** (`getBoundingClientRect().bottom`); do not
compute where it ought to be — and recompute on scroll, because pre-stick that
edge moves every frame. `measureChromeBottom()` vs `measureChromeHeight()` in
`chrome-offset.ts` encodes the distinction; keep them straight.

### `pointer-events` inherits — a `pointer-events-none` shell does not protect you

`SCRUBBER_SHELL_CLASS` set `none`, `SCRUBBER_RAIL_CLASS` set `auto`, and every
rail descendant inherited `auto`. Eleven `opacity-0` adornments were invisible
**and** hit-testable, overhanging the sticky filter row: taps on the last chip
scrubbed the timeline instead. Locked now by a source test.

### The reader has no URL routes

One client page driven by React context. `?item=`, `?lens=` and `?era=` are read
**once on mount** and never written back. Do not add a link that assumes
deep-linking works.

### `shop.ts`'s affiliate seam is dormant, not absent

`isAffiliate()` returns false for every retailer, `buildShopUrl()` returns the
raw URL, and `SHOP_DISCLOSURE` exists but never renders. So no affiliate link
ships today and no disclosure is required today.

**The moment anyone flips `isAffiliate`, disclosure MUST render** or it becomes
a compliance problem. It is a one-file change that silently carries an
obligation.

---

## Safety gates

### Over-refusal and under-blocking pull in opposite directions

The Clownbot safety gates are the clearest case. Round 1 of review found the
output gate running INPUT-tuned regexes over the bot's own prose, catching 0 of
13 redline drafts. The fix for that **regressed the product**: screening the
bot's own refusal copy with input patterns meant one refusal permanently
bricked the session, because each refusal appends more self-tripping text that
the 6-message cap cannot clear.

**Any change to one direction must be tested against both.** Both are now
pinned by exact-equality assertions over the red-team corpus (53 attacks, 21
tier-B probes, 48 legitimate queries).

### `tb-priv-02` is a documented, tested gap, not an oversight

Sexuality speculation carrying no orientation token cannot be caught
deterministically without also refusing "what is track five on Midnights really
about?". Do not "fix" it with a regex pinned to the probe text — that overfits
the probe, not the class.

### Anything user-supplied reaching a spreadsheet is a formula

A cell beginning `=`, `+`, `-` or `@` executes when the **owner** opens the
sheet. The proof-of-concept against our own submit endpoint exfiltrated the
sheet via `IMPORTXML`. Leading whitespace counts too: Sheets ignores `"\t=1+1"`,
but a CSV export opened in Excel does not, so the formula revives one hop
downstream.

Prefix with an apostrophe on **every** outgoing cell, not just the ones
currently reachable from user input — reachability is a property of today's
field set, not of the function. And prefer deleting an unused field to
sanitising it: the injection vector here was `note`/`sourcePage`, which the
route accepted and the form never sent.

### An IP rate limiter behind a proxy is best-effort, permanently

Callers set `x-forwarded-for` freely. The honeypot is the real floor. Say so in
a comment rather than adding complexity that pretends to a guarantee.

---

## External research constraints

Learned building `data/communities.json`; they will bite the same way on any
refresh.

- **Reddit blocks this environment outright** — HTTP 403 at the edge on both
  `www.reddit.com` and `oauth.reddit.com`, and WebFetch refuses the domain. No
  credential exists here. Do not burn time on user-agent or header tricks; it
  needs a real Reddit API app (five minutes at `reddit.com/prefs/apps`).
- **Aggregator numbers are not a substitute.** Published member counts for
  r/TaylorSwift spanned 200,000 to 3.8 million across sources fetched in the
  same week — a 19× spread. 15 of 30 entries carry `memberCount: null` **by
  design**; never write 0, and never quote a number nobody can support.
- **Facebook groups are invisible from outside a login.** Predicted to be the
  largest category, delivered the fewest entries. A group name from a search
  snippet with no description is not evidence — writing a warm description for
  it is fabrication laundered through a real URL.
- **Half of all public Discord listings are wrong.** 10 of 22 candidate invites
  were dead or resolved to a different server; `discordbotlist.com` serves its
  own promo invite on every page. Verify each invite through
  `discord.com/api/v10/invites/<code>?with_counts=true`.
- **Amino shut down entirely on 2025-12-19.** Older listicles still recommend
  it. Anyone rebuilding this dataset from secondary sources will resurrect a
  dead platform.

---

## CI and tooling

- **`guard-code` and `enable` are red on every code PR** (issue #2113). The
  guard's verdict is correct — a PR touching an API route that reads secrets is
  not auto-mergeable — but it exits 1 under `bash -e` instead of emitting its
  `server_code` verdict, so `enable` bails. **`build` is the merge gate.** Do
  not treat these two as blocking, and do not fix them inside a feature PR.
- **Pre-existing failures, not yours:** `scripts/social/lib/card-render.test.ts`
  (missing `satori`), and repo-wide `npm run typecheck` (`apps/mobile`) — use
  `npm run typecheck --workspace=@swift2/web`.
- **`npm run lint` may show ~630 errors** from a git worktree under `.scratch/`.
  It is git-ignored so CI is unaffected; add `--ignore-pattern ".scratch/**"`.
  Never delete another session's worktree.
- **`apps/web/next-env.d.ts` is regenerated** by any dev server started for
  browser verification. Leave it uncommitted; never hand-edit it, never
  `git restore` it.
- **Parallel sessions share this checkout.** The old root `STATE.md` and
  `PLAN.md` collided twice on 2026-08-14 — the concrete incident behind
  `REPO-006`'s ban on a single mutable file as shared state. Verify the branch
  immediately before every commit, and expect `git status` to show files you
  never touched.
- **Codex review path:** the `codex:rescue` skill → `codex:codex-rescue`
  subagent, always `--background`, then poll
  `codex-companion.mjs result <job-id>`. Full contract: `docs/agents/codex.md`.

## Lessons added 2026-08-15 (the 12-item punch list)

### Centering a scrollable row needs `safe center`, never plain `justify-center`

A `flex-nowrap` + `overflow-x-auto` container with `justify-content: center`
pushes overflowing content past **both** edges, and the part off the left edge
becomes permanently unreachable — a scroll container cannot scroll to a negative
offset. The first chip simply disappears.

Caught before merge on the Eras filter chips, which need roughly 440px inside a
344px box at 360px. Use the `safe` keyword, which falls back to start-alignment
exactly when content overflows: Tailwind arbitrary value
`[justify-content:safe_center]`. `apps/web/components/longlive/FilterBar.tsx` is
the reference implementation.

**How to prove it:** force `scrollLeft = -50` and confirm it clamps to `0`, and
that at `scrollLeft = 0` the first chip's left edge equals the row's left edge.

### This repo has no component-render test harness

`vitest.config.ts` runs `environment: 'node'` with no jsdom or Testing Library,
and the test glob matches only `*.test.ts`, never `.tsx`. Every "interaction
test" here is a **static source-lock** (`close-affordance.test.ts`,
`scrubber-nested-interactive.test.ts`).

**Consequence: a green suite cannot prove that a click works.** Only a browser
can. When wiring up an interaction, a source-lock test is the most the suite can
offer — plan on a real browser check as the actual verification. `#2150` added a
`@` → `apps/web` alias to `vitest.config.ts` and used `renderToStaticMarkup`,
which is the closest available substitute.

### The vault writer can silently drop a new field

`scripts/sync-longlive-content.mjs` serialises the generated vault field by
field. In `#2154`, `productsFrom()` computed a new `imageUrl` correctly but the
writer had **no line to emit it** — so 97 captured URLs would have been committed
to the seeds and never reached the app. This is the same failure as the
2026-07-18 `significance` incident: **twice now.**

Any new `Product` / `ContentItem` field needs a writer line **and** a regression
test. Symptom: data present in `supabase/seed/content/*.mjs` but absent from
`content-vault.generated.ts` after `npm run sync:content`.

### Windows: `import()` needs a `file://` URL, not a filesystem path

`scripts/content-engine/product-liveness.mjs` passed raw paths to `import()` and
to its `main()` guard, so on Windows it silently produced **zero output** — no
error, just nothing. Fixed with `pathToFileURL`. If a `scripts/` entry point
"produces nothing" on Windows, check this pattern first.

### Browser-tool click coordinates are in screenshot pixels, not CSS pixels

The in-session Chrome tool reports success while operating in a different
coordinate space than the page. On this machine `devicePixelRatio` is 1.25 with
a 2048px CSS viewport, while screenshots come back 1568px wide — so coordinates
computed from `getBoundingClientRect()` land nowhere and deliver **zero events**,
not even a `mousedown` on `document`. `resize_window` likewise reports success
while the page keeps rendering desktop.

This nearly turned a working feature into a false bug report.

**The diagnostic that settles it:** if a programmatic `.click()` works but a
synthetic mouse click produces no `mousedown` anywhere, the tool is at fault, not
the code. **Prefer a real dev server plus Playwright** for click and layout
verification — that path measured thread alignment as pixel-identical and proved
the scroll-clamping behaviour above.

### Never kill a process you did not start

An agent cleaning up its own dev server ran `taskkill` with a stale PID from an
earlier `netstat` and killed **another session's** server on port 3000. Parallel
sessions routinely hold ports 3000/3001/3005. Start your own server on an unused
port, and verify a PID belongs to your process immediately before killing it.

## Parallel-agent hazards (added 2026-08-16)

### Diff a branch against `origin/main`, not against local HEAD

An agent opened a PR whose three-line fix was correct but whose branch was cut
from a `main` snapshot predating a large merge. Its diff therefore **deleted
three newly added component files** and rewound a fourth. **All 2,995 tests
passed** — CI only checks that a branch is internally consistent, so a stale
base is invisible to it and invisible from the branch itself.

The check that catches it: `git diff origin/main <branch> --stat`. If files you
never mentioned appear — especially as deletions — the base is stale. Fix by
branching afresh from `origin/main` and re-applying. Never by force-pushing a
rebase, which the guard blocks anyway.

### Agents write into the shared checkout by absolute path

An agent created its worktree correctly and then edited files under
`Documents/Claude/Projects/Swift2` regardless, because it had the primary path
in mind. `cd` does not persist between tool calls in this harness, so every path
must be absolute from the worktree root. Symptom: `git status` in the SHARED
checkout shows source files nobody in this session touched.

Recovery: `git stash push -m "<why>" <path>`. That is recoverable and does not
fall foul of the ban on discarding uncommitted work. Do not delete it.

### A stand-down can arrive after the agent has already finished

That same agent self-corrected, committed inside its worktree and opened a PR
before the stand-down reached it — messages are delivered at the agent's next
tool round, so an agent that looks stuck may simply be mid-flight. **Check for
an open PR from its branch before dispatching a replacement.** Two agents
produced conflicting PRs for one task here before that was noticed.

### The guard matches command text, so it can fire on documentation

Writing this section via `node -e` was blocked because the string `git restore`
appeared inside the prose being written. That is a false positive, not the
human-only line firing. Use the dedicated file tools (Read/Edit/Write) for
editing files — which is the documented preference anyway — rather than shelling
out. Do not try to defeat the guard by obfuscating the text.

## Lessons migrated from STATE.md (2026-08-19)

### `set -uo pipefail` does not clear an inherited `-e` — and `|| true` destroys the evidence

GitHub Actions runs `run:` blocks as **`bash -e {0}`**. Two steps in
`watchdog.yml` used a non-zero exit as the *alarm signal*, then read `$?` on
the next line. Adding `set -uo pipefail` did **not** clear the inherited `-e`,
so the shell died the instant the check exited 1 and never reached the branch
that opens the alert. Joey got silence instead of an alarm. The old comment
claiming "`set -e` is deliberately off for this line" was simply false.

Fixed in #2178 with `STATUS=0; node … || STATUS=$?` — a guarded context that
errexit does not fire on.

**Never use bare `|| true` to suppress this.** It discards the exit code the
branch needs, converting a broken alarm into a silent one. The whole point of
the step is the code.

### `core.autocrlf=true` makes files look modified with no content change

On Windows this repo will show files as modified when nothing in them changed.
That is a line-ending artifact, not real work. **Investigate the config; never
"clean up" by reverting files** — § Never discard uncommitted work forbids it
and `.claude/hooks/guard.sh` blocks the commands outright. When in doubt,
`git stash` (recoverable) rather than discarding.

### A multi-word crisis phrase needs its progressive form added by hand

Found by test case 10 on the mood bot, **live in production on both paths**:
"I've been thinking about hurting myself" returned a heartbreak song instead of
crisis resources.

Cause: `phraseHits` (`apps/web/lib/longlive/mood-safety.ts`) appends inflections
to the **end of the whole phrase**, so `'hurt myself' + 'ing'` becomes
`'hurt myselfing'` — never `'hurting myself'`. That is why the Tier A lexicon
enumerates both aspects as separate entries (`kill`/`killing myself`,
`end`/`ending my life`, `harm`/`harming myself`, `cut`/`cutting myself`).
`hurt myself` was the one entry whose progressive form was never added.

**Adding a multi-word phrase to the crisis lexicon means adding its progressive
form too — there is no stemmer that will do it for you.** Tier A only; it can
only ever make crisis detection fire more.

### Refusing less is not the same as answering — score at least one axis

The mood bot's over-refusal had two independent causes (the model path's
`out_of_scope` flag, and the degraded no-key path scoring an empty vector), but
fixing both was still not enough: a message that passes `out_of_scope` yet
scores no axis returns `UNCLEAR_MESSAGE`, which reads to a user as a refusal.

The prompt therefore carries an explicit **"always score at least one axis"**
rule. **Never remove it.**

### The mood model is a classifier, not a writer — do not "restore" a voice

One call (`mood-client.ts`), forced `record_mood` tool, "Do not add prose."
Songs are chosen by deterministic TS (`mood-match.ts`) over precomputed
vectors; the card sentence is the catalogue's own `oneLiner`. There is no voice,
no output format, and **no catalogue in the prompt** — which is structurally why
the bot cannot hallucinate a track. A brief that assumes otherwise is wrong.
Keep it that way.

### A 404 means "not configured this way", never "not configured"

The 2026-08-19 migration audit reported `main` as "completely unprotected" on
the strength of:

```
gh api repos/JW-Incorporated/swift2/branches/main/protection
-> 404 {"message":"Branch not protected"}
```

`main` was protected the entire time — by a **ruleset** (`protect-main`),
which that endpoint does not report. GitHub has two independent mechanisms
(classic branch protection and rulesets) and the classic endpoint 404s when
only a ruleset exists. The right query is `gh api repos/{owner}/{repo}/rulesets`.

That false finding was written into `HUMAN-ACTIONS.md` and `docs/decisions.md`
as a governance decision before it was caught by a push rejection.

**The checks that would have caught it, in order of cheapness:**

- **Look at the history.** Every commit on `main` carries a `(#NNNN)` PR
  number. A branch that anyone can push to does not look like that. Evidence
  already in the repo beats a single API probe.
- **Ask what a 404 excludes.** It rules out one implementation, not the
  capability. Enumerate the alternatives before concluding absence.
- **Try the operation.** `git push` would have answered it in one command.

Generalises past GitHub: absence-of-configuration is the hardest thing to
prove from an API, and a negative from one endpoint is the weakest possible
evidence for it.

### Git Bash mangles `ref:path` arguments — verify with `ls-tree`, not `cat-file`

Checking whether the migration had landed, this reported the file as ABSENT
from `main`:

```
git cat-file -e origin/main:.claude/rules/ai-team-coordination.md
-> fatal: Not a valid object name origin\main;.claude\rules\ai-team-coordination.md
```

The file was there. **MSYS2 path conversion rewrote the argument** — `/` to
`\` and `:` to `;` — because the text after the colon looks like a POSIX path
list. It only triggers when the path contains a slash, which is why
`origin/main:STATE.md` worked in the same session and
`origin/main:.claude/hooks/guard.sh` did not. **The failure mode is a false
negative that reads exactly like a real absence.**

Use a form that takes the path as a separate argument:

```
git ls-tree -r --name-only origin/main .claude/     # immune
git show origin/main --stat -- <path>                # immune
MSYS_NO_PATHCONV=1 git cat-file -e origin/main:<path>  # opt out explicitly
```

Same family as the 404 lesson above, and it bit twice in one session: **a
negative result from a tool is evidence about the tool until you have ruled
the tool out.** Confirm absence with a second, structurally different command
before acting on it.
