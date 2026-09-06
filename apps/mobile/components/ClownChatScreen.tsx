// OS-036 — native Clownbot chat screen. Native equivalent of
// `apps/web/components/longlive/ClownChat.tsx`, scoped to this card's
// "native Clownbot + mood chat" — a single chat surface with a mode toggle
// switches between asking Clownbot questions and the mood matcher, since
// both are "type a message, get a themed answer" surfaces and the mobile
// nav has no room for two separate top-level chat screens yet (a documented
// scope note, not a silent gap — a future card can split them if the
// founder wants two entry points).
//
// Renders every `ClownAnswer` segment/source/investigation-trail field the
// web does (`ClownMessageRow.tsx`), just with RN `View`/`Text` instead of
// styled `div`s — no rhetorical structure (stance/argument/counterpoint/
// aside) is dropped, matching that file's own "may not drop one" rule.
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { MoodMatch } from '@swift2/experience';
import { askClown, type ClownAnswer, type ClownTurn } from '../lib/clown-client';
import { askMood, type MoodResult } from '../lib/mood-client';
import { clownColors, eraColors } from '../lib/theme';

type Mode = 'clown' | 'mood';

interface ClownTranscriptTurn {
  id: string;
  kind: 'clown';
  question: string;
  answer: ClownAnswer;
}

const MAX_TEXT = 600;
const NETWORK_ERROR = "That didn't go through. Try again in a moment?";

function segmentStyle(role: ClownAnswer['segments'][number]['role']) {
  switch (role) {
    case 'counterpoint':
      return styles.segmentCounterpoint;
    case 'aside':
      return styles.segmentAside;
    default:
      return styles.segmentPlain;
  }
}

