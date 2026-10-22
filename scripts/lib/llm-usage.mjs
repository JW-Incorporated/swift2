import { createClaudeCaller } from './claude-call.mjs';
import { serviceClient } from './supabase.mjs';
export function createLlmUsageLogger(client) {
  if (!client) return undefined;
  return async (row) => {
    const { error } = await client.from('llm_usage').insert(row);
    if (error) throw error;
  };
}

export const createClaudeUsageLogger = createLlmUsageLogger;

let sharedCaller;

export function getLoggedClaudeCaller(env = process.env) {
  sharedCaller ??= createClaudeCaller({ usageLogger: createLlmUsageLogger(serviceClient(env)) });
  return sharedCaller;
}
