#!/usr/bin/env node
// tree-approve-gate — the decision logic behind .github/workflows/social-tree-
// approve.yml, kept in a node script (not bash) so it is unit-tested. It answers
// ONE question: may Tree's autonomous approval stamp this PR? Everything here is
// read-only: git plumbing against objects fetched by the workflow (never a PR
// checkout) plus JSON metadata the workflow passes in.
//
// Identities. Tree's gateway authenticates to GitHub as `sffan15-sys` (the owner's
// login — verified on VM 100, 2026-10-09; Marjorie's gateway uses the SAME login,
// so a login allowlist cannot tell Tree from Marjorie, only from everyone else).
// Tree's GitHub-routine drafts are authored by the Claude app (`claude[bot]`,
// commits show as `github-actions[bot]`). EXCLUDED on purpose: the co-owner
// (`wjduvall-cmd`), `dependabot[bot]`, every other app, and any commit whose author
// GitHub cannot resolve to an account. This is a committed constant — repo
// variables are human-settable and so are not a trust root.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cardSidecarPath } from './lib/draft-taste.mjs';
import { isTreeDraftRef } from './lib/tree-draft-ref.mjs';

export const TREE_DISPATCHERS = ['sffan15-sys'];
export const TREE_PR_AUTHORS = ['claude[bot]', 'sffan15-sys'];
export const TREE_COMMIT_AUTHORS = ['claude[bot]', 'github-actions[bot]', 'sffan15-sys'];

export const MAX_MEDIA_BYTES = 1572864; // 1.5MB — auto-merge-content.yml's image cap
export const MAX_QUEUE_BYTES = 256 * 1024;
export const MAX_SIDECAR_BYTES = 16 * 1024;
const MEDIA_PREFIX = 'apps/web/public';
const QUEUE_RE = /^social\/queue\/[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const MEDIA_RE = /^apps\/web\/public\/social\/[A-Za-z0-9._/-]+\.(png|jpg|jpeg)$/;
const SIDECAR_RE = /^apps\/web\/public\/social\/[A-Za-z0-9._/-]+\.json$/;
const REGULAR_MODES = new Set(['100644', '100755']);

/** Digits only, no leading zeros kept ("007" -> "7"); throws on anything else. */
export function normalizePrNumber(input) {
  const s = String(input ?? '');
  if (!/^[0-9]{1,8}$/.test(s) || Number(s) <= 0) throw new Error(`"${s}" is not a PR number (digits only)`);
  return String(Number(s));
}

export { isTreeDraftRef };

/** `git diff --name-status -z` output -> [{status, path}] (no renames: --no-renames). */
export function parseNameStatusZ(out) {
  const tokens = String(out).split('\0');
  if (tokens.at(-1) === '') tokens.pop();
  if (tokens.length % 2 !== 0) throw new Error('unparseable name-status output');
  const changes = [];
  for (let i = 0; i < tokens.length; i += 2) changes.push({ status: tokens[i], path: tokens[i + 1] });
  return changes;
}

/** The public-file paths a draft's `media` names. */
export function referencedMedia(item) {
  const list = Array.isArray(item?.media) ? item.media : [];
  return list.filter((m) => typeof m === 'string' && m.startsWith('/social/') && !m.includes('..')).map((m) => `${MEDIA_PREFIX}${m}`);
}

/**
 * @param {{ actor: string, pr: { state: string, base: string, headRef: string, headSha: string, author: string, cross: boolean },
 *   commitAuthors: Array<string|null>, changes: Array<{ status: string, path: string, mode?: string, size?: number }>,
 *   drafts: Record<string, object|null> }} input
 * @returns {{ ok: boolean, problems: string[], queueFiles: string[], mediaFiles: string[], sidecarFiles: string[] }}
 */
export function evaluateGate({ actor, pr, commitAuthors, changes, drafts }) {
  const problems = [];
  const queueFiles = [];
  const mediaFiles = [];
  const sidecarFiles = [];
  const fail = (msg) => problems.push(msg);

  if (!TREE_DISPATCHERS.includes(actor)) fail(`dispatcher "${actor}" is not a Tree identity`);
  if (pr?.state !== 'open') fail(`PR is ${pr?.state}, not open`);
  if (pr?.base !== 'main') fail(`PR targets "${pr?.base}", not main`);
  if (pr?.cross !== false) fail('PR is from a fork');
  if (!isTreeDraftRef(pr?.headRef)) fail(`head ref "${pr?.headRef}" is not tree/draft/*`);
  if (!/^[0-9a-f]{40}$/.test(pr?.headSha ?? '')) fail('head sha is not a full commit id');
  if (!TREE_PR_AUTHORS.includes(pr?.author)) fail(`PR author "${pr?.author}" is not a Tree identity`);
  if (!Array.isArray(commitAuthors) || commitAuthors.length === 0) fail('no commits to attribute');
  for (const a of commitAuthors ?? []) {
    if (!TREE_COMMIT_AUTHORS.includes(a)) fail(`commit author "${a ?? 'unresolved'}" is not a Tree identity`);
  }

  if (!Array.isArray(changes) || changes.length === 0) fail('PR changes no files');

  // First pass: classify each path.
  const paths = new Set();
  for (const c of changes ?? []) {
    const p = c.path;
    if (typeof p !== 'string' || p.includes('..') || p.startsWith('/') || /[\0-\x1f\\]/.test(p)) {
      fail(`suspicious path ${JSON.stringify(p)}`);
      continue;
    }
    paths.add(p);
    if (c.status !== 'A' && c.status !== 'M') {
      fail(`${p}: status ${c.status} — only added/modified files may ride a tree-auto approval`);
      continue;
    }
    if (!REGULAR_MODES.has(c.mode ?? '')) {
      fail(`${p}: git mode ${c.mode ?? 'unknown'} is not a regular file blob (symlinks/submodules/trees refused)`);
      continue;
    }
    const size = Number.isFinite(c.size) ? c.size : Infinity;
    if (QUEUE_RE.test(p)) {
      if (size > MAX_QUEUE_BYTES) fail(`${p}: ${size} bytes is over the queue-file cap`);
      queueFiles.push(p);
    } else if (MEDIA_RE.test(p)) {
      if (size > MAX_MEDIA_BYTES) fail(`${p}: ${size} bytes is over the ${MAX_MEDIA_BYTES}-byte (1.5MB) cap`);
      mediaFiles.push(p);
    } else if (SIDECAR_RE.test(p)) {
      if (size > MAX_SIDECAR_BYTES) fail(`${p}: ${size} bytes is over the sidecar cap`);
      sidecarFiles.push(p);
    } else {
      fail(`${p}: outside social/queue/*.json and .png/.jpg/.jpeg under apps/web/public/social/ — refusing`);
    }
  }
  if (queueFiles.length === 0) fail('PR touches no social/queue/*.json draft');

  // Second pass: every media file must be referenced by a draft being stamped.
  const referenced = new Set();
  for (const q of queueFiles) {
    const item = drafts?.[q];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(`${q}: not a readable JSON object`);
      continue;
    }
    for (const m of referencedMedia(item)) referenced.add(m);
  }
  for (const m of mediaFiles) {
    if (!referenced.has(m)) fail(`${m}: not referenced by any draft in this PR — unreferenced media is refused`);
  }
  const allowedSidecars = new Set([...referenced].filter((m) => m.endsWith('.png')).map(cardSidecarPath));
  for (const s of sidecarFiles) {
    if (!allowedSidecars.has(s)) fail(`${s}: a .json under apps/web/public/social/ is only allowed as the sidecar of a referenced card .png`);
  }

  return { ok: problems.length === 0, problems, queueFiles, mediaFiles, sidecarFiles };
}

