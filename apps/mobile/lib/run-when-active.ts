// Pure: runs a recovery now if the app is active, otherwise once it becomes active
// (Expo's own Android render-process-gone recovery waits for AppState 'active' the
// same way). One pending run at a time; `cancel` (unmount) drops it.
export interface ActiveDeferralDeps {
  state: () => string;
  subscribe: (listener: (state: string) => void) => () => void;
}

export function createRunWhenActive(deps: ActiveDeferralDeps) {
  let unsubscribe: (() => void) | null = null;
  const cancel = () => {
    unsubscribe?.();
    unsubscribe = null;
  };
  return {
    run(fn: () => void) {
      if (deps.state() === 'active') {
        fn();
        return;
      }
      if (unsubscribe) return;
      let done = false;
      const off = deps.subscribe((s) => {
        if (s !== 'active' || done) return;
        done = true;
        cancel();
        fn();
      });
      unsubscribe = () => {
        done = true;
        off();
      };
    },
    cancel,
    pending: () => unsubscribe !== null,
  };
}
