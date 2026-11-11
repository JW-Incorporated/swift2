import type { SupabaseClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

export interface FailurePlan {
  insert?: ReadonlySet<string>;
  update?: ReadonlySet<string>;
  upsert?: ReadonlySet<string>;
}

export function makeReproDb(
  tables: Record<string, Row[]>,
  failures: FailurePlan = {},
): SupabaseClient {
  function queryBuilder(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    const orders: Array<{ column: string; ascending: boolean }> = [];
    let countOnly = false;
    let rowLimit: number | null = null;
    const api: Record<string, (...args: never[]) => unknown> = {};

    api.select = ((_: string, options?: { head?: boolean }) => {
      countOnly = options?.head === true;
      return api;
    }) as never;
    api.eq = ((column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return api;
    }) as never;
    api.lte = ((column: string, value: unknown) => {
      filters.push((row) => String(row[column]) <= String(value));
      return api;
    }) as never;
    api.gte = ((column: string, value: unknown) => {
      filters.push((row) => String(row[column]) >= String(value));
      return api;
    }) as never;
    api.is = ((column: string, value: unknown) => {
      filters.push((row) => (row[column] ?? null) === value);
      return api;
    }) as never;
    api.in = ((column: string, values: unknown[]) => {
      filters.push((row) => values.includes(row[column]));
      return api;
    }) as never;
    api.order = ((column: string, options?: { ascending?: boolean }) => {
      orders.push({ column, ascending: options?.ascending ?? true });
      return api;
    }) as never;
    api.limit = ((value: number) => {
      rowLimit = value;
      return api;
    }) as never;

    function runQuery() {
      let rows = (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row)));
      rows = [...rows].sort((a, b) => {
        for (const { column, ascending } of orders) {
          if (a[column] === b[column]) continue;
          const comparison = String(a[column]).localeCompare(String(b[column]));
          return ascending ? comparison : -comparison;
        }
        return 0;
      });
      if (rowLimit !== null) rows = rows.slice(0, rowLimit);
      return countOnly ? { count: rows.length, error: null } : { data: rows, error: null };
    }

    api.maybeSingle = (async () => {
      const result = runQuery() as { data?: Row[]; error: null };
      return { data: result.data?.[0] ?? null, error: result.error };
    }) as never;
    api.then = ((resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(runQuery()).then(resolve, reject)) as never;
    api.insert = ((rows: Row | Row[]) => {
      if (failures.insert?.has(table)) {
        return Promise.resolve({ error: { message: `simulated ${table} insert failure` } });
      }
      (tables[table] ??= []).push(...(Array.isArray(rows) ? rows : [rows]).map((row) => ({ ...row })));
      return Promise.resolve({ error: null });
    }) as never;
    api.upsert = ((rows: Row | Row[], options?: { onConflict?: string }) => {
      if (failures.upsert?.has(table)) {
        return Promise.resolve({ error: { message: `simulated ${table} upsert failure` } });
      }
      const keys = (options?.onConflict ?? 'device_id,event_id').split(',');
      for (const row of Array.isArray(rows) ? rows : [rows]) {
        const target = (tables[table] ??= []);
        const existing = target.find((candidate) => keys.every((key) => candidate[key] === row[key]));
        if (existing) Object.assign(existing, row);
        else target.push({ ...row });
      }
      return Promise.resolve({ error: null });
    }) as never;
    api.update = ((patch: Row) => {
      const updateFilters: Array<(row: Row) => boolean> = [];
      const updateApi: Record<string, (...args: never[]) => unknown> = {};
      updateApi.eq = ((column: string, value: unknown) => {
        updateFilters.push((row) => row[column] === value);
        return updateApi;
      }) as never;
      updateApi.in = ((column: string, values: unknown[]) => {
        updateFilters.push((row) => values.includes(row[column]));
        return updateApi;
      }) as never;
      updateApi.then = ((resolve: (value: unknown) => void) => {
        if (failures.update?.has(table)) {
          resolve({ error: { message: `simulated ${table} update failure` } });
        } else {
          for (const row of tables[table] ?? []) {
            if (updateFilters.every((filter) => filter(row))) Object.assign(row, patch);
          }
          resolve({ error: null });
        }
      }) as never;
      return updateApi;
    }) as never;
    return api;
  }

  return { from: (table: string) => queryBuilder(table) } as unknown as SupabaseClient;
}
