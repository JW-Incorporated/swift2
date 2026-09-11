#!/usr/bin/env node
// Watchdog check (docs/social/RULINGS-SOCIAL.md A6): a `[BLOCKING]` human action can be
// late, but it must never be SILENT. Tonight's near-miss (#56 — "freeze
// social posting while the approval gate lands", filed 2026-09-10, not
// executed until a session caught it independently at 2026-09-11T00:02:22Z)
// was exactly this: a load-bearing human action sat open with nothing
// watching its age.
//
// Read-only: parses HUMAN-ACTIONS.md's `## OPEN` section for
// `### N. [BLOCKING] ...` headings, and each one's own `**Filed:** YYYY-MM-DD`
// line (the format both this repo and the owner's Projects-root convention
// document — see HUMAN-ACTIONS.md's own header note added 2026-08-23).
// Never writes to HUMAN-ACTIONS.md — that file's convention (entry
// numbering, SKIP-is-final, etc.) is out of scope for this script and for
// the social-approval-gate track that added it.
//
// Usage: node scripts/watchdog/blocking-human-actions-check.mjs \
//   [--file HUMAN-ACTIONS.md] --alert-body <path> [--now <iso>] [--max-age-hours 24]
//
// Exit codes (same contract as scripts/check-work-ownership.mjs, which
// watchdog.yml's "Work-ownership check" step already documents):
//   0 — no OPEN [BLOCKING] item is older than the threshold; alert-body.md
//       holds the all-clear message for upsert-alert.sh's `close`.
//   1 — at least one OPEN [BLOCKING] item is older than the threshold;
//       alert-body.md lists them for upsert-alert.sh's `open`.
//   2 — the check itself is broken (file unreadable, unparseable) — must
//       never be reported as "no problems".

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}

/** Parses every `### N. [TAG] Title` heading in the `## OPEN` section and
 * its own nearest-following `**Filed:** YYYY-MM-DD` line. Stops at the next
 * `## ` heading (e.g. `## DONE`) so a resolved item's stale `[BLOCKING]`
 * text is never mistaken for an open one. */
export function parseOpenBlockingItems(markdown) {
  const lines = markdown.split(/\r?\n/);
  const openStart = lines.findIndex((l) => l.trim() === '## OPEN');
  if (openStart === -1) return [];
  let openEnd = lines.length;
  for (let i = openStart + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      openEnd = i;
      break;
    }
  }
  const openSection = lines.slice(openStart + 1, openEnd).join('\n');

  const items = [];
  const headingRe = /^### (\d+)\. \[([A-Z]+)\]\s*(.+)$/gm;
  let match;
  const headingPositions = [];
  while ((match = headingRe.exec(openSection))) {
    headingPositions.push({ index: match.index, number: match[1], tag: match[2], title: match[3].trim() });
  }
  for (let i = 0; i < headingPositions.length; i++) {
    const { index, number, tag, title } = headingPositions[i];
    if (tag !== 'BLOCKING') continue;
    const end = i + 1 < headingPositions.length ? headingPositions[i + 1].index : openSection.length;
    const body = openSection.slice(index, end);
    const filedMatch = body.match(/\*\*Filed:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    if (!filedMatch) continue; // no Filed date at all — nothing to age against; not this check's job to enforce the convention itself
    items.push({ number, title, filed: filedMatch[1] });
  }
  return items;
}

export function hoursSince(isoDate, now) {
  const filedAt = new Date(`${isoDate}T00:00:00Z`);
  return (now.getTime() - filedAt.getTime()) / (60 * 60 * 1000);
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = flag(args, 'file') ?? 'HUMAN-ACTIONS.md';
  const alertBodyPath = flag(args, 'alert-body');
  const now = flag(args, 'now') ? new Date(flag(args, 'now')) : new Date();
  const maxAgeHours = Number(flag(args, 'max-age-hours') ?? 24);
  if (!alertBodyPath) {
    throw new Error('Usage: blocking-human-actions-check.mjs --alert-body <path> [--file HUMAN-ACTIONS.md] [--now <iso>] [--max-age-hours 24]');
  }

  let markdown;
  try {
    markdown = await readFile(path.resolve(filePath), 'utf8');
  } catch (err) {
    console.error(`blocking-human-actions-check: could not read ${filePath}: ${err.message ?? err}`);
    process.exitCode = 2;
    return;
  }

  const items = parseOpenBlockingItems(markdown);
  const aged = items
    .map((item) => ({ ...item, hoursOpen: hoursSince(item.filed, now) }))
    .filter((item) => item.hoursOpen > maxAgeHours);

  if (aged.length === 0) {
    await writeFile(
      alertBodyPath,
      `No OPEN \`[BLOCKING]\` human action in \`${filePath}\` is older than ${maxAgeHours}h, as of ${now.toISOString()}.\n`,
    );
    console.log('blocking-human-actions-check: OK — no aged [BLOCKING] items.');
    return;
  }

  const lines = [
    `${aged.length} OPEN \`[BLOCKING]\` human action(s) in \`${filePath}\` ${aged.length === 1 ? 'is' : 'are'} older than ${maxAgeHours}h.`,
    '',
    '**Why this matters:** a filed-but-unexecuted human action is a single point of failure that looks identical to a handled one unless something watches its age — item #56 ("freeze social posting while the approval gate lands") sat open for this exact reason tonight (docs/social/RULINGS-SOCIAL.md).',
    '',
  ];
  for (const item of aged) {
    const days = Math.floor(item.hoursOpen / 24);
    const hours = Math.round(item.hoursOpen - days * 24);
    const age = days > 0 ? `${days}d ${hours}h` : `${Math.round(item.hoursOpen)}h`;
    lines.push(`- #${item.number} — ${item.title} — filed ${item.filed}, open ${age}`);
  }
  await writeFile(alertBodyPath, lines.join('\n') + '\n');
  console.error(`blocking-human-actions-check: ${aged.length} aged [BLOCKING] item(s) — see ${alertBodyPath}.`);
  process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && path.basename(process.argv[1]) === 'blocking-human-actions-check.mjs';
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`blocking-human-actions-check: crashed: ${err.stack ?? err}`);
    process.exitCode = 2;
  });
}
