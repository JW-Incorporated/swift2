// Text assertions over the M5 chat routines (no YAML parser, matching
// scripts/social/weekly-brief-workflows.test.ts): the properties a later
// edit could silently break and no unit test of a script would catch.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { BOTS, runTitle } from './lib/chat-inbox.mjs';

const read = (file: string) => readFileSync(resolve(file), 'utf8').replace(/\r\n/g, '\n');

/** Each top-level job's text, keyed by job name (2-space keys under `jobs:`). */
function jobs(text: string): Record<string, string> {
  const body = text.slice(text.indexOf('\njobs:\n') + 7);
  const out: Record<string, string> = {};
  let name = '';
  for (const line of body.split('\n')) {
    const m = /^ {2}([a-z][\w-]*):\s*$/.exec(line);
    if (m) name = m[1];
    else if (name) out[name] = `${out[name] || ''}${line}\n`;
  }
  return out;
}

const deployed = (Object.entries(BOTS) as Array<[string, { workflow: string }]>).filter(([, cfg]) => existsSync(resolve('.github/workflows', cfg.workflow)));

describe.each(deployed)('%s chat routine', (bot, cfg) => {
  const file = `.github/workflows/${cfg.workflow}`;
  const text = read(file);
  const byJob = jobs(text);

  it('names each run exactly as the poll looks it up', () => {
    const title = runTitle(bot, '${{ inputs.message_id }}');
    expect(text).toContain(`run-name: "${title}"`);
  });

  it('is dispatch-only, with a per-message concurrency group', () => {
    expect(text).not.toMatch(/^\s*schedule:/m);
    expect(text).toMatch(/^concurrency:\n {2}group: [a-z]+-chat-\$\{\{ inputs\.message_id \}\}/m);
  });

  it('never hands a Discord secret to the agent job', () => {
    expect(byJob.run).toContain('uses: ./.github/workflows/routine-template.yml');
    expect(byJob.run).not.toMatch(/DISCORD_|WEBHOOK/);
  });

  it('holds Discord secrets only in environment-scoped jobs that check out main', () => {
    for (const [name, job] of Object.entries(byJob)) {
      if (!/secrets\.DISCORD_/.test(job)) continue;
      expect(job, name).toMatch(/environment: (social|ops)\n/);
      expect(job, name).toMatch(/ref: main\n/);
    }
  });

  it('deletes its chat artifacts when the run is done', () => {
    expect(byJob.finish).toMatch(/if: always\(\)[\s\S]*actions\/artifacts/);
  });
});
