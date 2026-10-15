import { createJevClient } from '@swift2/shared/jev/client';
import { choiceQuestion, noulQuestion, scoreQuestion } from '@swift2/shared/jev/questions';

export { createJevClient, choiceQuestion, noulQuestion, scoreQuestion };

async function selftest() {
  if (!process.env.TYPESAFE_API_KEY) {
    console.error('Jev selftest requires TYPESAFE_API_KEY.');
    process.exitCode = 1;
    return;
  }

  let usage;
  const client = createJevClient({ logUsage: (entry) => (usage = entry) });
  try {
    const result = await client.ask({
      caller: 'jev-selftest',
      state:
        'A music publication reports that a previously announced album will be released on Friday.',
      questions: [
        choiceQuestion('kind', 'What kind of item is this?', [
          { id: 'news', label: 'News' },
          { id: 'opinion', label: 'Opinion' },
          { id: 'other', label: 'Other' },
        ]),
        scoreQuestion('urgency', 'How time-sensitive is this for a fan?', 1, 5),
        noulQuestion('official', 'Does the text say this comes from an official source?'),
      ],
    });
    console.log('Jev selftest answers:', JSON.stringify(result.answers));
    console.log('Jev selftest usage:', JSON.stringify(usage));
  } catch (error) {
    console.error(
      `Jev selftest failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    process.exitCode = 1;
  }
}

if (process.argv.includes('--selftest')) await selftest();
