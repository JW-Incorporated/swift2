// Marjorie's side of the status page (Bots v2 W4): read and write the "note"
// region and the daily-ping stamp inside the single `status-page` issue body.
// Everything else on the page is rendered by status-page.mjs; this CLI never
// touches it.
//
//   node scripts/marjorie/status-note.mjs write --body-file <md> [--date YYYY-MM-DD]   replace Marjorie's note
//   node scripts/marjorie/status-note.mjs extract --out <md>                           save the current note; prints the issue url
//   node scripts/marjorie/status-note.mjs stamp-ping --message-id <id> [--date ...]    record today's Discord ping
//   node scripts/marjorie/status-note.mjs url                                           print the status issue url
//   node scripts/marjorie/status-note.mjs today                                         prints 1 when today's note or ping exists, else 0
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { laToday } from './ha-close.mjs';
import { ensureStatusIssue, findStatusIssue, replaceNote, stampPing, updateBody } from './lib/status-issue.mjs';
import { readPreserved } from './lib/status-render.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

function flagsOf(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { flags[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return flags;
}

/** Edit the body, then re-read it: a concurrent render can overwrite a write made between its read and its patch. */
async function editBody({ api, gh, repo, edit, hasEdit }) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { issue } = await ensureStatusIssue({ api, gh, repo });
    await updateBody({ gh, repo, number: issue.number, body: edit(issue.body) });
    const check = await findStatusIssue(api, repo);
    if (check && hasEdit(check.body)) return check;
  }
  throw new Error('status page edit did not stick after a retry (a concurrent render kept overwriting it)');
}

export async function main(argv = process.argv.slice(2), {
  api = ghApi, gh = ghRun, log = console.log, now = new Date(), env = process.env, read = readFileSync, write = writeFileSync,
} = {}) {
  const [command, ...rest] = argv;
  const flags = flagsOf(rest);
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(flags.date || '') ? flags.date : laToday(now);
  if (command === 'write') {
    if (!flags['body-file']) throw new Error('write needs --body-file');
    const text = read(flags['body-file'], 'utf8');
    const issue = await editBody({
      api, gh, repo,
      edit: (body) => replaceNote(body, { text, date }),
      hasEdit: (body) => readPreserved(body).note.date === date,
    });
    log(`status note: written to #${issue.number} for ${date}`);
    return 0;
  }
  if (command === 'stamp-ping') {
    const msg = flags['message-id'] || '';
    const issue = await editBody({
      api, gh, repo,
      edit: (body) => stampPing(body, { date, msg }),
      hasEdit: (body) => readPreserved(body).ping?.date === date,
    });
    log(`status note: ping stamped on #${issue.number} for ${date}`);
    return 0;
  }
  const issue = await findStatusIssue(api, repo);
  if (command === 'today') {
    const kept = issue ? readPreserved(issue.body) : null;
    log(kept && (kept.note.date === date || kept.ping?.date === date) ? '1' : '0');
    return 0;
  }
  if (!issue) throw new Error('no open status-page issue yet — run status-page.mjs --apply first');
  if (command === 'url') {
    log(issue.url);
    return 0;
  }
  if (command === 'extract') {
    if (!flags.out) throw new Error('extract needs --out');
    write(flags.out, `${readPreserved(issue.body).note.text}\n`);
    log(`status-issue: ${issue.number} ${issue.url}`);
    return 0;
  }
  throw new Error('usage: status-note.mjs write|extract|stamp-ping|url|today');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-note' });
}
