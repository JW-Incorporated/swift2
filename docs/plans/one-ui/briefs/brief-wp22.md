# WP2.2 executor briefs (A, B, C1–C3, D): draft for the PM

Sources: PLAN.md §WP2.2 (lines 329-340), §WP2.1, §WP2.4–2.13, Calls C1–C6;
OPERATING-MODE.md §5, §7, §9; PROGRESS.md row "2.1–2.14" (the Fable carry
list from #4794) and the 2026-10-02 19:00 Fable ruling on 2.1-B; brief-wp21.md.
Research read from `origin/main` @ 2fef8eae (2026-10-03). Every file:line
below is from that commit.

WP2.2 is **[codex]**. Per the owner directive (PROGRESS 2026-10-02), Fable
reviews these briefs before launch and does a design-fidelity review of the
A and B PRs. Codex adversarial review runs on every PR. The PM runs Codex,
not the executor.

## FABLE REQUIRED (2026-10-03 02:20) - apply before launch; supersedes conflicting text below
A1. injectedCorpus() must be O(1): ReaderCorpus exposes lookups as FUNCTIONS (getContentItem(id), songTarget(id)), never prebuilt Maps; Maps are built only inside corpusFromInputs (else native screens/server routes regress). A2. Flat-order audit failure does NOT block A: land A with the result documented; offending ids block C2 only.
B3. Step 0 = Playwright perf mark on the parity fixture in a browser: unthrottled must be <=15 ms; also report 4x CPU-throttled (no gate). Node timing is not evidence. If >15 ms: stop; remedy is moving fingerprint-only domains out of the eager build (contract change -> Fable), NOT laziness. B4. useReaderSnapshot narrows with a type guard isReaderSnapshot(v) (domains in v), not key equality. B5. packages/ui/package.json in the B touch set (@swift2/experience dep if 2.1-A did not declare it).
C6. Server-shared helpers: data parameter REQUIRED, no default; the module-data wrapper lives in a *.server.ts with import server-only so client code cannot silently fall back to the impure path.
ALL7. Before every parity.yml run, merge origin/main into the stack bottom-up (2.1-C re-baselines fonts; stale branch = spurious diff). WP2.2 NEVER re-baselines.
OPTIONAL adopted: C1-C3 each base on B independently (B adds renderWithReader).
ORDER: A now (parallel with 2.1-A); B after 2.1-A merged; C, D after B. Earliest wrong-signal: B probe hash != fixture.json.

## PM rulings (2026-10-03 02:18) - supersede the open questions below
1. Context lives in packages/ui (one UI source; DOM host consumes it too) -> B waits for WP2.1-A merged. 2. No-module-global-providers gate = READER path only; list remaining globals (server routes, native screens) in docs as out of scope. 3. Keep the ~15 ms snapshot-build budget: B measures in a browser (Playwright perf mark on the parity fixture) and stops/reports if exceeded. 4. last-good-after-data-error maps to state error (Fable carry: error = last-good shown, refresh failed). 5. Touch-set expansions in A and B approved as listed. Every Land line: NO auto-merge; never --delete-branch a branch with open child PRs.

## Open questions for the PM (decide before dispatch)

1. **Where do the snapshot context and hook live?** PLAN puts WP2.2 in
   `apps/web/lib/longlive/**`. WP2.4 moves the readers into `packages/ui`,
   and they'll need `useReaderSnapshot()` there. **Recommendation:** put the
   context, type and hook in `packages/ui/src/snapshot/**` (this mirrors
   2.1-B's `host/context.tsx`, with no `next/*`), and the web provider in
   `apps/web/lib/longlive/reader-snapshot-provider.tsx`. Cost: B waits for
   **2.1-A to be merged**. The alternative is `apps/web` now, then a move in
   WP2.4.
2. **What does "no module-global providers" cover?** The setters are still
   used by the server API routes (`app/api/{mood,og,share-card}` import
   `vault-wiring.ts`, `apps/web/app/api/mood/route.ts:4`, `og/route.tsx:6`,
   `share-card/route.tsx:5`), by the native screens
   (`apps/mobile/lib/{era-stream,threads,track-guide}-data.ts`) and by the
   WP0.5 spike (`apps/mobile/dom/spike/shims/fill.ts:39-45`).
   **Recommendation:** the gate means *the reader path* is pure.
   `buildReaderSnapshot`, the snapshot queries and every web reader
   component read only explicit inputs, and lint enforces it. The setters
   remain for server routes and native screens until C5 retires the native
   screens, after which a follow-up deletes them. The alternative is
   deleting the setters now, which grows the touch set into `apps/mobile`
   and the API routes.
3. **Building on the client at load costs CPU.** `fromBaked` derives every
   domain at once. That includes three fingerprint-only domains the reader
   "never reads": `eraStream` (a view model for every era), `threads` and
   `trackGuide` (`reader-snapshot/types.ts:66-77`). It also includes the
   search index, which today is built lazily on the first search
   (`apps/web/lib/longlive/search.ts:178-181`). A web provider would run all
   of this during hydration. **Recommendation:** brief B measures it (in
   node, `fromBaked` median of 20 runs, base vs head). If it exceeds about
   15 ms, B stops and the PM/Fable decides whether to move the fingerprint
   domains and the search index behind lazy, memoised getters. That would be
   a WP0.3 contract change and needs Fable sign-off.
4. **Mapping `last-good-after-data-error`.** `fromBundle` maps only
   `'offline-last-good'` to `offline`. Today `last-good-after-data-error`
   (`packages/content/src/load.ts:113`) falls through to `stale`. The Fable
   carry list says `state:'error'` means "last-good shown, refresh failed".
   **Recommendation:** `offline-last-good` → `offline`,
   `last-good-after-data-error` → `error`, `stale` → `stale`, otherwise
   `ready`. This touches the app path only; the web is always `ready`.
   Confirm.
5. **Touch set beyond PLAN.** A needs `packages/experience/src/**` and
   `packages/content/src/load.ts`; B needs `scripts/parity/make-fixture.mjs`
   and `apps/web/app/parity-probe/route.ts`. Fable's carry list implies all
   four, but PLAN's touch line doesn't list them. Approve the touch sets
   below as written.

**Dependencies (step 1 of each brief, OPERATING-MODE §5):** the G1 Fable
go/no-go is GO; WP1.1 parity is green on `main`; for B, WP2.1-A is
`merged` (if Q1 is answered `packages/ui`). WP2.1-B is **not** required.
B mounts its provider in `LongLive.tsx`, not the layout file that 2.1-B
edits, so the two can't conflict.

**Stack:** A → base `main`. B stacks on A. C1 stacks on B, C2 on C1, C3 on
C2, and D on C3. Merge order: A, B, C1, C2, C3, D. Before merging any parent,
retarget its children to the parent's base. **Never `--delete-branch` a branch
that has open child PRs** (`gh pr list --base <branch> --state open` first).

---

## Research findings (cite these; workers do not re-derive them)

**Module-global providers.** Each one is a `let` in `packages/experience`:
- `content-item-provider.ts:18` (lookup, `setContentItemLookup:20`)
- `thread-content-provider.ts:27/45/62/79`: content, songTarget, theories,
  eraSecrets (setters at `:29/:47/:64/:81`)
- `track-catalogue-provider.ts:17` (`setTracksRawProvider:19`)
- `song-catalogue-provider.ts:19` (`setDefaultSongCatalogue:21`)
- `freshness.ts:31` (`setContentGeneratedAtSource`; not used by the
  snapshot)

**Who reads the providers** (excluding the `reader-snapshot` folder):
- `threads.ts:21` `contentForThread` (`contentForThreadInjected`)
- `lenses.ts:3` → `threadPoints` → `contentForThread`
- `doorways.ts:2-3` → `threadPoints`, `theoriesForEra`
- `theories.ts:20,37` (theoriesRaw)
- `era-secrets.ts:27,60,63` (eraSecretsRaw, songTarget, contentItem)
- `track-guide.ts:18,78,109` (tracksRaw, contentItemLookup)
- `mood-match.ts:145,257` (default song catalogue; not part of the snapshot)

**Who sets the providers:**
- web, by import side effects:
  - `apps/web/lib/longlive/content.ts:83`
  - `threads.ts:12`
  - `theories.ts:31`
  - `era-secrets.ts:59-60,66`
  - `tracks.ts:59`
  - `vault-wiring.ts:20-25` (imported by `app/layout.tsx:13` and the three
    API routes)
- mobile: `lib/era-stream-data.ts:63`, `threads-data.ts:43`,
  `track-guide-data.ts:51,59`, `dom/spike/shims/fill.ts:39-45`
- `reader-snapshot/build.ts:42-76` `withProviders` sets all seven and then
  restores them. **This is the impurity the Fable gate removes.**
- Client-bundle wiring fragility is already documented:
  `components/longlive/EraSection.tsx:8-16` (issue #4082).

**The snapshot today:**
- `reader-snapshot/sources.ts`: `BakedModules:17-28`, `fromBaked:31-47`,
  `inputsFromBundle:66-81`, `fromBundle:86-90`
- `build.ts:111-178`: `buildReaderSnapshot`/`derive`
- `index.ts`: exports
- Callers:
  - `apps/web/app/parity-probe/route.ts:24-39` builds the web
    `BakedModules` inline
  - `scripts/parity/make-fixture.mjs:86-101`
  - `apps/mobile/dom/spike/snapshot.ts:18` (`fromBundle`)
- **No web reader component reads the snapshot yet.**

**`'offline-last-good'` literal:** `reader-snapshot/sources.ts:88`. There is
no loader constant yet. `packages/content/src/load.ts:112-113` has only a
type union `LoadSource`, and the literal is also at `load.ts:343`. A adds
the constant.

**Search index, two copies:**
- web: `apps/web/lib/longlive/search.ts:60` `buildSearchIndex()` (reads
  `CONTENT`, `:75`) and `:178` `getSearchIndex()`, a lazy module singleton
- package: `reader-snapshot/search-docs.ts:11` `buildSearchDocs(inputs)`,
  which mirrors it doc for doc
- `ReaderSnapshotInputs.searchIndex?` (`types.ts:35-36`) is filled from
  the web's `getSearchIndex()` on the baked path (`sources.ts:43`)
- Callers of the web copy: `SearchOverlay.tsx:22,163`,
  `parity-probe/route.ts:8,35`, `make-fixture.mjs:97`
- The engine's suffix-index cache is keyed by array identity
  (`search-index.ts:225`), so the snapshot's array must stay referentially
  stable.
- Ranking ties break on score, title, then key (#4794), never on position.

**Dependencies on flat `CONTENT` order:**
- `CONTENT` is VAULT_RAW key order (`content.ts:61`). The bundle regroups it
  by era, so a snapshot flattened era by era can differ *across* eras.
- `contentForThread` (`experience/threads.ts:20-24`) uses a **stable sort by
  date only**, so same-date ties keep flat order. That is a real
  dependency, and it reaches `threadPoints`, the doorways, and
  `contentForThreadInRange`.
- `buildMilestones` (`content-enrichment/src/content.ts:102-111`) is
  **unsorted**, so `MILESTONES` is in flat order. The snapshot carries
  `milestones` as a domain, so the reader must read the domain and never
  re-derive it.
- `contentForEra` (`content.ts:63-67`) sorts by date descending. Ties keep
  order *within* the era, and `groupContent` (`build.ts:80-84`) preserves
  that. Safe.
- `getContentItemByIdOrSlug` (`content.ts:75-76`): order matters only if a
  slug is duplicated.
- `search.ts:75`: insertion order only. Ties are resolved by key. Safe.
- `merch.ts:113` builds `MERCH_CATALOGUE` from `CONTENT`. It is carried as
  a domain. Safe.
- `clown-index.ts:221` is server-side Clownbot, not the reader.

**Synchronous reader call sites to migrate** (`'use client'` graph; counts
are accessor matches per file):
- Components:
  - `EraSection` 11, `MerchSection` 10, `TrackDetail` 7
  - `merch/MerchStyleSection` 5, `merch-filters.ts` 5
  - `EraSecretCard` 4, `TrackGuide` 4, `store/index.tsx` 4
    (`getContentItemByIdOrSlug` at `:14,:274`)
  - `Crossings` 3, `TimelineScrubber` 3, `proposal/ProposalThread` 3
  - 2 each: `MomentDetail`, `SearchOverlay`, `TheoryGuide`,
    `ThreadsTimeline`, `YourLongLiveCard`, `love-story/EntryDetail`,
    `merch/MerchCard`, `related.ts`, `share-payload.ts`,
    `share-card-spec.ts`
  - 1 each: `FromTheEras`, `VideoMomentCard`
- Other data importers, which C0 confirms: `ClueWeb`, `CommunityCard`,
  `CommunitySection`, `ClownBoard`, `EraFeedList`, `TheoryCard`,
  `love-story/LoveStoryThread`, `runway/RunwayThread`, `shop.ts`,
  `use-era-current-feed.ts`
- **Server-only, stays synchronous:** `app/page.tsx:5,30` (metadata
  validation), `app/api/og/route.tsx`, `app/api/share-card`,
  `app/api/mood`, `parity-probe` (moves to the shared builder in B), and
  `clown-index.ts`/`clown-retrieve.ts`.
- **Mount point:** `components/longlive/LongLive.tsx:105-109` (`<AppProvider>`
  is outermost, and the store resolves deep links through content, so the
  snapshot provider must wrap `AppProvider`). `app/page.tsx:60` is the only
  route that renders `<LongLive/>`.

**Gates:**
- Web bundle size: `npm run check:budget:bundle` (`ci.yml:208`, after
  `npm run build`).
- Parity: `.github/workflows/parity.yml`, triggered by PRs touching
  `packages/experience/**`, `packages/content/**` or `apps/web/**`, plus
  `workflow_dispatch` with the `update-baselines` input. Side (a) asserts
  the `parity-probe` hash equals `scripts/parity/fixture/fixture.json`.
- Web e2e: `.github/workflows/e2e.yml`, dispatched with
  `-f base_url=<preview URL>`, runs `e2e/vault.spec.ts`.

---

## Shared block: Repo rules (OPERATING-MODE.md §7, pasted into every brief)

```
Repo rules:
- Branch and worktree: work on a branch in your own worktree outside
  Documents\Claude\Projects\ (session scratchpad), and verify the branch
  before every commit. Never commit to main or force-push. Never use
  git restore / reset --hard / clean / checkout -- or --no-verify.
- Worktree setup: run npm ci --silent at the worktree root before the first
  command.
- Shell: one simple command per Bash call. Prefer node -e over python.
  Filter command output at the source (| tail -30).
- Windows checkouts of the parity fixture need git -c core.longpaths=true
  (hash-named dirs exceed MAX_PATH).
- Never touch scripts/social/** or social/queue/**. Never merge a
  social-draft PR. Never send social work to Codex.
- Gates:
  - Typecheck: npm run typecheck.
  - Lint: npm run lint. Run the exact CI command, not per-file eslint.
  - Tests: narrow npx vitest run <path> while iterating; full npm run test
    once at the end.
  - Mobile bundle check (when apps/mobile changes):
    npx expo export --platform ios and npx expo export --platform android.
- Editing: surgical edits only, no reformatting of untouched code, and keep
  files under 300 lines. Update MAP.md when files are added, moved or deleted.
- Size tripwire: if the diff passes ~400 non-test lines, stop and report.
  Touching a file outside the touch set = stop and report.
- Definition of done: acceptance criteria met; all tests pass; review clean;
  works on mobile and desktop web; docs updated in the same PR; no secrets.
- Device verification: a UI change isn't verified until it's seen in a
  browser at phone and desktop widths, and on device for app changes. A green
  suite is not evidence.
- Native changes are expensive: any change to apps/mobile native dependencies
  or config changes the fingerprint, which triggers new store builds on both
  platforms. This WP makes none.
```

## Shared block: Land (every brief; `<BASE>` set per brief)

```
Land: open a PR against <BASE> (body: 1–2 sentence TL;DR, then ---, then
detail; refs #4788). Do NOT set auto-merge and do NOT merge; the PM merges
after reviewer + Codex adversarial review ([codex] WP). Never --delete-branch
a branch that has open child PRs: retarget the children to its base first.
Do not wait on CI; report and exit.
```

## Shared block: Verify (every brief adds its own narrow tests)

```
Verify with (paste the final result line of each):
  npm run typecheck
  npm run lint
  npx vitest run <the brief's narrow paths>
  npm run test                                   (once, at the end)
  npm run build --workspace=@swift2/web
  npm run check:budget:bundle                     (report base vs head KB)
  gh workflow run parity.yml --ref <branch>       (must be green: zero visual
    diff AND side-a probe hash == scripts/parity/fixture/fixture.json; do NOT
    pass update-baselines; WP2.2 never re-baselines)
  gh workflow run e2e.yml --ref <branch> -f base_url=<this PR's Vercel
    preview URL>                                  (B, C1–C3, D only)
  Browser check (B, C1–C3): the dev server at 390px and 1280px; exercise
  every surface the PR touched; no console errors; no hydration warnings.
```

---

## Brief A: pure derivation + loader constant (the Fable gate)

```
WP 2.2-A: ReaderSnapshot derivation is pure over its inputs. Programme: One
UI (docs/plans/one-ui/PLAN.md §WP2.2; Fable carry list in PROGRESS.md row
"2.1–2.14" — ACCEPTANCE gate for WP2.4).
Goal: buildReaderSnapshot/fromBaked/fromBundle read only their arguments.
No module-global provider is read or written during a build, and the
derived domains hash identically to today.
Touch set: packages/experience/src/{threads,lenses,doorways,theories,
era-secrets,track-guide}.ts; packages/experience/src/reader-snapshot/**
(incl. README.md); packages/content/src/load.ts (+ its index export line);
tests next to each; MAP.md only if a file is added. Do NOT touch
apps/mobile/**, apps/web/**, the *-provider.ts files' public API, or
mood-match.ts. Touching anything else = stop and report.
Do:
  0. Record the baseline: on origin/main, run the reader-snapshot
     equivalence test and note the fromBaked hash. Also note the hash in
     scripts/parity/fixture/fixture.json.
  1. Add a pure core to each provider-reading function. It takes the data
     explicitly, e.g. a `ReaderCorpus` object
       { content: readonly ContentItem[]; contentById: ReadonlyMap;
         tracks; theories; eraSecrets; songTarget: (relatedId) => SongTarget|null }
     For example: contentForThreadIn(corpus, threadId),
     threadPointsIn(corpus, ...), threadDoorwaysForEraIn(corpus, ...),
     eggDoorwaysForEraIn(corpus, ...), theoriesForEraIn(corpus, eraId),
     eraSecretsForEraIn / resolveEraSecretLinkIn(corpus, ...), and the
     track-guide set (tracksFor, nextTrackOnAlbum, keepExploring, findTrack)
     taking `corpus`.
     The existing exported functions keep their EXACT signatures and become
     one-line wrappers: `fn(...args) = fnIn(injectedCorpus(), ...args)`.
     Native screens, the server routes and the spike keep working unchanged.
     Name the pure variants consistently and list them in the PR body.
  2. reader-snapshot/build.ts: delete withProviders. derive() builds a
     ReaderCorpus from `inputs` once (`corpusFromInputs(inputs)`, exported:
     brief B's queries reuse it) and calls only the pure variants.
     reader-snapshot/** must import NO *-provider module and none of the
     injected wrappers.
  3. packages/content/src/load.ts: export the source values as constants,
     e.g. `export const LOAD_SOURCE = { network: 'network', cacheEtag:
     'cache-etag', offlineLastGood: 'offline-last-good',
     lastGoodAfterDataError: 'last-good-after-data-error' } as const`, and
     derive `LoadSource` from it. Use the constant at load.ts:343.
     sources.ts: type `BundleLike.source?: LoadSource` and replace the
     literal at :88 with the constant. State mapping per the PM's answer to
     Q4 (proposal: offlineLastGood→offline, lastGoodAfterDataError→error,
     stale→stale, else ready).
  4. types.ts: add the context value type for brief B, with this doc
     comment:
       export type ReaderSnapshotContextValue = { status: 'loading' } | ReaderSnapshot;
     JSDoc on ReaderSnapshotState: 'error' = a last-good snapshot is shown
     and the latest refresh failed; 'offline' = last-good served because the
     network failed; 'stale' = cached, not yet confirmed current.
  5. Flat-order audit (carry item). Add a test that, on the real baked
     inputs, flattens the snapshot's per-era content in era order and
     asserts that, for EVERY thread, contentForThreadIn(that order) deep-
     equals contentForThreadIn(flat CONTENT order), id for id. Also assert
     slugs are unique across content (getContentItemByIdOrSlug). If either
     fails, STOP and report the offending ids. Do not add a tie-break,
     because that changes web order (a parity diff), so it's a PM call.
     Document the result in reader-snapshot/README.md ("order
     dependencies").
  6. Purity tests (the gate):
     (a) install sentinel providers that THROW (via the existing setters),
         build fromBaked/fromBundle from test inputs, assert success and a
         hash equal to the baseline built without sentinels; restore after;
     (b) interleave two builds with different inputs and assert neither
         leaks into the other;
     (c) a static test that reads reader-snapshot/*.ts source and fails on
         any import of '../*-provider' or the injected wrapper names.
  7. README.md: replace the withProviders paragraph with the pure-corpus
     design; state that the setters remain only for native screens and
     server routes (per the PM's answer to Q2).
Acceptance:
  - The Fable gate holds: reader-snapshot/** imports no provider; tests
    6a–6c pass.
  - hash(fromBaked) on main content is IDENTICAL to the step-0 baseline,
    and the equivalence test (baked == bundle) still passes. The parity
    probe hash == fixture.json (no fixture regeneration).
  - The 'offline-last-good' literal is gone from packages/experience. The
    loader constant is used at both sites.
  - Every pre-existing experience test passes unchanged (wrappers keep
    their behavior).
  - The flat-order audit passes, or the run stops with the offending ids.
  - Typecheck, lint and the full suite pass; parity green; the web bundle
    is within budget.
Verify with: <Verify block>; narrow paths:
  npx vitest run packages/experience/src/reader-snapshot packages/experience/src/threads.test.ts packages/experience/src/track-guide.test.ts packages/experience/src/doorways.test.ts packages/content/src
  Also paste the step-0 hash and the head hash side by side.
<Repo rules block>
<Land block, BASE = main>
Return ≤ 300 words: what changed, the pure-variant names, the hashes before
and after, the flat-order audit result, verification results, PR URL, open
risks.
```

---

## Brief B: context, web provider, search dedupe

```
WP 2.2-B: the web reader gets ReaderSnapshot (fromBaked) from React context;
one search-doc builder. Programme: One UI (docs/plans/one-ui/PLAN.md §WP2.2;
Fable carry list).
Goal: a ReaderSnapshotProvider wraps the whole web reader with a
referentially stable fromBaked snapshot. useReaderSnapshot()/useReader()
expose it. SearchOverlay reads snapshot.domains.searchIndex built by
buildSearchDocs(inputs), and the web's own index builder is deleted.
Touch set: packages/ui/src/snapshot/** (new; or apps/web/lib/longlive/
reader-snapshot-context.tsx if the PM answered Q1 "apps/web");
packages/ui/src/index.ts (exports); packages/experience/src/reader-snapshot/
{sources,types,build,queries}.ts + README.md; apps/web/lib/longlive/
reader-snapshot-provider.tsx (new); apps/web/lib/longlive/baked-modules.ts
(new); apps/web/components/longlive/LongLive.tsx (mount only);
apps/web/components/longlive/SearchOverlay.tsx; apps/web/lib/longlive/
search.ts; apps/web/app/parity-probe/route.ts; scripts/parity/make-fixture.mjs;
tests next to each; MAP.md. Touching anything else = stop and report.
Do:
  0. Perf gate (PM Q3). In node, time fromBaked(bakedModules(), deps):
     median of 20 runs, plus the old lazy getSearchIndex() alone. If
     fromBaked's median is above ~15 ms, STOP before step 1 and report the
     numbers.
  1. apps/web/lib/longlive/baked-modules.ts: move the BakedModules object
     literal out of parity-probe/route.ts:24-37 into
     `bakedModules(): BakedModules` (no getSearchIndex, see step 4).
     parity-probe and the provider both use it, so the probe hashes exactly
     what the reader renders.
  2. Context (location per Q1): ReaderSnapshotContext of
     ReaderSnapshotContextValue (from A).
     - <ReaderSnapshotProvider value>
     - useReaderSnapshotStatus() returns the union.
     - useReaderSnapshot() returns a ReaderSnapshot. It throws a clear error
       outside a provider, or while status is 'loading'. The app's
       WP2.4 gate component renders children only when the snapshot is
       ready, so a reader component never sees 'loading'.
     - useReader() = useMemo(() => createReaderQueries(snapshot), [snapshot])
       (step 3).
     - No next/*, no react-native* (the 2.1-A lint ban applies).
  3. reader-snapshot/queries.ts (pure, in packages/experience):
     createReaderQueries(snapshot) is built on corpusFromInputs (A). It
     returns exactly the accessors the web reader uses today, with
     IDENTICAL semantics and order:
       - contentForEra: date desc; ties in per-era order
       - getContentItem, getContentItemByIdOrSlug
       - milestones / milestonesForEra: read the domain, never re-derive
       - tracksForEra, theoriesForEra, eraSecretsForEra
       - videosForEra / allVideoRecordsForEra / musicVideosForEra: from
         domains.videos (ALL records), using the same helpers
         apps/web/lib/longlive/videos.ts:48-75 uses
       - contentForThread, threadPoints, doorways
       - merch, searchIndex
     For every accessor, add an equality test against the current web
     module function over all eras/ids (e.g. createReaderQueries(
     fromBaked(...)).videosForEra(e) deep-equals web videosForEra(e)).
     This test is what proves zero behavior change.
  4. Search dedupe (carry item):
     - Remove `searchIndex` from BakedModules and from
       ReaderSnapshotInputs. buildReaderSnapshot always uses
       buildSearchDocs(inputs); the snapshot keeps its key-sorted
       domains.searchIndex.
     - Delete buildSearchIndex/getSearchIndex/cachedIndex from
       apps/web/lib/longlive/search.ts (keep its engine re-exports only if
       other files still import them; otherwise delete the file and update
       importers). Drop getSearchIndex from make-fixture.mjs:97.
     - SearchOverlay.tsx:163 reads useReader().searchIndex. The array is
       the snapshot's own, so it's stable and the search-index.ts:225 cache
       holds.
     - Golden test: for ~30 fixed queries (single letters, era names,
       song titles, a no-hit query, a showAll query), searchDocs over the
       OLD web index and over snapshot.domains.searchIndex return
       identical ordered results. Capture the old results from the
       pre-change builder in the test via a frozen JSON fixture generated
       once on origin/main.
  5. apps/web/lib/longlive/reader-snapshot-provider.tsx ('use client'):
     builds the snapshot ONCE per provider instance with
     useState(() => fromBaked(bakedModules(), { eraVideoFeed })). No module
     singleton (Fable rule, as for 2.1-B). It renders the context provider.
     Mount it in LongLive.tsx:105-109 as the OUTERMOST element, wrapping
     <AppProvider> (the store resolves deep links through content).
     No other mount.
  6. Docs: reader-snapshot/README.md (the web reads via context; there is
     one search builder); docs/longlive-experience.md gets one paragraph on
     the provider; MAP.md for new files.
Acceptance:
  - Carry items: the web uses buildSearchDocs(inputs); the web copy is
    deleted; searchIndex is removed from the inputs; the context type is
    {status:'loading'} | ReaderSnapshot with the 'error' semantics
    documented.
  - The query equality tests and the search golden test pass.
  - The snapshot is referentially stable across re-renders (test:
    re-render twice, same object).
  - The parity probe hash == fixture.json; parity zero visual diff; web
    e2e green; the bundle-size check is within budget (report the delta);
    the step-0 timings are in the PR body.
  - No hydration warning in the browser console at 390px and 1280px;
    search returns the same results as production for 5 spot queries.
Verify with: <Verify block>; narrow paths:
  npx vitest run packages/experience/src/reader-snapshot packages/ui/src/snapshot apps/web/lib/longlive apps/web/components/longlive/SearchOverlay
<Repo rules block>
<Land block, BASE = the WP2.2-A branch (stacked)>
Return ≤ 300 words: step-0 timings first, then what changed, verification
results (incl. bundle delta), PR URL, open risks.
```

---

## Brief C (C0 + C1–C3): move synchronous callers to the hook, one PR per domain

Domains follow the WP2.4–2.13 slices, so each C PR clears the way for its
slice's later move. These are the expected buckets; C0 confirms them.

| PR | Domain | Expected files |
|---|---|---|
| C1 | Shell + era stream (2.4) | `EraSection`, `EraFeedList`, `TimelineScrubber`, `YourLongLiveCard`, `VideoMomentCard`, `Crossings`, `FromTheEras`, `store/index.tsx`, `use-era-current-feed.ts` |
| C2 | Moment detail + threads (2.5, 2.6) | `MomentDetail`, `related.ts`, `share-payload.ts`, `share-card-spec.ts` (client part only), `ThreadsTimeline`, `ClueWeb`, `EraSecretCard`, `love-story/*`, `proposal/ProposalThread`, `runway/RunwayThread` |
| C3 | Track guide, theories, merch, community (2.7, 2.9, 2.10) | `TrackGuide`, `TrackDetail`, `TheoryGuide`, `TheoryCard`, `MerchSection`, `merch/*`, `merch-filters.ts`, `shop.ts`, `CommunityCard`, `CommunitySection`, `ClownBoard` |

Search (2.8) already moved in B. Merge adjacent buckets if they're small, and
split any that goes over ~400 lines.

```
WP 2.2-C<n>: <domain> reads content through useReader(). Programme: One UI
(docs/plans/one-ui/PLAN.md §WP2.2 "move every synchronous content.ts caller
to the hook").
Goal: no client component or client-only helper in <domain> imports
@/lib/longlive/{content,tracks,theories,era-secrets,threads,videos,merch,
search,song-moods.generated} or calls an experience function that reads an
injected provider. They read useReader() instead, with zero visual change.
Touch set: ONLY the files listed for this domain (from C0) plus their
tests. Do not touch server files (app/page.tsx, app/api/**, parity-probe,
clown-index.ts, clown-retrieve.ts), the provider, or packages/**. If a
query is missing from createReaderQueries, stop and report (it belongs in
B). Touching anything else = stop and report.
C0 (first C brief only, read-only, no commit): list every 'use client'
component or hook, and every helper reachable only from client code, that
imports one of the modules above, or one of the injected experience
functions (contentForThread, threadPoints, threadDoorwaysForEra,
eggDoorwaysForEra, theoriesForEra, eraSecretsForEra, resolveEraSecretLink,
tracksForEra, nextTrackOnAlbum, keepExploring, findTrack). Use rg on
apps/web/components and apps/web/lib/longlive. Bucket the files into
C1–C3 as in the table, list helpers shared with server routes separately,
and put the table in the C1 PR body. Expect about 35 files.
Do:
  1. Components: replace the module import with `const q = useReader()`
     and call q.<accessor>. Keep useMemo dependencies correct (add `q`).
  2. Helpers (related.ts, share-payload.ts, merch-filters.ts, shop.ts,
     share-card-spec.ts): add an explicit data parameter (the queries
     object or the specific domain). Client callers pass useReader(). If a
     helper is ALSO called from a server route, the server route passes
     the synchronous module data. Do not edit the server file: give the
     helper a default parameter that preserves its current server call.
     List these helpers in the PR body.
  3. Remove the #4082 import-for-side-effect workarounds in the touched
     files (e.g. EraSection.tsx:8-16) only once nothing in the file needs
     them.
  4. Tests: render touched components under <ReaderSnapshotProvider>.
     Add the shared test helper (renderWithReader) in C1 if B didn't.
  5. Diff ≤ ~400 non-test lines. If it's over, stop and split.
Acceptance:
  - rg finds none of the banned imports or injected calls in this
    domain's client files.
  - Typecheck, lint and tests pass; parity zero diff and probe hash ==
    fixture.json; web e2e green; bundle within budget.
  - Browser check at 390px and 1280px for every surface in the domain
    (C1: era stream, scrubber, deep link ?item=; C2: moment detail,
    related, share, each thread mode; C3: track guide/detail, theories,
    merch filters, community).
Verify with: <Verify block>; narrow paths: the domain's test files, plus
  rg -n "lib/longlive/(content|tracks|theories|era-secrets|threads|videos|merch|search)'" <domain files>   (expect no output)
<Repo rules block>
<Land block, BASE = the WP2.2-B branch for C1, else the previous C branch>
Return ≤ 300 words: what changed, verification results, PR URL, open risks
(list the server-shared helpers and any file left for the next C).
```

---

## Brief D: enforce it, and record what's left

```
WP 2.2-D: lint-enforce "the reader reads only the snapshot". Programme: One
UI (docs/plans/one-ui/PLAN.md §WP2.2; Fable carry list).
Goal: a lint rule makes a regression impossible, and the docs name the
remaining setter users and when they retire.
Touch set: eslint.config.mjs; a lint self-test; packages/experience/src/
reader-snapshot/README.md; docs/longlive-experience.md; MAP.md; and
docs/plans/one-ui/PLAN.md §WP2.2 (one "Done:" line). Touching anything else
= stop and report.
Do:
  1. ESLint override for apps/web/components/longlive/** and
     packages/ui/**: no-restricted-imports bans
     @/lib/longlive/{content,tracks,theories,era-secrets,threads,videos,
     merch,search,song-moods.generated,vault-wiring} (relative paths too),
     and, via importNames on '@swift2/experience', the injected wrappers
     (contentForThread, threadPoints, threadDoorwaysForEra,
     eggDoorwaysForEra, theoriesForEra, eraSecretsForEra,
     resolveEraSecretLink, tracksForEra, nextTrackOnAlbum, keepExploring,
     findTrack, every set*Provider/set*Lookup/set*Resolver/
     setDefaultSongCatalogue). Each message points to useReader().
     If lint fails on a file C missed, stop and report the list. D does not
     migrate call sites.
  2. A self-test (RuleTester vitest, or a fixture file) proving that a
     banned import in components/longlive errors.
  3. Docs: the remaining setter users (server API routes via
     vault-wiring.ts; native screens apps/mobile/lib/*-data.ts; the WP0.5
     spike), and that they are deleted after C5 (native retirement). Add a
     follow-up line to PLAN.md under WP2.13/C5.
Acceptance: lint passes on main code and fails on the self-test fixture;
typecheck and tests pass; parity green; docs updated.
Verify with: npm run typecheck; npm run lint; npx vitest run <self-test
path>; npm run test (once, at the end); gh workflow run parity.yml --ref
<branch>.
<Repo rules block>
<Land block, BASE = the WP2.2-C3 branch>
Return ≤ 300 words: what changed, verification results, PR URL, open risks.
```

---

## PM notes (not for the executors)

- **Size estimates (non-test lines):**

  | PR | Estimate |
  |---|---|
  | A | ~250–350 (pure variants + wrappers + build rewrite + constant) |
  | B | ~250–350 (context, provider, queries, search deletion) |
  | C1 | ~150–250 |
  | C2 | ~150–250 |
  | C3 | ~150–250 |
  | D | ~60 |

  A and B are the most likely to trip the 400-line tripwire. If they do,
  split as follows:
  - A: A1 (`threads`, `lenses`, `doorways`, `theories`) and A2
    (`era-secrets`, `track-guide`, `build.ts`, the constant).
  - B: B1 (`queries.ts` + equality tests) and B2 (context, provider,
    search).
- **Merge freeze (§6):** A, B and D touch `packages/**`. During an open
  device session, queue them without merging.
- **The strongest single check:** the parity probe hash still equals
  `fixture.json` at every PR. It proves the snapshot's content is
  unchanged. Zero visual diff proves the rendering is unchanged.
- **Fable review** of this brief before dispatch, then a design-fidelity
  review of the A and B PRs.
