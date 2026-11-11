'use client';

import dynamic from 'next/dynamic';
import { ReaderRoot, type ReaderSlots } from '@swift2/ui/reader/shell/ReaderShell';
import { WebReaderSnapshotProvider } from '@/lib/longlive/reader-snapshot-provider';
import { EraStream } from './EraStream';
import { ShareFallbackToast } from './ShareFallbackToast';
import { SiteFooter } from './SiteFooter';
import { FeedbackButton } from './FeedbackButton';
const ThreadsMode = dynamic(() => import('./ThreadsMode').then((module) => module.ThreadsMode));
const MoodChat = dynamic(() => import('./MoodChat').then((module) => module.MoodChat));
const EraSelector = dynamic(() => import('./EraSelector').then((module) => module.EraSelector), { ssr: false });
const MomentDetail = dynamic(() => import('./MomentDetail').then((module) => module.MomentDetail), { ssr: false });
const TrackGuide = dynamic(() => import('./TrackGuide').then((module) => module.TrackGuide), { ssr: false });
const TrackDetail = dynamic(() => import('./TrackDetail').then((module) => module.TrackDetail), { ssr: false });
const TheoryGuide = dynamic(() => import('./TheoryGuide').then((module) => module.TheoryGuide), { ssr: false });
const SearchOverlay = dynamic(() => import('./SearchOverlay').then((module) => module.SearchOverlay), { ssr: false });
const CommunitySection = dynamic(() => import('./CommunitySection').then((module) => module.CommunitySection));
const MerchSection = dynamic(() => import('./MerchSection').then((module) => module.MerchSection));

const WebClownChat = dynamic(async () => {
  const [{ ClownChatSection }, { CLOWN_EXTENSIONS }] = await Promise.all([
    import('@swift2/ui/reader/clown/ClownChatSection'),
    import('@/lib/longlive/clown-extensions'),
  ]);
  return function WebClownChat() {
    return <ClownChatSection extensions={CLOWN_EXTENSIONS} />;
  };
});

const slots: ReaderSlots = {
  surfaces: {
    era: EraStream,
    threads: ThreadsMode,
    mood: MoodChat,
    clownbot: WebClownChat,
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
