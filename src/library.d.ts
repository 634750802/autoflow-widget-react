import type { FC, Ref } from 'react';

export interface ScriptConfig {
  src: string;
  apiBase: string | undefined;
  controlled: boolean;
  trigger: true | HTMLElement | null;
  chatEngine: string | undefined;
  measurementId: string | undefined;
}

export interface ReactBotRootProps {
  scriptConfig?: ScriptConfig;
  onNewChat?: (id: string) => void,
  ref?: Ref<{ open: boolean, newChat: (content: string) => void }>
}

export declare const ReactBotRoot: FC<ReactBotRootProps>;
