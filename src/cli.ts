#!/usr/bin/env node
import { Command } from 'commander';
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { runSetup } from './commands/setup.js';
import { runUninstall } from './commands/uninstall.js';
import { resolveSetupTargets, resolveUninstallTargets } from './commands/targets.js';
import type { TargetFlags } from './commands/targets.js';
import { promptApiKey } from './prompts/api-key.js';
import { promptScope } from './prompts/scope.js';
import { handleCliError } from './utils/exit.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('jobly-mcp')
    .description('Setup JoblyAI MCP server in your OpenCode, Claude Code, or Codex CLI config')
    .version('2.0.0')
    .option('--claude', 'Configure Claude Code')
    .option('--codex', 'Configure Codex CLI')
    .option('--opencode', 'Configure OpenCode')
    .option('--all', 'Configure all supported CLIs')
    .option('-u, --uninstall', 'Remove the jobly-mcp entry instead of adding it')
    .option('-y, --yes', 'Skip confirmation prompts (overwrite, comment-loss)')
    .action(async (opts) => {
      const flags: TargetFlags = {
        claude: Boolean(opts.claude),
        codex: Boolean(opts.codex),
        opencode: Boolean(opts.opencode),
        all: Boolean(opts.all),
      };
      if (opts.uninstall) {
        const scope = await promptScope();
        const targets = await resolveUninstallTargets(flags, scope);
        await runUninstall({ targets, scope, force: Boolean(opts.yes) });
      } else {
        const targets = await resolveSetupTargets(flags);
        const apiKey = await promptApiKey();
        const scope = await promptScope();
        await runSetup({ targets, apiKey, scope, force: Boolean(opts.yes) });
      }
    });

  return program;
}

export async function run(argv: string[] = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

function isMainModule(): boolean {
  if (!process.argv[1]) return false;
  try {
    const argReal = realpathSync(process.argv[1]);
    const modReal = realpathSync(pathToFileURL(import.meta.url));
    return argReal === modReal;
  } catch {
    return true;
  }
}

if (isMainModule()) {
  run().catch(handleCliError);
}
