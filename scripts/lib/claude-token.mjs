const PRIORITY_WORK = new Set(['content', 'P0', 'P1']);

function latestActiveReset(values, now) {
  return values
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()) && value > now)
    .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() ?? null;
}

/**
 * Selects the Claude subscription token class without exposing token values.
 * `limitState` is present only while the primary token is limited.
 */
export function selectClaudeToken({ limitState = null, hasBackup = false, priority } = {}) {
  if (!limitState) return { token: 'primary', reason: 'primary token available' };
  if (!PRIORITY_WORK.has(priority)) {
    return { token: 'none', reason: `skipped: weekly limit until ${limitState.resetAt}` };
  }
  if (hasBackup && limitState.backupResetAt) {
    const firstReset = new Date(limitState.resetAt) < new Date(limitState.backupResetAt)
      ? limitState.resetAt : limitState.backupResetAt;
    return { token: 'none', reason: `both tokens are limited until ${firstReset}` };
  }
  if (hasBackup) {
    return { token: 'backup', reason: `using backup token until ${limitState.resetAt}` };
  }
  if (priority !== 'content') {
    return { token: 'none', reason: `primary token limited until ${limitState.resetAt}` };
  }
  return {
    token: 'primary',
    reason: 'primary token limited; content priority keeps the primary token',
  };
}

/**
 * Token-class selector for scripted Claude calls. A token is limited while
 * either its weekly or five-hour reset is still in the future.
 */
export function selectClaudeCallToken({ limitState = null, hasBackup = false, priority, now = new Date() } = {}) {
  const current = new Date(now);
  const primaryResetAt = limitState && latestActiveReset([
    limitState.resetAt,
    limitState.weeklyResetAt,
    limitState.fiveHourResetAt,
  ], current);
  const backupResetAt = latestActiveReset([
    limitState?.backupResetAt,
    limitState?.backupWeeklyResetAt,
    limitState?.backupFiveHourResetAt,
  ], current);
  const decision = selectClaudeToken({
    limitState: primaryResetAt ? {
      resetAt: primaryResetAt,
      ...(backupResetAt ? { backupResetAt } : {}),
    } : null,
    hasBackup,
    priority,
  });
  if (decision.token !== 'none') return decision;
  const resetAt = backupResetAt && new Date(backupResetAt) < new Date(primaryResetAt)
    ? backupResetAt : primaryResetAt;
  return { ...decision, resetAt };
}
