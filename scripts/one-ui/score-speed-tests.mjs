#!/usr/bin/env node
// Scores Speed test mode runs from the [diag] comments on issue #4791 against PLAN §WP0.2.
// Usage: node scripts/one-ui/score-speed-tests.mjs [--json]
import { execFileSync } from 'node:child_process';
import { parseGhPages, renderTable, scoreComments } from './lib/speed-score.mjs';

const raw = execFileSync(
  'gh',
  ['api', 'repos/JW-Incorporated/swift2/issues/4791/comments', '--paginate'],
  {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  },
);
const result = scoreComments(parseGhPages(raw));
console.log(
  process.argv.includes('--json') ? JSON.stringify(result, null, 2) : renderTable(result),
);
