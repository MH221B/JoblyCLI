import { confirm } from '@inquirer/prompts';

export async function promptConfirmCommentLoss(): Promise<boolean> {
  return confirm({
    message: 'This file contains comments that will be lost when rewriting. Continue?',
    default: false,
  });
}
