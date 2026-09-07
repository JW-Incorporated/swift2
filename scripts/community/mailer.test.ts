import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  signAckToken,
  buildAckUrl,
  orderLeads,
  destinationLine,
  renderLeadCard,
  renderEmailHtml,
  renderEmailText,
  fetchLeadsToMail,
  markEmailed,
  MAX_LEADS_PER_EMAIL,
  SITE,
} from './mailer.mjs';

interface Lead {
  id: string;
  platform: string;
  community: string;
  kind: string;
  thread_id: string | null;
  url: string | null;
  locator: string | null;
  title: string | null;
  relevance: number | null;
  target_url: string | null;
  draft: string | null;
  draft_alt: string | null;
  link_included: boolean;
  status: string;
}

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    thread_id: 't3_abc',
    url: 'https://www.reddit.com/r/TaylorSwift/comments/abc/post/',
    locator: null,
    title: 'A hot thread',
    relevance: 0.5,
    target_url: null,
    draft: 'A paste-ready reply.',
    draft_alt: null,
    link_included: false,
    status: 'drafted',
    ...overrides,
  };
}

describe('signAckToken / buildAckUrl', () => {
  it('matches the shape community-ack-token.ts signs (leadId:action:linkIncluded)', () => {
    const secret = 'test-secret';
    const t1 = signAckToken(secret, { leadId: 'a', action: 'posted', linkIncluded: true });
    const t2 = signAckToken(secret, { leadId: 'a', action: 'posted', linkIncluded: false });
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[0-9a-f]+$/);
  });

  it('builds a URL under SITE with lead/action/token, and link only for posted', () => {
    const secret = 'test-secret';
    const postedUrl = buildAckUrl(secret, { leadId: 'a', action: 'posted', linkIncluded: true });
    expect(postedUrl.startsWith(`${SITE}/api/community/ack?`)).toBe(true);
    expect(postedUrl).toContain('lead=a');
    expect(postedUrl).toContain('action=posted');
    expect(postedUrl).toContain('link=1');

    const skipUrl = buildAckUrl(secret, { leadId: 'a', action: 'skip' });
    expect(skipUrl).toContain('action=skip');
    expect(skipUrl).not.toContain('link=');
  });

  it('is deterministic: same inputs, same token — a founder can click hours later', () => {
    const secret = 'test-secret';
    const a = signAckToken(secret, { leadId: 'x', action: 'posted', linkIncluded: false });
    const b = signAckToken(secret, { leadId: 'x', action: 'posted', linkIncluded: false });
    expect(a).toBe(b);
  });
});

describe('orderLeads', () => {
  it('puts reply_to_us leads first regardless of relevance', () => {
    const leads = [
      lead({ id: '1', kind: 'hot_thread', relevance: 0.9 }),
      lead({ id: '2', kind: 'reply_to_us', relevance: 0.1 }),
    ];
    expect(orderLeads(leads).map((l: Lead) => l.id)).toEqual(['2', '1']);
  });

  it('orders same-kind leads by descending relevance', () => {
    const leads = [
      lead({ id: '1', relevance: 0.3 }),
      lead({ id: '2', relevance: 0.8 }),
      lead({ id: '3', relevance: 0.5 }),
    ];
    expect(orderLeads(leads).map((l: Lead) => l.id)).toEqual(['2', '3', '1']);
  });

  it('sorts a null relevance last, not as a crash or a false top rank', () => {
    const leads = [
      lead({ id: '1', relevance: null }),
      lead({ id: '2', relevance: 0.2 }),
    ];
    expect(orderLeads(leads).map((l: Lead) => l.id)).toEqual(['2', '1']);
  });
});

