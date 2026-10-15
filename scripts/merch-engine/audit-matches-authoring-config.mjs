import { MERCH_VISION_MODEL } from './merch-claude.mjs';

export const MODEL = MERCH_VISION_MODEL;
export const MAX_RUN_COST_USD = 3;
export const TRANSIENT_RETRY_ATTEMPTS = 3;
export const RESERVATION_PER_REQUEST_USD = ((2 * 4_784 + 512) * 3 + 256 * 15) / 1_000_000;
export const RESERVATION_PER_PAIR_USD = RESERVATION_PER_REQUEST_USD * TRANSIENT_RETRY_ATTEMPTS;
export const CAP_STOP_REASON = 'run cap would be reached before next request';
export const RETAILER_FETCH_TIMEOUT_MS = 10_000;
export const HYDRATION_BUDGET_MS = 5 * 60_000;

export const KINDS = new Set([
  'dress', 'top', 'bottom', 'outerwear', 'knitwear', 'shoes', 'jewelry', 'bag',
  'hat', 'eyewear', 'beauty', 'accessory', 'music', 'collectible', 'home', 'other',
]);

export const AUDIT_TOOL = {
  name: 'record_match_judgment',
  description:
    'Record one evidence-based visual comparison of a product image and a source-moment image.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'number', minimum: 0, maximum: 100 },
      kind: { type: 'string', enum: [...KINDS] },
      reasons: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
    },
    required: ['score', 'kind', 'reasons'],
  },
};
