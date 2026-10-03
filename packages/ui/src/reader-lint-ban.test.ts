import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const lint = async (code: string, filePath: string) => {
  const [result] = await new ESLint().lintText(code, { filePath });
  return result?.messages.filter((m) => m.ruleId === 'no-restricted-imports') ?? [];
};

const root = process.cwd().replaceAll('\\', '/');
const reader = `${root}/apps/web/components/longlive/Fixture.tsx`;

describe('WP2.2-D reader import ban', { timeout: 30_000 }, () => {
  it.each([
    "import { getContentItem } from '@/lib/longlive/content';",
    "import { TRACKS } from '@/lib/longlive/tracks';",
    "import { theoriesForEra } from '@/lib/longlive/theories';",
    "import { x } from '@/lib/longlive/era-secrets';",
    "import { x } from '@/lib/longlive/threads';",
    "import { x } from '@/lib/longlive/videos';",
    "import { x } from '@/lib/longlive/song-moods.generated';",
    "import { x } from '@/lib/longlive/vault-wiring';",
    "import { x } from '@/lib/longlive/baked-modules';",
    "import { x } from '../../lib/longlive/content-vault.generated';",
  ])('rejects %s in a reader component', async (line) => {
    const messages = await lint(`${line}\nexport default 1;\n`, reader);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('useReader()');
  });

  it.each(['contentForThread', 'threadPoints', 'keepExploring', 'setTracksRawProvider'])(
    'rejects the injected wrapper %s from @swift2/experience',
    async (name) => {
      const messages = await lint(
        `import { ${name} } from '@swift2/experience';\nexport default ${name};\n`,
        reader,
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain('useReader()');
    },
  );

  it('rejects a banned import in packages/ui too', async () => {
    const messages = await lint(
      "import { x } from '@/lib/longlive/content';\nexport default x;\n",
      `${root}/packages/ui/src/fixture.ts`,
    );
    expect(messages).toHaveLength(1);
  });

  it('allows the snapshot hook, pure search re-exports and unrelated experience imports', async () => {
    const messages = await lint(
      [
        "import { useReader } from '@swift2/ui';",
        "import { searchDocs } from '@/lib/longlive/search';",
        "import { getEra } from '@swift2/experience';",
        'export default [useReader, searchDocs, getEra];',
      ].join('\n'),
      reader,
    );
    expect(messages).toHaveLength(0);
  });

  it.each([
    `${root}/apps/web/components/longlive/Fixture.test.tsx`,
    `${root}/apps/web/components/longlive/Fixture.server.ts`,
  ])('exempts %s', async (filePath) => {
    const messages = await lint(
      "import { getContentItem } from '@/lib/longlive/content';\nexport default getContentItem;\n",
      filePath,
    );
    expect(messages).toHaveLength(0);
  });
});
