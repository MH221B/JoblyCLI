import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
import { openCodeAdapter } from '../../src/targets/opencode/adapter.js';
import { promptOverwrite } from '../../src/prompts/overwrite.js';
import { promptConfirmCommentLoss } from '../../src/prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../../src/prompts/invalid-config.js';

const KEY = 'jobly_sk_testkey12345678901234';

describe('runSetup (opencode adapter)', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('creates a new opencode.json when none exists', async () => {
    await runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false });
    const configPath = path.join(tmp, 'opencode.json');
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.$schema).toBe('https://opencode.ai/config.json');
    expect(parsed.mcp['jobly-mcp'].type).toBe('remote');
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe(`Bearer ${KEY}`);
  });

  it('preserves existing mcp servers when adding to an existing config', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: { nx: { type: 'local', command: ['npx', 'nx', 'mcp'] } } }, null, 2),
    );
    await runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false });
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp.nx).toBeDefined();
    expect(parsed.mcp['jobly-mcp']).toBeDefined();
  });

  it('prompts to overwrite when jobly-mcp already exists', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: { 'jobly-mcp': { type: 'remote', url: 'https://jobly.ai.vn/api/mcp', enabled: true, headers: { Authorization: 'Bearer old' } } } }, null, 2),
    );
    await runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false });
    expect(promptOverwrite).toHaveBeenCalled();
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe(`Bearer ${KEY}`);
  });

  it('skips overwrite prompt when force is true', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: { 'jobly-mcp': { type: 'remote', url: 'https://jobly.ai.vn/api/mcp', enabled: true, headers: { Authorization: 'Bearer old' } } } }, null, 2),
    );
    await runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: true });
    expect(promptOverwrite).not.toHaveBeenCalled();
  });

  it('prompts for comment loss when .jsonc has comments', async () => {
    const configPath = path.join(tmp, 'opencode.jsonc');
    fs.writeFileSync(
      configPath,
      ['{', '  // my comment', '  "$schema": "https://opencode.ai/config.json",', '  "mcp": {', '    "nx": { "type": "local", "command": ["nx"] }', '  }', '}'].join('\n'),
    );
    await runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false });
    expect(promptConfirmCommentLoss).toHaveBeenCalled();
  });

  it('exits 130 when user rejects overwrite', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ mcp: { 'jobly-mcp': { type: 'remote', headers: { Authorization: 'Bearer old' } } } }, null, 2),
    );
    vi.mocked(promptOverwrite).mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false })).rejects.toThrow('EXIT:130');
    expect(exitSpy).toHaveBeenCalledWith(130);
  });

  it('exits 3 when invalid config and user chooses abort', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, '{ broken json');
    vi.mocked(promptInvalidConfigAction).mockResolvedValueOnce('abort');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runSetup({ targets: [openCodeAdapter], apiKey: KEY, scope: 'local', force: false })).rejects.toThrow('EXIT:3');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });
});
