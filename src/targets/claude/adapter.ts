import type { TargetAdapter, Config, Entry } from '../types.js';
import { JOBLY_MCP_KEY } from '../types.js';
import { resolveClaudeConfigFile } from './config-paths.js';
import { readClaudeConfig } from './read-config.js';
import { writeClaudeConfig } from './write-config.js';
import { buildClaudeEntry, createNewClaudeConfig, CLAUDE_MCP_SERVERS_KEY } from './types.js';

function serversOf(config: Config): Record<string, Entry> | undefined {
  return (config as Record<string, unknown>)[CLAUDE_MCP_SERVERS_KEY] as
    | Record<string, Entry>
    | undefined;
}

export const claudeAdapter: TargetAdapter = {
  id: 'claude',
  label: 'Claude Code',
  resolveConfigFile: resolveClaudeConfigFile,
  readConfig: readClaudeConfig,
  hasEntry(config) {
    return Boolean(serversOf(config)?.[JOBLY_MCP_KEY]);
  },
  buildEntry: buildClaudeEntry,
  createNewConfig: createNewClaudeConfig,
  setEntry(config, entry) {
    const servers = serversOf(config) ?? {};
    return { ...config, [CLAUDE_MCP_SERVERS_KEY]: { ...servers, [JOBLY_MCP_KEY]: entry } };
  },
  removeEntry(config) {
    const servers = serversOf(config);
    if (!servers) return config;
    const rest: Record<string, Entry> = {};
    for (const [k, v] of Object.entries(servers)) {
      if (k !== JOBLY_MCP_KEY) rest[k] = v;
    }
    return { ...config, [CLAUDE_MCP_SERVERS_KEY]: rest };
  },
  writeConfig: writeClaudeConfig,
};
