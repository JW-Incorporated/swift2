// OS-033 — native moment detail sheet.
//
// Phase 3 of docs/specs/2026-09-05-one-source-three-surfaces.md: the native
// equivalent of `apps/web/components/longlive/MomentDetail.tsx`, scoped to
// this card's own goal ("sheet with body, sources, media (YouTube/Spotify/
// Instagram via embedded WebView inside the sheet), share") rather than the
// web page's full feature surface (rumors section, shop-the-look, clue web,
// related-moments rail, lightbox gallery) — those are tracked as native
// follow-ups, not silently dropped: every field this component doesn't yet
// render is a field the web's own MomentDetail also treats as optional, so
// omitting it here degrades to "less detail", never a broken moment.
//
// Media (YouTube/Spotify/Instagram) all embed via one `react-native-webview`
// instance per playable source rather than three different native SDKs —
// same click-to-load-facade posture the web's MomentVideo/MomentSocialPost
// use (poster + one tap loads the player), so nothing fetches a third party
// until the reader opts in.
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { extractYouTubeId } from '@swift2/shared';
import {
  formatFullDate,
  getEra,
  isSubConfirmed,
  primaryImageRef,
  type Confidence,
  type ContentItem,
  type EggSource,
  type MomentVideo,
  type SocialPost,
  type SubConfirmed,
} from '@swift2/experience';
import { loadMomentById } from '../lib/era-stream-data';
import { eraColors } from '../lib/theme';

/** Mirrors `MomentDetail.tsx`'s CONFIDENCE_BANNER — same copy, native chrome. */
const CONFIDENCE_BANNER: Record<SubConfirmed, { label: string; blurb: string }> = {
  reputable_reporting: {
    label: 'Reported — not confirmed',
    blurb: 'Press reporting. Not confirmed by Taylor, her team, or an official source.',
  },
  strong_fan_consensus: {
    label: 'Rumor — unconfirmed',
    blurb: 'Widely believed by fans, but never confirmed.',
  },
  plausible: {
    label: 'Rumor — unconfirmed',
    blurb: 'A plausible but unconfirmed claim.',
  },
  clowning: {
    label: 'Rumor — unconfirmed',
    blurb: 'Fans are joking-but-hoping. Nothing here is confirmed.',
  },
  disproven: {
    label: 'Debunked',
    blurb: 'This claim has been disproven.',
  },
  joke_meme: {
    label: 'Joke / meme — not a real claim',
    blurb: 'Circulating as a joke, not as fact.',
  },
};

const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.longlivets.com').replace(/\/$/, '');

/** `?item=<id>` — the same share-link shape `ShareSheet.tsx`'s `shareUrl` builds for `share.kind === 'item'`, so a moment shared FROM this sheet round-trips back to the same native screen via `destinationFor`/`resolve` (OS-033's own routing change). */
function shareUrlFor(itemId: string): string {
  return `${SITE_URL}?item=${encodeURIComponent(itemId)}`;
}

