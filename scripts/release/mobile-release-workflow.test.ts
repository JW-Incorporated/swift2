import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROOT } from '../lib/generated-content.mjs';
import { fingerprintArgs, listArgs, viewArgs } from './train-lib.mjs';

const text = readFileSync(join(ROOT, '.github/workflows/mobile-release.yml'), 'utf8');
const wf = parse(text);

// Flags eas-cli 23.2.0 accepts per command (`eas <cmd> --help`).
const ALLOWED: Record<string, string[]> = {
  'build:view': ['--json'],
  'build:list': ['--platform', '--fingerprint-hash', '--build-profile', '--status', '--limit', '--json', '--non-interactive'],
  'fingerprint:generate': ['--platform', '--environment', '--json', '--non-interactive'],
  build: ['--platform', '--profile', '--non-interactive', '--no-wait', '--json', '--message'],
  submit: ['--platform', '--id', '--profile', '--non-interactive'],
  update: ['--branch', '--environment', '--platform', '--message', '--non-interactive'],
  'account:usage': ['--non-interactive'],
};

describe('mobile-release.yml', () => {
  it('push paths exclude the retired EAS workflow dir after the apps/mobile glob', () => {
    const paths: string[] = wf.on.push.paths;
    expect(paths.indexOf('!apps/mobile/.eas/**')).toBeGreaterThan(paths.indexOf('apps/mobile/**'));
  });

  it('pins eas-cli at 23.2.0', () => {
    expect(text).toContain('npm install -g eas-cli@23.2.0');
  });

  it('every inline eas invocation uses only flags eas-cli 23.2.0 supports', () => {
    const lines = text.replace(/\\n\s*/g, ' ').split('\n');
    let seen = 0;
    for (const l of lines) {
      const m = l.match(/\beas (build:view|build:list|fingerprint:generate|build|submit|update|account:usage)\b(.*)/);
      if (!m || l.trim().startsWith('#')) continue;
      seen++;
      const flags = [...m[2].matchAll(/\s(--[a-z-]+)/g)].map((x) => x[1]);
      for (const f of flags) expect(ALLOWED[m[1]], `${m[1]} ${f}`).toContain(f);
    }
    expect(seen).toBeGreaterThan(4);
  });

  it('final gate fails when a produced build was not submitted', () => {
    const gate = wf.jobs.trigger.steps.at(-1).if as string;
    expect(gate).toContain("steps.android_submit.outputs.submitted != 'true'");
    expect(gate).toContain("steps.ios_submit.outcome != 'success'");
  });

  it('a missing Play key fails the Android submit step', () => {
    const s = wf.jobs.trigger.steps.find((x: { id?: string }) => x.id === 'android_submit');
    expect(s.run).not.toMatch(/PLAY_SERVICE_ACCOUNT_JSON repo secret is missing[\s\S]{0,300}exit 0/);
  });
});

describe('script eas argument vectors', () => {
  const check = (args: string[]) => {
    const allowed = ALLOWED[args[0]];
    for (const a of args.filter((x) => x.startsWith('--'))) expect(allowed).toContain(a);
  };
  it('build:view polls with --json only (no --non-interactive)', () => {
    expect(viewArgs('abc')).toEqual(['build:view', 'abc', '--json']);
    check(viewArgs('abc'));
  });
  it('plan commands only use supported flags', () => {
    check(fingerprintArgs('android'));
    check(listArgs('ios', 'h'));
  });
});
