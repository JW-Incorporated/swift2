/**
 * Accessibility (PLAN WP2.3): after a native sheet (share) closes, return focus
 * to the element that triggered it. Wrap the bridge call: `withFocusRestore(() => client.call('share', p))`.
 */
export async function withFocusRestore<T>(fn: () => Promise<T>, doc?: Pick<Document, 'activeElement'>): Promise<T> {
  const trigger = (doc ?? (typeof document === 'undefined' ? null : document))?.activeElement;
  try {
    return await fn();
  } finally {
    if (trigger && trigger.isConnected && 'focus' in trigger) (trigger as HTMLElement).focus();
  }
}
