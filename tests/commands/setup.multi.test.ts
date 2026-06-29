import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/prompts/overwrite.js', () => ({
  promptOverwrite: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../src/prompts/confirm-comment-loss.js', () => ({
  promptConfirmCommentLoss: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../src/prompts/invalid-config.js', () => ({
  promptInvalidConfigAction: vi.fn().mockResolvedValue('backup' as const),
}));

import { runSetup } from '../../src/commands/setup.js';
import type { TargetAdapter, TargetId, Config } from '../../src/targets/types.js';
import { promptOverwrite } from '../../src/prompts/overwrite.js';
import { promptConfirmCommentLoss } from '../../src/prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../../src/prompts/invalid-config.js';

const KEY = 'jobly_sk_testkey12345678901234';

interface Fake extends TargetAdapter {
  _state: { config: Config; hadComments: boolean; invalid: boolean };
}

function makeFake(
  id: TargetId,
  label: string,
  opts: { hasEntry?: boolean; hadComments?: boolean; invalid?: boolean },
): Fake {
  const state = {
    config: (opts.hasEntry ? { mcpServers: { 'jobly-mcp': { old: true } } } : { other: true }) as Config,
    hadComments: opts.hadComments ?? false,
    invalid: opts.invalid ?? false,
  };
  const adapter: Fake = {
    id,
    label,
    resolveConfigFile: (scope) => `<${id}-${scope}>`,
    readConfig: () =>
      state.invalid
        ? { kind: 'invalid' as const, error: 'bad' }
        : { kind: 'ok' as const, config: state.config, raw: '', hadComments: state.hadComments },
    hasEntry: (c) =>
      Boolean((c as { mcpServers?: Record<string, unknown> }).mcpServers?.['jobly-mcp']),
    buildEntry: (k) => ({ type: 'http', url: 'x', headers: { Authorization: `Bearer ${k}` } }),
    createNewConfig: (e) => ({ mcpServers: { 'jobly-mcp': e } }),
    setEntry: (c, e) => ({
      ...c,
      mcpServers: {
        ...((c as { mcpServers?: Record<string, unknown> }).mcpServers ?? {}),
        'jobly-mcp': e,
      },
    }),
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

describe('runSetup (multi-target)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the entry to every target in order', async () => {
    const a = makeFake('opencode', 'A', {});
    const b = makeFake('claude', 'B', {});
    await runSetup({ targets: [a, b], apiKey: KEY, scope: 'global', force: false });
    expect(a._state.config).toHaveProperty(['mcpServers', 'jobly-mcp']);
    expect(b._state.config).toHaveProperty(['mcpServers', 'jobly-mcp']);
  });

  it('skips overwrite + comment prompts when force is true', async () => {
    const a = makeFake('opencode', 'A', { hasEntry: true, hadComments: true });
    await runSetup({ targets: [a], apiKey: KEY, scope: 'global', force: true });
    expect(promptOverwrite).not.toHaveBeenCalled();
    expect(promptConfirmCommentLoss).not.toHaveBeenCalled();
  });

  it('prompts overwrite when an existing entry is present and force is false', async () => {
    const a = makeFake('opencode', 'A', { hasEntry: true });
    await runSetup({ targets: [a], apiKey: KEY, scope: 'global', force: false });
    expect(promptOverwrite).toHaveBeenCalledTimes(1);
  });

  it('aborts the whole process (exit 3) when a target is invalid and user aborts', async () => {
    const a = makeFake('opencode', 'A', {});
    const bad = makeFake('claude', 'B', { invalid: true });
    vi.mocked(promptInvalidConfigAction).mockResolvedValueOnce('abort');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(
      runSetup({ targets: [a, bad], apiKey: KEY, scope: 'global', force: false }),
    ).rejects.toThrow('EXIT:3');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });
});
