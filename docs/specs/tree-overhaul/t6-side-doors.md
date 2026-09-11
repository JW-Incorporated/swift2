# T6 — Side doors route through Tree

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 4 build)
**Depends on:** T1 (`lane`), T2 (the rubric).
**Closes:** the structural gap named in `docs/agents/growth.md` (2026-08-31, kanban `t_895c2ba8`) and `social/calendar.md`'s open incident, issue #3584.

---

## Behavior you will see

Two automated lanes write captions straight into the queue today with nobody looking at them: the merch sync, when a new product appears, and the appearance discovery, when Taylor turns up in a new video. They produced the 2026-08-31 captions that triggered the posting freeze.

After this, **neither lane writes a caption.** They write a fact sheet: *"New product: the folklore cardigan, £58, in stock since this morning, here's the picture and the link."* Tree reads those and writes the post itself, to the usual standard plus one test planned posts don't get: **is this actually news right now?** A product on the shelf a week is not.

In the channel it looks like any other brief, its lane named:

> Tree · slot: fast lane (merch) · pillar: launch:merch

You still approve it with ✅ / ✏️ / ❌. Nothing ships without you.

If Tree judges a fact sheet not worth a post, Monday's brief says so in one line ("skipped the Sept 14 appearance — nothing in it we could source"). Reply and it'll do it anyway.

Since we post about once a day per platform, a fast-lane post **takes** a planned slot rather than adding one. Tree says which slot moved, and where to.

---

## Data

### `social/inbox/<id>.json` — the intent

```jsonc
{
  "v": 1,
  "id": "merch-2026-09-18-folklore-cardigan",
  "source": "merch-official-sync",
  "lane": "merch",                        // "merch" | "appearance" — matches T1's queue-item lane
  "createdAt": "2026-09-18T08:17:44Z",
  "deadline": "2026-09-21T08:17:44Z",
  "status": "open",                       // "open" | "drafted" | "declined" | "expired"
  "facts": {
    "name": "folklore cardigan",
    "price": "58.00",
    "currency": "GBP",
    "availability": "in stock",
    "productUrl": "https://…",
    "firstSeenAt": "2026-09-18T08:17:44Z"
  },
  "media": ["/social/library/merch/folklore-cardigan.jpg"],
  "mediaCredit": "official store listing",
  "mediaSource": "https://…",
  "altTextHint": "A cream cable-knit cardigan with gold star embroidery.",
  "links": { "pr": 4212, "issue": null }
}
```

Appearance intents carry a different `facts` block and nothing else changes:

```jsonc
"facts": {
  "channelName": "The Graham Norton Show",
  "videoTitle": "Taylor Swift on …",
  "publishedAt": "2026-09-18T22:00:00Z",
  "videoId": "…",
  "url": "https://…"
}
```

**`facts` is observed metadata only, restated never fabricated** — the R2 standard the merch engine already holds itself to. A side door may not write a sentence intended for publication. The test: every value in `facts` must be traceable to the page or feed the lane read. If the lane wants to say something is exciting, it is writing a caption, and that is the thing this spec removes.

### Deadlines

| Lane | Deadline | Why |
|---|---|---|
| `merch` | `createdAt + 72h` | a drop stays newsworthy for about three days |
| `appearance` | `createdAt + 48h` | an appearance is stale almost immediately |

An `open` intent past its deadline is set to `expired` by the next daily run, with no post and no issue — expiry is the normal outcome for most intents and must not read as a failure. Expiries are counted in Monday's brief as a single number.

### Status transitions

```
open ──drafted──▶ drafted   (a queue item now exists; id recorded in `queueFiles`)
 │
 ├──declined──▶ declined    (Tree judged it not postable; `declinedReason` required)
 └──expired───▶ expired     (deadline passed with no decision)
```

`drafted` intents that are then ❌-rejected by the founder do **not** return to `open` — the founder said no to the post, and re-drafting the same fact sheet the next morning would be Tree relitigating a decision. The rejection reason becomes a lesson (T5) like any other.

Declined and expired intents move to `social/inbox/closed/` so the working directory only ever holds live intents. Nothing is deleted.

### The fast-lane rubric

T2's five dimensions plus one, scored the same 1–5 way:

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **timely** | this would read the same next month | mildly of-the-moment | this is news today and stale in two days |

Threshold for a fast-lane draft: every dimension ≥ 3, `total` ≥ **21** (of 30), `notEmbarrassed` ≥ 4, **and `timely` ≥ 4**.

