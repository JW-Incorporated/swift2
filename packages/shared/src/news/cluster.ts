// Dedup clustering — the crux of any news pipeline. Ported from the sibling
// Orbit project's production pipeline (apps/worker/src/pipeline/cluster.ts) —
// code, not content.
//
// `clusterBatch` is a PURE function: given a batch of new items and the recent
// stories to match against, it decides, per item, whether the item joins an
// existing story, joins a story formed earlier in this same batch, or starts a
// new story. No I/O — fully testable in-memory; the future worker pipeline
// simply feeds it the right inputs.

import type { SimilarityProvider } from './news-types';

/** The minimum an item needs to be clustered. */
export interface ClusterableItem {
  /** Stable id, used only for reporting/correlation. */
  id: string;
  /** Title — the text the similarity signature is computed from. */
  title: string;
  /** ISO timestamp; the earliest item becomes a new story's representative. */
  publishedAt?: string;
}

/** A recent story to match new items against. */
export interface ExistingStory {
  id: string;
  /** Similarity key of every item already attached to this story. */
  similarityKeys: string[];
}

export interface ClusterOptions {
  /** Similarity at or above this attaches an item to a story. */
  threshold: number;
  /** The subject's search terms — stripped from signatures (see provider). */
  subjectTerms?: string[];
}

export interface ItemAssignment<T extends ClusterableItem> {
  item: T;
  /** Signature for this item; persisted alongside the raw item. */
  similarityKey: string;
  /** Set when the item joins a pre-existing story. */
  existingStoryId?: string;
  /**
   * Set when the item joins a story formed during THIS batch. Items that share
   * a `newStoryIndex` belong to the same new story.
   */
  newStoryIndex?: number;
  /** Score of the winning match; 0 when the item starts a new story. */
  score: number;
}

export interface ClusterResult<T extends ClusterableItem> {
  assignments: ItemAssignment<T>[];
  /** Count of new stories formed in this batch. */
  newStoryCount: number;
}

interface WorkStory {
  /** Set for a pre-existing story. */
  existingId?: string;
  /** Set for a story formed during this batch. */
  newIndex?: number;
  /** Growing set of member similarity keys. */
  keys: string[];
}

export function clusterBatch<T extends ClusterableItem>(
  items: T[],
  existingStories: ExistingStory[],
  provider: SimilarityProvider,
  options: ClusterOptions,
): ClusterResult<T> {
  // Earliest-first: the first item of a cluster becomes its representative.
  const ordered = [...items].sort((a, b) => toTime(a.publishedAt) - toTime(b.publishedAt));

  const work: WorkStory[] = existingStories.map((s) => ({
    existingId: s.id,
    keys: [...s.similarityKeys],
  }));

  const assignments: ItemAssignment<T>[] = [];
  let newStoryCount = 0;

  for (const item of ordered) {
    const key = provider.computeKey(item.title, options.subjectTerms);

    // Best match across existing stories AND new stories formed so far.
    let best: { story: WorkStory; score: number } | undefined;
    if (key !== '') {
      for (const story of work) {
        let score = 0;
        for (const memberKey of story.keys) {
          const s = provider.similarity(key, memberKey);
          if (s > score) score = s;
        }
        if (!best || score > best.score) best = { story, score };
      }
    }

    if (best && best.score >= options.threshold) {
      best.story.keys.push(key);
      assignments.push({
        item,
        similarityKey: key,
        existingStoryId: best.story.existingId,
        newStoryIndex: best.story.newIndex,
        score: best.score,
      });
    } else {
      const story: WorkStory = { newIndex: newStoryCount, keys: [key] };
      work.push(story);
      assignments.push({ item, similarityKey: key, newStoryIndex: newStoryCount, score: 0 });
      newStoryCount++;
    }
  }

  return { assignments, newStoryCount };
}

function toTime(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}
