import { confirm } from '@inquirer/prompts';

export async function promptOverwrite(): Promise<boolean> {
  return confirm({
    message: 'jobly-mcp is already configured. Overwrite?',
    default: false,
  });
}
