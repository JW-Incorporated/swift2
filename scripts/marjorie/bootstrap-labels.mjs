// Idempotent label bootstrap for the desk system (CLAUDE.md rule 8: repo
// setup is code, not a remembered checklist). Issue forms only apply labels
// that already exist, and assemble-brief.mjs / watchdog.yml query by label —
// so a fresh repo (or the future org home, see org-transfer plans) must run
// this once:  node scripts/marjorie/bootstrap-labels.mjs
import { execFileSync } from 'node:child_process';

export const LABELS = [
  ['founder-decision', 'B60205', 'Needs a founder answer — banked into the daily Founders Brief'],
  ['founders-brief', '0E8A16', 'The daily Founders Brief issues (Marjorie)'],
  ['watchdog-alert', 'D93F0B', 'A scheduled cadence failed — loud by design'],
  ['intake', '1D76DB', 'Real-world event dropped for content authoring'],
  ['needs-sources', 'FBCA04', 'Intake item stalled on real sourcing'],
];

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(
  process.argv[1].split(/[\\/]/).pop());
if (invokedDirectly) {
  for (const [name, color, description] of LABELS) {
    try {
      execFileSync('gh', ['label', 'create', name, '--color', color,
        '--description', description, '--force'], { encoding: 'utf8' });
      console.log(`ok: ${name}`);
    } catch (e) {
      console.error(`FAILED: ${name}: ${e.message}`);
      process.exitCode = 1;
    }
  }
}
