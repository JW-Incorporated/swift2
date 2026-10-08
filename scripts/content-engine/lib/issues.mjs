// Findings → GitHub issues. Idempotent (a fingerprint marker in each body means
// a re-run never opens a duplicate). Every specific, actionable defect gets its
// OWN closeable ticket — P0/P1 always, and P2/P3 for the concrete-defect
// checkers (factual errors, wrong/junk images). Only genuinely bulk-advisory
// checkers (image.host-reputation: "this host is unvetted, eyeball it") roll up
// into a single tracking issue, so 194 non-defects don't drown the tracker.
// The engine only PROPOSES — an issue is a fix-it ticket, never a content change.
import { writeFileSync, unlinkSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { rank, fingerprint, legacyFingerprint } from './finding.mjs';
import { CONFIG } from '../config.mjs';
import { ROOT } from './corpus.mjs';
// Shared gh runner: CLI when present, GitHub REST when it isn't. This module
// used to shell out to `gh` directly, which is why Karen's 2026-07-26 nightly
// completed a clean 1096-item scan and then threw away all 623 filable
// findings with `spawn gh ENOENT`. See scripts/lib/gh.mjs and issue #528.
import { gh } from '../../lib/gh.mjs';

const PFX = CONFIG.output.issueLabelPrefix;

// Rollup vs individual is decided by SOURCE, not checker: deterministic P2/P3
// findings are mechanical/bulk (size-based image.quality, host-reputation,
// claim-risk) and roll up into one tracking issue per checker; agent findings
// are specific verified judgments (a wrong fact, a collage, an off-era photo)
// and each files as its own actionable ticket. P0/P1 always file individually.

const LABELS = [
  [`${PFX}`, '5319e7', 'Content Integrity Engine finding'],
  [`${PFX}:P0`, 'b60205', 'CIE P0 — credibility/safety/legal'],
  [`${PFX}:P1`, 'd93f0b', 'CIE P1 — major integrity gap'],
  [`${PFX}:P2`, 'fbca04', 'CIE P2 — improvement'],
  [`${PFX}:P3`, '0e8a16', 'CIE P3 — polish'],
  [`${PFX}:safety`, '000000', 'CIE safety/red-line finding'],
  [`${PFX}:escalate`, 'b60205', 'CIE — human review required now'],
  [`${PFX}:image`, '1d76db', 'CIE image finding (quality/relevance/safety)'],
  [`${PFX}:fact`, 'c2e0c6', 'CIE factual finding'],
];

/** Readable one-liner from whatever gh/REST/execFile threw. */
export function errText(e) {
  return String(e?.stderr || e?.message || e).replace(/\s+/g, ' ').trim().slice(0, 400);
}

// `--force` means "upsert", so an already-exists is success. Anything else —
// 401/403/network/no-token — means we cannot write to GitHub at all, and the
// caller must NOT go on to pretend it filed tickets.
const ALREADY_EXISTS = /already[_ ]exists|422/i;

/**
 * Upsert the label set. This doubles as the engine's WRITE PREFLIGHT: it is the
 * cheapest authenticated write we make, so `all --create` runs it before the
 * scan to find out in one second — not twenty minutes later, with findings in
 * hand and nowhere to put them — whether this runner can file at all.
 *
 * Throws when EVERY label upsert failed for a non-already-exists reason. One
 * flaky label is tolerated (and returned); nine failures is a broken credential.
 */
export async function ensureLabels() {
  const problems = [];
  for (const [name, color, desc] of LABELS) {
    try {
      await gh(['label', 'create', name, '--color', color, '--description', desc, '--force']);
    } catch (e) {
      const msg = errText(e);
      if (ALREADY_EXISTS.test(msg)) continue;
      problems.push(`${name}: ${msg}`);
    }
  }
  if (problems.length === LABELS.length) {
    throw new Error(
      `GitHub is not writable from this runner — all ${LABELS.length} label upserts failed.\n` +
      `First failure: ${problems[0]}\n` +
      'Nothing can be filed. See docs/agents/runners.md (cloud credential path) and scripts/lib/gh.mjs.',
    );
  }
  return problems;
}

const FP_MARKER = /cie-fp:([0-9a-f]{6,64})/g;

export const FP_CACHE_PATH = join(ROOT, CONFIG.output.findingsDir, 'filed-fingerprints.json');

/**
 * Local first-line fingerprint cache (#487). GitHub's search index can lag a
 * just-created issue by a few seconds — two runs close together (or a quick
 * manual re-run) can miss it via `/search` and file a duplicate. This file
 * remembers every fingerprint this engine has confirmed filed (created this
 * run, or found already on the tracker), read before any GitHub call, so a
 * same-machine re-run never rediscovers the same lag. It is a cache, never
 * authoritative on its own — a miss still falls through to the real GitHub
 * lookups below. `path` is overridable (tests use a temp file).
 */
function loadFpCache(path) {
  try {
    return new Set(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return new Set();
  }
}
function saveFpCache(path, set) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify([...set]), 'utf8');
  } catch { /* best-effort — never block filing on a cache-write failure */ }
}

