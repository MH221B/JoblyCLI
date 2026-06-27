import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readConfig } from '../../src/opencode/read-config.js';

function copyFixture(name: string): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', name);
  const dest = path.join(tmp, name);
  fs.copyFileSync(fixturePath, dest);
  return dest;
}

describe('readConfig', () => {
  it('returns missing when file does not exist', () => {
    const result = readConfig(path.join(os.tmpdir(), 'nonexistent-' + Date.now() + '.json'));
    expect(result).toEqual({ kind: 'missing' });
  });

  it('returns ok for valid .json', () => {
    const filePath = copyFixture('with-other-mcp.json');
    const result = readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.hadComments).toBe(false);
      expect(result.config.mcp?.['nx']).toBeDefined();
      expect(result.config.$schema).toBe('https://opencode.ai/config.json');
    }
  });

  it('returns ok for .jsonc with comments and sets hadComments to true', () => {
    const filePath = copyFixture('with-jobly-mcp.jsonc');
    const result = readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.hadComments).toBe(true);
      expect(result.config.mcp?.['jobly-mcp']).toBeDefined();
      expect(result.config.$schema).toBe('https://opencode.ai/config.json');
    }
  });

  it('returns ok for .jsonc with comments and other keys preserved', () => {
    const filePath = copyFixture('with-other-keys.jsonc');
    const result = readConfig(filePath);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.hadComments).toBe(true);
      expect(result.config.compaction).toEqual({ prune: false });
      expect(result.config.mcp?.['context7']).toBeDefined();
    }
  });

  it('returns invalid for broken JSON', () => {
    const filePath = copyFixture('invalid.json');
    const result = readConfig(filePath);
    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns invalid for empty file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
    const filePath = path.join(tmp, 'opencode.json');
    fs.writeFileSync(filePath, '');
    const result = readConfig(filePath);
    expect(result.kind).toBe('invalid');
    fs.rmSync(tmp, { recursive: true });
  });
});