describe('destinationLine', () => {
  it('links to the reddit permalink when present', () => {
    const line = destinationLine(lead());
    expect(line).toContain('Reddit');
    expect(line).toContain('href="https://www.reddit.com/r/TaylorSwift/comments/abc/post/"');
  });

  it('falls back to a plain community label with no url', () => {
    const line = destinationLine(lead({ url: null }));
    expect(line).toBe('Reddit · r/TaylorSwift');
  });

  it('renders a facebook locator, never a permalink', () => {
    const line = destinationLine(lead({ platform: 'facebook', locator: "Taylor Swift's Vault — some post", url: null }));
    expect(line).toContain('Facebook');
    expect(line).toContain('some post');
  });
});

describe('renderLeadCard', () => {
  it('includes the draft text and both ack links when a secret is given', () => {
    const html = renderLeadCard(lead(), { ackSecret: 'secret' });
    expect(html).toContain('A paste-ready reply.');
    expect(html).toContain('✅ Posted');
    expect(html).toContain('Skip');
    expect(html).toContain(`${SITE}/api/community/ack?`);
  });

  it('never renders ack links without a secret (never mints an unsafe token)', () => {
    const html = renderLeadCard(lead(), { ackSecret: null });
    expect(html).not.toContain('/api/community/ack');
  });

  it('shows a link candidate note only when link_included is false and a target_url exists', () => {
    const withCandidate = renderLeadCard(lead({ link_included: false, target_url: 'https://longlivets.com/x' }), { ackSecret: 's' });
    expect(withCandidate).toContain('Link candidate');

    const linked = renderLeadCard(lead({ link_included: true, target_url: 'https://longlivets.com/x' }), { ackSecret: 's' });
    expect(linked).not.toContain('Link candidate');
  });

  it('escapes draft text so a founder-hostile draft cannot break the email markup', () => {
    const html = renderLeadCard(lead({ draft: '<script>alert(1)</script>' }), { ackSecret: 's' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('says so plainly when the Answerer left no draft on the row', () => {
    const html = renderLeadCard(lead({ draft: null }), { ackSecret: 's' });
    expect(html).toContain('No draft on file.');
  });
});

describe('renderEmailHtml / renderEmailText', () => {
  it('titles the daily send "Community Tasks" and the replies-waiting send differently', () => {
    const daily = renderEmailHtml([lead()], { ackSecret: 's', mode: 'daily', date: '2026-09-07' });
    expect(daily).toContain('Community Tasks — 2026-09-07');

    const rw = renderEmailHtml([lead({ kind: 'reply_to_us' })], { ackSecret: 's', mode: 'replies-waiting', date: '2026-09-07' });
    expect(rw).toContain('Replies waiting — 2026-09-07');
  });

  it('never claims anything was already posted anywhere', () => {
    const html = renderEmailHtml([lead()], { ackSecret: 's', mode: 'daily', date: '2026-09-07' });
    expect(html.toLowerCase()).toContain('nothing here has been posted anywhere');
  });

  it("text fallback includes every lead's draft and the thread url", () => {
    const text = renderEmailText([lead(), lead({ id: '2', url: null, title: null })], { mode: 'daily', date: '2026-09-07' });
    expect(text).toContain('A paste-ready reply.');
    expect(text).toContain('https://www.reddit.com/r/TaylorSwift/comments/abc/post/');
    expect(text.match(/A paste-ready reply\./g)?.length).toBe(2);
  });
});

// Minimal fake of the Supabase query-builder surface `fetchLeadsToMail` /
// `markEmailed` use — same shape as scan.test.ts's fakeSupabase.
function fakeSupabase({
  rows = [] as Lead[],
  selectError = null as { message: string } | null,
  updateError = null as { message: string } | null,
  onUpdate = undefined as ((table: string, patch: unknown, ids: string[]) => void) | undefined,
} = {}) {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        limit: () => Promise.resolve({ data: rows, error: selectError }),
        update: (patch: unknown) => ({
          in: (_col: string, ids: string[]) => {
            onUpdate?.(table, patch, ids);
            return Promise.resolve({ error: updateError });
          },
        }),
      };
      return builder;
    },
  };
}

describe('fetchLeadsToMail', () => {
  it('fetches drafted leads and orders them (replies-to-us first)', async () => {
    const rows = [
      lead({ id: '1', kind: 'hot_thread', relevance: 0.9 }),
      lead({ id: '2', kind: 'reply_to_us', relevance: 0.1 }),
    ];
    const supabase = fakeSupabase({ rows });
    const result = await fetchLeadsToMail(supabase, { mode: 'daily' });
    expect(result.map((l: Lead) => l.id)).toEqual(['2', '1']);
  });

  it('caps at MAX_LEADS_PER_EMAIL even if the query returns more', async () => {
    const rows = Array.from({ length: MAX_LEADS_PER_EMAIL + 5 }, (_, i) => lead({ id: String(i), relevance: i }));
    const supabase = fakeSupabase({ rows });
    const result = await fetchLeadsToMail(supabase, { mode: 'daily' });
    expect(result.length).toBe(MAX_LEADS_PER_EMAIL);
  });

  it('never drops a reply_to_us lead behind an older backlog exceeding one email (regression: fetch-then-sort, not sort-then-fetch)', async () => {
    // A backlog of MAX_LEADS_PER_EMAIL older hot_thread leads plus ONE
    // newer reply_to_us lead — a DB-side `.limit(MAX_LEADS_PER_EMAIL)`
    // applied under the created_at sort (oldest-first) would silently
    // exclude the reply before orderLeads ever sees it. The pool fetch
    // (FETCH_POOL_LIMIT) must pull all of them so orderLeads can still put
    // the reply first.
    const rows = [
      ...Array.from({ length: MAX_LEADS_PER_EMAIL }, (_, i) => lead({ id: `old-${i}`, kind: 'hot_thread', relevance: 0.9 })),
      lead({ id: 'urgent-reply', kind: 'reply_to_us', relevance: 0.1 }),
    ];
    const supabase = fakeSupabase({ rows });
    const result = await fetchLeadsToMail(supabase, { mode: 'daily' });
    expect(result[0].id).toBe('urgent-reply');
    expect(result.length).toBe(MAX_LEADS_PER_EMAIL);
  });

  it('throws on a genuine db error rather than mailing a silently-empty batch', async () => {
    const supabase = fakeSupabase({ rows: [], selectError: { message: 'boom' } });
    await expect(fetchLeadsToMail(supabase, { mode: 'daily' })).rejects.toEqual({ message: 'boom' });
  });
});

describe('markEmailed', () => {
  it('is a no-op for an empty id list (never issues a pointless update)', async () => {
    let called = false;
    const supabase = fakeSupabase({ onUpdate: () => { called = true; } });
    await markEmailed(supabase, []);
    expect(called).toBe(false);
  });

  it('updates status=emailed for exactly the given ids', async () => {
    let seen: { table: string; patch: { status: string }; ids: string[] } | undefined;
    const supabase = fakeSupabase({ onUpdate: (table: string, patch: unknown, ids: string[]) => { seen = { table, patch: patch as { status: string }, ids }; } });
    await markEmailed(supabase, ['a', 'b']);
    expect(seen?.table).toBe('engagement_lead');
    expect(seen?.patch.status).toBe('emailed');
    expect(seen?.ids).toEqual(['a', 'b']);
  });

  it('retries a transient failure and succeeds without exhausting attempts', async () => {
    let calls = 0;
    const supabase = {
      from: () => ({
        update: () => ({
          in: () => {
            calls += 1;
            return Promise.resolve({ error: calls < 2 ? { message: 'transient' } : null });
          },
        }),
      }),
    };
    await markEmailed(supabase, ['a'], { attempts: 3, delayMs: 1, sleep: () => Promise.resolve() });
    expect(calls).toBe(2);
  });

  it('throws after exhausting all retry attempts (never re-mails silently on a persistent failure either)', async () => {
    const supabase = fakeSupabase({ updateError: { message: 'db down' } });
    await expect(markEmailed(supabase, ['a'], { attempts: 2, delayMs: 1, sleep: () => Promise.resolve() })).rejects.toEqual({ message: 'db down' });
  });
});
