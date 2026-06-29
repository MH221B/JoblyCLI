import { checkbox } from '@inquirer/prompts';
import type { TargetId } from '../targets/types.js';
import { TARGET_ADAPTERS } from '../targets/registry.js';

export async function promptTargetSelect(
  available: readonly TargetId[],
  opts: { required?: boolean; checked?: readonly TargetId[] } = {},
): Promise<TargetId[]> {
  const checked = new Set(opts.checked ?? []);
  return checkbox<TargetId>({
    message: 'Which CLIs should get the JoblyAI MCP server?',
    required: opts.required ?? false,
    loop: false,
    choices: available.map((id) => ({
      name: TARGET_ADAPTERS[id].label,
      value: id,
      checked: checked.has(id),
    })),
  });
}
