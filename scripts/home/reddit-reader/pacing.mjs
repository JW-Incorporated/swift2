export const MIN_LOAD_INTERVAL_MS = 6_000;
export const MAX_LOADS_PER_HOUR = 300;
export const HOUR_MS = 60 * 60 * 1_000;
export const BACKOFF_BASE_MS = 30_000;
export const BREAKER_429_LIMIT = 3;

export class PageBudgetExceeded extends Error {
  constructor(message = 'page-load budget exhausted') {
    super(message);
    this.name = 'PageBudgetExceeded';
  }
}

export class RedditCircuitOpen extends Error {
  constructor(message = 'Reddit 429 circuit breaker opened') {
    super(message);
    this.name = 'RedditCircuitOpen';
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retryAfterMs(response) {
  const raw = response?.headers?.()['retry-after'];
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const at = Date.parse(raw);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : 0;
}

export function createPagePacer({
  now = Date.now,
  sleep = wait,
  minIntervalMs = MIN_LOAD_INTERVAL_MS,
  hourlyLimit = MAX_LOADS_PER_HOUR,
  runLimit = Infinity,
  backoffBaseMs = BACKOFF_BASE_MS,
  breakerLimit = BREAKER_429_LIMIT,
  initialLoads = [],
  onLoad = async () => {},
} = {}) {
  const loads = initialLoads.filter((timestamp) => Number.isFinite(timestamp));
  let totalLoads = 0;
  let consecutive429 = 0;
  let open = false;

  async function beforeLoad() {
    if (open) throw new RedditCircuitOpen();
    if (totalLoads >= runLimit) throw new PageBudgetExceeded();

    let current = now();
    while (loads.length > 0 && loads[0] <= current - HOUR_MS) loads.shift();
    let delay = 0;
    if (loads.length > 0) delay = Math.max(delay, loads.at(-1) + minIntervalMs - current);
    if (loads.length >= hourlyLimit) delay = Math.max(delay, loads[0] + HOUR_MS - current);
    if (delay > 0) {
      await sleep(delay);
      current = now();
      while (loads.length > 0 && loads[0] <= current - HOUR_MS) loads.shift();
    }
    loads.push(current);
    totalLoads += 1;
    await onLoad(loads);
  }

  function success() {
    consecutive429 = 0;
  }

  async function rateLimited(serverDelayMs = 0) {
    consecutive429 += 1;
    if (consecutive429 >= breakerLimit) {
      open = true;
      throw new RedditCircuitOpen(`Reddit returned 429 ${consecutive429} times; stopping this run`);
    }
    const exponential = backoffBaseMs * 2 ** (consecutive429 - 1);
    await sleep(Math.max(exponential, serverDelayMs));
  }

  return {
    beforeLoad,
    success,
    rateLimited,
    stats: () => ({ totalLoads, consecutive429, circuitOpen: open }),
  };
}

export async function loadPacingHistory(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return Array.isArray(parsed?.loads) ? parsed.loads : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function savePacingHistory(file, loads) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify({ loads })}\n`);
}

export async function loadPage(page, url, pacer) {
  for (;;) {
    await pacer.beforeLoad();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (response?.status() === 429) {
      await pacer.rateLimited(retryAfterMs(response));
      continue;
    }
    pacer.success();
    return response;
  }
}
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