/** One embedded player: a click-to-load facade (poster + play control) that mounts a WebView on tap — the same privacy posture `MomentVideo`/`MomentSocialPost` use on the web (nothing fetches YouTube/Spotify/Instagram until the reader opts in). */
function EmbeddedMedia({
  label,
  posterUri,
  embedHtml,
  aspectRatio = 16 / 9,
}: {
  label: string;
  posterUri?: string;
  embedHtml: string;
  aspectRatio?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={[styles.mediaFrame, { aspectRatio }]}>
      {loaded ? (
        <WebView
          source={{ html: embedHtml }}
          style={styles.fill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
        />
      ) : (
        <Pressable
          onPress={() => setLoaded(true)}
          style={styles.mediaPoster}
          accessibilityRole="button"
          accessibilityLabel={`Play ${label}`}
        >
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <View style={styles.mediaPosterOverlay} />
          <View style={styles.mediaPlayGlyph}>
            <Text style={styles.mediaPlayGlyphText}>▶</Text>
          </View>
          <Text style={styles.mediaPosterLabel} numberOfLines={2}>
            {label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function youtubeEmbed(video: MomentVideo): { posterUri: string; embedHtml: string } {
  return {
    posterUri: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
    embedHtml: `<!doctype html><html><body style="margin:0;background:#000"><iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></body></html>`,
  };
}

function spotifyEmbed(albumId: string, albumTitle: string): { embedHtml: string } {
  // Spotify's own embed widget — no poster of its own (its iframe already
  // renders a compact player chrome, unlike YouTube's raw video surface), so
  // the facade names the album instead.
  return {
    embedHtml: `<!doctype html><html><body style="margin:0;background:#121212"><iframe src="https://open.spotify.com/embed/album/${albumId}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></body></html>`,
  };
}

function instagramEmbed(post: SocialPost): { embedHtml: string } {
  return {
    embedHtml: `<!doctype html><html><body style="margin:0;background:#fff"><iframe src="https://www.instagram.com/p/${post.shortcode}/embed/captioned" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy"></body></html>`,
  };
}

function ConfidenceBanner({ confidence, outlet }: { confidence: Confidence; outlet?: string }) {
  if (!isSubConfirmed(confidence)) return null;
  const banner = CONFIDENCE_BANNER[confidence];
  return (
    <View style={styles.confidenceBanner}>
      <Text style={styles.confidenceLabel}>
        {banner.label}
        {outlet ? ` · per ${outlet}` : ''}
      </Text>
      <Text style={styles.confidenceBlurb}>{banner.blurb}</Text>
    </View>
  );
}

function SourcesList({ sources }: { sources: EggSource[] }) {
  return (
    <View style={styles.sourcesBlock}>
      <Text style={styles.sourcesLabel}>{sources.length > 1 ? 'Sources' : 'Source'}</Text>
      {sources.map((s, i) => (
        <Pressable key={`${s.url}-${i}`} onPress={() => Linking.openURL(s.url)}>
          <Text style={styles.sourceLink}>{s.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function MomentSheet({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'not-found' }
    | { status: 'ready'; item: ContentItem }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadMomentById(itemId)
      .then((item) => {
        if (cancelled) return;
        setState(item ? { status: 'ready', item } : { status: 'not-found' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const onShare = useMemo(
    () => async () => {
      if (state.status !== 'ready') return;
      const url = shareUrlFor(state.item.id);
      try {
        await Share.share({ message: `${state.item.title} — ${state.item.summary} ${url}`, url });
      } catch {
        /* user cancelled — no-op, matches the web's ShareSheet swallowing a cancelled navigator.share() */
      }
    },
    [state],
  );

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={eraColors.accent} />
      </View>
    );
  }

  if (state.status === 'not-found' || state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {state.status === 'not-found' ? "Couldn't find this moment." : 'Something went wrong loading this moment.'}
        </Text>
        <Pressable onPress={onClose} style={styles.closeButtonInline}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const { item } = state;
  const era = getEra(item.eraId);
  const hero = primaryImageRef(item);
  // Every playable source this sheet mounts, in order: the moment's own
  // video, its social post, then any YouTube source citations (mirrors
  // `footnoteVideoSources` minus the de-dupe-against-item.video subtlety,
  // out of scope for this card's own "done when").
  const youtubeSources = (item.sources ?? [])
    .map((s) => ({ source: s, youtubeId: extractYouTubeId(s.url) }))
    .filter((s): s is { source: EggSource; youtubeId: string } => Boolean(s.youtubeId))
    .filter((s) => s.youtubeId !== item.video?.youtubeId);

  return (
    <View style={[styles.fill, { backgroundColor: era.theme.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={[styles.topBarButton, { color: era.theme.ink }]}>Close</Text>
        </Pressable>
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share this moment">
          <Text style={[styles.topBarButton, { color: era.theme.accent }]}>Share</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {hero ? (
          <Image source={{ uri: hero.url }} style={styles.hero} resizeMode="cover" />
        ) : null}

        <Text style={[styles.eyebrow, { color: era.theme.inkSoft }]}>
          {era.name} · {item.dateLabel}
        </Text>
        <Text style={[styles.title, { color: era.theme.ink }]}>{item.title}</Text>

        {item.confidence ? (
          <ConfidenceBanner confidence={item.confidence} outlet={item.sources?.[0]?.name} />
        ) : null}

        {item.video ? (
          <EmbeddedMedia label={`Play video: ${item.video.title}`} {...youtubeEmbed(item.video)} />
        ) : null}

        {era.media?.spotifyAlbumId ? (
          <EmbeddedMedia
            label={`Listen on Spotify: ${era.media.albumTitle}`}
            aspectRatio={1}
            {...spotifyEmbed(era.media.spotifyAlbumId, era.media.albumTitle)}
          />
        ) : null}

        {item.socialPost ? (
          <EmbeddedMedia label={item.socialPost.label} aspectRatio={4 / 5} {...instagramEmbed(item.socialPost)} />
        ) : null}

        <View style={styles.body}>
          {item.body.map((para, i) => (
            <Text key={i} style={[styles.paragraph, { color: era.theme.ink }]}>
              {para}
            </Text>
          ))}
        </View>

        {youtubeSources.map(({ source, youtubeId }, i) => (
          <EmbeddedMedia
            key={`src-${source.url}-${i}`}
            label={source.name}
            {...youtubeEmbed({ youtubeId, title: source.name })}
          />
        ))}

        {item.sources && item.sources.length > 0 ? <SourcesList sources={item.sources} /> : null}

        <Text style={[styles.footnote, { color: era.theme.inkSoft }]}>
          Sourced and dated · {formatFullDate(item.date)}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: eraColors.bg,
    padding: 24,
  },
  errorText: {
    color: eraColors.inkSoft,
    fontSize: 15,
    textAlign: 'center',
  },
  closeButtonInline: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: eraColors.line,
  },
  closeButtonText: {
    color: eraColors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: eraColors.line,
  },
  topBarButton: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 48,
  },
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  eyebrow: {
    marginTop: 16,
    marginHorizontal: 20,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 6,
    marginHorizontal: 20,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  confidenceBanner: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: eraColors.accent,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: eraColors.accent,
  },
  confidenceBlurb: {
    marginTop: 4,
    fontSize: 13,
    color: eraColors.inkSoft,
    lineHeight: 18,
  },
  mediaFrame: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: eraColors.surface,
    borderWidth: 1,
    borderColor: eraColors.line,
  },
  mediaPoster: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPosterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  mediaPlayGlyph: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: eraColors.accent,
  },
  mediaPlayGlyphText: {
    color: eraColors.bg,
    fontSize: 20,
  },
  mediaPosterLabel: {
    marginTop: 10,
    marginHorizontal: 16,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  body: {
    marginTop: 20,
    marginHorizontal: 20,
    gap: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  sourcesBlock: {
    marginTop: 24,
    marginHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: eraColors.line,
    gap: 6,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: eraColors.inkSoft,
  },
  sourceLink: {
    fontSize: 13,
    color: eraColors.accent,
    textDecorationLine: 'underline',
  },
  footnote: {
    marginTop: 20,
    marginHorizontal: 20,
    fontSize: 11,
  },
});