/**
 * One bulk read of every `cie` issue body → the set of fingerprints already on
 * the tracker.
 *
 * `complete` is the load-bearing bit. When the transport reports it reached the
 * END OF THE DATA, we hold the entire `cie` history, so a miss is proof the
 * finding was never filed — no per-fingerprint lookup needed. That matters in
 * cloud runners, where `existsByFp`'s `/search/issues` call is 403-forbidden
 * (repo-scoped sessions, #1869): without a complete prefetch, every genuinely
 * new finding there would fail its dedupe lookup and go unfiled. When the list
 * came back AT the limit it may be truncated, so `complete` is false and a
 * miss proves nothing — the caller falls through to `existsByFp`, which is
 * what makes the cache incapable of causing a duplicate.
 */
export async function loadKnownFingerprints(limit = 1000) {
  try {
    const res = await gh(['issue', 'list', '--label', PFX, '--state', 'all', '--json', 'number,body', '--limit', String(limit)]);
    const rows = JSON.parse(res.stdout || '[]');
    const fps = new Set();
    for (const r of rows) for (const m of String(r?.body ?? '').matchAll(FP_MARKER)) fps.add(m[1]);
    // gh.mjs now reports whether its page loop reached the end of the data.
    // Prefer that over the row count: on the REST path post-filters drop rows
    // AFTER paging, so a truncated fetch can come back under the limit and
    // still be missing issues (#2034). The count stays as the fallback for a
    // transport that could not say.
    return { fps, issues: rows.length, complete: res.complete ?? rows.length < limit };
  } catch (e) {
    // Not fatal: every candidate simply falls through to its own lookup below.
    return { fps: null, issues: 0, complete: false, error: errText(e) };
  }
}

/**
 * Has this fingerprint already been filed?
 *
 * FAILS CLOSED. This used to `catch { return false }` — "the lookup blew up, so
 * assume it isn't filed" — which is how #1716 and #813 ended up as two open
 * issues carrying the identical fingerprint `e4dc909b86b64e19`. An error is not
 * a "no"; it is an unknown, and the caller must refuse to file on an unknown
 * rather than manufacture a duplicate.
 */
export async function existsByFp(fp) {
  const { stdout } = await gh(['issue', 'list', '--state', 'all', '--search', `cie-fp:${fp} in:body`, '--json', 'number', '--limit', '1']);
  return JSON.parse(stdout || '[]').length > 0;
}

function bodyFor(f, fp) {
  const src = f.sources?.length ? `\n**Sources consulted:** ${f.sources.map((s) => `<${s}>`).join(' · ')}\n` : '';
  return [
    f.escalate ? '> ⚠️ **ESCALATION — human review required before anything else.**\n' : '',
    `**Checker:** \`${f.checker}\` · **Severity:** ${f.severity} · **Confidence:** ${f.confidence.toFixed(2)}${f.confidence < 0.5 ? ' _(review, not a confirmed defect)_' : ''}`,
    '',
    `**Where:** \`${f.itemRef.file ?? '?'}\`${f.itemRef.key ? ` · \`${f.itemRef.key}\`` : ''}${f.itemRef.field ? ` · field \`${f.itemRef.field}\`` : ''} (${f.itemRef.type})`,
    '',
    '**At issue:**',
    '```',
    f.excerpt || '(n/a)',
    '```',
    '',
    `**What the check found:** ${f.evidence}`,
    '',
    `**Suggested fix:** ${f.suggestedFix || '(see evidence)'}`,
    src,
    '',
    '---',
    '_Generated by the Content Integrity Engine (read-only; this is a proposed fix, not an applied change)._',
    `<!-- cie-fp:${fp} -->`,
  ].join('\n');
}

