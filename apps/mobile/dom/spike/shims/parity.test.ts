import { describe, expect, it } from 'vitest';
import * as webContent from '../../../../web/lib/longlive/content';
import * as webEraSecrets from '../../../../web/lib/longlive/era-secrets';
import * as webMerch from '../../../../web/lib/longlive/merch';
import * as webTheories from '../../../../web/lib/longlive/theories';
import * as webTracks from '../../../../web/lib/longlive/tracks';
import * as webVideos from '../../../../web/lib/longlive/videos';
import * as content from './content';
import * as eraSecrets from './era-secrets';
import * as merch from './merch';
import * as theories from './theories';
import * as tracks from './tracks';
import * as videos from './videos';

describe('shim export parity with the web modules they replace', () => {
  const pairs: [string, object, object][] = [
    ['content', webContent, content],
    ['videos', webVideos, videos],
    ['tracks', webTracks, tracks],
    ['era-secrets', webEraSecrets, eraSecrets],
    ['merch', webMerch, merch],
    ['theories', webTheories, theories],
  ];
  it.each(pairs)('%s exports every name the web module does', (_name, web, shim) => {
    expect(Object.keys(shim)).toEqual(expect.arrayContaining(Object.keys(web)));
  });
});
