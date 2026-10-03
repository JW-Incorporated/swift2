// Perf gate for the reader snapshot's core build (One UI WP2.2-B): median
// <= 15 ms unthrottled over >= 10 fresh contexts. Reports p90 and max.
// Each sample is a brand-new `fromBakedCore` build (no module singleton to
// reuse), the first one JIT-cold. 4x CPU throttle is report-only: run this
// under a throttled shell/CDP and compare; it is not asserted here.
//
//   npx tsx scripts/perf/snapshot-build.ts [samples]
import { performance } from 'node:perf_hooks';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { fromBakedCore } from '@swift2/experience/reader-snapshot';
import { bakedModules } from '../../apps/web/lib/longlive/baked-modules';

const GATE_MEDIAN_MS = 15;
const samples = Math.max(10, Number(process.argv[2] ?? 12));

const times: number[] = [];
for (let i = 0; i < samples; i++) {
  const t0 = performance.now();
  const snap = fromBakedCore(bakedModules(), { eraVideoFeed });
  times.push(performance.now() - t0);
  if (snap.domains.eras.length === 0) throw new Error('empty snapshot');
}

const sorted = [...times].sort((a, b) => a - b);
const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

console.log(`samples_ms=${times.map((t) => t.toFixed(2)).join(',')}`);
console.log(`median=${median.toFixed(2)}ms p90=${at(0.9).toFixed(2)}ms max=${sorted[sorted.length - 1].toFixed(2)}ms n=${samples}`);
if (median > GATE_MEDIAN_MS) {
  console.error(`FAIL: median ${median.toFixed(2)}ms > ${GATE_MEDIAN_MS}ms`);
  process.exit(1);
}
console.log(`PASS: median <= ${GATE_MEDIAN_MS}ms`);
