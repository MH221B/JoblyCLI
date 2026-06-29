import fs from 'node:fs';
import { parse as parseToml } from 'smol-toml';
import type { ReadConfigResult, Config } from '../types.js';

function hasTomlComments(raw: string): boolean {
  const withoutStrings = raw.replace(/"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'/g, '""');
  return /#/.test(withoutStrings);
}

export function readCodexConfig(filePath: string): ReadConfigResult {
  if (!fs.existsSync(filePath)) return { kind: 'missing' };
  const raw = fs.readFileSync(filePath, 'utf8');
  const hadComments = hasTomlComments(raw);
  try {
    const config = (raw.trim() === '' ? {} : parseToml(raw)) as Config;
    return { kind: 'ok', config, raw, hadComments };
  } catch (err) {
    return { kind: 'invalid', error: (err as Error).message };
  }
}
