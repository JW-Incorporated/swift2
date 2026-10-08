#!/usr/bin/env node
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
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
import {
  checkCheckout,
  gitProbe,
  refusalSummary,
  reportToIssue,
  uploadWithRetry,
} from './fb-export-resilience.mjs';
import { CAPTURE_WALL_BUDGET_MS, startReceiver } from './fb-export-receiver.mjs';
import { commentErrorCode, localDate, weekOf } from './fb-export-helpers.mjs';

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
// How the ingest child loads the worker env file; the preflight reuses the exact same arg.
const INGEST_ENV_ARG = '--env-file-if-exists=apps/worker/.env';

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
    INGEST_ENV_ARG,
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
  } catch (error) {
    return { ok: false, reason: failureReason(error, 'ingest') };
  }
}

const ERROR_LINE = /^(\w*Error|Error)\b|:\s*Error\b|^error:/i;

// The child's last stderr line that looks like an error message (else the last non-empty line),
// <=200 chars, secrets redacted, so a failed child reports WHY instead of a stack frame.
export function failureReason(error, fallback) {
  const lines = String(error?.stderr ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const last = lines.findLast((line) => ERROR_LINE.test(line)) ?? lines.at(-1);
  return last ? redactReason(last).slice(0, 200) : fallback;
}

export function redactReason(text) {
  return String(text)
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s/@]*:[^\s/@]*@\S+/gi, '[redacted-url]')
    .replace(/\beyJ[\w-]{10,}(?:\.[\w-]+){0,2}/g, '[redacted]')
    .replace(/\b(?:sb_secret_|sk-|ghp_|github_pat_|xox[a-z]-)[\w-]+/gi, '[redacted]')
    .replace(
      /((?:key|token|secret|password|passwd|authorization|bearer)\w*\s*[=:]\s*)\S+/gi,
      '$1[redacted]',
    )
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]');
}

const REQUIRED_ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
export const ENV_MISSING_SUMMARY =
  'Worker env is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — see HUMAN-ACTIONS #88';
export const ENV_URL_INVALID_SUMMARY =
  'Worker env SUPABASE_URL is not a valid http(s) URL (a bare host is fixed automatically; anything else is not) — fix the env file';

