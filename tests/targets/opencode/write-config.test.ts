import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeConfig } from '../../../src/targets/opencode/write-config.js';
import { createNewConfig, buildJoblyMcpEntry, OPENCODE_SCHEMA_URL } from '../../../src/targets/opencode/types.js';

describe('writeConfig', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobly-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true });
  });

  it('writes a new config file', async () => {
    const filePath = path.join(tmp, 'opencode.json');
    const config = createNewConfig(buildJoblyMcpEntry('jobly_sk_test1234567890123456'));
    await writeConfig(filePath, config);
    const written = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(written);
    expect(parsed.$schema).toBe(OPENCODE_SCHEMA_URL);
    expect(parsed.mcp['jobly-mcp'].headers.Authorization).toBe('Bearer jobly_sk_test1234567890123456');
  });

  it('creates parent directories if they do not exist', async () => {
    const filePath = path.join(tmp, 'nested', 'dir', 'opencode.json');
    const config = createNewConfig(buildJoblyMcpEntry('jobly_sk_test1234567890123456'));
    await writeConfig(filePath, config);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('preserves other top-level keys when overwriting', async () => {
    const filePath = path.join(tmp, 'opencode.json');
    const original = {
      $schema: 'https://opencode.ai/config.json',
      compaction: { prune: true },
      mcp: { 'nx': { type: 'local' as const, command: ['nx'] } },
    };
    fs.writeFileSync(filePath, JSON.stringify(original, null, 2));
    await writeConfig(filePath, {
      ...original,
      mcp: { ...original.mcp, 'jobly-mcp': buildJoblyMcpEntry('jobly_sk_newkey123456789012345') },
    });
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(parsed.compaction).toEqual({ prune: true });
    expect(parsed.mcp['nx']).toBeDefined();
    expect(parsed.mcp['jobly-mcp']).toBeDefined();
  });

  it('does not leave .tmp files after successful write', async () => {
    const filePath = path.join(tmp, 'opencode.json');
    await writeConfig(filePath, createNewConfig(buildJoblyMcpEntry('jobly_sk_test1234567890123456')));
    expect(fs.existsSync(filePath + '.tmp')).toBe(false);
  });
});
