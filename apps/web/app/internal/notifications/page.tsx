import {
  loadMetrics,
  MUTE_RATE_FLAG_THRESHOLD,
  type NotificationMetrics,
} from '@swift2/core/notifications-server';
import { authorizedForDashboard } from '@/app/api/notifications/metrics/route';
import { supabaseAdmin } from '@/lib/supabase-server';

// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §11) —
// the internal metrics dashboard. Server-rendered (no client fetch round
// trip needed — `loadMetrics` runs directly at request time), gated by the
// same `?secret=` query param `/api/notifications/metrics` checks (see
// that route's header for the tradeoff reasoning). Not in the sitemap, not
// linked from anywhere in the public app.
export const dynamic = 'force-dynamic';

function pct(rate: number | null): string {
  if (rate === null) return '\u2014';
  return `${(rate * 100).toFixed(1)}%`;
}

export default async function NotificationsInternalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!authorizedForDashboard(secret ?? null)) {
    const configured = Boolean(process.env.NOTIFICATIONS_DASHBOARD_SECRET);
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-xl font-semibold text-ink">
          {configured ? 'Unauthorized' : 'Dashboard not configured'}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {configured
            ? 'This link needs a valid ?secret= to view the dashboard.'
            : 'NOTIFICATIONS_DASHBOARD_SECRET isn\u2019t set in this environment yet \u2014 see SETUP_NOTIFICATIONS.md.'}
        </p>
      </main>
    );
  }

  const db = supabaseAdmin();
  if (!db) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-xl font-semibold text-ink">Not wired up yet</h1>
        <p className="mt-2 text-sm text-ink-soft">
          SUPABASE_SERVICE_ROLE_KEY isn&rsquo;t set in this environment.
        </p>
      </main>
    );
  }

  let metrics: NotificationMetrics;
  try {
    metrics = await loadMetrics(db);
  } catch (err) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-xl font-semibold text-ink">Failed to load metrics</h1>
        <p className="mt-2 text-sm text-ink-soft">{(err as Error).message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-ink">Notifications \u2014 internal metrics</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Last 30 days. Generated {new Date(metrics.generatedAt).toLocaleString()}.
      </p>

      {!metrics.hasData && (
        <p className="mt-6 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          No devices registered yet \u2014 every number below is seeded/test data until real traffic
          arrives. This is expected before launch.
        </p>
      )}

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total devices" value={String(metrics.totalDevices)} />
        <Stat label="Opt-in rate*" value={pct(metrics.optInRate)} />
        <Stat label="Master-off rate" value={pct(metrics.masterOffRate)} />
        <Stat label="Devices master-off" value={String(metrics.devicesMasterOff)} />
      </section>
      <p className="mt-2 text-xs text-ink-soft">
        *Opt-in rate here is devices-with-a-push-token \u00f7 all devices \u2014 a proxy for spec
        \u00a711&rsquo;s true metric (opt-in \u00f7 pre-permission-screen viewers), since this app
        has no event for &ldquo;viewed the screen but declined.&rdquo;
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Open rate by category</h2>
        <Table
          rows={metrics.openRateByCategory}
          columns={[
            { key: 'category', label: 'Category' },
            { key: 'sent', label: 'Sent' },
            { key: 'opened', label: 'Opened' },
            {
              key: 'openRate',
              label: 'Open rate',
              format: (r) => pct(r.openRate as number | null),
            },
          ]}
          emptyText="No deliveries in the last 30 days."
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">
          Mute-within-1h rate by category{' '}
          <span className="text-xs font-normal text-ink-soft">
            (flagged above {(MUTE_RATE_FLAG_THRESHOLD * 100).toFixed(0)}%)
          </span>
        </h2>
        <Table
          rows={metrics.muteRateByCategory}
          columns={[
            {
              key: 'category',
              label: 'Category',
              format: (r) =>
                r.flagged ? `\u26a0\ufe0f ${r.category as string}` : (r.category as string),
            },
            { key: 'sent', label: 'Sent' },
            { key: 'mutedWithin1h', label: 'Muted \u22641h' },
            {
              key: 'muteRate',
              label: 'Mute rate',
              format: (r) => pct(r.muteRate as number | null),
            },
          ]}
          emptyText="No deliveries in the last 30 days."
        />
        {metrics.flaggedCategories.length > 0 && (
          <p className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">
            Review needed: {metrics.flaggedCategories.join(', ')} exceed the 2% mute-after-push
            guardrail (spec \u00a711).
          </p>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Table<T extends object>({
  rows,
  columns,
  emptyText,
}: {
  rows: readonly T[];
  columns: { key: string; label: string; format?: (row: T) => string }[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-ink-soft">{emptyText}</p>;
  }
  return (
    <table className="mt-3 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-white/10 text-left text-ink-soft">
          {columns.map((c) => (
            <th key={c.key} className="py-2 pr-4 font-medium">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-white/5 text-ink">
            {columns.map((c) => (
              <td key={c.key} className="py-2 pr-4">
                {c.format ? c.format(row) : String((row as Record<string, unknown>)[c.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
