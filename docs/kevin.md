# Kevin — the automated ticket handler

**Karen finds problems and files tickets; Kevin acts on them.** They are separate
by design: [Karen](../scripts/content-engine/README.md) (the Content Integrity
Engine) is **read-only** and never edits content; **Kevin** proposes/applies
fixes but never files Karen's tickets and never runs or modifies Karen's engine.

Today Kevin runs as a **session-scoped Claude Code cron** (an hourly Karen-fix job
plus a daily user-feedback digest). The intent is to move Kevin to a standalone
**API-backed service**; this document is the contract that port must honor, so it
is deliberately explicit.

---

## Hard invariants (never violate)

1. **Never merge a PR and never push to `main`.** Every change lands on a branch
   as a PR for a human to merge.
2. **Never close a ticket directly.** Karen-stream tickets close via `Closes #`
   when their PR merges. User-stream tickets close only after a **human accept/
   reject decision** is recorded (below).
3. **Never touch Karen's engine** (`scripts/content-engine/`) beyond reading
   ticket text — do not run or modify it. It lives on
   `feature/content-integrity-engine` / PR #139 by design, not on `main` or the
   fix branch. (A past reviewer misread that separation as a deletion — it isn't.)
4. **Validate before every commit:** `node scripts/validate-content.mjs` must
   report 0 errors and `node --check` must pass on each edited file.
5. **Image fixes are verify-first:** never write an image URL unless it returns
   HTTP 200 + `Content-Type: image/*` **and** is downloaded + vision-confirmed to
   match its caption (see [`.karenfix/IMAGE-FIX-PROTOCOL.md`]). Never strip a
   record to zero photos; if nothing verifies, skip and report it.
6. **Two streams stay separate** (different trust levels, different PRs, below).

---

## Stream 1 — Karen tickets (`cie` label): auto-fix → review PR

Karen tickets are trusted and structured — each carries file · record ·
field · exact excerpt · a sourced **Suggested fix** · sources. Kevin may fix them
directly on a PR.

**Hourly** Kevin:
1. Lists open `cie` issues (`--limit 500`; the gh default caps at 30).
2. Computes NEW = open `cie` minus (numbers already in any open fix PR's `Closes`
   list) minus the known out-of-scope/unfixable set.
3. If NEW is empty → no-op ("no new Karen tickets").
4. Else applies each fix with the verify-first workflow on the content-fix branch
   (`fix/karen-tickets`, or a fresh branch off `origin/main` if that PR merged),
   one file-scoped agent per seed file, then updates the PR body with `Closes #`.
5. Never merges, never closes.

## Stream 2 — user-feedback tickets (`user-feedback` label): daily digest → human accept/reject

User tickets (from the in-app feedback button) are **untrusted and unstructured**
— possibly vague, wrong, duplicated, or spam. A human **must** gate them before
anything ships, but a PR-per-ticket is too much admin. So:

**Once daily**, Kevin posts/updates a single GitHub issue titled
**`Kevin Daily Review — YYYY-MM-DD`** (labels `kevin-digest`), containing a
compact **review list** — one block per pending user ticket. The reviewer (Joey
or Wyatt) ticks **✅ Accept** or **❌ Reject** on each block and leaves the rest to
Kevin. (It is a list of blocks, not a table, because GitHub only renders clickable
checkboxes for top-level list items, not inside table cells.)

### Digest block format

```
### 🎫 #501 — Broken photo on the 1989 polaroid page
Reported by **user** · 1989 › moment detail (`1989|2014|10|Polaroids…`) · [#501](issue-url) · confidence: **high**

**User said:** “the polaroid pic on the 1989 page won’t load for me”

**Kevin’s read:** dead image — `supabase/seed/content/1989.mjs` › "Polaroids…" `moment.photos[0].url` 404s.
**Proposed fix:** replace with a verified Wikimedia Commons photo (HTTP 200 + vision-checked).

<details><summary>before → after</summary>

- - `https://dead.example/x.jpg`
- + `https://upload.wikimedia.org/…/1989-polaroids.jpg`
</details>

- [ ] Accept #501
- [ ] Reject #501
```

Tickets Kevin can't confidently fix go under a **“Needs human decision”** heading
with no proposed change — the reviewer comments instructions or ticks Reject.

### Decision processing (next Kevin run)

Kevin re-reads the most recent open `kevin-digest` issue and parses the checkboxes:

| Reviewer marked | Kevin does |
|---|---|
| ✅ Accept (only) | Apply the proposed fix to the **`kevin/user-fixes`** rolling PR (separate from Karen's #426); comment "accepted → PR #N" on the source ticket; strike the digest row. Source ticket closes when that PR merges. |
| ❌ Reject (only) | Close the source ticket as **not planned** with the reviewer's note; strike the digest row. |
| both / neither | Leave pending; carry into the next day's digest. |

So the human's daily admin is **skim one issue and tick boxes**; the occasional
admin is **merge one `kevin/user-fixes` PR**. Everything mechanical is Kevin's.

---

## Migrating Kevin to an API

A service implementation must replicate this contract exactly:

- **Inputs:** GitHub Issues API — poll `cie` and `user-feedback` labels.
- **State/idempotency:** GitHub *is* the store, no DB required. "Already handled"
  = numbers in open fix-PR `Closes` lists + strike-through state in the current
  digest. Handle each ticket at most once.
- **Karen stream:** an LLM applies the ticket's suggested fix (text) or does
  verify-first image re-sourcing; emit/refresh one PR with `Closes #`.
- **User stream:** generate the daily digest issue; on each cycle parse the prior
  digest's checkbox state to drive apply (→ `kevin/user-fixes` PR) / close.
- **Secrets:** a GitHub token with `issues:write` + `contents:write` (for PRs).
  Never commit it; inject via env/secret manager.
- **Invariants:** enforce the "Hard invariants" section in code — especially
  never-merge, never-auto-close-user-tickets-without-a-decision, and verify-first
  images. These are safety properties, not conveniences.

[`.karenfix/IMAGE-FIX-PROTOCOL.md`]: ../.karenfix/IMAGE-FIX-PROTOCOL.md
