import type { TargetAdapter, Config, Entry } from '../types.js';
import { JOBLY_MCP_KEY } from '../types.js';
import { resolveCodexConfigFile } from './config-paths.js';
import { readCodexConfig } from './read-config.js';
import { writeCodexConfig } from './write-config.js';
import { buildCodexEntry, createNewCodexConfig, CODEX_MCP_TABLE } from './types.js';

function tableOf(config: Config): Record<string, Entry> | undefined {
  return (config as Record<string, unknown>)[CODEX_MCP_TABLE] as Record<string, Entry> | undefined;
}

export const codexAdapter: TargetAdapter = {
  id: 'codex',
  label: 'Codex CLI',
  resolveConfigFile: resolveCodexConfigFile,
  readConfig: readCodexConfig,
  hasEntry(config) {
    return Boolean(tableOf(config)?.[JOBLY_MCP_KEY]);
  },
  buildEntry: buildCodexEntry,
  createNewConfig: createNewCodexConfig,
  setEntry(config, entry) {
    const table = tableOf(config) ?? {};
    return { ...config, [CODEX_MCP_TABLE]: { ...table, [JOBLY_MCP_KEY]: entry } };
  },
  removeEntry(config) {
    const table = tableOf(config);
    if (!table) return config;
    const rest: Record<string, Entry> = {};
    for (const [k, v] of Object.entries(table)) {
      if (k !== JOBLY_MCP_KEY) rest[k] = v;
    }
    return { ...config, [CODEX_MCP_TABLE]: rest };
  },
  writeConfig: writeCodexConfig,
};
