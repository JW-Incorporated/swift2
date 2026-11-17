// Deterministic social voice gates (docs/decisions.md 2026-11-08 "Shared voice
// system"). Hard findings built on the shared predicates in
// packages/shared/src/voice/style-checks.ts (plain node 24 loads the .ts
// directly; the patterns themselves live in rules.json, never here).
import {
  emDashCount,
  hasContrastFrame,
  hasTagAFriendCta,
  isQuestionLead,
  ngramOverlap,
} from '../../../packages/shared/src/voice/style-checks.ts';

export const VOICE_GATES = {
  maxEmDashes: 1,
  tagFriendDays: 14,
  questionLeadWindow: 4,
  overlapDays: 14,
  overlapMax: 0.2,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Caption text as the audience reads it for comparison: links and hashtags carry no voice and repeat by design. */
export function captionText(body) {
  return String(body ?? '')
    .replace(/https?:\/\/\S+|\blonglivets\.com\S*/gi, ' ')
    .replace(/#\w+/g, ' ');
}

function postedAtMs(record) {
  const ms = new Date(record?.postedAt).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Findings for one draft's caption against the posted history. `posted` is the
 * parsed `social/posted/*.json` records. A sibling of the same campaign is
 * never history for its own pair (the cross-post copy gate owns that).
 */
export function checkVoiceStyle(item, posted = [], { now = Date.now() } = {}) {
  const body = typeof item?.body === 'string' ? item.body : '';
  const findings = [];

  const dashes = emDashCount(body);
  if (dashes > VOICE_GATES.maxEmDashes) {
    findings.push(`voice: ${dashes} em dashes — the limit is ${VOICE_GATES.maxEmDashes} per caption. Use a comma, a full stop or a colon.`);
  }
  if (hasContrastFrame(body)) {
    findings.push('voice: contrast frame ("it isn\'t X, it\'s Y" / "not just X") — say the thing directly.');
  }

  const history = posted
    .filter((p) => p && typeof p.body === 'string' && postedAtMs(p) !== null)
    .filter((p) => !(item.campaign && p.campaign === item.campaign));

  const recent = (days) => history.filter((p) => postedAtMs(p) >= now - days * DAY_MS);

  if (hasTagAFriendCta(body) && recent(VOICE_GATES.tagFriendDays).some((p) => hasTagAFriendCta(p.body))) {
    findings.push(`voice: tag-a-friend call to action, but one already posted in the last ${VOICE_GATES.tagFriendDays} days. Drop it or use a different share hook.`);
  }

  if (isQuestionLead(body)) {
    const lastN = history
      .filter((p) => p.platform === item.platform)
      .sort((a, b) => postedAtMs(a) - postedAtMs(b))
      .slice(-VOICE_GATES.questionLeadWindow);
    if (lastN.some((p) => isQuestionLead(p.body))) {
      findings.push(`voice: question lead, but one of the last ${VOICE_GATES.questionLeadWindow} posted ${item.platform} captions already led with a question. Lead with the feeling or the detail.`);
    }
  }

  const corpus = recent(VOICE_GATES.overlapDays).map((p) => captionText(p.body));
  const overlap = ngramOverlap(captionText(body), corpus);
  if (overlap >= VOICE_GATES.overlapMax) {
    findings.push(`voice: 4-gram overlap ${overlap.toFixed(2)} with a caption posted in the last ${VOICE_GATES.overlapDays} days (limit under ${VOICE_GATES.overlapMax}). Reword — do not reuse a recent frame.`);
  }
  return findings;
}
