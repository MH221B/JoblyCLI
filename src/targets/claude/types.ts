import type { Config, Entry } from '../types.js';
import { JOBLY_MCP_KEY, JOBLY_MCP_URL } from '../types.js';

export const CLAUDE_MCP_SERVERS_KEY = 'mcpServers';

export function buildClaudeEntry(apiKey: string): Entry {
  return {
    type: 'http',
    url: JOBLY_MCP_URL,
    headers: { Authorization: `Bearer ${apiKey}` },
  };
}

export function createNewClaudeConfig(entry: Entry): Config {
  return { [CLAUDE_MCP_SERVERS_KEY]: { [JOBLY_MCP_KEY]: entry } };
}
