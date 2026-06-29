import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getLocalGitRoot } from '../../src/targets/paths.js';

describe('getLocalGitRoot', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns cwd when .git is in cwd', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(getLocalGitRoot()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('walks up to find .git in a parent directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    fs.mkdirSync(path.join(tmp, '.git'));
    const subdir = path.join(tmp, 'sub', 'deep', 'dir');
    fs.mkdirSync(subdir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(subdir);
    expect(getLocalGitRoot()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('falls back to cwd when no .git found up the tree', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    expect(getLocalGitRoot()).toBe(tmp);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
