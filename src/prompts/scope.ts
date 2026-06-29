import { select } from '@inquirer/prompts';

export async function promptScope(): Promise<'global' | 'local'> {
  return select({
    message: 'Where should the config be installed?',
    choices: [
      {
        name: 'Global (user home)',
        value: 'global' as const,
        description: 'Available across all projects on this machine',
      },
      {
        name: 'Local (current project)',
        value: 'local' as const,
        description: 'Scoped to the nearest git project',
      },
    ],
  });
}
