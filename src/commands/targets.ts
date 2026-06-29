import type { TargetAdapter, TargetId, Scope } from '../targets/types.js';
import { ALL_ADAPTERS } from '../targets/registry.js';
import { promptTargetSelect } from '../prompts/target-select.js';
import { logger } from '../utils/logger.js';

export interface TargetFlags {
  claude: boolean;
  codex: boolean;
  opencode: boolean;
  all: boolean;
}

function flaggedIds(flags: TargetFlags): TargetId[] | null {
  const ids: TargetId[] = [];
  if (flags.opencode) ids.push('opencode');
  if (flags.claude) ids.push('claude');
  if (flags.codex) ids.push('codex');
  if (ids.length > 0 || flags.all) {
    return flags.all ? ['opencode', 'claude', 'codex'] : ids;
  }
  return null;
}

export async function resolveSetupTargets(
  flags: TargetFlags,
  adapters: readonly TargetAdapter[] = ALL_ADAPTERS,
): Promise<TargetAdapter[]> {
  const byId = new Map(adapters.map((a) => [a.id, a] as const));
  const ids = flaggedIds(flags);
  if (ids) return ids.map((id) => byId.get(id)!);
  const selected = await promptTargetSelect(
    adapters.map((a) => a.id),
    { required: true },
  );
  return selected.map((id) => byId.get(id)!);
}

export async function resolveUninstallTargets(
  flags: TargetFlags,
  scope: Scope,
  adapters: readonly TargetAdapter[] = ALL_ADAPTERS,
): Promise<TargetAdapter[]> {
  const byId = new Map(adapters.map((a) => [a.id, a] as const));
  const ids = flaggedIds(flags);
  if (ids) return ids.map((id) => byId.get(id)!);

  const available: TargetId[] = [];
  for (const adapter of adapters) {
    const result = adapter.readConfig(adapter.resolveConfigFile(scope));
    if (result.kind === 'ok' && adapter.hasEntry(result.config)) {
      available.push(adapter.id);
    } else if (result.kind === 'invalid') {
      logger.warn(`${adapter.label} config is invalid; skipping. Fix it manually.`);
    }
  }
  if (available.length === 0) return [];
  const selected = await promptTargetSelect(available, { required: false, checked: available });
  return selected.map((id) => byId.get(id)!);
}
