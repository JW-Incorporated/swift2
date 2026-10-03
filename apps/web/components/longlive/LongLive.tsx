'use client';

import dynamic from 'next/dynamic';
import { ReaderRoot, type ReaderSlots } from '@swift2/ui/reader/shell/ReaderShell';
import { WebReaderSnapshotProvider } from '@/lib/longlive/reader-snapshot-provider';
import { EraStream } from './EraStream';
import { ThreadsMode } from './ThreadsMode';
import { MoodChat } from './MoodChat';
import { ClownChat } from './ClownChat';
import { EraSelector } from './EraSelector';
import { MomentDetail } from './MomentDetail';
import { TrackGuide } from './TrackGuide';
import { TrackDetail } from './TrackDetail';
import { TheoryGuide } from './TheoryGuide';
import { ShareFallbackToast } from './ShareFallbackToast';
import { SearchOverlay } from './SearchOverlay';
import { SiteFooter } from './SiteFooter';
import { FeedbackButton } from './FeedbackButton';
import { CommunitySection } from './CommunitySection';
const MerchSection = dynamic(() => import('./MerchSection').then((module) => module.MerchSection));

const slots: ReaderSlots = {
  surfaces: {
    era: EraStream,
    threads: ThreadsMode,
    mood: MoodChat,
    clownbot: ClownChat,
    community: CommunitySection,
    merch: MerchSection,
  },
  overlays: [
    EraSelector,
    TrackGuide,
    TrackDetail,
    TheoryGuide,
    MomentDetail,
    ShareFallbackToast,
    SearchOverlay,
  ],
  footer: SiteFooter,
  floating: FeedbackButton,
  fallback: EraStream,
};

export const WEB_READER_SLOTS = slots;

export function LongLive() {
  return (
    <WebReaderSnapshotProvider>
      <ReaderRoot slots={slots} />
    </WebReaderSnapshotProvider>
  );
}
