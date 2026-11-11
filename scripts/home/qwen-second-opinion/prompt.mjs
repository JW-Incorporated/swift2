// Deterministic prompt for the Qwen second opinion. Only our own words (title,
// context, draft) go in; raw comment bodies are never stored on a lead.
export const SYSTEM_PROMPT = [
  'You write a single social-media reply for a Taylor Swift fan community.',
  'Output ONLY the reply text: no preamble, no label, no quotes, no markdown, no explanation.',
  "Match the platform's tone. Make it the same length as, or shorter than, the reference draft.",
  'Write a genuinely different alternative, not a paraphrase.',
].join(' ');

function line(label, value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? `${label}: ${text}` : null;
}

export function buildMessages(lead) {
  const tone = lead.platform === 'facebook' ? 'Facebook group, warm and conversational' : 'Reddit, casual and concise';
  const user = [
    line('Platform', `${lead.platform} (${tone})`),
    line('Community', lead.community),
    line('Thread title', lead.title),
    line('Context', lead.context),
    line('Tree draft', lead.draft),
    `Link in draft: ${lead.link_included ? 'yes' : 'no'}${lead.link_included ? ' (keep the link out of your alternative unless it reads naturally)' : ''}`,
    'Write the alternative reply now.',
  ]
    .filter(Boolean)
    .join('\n');
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ];
}
