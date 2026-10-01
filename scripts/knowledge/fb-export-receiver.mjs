import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { buildHarvestedHtml } from './fb-export-harvest.mjs';
import { exportFileName, localDate, recentHarvestUnits, weekOf } from './fb-export-helpers.mjs';
import { FB_ACTING_PAGE, FB_READ_AS } from './fb-groups-checklist.mjs';

// Local receiver for the FB-export Chrome extension (PLAN.md schema v1). Binds 127.0.0.1 only,
// every API request needs X-LLFB-Token. Never logs bodies, html or comment text.

const MAX_BODY = 64 * 1024 * 1024;
const DEFAULT_WALL_BUDGET_MS = 20 * 60_000;
const STOP_STATUSES = new Set(['login', 'checkpoint', 'captcha', 'wrong-profile', 'stunted']);
const EXT_STATUSES = new Set([
  'collected',
  'not-member',
  'unavailable',
  'login',
  'checkpoint',
  'captcha',
  'wrong-profile',
  'stunted',
  'failed',
]);
const STOP_REASONS = new Set([
  'seven-days',
  'feed-end',
  'scroll-cap',
  'wall-budget',
  'stunted-feed',
]);
const START_PAGE =
  '<!doctype html><html><head><meta charset="utf-8"><title>Long Live FB export</title></head>' +
  '<body><p>Long Live Facebook export in progress. Leave this window open.</p></body></html>\n';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isCount = (v) => Number.isInteger(v) && v >= 0;
const COMMENT_COVERAGE_KEYS = ['eligible', 'processed', 'failed', 'timedOut'];
// Comment collection is "systematically broken" (Codex round 2 #6) when at least this many posts
// were eligible and not one was processed: the group fails (issue stays open). Anything less is a
// partial failure: the group is still collected and the counts ride along in the result.
const COMMENT_SYSTEMATIC_MIN = 3;

function validCommentCoverage(cc) {
  if (cc == null) return true;
  if (!isObj(cc) || !COMMENT_COVERAGE_KEYS.every((k) => isCount(cc[k]))) return false;
  return cc.processed + cc.failed + cc.timedOut <= cc.eligible;
}

export function validateResult(body) {
  if (!isObj(body) || body.v !== 1) return 'schema version';
  if (typeof body.slug !== 'string' || !body.slug) return 'slug';
  if (!EXT_STATUSES.has(body.status)) return 'status';
  if (body.stopReason != null && !STOP_REASONS.has(body.stopReason)) return 'stopReason';
  if (body.status === 'collected') {
    if (!Array.isArray(body.units)) return 'units';
    for (const u of body.units) {
      if (!isObj(u) || typeof u.html !== 'string' || !isNum(u.position)) return 'unit';
      if (u.ownTimestamp != null && typeof u.ownTimestamp !== 'string') return 'unit timestamp';
    }
    if (!isObj(body.coverage)) return 'coverage';
    const { profileVerified, sanitizeDropped } = body.coverage;
    if (profileVerified != null && typeof profileVerified !== 'boolean') return 'profileVerified';
    if (sanitizeDropped != null && !isCount(sanitizeDropped)) return 'sanitizeDropped';
    if (body.comments != null && !Array.isArray(body.comments)) return 'comments';
    if (!validCommentCoverage(body.commentCoverage)) return 'commentCoverage';
  }
  return null;
}

function tokensEqual(expected, given) {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readJson(req) {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_BODY) {
    req.resume(); // discard the body so the client can read the 413 instead of a reset
    throw new HttpError(413, 'too large');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) {
      req.resume();
      throw new HttpError(413, 'too large');
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid json');
  }
}

const MAX_STORE_ATTEMPTS = 3;

