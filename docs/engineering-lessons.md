# Engineering lessons

Defects that cost more than one review round to find, written down so the next
session does not re-buy them. These are **durable** — unlike `STATE.md`, which is
session working memory capped at 150 lines and pruned every checkpoint. When a
lesson stops being about the current sprint and starts being about how this
codebase behaves, it moves here.

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
- **Parallel sessions share this checkout.** `STATE.md` and `PLAN.md` collided
  twice on 2026-08-14. Verify the branch immediately before every commit, and
  expect `git status` to show files you never touched.
- **Codex review path:** the `codex:rescue` skill → `codex:codex-rescue`
  subagent, always `--background`, then poll
  `codex-companion.mjs result <job-id>`. Full contract: `docs/agents/codex.md`.
