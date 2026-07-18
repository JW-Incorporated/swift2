#!/usr/bin/env node
// News/Current worker entrypoint — one-shot: run one full pipeline cycle,
// exit (proposal §6). Scheduled by .github/workflows/news-worker.yml.
//
//   node --env-file=apps/worker/.env src/index.ts   (local)
//   npm run news --workspace @swift2/worker           (via tsx)

import { createWorkerDbClient } from './db/client';
import { runCycle } from './pipeline/run-cycle';

async function main() {
  const db = createWorkerDbClient();
  const result = await runCycle(db);

  console.log('news-worker: cycle complete', {
    sourcesPolled: result.sourcesPolled,
    itemsIngested: result.itemsIngested,
    newStories: result.newStories,
    storiesClassified: result.storiesClassified,
    storiesVerified: result.storiesVerified,
    errorCount: result.errors.length,
  });
  for (const err of result.errors) console.error(`news-worker: ${err}`);

  // Stage isolation means individual failures never abort the cycle — but a
  // cycle that logged errors should still fail the Action so it's visible,
  // rather than reporting green while things quietly broke.
  if (result.errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('news-worker: cycle crashed:', err);
  process.exitCode = 1;
});
