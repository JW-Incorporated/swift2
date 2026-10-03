/** Replace an array's contents in place, so importers holding the reference see the new data. */
export function replaceArray<T>(target: T[], next: readonly T[]): void {
  target.length = 0;
  for (const item of next) target.push(item);
}

/** Replace an object's keys in place. */
export function replaceRecord<T extends object>(target: T, next: Partial<T>): void {
  for (const key of Object.keys(target)) delete (target as Record<string, unknown>)[key];
  Object.assign(target, next);
}
