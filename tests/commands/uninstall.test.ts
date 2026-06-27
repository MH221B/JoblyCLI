import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('../../src/prompts/api-key.js', () => ({
  promptApiKey: vi.fn(),
  validateApiKey: vi.fn(),
}));
vi.mock('../../src/prompts/scope.js', () => ({
  promptScope: vi.fn().mockResolvedValue('local' as const),
}));
vi.mock('../../src/prompts/confirm-comment-loss.js', () => ({
  promptConfirmCommentLoss: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../src/prompts/invalid-config.js', () => ({
  promptInvalidConfigAction: vi.fn().mockResolvedValue('backup' as const),
}));

import { runUninstall } from '../../src/commands/uninstall.js';
import { promptConfirmCommentLoss } from '../../src/prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../../src/prompts/invalid-config.js';

describe('runUninstall', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('removes jobly-mcp and preserves other servers', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        'jobly-mcp': {
          type: 'remote',
          url: 'http://localhost:3000/api/mcp',
          enabled: true,
          headers: { Authorization: 'Bearer jobly_sk_test1234567890123456' },
        },
        'nx': { type: 'local', command: ['nx'] },
      },
    }, null, 2));
    await runUninstall({ force: false });
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(parsed.mcp['jobly-mcp']).toBeUndefined();
    expect(parsed.mcp['nx']).toBeDefined();
    expect(parsed.$schema).toBe('https://opencode.ai/config.json');
  });

  it('exits 0 with message when jobly-mcp is not configured', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      mcp: { 'nx': { type: 'local', command: ['nx'] } },
    }, null, 2));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(runUninstall({ force: false })).rejects.toThrow('EXIT:0');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 0 when no config file exists', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });
    await expect(runUninstall({ force: false })).rejects.toThrow('EXIT:0');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('prompts for comment loss when .jsonc has comments', async () => {
    const configPath = path.join(tmp, 'opencode.jsonc');
    fs.writeFileSync(configPath, [
      '{',
      '  // my comment',
      '  "$schema": "https://opencode.ai/config.json",',
      '  "mcp": {',
      '    "jobly-mcp": { "type": "remote", "url": "http://localhost:3000/api/mcp", "enabled": true, "headers": { "Authorization": "Bearer jobly_sk_test1234567890123456" } }',
      '  }',
      '}',
    ].join('\n'));
    await runUninstall({ force: false });
    expect(promptConfirmCommentLoss).toHaveBeenCalled();
  });

  it('exits 130 when user rejects comment loss', async () => {
    const configPath = path.join(tmp, 'opencode.jsonc');
    fs.writeFileSync(configPath, '{ // comment\n"mcp": { "jobly-mcp": { "type": "remote" } } }');
    vi.mocked(promptConfirmCommentLoss).mockResolvedValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runUninstall({ force: false })).rejects.toThrow('EXIT:130');
    expect(exitSpy).toHaveBeenCalledWith(130);
  });

  it('exits 3 when invalid config and user chooses abort', async () => {
    const configPath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(configPath, '{ broken json');
    vi.mocked(promptInvalidConfigAction).mockResolvedValueOnce('abort');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT:${code}`); });
    await expect(runUninstall({ force: false })).rejects.toThrow('EXIT:3');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });
});
