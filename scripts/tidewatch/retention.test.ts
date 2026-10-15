import { describe, expect, it } from 'vitest';
import {
  NOISE_ITEM_RETENTION_DAYS,
  RETENTION_SQL,
  SHADOW_DECISION_RETENTION_DAYS,
  UNSEEN_ITEM_RETENTION_DAYS,
  runRetention,
} from './retention.mjs';

const NOW = new Date('2026-10-15T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

type Item = { id: string; lastSeenDaysAgo: number };
type Decision = {
  id: string;
  itemId: string | null;
  class: string;
  decidedDaysAgo: number;
  shadow: boolean;
};

function fixtureClient(items: Item[], decisions: Decision[]) {
  const state = {
    items: structuredClone(items),
    decisions: structuredClone(decisions),
    calls: 0,
  };

  return {
    state,
    async query(sql: string, params: [string, boolean]) {
      state.calls += 1;
      expect(sql).toBe(RETENTION_SQL);
      const [nowIso, apply] = params;
      const nowMs = new Date(nowIso).getTime();
      const latest = new Map<string, Decision>();
      for (const decision of state.decisions) {
        if (decision.itemId === null) continue;
        const current = latest.get(decision.itemId);
        if (!current || decision.decidedDaysAgo < current.decidedDaysAgo) {
          latest.set(decision.itemId, decision);
        }
      }

      const itemIds = new Set(
        state.items
          .filter((item) => {
            const ageMs = item.lastSeenDaysAgo * DAY;
            return (
              ageMs > UNSEEN_ITEM_RETENTION_DAYS * DAY ||
              (latest.get(item.id)?.class === 'noise' && ageMs > NOISE_ITEM_RETENTION_DAYS * DAY)
            );
          })
          .map((item) => item.id),
      );
      const decisionIds = new Set(
        state.decisions
          .filter(
            (decision) =>
              decision.shadow &&
              decision.decidedDaysAgo * DAY > SHADOW_DECISION_RETENTION_DAYS * DAY,
          )
          .map((decision) => decision.id),
      );

      if (apply) {
        state.items = state.items.filter((item) => !itemIds.has(item.id));
        state.decisions = state.decisions.filter((decision) => !decisionIds.has(decision.id));
      }
      expect(nowMs).toBe(NOW.getTime());
      return {
        rows: [{ watch_items: itemIds.size, watch_decisions: decisionIds.size }],
      };
    },
  };
}

function decision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'decision-1',
    itemId: 'item-1',
    class: 'noise',
    decidedDaysAgo: 1,
    shadow: true,
    ...overrides,
  };
}

describe('Tidewatch retention', () => {
  it('uses one candidate query for previews and deletes, with null-safe noise matching', () => {
    expect(RETENTION_SQL).toMatch(/latest_class is not distinct from 'noise'/i);
    expect(RETENTION_SQL.match(/item_candidates/g)).toHaveLength(3);
  });

  it('handles an item with no decisions identically in dry-run and apply', async () => {
    const dryClient = fixtureClient([{ id: 'item-1', lastSeenDaysAgo: 60 }], []);
    const applyClient = fixtureClient([{ id: 'item-1', lastSeenDaysAgo: 60 }], []);

    expect(await runRetention(dryClient, { now: NOW })).toMatchObject({ watchItems: 0 });
    expect(await runRetention(applyClient, { apply: true, now: NOW })).toMatchObject({
      watchItems: 0,
    });
    expect(applyClient.state.items).toHaveLength(1);
  });

  it('deletes noise items older than 30 days but not newer noise items', async () => {
    const client = fixtureClient(
      [
        { id: 'old-noise', lastSeenDaysAgo: 31 },
        { id: 'new-noise', lastSeenDaysAgo: 30 },
      ],
      [
        decision({ id: 'old-decision', itemId: 'old-noise' }),
        decision({ id: 'new-decision', itemId: 'new-noise' }),
      ],
    );

    expect(await runRetention(client, { apply: true, now: NOW })).toMatchObject({ watchItems: 1 });
    expect(client.state.items.map((item) => item.id)).toEqual(['new-noise']);
  });

  it('keeps non-noise items until they are older than 180 days', async () => {
    const client = fixtureClient(
      [
        { id: 'recent-story', lastSeenDaysAgo: 179 },
        { id: 'stale-story', lastSeenDaysAgo: 181 },
      ],
      [
        decision({ id: 'prior-noise', itemId: 'recent-story', decidedDaysAgo: 2 }),
        decision({ id: 'recent-decision', itemId: 'recent-story', class: 'story' }),
        decision({ id: 'stale-decision', itemId: 'stale-story', class: 'story' }),
      ],
    );

    expect(await runRetention(client, { apply: true, now: NOW })).toMatchObject({ watchItems: 1 });
    expect(client.state.items.map((item) => item.id)).toEqual(['recent-story']);
  });

  it('never deletes non-shadow decisions', async () => {
    const client = fixtureClient(
      [],
      [
        decision({ id: 'shadow-old', itemId: null, decidedDaysAgo: 366 }),
        decision({ id: 'real-old', itemId: null, decidedDaysAgo: 900, shadow: false }),
      ],
    );

    expect(await runRetention(client, { apply: true, now: NOW })).toMatchObject({
      watchDecisions: 1,
    });
    expect(client.state.decisions.map((row) => row.id)).toEqual(['real-old']);
  });

  it('reports the same count as apply on a mixed fixture', async () => {
    const items = [
      { id: 'no-decision', lastSeenDaysAgo: 60 },
      { id: 'old-noise', lastSeenDaysAgo: 40 },
      { id: 'new-noise', lastSeenDaysAgo: 10 },
      { id: 'old-story', lastSeenDaysAgo: 200 },
      { id: 'new-story', lastSeenDaysAgo: 100 },
    ];
    const decisions = [
      decision({ id: 'd1', itemId: 'old-noise' }),
      decision({ id: 'd2', itemId: 'new-noise' }),
      decision({ id: 'd3', itemId: 'old-story', class: 'story' }),
      decision({ id: 'd4', itemId: 'new-story', class: 'story' }),
      decision({ id: 'd5', itemId: null, decidedDaysAgo: 400 }),
      decision({ id: 'd6', itemId: null, decidedDaysAgo: 500, shadow: false }),
    ];
    const dryClient = fixtureClient(items, decisions);
    const applyClient = fixtureClient(items, decisions);

    const preview = await runRetention(dryClient, { now: NOW });
    const applied = await runRetention(applyClient, { apply: true, now: NOW });

    expect(preview).toMatchObject({ dryRun: true, watchItems: 2, watchDecisions: 1 });
    expect(applied).toMatchObject({ dryRun: false, watchItems: 2, watchDecisions: 1 });
    expect(preview.watchItems).toBe(applied.watchItems);
    expect(preview.watchDecisions).toBe(applied.watchDecisions);
    expect(dryClient.state.calls).toBe(1);
    expect(applyClient.state.calls).toBe(1);
  });
});
