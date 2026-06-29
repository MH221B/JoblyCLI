import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readClaudeConfig } from '../../../src/targets/claude/read-config.js';

function copyFixture(name: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', name);
  const dest = path.join(tmp, name);
  fs.copyFileSync(fixturePath, dest);
  return dest;
}

describe('readClaudeConfig', () => {
  it('returns missing when file does not exist', () => {
    const result = readClaudeConfig(path.join(os.tmpdir(), `nope-${Date.now()}.json`));
    expect(result).toEqual({ kind: 'missing' });
  });

  it('returns ok for a .mcp.json without comments', () => {
    const result = readClaudeConfig(copyFixture('claude.mcp.json'));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.hadComments).toBe(false);
      expect((result.config.mcpServers as Record<string, unknown>).nx).toBeDefined();
    }
  });

  it('preserves non-mcpServers top-level keys in user config', () => {
    const result = readClaudeConfig(copyFixture('claude.claude-user.json'));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.config.numStartups).toBe(42);
      expect((result.config.mcpServers as Record<string, unknown>).old).toBeDefined();
    }
  });

  it('sets hadComments for a jsonc with comments', () => {
    const result = readClaudeConfig(copyFixture('claude.with-comments.jsonc'));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(result.hadComments).toBe(true);
  });

  it('returns invalid for broken JSON', () => {
    const result = readClaudeConfig(copyFixture('claude.invalid.json'));
    expect(result.kind).toBe('invalid');
  });
});
