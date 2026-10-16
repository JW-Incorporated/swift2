import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain ESM script
import { main, renderSummary, runFanmadeCuration } from './curate-fanmade.mjs';

const NOW = '2026-10-15T12:00:00.000Z';

describe('disabled fan-made curation', () => {
  it('makes no model, wrapper, listing, or image calls', async () => {
    const jev = vi.fn();
    const wrapper = vi.fn();
    const listingFetch = vi.fn();
    const imageFetch = vi.fn();
    const pipeline = vi.fn(async () => {
      await Promise.all([jev(), wrapper(), listingFetch(), imageFetch()]);
      return { status: 'ok', accepted: [], rejected: [], unresolved: [] };
    });
    const appendSeeds = vi.fn();
    const report = await runFanmadeCuration({
      rawIssues: [{ number: 1 }], pipeline, appendSeeds,
      config: { enabled: false, shadow: false }, now: NOW,
    });
    expect(pipeline).not.toHaveBeenCalled();
    expect(jev).not.toHaveBeenCalled();
    expect(wrapper).not.toHaveBeenCalled();
    expect(listingFetch).not.toHaveBeenCalled();
    expect(imageFetch).not.toHaveBeenCalled();
    expect(appendSeeds).not.toHaveBeenCalled();
    expect(report).toMatchObject({ mode: 'disabled', status: 'disabled', writeEnabled: false });
    expect(renderSummary(report)).toContain('disabled: no calls made');
  });

  it('does not fetch candidates or construct clients from the CLI', async () => {
    const listIssues = vi.fn();
    const createClient = vi.fn();
    const writeReportImpl = vi.fn(async () => undefined);
    await main({
      args: [], config: { enabled: false, shadow: false }, env: {},
      listIssues, createClient, writeReportImpl,
    });
    expect(listIssues).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(writeReportImpl).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: 'disabled' }));
  });
});
