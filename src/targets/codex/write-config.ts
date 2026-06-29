import fs from 'node:fs';
import path from 'node:path';
import { stringify as stringifyToml } from 'smol-toml';
import type { Config } from '../types.js';

export async function writeCodexConfig(filePath: string, config: Config): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, stringifyToml(config) + '\n', 'utf8');
  fs.renameSync(tmp, filePath);
}
