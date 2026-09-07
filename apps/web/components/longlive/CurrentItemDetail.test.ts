import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, 'CurrentItemDetail.tsx'), 'utf8');

describe('CurrentItemDetail — direct home navigation', () => {
  it('keeps a one-tap home control beside the close control', () => {
    expect(src).toContain("import { useAppActions } from '@/lib/longlive/store';");
    expect(src).toContain('const { goHome } = useAppActions();');
    expect(src).toContain('onClick={goHome}');
    expect(src).toContain('aria-label="Go to home"');
  });
});