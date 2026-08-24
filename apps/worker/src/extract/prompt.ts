// The extract stage's persona-free system prompt and forced tool schema
// (proposal §4.5). Split out from haiku-client.ts purely for file-length
// hygiene — same precedent as clown-client.ts / clown-client-prompt.ts. Rules
// below are lifted IN SPIRIT (summarized, not copy-pasted verbatim) from
// docs/content-ops/rumor-pipeline.md (status vocabulary, citation
// discipline), docs/content-ops/privacy-redlines.md (the location ladder —
// L0 region/state, L1 city, L2 venue, never street/address), and
// docs/content-ops/editorial-voice-and-pipeline.md ("Taylor" in running
// prose, never bare "Swift", the AI-tell cut-on-sight list). The
// deterministic redline module (packages/shared/src/redline.ts) is the real
// enforcement layer — this prompt reduces how often it has to fire, it is
// not relied on alone (same posture as clown-client-prompt.ts's BOUNDARIES
// section).

import { CURRENT_ITEM_CATEGORIES, CURRENT_ITEM_STATUSES, LOCATION_LEVELS } from '@swift2/shared';

export const EXTRACT_SYSTEM_PROMPT = [
  'You are the extract stage of a Taylor Swift fan site\'s news pipeline. You read one clustered story (titles/snippets from the outlets covering it) and report, in your own words, what is actually observable — you do not editorialize, you do not invent, and you never repeat a source\'s wording verbatim.',
  '',
  'VOICE (docs/content-ops/editorial-voice-and-pipeline.md):',
  '- Default to "Taylor" in running prose. Bare "Swift" is only correct inside a direct quote or a formal name/credit that contains the surname.',
  '- Plain, specific, fan-editor voice — never AI throat-clearing ("In this article...", "It is worth noting that..."). Say the concrete thing.',
  '- `summary` is at most 400 characters, `headline` at most 140. Tight sentences, not a rewritten press release.',
  '',
  'TRUTH DISCIPLINE (docs/content-ops/rumor-pipeline.md):',
  '- Never state anything as settled fact that the sources only report as claimed, alleged, or rumored. `status_hint` must be one of: ' +
    CURRENT_ITEM_STATUSES.join(', ') +
    '. Use `rumor` or `reported` far more often than `confirmed` — `confirmed` requires the sources themselves to say it is confirmed/official, not just widely repeated.',
  '- `category` must be one of: ' + CURRENT_ITEM_CATEGORIES.join(', ') + '.',
  '- Never invent a fact, date, name, or number that is not in the given titles/snippets. If the cluster is too thin to say anything concrete, prefer `skip` over padding.',
  '',
  'PRIVACY REDLINES (docs/content-ops/privacy-redlines.md) — set `skip_reason: "redline"` and list every category you noticed in `redline_flags` rather than writing around it:',
  '- Never help locate, diagnose, or expose her or people around her. No body/health/pregnancy/sexuality speculation, no family beyond public roles, no legal accusations, no precise location.',
  '- LOCATION LADDER — `location_level` must never exceed what the story\'s own provenance supports: ' +
    LOCATION_LEVELS.join(', ') +
    ' only (region/state, named city, or named venue). Never a street address, unit, or coordinates — that tier does not exist here; omit `location_level` entirely rather than guess one.',
  '',
  'SCOPE — set `kind: "skip"` with the matching `skip_reason` when:',
  '- The cluster is not actually about Taylor Swift herself (`not_taylor`).',
  '- Nothing in it is a claim anyone could later adjudicate — pure opinion/reaction with no observable event (`no_truth_value`).',
  '- It trips a privacy redline (`redline`).',
  '- It is clearly the same event already covered by an earlier cluster you would be repeating (`duplicate`).',
  '- The story has gone quiet/stopped mattering by the time you are reading it (`stale`).',
  '',
  'OUTPUT — report through the record_knowledge tool only, no prose outside it:',
  '- `kind: "current_item"` — a single observable event worth the current era\'s feed.',
  '- `kind: "fan_signal"` — no single confirmable event, but there is a real, describable pattern of fan reaction/discussion worth naming (aggregate voice only: "a popular thread argues...", never an individual\'s name or handle).',
  '- `kind: "both"` — both apply (an event happened AND there is a distinct fan reaction pattern worth naming separately).',
  '- `kind: "skip"` — none of the above; nothing worth storing.',
  '- Inside `fan_signal.theories`, only include a theory if the cluster genuinely surfaces one — an empty array is correct and expected most of the time.',
].join('\n');

/** Mirrors clown-client-prompt.ts's CLOWN_TAKE_TOOL shape exactly — a plain
 * JSON-schema object handed to Anthropic's `tools`/`tool_choice`. */
export const RECORD_KNOWLEDGE_TOOL = {
  name: 'record_knowledge',
  description: 'Record what, if anything, this clustered story is worth storing as.',
  input_schema: {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['current_item', 'fan_signal', 'both', 'skip'],
        description: 'What this cluster produces.',
      },
      skip_reason: {
        type: 'string',
        enum: ['not_taylor', 'no_truth_value', 'redline', 'duplicate', 'stale'],
        description: 'Required when kind is "skip"; omit otherwise.',
      },
      current_item: {
        type: 'object',
        description: 'Required when kind is "current_item" or "both".',
        properties: {
          observed_on: { type: 'string', description: 'ISO date (YYYY-MM-DD) the event happened or was reported.' },
          category: { type: 'string', enum: [...CURRENT_ITEM_CATEGORIES] },
          tags: { type: 'array', items: { type: 'string' } },
          headline: { type: 'string', description: 'Neutral, our words, <=140 characters.' },
          summary: { type: 'string', description: '<=400 characters.' },
          detail: { type: 'string', description: '1-3 sentences, our words, never stated more confidently than status_hint allows.' },
          symbols: { type: 'array', items: { type: 'string' }, description: 'Matching keys from the given symbol lexicon where they genuinely apply; never invent a new symbol key.' },
          entities: { type: 'array', items: { type: 'string' }, description: 'Named people/places/things this event involves, besides Taylor herself.' },
          location_level: { type: 'string', enum: [...LOCATION_LEVELS], description: 'Omit entirely unless a location is actually part of the story.' },
          status_hint: { type: 'string', enum: [...CURRENT_ITEM_STATUSES] },
        },
        required: ['observed_on', 'category', 'headline', 'summary', 'detail', 'status_hint'],
      },
      fan_signal: {
        type: 'object',
        description: 'Required when kind is "fan_signal" or "both".',
        properties: {
          topic: { type: 'string', description: '<=120 characters.' },
          summary: { type: 'string', description: 'Aggregate voice only — never an individual name or handle.' },
          stance_mix: { type: 'object', description: 'Rough breakdown of reactions, e.g. {"excited": 0.6, "skeptical": 0.4}.' },
          symbols: { type: 'array', items: { type: 'string' } },
          theories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                claim: { type: 'string' },
              },
              required: ['name', 'claim'],
            },
          },
        },
        required: ['topic', 'summary'],
      },
      redline_flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any privacy-redline categories you noticed, even if kind is not "skip" (e.g. you wrote around one).',
      },
    },
    required: ['kind', 'redline_flags'],
    additionalProperties: false,
  },
} as const;
