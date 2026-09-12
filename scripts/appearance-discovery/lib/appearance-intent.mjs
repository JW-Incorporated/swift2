// Fast-lane inbox intent — builds a `social/inbox/*.json` v:1 intent from a
// deterministic appearance-discovery detection candidate (the same shape
// discover.mjs's `plan.toFile` entries carry). Tree Overhaul T6, 2026-09-12:
// replaces this lane's old caption-writing `buildSocialDraftPair`
// (scripts/appearance-discovery/lib/social-draft.mjs, deleted) — this module
// writes no body, no caption text of any kind, only the RSS metadata the
// feed itself already asserts (channel name, video title, publish date,
// video id, watch URL). Pure — no gh/fs/network calls, same split as
// scripts/merch-engine/build-drop-draft.mjs.

// appearance lane deadline (T6 spec's Deadlines table): an appearance is
// stale almost immediately.
const APPEARANCE_DEADLINE_MS = 48 * 60 * 60 * 1000;

/**
 * Builds the `social/inbox/*.json` intent for one appearance-discovery
 * candidate (T6 spec's appearance `facts` shape). `issueNumber` is the
 * intake issue already filed for this same candidate (discover.mjs files it
 * first, unchanged); `links.issue` points at it — `null` when unknown (e.g.
 * a dry-run preview, where no issue is actually filed).
 */
export function buildAppearanceIntent(c, { now = new Date(), issueNumber = null } = {}) {
  const createdAt = now.toISOString();
  return {
    v: 1,
    id: `appearance-${createdAt.slice(0, 10)}-${c.videoId}`,
    source: 'appearance-discovery',
    lane: 'appearance',
    createdAt,
    deadline: new Date(now.getTime() + APPEARANCE_DEADLINE_MS).toISOString(),
    status: 'open',
    facts: {
      channelName: c.channelName,
      videoTitle: c.title,
      publishedAt: c.published,
      videoId: c.videoId,
      url: c.url,
    },
    media: [],
    links: { pr: null, issue: issueNumber },
  };
}
