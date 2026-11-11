import { watchCandidate } from '../fingerprint.mjs';

export function mapNews({ stories = [], rawItems = [] }) {
  const byStory = new Map();
  for (const raw of rawItems) {
    if (raw.story_id && !byStory.has(raw.story_id)) byStory.set(raw.story_id, raw);
  }
  const candidates = stories.map((story) => {
    const raw = byStory.get(story.id);
    return watchCandidate({
      itemKey: `news:${story.id}`,
      cursorKey: `story:${story.id}`,
      source: 'news',
      sourceRef: story.id,
      url: raw?.url,
      title: story.canonical_title,
      excerpt: story.summary || raw?.snippet,
      storyId: story.id,
      detectedAt: story.first_seen_at,
    });
  });
  const known = new Set(stories.map((story) => story.id));
  for (const raw of rawItems) {
    if (raw.story_id && known.has(raw.story_id)) continue;
    const key = raw.story_id ? `news:${raw.story_id}` : `news-raw:${raw.source_id}:${raw.external_id}`;
    candidates.push(
      watchCandidate({
        itemKey: key,
        cursorKey: `raw:${raw.id}`,
        source: 'news',
        sourceRef: raw.id,
        url: raw.url,
        title: raw.title,
        excerpt: raw.snippet,
        storyId: raw.story_id ?? key,
        detectedAt: raw.created_at,
      }),
    );
  }
  return candidates;
}
