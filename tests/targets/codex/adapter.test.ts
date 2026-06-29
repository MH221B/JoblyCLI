import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { codexAdapter } from '../../../src/targets/codex/adapter.js';
import { parse as parseToml } from 'smol-toml';

const KEY = 'jobly_sk_testkey12345678901234';
const PROJECT_ROOT = process.cwd();

function copyFixture(name: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
  const fixturePath = path.join(PROJECT_ROOT, 'tests', 'fixtures', name);
  const dest = path.join(tmp, name);
  fs.copyFileSync(fixturePath, dest);
  return dest;
}

describe('codexAdapter', () => {
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
    expect(codexAdapter.id).toBe('codex');
    expect(codexAdapter.label).toBe('Codex CLI');
    expect(codexAdapter.buildEntry(KEY)).toEqual({
      url: 'https://jobly.ai.vn/api/mcp',
      http_headers: { Authorization: `Bearer ${KEY}` },
    });
  });

  it('reads an existing config.toml preserving sibling tables', () => {
    const filePath = copyFixture('codex.config.toml');
    const result = codexAdapter.readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(codexAdapter.hasEntry(result.config)).toBe(false);
      expect((result.config.mcp_servers as Record<string, unknown>).docs).toBeDefined();
      expect(result.config.approval_policy).toBe('on-request');
    }
  });

  it('sets hadComments when a config has # comments', () => {
    const result = codexAdapter.readConfig(copyFixture('codex.with-comments.toml'));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(result.hadComments).toBe(true);
  });

  it('returns invalid for broken TOML', () => {
    const result = codexAdapter.readConfig(copyFixture('codex.invalid.toml'));
    expect(result.kind).toBe('invalid');
  });

  it('setEntry/removeEntry preserve sibling mcp_servers and top-level keys', () => {
    const entry = codexAdapter.buildEntry(KEY);
    const base = { approval_policy: 'untrusted', mcp_servers: { docs: { command: 'docs-server' } } };
    const merged = codexAdapter.setEntry(base, entry);
    expect(codexAdapter.hasEntry(merged)).toBe(true);
    expect(merged.approval_policy).toBe('untrusted');
    expect((merged.mcp_servers as Record<string, unknown>).docs).toBeDefined();

    const removed = codexAdapter.removeEntry(merged);
    expect(codexAdapter.hasEntry(removed)).toBe(false);
    expect((removed.mcp_servers as Record<string, unknown>).docs).toBeDefined();
  });

  it('createNewConfig + write + read round-trips and parses back', async () => {
    const entry = codexAdapter.buildEntry(KEY);
    const filePath = codexAdapter.resolveConfigFile('local');
    await codexAdapter.writeConfig(filePath, codexAdapter.createNewConfig(entry));
    const result = codexAdapter.readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(codexAdapter.hasEntry(result.config)).toBe(true);
      const written = parseToml(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
      expect((written.mcp_servers as Record<string, unknown>)['jobly-mcp']).toBeDefined();
    }
  });
});