`timely ≥ 4` is a hard gate because a fast-lane item **displaces a planned slot**. A post that is not genuinely time-sensitive has no claim on someone else's slot; it should be planned into the calendar next Monday like anything else. This is the single rule that stops the fast lane becoming a second, unplanned content pipeline — which is what it is today.

`critique.v` becomes `2` for six-dimension critiques; five-dimension `v: 1` critiques remain valid for calendar-lane items. `validateQueueItem` selects the rubric by `lane`.

### Slot displacement

Queue caps are one post per platform per UTC day (`MAX_POSTS_PER_PLATFORM_PER_DAY`, `scripts/social/lib/queue.mjs`), so a fast-lane campaign cannot be additive. Tree:

1. drafts the fast-lane pair for the **earliest day whose beat is not already drafted** (the calendar runs one beat a day — `social/calendar.md`);
2. moves the displaced calendar slot to the next day with a free beat, rewriting `social/calendar.md`;
3. names both in the draft PR body: *"Fast lane (merch) takes Thu beat A. `thread:hidden-clues:behind-the-data` moves Thu A → Sat A."*

**At most one fast-lane campaign per day**, and **at most two per rolling 7 days**. If more intents are open than that, Tree takes the one with the nearest deadline and lets the rest expire, saying so in the brief. At one beat a day a week has seven slots; two keeps the fast lane under a third of them. A week where the fast lane consumed half the calendar is a week with no strategy, and the cap makes that impossible rather than merely discouraged.

---

## Mechanics

### `scripts/merch-engine/build-drop-draft.mjs`

The `--social-draft`/`--out-dir social/queue` path is replaced by `--intent-out social/inbox`. It writes the intent from the catalog metadata `authorOfficialCatalog()` already produces, and writes **no `body` and no caption text of any kind**. The rendered card image continues to be committed under `apps/web/public/social/` — an image is an asset, not an opinion, and Tree needs it.

### `.github/workflows/merch-official-sync.yml`

- Stops staging `social/queue/**`; stages `social/inbox/**` plus the seed and image it already writes.
- Its PR therefore no longer contains a social draft, so `automerge-social-approval-gate.mjs` no longer holds it and it lands on green like any other content PR.
- **Fix the stale PR-body text** that still says "Auto-merges once check-drafts.mjs + the required build check pass" — which has been wrong since the 2026-09-10 approval gate and would now be wrong in a new way. It becomes: *"Writes a fact sheet to `social/inbox/`. Tree drafts any post from it in its next daily run; a founder still approves that post in #longlive-social."*

### `scripts/appearance-discovery/discover.mjs`

FILE mode's queue-draft staging (the template-generated X+IG pair, ~lines 457–475) is deleted and replaced by an intent write. The `intake` issue it files is unchanged and remains the record; the intent's `links.issue` points at it.

Deleting the caption templates is the point of the change, not a side effect: templates are how this lane produced captions nobody had judged.

### `.github/workflows/auto-merge-content.yml`

`social/inbox/` is added as an allow prefix in `.github/content-automerge-allowlist.txt` (the strict allow-list the gate reads). It carries no publishable text, so it needs no human gate — the gate is on the post Tree writes from it.

### `docs/agents/runner-prompts/tree-daily-draft.md`

A new step before drafting the calendar's slots:

1. Read `social/inbox/*.json` where `status: "open"`.
2. Expire anything past its deadline.
3. Apply the caps (1/day, 2/rolling-7d) and pick by nearest deadline.
4. For the chosen intent: draft the pair, score against the six-dimension rubric, and on a pass write the queue items with `lane: "merch"|"appearance"`, set the intent to `drafted` with its `queueFiles`, and displace the calendar slot.
5. On a fail (either rewrite), or on any blocklist / duplicate / unsourceable judgement: set `declined` with a one-sentence `declinedReason` in plain English, and comment that reason on the source `intake` issue or merch PR so the originating lane's own record shows it.
6. Name every decline and expiry in the run's PR body.

### `scripts/social/lib/queue-schema.mjs` and `check-drafts.mjs`

- `lane: "merch"|"appearance"` selects the `v: 2` six-dimension rubric.
- A new `checkFastLaneDisplacement`: a queue item with a fast lane must not share a `platform` + UTC day with a `lane: "calendar"` item in the same PR. That is the cap expressed as a check, so a prompt slip becomes a red CI run rather than two posts fighting over one day.

