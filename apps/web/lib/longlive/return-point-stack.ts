export function takeMatchingReturnPoint<T extends { mode: string; eraId: string }>(
  stack: readonly T[],
  restored: Pick<T, 'mode' | 'eraId'>,
): { stack: readonly T[]; returnPoint: T | null } {
  const top = stack[stack.length - 1];
  if (!top) return { stack, returnPoint: null };

  const matches = top.mode === restored.mode && top.eraId === restored.eraId;
  if (!matches) return { stack, returnPoint: null };

  return { stack: stack.slice(0, -1), returnPoint: top };
}
