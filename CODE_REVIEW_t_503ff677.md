# Code Review: #3584 Fable-arbiter ruling — gate video thumbnails, X-only appearance lane

**Repo:** Swift2, worktree `/workspace/projects/Swift2/.worktrees/t_503ff677`
**Branch:** `social/gate-thumbnails-t_503ff677`
**Diff:** `7e202348686f7c2e1225e6708c1cf270090e0861..HEAD`

## Verdict: APPROVE (0 blocking findings, 1 non-blocking suggestion)

## What was checked
- Full diff read end-to-end (check-drafts.mjs, queue-schema.mjs, social-draft.mjs,
  discover.mjs, both test files, docs/decisions.md, social/README.md, deleted
  queue/*.json files).
- Re-ran `npx vitest run scripts/social scripts/appearance-discovery`: **426/426 pass**.
- Re-ran `npm run lint`: **0 errors** (3 pre-existing unrelated warnings in
  merch-engine test files, untouched by this diff).
- Re-ran full `npm test`: 312 files / 4578 tests pass, 3 failed tests + 1 failed
  suite. Verified by name that none of the 4 failing files
  (`scripts/check-voice.test.ts`, `scripts/sync-clown-knowledge.test.ts`,
  `scripts/content-engine/checkers/duplicate-content.test.ts`,
  `apps/mobile/lib/notification-actions.test.ts`) appear anywhere in this diff's
  changed-file list — confirms the implementer's claim that these are
  pre-existing/unrelated (5s vitest default timeout on large-corpus tests, and
  a missing Expo tsconfig respectively).
- Repo-wide grep for removed exports (`fetchAppearanceThumbnail`,
  `verifyTaylorPresence`, `_resetVerifyCallCountForTests`,
  `MAX_VERIFY_CALLS_PER_PROCESS`, `instagramBodyTemplate`, `INSTAGRAM_HOOKS`):
  zero remaining imports/callers anywhere in `*.mjs`/`*.ts`.

## Findings

### 1. Gating logic correctness — PASS, no bypass found
- `checkMedia`'s "photo" gate now ORs two independent hard-fail signals
  (`VIDEO_THUMBNAIL_CREDIT_RE` match on credit/source text, or basename not in
  `CLEARED_PHOTO_ALLOWLIST`) — either alone fails, so a thumbnail can't dodge
  by fixing only one signal.
- The same rule is duplicated independently in `queue-schema.mjs`'s
  `validateQueueItem`, which is the schema enforced by the **required** CI
  `build` job (`validate-queue.mjs`, called from `auto-merge-content.yml`) —
  so there are two independent enforcement points, not a single-path gate
  that a draft could dodge if only one checker ran.
- X's "video-thumb may not carry `media`" rule is checked unconditionally
  (outside the `item.media?.length` guard), so it fires correctly even for
  zero-media items per the new comment's stated intent.
- Instagram unconditionally rejects `video-thumb` in both checkers.

### 2. Dead code from Instagram/vision removal — PASS, none found
- Grepped the whole repo for every symbol removed from `social-draft.mjs`
  (thumbnail fetch, vision-verification call, Instagram hook templates,
  test-only reset helper, call-cap counter). No remaining imports.
- Two **comment-only** stale references remain (not imports, harmless):
  - `scripts/appearance-discovery/lib/spend-limits.mjs` (docstring mentions
    `fetchAppearanceThumbnail` as an example of vision-call spend)
  - `scripts/merch-engine/build-drop-draft.mjs` (docstring analogy citing
    `fetchAppearanceThumbnail` as the network/fs counterpart to
    `buildSocialDraftPair`)
  Suggest cleaning these up in a follow-up but they do not affect behavior.

### 3. `checkCampaignPair` exemption scoping — PASS, narrowly scoped
- Exemption is `campaign.startsWith('appearance:')`. Repo-wide grep confirms
  the only producer of an `appearance:`-prefixed campaign string is
  `` `appearance:${c.videoId}` `` in `social-draft.mjs` — no other lane could
  accidentally collide with this prefix and get exempted from the
  X+Instagram pairing gate.

### 4. Test coverage — GOOD, one gap (non-blocking)
- `check-drafts.test.ts` gained 6 well-targeted new cases covering: thumbnail-
  credit rejection, allowlist-miss rejection, allowlisted-photo acceptance,
  IG video-thumb outright rejection, X video-thumb-with-image rejection, and
  X video-thumb-as-link-preview acceptance — plus one `checkCampaignPair`
  exemption test.
- **Gap:** `queue-schema.test.ts` was not updated with direct unit tests for
  the two new `video-thumb` branches added to `validateQueueItem`, nor for the
  `MEDIA_KINDS` addition. This logic is exercised only indirectly (manual
  `node scripts/social/validate-queue.mjs` run against real queue files, per
  the implementer). Recommend adding direct tests, but not blocking since the
  schema is simple and mirrors the already-well-tested check-drafts logic.

### 5. Style/security — no issues
- Comment density/style matches existing codebase conventions (heavy
  historical-decision annotation).
- No secrets, no injection surface changes, no new external calls introduced
  (in fact the diff *removes* a network fetch + paid vision API call).

## Recommendation
Approve as-is. Optional follow-up (non-blocking): add direct `queue-schema.test.ts`
coverage for the `video-thumb` branches; scrub the two stale comment references
to `fetchAppearanceThumbnail`.
