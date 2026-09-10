/** Narrow editorial policies for literal casual-language keyword intents. */

export type MoodIntent = 'companionship' | 'everyday-stress' | 'fatigue';

export interface MoodIntentPolicy {
  preferred: readonly string[];
  excluded: ReadonlySet<string>;
}

const POLICIES: Record<MoodIntent, MoodIntentPolicy> = {
  companionship: {
    preferred: ['this-is-me-trying', 'youre-on-your-own-kid', 'long-live', 'seven', 'the-outside'],
    excluded: new Set(['august', 'cruel-summer', 'dress', 'untouchable']),
  },
  'everyday-stress': {
    preferred: ['clean'],
    excluded: new Set(['dear-john', 'soon-youll-get-better']),
  },
  fatigue: {
    preferred: [],
    excluded: new Set(['hoax', 'last-kiss']),
  },
};

export function moodIntentPolicy(intent: MoodIntent | undefined): MoodIntentPolicy | undefined {
  return intent ? POLICIES[intent] : undefined;
}
