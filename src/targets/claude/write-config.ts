import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '../types.js';

export async function writeClaudeConfig(filePath: string, config: Config): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, filePath);
}
