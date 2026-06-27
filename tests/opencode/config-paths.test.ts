import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getGlobalConfigDir, getLocalConfigDir, resolveConfigFile } from '../../src/opencode/config-paths.js';

describe('getGlobalConfigDir', () => {
  const originalXdg = process.env.XDG_CONFIG_HOME;

  afterEach(() => {
    process.env.XDG_CONFIG_HOME = originalXdg;
    vi.restoreAllMocks();
  });

  it('uses XDG_CONFIG_HOME when set', () => {
    process.env.XDG_CONFIG_HOME = '/custom/xdg';
    expect(getGlobalConfigDir()).toBe(path.join('/custom/xdg', 'opencode'));
  });

  it('falls back to ~/.config when XDG_CONFIG_HOME is not set', () => {
    delete process.env.XDG_CONFIG_HOME;
    vi.spyOn(os, 'homedir').mockReturnValue('/fake-home');
    expect(getGlobalConfigDir()).toBe(path.join('/fake-home', '.config', 'opencode'));
  });
});

describe('getLocalConfigDir', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cwd when .git is in cwd', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(getLocalConfigDir()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true });
  });

  it('walks up to find .git in parent directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    const subdir = path.join(tmp, 'sub', 'deep', 'dir');
    fs.mkdirSync(subdir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(subdir);
    expect(getLocalConfigDir()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true });
  });

  it('falls back to cwd when no .git found anywhere up the tree', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(getLocalConfigDir()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true });
  });
});

describe('resolveConfigFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers opencode.jsonc when it exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.writeFileSync(path.join(tmp, 'opencode.jsonc'), '{}');
    fs.writeFileSync(path.join(tmp, 'opencode.json'), '{}');
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(resolveConfigFile('local')).toBe(path.join(tmp, 'opencode.jsonc'));
    fs.rmSync(tmp, { recursive: true });
  });

  it('falls back to opencode.json when .jsonc does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.writeFileSync(path.join(tmp, 'opencode.json'), '{}');
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(resolveConfigFile('local')).toBe(path.join(tmp, 'opencode.json'));
    fs.rmSync(tmp, { recursive: true });
  });

  it('returns .json for local scope when neither exists (default for creation)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(resolveConfigFile('local')).toBe(path.join(tmp, 'opencode.json'));
    fs.rmSync(tmp, { recursive: true });
  });

  it('returns .jsonc for global scope when neither exists (default for creation)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    process.env.XDG_CONFIG_HOME = tmp;
    expect(resolveConfigFile('global')).toBe(path.join(tmp, 'opencode', 'opencode.jsonc'));
    delete process.env.XDG_CONFIG_HOME;
    fs.rmSync(tmp, { recursive: true });
  });
});
