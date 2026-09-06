// OS-038 — native share sheet: the RN equivalent of
// `apps/web/components/longlive/ShareSheet.tsx`. Uses the SAME copy
// builders and `buildShareUrl` from `@swift2/experience`'s `share-copy.ts`
// (moved there from the web-only `apps/web/lib/longlive/share.ts` as part
// of this card) so a moment/era/track share reads identically on both
// surfaces. React Native's built-in `Share` API stands in for
// `navigator.share`/clipboard fallback — no native module is unmounted
// when it's unavailable, `Share.share` always resolves.
import { Share as RNShare, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  buildShareUrl,
  momentShareCopy,
  siteShareCopy,
  type ContentItem,
  type Era,
  type ShareCopy,
  type ShareTarget,
} from '@swift2/experience';
import { eraColors } from '../lib/theme';
import { SITE_URL } from './SiteShell';

export interface ShareSheetProps {
  target: ShareTarget;
  onClose: () => void;
  /** Only 'item' targets need the moment's own fields for rich copy — see `momentShareCopy`. Undefined for every other target kind. */
  item?: Pick<ContentItem, 'title' | 'summary' | 'dateLabel' | 'confidence'>;
  era: Pick<Era, 'name'>;
}

function copyFor(target: ShareTarget, item: ShareSheetProps['item'], era: Pick<Era, 'name'>): ShareCopy {
  if (target.kind === 'item' && item) return momentShareCopy(item, era);
  if (target.kind === 'site') return siteShareCopy();
  // Every other target kind (era/lens/track/trackGuide/theoryGuide/threads/
  // mood/clownbot/community/merch) has its own *ShareCopy builder in
  // share-copy.ts; wiring the rest in is a one-line addition per follow-up
  // screen that opens them natively (OS-034/OS-035/OS-037), same scope note
  // as MomentCard.tsx's PlaceholderFeedRow.
  return { title: 'Long Live', text: 'Long Live — the Taylor Swift time machine.' };
}

export function ShareSheet({ target, onClose, item, era }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const copy = copyFor(target, item, era);
  const shareUrl = buildShareUrl(target, SITE_URL);

  async function onShare() {
    try {
      await RNShare.share({ title: copy.title, message: `${copy.text} ${shareUrl}` });
    } catch {
      /* user cancelled or the OS refused — nothing sensible to do */
    }
  }

  async function onCopy() {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Share card</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close share">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.text}</Text>
        <View style={styles.buttonsRow}>
          <Pressable onPress={onShare} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Share</Text>
          </Pressable>
          <Pressable onPress={onCopy} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy link'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    backgroundColor: eraColors.surface,
    borderWidth: 1,
    borderColor: eraColors.line,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { color: eraColors.inkSoft, fontSize: 13, fontWeight: '600' },
  closeText: { color: eraColors.ink, fontSize: 16 },
  title: { color: eraColors.ink, fontSize: 18, fontWeight: '700' },
  body: { color: eraColors.inkSoft, fontSize: 14, lineHeight: 20 },
  buttonsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  shareBtn: {
    flex: 1,
    backgroundColor: eraColors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: { color: eraColors.bg, fontWeight: '700', fontSize: 14 },
  copyBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: eraColors.line,
  },
  copyBtnText: { color: eraColors.ink, fontWeight: '600', fontSize: 14 },
});
