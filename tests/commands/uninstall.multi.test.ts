import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/prompts/confirm-comment-loss.js', () => ({
  promptConfirmCommentLoss: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../src/prompts/invalid-config.js', () => ({
  promptInvalidConfigAction: vi.fn().mockResolvedValue('backup' as const),
}));

import { runUninstall } from '../../src/commands/uninstall.js';
import type { TargetAdapter, TargetId, Config } from '../../src/targets/types.js';
import { promptInvalidConfigAction } from '../../src/prompts/invalid-config.js';

interface Fake extends TargetAdapter {
  _state: { config: Config; hasEntry: boolean; invalid: boolean };
}

function makeFake(
  id: TargetId,
  label: string,
  opts: { hasEntry?: boolean; invalid?: boolean },
): Fake {
  const state = {
    config: (opts.hasEntry
      ? { mcpServers: { 'jobly-mcp': { old: true }, nx: { x: 1 } } }
      : { other: true }) as Config,
    hasEntry: opts.hasEntry ?? false,
    invalid: opts.invalid ?? false,
  };
  const adapter: Fake = {
    id,
    label,
    resolveConfigFile: (scope) => `<${id}-${scope}>`,
    readConfig: () =>
      state.invalid
        ? { kind: 'invalid' as const, error: 'bad' }
        : { kind: 'ok' as const, config: state.config, raw: '', hadComments: false },
    hasEntry: (c) =>
      state.hasEntry &&
      Boolean((c as { mcpServers?: Record<string, unknown> }).mcpServers?.['jobly-mcp']),
    buildEntry: () => ({}),
    createNewConfig: (e) => ({ mcpServers: { 'jobly-mcp': e } }),
    setEntry: (c, e) => ({ ...c, mcpServers: { 'jobly-mcp': e } }),
    removeEntry: (c) => {
      const { mcpServers, ...rest } = c as Record<string, unknown>;
      void mcpServers;
      return rest as Config;
    },
    writeConfig: async (_p, c) => {
      state.config = c;
    },
    _state: state,
  };
  return adapter;
}

describe('runUninstall (multi-target)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exits 0 when targets list is empty', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(runUninstall({ targets: [], scope: 'global', force: false })).rejects.toThrow('EXIT:0');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('removes from targets that have an entry and skips the rest', async () => {
    const has = makeFake('opencode', 'A', { hasEntry: true });
    const nope = makeFake('claude', 'B', { hasEntry: false });
    await runUninstall({ targets: [has, nope], scope: 'global', force: false });
    expect(has._state.config).not.toHaveProperty('mcpServers');
    expect(nope._state.config).toEqual({ other: true });
  });

  it('exits 0 when no selected target has an entry', async () => {
    const nope = makeFake('opencode', 'A', { hasEntry: false });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(
      runUninstall({ targets: [nope], scope: 'global', force: false }),
    ).rejects.toThrow('EXIT:0');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 3 when an invalid target aborts', async () => {
    const bad = makeFake('claude', 'B', { invalid: true });
    vi.mocked(promptInvalidConfigAction).mockResolvedValueOnce('abort');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(
      runUninstall({ targets: [bad], scope: 'global', force: false }),
    ).rejects.toThrow('EXIT:3');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });
});
