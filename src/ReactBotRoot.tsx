import { type Ref, use, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Bot from './components/bot.tsx';
import { RootContext } from './components/root-provider.tsx';
import { AskStoreProvider } from './store/ask.ts';
import { InlineStyles } from './styles.inline.tsx';
import { loadConfig } from './utils/prepare.ts';
import { resolveScriptConfig, type ScriptConfig } from './utils/resolve-script-config.ts';

function ReactBotRoot ({
  scriptConfig: propScriptConfig,
  onNewChat,
  ref,
}: {
  scriptConfig?: ScriptConfig,
  onNewChat?: (id: string) => void,
  ref?: Ref<{ open: boolean, newChat: (content: string) => void }>
}) {
  const id = useId();
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot>();
  const scriptConfig = useRef<ScriptConfig>(null as any);
  const [configPromise, setConfigPromise] = useState<ReturnType<typeof loadConfig>>(null as any);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = `autoflow-widget:${id}`;
    root.dataset.autoflowWidget = 'true';
    document.body.appendChild(root);
    setShadowRoot(root.attachShadow({ mode: import.meta.env.MODE === 'test' ? 'open' : 'closed' }));
    scriptConfig.current = propScriptConfig ?? resolveScriptConfig(document);
    setConfigPromise(loadConfig(scriptConfig.current));

    return () => {
      document.body.removeChild(root);
    };
  }, [propScriptConfig]);

  if (shadowRoot) {
    const config = use(configPromise);
    return (
      <>
        {createPortal(
          <AskStoreProvider>
            <RootContext value={{ shadowRoot: shadowRoot, scriptConfig: scriptConfig.current, ...config }}>
              <InlineStyles />
              <Bot onNewChat={onNewChat} ref={ref} />
            </RootContext>
          </AskStoreProvider>,
          shadowRoot,
        )}
      </>
    );
  } else {
    return null;
  }
}

export default ReactBotRoot;