// ── git plumbing ───────────────────────────────────────────────────────────

const git = (args, opts = {}) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });

/** [{status, path, mode, size}] for `base..head`, computed locally from fetched objects. */
export function collectChanges(baseSha, headSha, { cwd } = {}) {
  const changes = parseNameStatusZ(git(['diff', '--no-renames', '--name-status', '-z', baseSha, headSha], { cwd }));
  return changes.map((c) => {
    if (c.status === 'D') return { ...c, mode: '', size: 0 };
    const line = git(['ls-tree', '-l', '-z', headSha, '--', c.path], { cwd }).split('\0')[0];
    // "<mode> <type> <sha> <size>\t<path>"
    const m = /^(\d{6}) (\w+) ([0-9a-f]+)\s+(\S+)\t/.exec(line);
    if (!m) return { ...c, mode: 'missing', size: Infinity };
    const mode = m[2] === 'blob' ? m[1] : `${m[1]}-${m[2]}`;
    return { ...c, mode, size: m[4] === '-' ? Infinity : Number(m[4]) };
  });
}

export function readDrafts(headSha, queuePaths, { cwd } = {}) {
  const drafts = {};
  for (const p of queuePaths) {
    try {
      drafts[p] = JSON.parse(git(['show', `${headSha}:${p}`], { cwd }));
    } catch {
      drafts[p] = null;
    }
  }
  return drafts;
}

/** Full gate against fetched objects. `meta` = { pr, commitAuthors } from the API. */
export function runGate({ actor, meta, baseSha, headSha, cwd }) {
  const changes = collectChanges(baseSha, headSha, { cwd });
  const queuePaths = changes.filter((c) => c.status !== 'D' && QUEUE_RE.test(c.path)).map((c) => c.path);
  const drafts = readDrafts(headSha, queuePaths, { cwd });
  return evaluateGate({ actor, pr: { ...meta.pr, headSha }, commitAuthors: meta.commitAuthors, changes, drafts });
}

