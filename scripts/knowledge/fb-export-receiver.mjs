import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { buildHarvestedHtml } from './fb-export-harvest.mjs';
import {
  commentErrorCode,
  exportFileName,
  localDate,
  recentHarvestUnits,
  weekOf,
} from './fb-export-helpers.mjs';
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
// Round 5 (PM decision): optional, but counts when present.
const OPTIONAL_COVERAGE_KEYS = [
  'knownPositiveEligible',
  'unknownEmpty',
  'countUnknown',
  'unitsSent',
];
// A feed this busy always shows some "N comments"; every count unknown there is selector drift.
const COUNT_DRIFT_MIN_UNITS = 10;
const MAX_DETAIL = 200;

// commentCoverage is either the four counts or an explicit {error} from the extension (collector
// missing / threw / returned nothing usable).
function validCommentCoverage(cc) {
  if (cc == null) return true;
  if (!isObj(cc)) return false;
  if ('error' in cc) return typeof cc.error === 'string' && cc.error.length > 0;
  if (!COMMENT_COVERAGE_KEYS.every((k) => isCount(cc[k]))) return false;
  if (!OPTIONAL_COVERAGE_KEYS.every((k) => cc[k] === undefined || isCount(cc[k]))) return false;
  if ((cc.knownPositiveEligible ?? 0) > cc.eligible) return false;
  if (cc.countUnknown !== undefined && cc.unitsSent !== undefined && cc.countUnknown > cc.unitsSent)
    return false;
  return cc.processed + cc.failed + cc.timedOut + (cc.unknownEmpty ?? 0) <= cc.eligible;
}

// Codex round 3 #5: comment collection fails the group whenever a post was eligible and not one
// was processed, whenever the extension reported an explicit error, and whenever a harvested
// group arrives with no coverage at all (nothing may be recorded complete without its comments).
// Partial failures (some processed) stay collected; the counts ride along in the result.
export function commentFailure(body) {
  const cc = body.commentCoverage ?? null;
  if (cc && typeof cc.error === 'string') return 'comments-collection-failed';
  // PM decision (round 5): unknown-count posts that yield nothing are a quiet group, not a failure.
  // Count-selector drift: a busy feed (>= 10 units) where every unit's count is unknown.
  if (
    cc &&
    isCount(cc.unitsSent) &&
    cc.unitsSent >= COUNT_DRIFT_MIN_UNITS &&
    cc.countUnknown === cc.unitsSent
  )
    return 'comments-count-drift';
  // An older coverage without knownPositiveEligible keeps the old rule (every eligible known).
  if (cc && (cc.knownPositiveEligible ?? cc.eligible) > 0 && cc.processed === 0)
    return 'comments-collection-failed';
  if (!cc && body.units.length > 0) return 'comments-coverage-missing';
  return null;
}

