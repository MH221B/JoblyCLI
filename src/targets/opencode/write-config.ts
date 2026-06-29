import fs from 'node:fs';
import path from 'node:path';
import type { OpenCodeConfig, McpServerEntry } from './types.js';
import { JOBLY_MCP_KEY } from './types.js';

export function hasMcpEntry(config: OpenCodeConfig): boolean {
  return Boolean(config.mcp?.[JOBLY_MCP_KEY]);
}

export function setMcpEntry(config: OpenCodeConfig, entry: McpServerEntry): OpenCodeConfig {
  return {
    ...config,
    mcp: {
      ...(config.mcp ?? {}),
      [JOBLY_MCP_KEY]: entry,
    },
  };
}

export function removeMcpEntry(config: OpenCodeConfig): OpenCodeConfig {
  if (!config.mcp) return config;
  const rest: Record<string, McpServerEntry> = {};
  for (const [key, value] of Object.entries(config.mcp)) {
    if (key !== JOBLY_MCP_KEY) rest[key] = value;
  }
  return { ...config, mcp: rest };
}

export async function writeConfig(filePath: string, config: OpenCodeConfig): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = filePath + '.tmp';
  const content = JSON.stringify(config, null, 2) + '\n';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}
