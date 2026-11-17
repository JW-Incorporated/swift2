#!/usr/bin/env node
// Report-only: how much of apps/web's client JS is baked content.
// Run AFTER `npm run build --workspace @swift2/web` (this script never builds):
//   npm run perf:web-bundle [-- --max-content-bytes <n>]
// Always exits 0 and prints a table plus one JSON summary line, except when
// `--max-content-bytes` is given and the content bytes exceed it (exit 1).
// Content is detected with the same sentinels check-dom-bundle.mjs uses (one
// moment/track/theory/merch title from the published bundle): a chunk holding
// any sentinel is content-bearing and ALL its bytes count, so the figure is an
// upper bound (code bundled in the same chunk is included).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { sentinelsFromPublishedBundle } from '../parity/check-dom-bundle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const WEB_NEXT = path.join(ROOT, 'apps/web/.next');

export function parseArgs(argv) {
  const out = { maxContentBytes: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--max-content-bytes') {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 0) throw new Error('--max-content-bytes needs a non-negative number');
      out.maxContentBytes = n;
    }
  }
  return out;
}

export function sizes(buf) {
  return {
    raw: buf.length,
    gzip: zlib.gzipSync(buf, { level: 9 }).length,
    brotli: zlib.brotliCompressSync(buf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
    }).length,
  };
}

/** Chunk file names from route-bundle-stats entries (backslash or slash paths) for one route, or null. */
export function firstLoadChunks(stats, route = '/') {
  const entry = Array.isArray(stats) ? stats.find((r) => r?.route === route) : null;
  if (!entry || !Array.isArray(entry.firstLoadChunkPaths)) return null;
  return entry.firstLoadChunkPaths.map((p) => String(p).replace(/\\/g, '/').split('/').pop());
}

/** chunks: [{ file, buf }]. Returns per-chunk rows (largest raw first) and totals. */
export function analyzeChunks(chunks, sentinels, firstLoad = null) {
  const first = firstLoad ? new Set(firstLoad) : null;
  const rows = chunks.map(({ file, buf }) => {
    const text = buf.toString('utf8');
    const kinds = sentinels.filter((s) => text.includes(s.text)).map((s) => s.kind);
    return { file, ...sizes(buf), content: kinds.length > 0, kinds, firstLoad: first ? first.has(file) : null };
  });
  rows.sort((a, b) => b.raw - a.raw || a.file.localeCompare(b.file));
  const sum = (list, k) => list.reduce((n, r) => n + r[k], 0);
  const totalOf = (list) => ({ raw: sum(list, 'raw'), gzip: sum(list, 'gzip'), brotli: sum(list, 'brotli') });
  return {
    rows,
    total: totalOf(rows),
    content: totalOf(rows.filter((r) => r.content)),
    firstLoad: first ? totalOf(rows.filter((r) => r.firstLoad)) : null,
    firstLoadContent: first ? totalOf(rows.filter((r) => r.firstLoad && r.content)) : null,
  };
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

export function formatTable(rows) {
  const head = ['chunk', 'raw', 'gzip', 'brotli', 'home', 'content'];
  const body = rows.map((r) => [
    r.file,
    kb(r.raw),
    kb(r.gzip),
    kb(r.brotli),
    r.firstLoad === null ? '?' : r.firstLoad ? 'yes' : '',
    r.content ? r.kinds.join('+') : '',
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) =>
    cells
      .map((c, i) => (i === 0 || i >= 4 ? c.padEnd(widths[i]) : c.padStart(widths[i])))
      .join('  ')
      .trimEnd();
  return [line(head), ...body.map(line)].join('\n');
}

function readJsonIfPresent(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function run(argv, log = console.log) {
  const { maxContentBytes } = parseArgs(argv);
  const chunksDir = path.join(WEB_NEXT, 'static/chunks');
  if (!fs.existsSync(chunksDir)) {
    log('apps/web/.next/static/chunks is missing: run `npm run build --workspace @swift2/web` first (this script never builds).');
    return maxContentBytes === null ? 0 : 1;
  }
  const files = fs
    .readdirSync(chunksDir, { recursive: true })
    .map((f) => String(f).replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.js'));
  const chunks = files.map((file) => ({ file, buf: fs.readFileSync(path.join(chunksDir, file)) }));

  let sentinels = [];
  let sentinelError = null;
  try {
    sentinels = sentinelsFromPublishedBundle(ROOT);
  } catch (e) {
    sentinelError = e.message;
  }
  const stats = readJsonIfPresent(path.join(WEB_NEXT, 'diagnostics/route-bundle-stats.json'));
  const firstLoad = firstLoadChunks(stats, '/');
  const a = analyzeChunks(chunks, sentinels, firstLoad);
  const homeRows = a.rows.filter((r) => r.firstLoad);

  log(formatTable(a.rows));
  log('');
  log(`total client JS: ${kb(a.total.raw)} raw, ${kb(a.total.gzip)} gzip, ${kb(a.total.brotli)} brotli (${a.rows.length} chunks)`);
  log(
    `content-bearing chunks (sentinels: ${sentinels.map((s) => s.kind).join(', ') || 'none'}; upper bound): ` +
      `${kb(a.content.raw)} raw, ${kb(a.content.gzip)} gzip, ${kb(a.content.brotli)} brotli`,
  );
  if (sentinelError) log(`content detection unavailable: ${sentinelError}`);
  if (a.firstLoad) {
    log(
      `home first load (${homeRows.length} chunks, .next/diagnostics/route-bundle-stats.json): ` +
        `${kb(a.firstLoad.raw)} raw, ${kb(a.firstLoad.brotli)} brotli, of which content-bearing ` +
        `${kb(a.firstLoadContent.raw)} raw, ${kb(a.firstLoadContent.brotli)} brotli`,
    );
  } else {
    log('home first load: route-bundle-stats.json has no "/" entry in this build; not reported');
  }

  const summary = {
    chunks: a.rows.length,
    total: a.total,
    content: a.content,
    sentinelKinds: sentinels.map((s) => s.kind),
    contentChunks: a.rows.filter((r) => r.content).map((r) => ({ file: r.file, raw: r.raw, brotli: r.brotli, kinds: r.kinds })),
    homeFirstLoad: a.firstLoad && { chunks: homeRows.map((r) => r.file), ...a.firstLoad, content: a.firstLoadContent },
    topChunks: a.rows.slice(0, 8).map((r) => ({ file: r.file, raw: r.raw, gzip: r.gzip, brotli: r.brotli, content: r.content })),
    maxContentBytes,
  };
  log(JSON.stringify(summary));
  if (maxContentBytes !== null && (sentinelError || a.content.raw > maxContentBytes)) {
    log(`FAIL: content bytes ${a.content.raw} exceed --max-content-bytes ${maxContentBytes}${sentinelError ? ' (or content detection failed)' : ''}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
