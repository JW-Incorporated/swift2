# Unowned queues — who picks up what, and what catches the gaps

Owner: Joey. Created 2026-08-11 after an audit found four separate work
queues with zero throughput **by construction, not by capacity**.

## The shape of the bug

Fixing is comfortably ahead of detection in this repo — 409 content tickets
closed against 36 open on the audit date. The backlog that remained was not a
capacity problem. Every scanner pulls its queue with a **filter**, and every
filter is a fence:

| Scanner | Filter | Blind to |
|---|---|---|
| Kevin S1 | `label:cie` | everything unlabeled |
| Kevin S3 | not `cie`/`user-feedback` **and** `author != wjduvall-cmd` | every Wyatt-authored ticket |
| Austin | Kevin's buckets, or `a11y` at P2/P3 minus `needs-manual-a11y` | everything else |
| Laura | files tickets; never fixes | — |

**Nobody owns the complement of a union of filters.** Work outside all of them
is not deprioritised, it is invisible, and nothing reports invisible work. On
2026-08-11 that complement held 17 open issues, a `cie:safety` ticket parked
since July, five accessibility tickets, and twelve dead social posts.

This is a recurring shape, not a one-off. Wyatt had already patched one instance
of it on 2026-07-25 — Austin's charter gives a11y tickets a direct lane
precisely because "all a11y tickets are `wjduvall-cmd`-authored, so Kevin's
Stream-3 triage — which skips that author — never saw them." That was the same
bug, fixed for one label. The sweep fixes it for all of them.

## The mechanism

`scripts/ops/unowned-sweep.mjs`, wired by `.github/workflows/unowned-sweep.yml`.
Deterministic, zero-LLM, ~250 lines.

- **On every issue opened/reopened/unlabeled:** any issue with zero labels gets
  `needs-triage`, which Kevin S3 now honours regardless of author. This closes
  the hole at the source, in seconds, and cannot fall behind.
- **Daily:** refreshes one standing ledger issue listing everything still
  unowned, everything parked, the manual-a11y queue, and `social/failed/`.

`ownersOf()` in that script is the machine-readable version of the table above —
**it models the fleet as it actually runs, including the author fence**, and its
tests pin that behaviour. Add a row to `OWNED_BY` whenever you add a queue; a
label absent from the table is by definition a label no scanner is known to
read, and its issues will be reported as unowned. That is the intended failure
mode: loud, not silent.

Deliberately **not** a `build` gate — a human opening an unlabeled issue must
never turn `main` red.

## Ownership, by queue

| Queue | Owner | Surfacing |
|---|---|---|
| Unlabeled issues | auto-`needs-triage` → Kevin S3 | issue event, seconds |
| `cie` content tickets | Kevin S1 | daily |
| Parked `kevin-skip` | named human on the ticket, with a review date | daily ledger, with age |
| `cie:safety` / `cie:escalate` | founder — never auto-fixed | `founder-decision` → Founders' Brief |
| `needs-manual-a11y` | founder AT checklist — `docs/a11y-manual-queue.md` | per milestone + pre-launch |
| `social/failed/` | **Growth desk** (below) | daily ledger |

## `social/failed/` — the triage ownership question

`social/README.md` said the directory "needs a human look". There was no
notification, no alert, and no named human: **twelve posts died between
2026-07-21 and 2026-08-04 and the only reason anyone noticed was a founder
asking why a metric read zero.**

The gap is not that the poster lacks retries — it has three. It is that
`watchdog.yml` monitors whether a *runner ran*, and the poster ran perfectly
every 30 minutes while failing every single post. **Success-path monitoring
existed; failure-path monitoring did not.**

Grouping the twelve by failure signature is what makes them legible, and it
changes the reading completely:

- **11 × X, HTTP 403 `"You are not permitted to perform this action."`** —
  identical across every post from 07-21 to 08-04. This is **one credential
  fault repeated eleven times, not eleven incidents**: the X app's token lacks
  write permission (or was downgraded to read-only). No amount of poster
  hardening fixes it; it needs a founder to re-issue the token with write scope.
