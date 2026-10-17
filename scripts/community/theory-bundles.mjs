import { createJevClient, createJevUsageLogger, noulQuestion } from '../lib/jev.mjs';

export const THEORY_COMMENT_BUCKET_SIZE = 10;
export const THEORY_JEV_PER_RUN_CAP = 40;
export const Q_THEORY = noulQuestion(
  'q_theory',
  'Does the text contain a fan theory or Easter-egg claim about her music, eras, visuals or announcements (not about her private life)?',
);

export function commentBucket(post) {
  const count = Number.isFinite(Number(post.numComments))
    ? Number(post.numComments)
    : post.comments?.length ?? 0;
  return Math.floor(Math.max(0, count) / THEORY_COMMENT_BUCKET_SIZE);
}

export function theoryBundleKey(post) {
  return `bundle:${post.postId}:${commentBucket(post)}`;
}

export function theoryBundleText(post) {
  return [post.title, ...(post.comments ?? []).map((comment) => comment.body)]
    .filter((value) => typeof value === 'string' && value.trim())
    .join('\n');
}

export function createTheoryPrefilter(db, { cap = THEORY_JEV_PER_RUN_CAP, createClient = createJevClient } = {}) {
  let calls = 0;
  let capped = 0;
  const client = createClient({ usageLogger: createJevUsageLogger(db) });
  return {
    async shouldMine(post) {
      if (calls >= cap) {
        capped += 1;
        return null;
      }
      calls += 1;
      const result = await client.ask({
        caller: 'theory-miner-prefilter',
        state: theoryBundleText(post),
        questions: [Q_THEORY],
      });
      const answer = result.answers.q_theory;
      return answer?.type === 'noul' && answer.probability >= 0.5;
    },
    stats() {
      return { calls, capped, cap };
    },
  };
}
