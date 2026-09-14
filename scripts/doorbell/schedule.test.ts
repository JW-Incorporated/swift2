import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain module
import { parseSchedule, scheduleProblems } from './lib/clock-core.mjs';

const rows = parseSchedule(readFileSync('scripts/doorbell/schedule.json', 'utf8'));
const workflow = (name: string) => readFileSync(`.github/workflows/${name}`, 'utf8').replace(/\r\n/g, '\n');

describe('pinned clock table', () => {
  it('contains exactly the two approved rows with empty inputs', () => {
    expect(rows.map((row: { workflow: string; cron: string; inputs: object }) => ({ workflow: row.workflow, cron: row.cron, inputs: row.inputs }))).toEqual([
      { workflow: 'bot-chat-poll.yml', cron: '*/5 * * * *', inputs: {} },
      { workflow: 'routine-marjorie-brief.yml', cron: '0 12 * * *', inputs: {} },
    ]);
    expect(scheduleProblems(rows)).toEqual([]);
  });

  it('matches each workflow cron and requires no dispatch inputs', () => {
    for (const row of rows) {
      const text = workflow(row.workflow);
      expect(text).toMatch(new RegExp(`^\\s*-\\s*cron:\\s*["']${row.cron.replace(/[*/]/g, '\\$&')}["']`, 'm'));
      expect(text).toMatch(/^ {2}workflow_dispatch:/m);
    }
  });
});
