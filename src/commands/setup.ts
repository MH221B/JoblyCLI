import fs from 'node:fs';
import type { TargetAdapter, Scope, Config } from '../targets/types.js';
import { logger } from '../utils/logger.js';
import { promptOverwrite } from '../prompts/overwrite.js';
import { promptConfirmCommentLoss } from '../prompts/confirm-comment-loss.js';
import { promptInvalidConfigAction } from '../prompts/invalid-config.js';

export interface SetupOptions {
  targets: TargetAdapter[];
  apiKey: string;
  scope: Scope;
  force: boolean;
}

export async function runSetup(opts: SetupOptions): Promise<void> {
  const written: string[] = [];
  for (const target of opts.targets) {
    const filePath = target.resolveConfigFile(opts.scope);
    const result = target.readConfig(filePath);
    let config: Config;

    if (result.kind === 'missing') {
      config = target.createNewConfig(target.buildEntry(opts.apiKey));
    } else if (result.kind === 'invalid') {
      logger.warn(`${target.label} config contains invalid content: ${result.error}`);
      const action = await promptInvalidConfigAction(target.label);
      if (action === 'abort') {
        logger.error('Aborted. Fix the file manually and try again.');
        process.exit(3);
      }
      const backupPath = `${filePath}.bak-${Date.now()}`;
      fs.renameSync(filePath, backupPath);
      logger.info(`Backed up to ${backupPath}`);
      config = target.createNewConfig(target.buildEntry(opts.apiKey));
    } else {
      config = result.config;
      if (target.hasEntry(config) && !opts.force) {
        const overwrite = await promptOverwrite();
        if (!overwrite) {
          logger.info('Aborted, no changes made.');
          process.exit(130);
        }
      }
      if (result.hadComments && !opts.force) {
        const confirm = await promptConfirmCommentLoss();
        if (!confirm) {
          logger.info('Aborted, no changes made.');
          process.exit(130);
        }
      }
      config = target.setEntry(config, target.buildEntry(opts.apiKey));
    }

    await target.writeConfig(filePath, config);
    logger.success(`jobly-mcp added to ${filePath} (${target.label})`);
    written.push(filePath);
  }
  if (written.length > 0) {
    logger.step('Done');
    for (const f of written) logger.info(`  ${f}`);
  }
}