- **1 × Instagram, code 9007 `"Media ID is not available"`** — the media
  container was not `FINISHED` before publish. Already tracked as
  [#1897](https://github.com/JW-Incorporated/swift2/issues/1897) and owned by
  the agent hardening the social pipeline.

**Ownership decision:** the Growth desk owns `social/failed/` triage. The daily
ledger surfaces the directory with counts, signatures and age, so a dead queue
can never again be discovered by accident. The *poster code* stays with the
pipeline agent — see the handoff below.

## Handoffs — specified here, built by their owners

Three fixes are named here rather than made, because another agent owns the
file. Scope, not politeness: two agents editing one function is how a fix gets
reverted.

### 1. `scripts/social/**` — surface failures at the moment they happen

The ledger is a safety net, not the fix. When the poster moves an item to
`failed/`, it should also open (or update) one issue per **failure signature**,
labelled `growth`. One issue saying "11 posts dead, X 403, since 07-21" is the
alert that was missing; eleven issues would be noise. Owner: the social-pipeline
agent (already working in `scripts/social/**` on #1897).

### 2. `docs/agents/austin.md` — one line, so a11y fixes stop being blocked

Austin's fence excludes `needs-manual-a11y` "because those require human
manual-AT testing Austin cannot do". Per `docs/a11y-manual-queue.md` that
conflates the *sign-off* with the *build*. The exclusion should read: Austin may
build a `needs-manual-a11y` ticket whose pass criterion is a named axe rule or a
scripted probe; the ticket still does not close until the AT checklist passes.
(Austin never closes tickets anyway, so this is safe by construction.) Owner:
whoever owns the Austin charter — charters are founder-approved PRs and no agent
edits its own.

### 3. `scripts/content-engine/lib/issues.mjs` — `existsByFp()` and regressions

Karen's dedupe searches `--state all`, so once a fingerprint has been filed
**and closed**, an identical re-detection is skipped forever:

```js
gh(['issue','list','--state','all','--search',`cie-fp:${fp} in:body`, …])
```

Good for churn — a P2 rollup does not re-file nightly. Bad for regressions: if
content is fixed, the ticket closes, and the text later regresses to exactly the
same string, Karen will never file it again. **The checker still detects it; the
dedupe silently discards it.** That is the worst failure shape available, since
the run reports success.

**Recommended fix — a closure horizon, not `--state open`.**

```js
// Re-detection after a closed fix is a REGRESSION and must re-file; re-detection
// while the ticket is open is churn and must not. A closed ticket suppresses
// its fingerprint for COOLDOWN days (the fix's PR may not have merged yet),
// after which the same fingerprint is filable again as a new regression.
const HORIZON_DAYS = 30;
```

Search `--state all` as today, but fetch `state,closedAt`; suppress if any match
is **open**, or is closed **within** the horizon; otherwise file, and link the
prior ticket in the body ("regression of #N, closed <date>").

**Trade-off, stated plainly.** A shorter horizon catches regressions sooner and
risks re-filing a fix that merged but has not deployed; a longer one is quieter
and lets a real regression hide for longer. 30 days is chosen because it is far
longer than any fix-to-merge cycle here and far shorter than a content lifetime.
The alternative — `--state open` alone — is wrong: it re-files every closed P2
rollup on the next nightly and buries the tracker, which is the churn the
`--state all` search was added to stop.

**Do not implement this without coordinating.** Another agent is fixing two
different bugs in the same function (rollup fingerprints hashing the item count,
so a rollup re-files whenever its count changes — the cause of the five
duplicate `image.host-reputation` rollups; and the `catch { return false }` that
fails *open* on an API error, filing duplicates during a GitHub outage). Both
overlap this code path. Owner: that agent, tracked on
[#487](https://github.com/JW-Incorporated/swift2/issues/487).
