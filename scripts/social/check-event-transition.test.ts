import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  readLastState,
  writeState,
  transitioned,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './check-event-transition.mjs';

describe('transitioned', () => {
  const normal = { mode: 'normal', kind: null, id: null, windingDown: false };
  const event = { mode: 'event', kind: 'countdown', id: 'ci-1', windingDown: false };
  const windDown = { mode: 'event', kind: 'countdown', id: 'ci-1', windingDown: true };

  it('true on the very first run (no previous state)', () => {
    expect(transitioned(null, normal)).toBe(true);
  });

  it('false when nothing transition-relevant changed', () => {
    expect(transitioned(normal, { ...normal, heat: 5 })).toBe(false);
  });

  it('true on a normal -> event transition', () => {
    expect(transitioned(normal, event)).toBe(true);
  });

  it('true on an event -> wind-down transition', () => {
    expect(transitioned(event, windDown)).toBe(true);
  });

  it('true on a wind-down -> normal transition', () => {
    expect(transitioned(windDown, normal)).toBe(true);
  });

  it('false across repeated identical event ticks with churning heat/daysToResolution', () => {
    const a = { ...event, daysToResolution: 3.2 };
    const b = { ...event, daysToResolution: 2.9 };
    expect(transitioned(a, b)).toBe(false);
  });
});

describe('state file round-trip', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'event-status-state-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('readLastState returns null when the file does not exist', async () => {
    const state = await readLastState(path.join(dir, 'missing.json'));
    expect(state).toBeNull();
  });

  it('writeState then readLastState round-trips the object', async () => {
    const file = path.join(dir, 'event-status.json');
    const status = { mode: 'event', kind: 'theory', id: 'th-1', windingDown: false, heat: 4 };
    await writeState(status, file);
    const read = await readLastState(file);
    expect(read).toEqual(status);
  });

  it('readLastState returns null for corrupt JSON rather than throwing', async () => {
    const file = path.join(dir, 'corrupt.json');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(file, 'not json', 'utf-8');
    const read = await readLastState(file);
    expect(read).toBeNull();
  });
});
