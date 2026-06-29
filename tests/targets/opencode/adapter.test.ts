import { describe, it, expect } from 'vitest';
import { openCodeAdapter } from '../../../src/targets/opencode/adapter.js';

describe('openCodeAdapter', () => {
  it('exposes identity metadata', () => {
    expect(openCodeAdapter.id).toBe('opencode');
    expect(openCodeAdapter.label).toBe('OpenCode');
  });

  it('buildEntry produces a remote entry with a bearer header', () => {
    const entry = openCodeAdapter.buildEntry('jobly_sk_testkey12345678901234');
    expect(entry).toEqual({
      type: 'remote',
      url: 'https://jobly.ai.vn/api/mcp',
      enabled: true,
      headers: { Authorization: 'Bearer jobly_sk_testkey12345678901234' },
    });
  });

  it('hasEntry/setEntry/removeEntry round-trip through the adapter', () => {
    const entry = openCodeAdapter.buildEntry('jobly_sk_testkey12345678901234');
    const fresh = openCodeAdapter.createNewConfig(entry);
    expect(openCodeAdapter.hasEntry(fresh)).toBe(true);

    const withOther = { mcp: { nx: { type: 'local' as const, command: ['nx'] } } };
    const merged = openCodeAdapter.setEntry(withOther, entry);
    expect(openCodeAdapter.hasEntry(merged)).toBe(true);
    expect((merged as { mcp: Record<string, unknown> }).mcp.nx).toBeDefined();

    const removed = openCodeAdapter.removeEntry(merged);
    expect(openCodeAdapter.hasEntry(removed)).toBe(false);
    expect((removed as { mcp: Record<string, unknown> }).mcp.nx).toBeDefined();
  });
});
