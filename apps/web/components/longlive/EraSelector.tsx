'use client';

import { EraSelector as EraSelectorShell } from '@swift2/ui/reader/shell/EraSelector';
import { YourLongLiveCard } from './YourLongLiveCard';

export function EraSelector() {
  return <EraSelectorShell header={<YourLongLiveCard />} />;
}
