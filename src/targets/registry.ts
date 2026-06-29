import type { TargetAdapter, TargetId } from './types.js';
import { openCodeAdapter } from './opencode/adapter.js';
import { claudeAdapter } from './claude/adapter.js';
import { codexAdapter } from './codex/adapter.js';

export const TARGET_ADAPTERS: Record<TargetId, TargetAdapter> = {
  opencode: openCodeAdapter,
  claude: claudeAdapter,
  codex: codexAdapter,
};

export const ALL_TARGET_IDS: readonly TargetId[] = ['opencode', 'claude', 'codex'];
export const ALL_ADAPTERS: readonly TargetAdapter[] = ALL_TARGET_IDS.map(
  (id) => TARGET_ADAPTERS[id],
);
