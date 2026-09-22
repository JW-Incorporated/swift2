#!/usr/bin/env node
// Reports social/photo-library.json coverage by era, venue, and date so
// Tree/founders can see where the pool is still concentrated on one
// concert instead of spread across many (kanban t_e1d26de7, 2026-09-22 —
// pool-expansion pipeline; the trigger for this whole card was exactly this
// blind spot: nobody could see, at a glance, that 8/10 photos were one show).
// Read-only — never mutates the library.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const inventory = JSON.parse(await readFile(path.join(ROOT, 'social', 'photo-library.json'), 'utf8'));

function tally(photos, keyFn, label) {
  const counts = new Map();
  for (const photo of photos) {
    const key = keyFn(photo) ?? `(no ${label})`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const photos = inventory.photos;
const total = photos.length;

function printSection(title, rows) {
  console.log(`\n${title}:`);
  for (const [key, count] of rows) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    console.log(`  ${String(count).padStart(3)} (${pct}%)  ${key}`);
  }
}

console.log(`Photo library coverage — ${total} total entries`);
printSection(
  'By era (first tag, if any)',
  tally(photos, (p) => p.tags?.[0], 'era'),
);
printSection(
  'By venue',
  tally(photos, (p) => p.venue, 'venue'),
);
printSection(
  'By date',
  tally(photos, (p) => p.date, 'date'),
);

// A concentration warning — mirrors the founder complaint that triggered
// this card: one venue/date accounting for most of the pool.
const venueRows = tally(photos, (p) => p.venue, 'venue').filter(([key]) => !key.startsWith('(no'));
const topVenue = venueRows[0];
if (total > 0 && topVenue && topVenue[1] / total > 0.5) {
  console.log(
    `\n⚠ concentration warning: "${topVenue[0]}" alone accounts for ${topVenue[1]}/${total} ` +
      `(${Math.round((topVenue[1] / total) * 100)}%) of the pool — source more photos from other concerts.`,
  );
}
