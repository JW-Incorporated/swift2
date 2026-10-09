import { contentItemLookup } from './content-item-provider';
import type { ReaderCorpus } from './corpus';
import { tracksRawProvider } from './track-catalogue-provider';
import {
  contentForThreadInjected,
  eraSecretsRawInjected,
  songTargetInjected,
  theoriesRawInjected,
} from './thread-content-provider';

const injected: ReaderCorpus = {
  content: contentForThreadInjected,
  getContentItem: contentItemLookup,
  tracks: tracksRawProvider,
  theories: theoriesRawInjected,
  eraSecrets: eraSecretsRawInjected,
  songTarget: songTargetInjected,
};

/** The corpus backed by the module-global providers (native screens, server routes). Never used by a snapshot build. */
export function injectedCorpus(): ReaderCorpus {
  return injected;
}
