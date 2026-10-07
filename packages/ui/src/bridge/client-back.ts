import { makeRes, resErr, resOk } from './envelope';
import type { Envelope, JsonValue, ResResult } from './envelope';
import { isNativeCommandType } from './messages';
import type { PayloadOf } from './messages';
import { isThenable } from './client-util';
import { BRIDGE_VERSION } from './version';

export type BackResponder = (payload: PayloadOf<'back'>) => 'handled' | 'exit' | Promise<'handled' | 'exit'>;
const SEEN_CAP = 256;

/** Answers native-initiated `cmd`s (today only `back`) exactly once per id. */
export function createBackAnswerer(post: (env: Envelope) => void | PromiseLike<unknown>, now: () => number, disposed: () => boolean) {
  const seen: string[] = [];
  let responder: BackResponder | null = null;
  return {
    set(fn: BackResponder | null) {
      responder = fn;
    },
    is: (fn: BackResponder) => responder === fn,
    answer(env: Envelope) {
      if (seen.includes(env.id)) return;
      seen.push(env.id);
      if (seen.length > SEEN_CAP) seen.shift();
      const reply = (r: ResResult<JsonValue>) => {
        if (disposed()) return;
        try {
          const p = post(makeRes(env, r, BRIDGE_VERSION, now()));
          if (isThenable(p)) p.then(undefined, () => undefined);
        } catch {
          /* transport gone: nothing to tell */
        }
      };
      if (!isNativeCommandType(env.type)) return reply(resErr('unsupported', `unknown command: ${env.type.slice(0, 64)}`));
      if (!responder) return reply(resErr('unsupported', 'no responder registered'));
      Promise.resolve()
        .then(() => responder?.({}))
        .then((v) => reply(resOk(v ?? 'exit')), () => reply(resErr('failed', 'responder threw')));
    },
  };
}
