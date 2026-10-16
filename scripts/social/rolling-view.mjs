// CLI for social-poster.yml: node scripts/social/rolling-view.mjs <branch>
import { applyRollingView } from './lib/rolling-view.mjs';
import { runMain } from '../lib/cli.mjs';

function main() {
  const branch = process.argv[2];
  if (!branch) throw new Error('usage: rolling-view.mjs <rolling-branch>');
  applyRollingView({ cwd: process.cwd(), branch });
}

runMain(main, { name: 'rolling-view' });
