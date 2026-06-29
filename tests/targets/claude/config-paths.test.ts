import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveClaudeConfigFile } from '../../../src/targets/claude/config-paths.js';

describe('resolveClaudeConfigFile', () => {
  afterEach(() => vi.restoreAllMocks());

  it('global scope returns ~/.claude.json', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/fake-home');
    expect(resolveClaudeConfigFile('global')).toBe(path.join('/fake-home', '.claude.json'));
  });

  it('local scope returns <git-root>/.mcp.json', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(resolveClaudeConfigFile('local')).toBe(path.join(tmp, '.mcp.json'));
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
