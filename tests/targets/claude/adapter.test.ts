import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claudeAdapter } from '../../../src/targets/claude/adapter.js';

const KEY = 'jobly_sk_testkey12345678901234';

describe('claudeAdapter', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('identity + buildEntry shape', () => {
    expect(claudeAdapter.id).toBe('claude');
    expect(claudeAdapter.label).toBe('Claude Code');
    expect(claudeAdapter.buildEntry(KEY)).toEqual({
      type: 'http',
      url: 'https://jobly.ai.vn/api/mcp',
      headers: { Authorization: `Bearer ${KEY}` },
    });
  });

  it('hasEntry/setEntry/removeEntry preserve siblings and top-level keys', () => {
    const entry = claudeAdapter.buildEntry(KEY);
    const base = { numStartups: 7, mcpServers: { nx: { command: 'nx' } } };
    expect(claudeAdapter.hasEntry(base)).toBe(false);

    const merged = claudeAdapter.setEntry(base, entry);
    expect(claudeAdapter.hasEntry(merged)).toBe(true);
    expect(merged.numStartups).toBe(7);
    expect((merged.mcpServers as Record<string, unknown>).nx).toBeDefined();

    const removed = claudeAdapter.removeEntry(merged);
    expect(claudeAdapter.hasEntry(removed)).toBe(false);
    expect(removed.numStartups).toBe(7);
    expect((removed.mcpServers as Record<string, unknown>).nx).toBeDefined();
  });

  it('createNewConfig + writeConfig + readConfig round-trip on .mcp.json', async () => {
    const entry = claudeAdapter.buildEntry(KEY);
    const filePath = claudeAdapter.resolveConfigFile('local');
    await claudeAdapter.writeConfig(filePath, claudeAdapter.createNewConfig(entry));
    const result = claudeAdapter.readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(claudeAdapter.hasEntry(result.config)).toBe(true);
  });
});
