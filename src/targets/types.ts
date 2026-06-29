export type TargetId = 'opencode' | 'claude' | 'codex';
export type Scope = 'global' | 'local';
export type Config = Record<string, unknown>;
export type Entry = Record<string, unknown>;

export const JOBLY_MCP_KEY = 'jobly-mcp';
export const JOBLY_MCP_URL = 'https://jobly.ai.vn/api/mcp';

export type ReadConfigResult =
  | { kind: 'ok'; config: Config; raw: string; hadComments: boolean }
  | { kind: 'missing' }
  | { kind: 'invalid'; error: string };

export interface TargetAdapter {
  readonly id: TargetId;
  readonly label: string;
  resolveConfigFile(scope: Scope): string;
  readConfig(filePath: string): ReadConfigResult;
  hasEntry(config: Config): boolean;
  buildEntry(apiKey: string): Entry;
  createNewConfig(entry: Entry): Config;
  setEntry(config: Config, entry: Entry): Config;
  removeEntry(config: Config): Config;
  writeConfig(filePath: string, config: Config): Promise<void>;
}
