import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export function getGlobalConfigDir(): string {
  const home = os.homedir();
  const xdg = process.env.XDG_CONFIG_HOME ?? path.join(home, '.config');
  return path.join(xdg, 'opencode');
}

export function getLocalConfigDir(): string {
  let dir = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

export function resolveConfigFile(scope: 'global' | 'local'): string {
  const dir = scope === 'global' ? getGlobalConfigDir() : getLocalConfigDir();
  const jsonc = path.join(dir, 'opencode.jsonc');
  const json = path.join(dir, 'opencode.json');
  if (fs.existsSync(jsonc)) return jsonc;
  if (fs.existsSync(json)) return json;
  return scope === 'global' ? jsonc : json;
}