// Loads the worker env file exactly as the ingest child does; prints only true/false per key.
export async function checkWorkerEnv(exec = execFileAsync) {
  const supabaseModule = pathToFileURL(join(REPO_ROOT, 'scripts/lib/supabase.mjs')).href;
  const script = `import(${JSON.stringify(supabaseModule)}).then((m) => console.log(JSON.stringify({
    ...Object.fromEntries(${JSON.stringify(REQUIRED_ENV_KEYS)}.map((k) => [k, Boolean(process.env[k])])),
    SUPABASE_URL_VALID: m.isValidSupabaseUrl(process.env.SUPABASE_URL),
  })))`;
  try {
    const { stdout } = await exec(process.execPath, [INGEST_ENV_ARG, '-e', script], {
      cwd: REPO_ROOT,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    });
    const flags = JSON.parse(String(stdout).trim().split('\n').at(-1));
    if (!REQUIRED_ENV_KEYS.every((k) => flags[k] === true)) return { ok: false };
    return flags.SUPABASE_URL_VALID === true ? { ok: true } : { ok: false, urlInvalid: true };
  } catch {
    return { ok: false };
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
  } catch (error) {
    const detail = failureReason(error, '');
    return {
      ok: false,
      reason: `upload command failed; local export was kept${detail ? ` (${detail})` : ''}`,
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
      // Rows that never harvested (not-member, failed, ...) have no coverage to report.
      count !== undefined || Number.isFinite(r.coverageAgeMs)
        ? `covered ${formatCoverage(r.coverageAgeMs)}`
        : null,
      ingest,
      formatComments(r),
    ]
      .filter(Boolean)
      .join(', ');
    const line = `- ${r.slug}: ${r.status}${detail ? ` (${detail})` : ''}${r.reason ? ` — ${r.reason}` : ''}`;
    return r.commentsFailed
      ? `${line}
  comments: FAILED (${r.commentsFailed}) — posts uploaded; comments need a selector fix (run knowledge:fb-export:capture)`
      : line;
  });
  const stunted = results.some((row) => row.status === 'stunted');
  const tabHidden = results.filter((row) => row.reason === 'tab-hidden').map((row) => row.slug);
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
    ...(tabHidden.length
      ? [
          `Tab hidden (${tabHidden.join(', ')}): the export tab was not visible, so Facebook's feed could not load. The run is unattended Sundays 23:00-04:00: keep the PC on and signed in (locking is fine; don't sign out or shut down), allow wake timers, and don't switch tabs in it.`,
        ]
      : []),
    ...(results.some((row) => row.reason === 'extension-never-connected')
      ? [
          'Extension never connected: Chrome opened the receiver page but the Long Live extension did not run — check chrome://extensions in the export profile (enabled, Developer mode on).',
        ]
      : []),
    ...(results.some((row) => row.reason === 'chrome-profile-open')
      ? [
          'The Long Live Chrome profile was already open — close that Chrome window and rerun (the export must start Chrome itself).',
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
  // Codex round 4 #4: a fixed code only — never free text from comment collection.
  if (cc && typeof cc.error === 'string')
    parts.push(`collection error: ${commentErrorCode(cc.error)}`);
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
  const warnings = [];
  if (options.preflight) {
    const probe = options.preflight === true ? gitProbe : options.preflight;
    const check = await checkCheckout(probe, REPO_ROOT);
    if (!check.ok)
      return { ok: false, results: [], summary: refusalSummary(check.reason), refused: true };
  }
  const root =
    options.root ?? (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb'));
  if (!root) throw new Error('LOCALAPPDATA is unavailable');
  const weekLabel = weekOf(now);
  const outputDir = join(root, 'exports', localDate(now));
  const ledgerPath = join(root, 'ledger', `${weekLabel}.json`);
  const ledger = await (options.readLedger ?? readLedger)(ledgerPath);
  ledger.groups ??= {};
  const persistLedger = async () =>
    (options.writeLedger ?? writeLedger)(ledgerPath, {
      week: weekLabel,
      ...(ledger.actingPageId ? { actingPageId: ledger.actingPageId } : {}),
      groups: ledger.groups,
    });
  const completedEntries = dryRun
    ? []
    : Object.entries(ledger.groups).filter(([, row]) =>
        // 'not-member' is deliberately absent: membership changes (approval, a fresh join), so a
        // later run retries the group and it is only done after a successful export/upload.
        ['uploaded', 'unavailable', 'no-recent-posts'].includes(row.status),
      );
  const complete = new Set(completedEntries.map(([slug]) => slug));
  // Codex round 5 #2: a group whose ingest already ran this week is ledgered 'ingested' before
  // its upload. A retry never ingests it again (duplicate fan_signal rows): it uploads the kept
  // file directly. If that file is gone it is NOT re-collected (a fresh collection is a different
  // dataset from the one ingested): the group fails 'ingested-file-missing' and the issue stays open.
  const fileExists =
    options.fileExists ??
    ((path) =>
      access(path).then(
        () => true,
        () => false,
      ));
  const ingestedRow = (slug) =>
    !dryRun && ledger.groups[slug]?.status === 'ingested' ? ledger.groups[slug] : null;
  const allGroups = (options.groups ?? FB_GROUPS_CHECKLIST).filter(
    (group) => !complete.has(group.slug),
  );
  const uploadOnly = [];
  const pending = [];
  const missingIngested = [];
  for (const group of allGroups) {
    const row = ingestedRow(group.slug);
    if (!row) pending.push(group);
    else if (row.filePath && (await fileExists(row.filePath))) uploadOnly.push(group);
    else missingIngested.push(group);
  }
  if (!dryRun && pending.length) {
    const env = await (options.checkEnv ?? checkWorkerEnv)();
    if (!env.ok) {
      return {
        ok: false,
        results: [],
        summary: env.urlInvalid ? ENV_URL_INVALID_SUMMARY : ENV_MISSING_SUMMARY,
        envMissing: true,
      };
    }
  }
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
    ...(item.commentsFailed ? { commentsFailed: item.commentsFailed } : {}),
  });
  // Upload an already-ingested file; ledger 'uploaded' only on an exact confirmation.
  const uploadAndRecord = async (slug, fields, extra = {}) => {
    const uploaded = await uploadWithRetry(options.upload ?? uploadOne, fields.filePath);
    const summaryFields = {
      postCount: fields.postCount,
      stopReason: fields.stopReason,
      coverageAgeMs: fields.coverageAgeMs,
      partial: fields.partial,
    };
    results.push(
      uploaded.ok
        ? {
            slug,
            status: 'uploaded',
            ...summaryFields,
            harvestedCount: fields.harvestedCount,
            ingestCounts: fields.ingestCounts,
            ...extra,
          }
        : { slug, status: 'failed', reason: uploaded.reason, ...extra },
    );
    if (uploaded.ok) {
      ledger.groups[slug] = { status: 'uploaded', ...summaryFields, at: now.toISOString() };
      await persistLedger();
    } else {
      // Never drop the group: keep it 'ingested' with its kept file so the next run uploads it
      // without re-ingesting (issue #4879). Re-asserted and persisted, not assumed.
      ledger.groups[slug] = { ...fields, status: 'ingested' };
      await persistLedger().catch((error) =>
        warnings.push(`ledger write failed for ${slug}: ${error?.message ?? error}`),
      );
    }
  };
  for (const group of missingIngested)
    results.push({ slug: group.slug, status: 'failed', reason: 'ingested-file-missing' });
  for (const group of uploadOnly) {
    const row = ledger.groups[group.slug];
    await uploadAndRecord(group.slug, row);
  }
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
        // A receiver-side failure keeps its own reason (e.g. tab-hidden); the gate only says
        // 'failed' for it.
        reason: item.status === 'failed' && item.reason ? item.reason : gate.reason,
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
        reason: ingested.reason || 'ingest',
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
    // Ledger the ingest BEFORE uploading, so an upload failure or crash never re-ingests.
    ledger.groups[item.slug] = {
      status: 'ingested',
      postCount: gate.postCount,
      harvestedCount: gate.harvestedCount,
      stopReason: gate.stopReason,
      coverageAgeMs: gate.coverageAgeMs,
      partial: gate.partial,
      ingestCounts: ingested.counts,
      filePath: gate.filePath,
      at: now.toISOString(),
    };
    await persistLedger();
    await uploadAndRecord(item.slug, ledger.groups[item.slug], commentFields(item));
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
  await persistLedger().catch((error) =>
    warnings.push(`ledger write failed: ${error?.message ?? error}`),
  );
  const failed = results.some((row) => ['failed', ...STOP_STATUSES].includes(row.status));
  const baseSummary = runSummary(results, actingPageId);
  const reported = await reportToIssue({
    weekLabel,
    summary: baseSummary,
    failed,
    findIssue: options.findIssue ?? findWeeklyIssue,
    reportIssue: options.reportIssue ?? reportIssue,
  });
  warnings.push(...reported.warnings);
  const summary = warnings.length
    ? `${baseSummary}\nWarnings:\n${warnings.map((w) => `- ${w}`).join('\n')}`
    : baseSummary;
  return {
    ok: !failed && Boolean(reported.issue) && !warnings.length,
    results,
    summary,
    issue: reported.issue,
    warnings,
  };
}

