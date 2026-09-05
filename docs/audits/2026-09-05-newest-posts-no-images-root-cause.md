# Root cause: the newest 9 Showgirl-era posts have no images despite "passing audits"

**Filed:** 2026-09-05 · **Card:** t_a318916c (Fable) · **Trigger:** founder escalation — "the first 9 posts still have no images! If the first 9 look this bad, I cannot trust any of the audits done on the rest of the site."

Read-only investigation. Nothing on the site was changed by this card. Every claim below was reproduced from `origin/main` @ `388c8e85` and the live GitHub state on 2026-09-05.

## 1. The symptom, verified

`contentForEra()` sorts newest-first, so the top of The Life of a Showgirl era is the most recently dated items. In the built vault (`apps/web/lib/longlive/content-vault.generated.ts`, which is what production renders) the 9 newest items with no `images` field — so the UI shows era art (`/eras/the-life-of-a-showgirl.png`) instead of a photo — are:

| # | Date | Seed key | Authored by | Why no photo at author time |
|---|------|----------|-------------|------------------------------|
| 1 | 2026-09-02 | `kelce-new-heights-wedding-recap` | Vault Run #3747 (09-04 pm) | not sourced (that run only added a Dolly photo) |
| 2 | 2026-09-01 | `showgirl-dog-tommy-hilfiger-campaign` | Vault Run #3660 (09-01) | image hosts egress-blocked (403 CONNECT) |
| 3 | 2026-09-01 | `showgirl-kelce-bratenahl-home` | Vault Run #3684 (09-02) | deliberate: residence privacy redline (L1) — **should stay photo-less** |
| 4 | 2026-08-31 | `showgirl-brazil-taylor-swift-law` | Vault Run #3744 (09-04) | egress-blocked |
| 5 | 2026-08-30 | `showgirl-caitlin-clark-friendship-bracelet-nike` | Vault Run #3684 | "only non-reusable retailer/on-court shots" |
| 6 | 2026-08-29 | `showgirl-harry-styles-msg-wedding-nod` | Vault Run #3660 | egress-blocked |
| 7 | 2026-08-28 | `showgirl-ashley-taunton-donation` | Vault Run #3434 (08-29) | deliberate: every hero image is a Taylor/private-individual composite (redline) — reviewed 08-31 |
| 8 | 2026-08-27 | `toy-story-5-disney-plus-piano-version-video` | Vault Run #3409 (08-28) | none sourced; **a verified photo exists in unmerged PR #3579** |
| 9 | 2026-08-21 | `showgirl-dakota-johnson-la-girls-night-rumored` | content-shift #3159 (08-24) | **a verified photo exists in unmerged PR #3466** |

(Items 10–11 by date, Dolly tribute and Adam Scott, each have one photo.)

So: 2 of the 9 are correct by policy, 2 already have verified photos sitting in stranded PRs, and 5 were shipped text-only by the daily Vault Run because the scheduled environment could not reach any image host on those days.

## 2. Root causes (three, stacked)

### RC-1 — The daily photo pipeline has been silently dead since 2026-08-30 (a merge-gate mismatch, not a content problem)

The Photo Enrichment worker did its job on 08-30 and 08-31: PR #3466 (7 new verified photos incl. Dakota Johnson) and PR #3579 (2 new photos incl. the Toy Story piano video, plus 6 focal-point fixes). Both are **still open**, `build` green, never merged.

Why: `auto-merge-content.yml`'s branch/author gate (`scripts/automerge-branch-author-gate.mjs`, added 2026-08-24 in #1969) only auto-merges content PRs whose head branch matches a documented content-lane prefix (`vault/`, `content-shift/`, `growth/`, …). The Photo Enrichment worker's trigger runs on `claude.ai/code` and opens PRs on **`claude/pensive-galileo-*`** branches, which is on no list. The gate's verdict on #3466, verbatim from the Actions log:

> PR #3466 (author `sffan15-sys`, branch `claude/pensive-galileo-5p79xu`) does not match this repo's known content-lane branch-naming conventions and/or known routine identities, so it is not even considered for auto-merge.

