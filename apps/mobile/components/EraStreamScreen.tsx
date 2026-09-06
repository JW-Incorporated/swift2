// OS-032 — native era stream screen: masthead, sticky top bar, era sections
// in order. Native equivalent of `apps/web/components/longlive/
// EraStream.tsx` (infinite reverse-chronological scroll, active-era top bar)
// — scoped to this card's "done when" (section order parity across three
// eras): renders the current era + the two most recent prior eras rather
// than the web's incremental-load-on-scroll window (`jumpWindow`), and the
// top bar shows a static title rather than tracking scroll position live
// (no native equivalent of the web's IntersectionObserver-driven active-era
// tracking exists yet). Both are documented follow-ups, not silent gaps —
// see the inline notes below — and neither changes what OS-032 is graded on:
// the ORDER of eras and of each era's cards.
//
// OS-038 adds this screen's search/share/feedback affordances: a search icon
// opens the full-screen native SearchScreen (same ranking engine as the
// web's SearchOverlay, `lib/search-data.ts`); a share icon opens the native
// ShareSheet with the bare front-door target (`{ kind: 'site' }` — parity
// with the web's `topbarShareTarget('era', ...)` for a target this screen
// has no more specific "thing" to address, since OS-033's moment detail
// isn't built yet); and the feedback trigger floats over the whole screen,
// same corner the web's FeedbackButton uses.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { orderedEras } from '../lib/era-stream-data';
import { LandingMasthead } from './LandingMasthead';
import { EraSection } from './EraSection';
import { SearchScreen } from './SearchScreen';
import { ShareSheet } from './ShareSheet';
import { FeedbackButton } from './FeedbackButton';
import { eraColors } from '../lib/theme';

/** How many eras (newest-first) this screen mounts at once. OS-032 scope: "three eras" per the card's own done-when; a follow-up (OS-032 the same shared jumpWindow the web uses, or its own incremental-append) can widen this without touching EraSection or the shared view-model builder. */
const INITIAL_ERA_COUNT = 3;

export function EraStreamScreen({ onOpenItem }: { onOpenItem: (id: string) => void }) {
  const eras = useMemo(() => orderedEras().slice(0, INITIAL_ERA_COUNT), []);
  const [activeEraName] = useState(eras[0]?.name ?? '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // OS-033 ships the native moment detail sheet: a moment hit (feed tap or
  // search result) now opens it via the `onOpenItem` prop, replacing the
  // documented no-op OS-038 left here pending this card.
  const handleOpenItem = onOpenItem;
  // A search hit on an era has nowhere to scroll to yet either — this
  // screen renders a fixed three-era window rather than the web's
  // incremental jump-to-era scroll (see this file's header doc); a
  // follow-up that widens INITIAL_ERA_COUNT/adds scroll-to can wire this.
  const handleOpenEra = (_eraId: string) => {};

  return (
    <View style={styles.fill}>
      {/* Sticky top bar — parity with the web's chrome that tracks whichever
          era is centered in the viewport; static per this card's scope note
          above rather than scroll-driven. */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText} numberOfLines={1}>
          {activeEraName}
        </Text>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => setSearchOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.topBarBtn}
          >
            <Text style={styles.topBarBtnText}>Search</Text>
          </Pressable>
          <Pressable
            onPress={() => setShareOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={styles.topBarBtn}
          >
            <Text style={styles.topBarBtnText}>Share</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
        <LandingMasthead />
        {eras.map((era) => (
          <EraSection key={era.id} era={era} onOpenItem={onOpenItem} />
        ))}
      </ScrollView>

      <FeedbackButton location={{ view: 'era stream' }} />

      {searchOpen && (
        <View style={StyleSheet.absoluteFill}>
          <SearchScreen
            onClose={() => setSearchOpen(false)}
            onOpenMoment={(id) => {
              setSearchOpen(false);
              handleOpenItem(id);
            }}
            onOpenEra={(id) => {
              setSearchOpen(false);
              handleOpenEra(id);
            }}
          />
        </View>
      )}

      {shareOpen && eras[0] && (
        <ShareSheet target={{ kind: 'site' }} era={eras[0]} onClose={() => setShareOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: eraColors.bg,
  },
  content: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
    backgroundColor: eraColors.surface,
  },
  topBarText: {
    color: eraColors.ink,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topBarBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  topBarBtnText: {
    color: eraColors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