/** The stamp commit may change exactly the stamped queue files (status M), nothing else. */
export function verifyStampDiff(fromSha, toSha, expectedQueueFiles, { cwd } = {}) {
  const problems = [];
  const changes = parseNameStatusZ(git(['diff', '--no-renames', '--name-status', '-z', fromSha, toSha], { cwd }));
  const expected = new Set(expectedQueueFiles);
  for (const c of changes) {
    if (c.status !== 'M' || !expected.has(c.path)) problems.push(`stamp commit changes ${c.path} (${c.status}), which is not an expected stamped queue file`);
  }
  for (const e of expected) if (!changes.some((c) => c.path === e)) problems.push(`stamp commit does not touch ${e}`);
  return { ok: problems.length === 0, problems };
}

// ── API metadata ──────────────────────────────────────────────────────────

/** Default `ghApi(path)`: GET via the gh CLI (GH_TOKEN from the env), parsed. */
export function ghApiJson(apiPath) {
  return JSON.parse(execFileSync('gh', ['api', apiPath], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

/** The PR's state, authors and merge base, read at ONE moment. `ghApi` is injectable for tests. */
export function buildMeta({ repo, pr, ghApi = ghApiJson }) {
  const view = ghApi(`repos/${repo}/pulls/${pr}`);
  const commitAuthors = [];
  for (let page = 1; page <= 3; page += 1) {
    const commits = ghApi(`repos/${repo}/pulls/${pr}/commits?per_page=100&page=${page}`);
    for (const c of commits) commitAuthors.push(c?.author?.login ?? null);
    if (commits.length < 100) break;
    if (page === 3) throw new Error('more than 300 commits — refusing');
  }
  const headSha = view.head?.sha;
  const compare = ghApi(`repos/${repo}/compare/main...${headSha}?per_page=1`);
  return {
    pr: {
      state: view.state,
      base: view.base?.ref,
      headRef: view.head?.ref,
      headSha,
      author: view.user?.login,
      cross: !view.head?.repo || view.head.repo.full_name !== view.base?.repo?.full_name,
    },
    commitAuthors,
    mergeBase: compare.merge_base_commit?.sha ?? null,
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────
// gate:       node tree-approve-gate.mjs gate --pr N --actor L --meta meta.json --base SHA --head SHA --out DIR
// stamp-diff: node tree-approve-gate.mjs stamp-diff --from SHA --to SHA --queue-list FILE
// meta:       node tree-approve-gate.mjs meta --pr N --repo OWNER/NAME --out meta.json   (needs GH_TOKEN)
// normalize:  node tree-approve-gate.mjs normalize <pr-input>
function arg(argv, name) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(argv) {
  const mode = argv[0];
  if (mode === 'normalize') {
    process.stdout.write(`${normalizePrNumber(argv[1])}\n`);
    return 0;
  }
  const { readFileSync } = await import('node:fs');
  if (mode === 'meta') {
    const meta = buildMeta({ repo: arg(argv, 'repo'), pr: normalizePrNumber(arg(argv, 'pr')) });
    writeFileSync(arg(argv, 'out'), JSON.stringify(meta));
    console.log(`head=${meta.pr.headSha}
merge_base=${meta.mergeBase}
ref=${meta.pr.headRef}`);
    return 0;
  }
  if (mode === 'gate') {
    const meta = JSON.parse(readFileSync(arg(argv, 'meta'), 'utf8'));
    const result = runGate({ actor: arg(argv, 'actor'), meta, baseSha: arg(argv, 'base'), headSha: arg(argv, 'head') });
    if (!result.ok) {
      for (const p of result.problems) console.error(`::error::tree-approve-gate: ${p}`);
      return 1;
    }
    const out = arg(argv, 'out');
    mkdirSync(out, { recursive: true });
    writeFileSync(path.join(out, 'queue-files.txt'), result.queueFiles.join('\n') + '\n');
    writeFileSync(path.join(out, 'media-files.txt'), [...result.mediaFiles, ...result.sidecarFiles].join('\n') + (result.mediaFiles.length + result.sidecarFiles.length ? '\n' : ''));
    console.log(`tree-approve-gate: ok — ${result.queueFiles.length} draft(s), ${result.mediaFiles.length} media, ${result.sidecarFiles.length} sidecar(s)`);
    return 0;
  }
  if (mode === 'stamp-diff') {
    const expected = readFileSync(arg(argv, 'queue-list'), 'utf8').split('\n').filter(Boolean);
    const result = verifyStampDiff(arg(argv, 'from'), arg(argv, 'to'), expected);
    for (const p of result.problems) console.error(`::error::tree-approve-gate: ${p}`);
    return result.ok ? 0 : 1;
  }
  console.error('usage: tree-approve-gate.mjs gate|stamp-diff|normalize ...');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`::error::tree-approve-gate: ${err.message}`);
      process.exit(1);
    },
  );
}
