import os from 'node:os';
import path from 'node:path';
import type { Scope } from '../types.js';
import { getLocalGitRoot } from '../paths.js';

export function resolveCodexConfigFile(scope: Scope): string {
  if (scope === 'global') return path.join(os.homedir(), '.codex', 'config.toml');
  return path.join(getLocalGitRoot(), '.codex', 'config.toml');
}
