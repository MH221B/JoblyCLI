import { describe, it, expect, vi } from 'vitest';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['claude', 'codex']),
}));

import { checkbox } from '@inquirer/prompts';
import { promptTargetSelect } from '../../src/prompts/target-select.js';

describe('promptTargetSelect', () => {
  it('calls checkbox with labels from the registry and returns selected ids', async () => {
    const result = await promptTargetSelect(['opencode', 'claude', 'codex'], {
      required: true,
      checked: ['claude'],
    });
    expect(result).toEqual(['claude', 'codex']);
    const call = vi.mocked(checkbox).mock.calls[0][0] as {
      message: string;
      required: boolean;
      choices: { name: string; value: string; checked: boolean }[];
    };
    expect(call.required).toBe(true);
    expect(call.choices.map((c) => c.value)).toEqual(['opencode', 'claude', 'codex']);
    expect(call.choices.map((c) => c.name)).toEqual(['OpenCode', 'Claude Code', 'Codex CLI']);
    expect(call.choices.find((c) => c.value === 'claude')!.checked).toBe(true);
    expect(call.choices.find((c) => c.value === 'opencode')!.checked).toBe(false);
  });
});
