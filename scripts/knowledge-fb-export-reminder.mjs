#!/usr/bin/env node
// Opens/updates one GitHub issue every Sunday 09:00 PT with the Facebook
// weekly-export checklist (proposal §4.7, PLAN.md Stage 6). Scheduled by
// .github/workflows/fb-export-reminder.yml. Deliberately zero AI, same
// family as watchdog.yml/appearance-discovery.yml — this is a mechanical
// reminder, not a judgment call.
//
// Date-scoped title ("week of <date>"), unlike watchdog.yml's persistent
// alert-issue pattern — that's intentional here: a fresh weekly checklist
// issue is the natural unit of "did this week's task happen," and Joey
// closes each one when done. Idempotent within the same week: re-running
// (e.g. a manual dispatch) finds the existing open issue for this week by
// exact title match and comments instead of filing a duplicate.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { gh } from './lib/gh.mjs';
import { FB_GROUPS_CHECKLIST } from './knowledge/fb-groups-checklist.mjs';
import { runMain } from './lib/cli.mjs';

const DRY_RUN = process.env.DRY_RUN === 'true';

/** YYYY-MM-DD for the given date, UTC. */
export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function issueTitle(weekLabel) {
  return `FB group export due — week of ${weekLabel}`;
}

export function issueBody(groups) {
  const lines = [
    '@sffan15-sys — this week\'s Facebook groups export (proposal §4.7 / PLAN.md Stage 6). ~30 minutes, once a week, in a normal logged-in browser — never a bot (Facebook has no API for groups you don\'t administer and prohibits automated collection; this is you, manually, saving pages you can already see).',
    '',
  ];
  if (groups.length === 0) {
    lines.push(
      '**No groups configured yet.** Add them to `scripts/knowledge/fb-groups-checklist.mjs` ' +
        '(HUMAN-ACTIONS.md #16) — this issue will list them here once you do.',
    );
  } else {
    lines.push('**Groups (start with 3–5; this list is the checklist):**');
    for (const g of groups) {
      const note = g.candidate
        ? ' — _candidate, confirm you\'re a member, or delete the line_'
        : '';
      lines.push(`- [ ] ${g.label} (\`${g.slug}\`)${note}`);
    }
    if (groups.some((g) => g.candidate)) {
      lines.push(
        '',
        'To confirm a candidate row: edit `scripts/knowledge/fb-groups-checklist.mjs` and remove ' +
          "its `candidate: true` (or say \"confirmed <slug>\" in chat and a session will edit it for you).",
      );
    }
  }
  lines.push(
    '',
    '**Per group, in order:**',
    '1. Open the group → sort posts by **New activity** (not Top).',
    '2. Scroll until posts are older than 7 days. Expand "See more" on anything long; don\'t open comments individually.',
    '3. `Ctrl/Cmd+S` → "Webpage, Complete" → name it `fb-<group-slug>-<YYYY-MM-DD>.html`.',
    '4. Repeat for each group above.',
    '5. Run `npm run knowledge:fb-upload -- ~/Downloads/fb-*.html` — uploads each file to the ' +
      'private `facebook-exports` Supabase Storage bucket (never the public repo) and deletes the ' +
      'local copies once each upload is confirmed.',
    '6. Run `node scripts/community/fb-export-ingest.mjs --group <group-slug> <file.html>` for each ' +
      'uploaded file — parses it into a fan-signal row and paste-ready engagement leads (Community ' +
      'Engine plan §2.4, card P1-3). Add `--dry-run` first if you want to see what it would write ' +
      'before it touches the database.',
    '7. Tick the checklist above; close this issue. Done.',
    '',
    '**First real export — one-time calibration (HUMAN-ACTIONS.md #16):** the parser ' +
      '(`facebook-groups-parser.ts`) was written against Facebook\'s documented `role="article"` / ' +
      '`aria-label` markup, never against a real saved export — no Facebook account was available to ' +
      'verify it against. The first time you run step 6 above on a real file:',
    '- If it reports 0 posts kept on a group you know was active this week, the parser\'s regexes ' +
      'need retuning against your real file\'s actual markup — say so in chat with the export file ' +
      'attached and a session will fix it.',
    '- If it reports a sane post count, the parser is calibrated — no further action needed, and ' +
      'this note can be deleted from future weeks\' issues once you confirm.',
    '',
    '_Filed by fb-export-reminder (deterministic, no AI)._',
  );
  return lines.join('\n');
}

async function findOpenIssue(title) {
  const { stdout } = await gh([
    'issue', 'list', '--search', `"${title}" in:title`, '--state', 'open',
    '--json', 'number,title',
  ]);
  const matches = JSON.parse(stdout).filter((i) => i.title === title);
  return matches[0]?.number ?? null;
}

async function createOrCommentIssue(title, body) {
  const bodyPath = path.join(tmpdir(), `fb-export-reminder-${Date.now()}.md`);
  writeFileSync(bodyPath, body, 'utf8');
  try {
    const existing = await findOpenIssue(title);
    if (existing) {
      await gh(['issue', 'comment', String(existing), '--body-file', bodyPath]);
      return { action: 'commented', number: existing };
    }
    const { stdout } = await gh(['issue', 'create', '--title', title, '--body-file', bodyPath]);
    return { action: 'created', url: stdout.trim() };
  } finally {
    try { unlinkSync(bodyPath); } catch { /* best-effort cleanup */ }
  }
}

async function main() {
  const weekLabel = isoDate(new Date());
  const title = issueTitle(weekLabel);
  const body = issueBody(FB_GROUPS_CHECKLIST);

  if (DRY_RUN) {
    console.log(`DRY RUN — would file/update: "${title}"\n\n${body}`);
    return;
  }

  const result = await createOrCommentIssue(title, body);
  console.log(`fb-export-reminder: ${result.action} — ${result.url ?? `#${result.number}`}`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'knowledge-fb-export-reminder' });
}
