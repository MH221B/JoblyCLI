import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('../../src/prompts/api-key.js', () => ({
  promptApiKey: vi.fn().mockResolvedValue('jobly_sk_testkey12345678901234'),
  validateApiKey: vi.fn((input: string) => input.trim() ? true : 'empty'),
}));
vi.mock('../../src/prompts/scope.js', () => ({
  promptScope: vi.fn().mockResolvedValue('local' as const),
}));
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
import { promptScope } from '../../src/prompts/scope.js';
import { promptOverwrite } from '../../src/prompts/overwrite.js';
import { promptConfirmCommentLoss } from '../../src/prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../../src/prompts/invalid-config.js';

describe('runSetup', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    // Create .git so getLocalConfigDir finds it
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('creates a new opencode.json when none exists', async () => {
    await runSetup({ force: false });
    const configPath = path.join(tmp, 'opencode.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.$schema).toBe('https://opencode.ai/config.json');
    expect(parsed.mcp['jobly-mcp'].type).toBe('remote');
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe('Bearer jobly_sk_testkey12345678901234');
  });

  it('preserves existing mcp servers when adding to existing config', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: { 'nx': { type: 'local', command: ['npx', 'nx', 'mcp'] } },
    }, null, 2));
    await runSetup({ force: false });
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp['nx']).toBeDefined();
    expect(parsed.mcp['jobly-mcp']).toBeDefined();
  });

  it('prompts to overwrite when jobly-mcp already exists', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        'jobly-mcp': {
          type: 'remote',
          url: 'http://localhost:3000/api/mcp',
          enabled: true,
          headers: { Authorization: 'Bearer jobly_sk_oldkey00000000000000' },
        },
      },
    }, null, 2));
    await runSetup({ force: false });
    expect(promptOverwrite).toHaveBeenCalled();
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe('Bearer jobly_sk_testkey12345678901234');
  });

  it('skips overwrite prompt when force is true', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        'jobly-mcp': {
          type: 'remote',
          url: 'http://localhost:3000/api/mcp',
          enabled: true,
          headers: { Authorization: 'Bearer jobly_sk_oldkey00000000000000' },
        },
      },
    }, null, 2));
    await runSetup({ force: true });
    expect(promptOverwrite).not.toHaveBeenCalled();
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe('Bearer jobly_sk_testkey12345678901234');
  });

  it('prompts for comment loss when .jsonc has comments', async () => {
    const configPath = path.join(tmp, 'opencode.jsonc');
    fs.writeFileSync(configPath, [
      '{',
      '  // my comment',
      '  "$schema": "https://opencode.ai/config.json",',
      '  "mcp": {',
      '    "nx": { "type": "local", "command": ["nx"] }',
      '  }',
      '}',
    ].join('\n'));
    await runSetup({ force: false });
    expect(promptConfirmCommentLoss).toHaveBeenCalled();
  });

  it('does not prompt for comment loss when file has no comments', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: { 'nx': { type: 'local', command: ['nx'] } },
    }, null, 2));
    await runSetup({ force: false });
    expect(promptConfirmCommentLoss).not.toHaveBeenCalled();
  });

  it('exits 130 when user rejects overwrite', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: { 'jobly-mcp': { type: 'remote', url: 'http://localhost:3000/api/mcp', enabled: true, headers: { Authorization: 'Bearer old' } } },
    }, null, 2));
    vi.mocked(promptOverwrite).mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runSetup({ force: false })).rejects.toThrow('EXIT:130');
    expect(exitSpy).toHaveBeenCalledWith(130);
  });

  it('exits 130 when user rejects comment loss', async () => {
    const configPath = path.join(tmp, 'opencode.jsonc');
    fs.writeFileSync(configPath, '{ // comment\n"mcp": { "nx": { "type": "local" } } }');
    vi.mocked(promptConfirmCommentLoss).mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runSetup({ force: false })).rejects.toThrow('EXIT:130');
    expect(exitSpy).toHaveBeenCalledWith(130);
  });

  it('exits 3 when invalid config and user chooses abort', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, '{ broken json');
    vi.mocked(promptInvalidConfigAction).mockResolvedValueOnce('abort');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runSetup({ force: false })).rejects.toThrow('EXIT:3');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });
});
