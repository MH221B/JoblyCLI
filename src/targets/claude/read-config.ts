import fs from 'node:fs';
import stripJsonComments from 'strip-json-comments';
import type { ReadConfigResult, Config } from '../types.js';

export function readClaudeConfig(filePath: string): ReadConfigResult {
  if (!fs.existsSync(filePath)) return { kind: 'missing' };
  const raw = fs.readFileSync(filePath, 'utf8');
  const stripped = stripJsonComments(raw);
  const hadComments = stripped !== raw;
  try {
    const config = JSON.parse(stripped) as Config;
    return { kind: 'ok', config, raw, hadComments };
  } catch (err) {
    return { kind: 'invalid', error: (err as Error).message };
  }
}
