export interface JevUsage {
  caller: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estCostUsd: number;
}

export { safelyLog } from '../llm/usage.ts';

export interface JevUsageRow {
  caller: string;
  provider: 'jev';
  model: string;
  token: null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: 0;
  cache_creation_input_tokens: null;
  calls: 1;
  est_cost_usd: number | null;
}

type UsageRowInput = Pick<JevUsage, 'caller' | 'model'>
  & Partial<Pick<JevUsage, 'inputTokens' | 'outputTokens' | 'estCostUsd'>>;

export function usageRow(usage: UsageRowInput): JevUsageRow {
  return {
    caller: usage.caller,
    provider: 'jev',
    model: usage.model,
    token: null,
    input_tokens: usage.inputTokens ?? 0,
    output_tokens: usage.outputTokens ?? 0,
    cache_read_tokens: 0,
    cache_creation_input_tokens: null,
    calls: 1,
    est_cost_usd: usage.estCostUsd ?? null,
  };
}

export function usageRowFromResponse(
  raw: unknown,
  caller: string,
  model: string,
  inputUsdPerMillionTokens: number,
): JevUsageRow {
  const response = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const usage = response.usage && typeof response.usage === 'object' && !Array.isArray(response.usage)
    ? response.usage as Record<string, unknown>
    : {};
  const inputTokens = Number.isFinite(usage.input_tokens) ? usage.input_tokens as number : undefined;
  const outputTokens = Number.isFinite(usage.output_tokens) ? usage.output_tokens as number : undefined;
  return usageRow({
    caller,
    model,
    inputTokens,
    outputTokens,
    estCostUsd: inputTokens === undefined
      ? undefined
      : (inputTokens * inputUsdPerMillionTokens) / 1_000_000,
  });
}
