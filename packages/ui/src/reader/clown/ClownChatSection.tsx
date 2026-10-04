'use client';

import { ReaderExtensionsProvider, useLore } from '@swift2/ui';
import type { ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import { ClownChat } from './ClownChat';

function ClownChatWithLore() {
  return <ClownChat lore={useLore()} />;
}

/** Attaches the host-supplied extensions, then feeds ClownChat its lore from the snapshot; ClownChat itself stays prop-driven. */
export function ClownChatSection({ extensions }: { extensions: ReaderSnapshotExtensions }) {
  return (
    <ReaderExtensionsProvider extensions={extensions}>
      <ClownChatWithLore />
    </ReaderExtensionsProvider>
  );
}
