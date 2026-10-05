import { describe, expect, it } from 'vitest';
import { resultFits } from './client-util';
import { DOM_COMMAND_TYPES } from './messages';
import type { DomCommandType } from './messages';

// Runtime half of the resultFits gate (the compile-time half is the exhaustive Record in client-util):
// a registered command with no result shape fails here by name.
describe('resultFits covers every DOM command', () => {
  it.each(DOM_COMMAND_TYPES)('%s has a result shape', (type) => {
    expect(() => resultFits(type, null)).not.toThrow();
  });

  it('a kind outside the registry throws rather than passing', () => {
    expect(() => resultFits('nope' as DomCommandType, null)).toThrow(/no result shape/);
  });

  it('optOutPending accepts only { pending: boolean }', () => {
    expect(resultFits('notifications.optOutPending', { pending: true })).toBe(true);
    expect(resultFits('notifications.optOutPending', { pending: 'y' })).toBe(false);
    expect(resultFits('notifications.optOutPending', { pending: true, x: 1 })).toBe(false);
    expect(resultFits('notifications.optOutPending', null)).toBe(false);
  });
});
