// Rebuilds apps/web/lib/longlive/search-golden-frozen.fixture.json from the
// recovered legacy builder over the frozen parity fixture. No git history needed.
import { spawnSync } from 'node:child_process';

const r = spawnSync(
  'npx',
  ['vitest', 'run', 'apps/web/lib/longlive/search-golden-provenance.test.ts'],
  { stdio: 'inherit', shell: true, env: { ...process.env, REGEN_SEARCH_GOLDEN: '1' } },
);
process.exit(r.status ?? 1);
