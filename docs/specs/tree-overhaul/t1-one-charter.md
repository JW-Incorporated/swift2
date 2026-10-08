# T1 — One charter: Growth folds into Tree

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 3 build)
**Supersedes:** the split of social ownership between `docs/agents/tree.md` (planning) and `docs/agents/growth.md` (drafting), set 2026-08-11.

---

## Behavior you will see

Nothing in the channel gets louder — one name gets quieter.

Right now two agents share the social account: "Tree" plans it on Mondays, and "Growth" writes the captions every morning. You only ever see Tree in Discord, but the emails, the PR titles and the brief footers still say Growth, and when something is wrong it is genuinely unclear who you are talking to.

After this, there is one name. **Tree** plans on Monday and drafts every morning. Everything you see says Tree and nothing says Growth:

- the Discord brief is from **Tree** (already true);
- the pull requests are titled **`Tree: daily social draft — 18 Sep`** and **`Tree: weekly plan — week of 15 Sep`**;
- the weekly email arrives **From "Tree (Long Live social)"** instead of From Marjorie;
- the Founders' Brief line reads **Tree** where it used to read Growth.

Nothing about the approval gate changes. You still react ✅ / ✏️ / ❌ on a brief, and nothing ships without you.

The one real difference: when you tell Tree something is wrong, there is no longer a second desk it can point at. Tree owns the plan, the caption and the result.

---

## Data

No queue-schema change except one rename.

### `sourceRoutine` → `lane`

`sourceRoutine` today is a free-text routine name (`"routine-growth-draft"`, `"merch-official-sync"`, …) set by `.github/workflows/social-approval-notify.yml`'s `jq` projection and rendered by `approval-prompt.mjs` as `Drafted by: <x>`. With one drafter, the routine name carries no information. What is still worth knowing is **which lane the item came down**:

```jsonc
"lane": "calendar"   // "calendar" | "merch" | "appearance" | "reddit"
```

| Lane | Meaning |
|---|---|
| `calendar` | a slot Tree planned in `social/calendar.md` — the normal path |
| `merch` | a fast-lane item from a merch intent (T6) |
| `appearance` | a fast-lane item from an appearance intent (T6) |
| `reddit` | a Reddit prompt (S6), not a platform post |

`lane` is **not** in `contentHashPayload`, so adding it cannot void a stamp. `validateQueueItem` (`scripts/social/lib/queue-schema.mjs`) gains `lane` as a required enum for new drafts. `social/posted/` history keeps `sourceRoutine` and nothing reads it.

**Precondition, not an assumption: `social/queue/` must be empty when this lands.** It is *not* empty today — it holds four live drafts (`2026-09-12-shop-the-look-announce-{ig,x}.json`, `2026-09-13-speaknow-million-week-{ig,x}.json`) awaiting the gate. Making `lane` required while those sit there turns every one of them red. The build must either land after those four have resolved through the gate, or backfill `lane: "calendar"` into whatever remains in the same PR. Whoever picks this up: check the directory first — do not trust this paragraph's file list.

`approval-prompt.mjs` reads `draft.lane ?? draft.sourceRoutine ?? 'unknown'` in `formatTreeIdentityLine` and the header's `Drafted by:` line for exactly one release, then drops the fallback.

Note on what `sourceRoutine` actually contains today: `.github/workflows/social-approval-notify.yml` sets it from `github.event.pull_request.user.login`, so the brief's `Drafted by:` line currently shows a **GitHub login**, not a routine name — which is one more reason it carries no useful information and is worth replacing rather than keeping.

### Wave-ordering constraint (T1/T2 vs T6)

T1 makes `lane` required and T2 makes `critique` required, both in **Wave 3**. `merch-official-sync` and `appearance-discovery` keep writing queue files with neither until **T6 lands in Wave 4**. Between those waves every side-door PR would be red on a check the side door cannot yet satisfy.

Resolve it one of two ways, decided at build time by whoever sequences Wave 3 — both are fine, neither may be skipped:

