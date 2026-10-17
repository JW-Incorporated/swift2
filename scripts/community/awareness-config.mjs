import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'awareness-subs.json');
export const DEFAULT_DAILY_CAP = 3;

export function loadConfig(file = CONFIG_PATH) {
  const config = JSON.parse(readFileSync(file, 'utf8'));
  return {
    defaults: config.defaults ?? {},
    subs: config.subs ?? [],
    excluded: config.excluded ?? [],
    search: config.search ?? {},
  };
}

/** A sub's own daily delivery cap (4 for the two big fan subs), else the default. */
export function dailyCapFor(sub, defaults) {
  return sub?.dailyCap ?? defaults?.perSubDailyDeliveryCap ?? DEFAULT_DAILY_CAP;
}
