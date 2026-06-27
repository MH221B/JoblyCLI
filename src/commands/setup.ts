import fs from 'node:fs';
import { resolveConfigFile } from '../opencode/config-paths.js';
import { readConfig } from '../opencode/read-config.js';
import { writeConfig, hasMcpEntry, setMcpEntry } from '../opencode/write-config.js';
import { buildJoblyMcpEntry, createNewConfig } from '../opencode/types.js';
import { promptApiKey } from '../prompts/api-key.js';
import { promptScope } from '../prompts/scope.js';
import { promptOverwrite } from '../prompts/overwrite.js';
import { promptConfirmCommentLoss } from '../prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../prompts/invalid-config.js';
import { logger } from '../utils/logger.js';

export async function runSetup(opts: { force?: boolean }): Promise<void> {
  const apiKey = await promptApiKey();
  const scope = await promptScope();
  const filePath = resolveConfigFile(scope);

  const result = readConfig(filePath);

  let config;

  if (result.kind === 'missing') {
    config = createNewConfig(buildJoblyMcpEntry(apiKey));
  } else if (result.kind === 'invalid') {
    logger.warn(`opencode.json contains invalid JSON: ${result.error}`);
    const action = await promptInvalidConfigAction();
    if (action === 'abort') {
      logger.error('Aborted. Fix the file manually and try again.');
      process.exit(3);
    }
    const backupPath = `${filePath}.bak-${Date.now()}`;
    fs.renameSync(filePath, backupPath);
    logger.info(`Backed up to ${backupPath}`);
    config = createNewConfig(buildJoblyMcpEntry(apiKey));
  } else {
    config = result.config;
    const hadComments = result.hadComments;

    if (hasMcpEntry(config) && !opts.force) {
      const overwrite = await promptOverwrite();
      if (!overwrite) {
        logger.info('Aborted, no changes made.');
        process.exit(130);
      }
    }

    if (hadComments && !opts.force) {
      const confirm = await promptConfirmCommentLoss();
      if (!confirm) {
        logger.info('Aborted, no changes made.');
        process.exit(130);
      }
    }

    config = setMcpEntry(config, buildJoblyMcpEntry(apiKey));
  }

  await writeConfig(filePath, config);
  logger.success(`jobly-mcp added to ${filePath}`);
}