function ClownAnswerView({ answer }: { answer: ClownAnswer }) {
  return (
    <View style={styles.answerBlock}>
      {(answer.theoryName || answer.delulu !== null) && (
        <View style={styles.badgeRow}>
          {answer.theoryName && (
            <View style={styles.theoryBadge}>
              <Text style={styles.theoryBadgeText}>{answer.theoryName}</Text>
            </View>
          )}
          {answer.delulu !== null && (
            <View style={styles.deluluBadge}>
              <Text style={styles.deluluBadgeText}>Delulu {answer.delulu}/5</Text>
            </View>
          )}
        </View>
      )}
      {answer.segments.map((seg, i) => (
        <Text key={i} style={segmentStyle(seg.role)}>
          {seg.text}
        </Text>
      ))}
      {answer.sources.length > 0 && (
        <View style={styles.sourceRow}>
          {answer.sources.map((s) => (
            <View key={s.id} style={styles.sourceChip}>
              <Text style={styles.sourceChipText}>
                {s.status.toUpperCase()} · {s.headline}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MoodResultView({ result }: { result: MoodResult }) {
  if (result.kind === 'crisis') {
    return (
      <View style={styles.answerBlock}>
        {result.message.map((line, i) => (
          <Text key={i} style={i === 0 ? styles.moodCrisisTitle : styles.segmentPlain}>
            {line}
          </Text>
        ))}
      </View>
    );
  }
  if (result.kind === 'refusal' || result.kind === 'unclear') {
    return (
      <View style={styles.answerBlock}>
        <Text style={styles.segmentPlain}>{result.message}</Text>
      </View>
    );
  }
  return (
    <View style={styles.answerBlock}>
      {result.intro && <Text style={styles.segmentPlain}>{result.intro}</Text>}
      {result.picks.map((p: MoodMatch) => (
        <View key={p.slug} style={styles.songCard}>
          <Text style={styles.songTitle}>{p.title}</Text>
          {p.oneLiner && <Text style={styles.songMeta}>{p.oneLiner}</Text>}
        </View>
      ))}
    </View>
  );
}

export function ClownChatScreen({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('clown');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clownTurns, setClownTurns] = useState<ClownTranscriptTurn[]>([]);
  const [moodResult, setMoodResult] = useState<MoodResult | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(0);

  const askClownQuestion = useCallback(
    async (question: string) => {
      setBusy(true);
      setError(null);
      try {
        // PRIOR turns only — the server route appends the current one
        // itself, same contract as the web's ClownChat.tsx `ask()`.
        const priorTurns: ClownTurn[] = clownTurns.flatMap((t) => [
          { role: 'user' as const, text: t.question },
          {
            role: 'assistant' as const,
            text: t.answer.segments.map((s) => s.text).join(' '),
          },
        ]);
        const { answer } = await askClown(question, priorTurns);
        nextId.current += 1;
        setClownTurns((prev) => [...prev, { id: String(nextId.current), kind: 'clown', question, answer }]);
        setText('');
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setBusy(false);
      }
    },
    [clownTurns],
  );

  const askMoodQuestion = useCallback(async (question: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await askMood(question);
      setMoodResult(result);
      setText('');
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(() => {
    const t = text.trim();
    if (!t || busy) return;
    if (mode === 'clown') void askClownQuestion(t);
    else void askMoodQuestion(t);
  }, [text, busy, mode, askClownQuestion, askMoodQuestion]);

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setMode('clown')}
            style={[styles.modeBtn, mode === 'clown' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, mode === 'clown' && styles.modeBtnTextActive]}>
              Clown bot
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('mood')}
            style={[styles.modeBtn, mode === 'mood' && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, mode === 'mood' && styles.modeBtnTextActive]}>
              Mood
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={12}>
          <Text style={styles.close}>Done</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={styles.fill} contentContainerStyle={styles.stream}>
        {mode === 'clown' ? (
          clownTurns.length === 0 ? (
            <Text style={styles.emptyText}>Try our chat bot — ask a question below.</Text>
          ) : (
            clownTurns.map((t) => (
              <View key={t.id}>
                <View style={styles.userBubbleRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{t.question}</Text>
                  </View>
                </View>
                <ClownAnswerView answer={t.answer} />
              </View>
            ))
          )
        ) : moodResult ? (
          <MoodResultView result={moodResult} />
        ) : (
          <Text style={styles.emptyText}>Tell me how you're feeling and I'll find the songs that fit.</Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={(v) => setText(v.slice(0, MAX_TEXT))}
          placeholder={mode === 'clown' ? 'lets clown around' : 'however you want to say it'}
          placeholderTextColor={clownColors.inkSoft}
          style={styles.input}
          multiline
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          disabled={!text.trim() || busy}
          style={[styles.sendBtn, (!text.trim() || busy) && styles.sendBtnDisabled]}
        >
          {busy ? <ActivityIndicator color={eraColors.bg} /> : <Text style={styles.sendBtnText}>Send</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: clownColors.bg },
  header: {
    alignItems: 'center',
    borderBottomColor: clownColors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 54, default: 24 }),
    paddingBottom: 12,
  },
  modeToggle: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: clownColors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeBtnActive: { backgroundColor: eraColors.accent, borderColor: eraColors.accent },
  modeBtnText: { color: clownColors.inkSoft, fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: eraColors.bg },
  close: { color: eraColors.accent, fontSize: 15, fontWeight: '700' },
  stream: { padding: 16, gap: 16 },
  emptyText: { color: clownColors.inkSoft, fontSize: 14, textAlign: 'center', paddingTop: 24 },
  errorText: { color: '#f88', fontSize: 13, textAlign: 'center' },
  userBubbleRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' },
  userBubble: {
    backgroundColor: clownColors.raised,
    borderRadius: 16,
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: { color: clownColors.ink, fontSize: 15 },
  answerBlock: { gap: 8, marginTop: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  theoryBadge: {
    backgroundColor: `${eraColors.accent}26`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  theoryBadgeText: { color: eraColors.accent, fontSize: 12, fontWeight: '700' },
  deluluBadge: {
    borderColor: clownColors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  deluluBadgeText: { color: clownColors.inkSoft, fontSize: 12, fontWeight: '600' },
  segmentPlain: { color: clownColors.ink, fontSize: 15, lineHeight: 21 },
  segmentCounterpoint: {
    borderLeftColor: eraColors.accent,
    borderLeftWidth: 2,
    color: clownColors.ink,
    fontSize: 15,
    lineHeight: 21,
    paddingLeft: 10,
  },
  segmentAside: { color: clownColors.inkSoft, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sourceChip: {
    borderColor: clownColors.line,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceChipText: { color: clownColors.inkSoft, fontSize: 11 },
  moodCrisisTitle: { color: clownColors.ink, fontSize: 17, fontWeight: '700' },
  songCard: {
    backgroundColor: clownColors.raised,
    borderRadius: 12,
    padding: 12,
  },
  songTitle: { color: clownColors.ink, fontSize: 15, fontWeight: '600' },
  songMeta: { color: clownColors.inkSoft, fontSize: 12, marginTop: 2 },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: clownColors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  input: {
    backgroundColor: clownColors.raised,
    borderRadius: 14,
    color: clownColors.ink,
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: eraColors.accent,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 64,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: eraColors.bg, fontSize: 14, fontWeight: '700' },
});
