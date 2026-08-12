# Founder comms — how to write anything a founder will read in their inbox

**Standing standard, 2026-08-11.** Applies to EVERY email, `founder-task`
issue body, and `founder-decision` issue body any agent writes. These bodies
get emailed to the founders **verbatim** (`tree-mail.yml` digest,
`brief-mailer.yml`) — the issue body *is* the email.

## Why this exists

On 2026-08-11 Joey received four near-simultaneous emails from the
`founder-task` mailer. The content was agent-coordination material — merge
matrices, "MERGEABLE/CLEAN", rubric and file-path references. Joey's verdict,
verbatim:

> "it's too jargon heavy, very unclear what it wants me to do. I am very good
> at doing stuff but I need simple instructions."

The founders are non-coders with full-time jobs. A founder message that needs
repo context to decode does not get acted on — it gets ignored, and the whole
founder-comms lane loses credibility with it.

## The standard

1. **Lead with "What I need from you:"** — a numbered list, FIRST thing in
   the body. Each step is ONE plain-language sentence, contains the direct
   link to the exact page where the action happens, and is doable without
   opening anything else first.
2. **Say how long it takes** ("Time needed: ~10 minutes") right above or
   below that list.
3. **No repo jargon.** No bare PR numbers, file paths, branch names, label
   names, rubric names, or CI states without an immediate plain-word gloss:
   write "#1934 (an update that adds sources)", never "#1934 is
   MERGEABLE/CLEAN". If a term needs a paragraph to explain, the term does
   not belong in a founder message at all.
4. **"Why" is ONE sentence at the END**, not the front. Founders act first
   and read rationale second; a message that opens with context reads as
   FYI-noise and gets skipped.
5. **If no human must act, it is not a founder message.** Coordination
   between agents (merge ordering, file claims, fleet scheduling) goes in a
   `desk-coordination` issue, which never mails anyone. The `founder-task`
   label is a promise: *a human founder must personally do the steps, and the
   body is written for a non-coder.*

A quick self-test before applying `founder-task`: could Joey do every step on
his phone, from the email alone, without asking what a word means? If not,
rewrite or relabel.

## Worked example — the 2026-08-11 email, before and after

**Before** (the body that went out four times; abridged — the real one was
~3× longer):

> TL;DR — This is Joey's #1 pre-launch gate (roadmap J3.5: bring Midnights +
> Tortured Poets timelines to Active-tier depth,
> relationship/sighting/fashion-weighted). It is currently blocked by open
> batch PRs on those two files. This ticket is the deconfliction wrapper:
> don't start authoring the two timelines yet — here's the exact merge
> sequence that clears the collision [...]
>
> ⛔ Both target files are collision-locked right now.
> midnights.mjs — open PRs #1934 (all-era sourcing) and #1618 (your own
> dup/stub cleanup). tortured-poets.mjs — open PRs #1934, #1908 (length
> caps), #1585 (photos). [...] Land #1934 first — it's MERGEABLE/CLEAN and
> touches all 12 content files; landing it first means every other content PR
> rebases once instead of #1934 re-conflicting repeatedly. [...]
>
> Fleet note: Once you start on these timelines, the automated fleet (Content
> Shift / Vault Run) will keep targeting the same files unless there's an
> ownership lock — see the standing-collision section of the deconfliction
> summary issue.

Every fact in it is true. It still fails: the ask is buried, every noun is
repo jargon, and "roadmap J3.5", "Active-tier", "rebases once" mean nothing
in an inbox.

**After** (same ask, written to this standard):

> **Time needed: ~10 minutes.**
>
> **What I need from you:**
>
> 1. Merge these four updates, in this exact order, by opening each link and
>    clicking the green "Merge pull request" button (wait for each one's
>    checks to turn green before the next; if a button is grey, skip it —
>    the team will fix it and re-ask):
>    1. [#1934](https://github.com/JW-Incorporated/swift2/pull/1934) — adds
>       missing sources to existing content
>    2. [#1618](https://github.com/JW-Incorporated/swift2/pull/1618) — your own
>       cleanup from July
>    3. [#1908](https://github.com/JW-Incorporated/swift2/pull/1908) — trims
>       overlong entries
>    4. [#1585](https://github.com/JW-Incorporated/swift2/pull/1585) — adds
>       photos
> 2. Before you start writing about any album era, tell Wyatt which one —
>    so the automated writers skip that era while you're in it.
>
> One thing to hold off on: don't start the Midnights or Tortured Poets
> timelines until step 1 is done.
>
> **Why:** four automated updates are editing the same files you need, and
> merging them first (in this order) means nobody's work gets lost to
> conflicts.

## Enforcement

- `docs/agents/README.md` › label table defines `founder-task` and
  `desk-coordination`.
- `docs/agents/tree.md` (hard invariants) and
  `docs/agents/runner-prompts/tree-plan.md` (step 7) bind Tree, the standing
  weekly filer of founder tasks, to this document.
- Any NEW runner prompt that files `founder-task` or `founder-decision`
  issues must reference this file in the step that files them.