export async function startReceiver({
  groups,
  token,
  root,
  outputDir,
  now = () => new Date(),
  week,
  storeComments,
  stallMs = 300_000,
  host = '127.0.0.1',
  log = (line) => console.log(line),
  readAs = FB_READ_AS,
  actingPage = FB_ACTING_PAGE,
} = {}) {
  if (!token || typeof token !== 'string') throw new Error('token required');
  const clock = () => (typeof now === 'function' ? now() : now);
  const store =
    storeComments ?? (async (args) => (await import('./fb-comments.mjs')).storeComments(args));

  const results = [];
  const storeFailures = new Map();
  let cursor = 0;
  let current = null; // group handed out, awaiting its result
  let stopped = false;
  let finished = false;
  let closed = false;
  let watchdog = null;
  let resolveDone;
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const ordered = () => groups.map((g) => results.find((r) => r.slug === g.slug)).filter(Boolean);
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    resolveDone(ordered());
  };
  const armWatchdog = () => {
    clearTimeout(watchdog);
    if (finished) return;
    watchdog = setTimeout(() => {
      if (current) {
        results.push({ slug: current.slug, status: 'failed', reason: 'stalled' });
        log(`fb-receiver ${current.slug}: stalled`);
        current = null;
      }
      stopped = true;
      finish();
    }, stallMs);
    watchdog.unref?.();
  };

  const nextPayload = (g) => ({
    done: false,
    slug: g.slug,
    label: g.label,
    groupId: g.groupId,
    url: `https://www.facebook.com/groups/${encodeURIComponent(g.groupId)}?sorting_setting=CHRONOLOGICAL`,
    wallBudgetMs: g.wallBudgetMs ?? DEFAULT_WALL_BUDGET_MS,
    maxScrolls: 250,
    comments: { topN: 20, maxPerPost: 50, pacingMs: [2000, 5000] },
    // For the extension's positive profile check (harvest-core profileCheck).
    readAs,
    actingPage: { ...actingPage },
  });

  async function toResult(body, group) {
    const { slug } = body;
    switch (body.status) {
      case 'login':
        return { slug, status: 'login-failed' };
      case 'checkpoint':
      case 'captcha':
        return { slug, status: 'checkpoint' };
      case 'wrong-profile':
      case 'not-member':
      case 'unavailable':
      case 'stunted':
        return { slug, status: body.status };
      case 'failed':
        return {
          slug,
          status: 'failed',
          reason: String(body.message ?? body.stopReason ?? 'failed').slice(0, 200),
        };
      default:
        break;
    }
    const cov = body.coverage;
    const commentCoverage = body.commentCoverage ?? null;
    if (
      commentCoverage &&
      commentCoverage.eligible >= COMMENT_SYSTEMATIC_MIN &&
      commentCoverage.processed === 0
    ) {
      return { slug, status: 'failed', reason: 'comments-collection-failed', commentCoverage };
    }
    const at = clock();
    const units = body.units;
    const recent = recentHarvestUnits(units, at);
    const base = {
      ageRuleMet: Boolean(cov.ageRuleMet),
      stopReason: body.stopReason ?? null,
      harvestedCount: isNum(cov.harvestedCount) ? cov.harvestedCount : units.length,
      recentCount: recent.length,
      slotCount: isNum(cov.slotCount) ? cov.slotCount : 0,
      coverageAgeMs: isNum(cov.coverageAgeMs) ? cov.coverageAgeMs : null,
      partial: Boolean(cov.partial),
      collectedAt: body.collectedAt ?? at.toISOString(),
      // null = the extension did not say (older build): unknown, never "verified".
      profileVerified: typeof cov.profileVerified === 'boolean' ? cov.profileVerified : null,
      sanitizeDropped: isCount(cov.sanitizeDropped) ? cov.sanitizeDropped : 0,
      commentCoverage,
    };
    if (units.length === 0 || recent.length === 0) {
      return { slug, status: 'no-recent-posts', ...base };
    }
    const filePath = join(outputDir, exportFileName(slug, localDate(at)));
    await mkdir(outputDir, { recursive: true });
    await writeFile(filePath, buildHarvestedHtml(`${group.label} Facebook export`, recent), 'utf8');
    return { slug, status: 'collected', filePath, ...base };
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const send = (status, payload) => {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(payload));
    };
    if (req.method === 'GET' && url.pathname === '/start') {
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(START_PAGE);
      return;
    }
    if (!tokensEqual(token, req.headers['x-llfb-token'])) return send(403, { error: 'forbidden' });

    if (req.method === 'GET' && url.pathname === '/next') {
      armWatchdog();
      if (current) return send(200, nextPayload(current)); // reload mid-group: same group again
      if (stopped || finished || cursor >= groups.length) return send(200, { done: true });
      current = groups[cursor++];
      return send(200, nextPayload(current));
    }
    if (req.method === 'POST' && url.pathname === '/heartbeat') {
      await readJson(req);
      armWatchdog();
      return send(200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/result') {
      const body = await readJson(req);
      const problem = validateResult(body);
      if (problem) return send(400, { error: `invalid: ${problem}` });
      if (!current || current.slug !== body.slug || results.some((r) => r.slug === body.slug)) {
        return send(409, { error: 'unexpected slug' });
      }
      const group = current;
      armWatchdog();
      let result;
      try {
        result = await toResult(body, group);
      } catch {
        result = { slug: group.slug, status: 'failed', reason: 'receiver-write' };
      }
      let commentLine = '';
      if (result.status === 'collected' && Array.isArray(body.comments) && body.comments.length) {
        try {
          const stored = await store({
            root,
            week: week ?? weekOf(clock()),
            slug: group.slug,
            comments: body.comments,
          });
          commentLine = ` comment-posts=${stored?.posts ?? 0} comments=${stored?.comments ?? 0} replies=${stored?.replies ?? 0}`;
        } catch {
          const attempts = (storeFailures.get(group.slug) ?? 0) + 1;
          storeFailures.set(group.slug, attempts);
          if (attempts < MAX_STORE_ATTEMPTS) {
            log(`fb-receiver ${group.slug}: comments=store-failed attempt=${attempts} retry`);
            return send(503, { error: 'comments store failed', retry: true });
          }
          result = { slug: group.slug, status: 'failed', reason: 'comments-store-failed' };
          commentLine = ' comments=store-failed';
        }
      }
      results.push(result);
      current = null;
      if (STOP_STATUSES.has(body.status)) stopped = true;
      const counts =
        result.status === 'collected'
          ? ` harvested=${result.harvestedCount} recent=${result.recentCount} slots=${result.slotCount}` +
            ` profile=${result.profileVerified === true ? 'verified' : 'unverified'}` +
            ` sanitize-dropped=${result.sanitizeDropped}`
          : '';
      const cc = result.commentCoverage;
      const ccLine = cc
        ? ` comment-eligible=${cc.eligible} processed=${cc.processed} failed=${cc.failed} timed-out=${cc.timedOut}`
        : '';
      log(`fb-receiver ${group.slug}: ${result.status}${counts}${ccLine}${commentLine}`);
      return send(200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/finished') {
      await readJson(req);
      send(200, { ok: true });
      finish();
      return;
    }
    return send(404, { error: 'not found' });
  }

  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      const status = error instanceof HttpError ? error.status : 500;
      if (!res.headersSent) {
        res.writeHead(status, { 'content-type': 'application/json' });
      }
      res.end(JSON.stringify({ error: status === 500 ? 'internal' : error.message }));
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolve);
  });
  const { port } = server.address();
  armWatchdog();

  return {
    port,
    url: `http://127.0.0.1:${port}/start#${token}`,
    done,
    // Results gathered so far, in group order; a group handed out but not reported is failed.
    partialResults() {
      const out = ordered();
      if (current && !out.some((r) => r.slug === current.slug)) {
        out.push({ slug: current.slug, status: 'failed', reason: 'run-wall-budget' });
      }
      return groups.map((g) => out.find((r) => r.slug === g.slug)).filter(Boolean);
    },
    close() {
      if (closed) return Promise.resolve();
      closed = true;
      clearTimeout(watchdog);
      finish();
      return new Promise((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections?.();
      });
    },
  };
}
