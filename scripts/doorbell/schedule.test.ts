// The clock's table (scripts/doorbell/schedule.json) against every workflow's
// own `schedule:` (docs/specs/marjorie-overhaul/m7-clock.md): a cron edited in
// one place fails CI until the other follows, and every row can be dispatched
// so that it behaves like its schedule firing.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseSchedule } from './lib/clock-core.mjs';

type Row = { workflow: string; cron: string; inputs: Record<string, string | boolean>; key: string };
type Input = { required: boolean; default?: string };

const DIR = '.github/workflows';
const read = (file: string) => readFileSync(`${DIR}/${file}`, 'utf8').replace(/\r\n/g, '\n');
const files = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)).sort();
const rows: Row[] = parseSchedule(readFileSync('scripts/doorbell/schedule.json', 'utf8'));
const crons = (text: string) => [...text.matchAll(/^\s*-\s*cron:\s*["']([^"']+)["']/gm)].map((m) => m[1]);

/** `workflow_dispatch` inputs from the `on:` block, or null when it cannot be dispatched. */
function dispatchInputs(text: string): Record<string, Input> | null {
  const on = text.slice(text.search(/^on:/m), text.search(/^jobs:/m));
  const block = /^ {2}workflow_dispatch:.*\n((?: {4,}.*\n|[ \t]*\n)*)/m.exec(on);
  if (!block) return null;
  const inputs: Record<string, Input> = {};
  for (const m of block[1].matchAll(/^ {6}([\w-]+):\n((?: {8,}.*\n)*)/gm)) {
    inputs[m[1]] = { required: /^ {8}required: true$/m.test(m[2]), default: /^ {8}default: (.*)$/m.exec(m[2])?.[1] };
  }
  return inputs;
}

describe('scripts/doorbell/schedule.json', () => {
  it("lists exactly the crons the workflows carry, one row per slot", () => {
    const expected = files.flatMap((f) => crons(read(f)).map((cron) => `${f} ${cron}`)).sort();
    expect(rows.map((r) => r.key).sort()).toEqual(expected);
    expect(rows.length).toBeGreaterThanOrEqual(55);
  });

  it('can dispatch every row with the inputs it carries', () => {
    for (const r of rows) {
      const inputs = dispatchInputs(read(r.workflow));
      expect(inputs, `${r.workflow} needs a workflow_dispatch trigger`).not.toBeNull();
      for (const name of Object.keys(r.inputs)) expect(inputs, `${r.workflow} does not declare input ${name}`).toHaveProperty(name);
      for (const [name, input] of Object.entries(inputs || {})) {
        if (input.required && input.default === undefined) expect(r.inputs, `${r.workflow} requires ${name}`).toHaveProperty(name);
      }
    }
  });

  it('makes a clock dispatch behave like the schedule firing', () => {
    for (const r of rows) {
      const inputs = dispatchInputs(read(r.workflow)) || {};
      if (inputs.dry_run?.default === 'true') expect(r.inputs.dry_run, `${r.workflow} would dry-run`).toBe(false);
    }
    for (const r of rows.filter((x) => x.workflow === 'watchdog.yml')) expect(r.inputs.schedule).toBe(r.cron);
    const mailer = Object.fromEntries(rows.filter((x) => x.workflow === 'community-mailer.yml').map((x) => [x.cron, x.inputs.mode]));
    expect(mailer).toEqual({ '36 15 * * *': 'daily', '12 21 * * *': 'replies-waiting' });
    expect(rows.find((x) => x.workflow === 'backup-restore-drill.yml')?.inputs.page).toBe(true);
  });

  it('leaves no step that treats a schedule run specially without a clock equivalent', () => {
    for (const f of files.filter((file) => crons(read(file)).length)) {
      for (const line of read(f).split('\n').filter((l) => /github\.event_name\s*[!=]=\s*'schedule'/.test(l))) {
        expect(line, `${f}: ${line.trim()}`).toMatch(/inputs\.|workflow_dispatch/);
      }
    }
    const watchdog = read('watchdog.yml');
    expect(watchdog.match(/\(github\.event\.schedule \|\| inputs\.schedule \|\| 'manual'\) != '5 \* \* \* \*'/g)).toHaveLength(9);
  });
});
