import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const lint = async (code: string, filePath: string) => {
  const [result] = await new ESLint().lintText(code, { filePath });
  return (
    result?.messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' || m.ruleId === 'no-restricted-syntax',
    ) ?? []
  );
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

  it.each([
    "import('next/image')",
    "import('next')",
    "import('react-native')",
    "import('react-native-svg')",
    "require('next/link')",
    "require('react-native')",
  ])('rejects %s', async (expr) => {
    const messages = await lint(
      `export const x = ${expr};\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('useHost()');
  });

  it.each(['../../../apps/web/lib/x', '../../apps/mobile/y', '../../../../swift2/apps/web/z'])(
    'rejects relative escape into apps: %s',
    async (spec) => {
      const messages = await lint(
        `import x from '${spec}';\nexport default x;\n`,
        `${root}/packages/ui/src/fixture.ts`,
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain('apps/*');
    },
  );

  it('allows dynamic import and require of other modules', async () => {
    const messages = await lint(
      `export const a = import('react');\nexport const b = require('next-themes');\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(0);
  });

  it.each([
    'import(`next/${"image"}`)',
    'require(`react-native`)',
    'require(`next/${"link"}`)',
    'import(spec)',
    'require(spec)',
    'require()',
    'require(...args)',
  ])('rejects non-literal specifier %s', async (expr) => {
    const messages = await lint(
      `declare const spec: string;\ndeclare const args: string[];\nexport const x = ${expr};\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0]?.message).toContain('non-literal');
  });

  it('allows a literal @swift2/ui-internal import', async () => {
    const messages = await lint(
      `export const a = import('@swift2/ui');\nexport const b = require('@swift2/ui');\n`,
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(0);
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
