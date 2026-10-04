// One UI WP0.5b: latest probe report from the ReaderSpike webview, held in
// memory for the diagnostics panel. The server `[diag]` schema is strict and
// untouched; promoting this into reports is a follow-up.
import { probeLines, type ProbeReport } from '../dom/reader/probe';

let latest: ProbeReport | null = null;

export function setProbeJson(json: string): void {
  try {
    latest = JSON.parse(json) as ProbeReport;
  } catch {
    // ignore a malformed report; the previous one stays
  }
}

export function readerSpikeLines(): string[] {
  return probeLines(latest);
}
