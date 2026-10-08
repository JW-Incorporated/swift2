# Era Quality Audit: Red — Findings

Scope: `supabase/seed/content/red.mjs` (54 published items). Read-only
audit against `docs/marketing/content-framework-2026-07-03.md` editorial
bar (fan-editor voice, no-fabrication, sourcing minimums, hotlink+credit
photos, dead-link hygiene). Also cross-checked against
`npm run validate:content` (CI gate) and two custom scripts checking
photo/source coverage and `relatedIds` resolution.

## Summary

- 54 items, categories: business 6, music 14, tour 5, fashion 12,
  sighting 10, relationship 3, release 4.
- `npm run validate:content`: 0 ERRORs for red.mjs. 6 WARNs, all already
  in an explicit grandfather list (`UNSOURCED_LEGACY` /
  `SINGLE_OUTLET_LEGACY` / `PROSE_REDLINE_LEGACY` in
  `scripts/lib/sourcing-gate.mjs` / `scripts/lib/rumor-redlines.mjs`) —
  CI-green, but each is a real, named quality gap the grandfather list
  exists to eventually close, not a false positive.
- Overall the file is strong: every full-standard item (~48 of 54) has
  2+ sources, real hotlinked/credited photos, and reads in fan-editor
  voice with specific, sourced detail. The issues below are concentrated
  in a handful of items, mostly leftover from the 2026-07-19 RAW
  migration off `content.ts`.

## Issue 1 — Thin, unsourced placeholder item (`red-snl`)

`slug: "red-snl"` (year 2012, month 11, category `tour`, title "A run of
TV performances") has no `sourceUrl`, no `moment.sources`, no photo, and
no specific event named — just a vague generalization ("Late-night and
award-show stages keep Red everywhere at once"). It's the only item in
the era with zero sources; `validate:content` WARNs it as grandfathered
in `UNSOURCED_LEGACY`. Violates the framework's "every item needs at
least one sourceUrl... no fabrication, ever" bar. It's tagged
`// Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW)` —
a leftover placeholder from the early migration, not an authored item.

**Recommendation:** source it with a specific named TV/award-show
appearance (real SNL date, or a real awards-show performance with an
outlet writeup), or retire the item.

## Issue 2 — Duplicate moment told twice at different depths

- Full item: "Everything Has Changed, written on a trampoline with Ed
  Sheeran" (2012-10-22, `music`) — rich context, 2 sources, photo.
- Migrated stub: `slug: "red-everything-changed"` (2013-07-06, `music`,
  title "Everything Has Changed" duet) — one-line context, no cross-link
  back to the fuller item.

Both are about the same song/single; the stub is a much-thinner retelling
of the same underlying fact, with no `relatedIds` connecting the two so a
reader browsing the timeline sees the story told twice. This is the exact
failure pattern already fixed once under issue #616 ("Era timelines show
the same moment twice," closed 2026-08-25) — this instance in Red was
either missed by that pass or is a regression.

**Recommendation:** either retire the thin stub (its info is a strict
subset of the fuller item), or if it's kept to anchor the distinct July
2013 single-release date, give it its own distinct content and
`relatedIds`-link the two.

## Issue 3 — 9 dead `relatedIds` cross-links out of red.mjs

Checked every `relatedIds` entry in red.mjs against the real
`moment:vault-<eraId>-<slugified-title>` id every other era's content
file would actually produce (same derivation `validate-content.mjs`
uses). 9 references don't resolve to any real moment id — silent dead
cross-links (resolution is best-effort at runt, so these never surface
as a build error, only as a missing "related" card on the live site):

1. "Red sells 1.2 million copies..." → `moment:vault-evermore-red-gets-its-do-over-red-taylors-version-opens-at-no-1`
2. "A Central Park stroll confirms she's dating Harry Styles" → `moment:vault-red-a-new-years-eve-kiss-with-harry-styles-in-times-square`
3. "A birthday minibreak to the Lake District..." → `moment:vault-red-a-central-park-stroll-confirms-shes-dating-harry-styles`
4. "A New Year's Eve kiss with Harry Styles in Times Square" → `moment:vault-red-a-central-park-stroll-confirms-shes-dating-harry-styles`
5. "A New Year's Eve kiss with Harry Styles in Times Square" → `moment:vault-1989-the-out-of-the-woods-video-closes-the-era-on-new-years-eve`
6. "She buys High Watch, the Watch Hill mansion — in cash" → `moment:vault-tloas-a-tented-lawn-in-rhode-island-two-weeks-before-the-wedding`
7. "Taking over Times Square on Good Morning America..." → `moment:vault-red-a-new-years-eve-kiss-with-harry-styles-in-times-square`
8. "Shake It Off, and the pivot from victim to punchline-maker" → `moment:vault-reputation-a-surprise-shake-it-off-at-the-stonewall-inn-for-prides-50th`
9. "Out of the Woods: a voice memo written to Jack Antonoff's track mid-flight" → `moment:vault-1989-the-out-of-the-woods-video-closes-the-era-on-new-years-eve`

Some of these (#2/#3/#4/#7) look like slug mismatches between what this
file's items are titled vs. what their actual generated slug is (e.g. the
Central Park item's real title differs slightly from what's referenced),
others (#1, #6, #8, #9) point at items in sibling era files
(evermore/tloas/reputation/1989) whose titles apparently changed or
never existed as written. This is exactly the class of bug
`validate-content.mjs`'s `relatedIds` check exists to catch (line 416-425
of that file) — worth confirming why these 9 aren't tripping that
checker as ERRORs (possibly a `moment:` prefix/slugify edge case worth a
follow-up card), since the intent is clearly to hard-fail on this.

## Minor observations (not blocking)

- Two migrated stub items (`red-album`, `red-i-knew-you`) have full
  sourcing but no photos — not a framework violation (photos aren't a
  hard requirement) but noticeably thinner than the surrounding
  full-standard items norm of 1-6 photos each.
- `moment.products: []` (explicit empty array) on 3 fashion items
  (CMT dress, Grammys J. Mendel gown, Julien Macdonald gown) — fine per
  framework (products are optional), just flagging as a pattern in case
  a future shop-pass wants to target these first.
- The 6 CI WARNs (redline/outlet-count grandfathers) at indices 20, 23,
  24, 27, 34, 44 are already tracked in the grandfather lists named
  above and don't need re-flagging here — the ratchet mechanism already
  owns closing them.

## Verdict

Red era content is solid overall (0 CI errors, strong voice/sourcing on
~48/54 items). Two authored-quality issues (Issues 1 & 2, both traceable
to the 2026-07-19 RAW migration) and one structural bug class (Issue 3,
9 dead relatedIds) are worth a follow-up fix card. No code changes made
in this audit — read-only per task scope.
