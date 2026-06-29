import { describe, it, expect } from 'vitest';
import { hasMcpEntry, setMcpEntry, removeMcpEntry } from '../../../src/targets/opencode/write-config.js';
import { buildJoblyMcpEntry, createNewConfig, JOBLY_MCP_KEY } from '../../../src/targets/opencode/types.js';

const entry = buildJoblyMcpEntry('jobly_sk_testkey12345678901234');

describe('hasMcpEntry', () => {
  it('returns false when config has no mcp key', () => {
    expect(hasMcpEntry({})).toBe(false);
  });

  it('returns false when mcp has no jobly-mcp entry', () => {
    expect(hasMcpEntry({ mcp: { 'other-server': { type: 'local', command: ['foo'] } } })).toBe(false);
  });

  it('returns true when mcp has jobly-mcp entry', () => {
    expect(hasMcpEntry(createNewConfig(entry))).toBe(true);
  });
});

describe('setMcpEntry', () => {
  it('adds jobly-mcp to an empty config', () => {
    const result = setMcpEntry({}, entry);
    expect(result.mcp?.[JOBLY_MCP_KEY]).toEqual(entry);
  });

  it('preserves other mcp servers', () => {
    const config = {
      mcp: {
        'nx': { type: 'local' as const, command: ['npx', 'nx', 'mcp'] },
        'codegraph': { type: 'local' as const, command: ['codegraph', 'serve'] },
      },
    };
    const result = setMcpEntry(config, entry);
    expect(result.mcp?.['nx']).toEqual({ type: 'local', command: ['npx', 'nx', 'mcp'] });
    expect(result.mcp?.['codegraph']).toEqual({ type: 'local', command: ['codegraph', 'serve'] });
    expect(result.mcp?.[JOBLY_MCP_KEY]).toEqual(entry);
  });

  it('preserves non-mcp top-level keys', () => {
    const config = {
      $schema: 'https://opencode.ai/config.json',
      compaction: { prune: false },
      mcp: { 'nx': { type: 'local' as const, command: ['nx'] } },
    };
    const result = setMcpEntry(config, entry);
    expect(result.$schema).toBe('https://opencode.ai/config.json');
    expect(result.compaction).toEqual({ prune: false });
  });

  it('overwrites existing jobly-mcp entry', () => {
    const config = createNewConfig(buildJoblyMcpEntry('jobly_sk_oldkey00000000000000'));
    const result = setMcpEntry(config, entry);
    expect(result.mcp?.[JOBLY_MCP_KEY]?.headers?.Authorization).toBe('Bearer jobly_sk_testkey12345678901234');
  });
});

describe('removeMcpEntry', () => {
  it('removes jobly-mcp and preserves other servers', () => {
    const config = {
      mcp: {
        [JOBLY_MCP_KEY]: entry,
        'nx': { type: 'local' as const, command: ['nx'] },
      },
    };
    const result = removeMcpEntry(config);
    expect(result.mcp?.[JOBLY_MCP_KEY]).toBeUndefined();
    expect(result.mcp?.['nx']).toEqual({ type: 'local', command: ['nx'] });
  });

  it('returns config unchanged when no mcp key exists', () => {
    const config = { $schema: 'https://opencode.ai/config.json' };
    const result = removeMcpEntry(config);
    expect(result).toEqual(config);
  });

  it('returns config unchanged when mcp has no jobly-mcp', () => {
    const config = { mcp: { 'nx': { type: 'local' as const, command: ['nx'] } } };
    const result = removeMcpEntry(config);
    expect(result.mcp?.['nx']).toBeDefined();
  });
});
