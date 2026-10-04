// Pure parsing/scoring for Speed test mode `[diag]` comments on issue #4791 (One UI PLAN §WP0.2).
// Comment format: apps/web/app/api/feedback/diag.ts diagCommentFrom(). Bars mirror SPEED_*_BAR_MS there.
export const COLD_BAR_MS = 2500;
export const WARM_BAR_MS = 1000;
export const MIN_PER_KIND = 5;

/** `gh api --paginate` prints one JSON array per page back to back; join them. */
export function parseGhPages(text) {
  const t = text.trim();
  if (!t) return [];
  return JSON.parse(t.replace(/\]\s*\[/g, ','));
}

const cell = (body, label) => {
  const m = body.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, 'm'));
  return m ? m[1].replace(/`/g, '') : null;
};

/** Returns null for non-[diag] comments; otherwise a report with `speed: null` for legacy (pre-speed-test) format. */
export function parseComment(body) {
  if (typeof body !== 'string' || !body.startsWith('**[diag]')) return null;
  const timings = {};
  for (const m of body.matchAll(/^\|\s*`([^`]+)`\s*\|\s*([0-9.]+)\s*\|\s*$/gm))
    timings[m[1]] = Number(m[2]);
  const report = {
    model: cell(body, 'Model'),
    build: cell(body, 'Build'),
    launch: cell(body, 'Launch'),
    timings,
    speed: null,
  };
  const row = cell(body, 'Speed test');
  const sm = row && row.match(/^run ([0-9a-f]{8}), (launch|summary) (?:(\d+) of|of) (\d+)$/);
  if (!sm) return report;
  const kind = sm[2];
  const n = Number(sm[3] ?? sm[4]);
  const images = cell(body, 'Images loaded by T\\+10 s');
  const speed = {
    run: sm[1],
    kind,
    index: n,
    ui: cell(body, 'UI') ?? 'unknown',
    anchor: /native process start/.test(cell(body, 'Clock starts at') ?? '') ? 'native' : 'js',
    images10s: images === null ? null : Number(images),
    launches: null,
  };
  if (kind === 'summary') {
    speed.launches = [
      ...body.matchAll(/^\|\s*\d+\s*\|\s*(cold|warm)\s*\|\s*([0-9.]+)\s*\|\s*$/gm),
    ].map((m) => ({
      k: m[1],
      ms: Number(m[2]),
    }));
  }
  return { ...report, speed };
}

/** Per-launch headline ms from a launch report's timings (same rule as mobile launchMetric). */
export function launchMs(r) {
  if (r.launch === 'warm') return r.timings['at:resume-paint'] ?? null;
  const paint = r.timings['at:first-era-paint'];
  if (paint === undefined) return null;
  const lead = r.timings['native-lead'];
  return lead !== undefined ? Math.round((lead + paint) * 10) / 10 : paint;
}

export function verdictFor(launches) {
  const worst = (k) => {
    const ms = launches.filter((l) => l.k === k).map((l) => l.ms);
    return ms.length ? Math.max(...ms) : null;
  };
  const cold = worst('cold');
  const warm = worst('warm');
  const n = (k) => launches.filter((l) => l.k === k).length;
  const over = (cold ?? 0) > COLD_BAR_MS || (warm ?? 0) > WARM_BAR_MS;
  const short = n('cold') < MIN_PER_KIND || n('warm') < MIN_PER_KIND;
  return {
    cold,
    warm,
    coldN: n('cold'),
    warmN: n('warm'),
    verdict: over ? 'FAIL' : short ? 'INCOMPLETE' : 'PASS',
  };
}

/** Group comments by run id and score each run. Legacy/unparseable comments are counted, not scored. */
export function scoreComments(comments) {
  const runs = new Map();
  let legacy = 0;
  for (const c of comments) {
    const r = parseComment(c.body);
    if (!r) continue;
    if (!r.speed) {
      legacy += 1;
      continue;
    }
    const run = runs.get(r.speed.run) ?? {
      launchReports: new Map(),
      summary: null,
      ui: r.speed.ui,
      anchor: r.speed.anchor,
      model: r.model,
    };
    if (r.speed.kind === 'summary') run.summary = r;
    else run.launchReports.set(r.speed.index, r);
    runs.set(r.speed.run, run);
  }
  const out = [];
  for (const [id, run] of runs) {
    const reports = [...run.launchReports.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    let launches;
    let source;
    if (run.summary?.speed.launches?.length) {
      launches = run.summary.speed.launches;
      source = 'summary';
    } else {
      launches = reports.flatMap((r) => {
        const ms = launchMs(r);
        return ms === null || (r.launch !== 'cold' && r.launch !== 'warm')
          ? []
          : [{ k: r.launch, ms }];
      });
      source = 'launches';
    }
    const v = verdictFor(launches);
    const firstImages = reports
      .map((r) => r.timings['at:first-image-paint'])
      .filter((x) => x !== undefined);
    const imgs = reports.map((r) => r.speed.images10s).filter((x) => x !== null);
    out.push({
      run: id,
      model: run.model,
      path: run.ui === 'shared' ? 'shared-UI' : run.ui === 'native' ? 'native' : 'unknown',
      source,
      ...v,
      firstImageMsWorst: firstImages.length ? Math.max(...firstImages) : null,
      images10sMin: imgs.length ? Math.min(...imgs) : null,
    });
  }
  return { runs: out, legacy };
}

const f = (n) => (n === null ? 'n/a' : n.toFixed(1));

export function renderTable({ runs, legacy }) {
  const lines = [
    `| Run | Device | Path | Source | Worst cold (<=${COLD_BAR_MS}) | Worst warm (<=${WARM_BAR_MS}) | Cold n | Warm n | First image (worst ms) | Images by T+10s (min) | Verdict |`,
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...runs.map(
      (r) =>
        `| ${r.run} | ${r.model ?? 'n/a'} | ${r.path} | ${r.source} | ${f(r.cold)} | ${f(r.warm)} | ${r.coldN} | ${r.warmN} | ${f(r.firstImageMsWorst)} | ${r.images10sMin ?? 'n/a'} | **${r.verdict}** |`,
    ),
  ];
  if (runs.length === 0)
    lines.push('| (no speed-test runs found) |  |  |  |  |  |  |  |  |  | INCOMPLETE |');
  lines.push('', `Legacy-format [diag] reports skipped (no speed-test metadata): ${legacy}`);
  return lines.join('\n');
}