The four prior photo PRs (#3343, #3384, #3405, #3420 — same `claude/pensive-galileo-*` pattern) all landed only because a founder merged them by hand each morning (`mergedBy: sffan15-sys`). On 08-30 that stopped, and the worker — which is told to "never babysit your own PR" and to trust auto-merge — kept reporting success on issue #762. Every runner prompt says "auto-merge lands it once `build` is green"; for this worker that has **never** been true. The worker's own protocol has no step that detects "my last PR never merged."

Compounding: #3466 is now `mergeState=DIRTY` (conflicts in the generated vault only — the seed files merge cleanly); #3579 still merges clean today.

### RC-2 — The Vault Run's scheduled environment intermittently blocks all image hosts, and the fallback is "ship text, someone later adds the photo" — but "someone later" is RC-1

`docs/agents/content-shift.md` step 3b (Wyatt, 2026-07-24: "photos belong in ingestion, not a later backfill") makes a picture the default, with an explicit exception: if nothing is verifiable, ship text and let `photo-sparsity` route it to Photo Enrichment. The Vault Run hit the org egress block (403 CONNECT to wikimedia/instagram/billboard/ytimg) on 09-01, 09-02, 09-03 and the 09-04 morning run — every one of them logged "Photo Enrichment: no-op, environment-blocked" and shipped its new moments text-first. That is the documented degrade path working as designed. It only produces photo-less pages *permanently* because the backfill lane it hands off to (RC-1) hasn't landed anything since 08-29. HUMAN-ACTIONS.md #22 has tracked the egress flakiness since 08-25 and is still OPEN.

### RC-3 — The "audits" the founder was shown were never checking this, so passing them proved nothing about photos

Three different things are called an audit here, and none of them asserts "newest posts have photos":

1. **The 2026-09-04 era quality audits** (kanban cards t_52bfd193 / t_ca797d0e etc., issues #3754–#3786) were explicitly read-only reviews of *voice, fabrication, sourcing minimums, and hotlink/credit discipline* against the content framework. Photo coverage was out of scope by design — the Debut audit (#3754) even says so ("two gaps not already covered by the CIE photo-sparsity tracker"). Their green verdicts were honest about what they checked; the summary passed up to the founder was not scoped that narrowly.
2. **The CIE deterministic scan** (`docs/audits/engine/2026-09-04-cie-run.md`) *does* flag these exact pages: 30 `content.photo-sparsity` findings on 09-04, of which 7 of the 9 pages above are individually listed ("Marquee moment has no photos"). But it files them as **P2** under the single rollup issue #1721 ("54 items to review", last updated 08-25), and the report's "Top findings" section only surfaces P0/P1. The report totals read "P0 0 · P1 4" — which reads as a pass. The photo gap was reported every day and buried every day.
3. **The Vault Run's own PR bodies** said "Photo Enrichment: no-op, infra-blocked" on four consecutive days, and PR #3747 said "Photo Enrichment landed 1 photo". Both true; neither says "the era's top of feed is now 8 photo-less pages in a row."

There is also no checker at all for *recency*: `photo-sparsity` ranks by visibility score, which does not weight date, so the newest page on the site competes on equal terms with a 2008 item. Nothing in the engine says "the first N items a visitor sees must carry a real primary image."

## 3. Why this matters beyond the 9

- The two stranded PRs also carry fixes elsewhere (TTPD, Red, Speak Now, Evermore focal points; a host allowlist add). All of it has been invisible for 6 days.
- Every day the egress block holds, the Vault Run adds 1–2 more text-only marquee pages to the top of the feed; the backlog compounds (41 zero-photo pages are in the photo queue today, 27 of them Showgirl-era).
- Any future audit whose passing result is quoted to the founder needs its scope stated in the same sentence, or this repeats.

## 4. What the founder's distrust does and does not cover

- **Justified:** "the audits passed" was presented as site-wide quality assurance when it covered prose/sourcing only. The rest-of-site *photo* state was not audited by those cards.
- **Not justified:** the prose/sourcing findings from those audits (issues #3754–#3786, fixed in #3788, #3792, #3794 etc.) were spot-verified here and are real; nothing in this investigation contradicts them. The audits were narrow, not wrong.

## 5. Recommended fixes (for the follow-up cards; none applied here)

1. **Unstick the pipeline (engineering, today):** add `claude/` — or better, have the Photo Enrichment trigger prompt use a documented branch prefix `content/photo-enrichment-<date>` (it already did once, #3296) — to `CONTENT_LANE_BRANCH_PREFIXES` and its test. Land #3579 now (clean); rebase/regenerate #3466 (seed merges clean, regenerate the vault). That alone puts photos on items 8 and 9.
2. **Backfill the 5 egress-blocked pages** (items 1, 2, 4, 5, 6) from a session with image egress — one content card, verify-first per protocol. Leave 3 and 7 photo-less on purpose and mark them reviewed-sparse so the queue stops re-surfacing them.
3. **Add a "top of feed" checker:** for each era, the N newest items (N=10) must have a real primary image or an explicit `photosReviewed:` reason in the seed; severity P1 so it appears in the CIE report's top section and the Founders' Brief.
4. **Worker self-check:** Photo Enrichment / Vault Run prompts get one line: "before opening a PR, `gh pr list --search 'photos in:title' --state open`; if your previous PR is still open, say so at the top of #762 and in the PR body, and do not report success." Cheaper than any monitor.
5. **Audit-reporting rule:** any audit summary relayed to the founders states its scope in the first line ("prose + sourcing only; photos not checked").
6. Close the loop on HUMAN-ACTIONS.md #22 (egress policy) — the founder call that item asks for is the only thing that makes step 3b's degrade path rare instead of daily.

## 6. Reproduction

```
node artifacts/tmp-newest9.mjs          # newest items in the built vault + their image urls
node scripts/content-engine/run.mjs scan --no-images
node artifacts/tmp-findings.mjs         # photo-sparsity findings on those keys
node artifacts/tmp-rank.mjs             # where the 9 rank in the photo queue
gh pr view 3466 --json mergeStateStatus  # DIRTY, open since 08-30
gh run view 33297693978 --log | grep 'not even considered'
```
(The three `artifacts/tmp-*.mjs` helpers are attached to the card, not committed.)
