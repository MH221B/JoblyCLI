import fs from 'node:fs';
import stripJsonComments from 'strip-json-comments';
import type { OpenCodeConfig } from './types.js';

export type ReadConfigResult =
  | { kind: 'ok'; config: OpenCodeConfig; raw: string; hadComments: boolean }
  | { kind: 'missing' }
  | { kind: 'invalid'; error: string };

export function readConfig(filePath: string): ReadConfigResult {
  if (!fs.existsSync(filePath)) {
    return { kind: 'missing' };
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const stripped = stripJsonComments(raw);
  const hadComments = stripped !== raw;

  try {
    const config = JSON.parse(stripped) as OpenCodeConfig;
    return { kind: 'ok', config, raw, hadComments };
  } catch (err) {
    return { kind: 'invalid', error: (err as Error).message };
  }
}
