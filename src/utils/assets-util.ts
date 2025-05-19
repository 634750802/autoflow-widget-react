import type { ScriptConfig } from './resolve-script-config.ts';

export function resolveAssetUrl (config: ScriptConfig, assetUrl: string) {
  return new URL(assetUrl, config.apiBase).toString();
}