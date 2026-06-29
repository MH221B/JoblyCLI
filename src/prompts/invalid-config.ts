import { select } from '@inquirer/prompts';

export async function promptInvalidConfigAction(fileLabel: string): Promise<'abort' | 'backup'> {
  return select({
    message: `${fileLabel} contains invalid content. What do you want to do?`,
    choices: [
      {
        name: 'Abort (recommended)',
        value: 'abort' as const,
        description: 'Exit without making changes. Fix the file manually first.',
      },
      {
        name: 'Back up the file and continue with a fresh config',
        value: 'backup' as const,
        description: 'Renames the broken file to .bak-<timestamp> and writes a new one',
      },
    ],
  });
}