async function createIssue({ title, body, labels }, dryRun) {
  if (dryRun) return { dryRun: true, title };
  // Body goes through a temp file (--body-file), never argv: a rolled-up issue
  // body can exceed the OS command-line length limit (ENAMETOOLONG on Windows).
  const bodyPath = join(tmpdir(), `cie-issue-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  writeFileSync(bodyPath, body, 'utf8');
  try {
    const args = ['issue', 'create', '--title', title, '--body-file', bodyPath];
    for (const l of labels) args.push('--label', l);
    const { stdout } = await gh(args);
    return { url: stdout.trim() };
  } finally {
    try { unlinkSync(bodyPath); } catch { /* best-effort cleanup */ }
  }
}

/**
 * Identity of a checker's rollup tracking issue.
 *
 * It is one issue PER CHECKER, forever — so its fingerprint must be a function
 * of the checker alone. It used to hash the item COUNT (`excerpt: `${fs.length}``),
 * which made "the same standing defect class, one item more than yesterday"
 * look like a brand-new problem: 24 of 36 open `cie` issues were rollups
 * covering only 11 distinct checkers, `image.host-reputation` alone holding 5
 * (#137 · #647 · #815 · #883 · #1723 at 194 · 149 · 156 · 245 · 259 items).
 * The count belongs in the title and the body, never in the identity.
 */
export function rollupFingerprint(checker) {
  return fingerprint({ checker, itemRef: { key: 'rollup' }, excerpt: 'rollup' });
}

/**
 * Create issues from findings. Findings below `minConfidence` are treated as
 * agent-routing signals (verify-this), not filable defects, and are skipped —
 * this is what keeps the tracker actionable instead of drowning in low-signal
 * "verify" flags that the agent factual pass will adjudicate anyway.
 *
 * Returns `{ created, skipped, unfiled, dryRun }`. **`unfiled` is the number of
 * findings this run detected and did NOT get onto the tracker** — a dedupe
 * lookup that errored, or a create that failed. It is never silently zero, and
 * the caller is required to treat a non-zero value as a failed run: a green run
 * that discarded 597 findings (2026-08-09) and one that discarded 623
 * (2026-07-26) are the two incidents this return value exists to make loud.
 */
export async function createIssues(findings, { dryRun = true, limit = Infinity, minConfidence = 0.5, log = () => {}, fpCachePath = FP_CACHE_PATH } = {}) {
  const ranked = rank(findings.filter((f) => f.confidence >= minConfidence || f.escalate));
  const created = [];
  const skipped = [];
  const unfiled = []; // { title, fp, reason }
  let count = 0;

  // Local first-line cache (#487) — checked before any GitHub call, on every
  // run including dry runs (a plain local-disk read, not network).
  const fpCache = loadFpCache(fpCachePath);

  // Fingerprint cache (see loadKnownFingerprints): a hit is always proof of
  // "already filed"; a miss is proof of "never filed" only when the prefetch
  // was COMPLETE — otherwise it falls through to the per-finding search, so a
  // truncated list cannot cause a duplicate. Skipped entirely on a dry run —
  // no network, no surprises.
  let known = null;
  let knownComplete = false;
  if (!dryRun) {
    const pre = await loadKnownFingerprints();
    known = pre.fps;
    knownComplete = pre.complete;
    if (pre.error) log(`  (fingerprint prefetch unavailable: ${pre.error} — falling back to per-finding lookups)`);
    else log(`  (${pre.issues} existing ${PFX} issues scanned, ${known.size} fingerprints known${knownComplete ? ', complete' : ', possibly truncated'})`);
  }

  /**
   * true / false / throws. A throw means "unknown", never "not filed". Checks
   * both the current-scheme fingerprint and the pre-#487 `legacyFp`, so the
   * 9+ issues already filed under the old scheme are still recognized —
   * without this, they'd re-file once under the new scheme.
   */
  const alreadyFiled = async (fp, legacyFp) => {
    if (fpCache.has(fp) || fpCache.has(legacyFp)) return true;
    if (known?.has(fp) || known?.has(legacyFp)) return true;
    if (knownComplete) return false; // authoritative miss — no /search call (403 in cloud)
    if (await existsByFp(fp)) return true;
    return legacyFp !== fp && existsByFp(legacyFp);
  };

  /** Shared file-one-thing path: dedupe (fail closed) → create (record failure). */
  async function file(fp, legacyFp, title, body, labels, extra) {
    if (!dryRun) {
      let exists;
      try {
        exists = await alreadyFiled(fp, legacyFp);
      } catch (e) {
        unfiled.push({ title, fp, reason: `dedupe lookup failed: ${errText(e)}` });
        return;
      }
      if (exists) { skipped.push(fp); fpCache.add(fp); return; }
    }
    try {
      const r = await createIssue({ title, body, labels }, dryRun);
      created.push({ ...r, title, ...extra });
      count++;
      if (!dryRun) fpCache.add(fp);
    } catch (e) {
      unfiled.push({ title, fp, reason: `issue create failed: ${errText(e)}` });
    }
  }

  // 1) Individual issues — all P0/P1, plus every agent-sourced P2/P3 (a specific
    //  verified defect). One closeable ticket each.
  const individual = ranked.filter((f) =>
    f.severity === 'P0' || f.severity === 'P1' || f.source !== 'deterministic');
  for (const f of individual) {
    if (count >= limit) break;
    const fp = fingerprint(f);
    const legacyFp = legacyFingerprint(f);
    const labels = [PFX, `${PFX}:${f.severity}`];
    if (f.checker.startsWith('safety.') && (f.severity === 'P0' || f.escalate)) labels.push(`${PFX}:safety`);
    if (f.checker.startsWith('image.')) labels.push(`${PFX}:image`);
    if (f.checker.startsWith('fact.')) labels.push(`${PFX}:fact`);
    if (f.escalate) labels.push(`${PFX}:escalate`);
    await file(fp, legacyFp, `[CIE ${f.severity}] ${f.title}`, bodyFor(f, fp), labels, { severity: f.severity });
  }

  // 2) Rollups — deterministic P2/P3 only: one tracking issue per checker.
  const lower = ranked.filter((f) =>
    (f.severity === 'P2' || f.severity === 'P3') && f.source === 'deterministic');
  const byChecker = new Map();
  for (const f of lower) {
    if (!byChecker.has(f.checker)) byChecker.set(f.checker, []);
    byChecker.get(f.checker).push(f);
  }
  for (const [checker, fs] of byChecker) {
    if (count >= limit) break;
    const fp = rollupFingerprint(checker);
    const worst = fs.some((f) => f.severity === 'P2') ? 'P2' : 'P3';
    const title = `[CIE ${worst}] ${checker}: ${fs.length} items to review`;
    // GitHub caps issue bodies at 65536 chars. Build a compact one-line-per-item
    // checklist and stop before the cap — the full per-item detail lives in the
    // committed run report + merged.json, so the issue is a pointer, not a dump.
    const BODY_CAP = 60000;
    const header = [
      `**Checker:** \`${checker}\` · ${fs.length} instances (rolled up to keep the tracker clean).`,
      '',
      '_Full per-item detail (evidence, suggested fix, sources) is in the committed run report under `docs/audits/engine/`._',
      '',
    ];
    const footer = ['', '---', '_Generated by the Content Integrity Engine (read-only)._', `<!-- cie-fp:${fp} -->`];
    const budget = BODY_CAP - header.join('\n').length - footer.join('\n').length - 40;
    const itemLines = [];
    let used = 0;
    let shown = 0;
    for (const f of fs) {
      const line = `- [ ] \`${f.itemRef.file ?? '?'}\`${f.itemRef.key ? ` · ${f.itemRef.key}` : ''} — ${f.title}`;
      if (used + line.length + 1 > budget) break;
      itemLines.push(line);
      used += line.length + 1;
      shown++;
    }
    if (shown < fs.length) itemLines.push(`\n…and ${fs.length - shown} more (see the run report for the full list).`);
    // Rollup fingerprints hash a literal placeholder excerpt ('rollup'), which
    // survives the #487 excerpt-normalization unchanged, so the legacy and
    // current schemes always agree here — no separate legacy lookup needed.
    await file(fp, fp, title, [...header, ...itemLines, ...footer].join('\n'), [PFX, `${PFX}:${worst}`], { severity: worst, rollup: fs.length });
  }

  if (!dryRun) saveFpCache(fpCachePath, fpCache);
  return { created, skipped: skipped.length, unfiled, dryRun };
}
