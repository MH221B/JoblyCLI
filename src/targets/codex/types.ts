import type { Config, Entry } from '../types.js';
import { JOBLY_MCP_KEY, JOBLY_MCP_URL } from '../types.js';

export const CODEX_MCP_TABLE = 'mcp_servers';

export function buildCodexEntry(apiKey: string): Entry {
  return {
    url: JOBLY_MCP_URL,
    http_headers: { Authorization: `Bearer ${apiKey}` },
  };
}

export function createNewCodexConfig(entry: Entry): Config {
  return { [CODEX_MCP_TABLE]: { [JOBLY_MCP_KEY]: entry } };
}
