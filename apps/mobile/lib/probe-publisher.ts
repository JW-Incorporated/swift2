// Publishes the DOM reader's probe JSON (stamped with the native launch-to-ready time) and remembers the raw text so it can be re-published once nativeMs is known.
export interface ProbePublisherDeps {
  nativeMs: () => number | null;
  withNativeTiming: (json: string, ms: number | null) => string;
  sinks: Array<(merged: string) => void>;
}

export function createProbePublisher({ nativeMs, withNativeTiming, sinks }: ProbePublisherDeps) {
  let raw: string | null = null;
  const publish = (json: string) => {
    raw = json;
    const merged = withNativeTiming(json, nativeMs());
    for (const s of sinks) s(merged);
  };
  return { publish, raw: () => raw };
}
