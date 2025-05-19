import { getBootstrapStatus, getPublicSiteSettings } from './api.ts';
import type { BootstrapStatus, PublicWebsiteSettings } from './autoflow-types.ts';
import type { ScriptConfig } from './resolve-script-config.ts';

let previous: ReturnType<typeof loadConfig> | undefined = undefined;

export function loadConfig (scriptConfig: ScriptConfig): Promise<{ settings: PublicWebsiteSettings, bootstrapStatus: BootstrapStatus }> {
  if (previous) {
    return previous;
  }

  return previous =
    Promise.all([
      getPublicSiteSettings(scriptConfig).catch(error => {
        console.error('Cannot initialize tidb.ai widget', error);
        return Promise.reject(error);
      }),
      getBootstrapStatus(scriptConfig).catch(error => {
        console.error('TiDB.ai service not bootstrapped', error);
        return Promise.reject(error);
      }),
    ]).then(([settings, bootstrapStatus]) => ({
      settings, bootstrapStatus,
    }));
}