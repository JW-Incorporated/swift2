# PLAN.md — Community section: the research dataset

Branch `research/communities`, cut from `origin/main` @ `d969a29e`.
Source of truth: Joey's research brief (uploaded 2026-08-14,
`communityresearchprompt.md`). This plan covers the RESEARCH deliverable only —
building the Community surface is separate work.

## Goal

The definitive, verified map of where Taylor Swift fans actually gather, in a
form a fan can browse to discover corners of the fandom they didn't know
existed — and in a form that can be re-run and refreshed rather than rotting.

## What the brief asks for, and the three things it doesn't say

The brief is clear on scope, fields, method and quality bar. Three gaps found
before starting, each of which would have bitten later:

- **A Community spec already exists and is broader.**
  `docs/definition-of-done.md:136-142` item 4b names **Instagram and TikTok**
  as platforms; the research brief omits both. Also `docs/specs/2026-08-13-
  landing-page-brief.md:151`. Status there is ⬜ not started, awaiting spec
  approval. **Instagram/TikTok are logged as a known gap, not silently added** —
  they are a different shape (creator accounts, not joinable groups) and
  whether they belong is Joey's product call.
- **The spec requires "an owner with a refresh cadence."** The brief does not.
  A curated link directory decays: invites expire, groups go private, subs go
  dark. Addressed here by making every entry carry its own provenance and by
  shipping `sources.md` so the whole thing is re-runnable — but **who owns the
  refresh is unanswered and is a founder question.**
- **`data/` does not exist in this repo.** Convention for structured content is
  `supabase/seed/<type>/*.mjs`, validated by `scripts/validate-content.mjs`
  (which already enforces >=1 source URL per record). The brief's literal paths
  are used for the research artifact; converting to seed format is a step in
  the BUILD work, not here. Recorded so nobody assumes this JSON is wired in.

## The central design decision: verification provenance per entry

The brief says "verify every entry… no hallucinated links — a broken link in
this dataset is worse than a missing one." That is right, and it collides with
what each platform actually permits:

| Platform | What can truly be verified |
|---|---|
| **Reddit** | Everything. `about.json` gives real subscriber counts; `new.json` gives real post recency. Fully verifiable. |
| **Discord** | Invite API (`/api/v10/invites/<code>?with_counts=true`) returns real guild name and member/presence counts, or 404 for a dead invite. Channel activity is NOT observable without joining. |
| **Facebook** | Login wall. Group pages, member counts and activity are largely NOT fetchable. Named in the brief as the largest category and it is the least verifiable. |
| **Long tail** | Mixed. Tumblr and fan sites are fetchable; Amino/Geneva/group chats often are not. |

So **every entry carries a `verification` block** — `status`
(`verified-live` / `third-party-cited` / `listed-only`), `method`,
`evidence_url`, `checked_at`. Verified and unverified entries must never blend
into one confident-looking list. This is the difference between a dataset that
can be refreshed and one that has to be redone.

**The named risk:** Facebook is where an agent will confidently invent
plausible groups ("Swifties Worldwide 🌟, 127k members"). The Facebook brief
therefore forbids any entry without positive evidence and requires the drop
count to be reported. **A low Facebook count is a finding, not a failure.**

## Deliverables

| Path | What |
|---|---|
| `data/communities.json` | Full dataset, sorted by `hype_score` desc, every entry carrying `verification` |
| `data/communities-report.md` | Landscape narrative, top 10 with why they matter, notable niches, surprises, and an honest reliability read per platform |
| `sources.md` | Every recommendation thread, listicle and directory mined, so this is re-runnable |
| `docs/decisions.md` | Entry recording the verification-provenance decision and the Instagram/TikTok gap |

## Steps

1. [x] Scout the repo for an existing Community spec and data conventions.
2. [ ] **Four parallel researchers, one per platform** — Reddit, Facebook,
   Discord, long tail. Each writes `scratchpad/communities-<platform>.json`
   plus `scratchpad/sources-<platform>.md`. Running now.
   - Verify: each returns an entry count, a verification-status breakdown, and
     (Facebook) a drop count.
3. [ ] **Merge, dedupe and normalise — orchestrator, not an agent.** Cross-
   platform dedupe (the same community often has a subreddit AND a Discord),
   consistent `niche` vocabulary, and a re-scored `hype_score` on one scale.
   Four agents scoring independently will not be comparable; rescoring is a
   judgment call and stays with me.
   - Verify: no duplicate URLs; every entry has a `verification` block; the
     `niche` set is a closed vocabulary.
4. [ ] **Spot-check a sample myself.** Re-fetch a random ~10% plus every entry
   with `hype_score >= 8`. Agent-reported verification is a claim.
   - Verify: report the sample size, the pass rate, and any entry demoted.
5. [ ] Write `data/communities-report.md`, including a per-platform reliability
   read. The Facebook slice's honest confidence level goes in the report body,
   not a footnote.
6. [ ] `sources.md` merged from the four per-platform logs.
7. [ ] `docs/decisions.md` entry.
8. [ ] PR. **No merge without Joey's authorization** — previous grants were
   per-workstream and are spent.

## Quality bar (from the brief)

- **30-80 entries.** 300 means no curation; 10 means no digging.
- Every URL verified live this session, or explicitly marked otherwise.
- Descriptions in a warm fan-to-fan voice — eras, lore and inside language used
  naturally, never performed.
- Moderation problems or drama flagged briefly and neutrally.

## Known risks

- **Fabricated Facebook entries.** The single biggest failure mode. Mitigated
  by the evidence bar and the drop count; verified further by my own spot-check.
- **Discord invites expire.** Vanity URLs preferred; temporary-looking invites
  flagged. Some percentage WILL be dead within months — this is inherent, and
  the refresh-owner question is the real answer to it.
- **`hype_score` is subjective.** Four agents cannot produce a comparable scale;
  step 3 rescores centrally.
- **Drama flags are a judgment call about real communities.** Keep them brief,
  neutral and sourced. This is content about real people and real moderators.
- **Scope creep into building the feature.** This plan stops at the dataset.

## Do not

- Don't invent a URL, a member count, or a community. Ever.
- Don't pad to hit a number.
- Don't silently add Instagram/TikTok — log the gap, let Joey rule.
- Don't wire the JSON into the app; that is separate work with a different
  data convention (`supabase/seed/`).
- Don't attempt to log in, join, or bypass any platform's auth.
- Don't proceed past a failed verification — report it.
