#!/usr/bin/env node
// Notifications Phase 2 producer seam for `official_youtube`
// (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§10) — this task's
// instruction to "map where each existing pipeline currently emits its
// detections and document the exact seam you're using".
//
// SEAM: `scripts/appearance-discovery/discover.mjs` is the only existing
// automated detector of new YouTube uploads. It already tags each
// candidate with a `rule` ('all-uploads' | 'taylor-swift' | 'swift-title')
// — `'all-uploads'` means the video came from Taylor's OWN channel
// (channels.mjs's `allUploads: true` entry), which is exactly spec §4's
// `official_youtube` category ("New videos on Taylor's official channel").
// This module is called from discover.mjs's FILE_MODE loop, once per
// successfully-filed intake issue whose rule is 'all-uploads' — one
// insertEvent() call site for this category, gated on the same
// "successfully filed" condition the fast-lane social draft already uses
// (a video whose intake issue failed to file gets neither a social draft
// nor a notification event).
import { insertEvent } from '@swift2/core';

/**
 * Emits an `official_youtube` event for a genuinely new official-channel
 * upload. No-ops (returns `{ emitted: false }`) for anything not tagged
 * 'all-uploads' — fan reactions / talk-show clips matched by the
 * 'taylor-swift'/'swift-title' rules are NOT official uploads and must
 * never fire this category (spec §4: "New videos on Taylor's official
 * channel", not "any video mentioning her").
 */
export async function emitOfficialYoutubeEvent(candidate, { db, now = new Date() } = {}) {
  if (candidate?.rule !== 'all-uploads') return { emitted: false, reason: 'not-official-channel' };
  if (!db) return { emitted: false, reason: 'no-db-client' };
  const videoId = String(candidate?.videoId ?? '');
  if (!videoId) return { emitted: false, reason: 'no-video-id' };

  const title =
    String(candidate?.title ?? '')
      .trim()
      .slice(0, 140) || 'New video on Taylor\u2019s channel';
  const result = await insertEvent(db, {
    category: 'official_youtube',
    title: 'New on Taylor\u2019s channel',
    body: title,
    deepLink: candidate?.url || `https://www.youtube.com/watch?v=${videoId}`,
    // Same video id the intake-issue fingerprint already dedupes on
    // (dedupe.mjs's fingerprintMarker) — one canonical identity for "have
    // we already handled this video" across both lanes.
    dedupeKey: `official_youtube:${videoId}`,
    now,
  });
  return { emitted: !result.deduped, deduped: result.deduped };
}
