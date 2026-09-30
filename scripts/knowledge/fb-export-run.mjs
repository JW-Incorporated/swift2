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
import { collectAll } from './fb-export-collect.mjs';
import { localDate, weekOf } from './fb-export-helpers.mjs';

const execFileAsync = promisify(execFile);
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

export async function gateExport(
  result,
  group,
  { read = readFile, copy = copyFile, remove = rm } = {},
) {
  if (result.harvestedCount < 5 && result.slotCount > 20)
    return { ok: false, reason: 'low harvest' };
  if (result.status !== 'collected') return { ok: false, reason: result.status };
  if (!result.ageRuleMet) return { ok: false, reason: 'seven-day age rule not met' };
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
      filePath: result.filePath,
    };
  } catch (error) {
    return { ok: false, reason: `parser gate failed: ${error.message}` };
  } finally {
    await remove(copyPath, { force: true }).catch(() => undefined);
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
    if (['uploaded', 'already-done', 'validated'].includes(result.status)) counts.done += 1;
    else if (result.status === 'not-member') counts['not-member'] += 1;
    else if (result.status === 'unavailable') counts.unavailable += 1;
    else counts.failed += 1;
  }
  const details = results.map((r) => {
    const count = r.harvestedCount ?? r.postCount;
    const stop = r.stopReason === 'seven-days' ? 'age' : r.stopReason;
    const detail = [count !== undefined ? `${count} posts` : null, stop ? `stop: ${stop}` : null]
      .filter(Boolean)
      .join(', ');
    return `- ${r.slug}: ${r.status}${detail ? ` (${detail})` : ''}${r.reason ? ` — ${r.reason}` : ''}`;
  });
  return [
    `Facebook export: ${counts.done} done, ${counts['not-member']} not joined, ${counts.unavailable} unavailable, ${counts.failed} failed.`,
    ...(actingPageId ? [`Acting Page i_user: ${actingPageId}.`] : []),
    ...details,
  ].join('\n');
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
  const probeProfile = options.probeProfile ?? false;
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
  const complete = dryRun
    ? new Set()
    : new Set(
        Object.entries(ledger.groups)
          .filter(([, row]) => ['uploaded', 'not-member', 'unavailable'].includes(row.status))
          .map(([slug]) => slug),
      );
  const pending = (options.groups ?? FB_GROUPS_CHECKLIST).filter(
    (group) => !complete.has(group.slug),
  );
  const collection = pending.length || probeProfile
    ? await (options.collect ?? collectAll)({
        groups: probeProfile ? [] : pending,
        outputDir,
        interactiveSetup: dryRun,
        probeProfile,
      })
    : { results: [], actingPageId: ledger.actingPageId ?? null };
  const collected = Array.isArray(collection) ? collection : collection.results;
  const actingPageId = Array.isArray(collection) ? null : collection.actingPageId;
  if (actingPageId) ledger.actingPageId = actingPageId;
  if (probeProfile) {
    const results = collected.length ? collected : [{ slug: 'profile', status: 'validated' }];
    return {
      ok: collected.length === 0,
      results,
      summary: runSummary(results, actingPageId),
    };
  }
  const results = [...complete].map((slug) => ({ slug, status: 'already-done' }));

  for (const item of collected) {
    const group = pending.find((candidate) => candidate.slug === item.slug);
    if (['login-failed', 'checkpoint', 'wrong-profile'].includes(item.status)) {
      results.push(item);
      break;
    }
    if (['not-member', 'unavailable'].includes(item.status)) {
      results.push(item);
      if (!dryRun) {
        ledger.groups[item.slug] = { status: item.status, at: now.toISOString() };
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
      });
      if (item.status === 'selector-failure') {
        console.error(
          `Repair prompt: quen -p "Inspect Facebook selector drift for ${item.slug} using ${item.diagnostic?.dumpPath}; do not read or request credentials."`,
        );
      }
      continue;
    }
    if (dryRun) {
      results.push({
        slug: item.slug,
        status: 'validated',
        postCount: gate.postCount,
        harvestedCount: gate.harvestedCount,
        stopReason: gate.stopReason,
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
        }
      : { slug: item.slug, status: 'failed', reason: uploaded.reason };
    results.push(final);
    if (uploaded.ok) {
      ledger.groups[item.slug] = {
        status: 'uploaded',
        postCount: gate.postCount,
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
      ok: results.every(
        (row) => !['failed', 'login-failed', 'checkpoint', 'wrong-profile'].includes(row.status),
      ),
      results,
      summary: runSummary(results, actingPageId),
    };
  await persistLedger();
  const failed = results.some((row) =>
    ['failed', 'login-failed', 'checkpoint', 'wrong-profile'].includes(row.status),
  );
  const issue = await (options.findIssue ?? findWeeklyIssue)(weekLabel);
  const summary = runSummary(results, actingPageId);
  await (options.reportIssue ?? reportIssue)(issue, summary, { close: !failed });
  return { ok: !failed && Boolean(issue), results, summary, issue };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const probeProfile = args.includes('--probe-profile');
  if (probeProfile && !dryRun)
    throw new Error('--probe-profile requires --dry-run so it cannot collect or upload groups');
  const result = await runExport({ dryRun, probeProfile });
  console.log(result.summary);
  if (!result.ok) return 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'knowledge-fb-export' });
