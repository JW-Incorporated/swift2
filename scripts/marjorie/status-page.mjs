// Renders the Long Live status page (Bots v2 W4) — deterministic, no LLM.
//
//   node scripts/marjorie/status-page.mjs --dry-run   print the body from live read-only gh data; writes nothing
//   node scripts/marjorie/status-page.mjs --apply     find (or create + pin) the `status-page` issue and rewrite its body
//
// Run from a checkout of main: HUMAN-ACTIONS.md and social/** are read from disk.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { gatherStatusData } from './lib/status-data.mjs';
import { ensureStatusIssue, updateBody } from './lib/status-issue.mjs';
import { readPreserved, renderStatusPage } from './lib/status-render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_REPO = 'JW-Incorporated/swift2';

export async function main(argv = process.argv.slice(2), {
  api = ghApi, gh = ghRun, root = ROOT, now = Date.now(), log = console.log, env = process.env,
} = {}) {
  const apply = argv.includes('--apply');
  if (!apply && !argv.includes('--dry-run')) {
    log('usage: status-page.mjs --dry-run | --apply');
    return 2;
  }
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  let existing = null;
  if (apply) {
    existing = (await ensureStatusIssue({ api, gh, repo, log })).issue;
  }
  const data = await gatherStatusData({ api, repo, root, now, existingBody: existing?.body || '', readPreserved });
  const body = renderStatusPage(data, { now, repo });
  if (!apply) {
    log(body);
    return 0;
  }
  await updateBody({ gh, repo, number: existing.number, body });
  log(`status page: rewrote #${existing.number} (${body.length} chars${data.warnings.length ? `, unreadable: ${data.warnings.join(', ')}` : ''})`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-page' });
}
