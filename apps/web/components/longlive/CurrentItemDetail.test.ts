import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, 'CurrentItemDetail.tsx'), 'utf8');

describe('CurrentItemDetail — home navigation', () => {
  it('closes the local live-item overlay before returning home', () => {
    expect(src).toContain("import { useAppActions } from '@/lib/longlive/store';");
    expect(src).toContain('const { goHome } = useAppActions();');
    expect(src).toContain('function handleHome() {\n    onClose();\n    goHome();\n  }');
    expect(src).toContain('onClick={handleHome}');
    expect(src).not.toContain('onClick={goHome}');
    expect(src).toContain('aria-label="Go to home"');
  });
});