export type McpServerEntry = {
  type: 'local' | 'remote';
  url?: string;
  command?: string | string[];
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
  headers?: Record<string, string>;
};

export type OpenCodeConfig = {
  $schema?: string;
  mcp?: Record<string, McpServerEntry>;
  [key: string]: unknown;
};

export const JOBLY_MCP_KEY = 'jobly-mcp' as const;
export const JOBLY_MCP_URL = 'https://jobly.ai.vn/api/mcp' as const;
export const OPENCODE_SCHEMA_URL = 'https://opencode.ai/config.json' as const;

export function buildJoblyMcpEntry(apiKey: string): McpServerEntry {
  return {
    type: 'remote',
    url: JOBLY_MCP_URL,
    enabled: true,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  };
}

export function createNewConfig(entry: McpServerEntry): OpenCodeConfig {
  return {
    $schema: OPENCODE_SCHEMA_URL,
    mcp: {
      [JOBLY_MCP_KEY]: entry,
    },
  };
}
