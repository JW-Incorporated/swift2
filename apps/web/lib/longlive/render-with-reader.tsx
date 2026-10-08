import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { WebReaderSnapshotProvider } from './reader-snapshot-provider';

/** `render` under the web's reader-snapshot provider: what any component calling `useReader()` needs. */
export function renderWithReader(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options, wrapper: WebReaderSnapshotProvider });
}
