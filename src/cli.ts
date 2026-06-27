#!/usr/bin/env node
import { Command } from 'commander';
import { runSetup } from './commands/setup.js';
import { runUninstall } from './commands/uninstall.js';
import { handleCliError } from './utils/exit.js';

const program = new Command();

program
  .name('jobly-mcp')
  .description('Setup JoblyAI MCP server in your OpenCode config')
  .version('0.1.0')
  .option('-u, --uninstall', 'Remove the jobly-mcp entry instead of adding it')
  .option('-y, --yes', 'Skip confirmation prompts (overwrite, comment-loss)')
  .action(async (opts) => {
    if (opts.uninstall) {
      await runUninstall({ force: opts.yes });
    } else {
      await runSetup({ force: opts.yes });
    }
  });

program.parseAsync(process.argv).catch(handleCliError);
