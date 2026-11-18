import { describe, expect, it } from 'vitest';
import { dispatchWorkflow, parseArgs } from './dispatch-workflow.mjs';

const TOKEN = 'ghp_fake_dispatch_token_value';

function fakes(env: Record<string, string> = {}) {
  const calls: { args: string[]; env: Record<string, string> }[] = [];
  const logs: string[] = [];
  return {
    calls,
    logs,
    deps: {
      env: { GITHUB_REPOSITORY: 'JW-Incorporated/swift2', ...env },
      gh: (args: string[], childEnv: Record<string, string>) => {
        calls.push({ args, env: childEnv });
        return '';
      },
      log: (line: string) => logs.push(line),
    },
  };
}

describe('dispatch-workflow', () => {
  it('dispatches on main with GH_DISPATCH_TOKEN passed as GH_TOKEN in the child env only', () => {
    const f = fakes({ GH_DISPATCH_TOKEN: TOKEN });
    expect(dispatchWorkflow({ argv: ['routine-vault-run.yml'], ...f.deps })).toBe(0);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].args).toEqual([
      'workflow',
      'run',
      'routine-vault-run.yml',
      '--repo',
      'JW-Incorporated/swift2',
      '--ref',
      'main',
    ]);
    expect(f.calls[0].env.GH_TOKEN).toBe(TOKEN);
    // The token is never an argv element — only an environment entry.
    expect(f.calls[0].args).not.toContain(TOKEN);
  });

  it('never prints the token value', () => {
    const f = fakes({ GH_DISPATCH_TOKEN: TOKEN });
    dispatchWorkflow({ argv: ['routine-marjorie-brief.yml', '-f', 'issue=6875'], ...f.deps });
    expect(f.logs.join('\n')).not.toContain(TOKEN);
    expect(f.logs.join('\n')).toContain('using GH_DISPATCH_TOKEN');
  });

  it('forwards -f inputs and a non-default ref/repo', () => {
    const f = fakes({ GH_DISPATCH_TOKEN: TOKEN });
    dispatchWorkflow({
      argv: ['routine-ops-fix.yml', '-f', 'issue=6875', '-f', 'mode=retry', '--ref', 'main', '--repo', 'o/r'],
      ...f.deps,
    });
    expect(f.calls[0].args).toEqual([
      'workflow',
      'run',
      'routine-ops-fix.yml',
      '--repo',
      'o/r',
      '--ref',
      'main',
      '-f',
      'issue=6875',
      '-f',
      'mode=retry',
    ]);
  });

  it('still dispatches and warns when GH_DISPATCH_TOKEN is unset or empty', () => {
    for (const env of [{}, { GH_DISPATCH_TOKEN: '' }, { GH_DISPATCH_TOKEN: '  ' }]) {
      const f = fakes(env);
      expect(dispatchWorkflow({ argv: ['watchdog.yml'], ...f.deps })).toBe(0);
      expect(f.calls[0].env.GH_TOKEN).toBeUndefined();
      expect(f.logs.join('\n')).toContain('GH_DISPATCH_TOKEN is unset or empty');
    }
  });

  it('rejects anything that is not a bare workflow filename', () => {
    for (const bad of ['routine-vault-run', '../../etc/passwd.yml', 'a.yml b.yml', '']) {
      expect(() => parseArgs([bad])).toThrow();
    }
    expect(parseArgs(['routine-vault-run.yaml']).workflow).toBe('routine-vault-run.yaml');
  });

  it('rejects malformed inputs, unknown flags and stray positionals', () => {
    expect(() => parseArgs(['w.yml', '-f'])).toThrow(/key=value/);
    expect(() => parseArgs(['w.yml', '-f', 'novalue'])).toThrow(/key=value/);
    expect(() => parseArgs(['w.yml', '--not-a-flag'])).toThrow(/unknown flag/);
    expect(() => parseArgs(['w.yml', 'extra'])).toThrow(/extra argument/);
    expect(() => parseArgs(['w.yml', '--ref'])).toThrow(/--ref needs a value/);
  });

  it('fails loudly rather than guessing a repo', () => {
    const calls: unknown[] = [];
    expect(() =>
      dispatchWorkflow({ argv: ['w.yml'], env: {}, gh: () => { calls.push(1); return ''; }, log: () => {} }),
    ).toThrow(/GITHUB_REPOSITORY is unset/);
    expect(calls).toHaveLength(0);
  });
});
