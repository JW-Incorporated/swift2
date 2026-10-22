export const DIMENSIONS = ['love', 'insight', 'opinion', 'clowning', 'ai_tells'];

const score = { type: 'integer', minimum: 1, maximum: 5 };

export const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          love: score,
          insight: score,
          opinion: score,
          clowning: score,
          ai_tells: score,
          note: { type: 'string', maxLength: 240 },
        },
        required: ['id', ...DIMENSIONS, 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

export const REWRITE_SCHEMA = {
  type: 'object',
  properties: {
    rewrites: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 1 }, text: { type: 'string', minLength: 1 } },
        required: ['id', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['rewrites'],
  additionalProperties: false,
};

const VOICE = `The house voice (Long Live, a Taylor Swift fan app): a sharp, plugged-in fan telling another fan the tea, in third person, calling her "Taylor". Concrete facts, a real take, a little playfulness. It is NOT a wire-service reporter, NOT a corporate copywriter, NOT first-person "as Taylor". Cut on sight: "in this article", "it is worth noting", "the American singer-songwriter", hedging ("reportedly appears to"), exclamation-stacked hype, corporate throat-clearing, feature-announcement boilerplate, empty praise, repeated bare "Swift".`;

export function scoreSystem(anchors = []) {
  const refs = anchors.length
    ? `\n\nReference samples of the voice at its best (calibration only, do not score them):\n${anchors.map((a) => `- ${a}`).join('\n')}`
    : '';
  return `You are a strict voice critic. ${VOICE}

Score each text 1 to 5 (integers; 5 is best) on:
- love: warmth and real affection for the music and the fans, shown through specifics, not declared. 1 = cold or fake-gushing.
- insight: a concrete, checkable detail or connection the reader did not already have. 1 = nothing specific, filler.
- opinion: a point of view, a take, a framing or a question with a stance. 1 = neutral summary with no stance.
- clowning: playful, self-aware fan humour that fits the moment and is never forced. A serious or purely factual text with no joke and no forced jokes is a 3. Forced hype or cringe is 1 or 2. Natural wit is 4 or 5.
- ai_tells: 5 = reads like a human fan wrote it, no tells. 1 = riddled with generic or AI tells (throat-clearing, hedging, tapestry or delve language, rule-of-three padding, wire framing, hollow superlatives).

Judge only the text given. Do not reward length, links or emoji for their own sake. Use the full range; most texts are not 4s. Keep each note under 200 characters and say what to fix. Return every id exactly once.${refs}`;
}

export function scoreUser(items) {
  return `Score these texts. Return JSON {"results":[{"id","love","insight","opinion","clowning","ai_tells","note"}]}.\n\n${items
    .map((i) => `<text id="${i.id}">\n${i.text}\n</text>`).join('\n\n')}`;
}

export const REWRITE_SYSTEM = `You rewrite weak social copy into the house voice. ${VOICE}

Rules: keep every fact, number, name, date and link exactly as given and add nothing new (no invented quotes, no new facts). Change only the voice: be specific, take a stance, let a little fan humour in where it fits. Keep roughly the same length (never more than 15 percent longer) and keep lowercase or capitalisation style consistent with the original. Return one rewrite per id.`;

export function rewriteUser(items) {
  return `Rewrite each text. Return JSON {"rewrites":[{"id","text"}]}.\n\n${items
    .map((i) => `<text id="${i.id}" critic_note="${String(i.note ?? '').replace(/"/g, "'")}">\n${i.text}\n</text>`)
    .join('\n\n')}`;
}
