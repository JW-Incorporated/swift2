#!/usr/bin/env node
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildIngestResult } from '../community/fb-export-ingest.mjs';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';
import { FB_GROUPS_CHECKLIST } from './fb-groups-checklist.mjs';
import { extensionCollect } from './fb-export-launch.mjs';
import { localDate, weekOf } from './fb-export-helpers.mjs';

const execFileAsync = promisify(execFile);
// Statuses that stop the whole run (Facebook is blocking or limiting this browser).
const STOP_STATUSES = [
  'login',
  'login-failed',
  'checkpoint',
  'captcha',
  'wrong-profile',
  'stunted',
];
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

export async function gateExport(
  result,
  group,
  { read = readFile, copy = copyFile, remove = rm } = {},
) {
  if (result.harvestedCount < 5 && result.slotCount > 20)
    return { ok: false, reason: 'low harvest' };
  if (result.status !== 'collected') return { ok: false, reason: result.status };
  if (!result.ageRuleMet && !result.partial)
    return { ok: false, reason: 'seven-day age rule not met' };
  const copyPath = `${result.filePath}.gate-copy.html`;
  try {
    await copy(result.filePath, copyPath);
    const html = await read(copyPath, 'utf8');
    const parsed = buildIngestResult(html, {
      groupSlug: group.slug,
      groupName: group.label,
      exportedAt: new Date(),
    });
    if (parsed.fanSignal.volume < 1) return { ok: false, reason: 'real parser kept 0 posts' };
    return {
      ok: true,
      postCount: parsed.fanSignal.volume,
      harvestedCount: result.harvestedCount,
      stopReason: result.stopReason,
      coverageAgeMs: result.coverageAgeMs,
      partial: result.partial,
      collectedAt: result.collectedAt,
      filePath: result.filePath,
    };
  } catch (error) {
    return { ok: false, reason: `parser gate failed: ${error.message}` };
  } finally {
    await remove(copyPath, { force: true }).catch(() => undefined);
  }
}

export function parseIngestSummary(stdout) {
  const match = String(stdout).match(
    /(\d+) post\(s\) kept, (\d+) screened out, (\d+) lead\(s\), (\d+) shop-link candidate\(s\)/,
  );
  if (!match) return null;
  return {
    postsKept: Number(match[1]),
    screenedOut: Number(match[2]),
    leads: Number(match[3]),
    shopLinks: Number(match[4]),
  };
}

export async function ingestOne(
  { groupSlug, filePath, exportedAt, dryRun = false },
  exec = execFileAsync,
) {
  // Ingest imports the TypeScript parser, so the child needs the tsx loader (plain node
  // fails with ERR_MODULE_NOT_FOUND, as the npm scripts did before they moved to tsx).
  // --env-file-if-exists: a --dry-run needs no keys and must work without the dotenv file.
  const args = [
    '--import',
    'tsx',
    '--env-file-if-exists=apps/worker/.env',
    'scripts/community/fb-export-ingest.mjs',
    '--group',
    groupSlug,
    '--exported-at',
    exportedAt.toISOString(),
    ...(dryRun ? ['--dry-run'] : []),
    filePath,
  ];
  try {
    const { stdout } = await exec(process.execPath, args, {
      cwd: REPO_ROOT,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    });
    const counts = parseIngestSummary(stdout);
    return counts
      ? { ok: true, counts }
      : { ok: false, reason: 'ingest output was not recognized' };
  } catch {
    return { ok: false, reason: 'ingest' };
  }
}

export function uploadSucceeded(stdout) {
  return !/local copy KEPT/i.test(stdout) && /knowledge:fb-upload: 1\/1 uploaded\s*$/.test(stdout);
}

