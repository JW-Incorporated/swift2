import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const INITIAL_BACKOFF_RUNS = 3;
export const MAX_BACKOFF_RUNS = 72;

export class CircuitTripError extends Error {
  constructor(reason, status = null) {
    super(`Reddit circuit breaker tripped: ${reason}`);
    this.name = 'CircuitTripError';
    this.reason = reason;
    this.status = status;
  }
}

export function emptyCircuitState() {
  return {
    version: 1,
    backoffRuns: 0,
    remainingSkips: 0,
    tripCount: 0,
    lastTripAt: null,
    lastReason: null,
  };
}

export async function loadCircuitState(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return { ...emptyCircuitState(), ...parsed };
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyCircuitState();
    throw error;
  }
}

export async function saveCircuitState(file, state) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`);
  await rename(temporary, file);
}

export async function beginCircuitRun(file) {
  const state = await loadCircuitState(file);
  if (state.remainingSkips <= 0) return { skipped: false, state };
  const next = { ...state, remainingSkips: state.remainingSkips - 1 };
  await saveCircuitState(file, next);
  return { skipped: true, state: next };
}

export async function tripCircuit(file, reason, { status = null, now = new Date() } = {}) {
  const state = await loadCircuitState(file);
  const backoffRuns = Math.min(
    MAX_BACKOFF_RUNS,
    state.backoffRuns > 0 ? state.backoffRuns * 2 : INITIAL_BACKOFF_RUNS,
  );
  const next = {
    ...state,
    backoffRuns,
    remainingSkips: backoffRuns,
    tripCount: state.tripCount + 1,
    lastTripAt: now.toISOString(),
    lastReason: status == null ? reason : `${reason} (HTTP ${status})`,
  };
  await saveCircuitState(file, next);
  return next;
}

export async function closeCircuit(file) {
  await saveCircuitState(file, emptyCircuitState());
}
