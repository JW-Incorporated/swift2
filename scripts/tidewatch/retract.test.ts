import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { BOOL_SWITCHES, FREEZE_ON_ONLY, INT_SWITCHES, validate } from '../ops/set-switch.mjs';
import { CORRECTIONS_LIVE_SWITCH, main } from './retract.mjs';

function fakeStore({ storyId = 'story-1', recipients = ['device-b', 'device-a', 'device-a'],
  provider = vi.fn() } = {}) {
  const state = {
    currentItems: [
      { id: 'card-1', story_id: storyId, headline: 'Wrong report', status: 'confirmed', redline_ok: true },
    ],
    events: [
      { id: 'event-story', story_id: storyId, title: 'Wrong report', killed_at: null, expires_at: null },
      { id: 'event-other', story_id: 'story-2', title: 'Other story', killed_at: null, expires_at: null },
    ],
    recipients,
    retractionLogged: false,
    correctionEnqueued: false,
    corrections: [] as Array<Record<string, unknown>>,
    calls: { hide: 0, kill: 0, log: 0, enqueue: 0 },
  };
  const store = {
    async inspect(id: string) {
      return {
        currentItems: state.currentItems.filter((item) => item.story_id === id),
        events: state.events.filter((event) => event.story_id === id),
        recipientDeviceIds: id === storyId ? state.recipients : [],
        watchItemId: 'watch-1',
        retractionLogged: state.retractionLogged,
        correctionEnqueued: state.correctionEnqueued,
      };
    },
    async hideCurrentItems(ids: string[]) {
      state.calls.hide += 1;
      for (const item of state.currentItems) {
        if (ids.includes(item.id)) Object.assign(item, { status: 'debunked', redline_ok: false });
      }
    },
    async killPendingEvents(events: Array<{ id: string }>) {
      state.calls.kill += 1;
      for (const event of state.events) {
        if (events.some((candidate) => candidate.id === event.id)) event.killed_at = '2026-10-15T12:00:00.000Z';
      }
    },
    async logRetraction() {
      state.calls.log += 1;
      state.retractionLogged = true;
    },
    async enqueueCorrection(event: Record<string, unknown>) {
      state.calls.enqueue += 1;
      state.correctionEnqueued = true;
      state.corrections.push(event);
      await provider(event);
    },
  };
  return { store, state, provider };
}

const NOW = new Date('2026-10-15T12:00:00.000Z');

describe('Tidewatch retraction', () => {
  it('plan mode mutates nothing', async () => {
    const fake = fakeStore();
    const log = vi.fn();

    const result = await main(['--story-id', 'story-1', '--mode', 'plan'], {
      store: fake.store, now: NOW, log, env: {},
    });

    expect(result.mutated).toBe(false);
    expect(fake.state.calls).toEqual({ hide: 0, kill: 0, log: 0, enqueue: 0 });
    expect(fake.state.currentItems[0]).toMatchObject({ status: 'confirmed', redline_ok: true });
    expect(fake.state.events.every((event) => event.killed_at === null)).toBe(true);
    expect(log.mock.calls.flat().join('\n')).toContain('prior-recipient: device-a');
  });

  it('apply hides the card, kills only that story, and logs once across reruns', async () => {
    const fake = fakeStore();
    const args = ['--story-id', 'story-1', '--mode', 'apply', '--confirm', 'RETRACT-story-1'];
    const deps = { store: fake.store, now: NOW, log: vi.fn(), env: {} };

    await main(args, deps);
    await main(args, deps);

    expect(fake.state.currentItems[0]).toMatchObject({ status: 'debunked', redline_ok: false });
    expect(fake.state.events.find((event) => event.id === 'event-story')?.killed_at).toBeTruthy();
    expect(fake.state.events.find((event) => event.id === 'event-other')?.killed_at).toBeNull();
    expect(fake.state.calls).toEqual({ hide: 1, kill: 1, log: 1, enqueue: 0 });
  });

  it('correction targets exactly the original prior recipients and switch-off calls no push provider', async () => {
    const off = fakeStore();
    const args = ['--story-id', 'story-1', '--mode', 'apply', '--confirm', 'RETRACT-story-1'];
    await main(args, { store: off.store, now: NOW, log: vi.fn(), env: {} });

    expect(off.state.corrections).toEqual([]);
    expect(off.provider).not.toHaveBeenCalled();

    const live = fakeStore();
    await main(args, {
      store: live.store,
      now: NOW,
      log: vi.fn(),
      env: { [CORRECTIONS_LIVE_SWITCH]: 'true' },
    });

    expect(live.state.corrections).toHaveLength(1);
    expect(live.state.corrections[0]).toMatchObject({
      category: 'correction',
      tier: 1,
      target_device_ids: ['device-a', 'device-b'],
    });
    expect(live.provider).toHaveBeenCalledTimes(1);
  });

  it('requires the story-bound typed confirmation for apply', async () => {
    const fake = fakeStore();
    await expect(main(['--story-id', 'story-1', '--mode', 'apply'], {
      store: fake.store, now: NOW, log: vi.fn(), env: {},
    })).rejects.toThrow('apply requires --confirm RETRACT-story-1');
    expect(fake.state.calls).toEqual({ hide: 0, kill: 0, log: 0, enqueue: 0 });
  });

  it('keeps the live-corrections switch owner-only and the workflow dispatch-only', async () => {
    expect(validate(CORRECTIONS_LIVE_SWITCH, 'true', 'test')).toContain('founder-only');
    expect(BOOL_SWITCHES.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    expect(INT_SWITCHES.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    expect(FREEZE_ON_ONLY.has(CORRECTIONS_LIVE_SWITCH)).toBe(false);
    const workflow = await readFile(new URL('../../.github/workflows/tidewatch-retract.yml', import.meta.url), 'utf8');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s*(schedule|push|pull_request|workflow_run):/m);
    expect(workflow).toContain('RETRACT-$STORY_ID');
    expect(workflow).toContain('group: tidewatch-retract-${{ inputs.story_id }}');
  });
});
