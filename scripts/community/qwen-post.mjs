// Cloud half of the Qwen second opinion: posts stored drafts (written by the home poller,
// scripts/home/qwen-second-opinion) as a reply under the lead's card. Store-first on the PC,
// post-second here, so a failure leaves the row for the next run and nothing posts twice.
import { routedPost } from '../lib/discord-route.mjs';
import { buildQwenMessage } from '../home/qwen-second-opinion/message.mjs';
import { mailerRouteFor } from './mailer.mjs';

export const POST_LIMIT = 20;
const COLUMNS = 'id, platform, discord_message_id, qwen_draft';

/** Posts one stored draft as a Discord reply. Returns { id } | { rateLimited } | { error }. */
export async function postQwenReply(lead, { env, fetchImpl }) {
  const content = buildQwenMessage(lead.qwen_draft);
  if (!content) return { error: 'empty draft' };
  const init = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: [] },
      message_reference: { message_id: lead.discord_message_id, fail_if_not_exists: false },
    }),
  };
  let res;
  try {
    res = await routedPost(mailerRouteFor(lead.platform), init, { env, webhook: '', fetchImpl });
  } catch (err) {
    return { error: String(err?.message ?? err) };
  }
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const body = await res.json().catch(() => null);
  return body?.id ? { id: String(body.id) } : { error: 'no message id in response' };
}

export async function postQwenOpinions({ supabase, env = process.env, fetchImpl = fetch, limit = POST_LIMIT } = {}) {
  const summary = { posted: 0, errors: [] };
  const { data, error } = await supabase
    .from('engagement_lead')
    .select(COLUMNS)
    .eq('qwen_status', 'done')
    .is('qwen_discord_message_id', null)
    .not('discord_message_id', 'is', null)
    .not('qwen_draft', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    summary.errors.push({ leadId: null, message: String(error.message ?? error) });
    return summary;
  }
  for (const lead of data ?? []) {
    const r = await postQwenReply(lead, { env, fetchImpl });
    if (r.rateLimited) {
      summary.errors.push({ leadId: lead.id, message: 'rate limited, retry next run' });
      break;
    }
    if (r.error) {
      summary.errors.push({ leadId: lead.id, message: r.error });
      continue;
    }
    const { error: upErr } = await supabase
      .from('engagement_lead')
      .update({ qwen_discord_message_id: r.id })
      .eq('id', lead.id);
    if (upErr) summary.errors.push({ leadId: lead.id, message: String(upErr.message ?? upErr) });
    else summary.posted += 1;
  }
  return summary;
}
