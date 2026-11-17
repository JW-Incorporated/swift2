// @vitest-environment jsdom
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CURRENT_ERA_ID } from '@swift2/experience';
import { fromBakedCore } from '@swift2/experience/reader-snapshot';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { ReaderSnapshotProvider } from '@swift2/ui';
import { ReaderRoot } from '@swift2/ui/reader/shell/ReaderShell';
import { WEB_READER_SLOTS } from '../../components/longlive/LongLive';
import { TestHostProvider } from '../test-host';
import { bakedModules } from './baked-modules';

type Mods = ReturnType<typeof bakedModules>;

function html(mods: Mods): string {
  const snapshot = fromBakedCore(mods, { eraVideoFeed });
  return renderToString(
    <ReaderSnapshotProvider value={snapshot}>
      <TestHostProvider>
        <ReaderRoot slots={WEB_READER_SLOTS} />
      </TestHostProvider>
    </ReaderSnapshotProvider>,
  );
}

/** Same baked modules, keeping `keep`'s data only; ERAS (era-independent metadata the builder requires) stays whole. */
function onlyEra(keep: string): Mods {
  const full = bakedModules();
  const scoped = <T,>(read: (id: never) => T[]) => (id: string) => (id === keep ? read(id as never) : []);
  return {
    ERAS: full.ERAS,
    CONTENT: full.CONTENT.filter((c) => c.eraId === keep),
    MILESTONES: full.MILESTONES.filter((m) => m.eraId === keep),
    tracksForEra: scoped(full.tracksForEra),
    theoriesForEra: scoped(full.theoriesForEra),
    allVideoRecordsForEra: scoped(full.allVideoRecordsForEra),
    eraSecretsForEra: scoped(full.eraSecretsForEra),
  };
}

/**
 * Premise for lazy-loading the corpus: the server-rendered reader (default
 * navigation = CURRENT_ERA_ID, no cross-era reads at first render) does not
 * depend on any other era's data. Measured 2026-11-11: the two renders are
 * byte-identical, so no differing-region allowlist is needed.
 */
describe('reader first-render HTML depends only on the current era', () => {
  const full = html(bakedModules());

  it('is byte-identical with the full corpus and with the current era alone', () => {
    const filtered = onlyEra(CURRENT_ERA_ID);
    expect(filtered.CONTENT.length).toBeGreaterThan(0);
    expect(filtered.CONTENT.length).toBeLessThan(bakedModules().CONTENT.length);
    expect(full.length).toBeGreaterThan(100_000);
    expect(html(filtered)).toBe(full);
  });

  it('control: dropping the current era itself does change the HTML', () => {
    const other = bakedModules().ERAS.find((e) => e.id !== CURRENT_ERA_ID)!.id;
    expect(html(onlyEra(other))).not.toBe(full);
  });
});
