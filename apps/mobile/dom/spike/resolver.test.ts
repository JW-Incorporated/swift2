/// <reference types="node" />
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const { createSpikeResolver, SHIMMED } = createRequire(import.meta.url)('./resolver.js') as {
  createSpikeResolver: (opts: {
    webRoot: string;
    spikeDir: string;
    pinned: Record<string, string>;
  }) => (
    context: { originModulePath: string },
    moduleName: string,
    platform: string | null,
    fallback: (ctx: { originModulePath: string }, name: string, platform: string | null) => unknown,
  ) => unknown;
  SHIMMED: string[];
};

const root = path.resolve('/repo');
const webRoot = path.join(root, 'apps/web');
const spikeDir = path.join(root, 'apps/mobile/dom/spike');
const pinned = {
  react: path.join(root, 'apps/mobile/node_modules/react'),
  'react-dom': path.join(root, 'apps/mobile/node_modules/react-dom'),
  scheduler: path.join(root, 'apps/mobile/node_modules/scheduler'),
};
const resolve = createSpikeResolver({ webRoot, spikeDir, pinned });

const fallback = (ctx: { originModulePath: string }, name: string) => ({ via: 'fallback', name, origin: ctx.originModulePath });
const webOrigin = path.join(webRoot, 'components/longlive/EraStream.tsx');
const libOrigin = path.join(webRoot, 'lib/longlive/threads.ts');
const shimFile = (name: string) => ({ type: 'sourceFile', filePath: path.join(spikeDir, 'shims', `${name}.ts`) });

describe('spike resolver: shims', () => {
  it.each(SHIMMED)('redirects %s for both specifier forms', (name) => {
    expect(resolve({ originModulePath: libOrigin }, `./${name}`, 'web', fallback)).toEqual(shimFile(name));
    expect(resolve({ originModulePath: webOrigin }, `@/lib/longlive/${name}`, 'web', fallback)).toEqual(shimFile(name));
    expect(resolve({ originModulePath: webOrigin }, `../../lib/longlive/${name}`, 'web', fallback)).toEqual(shimFile(name));
  });

  it('matches the resolved path, not the specifier: a same-named file elsewhere is untouched', () => {
    expect(resolve({ originModulePath: webOrigin }, './content', 'web', fallback)).toBeNull();
    expect(resolve({ originModulePath: libOrigin }, './content-vault.generated', 'web', fallback)).toBeNull();
    expect(resolve({ originModulePath: libOrigin }, './content.test', 'web', fallback)).toBeNull();
  });

  it('resolves other @/ imports to apps/web via the default resolver', () => {
    expect(resolve({ originModulePath: webOrigin }, '@/lib/utils', 'web', fallback)).toEqual({
      via: 'fallback',
      name: path.join(webRoot, 'lib/utils'),
      origin: webOrigin,
    });
  });
});

describe('spike resolver: next stubs', () => {
  it('stubs next/link and next/image', () => {
    expect(resolve({ originModulePath: webOrigin }, 'next/link', 'web', fallback)).toEqual({
      type: 'sourceFile',
      filePath: path.join(spikeDir, 'stubs/link.tsx'),
    });
    expect(resolve({ originModulePath: webOrigin }, 'next/image', 'web', fallback)).toEqual({
      type: 'sourceFile',
      filePath: path.join(spikeDir, 'stubs/image.tsx'),
    });
  });
});

describe('spike resolver: singletons', () => {
  it.each(['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'scheduler'])(
    'pins %s to the mobile copy for apps/web origins',
    (name) => {
      const base = name.split('/')[0] as keyof typeof pinned;
      expect(resolve({ originModulePath: webOrigin }, name, 'web', fallback)).toEqual({
        via: 'fallback',
        name,
        origin: path.join(pinned[base], 'package.json'),
      });
    },
  );
});

describe('spike resolver: scope', () => {
  const mobileOrigin = path.join(root, 'apps/mobile/dom/ReaderSpike.tsx');

  it.each(['ios', 'android', null])('does nothing on platform %s', (platform) => {
    for (const spec of ['./content', '@/lib/longlive/content', 'next/link', 'next/image', 'react', 'scheduler']) {
      expect(resolve({ originModulePath: webOrigin }, spec, platform, fallback)).toBeNull();
    }
  });

  it('does nothing for origins outside apps/web', () => {
    for (const spec of ['./content', '@/lib/longlive/content', 'next/link', 'next/image', 'react', 'scheduler']) {
      expect(resolve({ originModulePath: mobileOrigin }, spec, 'web', fallback)).toBeNull();
    }
  });

  it('does not treat a sibling directory sharing the apps/web prefix as apps/web', () => {
    const sibling = path.join(root, 'apps/web-other/x.ts');
    expect(resolve({ originModulePath: sibling }, 'next/link', 'web', fallback)).toBeNull();
  });

  it('leaves unrelated bare specifiers to the normal chain', () => {
    expect(resolve({ originModulePath: webOrigin }, 'lucide-react', 'web', fallback)).toBeNull();
  });
});
