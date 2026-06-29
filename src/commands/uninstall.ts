import type { TargetAdapter, Scope } from '../targets/types.js';
import { logger } from '../utils/logger.js';
import { promptConfirmCommentLoss } from '../prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../prompts/invalid-config.js';

export interface UninstallOptions {
  targets: TargetAdapter[];
  scope: Scope;
  force: boolean;
}

export async function runUninstall(opts: UninstallOptions): Promise<void> {
  if (opts.targets.length === 0) {
    logger.info('jobly-mcp is not configured.');
    process.exit(0);
  }
  const changed: string[] = [];
  for (const target of opts.targets) {
    const filePath = target.resolveConfigFile(opts.scope);
    const result = target.readConfig(filePath);

    if (result.kind === 'missing') {
      logger.info(`not configured for ${target.label}`);
      continue;
    }
    if (result.kind === 'invalid') {
      logger.warn(`${target.label} config contains invalid content: ${result.error}`);
      const action = await promptInvalidConfigAction(target.label);
      if (action === 'abort') {
        logger.error('Aborted. Fix the file manually and try again.');
        process.exit(3);
      }
      logger.info(`Preserving the broken file. jobly-mcp not removed for ${target.label}.`);
      continue;
    }

    if (!target.hasEntry(result.config)) {
      logger.info(`not configured for ${target.label}`);
      continue;
    }

    if (result.hadComments && !opts.force) {
      const confirm = await promptConfirmCommentLoss();
      if (!confirm) {
        logger.info('Aborted, no changes made.');
        process.exit(130);
      }
    }

    const config = target.removeEntry(result.config);
    await target.writeConfig(filePath, config);
    logger.success(`jobly-mcp removed from ${filePath} (${target.label})`);
    changed.push(filePath);
  }

  if (changed.length === 0) {
    logger.info('jobly-mcp is not configured.');
    process.exit(0);
  }
  logger.step('Done');
  for (const f of changed) logger.info(`  ${f}`);
}
