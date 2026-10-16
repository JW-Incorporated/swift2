import { describe, expect, it } from 'vitest';
import { engagementLeadsFromPosts } from './fb-export-ingest.mjs';
import { legacyLeadLocator, unsaltedLegacyLeadLocator } from './fb-lead-identity.mjs';
import { backfillLeadMetrics, writeEngagementLeads } from './fb-lead-store.mjs';

type Row = Record<string, unknown>;

function memorySupabase(initial: Row[] = []) {
  const rows = initial.map((row) => ({ ...row }));
  return {
    rows,
    from() {
      return {
        insert: async (lead: Row) => {
          const duplicate = rows.some(
            (row) =>
              row.platform === lead.platform &&
              (row.thread_id ?? row.locator) === (lead.thread_id ?? lead.locator) &&
              row.kind === lead.kind,
          );
          if (duplicate) return { error: { code: '23505', message: 'duplicate' } };
          rows.push({ ...lead });
          return { error: null };
        },
        update(values: Row) {
          const filters: Array<(row: Row) => boolean> = [];
          let selecting = false;
          const query = {
            eq(key: string, value: unknown) {
              filters.push((row) => row[key] === value);
              return query;
            },
            is(key: string, value: unknown) {
              filters.push((row) => row[key] === value);
              return query;
            },
            select() {
              selecting = true;
              return query;
            },
            then(resolve: (value: unknown) => unknown) {
              const matched = rows.filter((row) => filters.every((filter) => filter(row)));
              const conflicts = matched.some((matchedRow) =>
                rows.some(
                  (row) =>
                    row !== matchedRow &&
                    row.platform === matchedRow.platform &&
                    (row.thread_id ?? row.locator) ===
                      (matchedRow.thread_id ?? values.locator ?? matchedRow.locator) &&
                    row.kind === matchedRow.kind,
                ),
              );
              if (conflicts)
                return Promise.resolve(
                  resolve({ data: null, error: { code: '23505', message: 'duplicate' } }),
                );
              for (const row of matched) Object.assign(row, values);
              return Promise.resolve(
                resolve({
                  data: selecting ? matched.map((row) => ({ locator: row.locator })) : null,
                  error: null,
                }),
              );
            },
          };
          return query;
        },
      };
    },
  };
}

const options = { groupName: 'Group', groupSlug: 'group-101' };
const post = (text: string, extra: Row = {}) => ({
  text,
  reactionCount: 4,
  commentCount: 2,
  authorHash: 'same-author',
  timestamp: '2026-10-15T12:00:00Z',
  ...extra,
});

describe('Facebook lead identity and persistence', () => {
  it('keeps two no-permalink posts by the same author distinct', () => {
    const leads = engagementLeadsFromPosts([post('first post'), post('second post')], options);
    expect(leads).toHaveLength(2);
    expect(new Set(leads.map((lead) => lead.locator)).size).toBe(2);
    expect(JSON.stringify(leads)).not.toMatch(/first post|second post|same-author/);
  });

  it('dedupes the same no-permalink post across runs', async () => {
    const db = memorySupabase();
    const first = engagementLeadsFromPosts([post('same post 4 reactions 2 comments')], options);
    const second = engagementLeadsFromPosts(
      [post('  SAME   post 9 reactions 5 comments  ', { reactionCount: 9, commentCount: 5 })],
      options,
    );
    await writeEngagementLeads(db, first);
    const result = await writeEngagementLeads(db, second);
    expect(result).toEqual({ inserted: 0, deduped: 1 });
    expect(db.rows).toHaveLength(1);
  });

  it('salts new locators and upgrades an existing unsalted row in place', async () => {
    const source = post('same private post');
    const oldLocator = unsaltedLegacyLeadLocator(source, options.groupSlug);
    const newLocator = legacyLeadLocator(source, options.groupSlug);
    expect(newLocator).not.toBe(oldLocator);
    const db = memorySupabase([
      {
        platform: 'facebook',
        kind: 'hot_thread',
        thread_id: null,
        locator: oldLocator,
        url: null,
      },
    ]);

    const result = await writeEngagementLeads(db, engagementLeadsFromPosts([source], options));

    expect(result).toEqual({ inserted: 0, deduped: 1 });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].locator).toBe(newLocator);
  });

  it('dedupes on the new locator when an in-place legacy upgrade collides', async () => {
    const source = post('same private post', { reactionCount: 9, commentCount: 5 });
    const oldLocator = unsaltedLegacyLeadLocator(source, options.groupSlug);
    const newLocator = legacyLeadLocator(source, options.groupSlug);
    const db = memorySupabase([
      { platform: 'facebook', kind: 'hot_thread', thread_id: null, locator: oldLocator, url: null, reactions: 1, num_comments: 1 },
      { platform: 'facebook', kind: 'hot_thread', thread_id: null, locator: newLocator, url: null, reactions: 2, num_comments: 2 },
    ]);

    const result = await writeEngagementLeads(db, engagementLeadsFromPosts([source], options));

    expect(result).toEqual({ inserted: 0, deduped: 1 });
    expect(db.rows).toHaveLength(2);
    expect(db.rows.find((row) => row.locator === oldLocator)).toMatchObject({ reactions: 1, num_comments: 1 });
    expect(db.rows.find((row) => row.locator === newLocator)).toMatchObject({ reactions: 9, num_comments: 5 });
  });

  it('uses a stable DOM post id to distinguish same-text posts without timestamps', () => {
    const leads = engagementLeadsFromPosts(
      [
        post('same text', { timestamp: undefined, domPostId: 'post-111' }),
        post('same text', { timestamp: undefined, domPostId: 'post-222' }),
      ],
      options,
    );
    expect(new Set(leads.map((lead) => lead.locator)).size).toBe(2);
    expect(JSON.stringify(leads)).not.toContain('post-111');
  });

  it('upgrades a v1 lead in place when v2 later supplies a permalink', async () => {
    const db = memorySupabase();
    const v1 = engagementLeadsFromPosts([post('same post')], options);
    const url = 'https://www.facebook.com/groups/101/posts/900/';
    const v2 = engagementLeadsFromPosts([post('same post', { permalink: url })], options);
    await writeEngagementLeads(db, v1);
    await writeEngagementLeads(db, v2);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({
      url,
      locator: v2[0].locator,
      reactions: 4,
      num_comments: 2,
    });
  });

  it('never backfills a row whose URL state does not match its exact key', async () => {
    const existing = {
      platform: 'facebook',
      kind: 'hot_thread',
      thread_id: null,
      locator: 'Facebook post h-deadbeef',
      url: 'https://www.facebook.com/groups/101/posts/different/',
      reactions: 99,
      num_comments: 88,
    };
    const db = memorySupabase([existing]);
    await backfillLeadMetrics(db, {
      ...existing,
      url: null,
      reactions: 1,
      num_comments: 2,
    });
    expect(db.rows[0]).toMatchObject({ reactions: 99, num_comments: 88 });
  });
});
