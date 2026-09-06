// OS-038 — native feedback button. Posts to the SAME `/api/feedback`
// endpoint the web's `FeedbackButton.tsx` calls (`apps/web/app/api/
// feedback/route.ts`) so every submission — web or native — files the
// same GitHub issue shape (`user-feedback` label, `feedback:user` marker).
// A floating trigger + small compose panel, same interaction shape as the
// web widget; no session-scoped dismissal persistence yet (that's a
// follow-up — the web's sessionStorage dismiss has no native equivalent
// wired here, so this trigger simply always renders while mounted).
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SITE_URL } from './SiteShell';
import { eraColors } from '../lib/theme';

const MAX = 5000;

type Location = {
  eraId?: string;
  view?: string;
  url?: string;
};

async function submitFeedback(message: string, location: Location): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${SITE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, location }),
    });
    const data: { error?: string } = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error || 'Couldn’t send that — please try again.' };
  } catch {
    return { ok: false, error: 'Network error — please try again.' };
  }
}

export function FeedbackButton({ location }: { location: Location }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit() {
    const message = msg.trim();
    if (!message || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    const result = await submitFeedback(message, location);
    if (result.ok) {
      setStatus('sent');
      setMsg('');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 1800);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Something went wrong.');
    }
  }

  return (
    <>
      {open && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Find an issue? Report it here!</Text>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close feedback">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          {status === 'sent' ? (
            <Text style={styles.sentText}>Thanks — your report was filed.</Text>
          ) : (
            <>
              <TextInput
                value={msg}
                onChangeText={setMsg}
                maxLength={MAX}
                placeholder="Wrong date, bad photo, typo, broken link… tell us what you saw."
                placeholderTextColor={eraColors.inkSoft}
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
              <Pressable
                onPress={submit}
                disabled={!msg.trim() || status === 'sending'}
                style={[styles.sendBtn, (!msg.trim() || status === 'sending') && styles.sendBtnDisabled]}
              >
                {status === 'sending' ? (
                  <ActivityIndicator color={eraColors.bg} size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>Send</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      )}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close feedback' : 'Send feedback'}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>{open ? '✕' : 'Feedback'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  triggerText: { color: eraColors.ink, fontWeight: '600', fontSize: 14 },
  panel: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 320,
    maxWidth: '92%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: eraColors.line,
    backgroundColor: eraColors.surface,
    padding: 16,
    gap: 8,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  panelTitle: { color: eraColors.ink, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  closeText: { color: eraColors.ink, fontSize: 16 },
  textarea: {
    color: eraColors.ink,
    backgroundColor: eraColors.bg,
    borderColor: eraColors.line,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  errorText: { color: '#f87171', fontSize: 12 },
  sentText: { color: eraColors.accent, fontSize: 14, paddingVertical: 8 },
  sendBtn: {
    alignSelf: 'flex-end',
    backgroundColor: eraColors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: eraColors.bg, fontWeight: '600', fontSize: 14 },
});
