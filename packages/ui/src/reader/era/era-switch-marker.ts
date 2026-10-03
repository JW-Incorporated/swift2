/**
 * Emits an era-switch mark only when the active era changes after the stream's
 * mount-time scroll restoration has settled. Until then `observe` is silent
 * (the era under the viewport is still the pre-restore top era); `settle`
 * adopts the restored era as the baseline without emitting.
 */
export function createEraSwitchMarker(initialEra: string | null, settled: boolean, emit: (eraId: string) => void) {
  let last = initialEra;
  let ready = settled;
  return {
    observe(eraId: string): void {
      if (!ready || eraId === last) return;
      last = eraId;
      emit(eraId);
    },
    settle(eraId: string | null): void {
      ready = true;
      if (eraId) last = eraId;
    },
  };
}
