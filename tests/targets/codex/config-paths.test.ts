import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveCodexConfigFile } from '../../../src/targets/codex/config-paths.js';

describe('resolveCodexConfigFile', () => {
  afterEach(() => vi.restoreAllMocks());

  it('global scope returns ~/.codex/config.toml', () => {
    vi.spyOn(os, 'homedir').mockReturnValue('/fake-home');
    expect(resolveCodexConfigFile('global')).toBe(path.join('/fake-home', '.codex', 'config.toml'));
  });

  it('local scope returns <git-root>/.codex/config.toml', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(resolveCodexConfigFile('local')).toBe(path.join(tmp, '.codex', 'config.toml'));
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
