/* global Request */
// `Request` is a Node 18+ built-in global, but this repo's eslint config does
// not declare it for `scripts/**` (those files predate needing it). Declaring
// it here is narrower than widening the shared config for one dev-only script.
//
// Capture a REAL Clownbot answer from the live pipeline (PLAN.md Step 10).
//
// Drives the ACTUAL route handler (`apps/web/app/api/clown/route.ts`) by
// constructing a real `Request` and calling its exported `POST`, same
// pattern `route.test.ts` uses (`new Request(...)` -> `POST(req)`). This is
// deliberate: an earlier version of this script hand-rolled the pipeline
// stages before route.ts existed, and that harness diverged from the real
// route in how it built `sources` (it passed the full retrieved set; the
// route filters to only `take.citedIds`) — an artifact of the harness, not
// the product. Calling the real `POST` guarantees the captured JSON is
// byte-for-byte what a visitor's browser receives: rate-limit, kill-switch,
// crisis check, input blocklist, retrieval, compose-or-fallback, output
// gate, and the cited-ids-only `sources` filter, all exactly as shipped.
//
// NO MOCKING. Requires a Claude subscription token in the environment.
// Never prints or logs the token. Prints the
// route's JSON response body as formatted JSON on stdout; diagnostics
// (model call count) go to stderr so stdout stays parseable.
//
// Usage: tsx scripts/capture-clown-seed.mjs "question text"

import { POST } from '../apps/web/app/api/clown/route.ts';
import { runMain } from './lib/cli.mjs';

async function main() {
  const question = process.argv[2];
  if (!question || !question.trim()) {
    console.error('Usage: tsx scripts/capture-clown-seed.mjs "question text"');
    return 2;
  }
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    console.error('capture-clown-seed: CLAUDE_CODE_OAUTH_TOKEN is not set in the environment.');
    return 2;
  }
  process.env.CLOWN_CALL_PRIORITY = 'P3';

  const req = new Request('http://localhost/api/clown', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify({ text: question, transcript: [] }),
  });

  const res = await POST(req);
  const body = await res.json();

  console.error(`capture-clown-seed: status=${res.status} kind=${body.kind} theoryName=${body.theoryName} delulu=${body.delulu} sourcesCount=${Array.isArray(body.sources) ? body.sources.length : 0}`);

  console.log(JSON.stringify(body, null, 2));
}

runMain(main, { name: 'capture-clown-seed' });
