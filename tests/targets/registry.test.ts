import { describe, it, expect } from 'vitest';
import { TARGET_ADAPTERS, ALL_TARGET_IDS, ALL_ADAPTERS } from '../../src/targets/registry.js';

describe('registry', () => {
  it('maps every target id to its adapter', () => {
    expect(ALL_TARGET_IDS).toEqual(['opencode', 'claude', 'codex']);
    for (const id of ALL_TARGET_IDS) {
      expect(TARGET_ADAPTERS[id].id).toBe(id);
    }
  });

  it('ALL_ADAPTERS mirrors ALL_TARGET_IDS order', () => {
    expect(ALL_ADAPTERS.map(a => a.id)).toEqual(ALL_TARGET_IDS);
  });
});
