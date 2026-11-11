import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXED_TIME } from '../../e2e/parity/env';

const script = resolve(__dirname, 'freeze-date.cjs');

describe('parity freeze-date preload', () => {
  it('pins Date.now() and argument-less new Date() to the harness FIXED_TIME, leaving dated constructors alone', () => {
    const out = execFileSync(
      process.execPath,
      [
        '--require',
        script,
        '-e',
        'console.log(JSON.stringify([Date.now(), new Date().toISOString(), new Date("2020-02-03T00:00:00Z").getTime(), new Date(5) instanceof Date]))',
      ],
      { encoding: 'utf-8' },
    );
    expect(JSON.parse(out)).toEqual([FIXED_TIME.getTime(), FIXED_TIME.toISOString(), Date.parse('2020-02-03T00:00:00Z'), true]);
  });
});
