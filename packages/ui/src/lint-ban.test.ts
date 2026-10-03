import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const lint = async (code: string, filePath: string) => {
  const [result] = await new ESLint().lintText(code, { filePath });
  return result?.messages.filter((m) => m.ruleId === 'no-restricted-imports') ?? [];
};

const root = process.cwd().replaceAll('\\', '/');

describe('packages/ui import ban', { timeout: 30_000 }, () => {
  it.each([
    'next/image',
    'next/link',
    'next',
    'react-native',
    'react-native-svg',
    'react-native/Libraries/Foo',
  ])('rejects %s', async (spec) => {
    const messages = await lint(
      `import x from '${spec}';\nexport default x;\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('useHost()');
  });

  it('allows react', async () => {
    const messages = await lint(
      `import { useState } from 'react';\nexport { useState };\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(0);
  });

  it('does not restrict other packages', async () => {
    const messages = await lint(
      `import x from 'next/image';\nexport default x;\n`,
      `${root}/packages/shared/src/fixture.ts`,
    );
    expect(messages).toHaveLength(0);
  });
});
