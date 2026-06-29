import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/commands/setup.js', () => ({ runSetup: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/commands/uninstall.js', () => ({ runUninstall: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../src/commands/targets.js', () => ({
  resolveSetupTargets: vi.fn().mockResolvedValue([{ id: 'claude', label: 'Claude Code' }]),
  resolveUninstallTargets: vi.fn().mockResolvedValue([{ id: 'claude', label: 'Claude Code' }]),
}));
vi.mock('../src/prompts/api-key.js', () => ({
  promptApiKey: vi.fn().mockResolvedValue('jobly_sk_testkey12345678901234'),
  validateApiKey: vi.fn(),
}));
vi.mock('../src/prompts/scope.js', () => ({
  promptScope: vi.fn().mockResolvedValue('local' as const),
}));

import { run } from '../src/cli.js';
import { runSetup } from '../src/commands/setup.js';
import { runUninstall } from '../src/commands/uninstall.js';
import { resolveSetupTargets, resolveUninstallTargets } from '../src/commands/targets.js';

describe('cli', () => {
  beforeEach(() => vi.clearAllMocks());

  it('routes --claude --codex -y to runSetup with combined flags + force', async () => {
    await run(['node', 'jobly-mcp', '--claude', '--codex', '-y']);
    expect(resolveSetupTargets).toHaveBeenCalledWith({ claude: true, codex: true, opencode: false, all: false });
    expect(runSetup).toHaveBeenCalledWith({
      targets: [{ id: 'claude', label: 'Claude Code' }],
      apiKey: 'jobly_sk_testkey12345678901234',
      scope: 'local',
      force: true,
    });
    expect(runUninstall).not.toHaveBeenCalled();
  });

  it('--all expands to all three flags', async () => {
    await run(['node', 'jobly-mcp', '--all']);
    expect(resolveSetupTargets).toHaveBeenCalledWith({ claude: false, codex: false, opencode: false, all: true });
  });

  it('-u routes to uninstall (scope prompted first)', async () => {
    await run(['node', 'jobly-mcp', '--opencode', '-u']);
    expect(resolveUninstallTargets).toHaveBeenCalledWith({ claude: false, codex: false, opencode: true, all: false }, 'local');
    expect(runUninstall).toHaveBeenCalledWith({ targets: [{ id: 'claude', label: 'Claude Code' }], scope: 'local', force: false });
    expect(runSetup).not.toHaveBeenCalled();
  });
});
