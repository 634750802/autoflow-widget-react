import { createContext } from 'react';
import type { BootstrapStatus, PublicWebsiteSettings } from '../utils/autoflow-types.ts';
import type { ScriptConfig } from '../utils/resolve-script-config.ts';

export const RootContext = createContext<{
  shadowRoot: ShadowRoot,
  scriptConfig: ScriptConfig,
  bootstrapStatus: BootstrapStatus,
  settings: PublicWebsiteSettings
}>(null as never);
