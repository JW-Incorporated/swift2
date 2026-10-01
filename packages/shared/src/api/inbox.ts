// Wire contract for `GET /api/notifications/inbox`. Server shape wins: the row
// is exactly what `getInboxEvents` (packages/core) returns, snake_case and all.

export interface InboxEventRow {
  id: string;
  category: string;
  tier: number;
  title: string;
  body: string;
  deep_link: string;
  available_at: string;
}

export interface InboxResponse {
  events: InboxEventRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isInboxEventRow(value: unknown): value is InboxEventRow {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.category === 'string' &&
    typeof value.tier === 'number' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.deep_link === 'string' &&
    typeof value.available_at === 'string'
  );
}

export function isInboxResponse(value: unknown): value is InboxResponse {
  return isRecord(value) && Array.isArray(value.events) && value.events.every(isInboxEventRow);
}
