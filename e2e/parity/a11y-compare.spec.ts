import { newViolations } from './a11y';
import { expect, test } from '@playwright/test';

// Unit-level: the baseline key is (rule, target, impact).
const t = JSON.stringify(['#x']);

test('same rule + target + impact is baselined', () => {
  const f = [{ id: 'color-contrast', impact: 'serious', targets: [t] }];
  expect(newViolations(f, f)).toEqual([]);
});

test('a serious -> critical escalation at a baselined node is new', () => {
  const base = [{ id: 'color-contrast', impact: 'serious', targets: [t] }];
  const found = [{ id: 'color-contrast', impact: 'critical', targets: [t] }];
  expect(newViolations(found, base)).toEqual([`[critical] color-contrast at ${t}`]);
});
