import { resolveConfigFile } from '../opencode/config-paths.js';
import { readConfig } from '../opencode/read-config.js';
import { writeConfig, hasMcpEntry, removeMcpEntry } from '../opencode/write-config.js';
import { promptScope } from '../prompts/scope.js';
import { promptConfirmCommentLoss } from '../prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../prompts/invalid-config.js';
import { logger } from '../utils/logger.js';

export async function runUninstall(opts: { force?: boolean }): Promise<void> {
  const scope = await promptScope();
  const filePath = resolveConfigFile(scope);

  const result = readConfig(filePath);

  if (result.kind === 'missing') {
    logger.info('jobly-mcp is not configured.');
    process.exit(0);
  }

  if (result.kind === 'invalid') {
    logger.warn(`opencode.json contains invalid JSON: ${result.error}`);
    const action = await promptInvalidConfigAction();
    if (action === 'abort') {
      logger.error('Aborted. Fix the file manually and try again.');
      process.exit(3);
    }
    logger.info('Preserving the broken file. jobly-mcp not removed.');
    process.exit(0);
  }

  let config = result.config;
  const hadComments = result.hadComments;

  if (!hasMcpEntry(config)) {
    logger.info('jobly-mcp is not configured.');
    process.exit(0);
  }

  if (hadComments && !opts.force) {
    const confirm = await promptConfirmCommentLoss();
    if (!confirm) {
      logger.info('Aborted, no changes made.');
      process.exit(130);
    }
  }

  config = removeMcpEntry(config);
  await writeConfig(filePath, config);
  logger.success(`jobly-mcp removed from ${filePath}`);
}
