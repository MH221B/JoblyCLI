import os from 'node:os';
import path from 'node:path';
import type { Scope } from '../types.js';
import { getLocalGitRoot } from '../paths.js';

export function resolveClaudeConfigFile(scope: Scope): string {
  if (scope === 'global') return path.join(os.homedir(), '.claude.json');
  return path.join(getLocalGitRoot(), '.mcp.json');
}
