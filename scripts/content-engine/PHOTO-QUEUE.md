# Photo-enrichment queue & progress marker

Tooling for the **photo-enrichment worker** (GitHub issue #762), which keeps
high-visibility moment pages stocked with verified photos and per-image focal
points. This is separate from the CIE (`run.mjs`); it lives here because it
shares the corpus loader and visibility scorer.

## The marker is comma-safe JSON

Progress is recorded in a single HTML comment on issue #762:

```
<!-- photo-done: ["1989-aoty","midnights|2024|2|A record fourth Album of the Year Grammy, for Midnights", ...] -->
```

It is a **JSON array of keys**. Do **not** parse it by splitting on commas —
most moment keys contain commas, and the old comma-delimited format silently
shredded them (churn + corruption; see `docs/decisions.md`, 2026-07-20). Parse
with `JSON.parse` (or `parseMarkerBody`).

The marker holds **only the subjective decisions**: sparse pages (<2 photos) a
run reviewed and deliberately left at their editorial maximum. Whether any other
page is done is **recomputed live from the corpus** — a page with ≥2 photos that
each have a `focalPoint` is done and never needs to appear in the marker.

## Each run

```sh
# 1. Load progress + build the work queue (top N by visibility, default 10).
#    Pipe in the newest #762 marker (or the whole comments dump — newest wins).
gh issue view 762 --comments | node scripts/content-engine/photo-queue.mjs queue 10

# 2. Do the work on those pages (enrich if <2 photos; set an individual
#    focalPoint on EVERY photo — see the #762 protocol for the verify-first
#    rules and the focalPoint field-order rule).

# 3. If you reviewed a sparse page and left it at its editorial max, add its key
#    to the marker. Emit the updated marker with serializeMarker() and post it.
```

## One-time / occasional rebuild

Recovers whole keys from the entire comment history (dropping shredded fragments
and pages that are now objectively done):

```sh
gh issue view 762 --comments | node scripts/content-engine/photo-queue.mjs migrate
```

## API (`lib/photo-marker.mjs`)

- `isPhotoDone(item)` — ≥2 photos, each with a non-empty `focalPoint`.
- `realPhotos(item)` — raw seed photos (excludes the loader's synthetic thumbnail).
- `parseMarkerBody(body, corpusKeys)` — JSON array, or legacy substring recovery.
- `recoverKeysFromComments(text, corpusKeys)` — union of every marker in a blob.
- `serializeMarker(keys)` — the comma-safe JSON marker (sorted, deduped).
- `reviewedSparseKeys(items, recovered)` — keys worth persisting (sparse + not done).
- `buildQueue(items, reviewedKeys, scoreFn, n)` — top-N pages needing work.
