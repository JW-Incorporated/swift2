#!/usr/bin/env node
// Tree's daily-draft pre-compute (Bots v2 W8). Read-only: gathers everything
// deterministic about today's run — calendar slots, what is already drafted
// (on main AND in open draft PRs), the never-used photo per slot, active
// rules, the owner's recent rejection reasons, uncovered time-sensitive
// events — and writes ONE JSON file the model reads instead of searching.
// Run by routine-tree-daily-draft.yml's `prepare` job before the model starts;
// safe locally (`--no-gh` skips every GitHub read).
//
//   node scripts/social/prepare-draft-inputs.mjs [--out .scratch/tree-inputs.json] [--no-gh] [--no-event-status] [--now <iso>]
//
// Never fails the run: a section that cannot be read becomes a `warnings`
// entry (and the model is told), because a missing input must degrade, not
// stop the day's drafts.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { runEventStatusCli } from './check-event-transition.mjs';
import { buildDraftInputs, summarizeInputs } from './lib/draft-inputs.mjs';
import { listOpenDraftPrs, readPrQueueItems } from './lib/draft-prs.mjs';
import { fromRestIssue, isTrustedAuthor } from './lib/event-dispatch.mjs';
import { readIntents } from './lib/inbox.mjs';
import { igUsablePhotos } from './lib/photo-dimensions.mjs';
import { readJsonDir } from './lib/social-fs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DAY_MS = 86_400_000;

const defaultGh = (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60_000 });

/** Every GitHub-side input, each section guarded so a failure becomes a warning. */
export function collectGithub(runGh, { nowMs, repo, warnings }) {
  const guard = (label, fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      warnings.push(`${label} could not be read (${String(err.message).split('\n')[0].slice(0, 120)}) — treat it as unknown, not as empty`);
      return fallback;
    }
  };
  const openDrafts = guard('open social-draft PRs', () => listOpenDraftPrs(runGh).flatMap((pr) => readPrQueueItems(runGh, repo, pr).filter((i) => i.data)), []);
  const since = new Date(nowMs - 14 * DAY_MS).toISOString().slice(0, 10);
  const closedPrs = guard('closed social-draft PRs', () => JSON.parse(runGh(['pr', 'list', '--state', 'closed', '--label', 'social-draft', '--search', `is:unmerged closed:>=${since}`, '--limit', '30', '--json', 'number,closedAt,comments'])), []);
  // Titles reach the model, and the intake form auto-labels for ANY user — keep only the news desk and repo insiders.
  const intakeIssues = guard('intake issues', () => JSON.parse(runGh(['api', `repos/${repo}/issues?labels=intake&state=open&per_page=40`])).map(fromRestIssue).filter((i) => i && isTrustedAuthor(i)), []);
  return { openDrafts, closedPrs, intakeIssues };
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.includes(name);
  const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const out = path.resolve(value('--out') ?? path.join(ROOT, '.scratch', 'tree-inputs.json'));
  const now = value('--now') ?? new Date().toISOString();
  const warnings = [];

  const social = path.join(ROOT, 'social');
  const library = JSON.parse(await readFile(path.join(social, 'photo-library.json'), 'utf8')).photos;
  const [posted, queue, intents] = await Promise.all([readJsonDir(path.join(social, 'posted')), readJsonDir(path.join(social, 'queue')), readIntents(path.join(social, 'inbox'))]);
  const readText = (file) => readFile(path.join(social, file), 'utf8').catch(() => '');

  let github = { openDrafts: [], closedPrs: [], intakeIssues: [] };
  if (flag('--no-gh')) warnings.push('--no-gh: open-PR drafts, rejections and intake issues were NOT read');
  else {
    const repo = process.env.GITHUB_REPOSITORY || JSON.parse(defaultGh(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;
    github = collectGithub(defaultGh, { nowMs: Date.parse(now), repo, warnings });
  }

  let eventStatus = null;
  if (!flag('--no-event-status')) {
    try {
      eventStatus = runEventStatusCli();
    } catch (err) {
      warnings.push(`event-status could not run (${String(err.message).split('\n')[0].slice(0, 120)}) — treat as unknown`);
    }
  }

  const { usable: igUsable, unreadable } = await igUsablePhotos(library, path.join(ROOT, 'apps', 'web', 'public'));
  if (unreadable.length) warnings.push(`${unreadable.length} library photo file(s) could not be read and were treated as unusable: ${unreadable.slice(0, 5).join(', ')}`);

  const inputs = buildDraftInputs({
    now, library, calendarMd: await readText('calendar.md'), lessonsMd: await readText('lessons.md'),
    posted, queue, intents, eventStatus, warnings, igUsable, ...github,
  });
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(inputs, null, 2)}\n`, 'utf8');
  console.log(summarizeInputs(inputs));
  console.log(`wrote ${path.relative(ROOT, out)} (${Buffer.byteLength(JSON.stringify(inputs))} bytes)`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('prepare-draft-inputs.mjs')) {
  runMain(main, { name: 'prepare-draft-inputs' });
}