### New — `scripts/social/lib/inbox.mjs`

`readIntents(dir)`, `isExpired(intent, now)`, `selectFastLane(intents, postedWindow, now)` (deadline order, caps applied), `closeIntent(intent, status, reason)`. Pure, unit-tested; the daily run's judgement is which intent deserves a post, not which intent is eligible.

---

## Acceptance criteria

1. A merch-sync run against a fixture catalog with one new product writes exactly one `social/inbox/*.json` and **zero** files under `social/queue/`.
2. That intent contains no field whose value is prose written for publication; `facts` values all appear in the fixture catalog input.
3. An appearance-discovery FILE-mode run writes an intent and its `intake` issue, and **zero** files under `social/queue/`.
4. `auto-merge-content.yml` permits a PR whose diff is `social/inbox/**` + `supabase/seed/merch/**` + an image, and still declines one containing `social/queue/**` without a stamp.
5. `selectFastLane` picks the nearest-deadline open intent, returns at most one, and returns none when two fast-lane campaigns already posted in the rolling 7 days.
6. An intent past its deadline transitions to `expired`, moves to `social/inbox/closed/`, and produces no queue item.
7. `validateQueueItem` requires six dimensions and `total ≥ 21` for `lane: "merch"`, and rejects a fast-lane item with `timely: 3` even at `total: 27`.
8. `validateQueueItem` still accepts a five-dimension `v: 1` critique for `lane: "calendar"`.
9. `checkFastLaneDisplacement` fails a PR containing a `merch` X item and a `calendar` X item scheduled on the same UTC day.
10. A declined intent has a non-empty `declinedReason` and a matching comment on its source issue or PR.
11. A fast-lane draft's Discord brief renders `slot: fast lane (merch)` and the founder gate behaves identically to a calendar draft.

---

## Files affected

| Path | Change |
|---|---|
| `scripts/merch-engine/build-drop-draft.mjs` | `--intent-out`; caption authoring removed |
| `.github/workflows/merch-official-sync.yml` | stages inbox not queue; PR body corrected |
| `scripts/appearance-discovery/discover.mjs` | queue-draft staging replaced by an intent write |
| `.github/workflows/appearance-discovery.yml` | stages inbox not queue |
| `scripts/social/lib/inbox.mjs` | **new** |
| `scripts/social/lib/queue-schema.mjs` | `v: 2` rubric selected by `lane` |
| `scripts/social/check-drafts.mjs` | `checkFastLaneDisplacement` |
| `.github/content-automerge-allowlist.txt` | `social/inbox/` allow prefix added |
| `docs/agents/runner-prompts/tree-daily-draft.md` | the fast-lane step |
| `docs/agents/runner-prompts/tree-weekly-plan.md` | report declines and expiries |
| `social/inbox/.gitkeep`, `social/inbox/closed/.gitkeep` | **new** |
| `social/README.md`, `docs/agents/tree.md`, `docs/agents/content-shift.md` | document the lane |
| `tests/` | intent selection, rubric-by-lane, displacement check |

---

## Open questions

None blocking. Decided here — all reversible:

- **`facts` only, never prose.** The lanes' captions were the problem; removing the ability to write one is the fix, and a lane that can write "exciting" can write the 2026-08-31 captions again.
- **A fast-lane item displaces rather than adds**, because the daily cap is 1 per platform and pretending otherwise would just let the poster drop one silently.
- **`timely ≥ 4` is a hard gate.** It is what keeps the fast lane a fast lane instead of a second content pipeline.
- **Caps of 1/day and 2/rolling-7d.** The calendar runs one beat a day (`social/calendar.md`), so a week has seven slots and two keeps the fast lane under a third of them. *(Corrected 2026-09-11, Wave 1 review: the spec previously said three "of fourteen beats", a count taken from strategy §2's superseded two-beat day — three of seven would have been the very half-a-calendar this cap exists to prevent.)*
- **A ❌-ed fast-lane draft does not return to `open`.** Re-offering it tomorrow is relitigating the founder's decision.
- **Declines are reported weekly, not per-decline.** A daily "I skipped something" message is noise; a weekly line is reviewable.
- **Expiry is the expected outcome and is reported as a count**, not as a list of failures.
- **The `intake` issue stays.** It is the appearance lane's own record and other desks read it; only the caption goes away.
