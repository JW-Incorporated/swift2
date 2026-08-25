import { describe, expect, it } from 'vitest';

import {
  CLOWNING_DEFINITION,
  DELULU_DEFINITION,
  EASTER_EGG_DEFINITION,
  explainClownQuestion,
} from './clown-explain';

describe('explainClownQuestion', () => {
  it('answers the exact newcomer question from #1987', () => {
    expect(explainClownQuestion('what is clowning?')).toEqual({
      topic: 'clowning',
      text: CLOWNING_DEFINITION,
    });
  });

  it.each([
    ['What does delulu mean?', 'delulu', DELULU_DEFINITION],
    ['What is a Taylor Swift Easter egg?', 'easter-egg', EASTER_EGG_DEFINITION],
  ])('defines %j in plain language', (question, topic, definition) => {
    expect(explainClownQuestion(question)).toEqual({ topic, text: definition });
  });

  it('explains what Clownbot does and includes all three terms', () => {
    const answer = explainClownQuestion('what do you do?');
    expect(answer?.topic).toBe('clownbot');
    expect(answer?.text).toContain(CLOWNING_DEFINITION);
    expect(answer?.text).toContain(DELULU_DEFINITION);
    expect(answer?.text).toContain(EASTER_EGG_DEFINITION);
  });

  it('does not intercept an ordinary theory question', () => {
    expect(explainClownQuestion('What are people clowning on right now?')).toBeNull();
  });
});
