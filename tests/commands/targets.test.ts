import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/prompts/target-select.js', () => ({
  promptTargetSelect: vi.fn(),
}));

import { resolveSetupTargets, resolveUninstallTargets } from '../../src/commands/targets.js';
import type { TargetAdapter, TargetId, Scope, Config, Entry } from '../../src/targets/types.js';
import { promptTargetSelect } from '../../src/prompts/target-select.js';

function makeFake(id: TargetId, hasEntryFlag: boolean, invalid = false): TargetAdapter {
  const config: Config = hasEntryFlag
    ? { mcpServers: { 'jobly-mcp': { old: true } } }
    : { other: true };
  return {
    id,
    label: id,
    resolveConfigFile: (scope: Scope) => `<${id}-${scope}>`,
    readConfig: () =>
      invalid
        ? { kind: 'invalid' as const, error: 'bad' }
        : { kind: 'ok' as const, config, raw: '', hadComments: false },
    hasEntry: (c) =>
      Boolean((c as { mcpServers?: Record<string, unknown> }).mcpServers?.['jobly-mcp']),
    buildEntry: () => ({}) as Entry,
    createNewConfig: (e) => ({ mcpServers: { 'jobly-mcp': e } }),
    setEntry: (c, e) => ({ ...c, mcpServers: { 'jobly-mcp': e } }),
    removeEntry: (c) => {
      const { mcpServers, ...rest } = c as Record<string, unknown>;
      void mcpServers;
      return rest as Config;
    },
    writeConfig: async () => {},
  };
}

const THREE: TargetAdapter[] = [
  makeFake('opencode', false),
  makeFake('claude', false),
  makeFake('codex', false),
];

describe('resolveSetupTargets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns flagged adapters without prompting', async () => {
    const result = await resolveSetupTargets(
      { claude: true, codex: true, opencode: false, all: false },
      THREE,
    );
    expect(result.map((a) => a.id)).toEqual(['claude', 'codex']);
    expect(promptTargetSelect).not.toHaveBeenCalled();
  });

  it('returns all three when --all is set', async () => {
    const result = await resolveSetupTargets(
      { claude: false, codex: false, opencode: false, all: true },
      THREE,
    );
    expect(result.map((a) => a.id)).toEqual(['opencode', 'claude', 'codex']);
    expect(promptTargetSelect).not.toHaveBeenCalled();
  });

  it('prompts with required:true when no flags given', async () => {
    vi.mocked(promptTargetSelect).mockResolvedValueOnce(['claude']);
    const result = await resolveSetupTargets(
      { claude: false, codex: false, opencode: false, all: false },
      THREE,
    );
    expect(result.map((a) => a.id)).toEqual(['claude']);
    expect(promptTargetSelect).toHaveBeenCalledWith(['opencode', 'claude', 'codex'], { required: true });
  });
});

describe('resolveUninstallTargets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns flagged adapters without scanning', async () => {
    const result = await resolveUninstallTargets(
      { claude: true, codex: false, opencode: false, all: false },
      'local',
      THREE,
    );
    expect(result.map((a) => a.id)).toEqual(['claude']);
    expect(promptTargetSelect).not.toHaveBeenCalled();
  });

  it('returns [] when no flags and no adapter has an entry (no prompt)', async () => {
    const result = await resolveUninstallTargets(
      { claude: false, codex: false, opencode: false, all: false },
      'global',
      THREE,
    );
    expect(result).toEqual([]);
    expect(promptTargetSelect).not.toHaveBeenCalled();
  });

  it('prompts with checked=available when some adapters have an entry', async () => {
    const withEntries: TargetAdapter[] = [
      makeFake('opencode', false),
      makeFake('claude', true),
      makeFake('codex', true),
    ];
    vi.mocked(promptTargetSelect).mockResolvedValueOnce(['claude']);
    const result = await resolveUninstallTargets(
      { claude: false, codex: false, opencode: false, all: false },
      'local',
      withEntries,
    );
    expect(result.map((a) => a.id)).toEqual(['claude']);
    expect(promptTargetSelect).toHaveBeenCalledWith(['claude', 'codex'], {
      required: false,
      checked: ['claude', 'codex'],
    });
  });
});
