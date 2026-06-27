import { select } from '@inquirer/prompts';

export async function promptScope(): Promise<'global' | 'local'> {
  return select({
    message: 'Where should the config be installed?',
    choices: [
      {
        name: 'Global (~/.config/opencode/)',
        value: 'global' as const,
        description: 'Available in all projects on this machine',
      },
      {
        name: 'Local (current project)',
        value: 'local' as const,
        description: 'Written to the nearest git root as opencode.json',
      },
    ],
  });
}
