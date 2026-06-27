import { logger } from './logger.js';

export function isCancelError(err: unknown): boolean {
  return err instanceof Error && err.name === 'ExitPromptError';
}

export function handleCliError(err: unknown): never {
  if (isCancelError(err)) {
    console.log('');
    process.exit(130);
  }
  if (err instanceof Error) {
    logger.error(err.message);
  } else {
    logger.error('An unknown error occurred');
  }
  if (process.env.DEBUG === '1') {
    console.error(err);
  }
  process.exit(1);
}
