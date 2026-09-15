# M8 — Drive to done: the build lane and the 48/96-hour chase

Epic #4180. Decided by Joey 2026-09-14 (chat): design 1 of the two proposed
("Marjorie files into Kevin's queue"), plus a chase with his numbers: no
activity for **48 hours** puts the item in the brief; **96 hours** makes it a
human action. "I want PRs closed within 2 days max."

Marjorie does no engineering work herself (charter invariant 1, enforced by
her routines having no Write/Edit tool). This wave makes the one lever she
has, a GitHub issue, reliably reach someone who builds, and makes her chase
it until it is closed.

## Behavior you will see

- A bug or request Marjorie dispatches is written so the build lane can take
  it without a human rewriting it: expected behavior, the files, a size
  estimate, acceptance criteria, and the reporter's words.
- When you say yes to one of her items (✅ on its brief line, or "yes, do
  #N" in chat), that yes lands on the issue as a founder-approval comment,
  Kevin's next triage moves it to `ready/greenlit`, and Austin's next run
  picks it up. Nothing new posts anywhere.
- The morning brief's `dispatched:` line names every item of hers that has
  had no activity for 48 hours, with its age and who holds it.
- At 96 hours of silence she files one human action, `[DECIDE]`, with three
  literal choices: assign, defer, close. One per item, ever. `SKIP` is
  final.
- The same chase covers the PR that closes her item: an open PR that says
  `Closes #N` for one of her issues, quiet for 48 hours, is in the brief; at
  96 hours it is the same human action.

## What already exists (do not rebuild)

- **Kevin's Stream-3 triage already sees her issues.** It scans open tickets
  authored by anyone but `wjduvall-cmd`, or labeled `needs-triage`
  (`kevin-stream3-triage.md` step 1). Marjorie's routines file as
  `app/github-actions` or `app/claude`, so every build-desk issue she files
  is in Kevin's scan the next run. `desk:build` is her own marker; nothing
  routes on it, and this wave does not make it route.
- **Austin pulls from Kevin's buckets** `bug (small/pre-diagnosed)` and
  `ready/greenlit`, filtered by his scope fence (`docs/agents/austin.md`
  §Scope: reversible, Definition of Ready, the `apps/web/**` and
  `packages/**` allowlist, ≤5 files / ≤150 lines, founder-or-desk author).
- **Kevin moves a ticket to `ready/greenlit` on a human approval comment**
  ("a later human comment can approve a phased plan"; invariant 7, latest
  human comment wins).
- **The brief already prints** `- dispatched: N open, oldest Xd (#n)` from
  open `marjorie-filed` issues (`brief-state.mjs`, `brief-sections.mjs`
  `renderDispatchedLine`).
- **The ops sweep already has a ledger-comment state machine** so a routine
  never acts twice on one alert (`alert-router.mjs`, `w1-watchdog-handling.md`
  Mechanics). The chase reuses it.
- **Human actions** are filed by PR in v2 format, numbered by
  `alert-router.mjs next-ha-number`.

## Mechanics

### 1. Ready-shaped filing (`scripts/marjorie/lib/build-ticket.mjs`, pure)

Every build-desk issue Marjorie files (triage class `bug` or `request`,
an ops-sweep "real defect", a chat ask she routes to engineering) goes
through one helper that renders the body and refuses a body that is not
ready. Required sections, in this order:

1. `**Expected**` — one to three sentences of user-visible behavior.
2. `**Where**` — the surface and the files she believes change, as paths.
   She may be wrong; she must name a starting point.
3. `**Size**` — `small` (≤5 files, ≤150 lines, inside Austin's allowlist),
   `medium` (fits a session, outside Austin's fence), or `large` (needs a
   spec). Her estimate, from the paths in **Where** against the allowlist
   in `austin.md` §Scope item 4, which the helper encodes as data.
   Implementation precision: `small` also requires an explicit positive
   `estimatedLines` ≤150; unknown lines are `medium`, and only an explicit
   `needsSpec` judgment is `large`, because paths alone prove neither bound.
4. `**Acceptance criteria**` — checkboxes.
5. `**Reporter said**` — the verbatim quote, when there is one (never a
   founder's Discord words; the repo is public — link the message instead).
6. The marker `<!-- marjorie-build: size=<s> source=<issue|alert|chat:link> -->`.

Retry idempotency uses the immutable submission number or full GitHub alert
issue URL from the source line; dates and other surrounding text never define
identity. The helper refuses a dedupe lookup without one of those canonical keys.

Labels: `marjorie-filed`, `desk:build`, `bug` + `exp:P1|P2|P3` for bugs
(unchanged from `s1-triage.md`), `enhancement` for requests. `small` items
also get `needs-triage` so a `wjduvall-cmd`-authored original can never
hide them from Kevin (the sweep's escape hatch).

`build-ticket.mjs check <file>` exits non-zero and prints the missing
section; the routines run it before `gh issue create`. A `large` item is
not filed as a build ticket: it becomes a `founder-decision` bank item
(`marjorie.md` §Authority) naming the spec that would be needed.

### 2. The founder's yes (`chat-post.mjs` / `marjorie-chat.md` §2, `reply-poll`)

A founder ✅ on a brief line that names one of her open build-desk issues,
or a chat message she reads as approval of #N ("yes", "do it", "go ahead
with #N"), produces one comment on #N:

```
Founder approved this in Discord: <message link>
Plan approved — ready for the build lane.
<!-- marjorie-approval: <message id> -->
```

Idempotent on the marker. The phrase "Plan approved" is what Kevin's triage
reads as a human approval (his prompt step 2). She adds no label and moves
nothing herself; Kevin's next run buckets it `ready/greenlit`, Austin's next
run claims it if it fits his fence. Her reply says so in one line with both
routines' next scheduled times (Kevin 01:23/13:23 UTC, Austin 21:00 UTC).

An ambiguous yes (two candidates) gets the M5 rule: act on nothing, ask
which, list the candidates.

### 3. The chase (`scripts/marjorie/lib/dispatch-chase.mjs`, pure; ops sweep step 2b)

Inputs, fetched by the ops routine with `gh` and passed in as JSON:

- open issues labeled `marjorie-filed` (all sources: build, content,
  `desk:tree` asks), with `updatedAt`, comments (author, createdAt), labels,
  assignee;
- open PRs whose body has `Closes #N` / `Fixes #N` for any of those N, with
  `updatedAt`, last commit date, review state, labels (`austin-built`,
  `needs-human-review`);
- `HUMAN-ACTIONS.md` and `HUMAN-ACTIONS-DONE.md` text;
- `now`.

**Activity** on an item is the newest of: issue `updatedAt`, any comment not
by Marjorie's own runs, a linked PR's last commit or review, a label or
assignee change. Marjorie's own nudge comment never counts as activity.

Verdict per item, one of:

| Verdict | When | Ops sweep does | Brief shows |
|---|---|---|---|
| `fresh` | activity < 48 h | nothing | counted in `dispatched: N open` |
| `stale-48` | 48 h ≤ silence < 96 h | one nudge comment on the item (and on its PR if one exists), once per item, marker `<!-- marjorie-chase: 48h -->`; a ledger line in the run summary | `- stalled 2d+: #N (3d, Austin PR #M waiting on review) · #K (2d, unclaimed)` |
| `stale-96` | silence ≥ 96 h and no chase HA for this item in either HA file | file HA `[DECIDE] #N has had no activity for 4 days` by PR, once per item ever, marker `<!-- marjorie-chase: 96h issue=N -->` | the HA appears in **Waiting on you** as any other; the stalled line keeps the item with `(HA #x)` |
| `held` | a `SKIP`ped or closed chase HA exists for the item | nothing, ever again | listed once as `held: #N (HA #x skipped)` then dropped from the stalled line |
| `blocked-on-founder` | the item or its PR has an unresolved founder question (latest human comment is a question to a founder, or PR labeled `needs-human-review`) | nothing (the brief already carries it) | `- waiting on you: #N` |

The nudge comment is one fixed sentence plus what would unblock it, derived
from the data, never free text:

```
No activity for 2 days. Holder: <Austin PR #M awaiting review | unclaimed,
Kevin bucket "<b>" | assignee @x>. Next: <merge/review #M | a founder
comment "Plan approved" | pick up or close>.
<!-- marjorie-chase: 48h -->
```

The 96-hour human action, v2 format:

```
## #NN 🟡 [DECIDE] #N has had no activity for 4 days (~2 min)
**Why:** Marjorie dispatched it on <date> (<title>). Nothing has moved
since <date>. Holder: <as above>.
**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it
   this week), `defer` (she stops chasing; it stays open), or `close`.
**Worked if:** the next brief no longer lists #N under stalled.
```

Her chat routine already turns a one-word founder reply into an action
(`s1-triage.md` §The founder branch): `assign` → she comments "Founder
assigned this to the next session" and labels `founder-assigned`;
`defer` → label `deferred`, the chase treats it as `held`; `close` → she
closes it citing the message link (invariant 3 allows it: it is hers).

Budget: at most 5 nudges and 2 chase HAs per sweep; the rest wait for the
next hour. Order by age, oldest first.

### 4. The brief (`brief-state.mjs`, `brief-sections.mjs`)

`dispatched` gains the chase verdicts. The line stays one line when nothing
is stale; otherwise it becomes the `stalled 2d+:` list above, sorted by age,
max 8 items then `+K more`. `renderDispatchedLine` keeps its current output
for the `fresh`-only case so existing tests hold.

### 5. What does not change

- Austin's fence and allowlist (`docs/agents/austin.md`) are untouched. An
  item outside the fence (`medium`) waits for a session, and the chase is
  what makes that visible: at 96 hours it is a founder's call to assign,
  defer or close. Widening Austin to `scripts/**` is a separate decision
  (open question 1).
- Kevin's prompts are untouched. His triage already reads approval
  comments.
- Nothing posts to Discord from this wave except through the brief and her
  chat replies, which already exist.
- No new label routes work. `desk:build` remains a marker.

## Acceptance criteria

- **Filing:** a triage run on a real bug submission files an issue whose
  body passes `build-ticket.mjs check`; a body missing **Expected** or
  **Acceptance criteria** is refused by the helper (unit test) and the
  routine's prompt says what to do (rewrite, not skip).
- **The yes:** Joey approves one of her open items in chat; #N gets exactly
  one `marjorie-approval` comment; Kevin's next triage lists it under
  `ready/greenlit`; if it fits Austin's fence, Austin's next run claims it.
  Run URLs on #4180.
- **Chase 48:** a `marjorie-filed` item with a synthetic 49-hour silence
  gets one nudge from the ops sweep and appears on the next brief's
  `stalled 2d+:` line; a second sweep adds no second nudge.
- **Chase 96:** the same item at a synthetic 97 hours gets one `[DECIDE]`
  human action by PR; a second sweep files nothing; after the founder
  replies `defer`, the item is `held` and disappears from the stalled line.
- **PRs:** an open PR with `Closes #N` and a 49-hour silence is nudged and
  shown as the item's holder.
- **Budget:** a sweep with 9 stale items nudges 5 and files 2 HAs (unit
  test).
- Unit tests green, lint 0, `check:routines` passes, no new secret.

## Files affected

- New: `scripts/marjorie/lib/build-ticket.mjs` (+ test),
  `scripts/marjorie/lib/dispatch-chase.mjs` (+ test).
- Edited: `docs/agents/runner-prompts/marjorie-triage.md` (file through the
  helper), `marjorie-ops.md` (step 2b), `marjorie-chat.md` (§2, the yes and
  the `assign|defer|close` words), `brief-state.mjs`, `brief-sections.mjs`
  (+ tests), `scripts/marjorie/bootstrap-labels.mjs` (`founder-assigned`,
  `deferred`), `docs/agents/marjorie.md` (one amendment: the chase and the
  approval relay are hers; the 96-hour HA is the only new thing she files),
  `MAP.md`, `checkpoints.json` (MR2 gains the chase check).

## Open questions

1. **Austin's allowlist.** Most of what Marjorie and Tree file is under
   `scripts/**` or `.github/**`, outside Austin's lane, so it waits for a
   session. Widening the lane to `scripts/marjorie/**` and
   `scripts/watchdog/**` (never `scripts/social/**`) is a charter change
   for Joey to call; the chase makes the cost of not doing it visible.
2. **Kevin's cadence.** Two triage runs a day plus one Austin run means a
   "yes" at 14:00 UTC is built no sooner than 21:00 UTC the same day, often
   the next. Acceptable under the two-day rule; M6-style dispatch on the
   approval comment is the upgrade if it is not.
