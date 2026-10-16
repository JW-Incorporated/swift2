export function createLlmUsageLogger(client) {
  if (!client) return undefined;
  return async (row) => {
    const { error } = await client.from('llm_usage').insert(row);
    if (error) throw error;
  };
}

export const createClaudeUsageLogger = createLlmUsageLogger;