- **(a)** gate both requirements on the item's lane: required when `lane === "calendar"` or `lane` is absent-and-authored-by-Tree, advisory for `merch`/`appearance` until T6; or
- **(b)** pull T6's "stop writing captions" half forward into Wave 3, leaving only the fast-lane drafting and rubric in Wave 4.

(b) is cleaner and is the recommendation — it removes the unreviewed-caption path a wave earlier, which is the change with the most safety value in this whole set.

### What "from Tree" means, surface by surface

| Surface | Today | After |
|---|---|---|
| Discord webhook username/avatar | `Tree` + `tree-avatar.png` (shipped, S5 / #4126) | unchanged |
| Discord brief first line | `Tree · slot: … · pillar: …` (shipped, S5) | unchanged |
| GitHub PR **author** | `sffan15-sys` / `github-actions[bot]` — an automation identity, not changeable | unchanged, and deliberately so (see below) |
| GitHub PR **title** | `growth: daily drafts 2026-09-18` | `Tree: daily social draft — 2026-09-18` |
| Branch | `growth/<date>`, `tree/<date>` | `tree/draft/<date>`, `tree/plan/<date>` |
| PR label | `growth` | `tree` (plus `social-draft` on draft PRs, unchanged) |
| Attribution trailer | `Tier-2: Growth — daily draft` / `Tier-2: Tree — weekly social plan` | `Tier-2: Tree — daily social draft` / `Tier-2: Tree — weekly social plan` |
| Weekly email `From:` | `Marjorie (swift2 chief of staff) <…>` | `Tree (Long Live social) <…>` |
| Weekly email subject | `Tree's weekly plan: <PR title>` | unchanged |
| Founders' Brief section | "Growth" | "Tree" |

**The PR author stays an automation identity on purpose.** GitHub gives the owner exactly one login, which every routine's PAT also runs as — the whole basis of the B1 ruling (`docs/decisions.md` 2026-09-11). Dressing a PR up as authored by "Tree" would invent an identity distinction GitHub cannot actually enforce, which is the mistake B1 exists to stop repeating. Identity lives where it is real: Discord.

---

## Mechanics

### 1. `docs/agents/tree.md` absorbs `docs/agents/growth.md`

Tree's charter gains, from Growth:

- **Mission**, rewritten as one desk: *plan the account, write the captions, measure the result — never post, never reply.*
- **The six hard rails** (listening-first · queue-and-ship gated by the founder's ✅ · autoposting bounded by code · replies stay human · account/payment are founder TX · crisis stop), verbatim, since they already bind Tree by reference (Tree invariant 9).
- **Voice and content boundaries** (fan-made framing, #36/Clownbot blocklist, the 2026-09-01 confirmed-only carve-out, no engagement bait) — verbatim.
- **The daily cadence**: listening scan, draft the day's calendar slots, flag empty slots rather than filling them.
- **Founder-notification buckets** and **cost rails** — verbatim.
- **Definition of done for a draft batch** — verbatim.

Tree's own invariant 1 ("never writes to `social/queue/`") is **deleted** — it was the whole point of the split. It is replaced by the real invariant:

> **1. Never posts, ever.** Tree writes drafts into `social/queue/` and nothing else. It never calls a platform API, never writes `social/posted/` or `social/failed/`, and never merges its own draft PR. The queue plus `social-poster.yml` remains the only path out, so `SOCIAL_FREEZE` stays a single total kill switch, and the founder's ✅ stays in front of it.

Invariant 2 ("never edits its own charter or the strategy doc") stays, with T5's one narrow exception: Tree may open a PR proposing a diff to `docs/marketing/social-strategy.md`, which a founder merges — it may never merge that PR itself.

Renumbering: the merged invariant list is renumbered 1–16 and every in-repo reference to a Tree or Growth invariant by number is repointed in the same PR.

### 2. What does **not** move into the charter

`growth.md`'s long engineering sections — the posting-pipeline mechanics, the Facebook cross-post notes, the `SOCIAL_POSTER_PAT` explanation, the duplicate-post incident (2026-07-17), the silent-outage post-mortem (2026-07-21 → 08-04), the `#1897` Instagram-container note — are **history and mechanics, not charter**. They move verbatim to a new **`docs/social/pipeline.md`**, which `tree.md` links once. Dropping them into a charter would make it unreadable and it would stop being read; they are too valuable to lose and too detailed to keep inline.

`docs/marketing/growth-plan.md` is untouched and stays Tree's to maintain (§0-3, §7-9 remain live per `growth.md`).

### 3. `docs/agents/growth.md` becomes a tombstone

Not deleted — a great deal of the repo cites it. It is reduced to a pointer:

```markdown
# Growth & Community desk — MERGED INTO TREE (2026-09-12)

This desk no longer exists as a separate agent. Its charter, rails and voice
rules are now part of `docs/agents/tree.md`; its pipeline mechanics and
incident history are in `docs/social/pipeline.md`. See
`docs/specs/tree-overhaul/t1-one-charter.md` and `docs/decisions.md`
(2026-09-12) for why. Nothing here is live; do not add to this file.
```

### 4. Renames

| From | To |
|---|---|
| `.github/workflows/routine-growth-draft.yml` | `.github/workflows/routine-tree-daily-draft.yml` (`name: routine-tree-daily-draft`) |
| `docs/agents/runner-prompts/growth-draft.md` | `docs/agents/runner-prompts/tree-daily-draft.md` |
| `.github/workflows/routine-tree-weekly-plan.yml` | unchanged (already Tree-named) |
| `docs/agents/runner-prompts/tree-plan.md` | `docs/agents/runner-prompts/tree-weekly-plan.md` |

Cron times are unchanged: weekly plan `0 10 * * 1`, daily draft `0 11 * * *`.

### 5. Tier-2 attribution trailers stay valid

`scripts/routine-output-sample.mjs` extracts the identifier with `/Tier-2:\s*([^`\n]+)/` **from the runner-prompt file**, then searches GitHub for PRs containing `Tier-2: <identifier>`. Renaming the identifier in a prompt file is therefore self-consistent — sampling keeps working — but it **cannot match PRs opened before the rename**, so the sampler will report a thin window for `Tree — daily social draft` for a few days.

That is accepted rather than engineered around: it is a days-long reporting gap on a routine with zero users, and an alias mechanism would be permanent machinery bought for a transient problem. The rename PR body states the expected gap; `plan-recheck` checkpoint R2 is where it should have cleared.

Required in the same PR: the workflow's `prompt_file:` must point at the renamed prompt, or the sampler reports "no `Tier-2:` line in prompt file" for the routine.

### 6. Email identity

`scripts/watchdog/send-mail.py` hardcodes `msg["From"] = f"Marjorie (swift2 chief of staff) <{sender}>"`. Parameterize it:

```python
from_name = payload.get("fromName", "Marjorie (swift2 chief of staff)")
msg["From"] = f"{from_name} <{sender}>"
```

`.github/workflows/tree-mail.yml`'s `tree-pr-mail` payload sets `"fromName": "Tree (Long Live social)"`. Every other caller omits it and is unchanged. The envelope sender stays `MARJORIE_EMAIL` — it is the authenticated Gmail account, and changing it is a credential action, not a code change.

### 7. Reference sweep

One mechanical pass in the same PR. `rg -n --hidden -g '!node_modules' -iE '\b(growth desk|Growth & Community|routine-growth-draft|growth-draft\.md|docs/agents/growth\.md)\b'` must come back empty except for `docs/decisions.md` (history is never rewritten), `docs/social/pipeline.md`, the `growth.md` tombstone, and `docs/marketing/growth-plan.md`'s own filename. Known call sites to expect: `docs/agents/README.md`, `docs/agents/runners.md`, `docs/agents/marjorie.md`, `MAP.md`, `docs/roadmap.md`, `docs/agents/content-shift.md`, `social/README.md`, `docs/agents/tree.md` itself.

The `growth` **label** is renamed to `tree` via `gh label` — a label rename preserves it on existing PRs, so no history is lost. Every workflow that adds or filters on `growth` is updated in the same PR.

---

## Acceptance criteria

1. `docs/agents/growth.md` contains only the tombstone; every rail, voice rule and cadence line from it appears either in `docs/agents/tree.md` or in `docs/social/pipeline.md`, with no content lost (verified by a reviewer diffing the pre-merge `growth.md` against the union of the two).
2. `docs/agents/tree.md` no longer contains an invariant forbidding writes to `social/queue/`, and contains the replacement invariant 1 quoted above.
3. `.github/workflows/routine-tree-daily-draft.yml` exists with `name: routine-tree-daily-draft`, cron `0 11 * * *`, and a `prompt_file:` pointing at `docs/agents/runner-prompts/tree-daily-draft.md`; the old workflow file does not exist.
4. `node scripts/routine-output-sample.mjs` lists both Tree routines and flags neither for a missing `Tier-2:` line.
5. A queue item written by the daily run carries `lane: "calendar"`; `validateQueueItem` rejects an item with a `lane` outside the four-value enum, and rejects one with no `lane` at all.
6. The Discord brief for such an item renders `Drafted by: calendar` (not `unknown`), proving the `lane`/`sourceRoutine` fallback path.
7. `send-mail.py` with no `fromName` in the payload still produces the exact Marjorie From header (regression test), and with `fromName` produces `Tree (Long Live social) <…>`.
8. The reference-sweep `rg` above returns only the four allowed classes of hit.
9. Full suite green; `npm run typecheck --workspace=@swift2/web` green.

---

## Files affected

| Path | Change |
|---|---|
| `docs/agents/tree.md` | absorbs Growth's charter; invariant 1 replaced; renumbered |
| `docs/agents/growth.md` | reduced to a tombstone |
| `docs/social/pipeline.md` | **new** — pipeline mechanics + incident history moved verbatim from `growth.md` |
| `docs/agents/runner-prompts/tree-daily-draft.md` | renamed from `growth-draft.md`, Tier-2 line and charter pointer updated |
| `docs/agents/runner-prompts/tree-weekly-plan.md` | renamed from `tree-plan.md` |
| `.github/workflows/routine-tree-daily-draft.yml` | renamed from `routine-growth-draft.yml` |
| `.github/workflows/routine-tree-weekly-plan.yml` | branch/label/title strings |
| `.github/workflows/tree-mail.yml` | `fromName` in the payload |
| `scripts/watchdog/send-mail.py` | parameterized From display name |
| `scripts/social/lib/queue-schema.mjs` | `lane` enum, required |
| `scripts/social/approval-prompt.mjs` | `lane ?? sourceRoutine` |
| `.github/workflows/social-approval-notify.yml` | project `lane` instead of `sourceRoutine` |
| `docs/agents/README.md`, `docs/agents/runners.md`, `docs/agents/marjorie.md`, `docs/agents/content-shift.md`, `MAP.md`, `docs/roadmap.md`, `social/README.md` | reference sweep |
| `tests/` | `send-mail` From regression, `lane` schema cases |

---

## Open questions

None blocking. Decided here — all reversible:

- **PR author identity is left alone.** Inventing a "Tree" GitHub identity would recreate exactly the fiction B1 rejected. *(reversible: a bot account could be added later)*
- **Pipeline mechanics split out to `docs/social/pipeline.md` rather than absorbed.** A charter nobody finishes reading is not a charter. *(reversible)*
- **Tombstone, not deletion.** Too many in-repo citations; a dangling link is worse than a three-line redirect. *(reversible)*
- **`lane` replaces `sourceRoutine` outright**, no dual-write period. The queue is *not* empty (see the precondition above), so the build either lands after the live drafts resolve or backfills `lane: "calendar"` into whatever remains, in the same PR — a one-off backfill is cheaper than a permanent dual-write. *(reversible)*
- **The Tier-2 sampling gap is accepted, not engineered around.** *(reversible)*
- **The weekly email's envelope sender stays `MARJORIE_EMAIL`.** Changing it is a credential action — founder-only — and the display name achieves the readable outcome. *(reversible)*
