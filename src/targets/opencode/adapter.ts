import type { TargetAdapter } from '../types.js';
import type { OpenCodeConfig, McpServerEntry } from './types.js';
import { resolveConfigFile } from './config-paths.js';
import { readConfig } from './read-config.js';
import { hasMcpEntry, setMcpEntry, removeMcpEntry, writeConfig } from './write-config.js';
import { buildJoblyMcpEntry, createNewConfig } from './types.js';

export const openCodeAdapter: TargetAdapter = {
  id: 'opencode',
  label: 'OpenCode',
  resolveConfigFile,
  readConfig,
  hasEntry: (config) => hasMcpEntry(config as OpenCodeConfig),
  buildEntry: (apiKey) => buildJoblyMcpEntry(apiKey),
  createNewConfig: (entry) => createNewConfig(entry as McpServerEntry),
  setEntry: (config, entry) => setMcpEntry(config as OpenCodeConfig, entry as McpServerEntry),
  removeEntry: (config) => removeMcpEntry(config as OpenCodeConfig),
  writeConfig: (filePath, config) => writeConfig(filePath, config as OpenCodeConfig),
};