export async function uploadOne(filePath, exec = execFileAsync) {
  const uploadDir = await mkdtemp(join(tmpdir(), 'longlive-fb-upload-'));
  const uploadCopy = join(uploadDir, basename(filePath));
  try {
    await copyFile(filePath, uploadCopy);
    const { stdout } = await exec(
      process.execPath,
      ['--env-file=apps/worker/.env', 'scripts/knowledge-fb-upload.mjs', uploadCopy],
      { cwd: REPO_ROOT, windowsHide: true, maxBuffer: 2 * 1024 * 1024 },
    );
    if (!uploadSucceeded(stdout)) return { ok: false, reason: 'upload confirmation was not exact' };
    await rm(filePath, { force: true });
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'upload command failed; local export was kept',
    };
  } finally {
    await rm(uploadDir, { recursive: true, force: true });
  }
}

export async function readLedger(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return { groups: {} };
  }
}

export async function writeLedger(path, ledger) {
  await mkdir(resolve(path, '..'), { recursive: true });
  const temp = `${path}.tmp`;
  await writeFile(temp, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  await rename(temp, path);
}

export function runSummary(results, actingPageId = null) {
  const counts = { done: 0, 'not-member': 0, unavailable: 0, failed: 0 };
  for (const result of results) {
    if (['uploaded', 'already-done', 'validated', 'no-recent-posts'].includes(result.status))
      counts.done += 1;
    else if (result.status === 'not-member') counts['not-member'] += 1;
    else if (result.status === 'unavailable') counts.unavailable += 1;
    else counts.failed += 1;
  }
  const details = results.map((r) => {
    const count = r.postCount ?? (r.status === 'no-recent-posts' ? 0 : r.harvestedCount);
    const stop = r.stopReason === 'seven-days' ? 'age' : r.stopReason;
    const ingest = r.ingestCounts
      ? `ingest: ${r.ingestCounts.postsKept} kept/${r.ingestCounts.leads} leads/${r.ingestCounts.shopLinks} shop`
      : null;
    const detail = [
      count !== undefined ? `${count} posts` : null,
      stop ? `stop: ${stop}` : null,
      `covered ${formatCoverage(r.coverageAgeMs)}`,
      ingest,
      formatComments(r),
    ]
      .filter(Boolean)
      .join(', ');
    return `- ${r.slug}: ${r.status}${detail ? ` (${detail})` : ''}${r.reason ? ` — ${r.reason}` : ''}`;
  });
  const stunted = results.some((row) => row.status === 'stunted');
  const partial = results.filter((row) => row.partial).map((row) => row.slug);
  return [
    `Facebook export: ${counts.done} done, ${counts['not-member']} not joined, ${counts.unavailable} unavailable, ${counts.failed} failed.`,
    ...(actingPageId ? [`Acting Page i_user: ${actingPageId}.`] : []),
    ...details,
    ...(stunted
      ? [
          'Feed stunted: Facebook is limiting this browser; stopped. Remaining groups were not collected.',
        ]
      : []),
    ...(partial.length ? [`Partial groups: ${partial.join(', ')}.`] : []),
  ].join('\n');
}

// Comment outcome, COUNTS ONLY (comments are private): what was stored and how collection went.
export function formatComments(r) {
  const cc = r.commentCoverage;
  const stored = r.commentCounts;
  if (!cc && !stored) return null;
  const parts = [];
  if (stored)
    parts.push(`${stored.comments} comments + ${stored.replies} replies on ${stored.posts} posts`);
  if (cc && typeof cc.error === 'string') parts.push(`collection error: ${cc.error.slice(0, 120)}`);
  else if (cc)
    parts.push(
      `${cc.processed}/${cc.eligible} posts read, ${cc.failed} failed, ${cc.timedOut} timed out`,
    );
  return `comments: ${parts.join('; ')}`;
}

export function formatCoverage(ageMs) {
  if (!Number.isFinite(ageMs)) return 'unknown';
  if (ageMs >= 86_400_000) return `~${Math.max(1, Math.floor(ageMs / 86_400_000))}d`;
  if (ageMs >= 3_600_000) return `~${Math.max(1, Math.floor(ageMs / 3_600_000))}h`;
  return `~${Math.max(0, Math.floor(ageMs / 60_000))}m`;
}

async function findWeeklyIssue(weekLabel, ghImpl = gh) {
  const title = `FB group export due — week of ${weekLabel}`;
  const { stdout } = await ghImpl([
    'issue',
    'list',
    '--state',
    'open',
    '--search',
    '"FB group export due" in:title',
    '--json',
    'number,title',
    '--limit',
    '100',
  ]);
  return JSON.parse(stdout).find((issue) => issue.title === title)?.number ?? null;
}

async function reportIssue(issue, body, { close = false, ghImpl = gh } = {}) {
  if (!issue) return false;
  await ghImpl(['issue', 'comment', String(issue), '--body', body]);
  if (close) await ghImpl(['issue', 'close', String(issue)]);
  return true;
}

export async function runExport(options = {}) {
  const dryRun = options.dryRun ?? false;
  const now = options.now ?? new Date();
  const root =
    options.root ?? (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb'));
  if (!root) throw new Error('LOCALAPPDATA is unavailable');
  const weekLabel = weekOf(now);
  const outputDir = join(root, 'exports', localDate(now));
  const ledgerPath = join(root, 'ledger', `${weekLabel}.json`);
  const ledger = await (options.readLedger ?? readLedger)(ledgerPath);
  ledger.groups ??= {};
  const persistLedger = () =>
    (options.writeLedger ?? writeLedger)(ledgerPath, {
      week: weekLabel,
      ...(ledger.actingPageId ? { actingPageId: ledger.actingPageId } : {}),
      groups: ledger.groups,
    });
  const completedEntries = dryRun
    ? []
    : Object.entries(ledger.groups).filter(([, row]) =>
        ['uploaded', 'not-member', 'unavailable', 'no-recent-posts'].includes(row.status),
      );
  const complete = new Set(completedEntries.map(([slug]) => slug));
  const pending = (options.groups ?? FB_GROUPS_CHECKLIST).filter(
    (group) => !complete.has(group.slug),
  );
  const collection = pending.length
    ? await (options.collect ?? extensionCollect)({
        groups: pending,
        root,
        outputDir,
        now,
        week: weekLabel,
      })
    : { results: [], actingPageId: ledger.actingPageId ?? null };
  const collected = Array.isArray(collection) ? collection : collection.results;
  const actingPageId = Array.isArray(collection) ? null : collection.actingPageId;
  if (actingPageId) ledger.actingPageId = actingPageId;
  const results = completedEntries.map(([slug, row]) => ({
    slug,
    status: 'already-done',
    postCount: row.postCount,
    stopReason: row.stopReason,
    coverageAgeMs: row.coverageAgeMs,
    partial: row.partial,
  }));

  const commentFields = (item) => ({
    ...(item.commentCoverage ? { commentCoverage: item.commentCoverage } : {}),
    ...(item.commentCounts ? { commentCounts: item.commentCounts } : {}),
  });
  for (const item of collected) {
    const group = pending.find((candidate) => candidate.slug === item.slug);
    if (STOP_STATUSES.includes(item.status)) {
      results.push(item);
      break;
    }
    if (['not-member', 'unavailable'].includes(item.status)) {
      // Codex round 3 #2: a not-member / unavailable verdict is only a skip when the profile that
      // saw it was positively verified. Otherwise it is a failure: never ledgered, never closes
      // the weekly issue. (The receiver already maps these; this is the runner's own gate.)
      if (item.profileVerified !== true) {
        results.push({
          slug: item.slug,
          status: 'failed',
          reason: 'unverified-profile-skip',
          skipStatus: item.status,
        });
        continue;
      }
      results.push(item);
      if (!dryRun) {
        ledger.groups[item.slug] = { status: item.status, at: now.toISOString() };
        await persistLedger();
      }
      continue;
    }
    if (item.status === 'no-recent-posts') {
      results.push(item);
      if (!dryRun) {
        ledger.groups[item.slug] = {
          status: item.status,
          postCount: 0,
          stopReason: item.stopReason,
          coverageAgeMs: item.coverageAgeMs,
          partial: item.partial,
          at: now.toISOString(),
        };
        await persistLedger();
      }
      continue;
    }
    const gate = await (options.gate ?? gateExport)(item, group);
    if (!gate.ok) {
      results.push({
        slug: item.slug,
        status: 'failed',
        reason: gate.reason,
        harvestedCount: item.harvestedCount,
        stopReason: item.stopReason,
        coverageAgeMs: item.coverageAgeMs,
        partial: item.partial,
        ...commentFields(item),
      });
      if (item.status === 'selector-failure') {
        console.error(
          `Repair prompt: quen -p "Inspect Facebook selector drift for ${item.slug} using ${item.diagnostic?.dumpPath}; do not read or request credentials."`,
        );
      }
      continue;
    }
    const ingested = await (options.ingest ?? ingestOne)({
      groupSlug: item.slug,
      filePath: gate.filePath,
      exportedAt: gate.collectedAt ? new Date(gate.collectedAt) : now,
      dryRun,
    });
    if (!ingested.ok) {
      results.push({
        slug: item.slug,
        status: 'failed',
        reason: 'ingest',
        postCount: gate.postCount,
        stopReason: gate.stopReason,
        coverageAgeMs: gate.coverageAgeMs,
        partial: gate.partial,
        ...commentFields(item),
      });
      continue;
    }
    if (dryRun) {
      results.push({
        slug: item.slug,
        status: 'validated',
        postCount: gate.postCount,
        harvestedCount: gate.harvestedCount,
        stopReason: gate.stopReason,
        coverageAgeMs: gate.coverageAgeMs,
        partial: gate.partial,
        ingestCounts: ingested.counts,
        ...commentFields(item),
      });
      continue;
    }
    const uploaded = await (options.upload ?? uploadOne)(gate.filePath);
    const final = uploaded.ok
      ? {
          slug: item.slug,
          status: 'uploaded',
          postCount: gate.postCount,
          harvestedCount: gate.harvestedCount,
          stopReason: gate.stopReason,
          coverageAgeMs: gate.coverageAgeMs,
          partial: gate.partial,
          ingestCounts: ingested.counts,
          ...commentFields(item),
        }
      : { slug: item.slug, status: 'failed', reason: uploaded.reason, ...commentFields(item) };
    results.push(final);
    if (uploaded.ok) {
      ledger.groups[item.slug] = {
        status: 'uploaded',
        postCount: gate.postCount,
        stopReason: gate.stopReason,
        coverageAgeMs: gate.coverageAgeMs,
        partial: gate.partial,
        at: now.toISOString(),
      };
      await persistLedger();
    }
  }
  const globalAbort = results.some((row) => row.status === 'wrong-profile');
  const represented = new Set(results.map((row) => row.slug));
  for (const group of globalAbort ? [] : pending) {
    if (!represented.has(group.slug))
      results.push({
        slug: group.slug,
        status: 'failed',
        reason: 'collection aborted before this group',
      });
  }

  if (dryRun)
    return {
      ok: results.every((row) => !['failed', ...STOP_STATUSES].includes(row.status)),
      results,
      summary: runSummary(results, actingPageId),
    };
  await persistLedger();
  const failed = results.some((row) => ['failed', ...STOP_STATUSES].includes(row.status));
  const issue = await (options.findIssue ?? findWeeklyIssue)(weekLabel);
  const summary = runSummary(results, actingPageId);
  await (options.reportIssue ?? reportIssue)(issue, summary, { close: !failed });
  return { ok: !failed && Boolean(issue), results, summary, issue };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const result = await runExport({ dryRun });
  console.log(result.summary);
  if (!result.ok) return 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'knowledge-fb-export' });