// `--capture` (npm run knowledge:fb-export:capture): the same receiver + plain Chrome flow with
// the job flag capture:true — at most 3 min of scrolling per group, and the extension sends
// privacy-safe DOM skeletons of up to 15 post containers (fb-extension/skeleton.js) instead of
// post html. No ingest, no upload, no ledger, no weekly issue, no comments. The receiver writes
// <root>/debug/<date>/<slug>.skeleton.json (private, never the repo); this prints counts only.
export async function runCapture(options = {}) {
  const now = options.now ?? new Date();
  const root =
    options.root ?? (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb'));
  if (!root) throw new Error('LOCALAPPDATA is unavailable');
  const groups = (options.groups ?? FB_GROUPS_CHECKLIST).map((group) => ({
    ...group,
    wallBudgetMs: CAPTURE_WALL_BUDGET_MS,
  }));
  const outputDir = join(root, 'debug', localDate(now));
  const collect =
    options.collect ??
    ((args) =>
      extensionCollect({
        ...args,
        startReceiver: (receiverArgs) => startReceiver({ ...receiverArgs, capture: true }),
      }));
  const collection = await collect({ groups, root, outputDir, now, week: weekOf(now) });
  const results = Array.isArray(collection) ? collection : collection.results;
  const represented = new Set(results.map((row) => row.slug));
  for (const group of groups)
    if (!represented.has(group.slug))
      results.push({
        slug: group.slug,
        status: 'failed',
        reason: 'collection aborted before this group',
      });
  const captured = results.filter((row) => row.status === 'captured' && row.skeletonCount > 0);
  const lines = results.map((row) => {
    if (row.status === 'captured')
      return (
        `- ${row.slug}: captured ${row.skeletonCount} skeletons` +
        ` (dropped ${row.dropped ?? '?'}, kept ${row.kept ?? '?'}, inspected ${row.inspected ?? '?'};` +
        ` harvested ${row.harvestedCount ?? '?'}, stop: ${row.stopReason ?? '?'})` +
        (row.filePath ? `\n    ${row.filePath}` : '')
      );
    return `- ${row.slug}: ${row.status}${row.reason ? ` — ${row.reason}` : ''}${row.detail ? ` (${row.detail})` : ''}`;
  });
  const summary = [
    `Facebook DOM capture: ${captured.length}/${groups.length} groups captured.`,
    `Skeleton files are private (${outputDir}) — hand them to the PM; nothing was ingested, uploaded or ledgered.`,
    ...lines,
  ].join('\n');
  return { ok: captured.length === groups.length, results, summary, outputDir };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--capture')) {
    const result = await runCapture();
    console.log(result.summary);
    if (!result.ok) return 1;
    return;
  }
  const dryRun = args.includes('--dry-run');
  const result = await runExport({ dryRun, preflight: true });
  console.log(result.summary);
  if (!result.ok) return 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'knowledge-fb-export' });
