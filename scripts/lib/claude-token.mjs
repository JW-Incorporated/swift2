const PRIORITY_WORK = new Set(['content', 'P0', 'P1']);

/**
 * Selects the Claude subscription token class without exposing token values.
 * `limitState` is present only while the primary token is limited.
 */
export function selectClaudeToken({ limitState = null, hasBackup = false, priority } = {}) {
  if (!limitState) return { token: 'primary', reason: 'primary token available' };
  if (!PRIORITY_WORK.has(priority)) {
    return { token: 'none', reason: `skipped: weekly limit until ${limitState.resetAt}` };
  }
  if (hasBackup) {
    return { token: 'backup', reason: `using backup token until ${limitState.resetAt}` };
  }
  return {
    token: 'primary',
    reason: 'primary token limited; content priority keeps the primary token',
  };
}