export function validateResult(body) {
  if (!isObj(body) || body.v !== 1) return 'schema version';
  if (typeof body.slug !== 'string' || !body.slug) return 'slug';
  if (!EXT_STATUSES.has(body.status)) return 'status';
  if (body.stopReason != null && !STOP_REASONS.has(body.stopReason)) return 'stopReason';
  if (body.coverage != null && !isObj(body.coverage)) return 'coverage';
  if (body.coverage?.profileVerified != null && typeof body.coverage.profileVerified !== 'boolean')
    return 'profileVerified';
  if (body.status === 'collected') {
    if (!Array.isArray(body.units)) return 'units';
    for (const u of body.units) {
      if (!isObj(u) || typeof u.html !== 'string' || !isNum(u.position)) return 'unit';
      if (u.ownTimestamp != null && typeof u.ownTimestamp !== 'string') return 'unit timestamp';
    }
    if (!isObj(body.coverage)) return 'coverage';
    const { sanitizeDropped } = body.coverage;
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
  const runId = randomBytes(8).toString('hex');
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
    // Tab ↔ group binding: the page's group segment must be groupId or one of these vanity
    // names (fb-groups-checklist.mjs `aliases`, optional) or the group is reported redirected.
    aliases: Array.isArray(g.aliases) ? g.aliases.map(String) : [],
  });

  async function toResult(body, group) {
    const { slug } = body;
    switch (body.status) {
      case 'login':
        return { slug, status: 'login-failed' };
      case 'checkpoint':
      case 'captcha':
        return { slug, status: 'checkpoint' };
      case 'not-member':
      case 'unavailable': {
        // Codex round 3 #2: a membership fact from an unverified profile is not a fact. It is
        // recorded failed (the runner never ledgers it as a skip, the weekly issue stays open).
        const profileVerified = body.coverage?.profileVerified === true;
        if (!profileVerified)
          return {
            slug,
            status: 'failed',
            reason: 'unverified-profile-skip',
            skipStatus: body.status,
            profileVerified: false,
          };
        return { slug, status: body.status, profileVerified: true };
      }
      case 'wrong-profile':
      case 'stunted':
        return { slug, status: body.status };
      case 'failed':
        return {
          slug,
          status: 'failed',
          reason: String(body.message ?? body.stopReason ?? 'failed').slice(0, MAX_DETAIL),
        };
      default:
        break;
    }
    const cov = body.coverage;
    const units = body.units;
    const sanitizeDropped = isCount(cov.sanitizeDropped) ? cov.sanitizeDropped : 0;
    // The post/comment boundary could not be established for at least as many recent posts as
    // were kept: the DOM guess is off for this group, so nothing of it is recorded complete.
    if (sanitizeDropped > 0 && sanitizeDropped >= units.length)
      return {
        slug,
        status: 'failed',
        reason: 'sanitize-dropped',
        sanitizeDropped,
        keptCount: units.length,
      };
    // Codex round 4 #4: an error is only ever a known code; any other string → 'unknown', so no
    // free text from comment collection is kept, logged or published.
    const rawCoverage = body.commentCoverage ?? null;
    const commentCoverage =
      rawCoverage && typeof rawCoverage.error === 'string'
        ? { error: commentErrorCode(rawCoverage.error) }
        : rawCoverage;
    const commentReason = commentFailure(body);
    if (commentReason) return { slug, status: 'failed', reason: commentReason, commentCoverage };
    const at = clock();
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
      sanitizeDropped,
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

    // Token-authenticated handshake: the extension validates a /start token here before it
    // replaces any session state (background.js onStart). No side effects.
    if (req.method === 'GET' && url.pathname === '/hello') return send(200, { ok: true, runId });
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
      if (problem) {
        log(`fb-receiver ${current?.slug ?? '?'}: rejected result (${problem})`);
        return send(400, { error: `invalid: ${problem}` });
      }
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
          result.commentCounts = {
            posts: isCount(stored?.posts) ? stored.posts : 0,
            comments: isCount(stored?.comments) ? stored.comments : 0,
            replies: isCount(stored?.replies) ? stored.replies : 0,
          };
          commentLine = ` comment-posts=${result.commentCounts.posts} comments=${result.commentCounts.comments} replies=${result.commentCounts.replies}`;
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
      const ccLine = !cc
        ? ''
        : typeof cc.error === 'string'
          ? ` comment-error=${commentErrorCode(cc.error)}`
          : ` comment-eligible=${cc.eligible} processed=${cc.processed} failed=${cc.failed} timed-out=${cc.timedOut}` +
            (cc.unknownEmpty !== undefined
              ? ` unknown-empty=${cc.unknownEmpty} count-unknown=${cc.countUnknown}/${cc.unitsSent}`
              : '');
      const reason = result.reason ? ` ${result.reason}` : '';
      const dropped =
        result.reason === 'sanitize-dropped'
          ? ` sanitize-dropped=${result.sanitizeDropped} kept=${result.keptCount}`
          : '';
      log(
        `fb-receiver ${group.slug}: ${result.status}${reason}${counts}${dropped}${ccLine}${commentLine}`,
      );
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
