import pc from 'picocolors';

export const logger = {
  info: (msg: string): void => console.log(pc.cyan('ℹ') + ' ' + msg),
  success: (msg: string): void => console.log(pc.green('✓') + ' ' + msg),
  warn: (msg: string): void => console.warn(pc.yellow('⚠') + ' ' + msg),
  error: (msg: string): void => console.error(pc.red('✗') + ' ' + msg),
  step: (msg: string): void => console.log(pc.bold('\n' + msg)),
};
