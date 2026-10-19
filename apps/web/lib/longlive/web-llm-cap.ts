/**
 * Shared knobs for the two reader-facing paid-key features (Mood Chat and
 * Clownbot) — HA #132 = keep, an explicit exception to D1 ("no Anthropic API"),
 * conditional on a hard daily cap (docs/decisions.md 2026-10-17).
 *
 * `LLM_WEB_DAILY_CAP` overrides each feature's default daily call cap. The cap
 * itself is enforced by `usage-db-gate.ts`'s durable `usage_daily` row (global,
 * UTC day) on top of each instance's in-process floor; over the cap, both
 * features degrade to their rule-based replies and never error to the reader.
 */

export const LLM_WEB_DAILY_CAP_ENV = 'LLM_WEB_DAILY_CAP';

/** The cap to enforce now: the env override when it is a positive integer,
 * else `fallback`. Read at call time so a redeploy-free env change applies. */
export function resolveWebDailyCap(
  fallback: number,
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env[LLM_WEB_DAILY_CAP_ENV];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export interface WebLlmUsageRow {
  caller: 'web-mood-chat' | 'web-clownbot';
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Ledger one paid-key call in `llm_usage` (provider 'claude') so the spend is
 * visible. Service-role PostgREST insert; best-effort — never throws, never
 * blocks the reader on a DB problem, and a no-op when Supabase env is absent.
 */
export async function logWebLlmUsage(
  row: WebLlmUsageRow,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;
  try {
    await fetchImpl(`${supabaseUrl}/rest/v1/llm_usage`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        caller: row.caller,
        provider: 'claude',
        model: row.model,
        input_tokens: row.inputTokens,
        output_tokens: row.outputTokens,
        calls: 1,
      }),
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // Best effort only.
  }
}
