import { describe, expect, it } from 'vitest';
import { directoryLinkType } from './sync-web-react-globalSetup';

describe('directoryLinkType', () => {
  it.each([
    ['win32', 'junction'],
    ['linux', 'dir'],
    ['darwin', 'dir'],
  ] as const)('selects %s link type', (platform, expected) => {
    expect(directoryLinkType(platform)).toBe(expected);
  });
});
